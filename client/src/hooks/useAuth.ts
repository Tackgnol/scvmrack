import {authKeys} from "@/api";
import { trackEvent } from '@/analytics/googleAnalytics';
import { appHistory } from '@/router/history';
import {
    hasCurrentSearchParam,
    navigateToLoggedOut,
    SESSION_EXPIRED_QUERY_PARAM,
} from '@/router/navigation';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {anonymousClient, magicLinkClient} from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import { useSyncExternalStore } from 'react';

// ============================================
// Better Auth Client
//
// Session is managed via HTTP-only cookies:
// - Persists across page refreshes automatically
// - getSession() validates existing cookie
// - No localStorage needed for auth state
// ============================================
export const authClient = createAuthClient({
    baseURL: import.meta.env.VITE_BACKEND_URL || "",
    basePath: "/auth",
    plugins: [
        magicLinkClient(),
        anonymousClient(),
    ]
});

// ============================================
// Types
// ============================================
export interface AuthUser {
    id: string;
    name: string;
    email: string;
    emailVerified: boolean;
    isAnonymous?: boolean;
}

export interface SignInCredentials {
    email: string;
    password: string;
    rememberMe?: boolean;
    turnstileToken?: string;
    locale?: string;
    wasGuest?: boolean;
    hadGuestCharacter?: boolean;
}

export interface SignUpCredentials {
    email: string;
    password: string;
    name: string;
    turnstileToken?: string;
    callbackURL?: string;
    locale?: string;
    wasGuest?: boolean;
    hadGuestCharacter?: boolean;
}

export interface MagicLinkCredentials {
    email: string;
    turnstileToken?: string;
    callbackURL?: string;
    locale?: string;
    wasGuest?: boolean;
    hadGuestCharacter?: boolean;
}

const subscribeToHistory = (onStoreChange: () => void): (() => void) => {
    return appHistory.subscribe(() => onStoreChange());
};

const getSessionExpiredSnapshot = (): boolean => {
    return hasCurrentSearchParam(SESSION_EXPIRED_QUERY_PARAM);
};

