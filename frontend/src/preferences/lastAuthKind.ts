import { isBrowserRuntime } from '@/platform/runtime';

// Remembers whether the last *live* session belonged to a real (Logto) account
// or an anonymous guest. By the time a 401 tells us the session expired, the
// session itself is already gone — so we record this while the session is alive
// and read it on expiry to decide how to recover: silently bootstrap a fresh
// guest session (anonymous), or prompt the user to sign in again (account).
// Keep the live kind in memory when storage fails. With no observed kind,
// expiry returns to public browsing instead of assuming a guest owner existed.
const LAST_AUTH_KIND_STORAGE_KEY = 'scvmrack-last-auth-kind-v1';

export type AuthKind = 'account' | 'anonymous';

let observedAuthKind: AuthKind | null | undefined;

export const getLastAuthKind = (): AuthKind | null => {
    if (!isBrowserRuntime()) {
        return null;
    }
    if (observedAuthKind !== undefined) {
        return observedAuthKind;
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
    observedAuthKind = kind;

    try {
        localStorage.setItem(LAST_AUTH_KIND_STORAGE_KEY, kind);
    } catch {
        // The live kind remains available in this document.
    }
};

export const clearLastAuthKind = (): void => {
    if (!isBrowserRuntime()) {
        return;
    }
    observedAuthKind = null;

    try {
        localStorage.removeItem(LAST_AUTH_KIND_STORAGE_KEY);
    } catch {
        // Ignore storage errors.
    }
};
