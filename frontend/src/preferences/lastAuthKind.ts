import { isBrowserRuntime } from '@/platform/runtime';

// Remembers whether the last *live* session belonged to a real (Logto) account
// or an anonymous guest. By the time a 401 tells us the session expired, the
// session itself is already gone — so we record this while the session is alive
// and read it on expiry to decide how to recover: silently bootstrap a fresh
// guest session (anonymous), or prompt the user to sign in again (account).
// Losing this value just falls back to the silent-guest path, which is safe.
const LAST_AUTH_KIND_STORAGE_KEY = 'scvmrack-last-auth-kind-v1';

export type AuthKind = 'account' | 'anonymous';

export const getLastAuthKind = (): AuthKind | null => {
    if (!isBrowserRuntime()) {
        return null;
    }

    try {
        const value = localStorage.getItem(LAST_AUTH_KIND_STORAGE_KEY);
        return value === 'account' || value === 'anonymous' ? value : null;
    } catch {
        return null;
    }
};

export const setLastAuthKind = (kind: AuthKind): void => {
    if (!isBrowserRuntime()) {
        return;
    }

    try {
        localStorage.setItem(LAST_AUTH_KIND_STORAGE_KEY, kind);
    } catch {
        // Ignore storage errors; we fall back to the silent-guest recovery path.
    }
};

export const clearLastAuthKind = (): void => {
    if (!isBrowserRuntime()) {
        return;
    }

    try {
        localStorage.removeItem(LAST_AUTH_KIND_STORAGE_KEY);
    } catch {
        // Ignore storage errors.
    }
};
