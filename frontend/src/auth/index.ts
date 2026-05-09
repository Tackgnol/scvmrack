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
  });

  if (!res.ok) {
    throw new Error('Failed to bootstrap anonymous session');
  }
}

export async function signOut(): Promise<void> {
  const res = await fetch(`${apiBaseUrl()}/api/auth/sign-out`, {
    method: 'POST',
    credentials: 'include',
  });

  if (!res.ok) {
    throw new Error('Failed to sign out');
  }
}

export function loginUrl(): string {
  return `${apiBaseUrl()}/api/auth/oauth2/login/logto`;
}

export function profileUrl(): string {
  const endpoint = import.meta.env.VITE_LOGTO_ENDPOINT ?? 'https://auth.rpgtools.eu.org';
  return `${endpoint.replace(/\/+$/, '')}/account/security`;
}