// ============================================
// Auth Hook
// ============================================
export function useAuth() {
    const queryClient = useQueryClient();
    const isSessionExpired = useSyncExternalStore(
        subscribeToHistory,
        getSessionExpiredSnapshot,
        () => false
    );

    // Session query - validates cookie on load
    const sessionQuery = useQuery({
        queryKey: authKeys.session(),
        queryFn: async () => {
            const { data, error } = await authClient.getSession();
            if (error) throw error;
            return data;
        },
        staleTime: 1000 * 60 * 5,
        retry: false,
        refetchOnWindowFocus: false,
    });

    // Get decrypted user data from /me endpoint
    const meQuery = useQuery({
        queryKey: authKeys.me(),
        queryFn: async () => {
            const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/auth/me`, { credentials: "include" });
            if (!res.ok) return null;
            return res.json();
        },
        enabled: !isSessionExpired && !!sessionQuery.data,
        staleTime: 1000 * 60 * 5,
    });

    const sessionUser = sessionQuery.data?.user as (AuthUser & { isAnonymous?: boolean }) | undefined;
    const effectiveSessionUser = isSessionExpired ? undefined : sessionUser;
    const isAnonymousUser = Boolean(sessionUser?.isAnonymous);

    const anonymousBootstrapQuery = useQuery({
        queryKey: ['auth', 'anonymous-bootstrap'],
        enabled: !isSessionExpired && !sessionQuery.isLoading && !sessionUser,
        staleTime: Infinity,
        retry: false,
        refetchOnWindowFocus: false,
        queryFn: async () => {
            const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/auth/sign-in/anonymous`, {
                method: "POST",
                credentials: "include",
            });

            if (!res.ok) {
                throw new Error('Failed to bootstrap anonymous session');
            }

            await queryClient.invalidateQueries({ queryKey: authKeys.session() });
            await queryClient.invalidateQueries({ queryKey: authKeys.me() });
            return true;
        },
    });

    // Sign in
    const signIn = useMutation({
        mutationFn: async (creds: SignInCredentials) => {
            const payload: Record<string, unknown> = {
                email: creds.email,
                password: creds.password,
                rememberMe: creds.rememberMe ?? true,
            };

            if (creds.turnstileToken) {
                payload.turnstileToken = creds.turnstileToken;
            }

            const { data, error } = await authClient.signIn.email(payload as any);
            if (error) {
                if (error.status === 429 || (error as any).error?.status === 429) {
                    throw new Error('RATE_LIMIT_EXCEEDED');
                }
                const message = error.message || (error as any).error?.message || 'Login failed';
                throw new Error(message);
            }
            return data;
        },
        onSuccess: (_data, vars) => {
            trackEvent('login', {
                method: 'password',
                locale: vars.locale ?? 'unknown',
                used_turnstile: Boolean(vars.turnstileToken),
                was_guest: Boolean(vars.wasGuest),
                had_guest_character: Boolean(vars.hadGuestCharacter),
            });
            queryClient.invalidateQueries({ queryKey: authKeys.all });
        },
    });

    // Sign up
    const signUp = useMutation({
        mutationFn: async (creds: SignUpCredentials) => {
            const payload: Record<string, unknown> = {
                email: creds.email,
                password: creds.password,
                name: creds.name,
            };

            if (creds.turnstileToken) {
                payload.turnstileToken = creds.turnstileToken;
            }
            if (creds.callbackURL) {
                payload.callbackURL = creds.callbackURL;
            }

            const { data, error } = await authClient.signUp.email(payload as any);
            if (error) {
                if (error.status === 429 || (error as any).error?.status === 429) {
                    throw new Error('RATE_LIMIT_EXCEEDED');
                }
                const message = error.message || (error as any).error?.message || 'Sign up failed';
                throw new Error(message);
            }
            return data;
        },
        onSuccess: (_data, vars) => {
            trackEvent('sign_up', {
                method: 'email_password',
                locale: vars.locale ?? 'unknown',
                used_turnstile: Boolean(vars.turnstileToken),
                was_guest: Boolean(vars.wasGuest),
                had_guest_character: Boolean(vars.hadGuestCharacter),
            });
            queryClient.invalidateQueries({ queryKey: authKeys.all });
        },
    });

    // Sign out
    const signOut = useMutation({
        mutationFn: async () => {
            const { error } = await authClient.signOut();
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.setQueryData(authKeys.session(), null);
            queryClient.setQueryData(authKeys.me(), null);
            void navigateToLoggedOut();
        },
    });

    const forgotPassword = useMutation({
        mutationFn: async ({ email, turnstileToken }: { email: string; turnstileToken?: string }) => {
            const payload: Record<string, unknown> = {
                email,
                redirectTo: '/reset-password',
            };
            if (turnstileToken) {
                payload.turnstileToken = turnstileToken;
            }
            const res = await fetch(`${import.meta.env.VITE_BACKEND_URL || ''}/auth/request-password-reset`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(payload),
            });
            if (!res.ok) {
                if (res.status === 429) {
                    throw new Error('RATE_LIMIT_EXCEEDED');
                }
                const data = await res.json().catch(() => ({}));
                throw new Error(data.message || 'Request failed');
            }
        },
    });

    const resetPassword = useMutation({
        mutationFn: async ({ newPassword, token }: { newPassword: string; token: string }) => {
            const res = await fetch(`${import.meta.env.VITE_BACKEND_URL || ''}/auth/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ newPassword, token }),
            });
            if (!res.ok) {
                if (res.status === 429) {
                    throw new Error('RATE_LIMIT_EXCEEDED');
                }
                const data = await res.json().catch(() => ({}));
                throw new Error(data.message || 'Password reset failed');
            }
        },
    });

    const signInMagicLink = useMutation({
        mutationFn: async ({ email, turnstileToken, callbackURL }: MagicLinkCredentials) => {
            // We pass the email. The server interceptor in index.ts
            // will handle hashing it before Better Auth sees it.
            const payload: Record<string, unknown> = {
                email,
                callbackURL: callbackURL || "/", // Where to redirect after clicking link
            };

            if (turnstileToken) {
                payload.turnstileToken = turnstileToken;
            }

            const { data, error } = await authClient.signIn.magicLink(payload as any);

            if (error) {
                if (error.status === 429 || (error as any).error?.status === 429) {
                    throw new Error('RATE_LIMIT_EXCEEDED');
                }
                const message = error.message || (error as any).error?.message || 'Magic link failed';
                throw new Error(message);
            }
            return data;
        },
        onSuccess: (_data, vars) => {
            trackEvent('login_magic_link_requested', {
                method: 'magic_link',
                locale: vars.locale ?? 'unknown',
                used_turnstile: Boolean(vars.turnstileToken),
                was_guest: Boolean(vars.wasGuest),
                had_guest_character: Boolean(vars.hadGuestCharacter),
            });
        },
        // Note: We don't invalidate queries here because the user
        // isn't logged in until they click the link in their email.
    });

    return {
        user: (isSessionExpired ? null : (meQuery.data?.user ?? sessionUser)) as AuthUser | null,
        session: isSessionExpired ? null : sessionQuery.data,
        isAuthenticated: Boolean(effectiveSessionUser) && !isAnonymousUser,
        isGuest: !isSessionExpired && (isAnonymousUser || (!sessionUser && !sessionQuery.isLoading)),
        isLoading: sessionQuery.isLoading || anonymousBootstrapQuery.isFetching,
        isAnonymous: !isSessionExpired && isAnonymousUser,

        signIn,
        signUp,
        signOut,
        signInMagicLink,
        forgotPassword,
        resetPassword,
    };
}
