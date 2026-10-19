import * as Sentry from '@sentry/react';
import { authHeaders, setTabSession } from '@/utils/tabSession';
import { embeddedSessionHeaders } from '@/utils/embed';

export interface AuthSessionUser {
  id: string;
  name?: string | null;
  email?: string | null;
  emailVerified?: boolean;
  isAnonymous?: boolean | null;
}

export interface AuthSession {
  session: unknown;
  user: AuthSessionUser;
}

const apiBaseUrl = () => import.meta.env.VITE_BACKEND_URL || '';

export class SessionReadError extends Error {
  constructor(public httpStatus: number) {
    super('Failed to fetch auth session');
  }
}

export class AnonymousSessionUnavailableError extends Error {
  readonly code = 'ANONYMOUS_SESSION_UNAVAILABLE';

  constructor() {
    super('Anonymous session did not start');
    this.name = 'AnonymousSessionUnavailableError';
  }
}

class SessionVerificationError extends Error {
  readonly code = 'AUTH_SESSION_VERIFICATION_FAILED';

  constructor(readonly cause: unknown) {
    super('Could not verify anonymous session');
  }
}

// Shared-auth intentionally excludes /api/auth/* from CSRF checks; these calls
// bypass the OpenAPI client so anonymous bootstrap and logout can run before a
// normal API session exists.
export async function fetchSession(): Promise<AuthSession | null> {
  const res = await fetch(`${apiBaseUrl()}/api/auth/get-session`, {
    credentials: 'include',
    cache: 'no-store',
    headers: { ...embeddedSessionHeaders(), ...authHeaders() },
  });

  if (res.status === 401 || res.status === 204) {
    return null;
  }

  if (!res.ok) {
    throw new SessionReadError(res.status);
  }

  const data = (await res.json()) as AuthSession | null;
  return data?.user ? data : null;
}

export class AnonymousSignInError extends Error {
  // Deliberately not `status`: errorUtils treats a `.status` below 500 as an
  // expected API error and would drop a genuine final failure from GlitchTip.
  httpStatus: number;

  constructor(httpStatus: number) {
    super('Failed to bootstrap anonymous session');
    this.httpStatus = httpStatus;
  }
}

export async function signInAnonymous(): Promise<string | null> {
  const res = await fetch(`${apiBaseUrl()}/api/auth/sign-in/anonymous`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'content-type': 'application/json',
      ...embeddedSessionHeaders(),
    },
    body: '{}',
  });

  if (!res.ok) {
    throw new AnonymousSignInError(res.status);
  }
  return res.headers.get('set-auth-token');
}

const RETRY_DELAYS_MS = [400, 1200];
const sleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

// A 429 is not retried: it would only spend more of the limit that tripped it.
function isRetryableSignInError(error: unknown): boolean {
  if (error instanceof AnonymousSignInError) {
    return error.httpStatus >= 500;
  }
  return true; // fetch itself rejected: network failure
}

// The user got a session, but only after the first attempt failed. Logged at
// warning level so we can measure how often the old code showed an error here.
function reportRecovered(
  kind: 'existing-session' | 'retried' | 'delayed-session',
  firstFailure: unknown,
  attempts: number,
): void {
  const signInStatus =
    firstFailure instanceof AnonymousSignInError
      ? firstFailure.httpStatus
      : firstFailure
        ? 'network'
        : 'ok';
  Sentry.captureMessage('Anonymous bootstrap recovered', {
    level: 'warning',
    fingerprint: ['anonymous-bootstrap-recovered', kind, String(signInStatus)],
    tags: { source: 'auth', anonymous_bootstrap: kind },
    extra: { signInStatus, attempts },
  });
}

// Mint an anonymous session and return the live one, tolerating the failures
// seen from mobile browsers: sign-in 400 (this browser already holds an
// anonymous session that get-session missed), 5xx/network blips, and a session
// cookie that is not readable on the very next get-session.
async function startAnonymousSession(): Promise<AuthSession> {
  let firstFailure: unknown;
  let attempts = 0;
  let token: string | null = null;
  let sessionReadFailure: unknown;
  const readSession = async (): Promise<AuthSession | null> => {
    try {
      return await fetchSession();
    } catch (error) {
      if (error instanceof SessionReadError && error.httpStatus === 429) {
        throw error;
      }
      sessionReadFailure ??= error;
      return null;
    }
  };

  for (;;) {
    try {
      token = await signInAnonymous();
    } catch (error) {
      firstFailure ??= error;
      const existing = await readSession();
      if (existing) {
        reportRecovered('existing-session', firstFailure, attempts);
        return existing;
      }
      if (!isRetryableSignInError(error) || attempts >= RETRY_DELAYS_MS.length) {
        throw error;
      }
      await sleep(RETRY_DELAYS_MS[attempts++]);
      continue;
    }

    // Sign-in minted a session. Poll get-session only: repeating sign-in
    // would mint orphan anonymous users.
    for (let poll = 0; ; poll++) {
      const created = await readSession();
      if (created) {
        if (firstFailure || poll > 0) {
          reportRecovered(
            firstFailure ? 'retried' : 'delayed-session',
            firstFailure,
            attempts + poll,
          );
        }
        return created;
      }
      if (poll >= RETRY_DELAYS_MS.length) {
        if (token && setTabSession(token)) {
          const session = await readSession();
          if (session) {
            Sentry.captureMessage('Anonymous session fell back to tab-only token', {
              level: 'warning',
              fingerprint: ['anonymous-bootstrap-tab-session'],
              tags: { source: 'auth', anonymous_bootstrap: 'tab-session' },
            });
            return session;
          }
          setTabSession(null);
        }
        if (sessionReadFailure) {
          throw new SessionVerificationError(sessionReadFailure);
        }
        throw new AnonymousSessionUnavailableError();
      }
      await sleep(RETRY_DELAYS_MS[poll]);
    }
  }
}

let pendingBootstrap: Promise<AuthSession> | null = null;

/** Share concurrent creation requests without retaining a previous owner's session. */
export function bootstrapAnonymousSession(): Promise<AuthSession> {
  pendingBootstrap ??= startAnonymousSession().finally(() => {
    pendingBootstrap = null;
  });
  return pendingBootstrap;
}

// Guarantee an active session before a state-changing flow runs (party join,
// guest character creation). Returns the live session. Imperative on purpose:
// callers await this instead of racing the background bootstrap query — the
// whole point of the join flow's KISS rewrite.
export async function ensureAnonymousSession(): Promise<AuthSession> {
  const existing = await fetchSession();
  if (existing?.user) {
    return existing;
  }

  return bootstrapAnonymousSession();
}

export async function signOut(): Promise<void> {
  const res = await fetch(`${apiBaseUrl()}/api/auth/sign-out`, {
    method: 'POST',
    credentials: 'include',
    headers: { ...embeddedSessionHeaders(), ...authHeaders() },
  });

  if (!res.ok) {
    throw new Error('Failed to sign out');
  }
  setTabSession(null);
}

export function loginUrl(returnTo?: string): string {
  const url = `${apiBaseUrl()}/api/auth/oauth2/login/logto`;
  return returnTo ? `${url}?returnTo=${encodeURIComponent(returnTo)}` : url;
}

export function profileUrl(): string {
  const endpoint = import.meta.env.VITE_LOGTO_ENDPOINT ?? 'https://auth.rpgtools.co';
  return `${endpoint.replace(/\/+$/, '')}/account/security`;
}
