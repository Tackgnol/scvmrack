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

// Shared-auth intentionally excludes /api/auth/* from CSRF checks; these calls
// bypass the OpenAPI client so anonymous bootstrap and logout can run before a
// normal API session exists.
export async function fetchSession(): Promise<AuthSession | null> {
  const res = await fetch(`${apiBaseUrl()}/api/auth/get-session`, {
    credentials: 'include',
    headers: embeddedSessionHeaders(),
  });

  if (res.status === 401 || res.status === 204) {
    return null;
  }

  if (!res.ok) {
    throw new Error('Failed to fetch auth session');
  }

  const data = (await res.json()) as AuthSession | null;
  return data?.user ? data : null;
}

export async function signInAnonymous(): Promise<void> {
  const res = await fetch(`${apiBaseUrl()}/api/auth/sign-in/anonymous`, {
    method: 'POST',
    credentials: 'include',
    headers: embeddedSessionHeaders(),
  });

  if (!res.ok) {
    throw new Error('Failed to bootstrap anonymous session');
  }
}

// Owlbear Rodeo popup sign-in bridge. The popup (first-party, authenticated)
// mints a one-time token; the iframe redeems it to adopt that identity into its
// partition. Like the calls above, these are /api/auth/* endpoints and so
// bypass the OpenAPI client.
export async function issueObrExchangeToken(): Promise<string> {
  const res = await fetch(`${apiBaseUrl()}/api/auth/obr-exchange/issue`, {
    method: 'POST',
    credentials: 'include',
    headers: embeddedSessionHeaders(),
  });

  if (!res.ok) {
    throw new Error('Failed to issue OBR exchange token');
  }

  const { token } = (await res.json()) as { token?: string };
  if (!token) {
    throw new Error('OBR exchange issue returned no token');
  }
  return token;
}

export async function redeemObrExchangeToken(token: string): Promise<void> {
  const res = await fetch(`${apiBaseUrl()}/api/auth/obr-exchange/redeem`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...embeddedSessionHeaders() },
    body: JSON.stringify({ token }),
  });

  if (!res.ok) {
    throw new Error('Failed to redeem OBR exchange token');
  }
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

  await signInAnonymous();
  const created = await fetchSession();
  if (!created?.user) {
    throw new Error('Anonymous session did not start');
  }
  return created;
}

export async function signOut(): Promise<void> {
  const res = await fetch(`${apiBaseUrl()}/api/auth/sign-out`, {
    method: 'POST',
    credentials: 'include',
    headers: embeddedSessionHeaders(),
  });

  if (!res.ok) {
    throw new Error('Failed to sign out');
  }
}

export function loginUrl(): string {
  return `${apiBaseUrl()}/api/auth/oauth2/login/logto`;
}

export function profileUrl(): string {
  const endpoint = import.meta.env.VITE_LOGTO_ENDPOINT ?? 'https://auth.rpgtools.co';
  return `${endpoint.replace(/\/+$/, '')}/account/security`;
}
