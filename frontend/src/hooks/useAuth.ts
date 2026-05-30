import { authKeys } from "@/api";
import {
    fetchSession,
    signInAnonymous,
    signOut as signOutRequest,
    type AuthSession,
    type AuthSessionUser,
} from '@/auth';
import { trackEvent } from '@/analytics/googleAnalytics';
import { appHistory } from '@/router/history';
import {
    hasCurrentSearchParam,
    navigateToLoggedOut,
    SESSION_EXPIRED_QUERY_PARAM,
} from '@/router/navigation';
import { clearLastAuthKind, setLastAuthKind } from '@/preferences/lastAuthKind';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useSyncExternalStore } from 'react';

// ============================================
// Types
// ============================================
export interface AuthUser {
    id: string;
    name?: string | null;
    email?: string | null;
    emailVerified?: boolean;
    isAnonymous?: boolean | null;
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
        queryFn: fetchSession,
        staleTime: 1000 * 60 * 5,
        retry: false,
        refetchOnWindowFocus: false,
    });

    const sessionData = sessionQuery.data as AuthSession | null | undefined;
    const sessionUser = sessionData?.user as (AuthSessionUser & AuthUser) | undefined;
    const effectiveSessionUser = isSessionExpired ? undefined : sessionUser;
    const isAnonymousUser = Boolean(sessionUser?.isAnonymous);

    // Record the kind of the live session so the session-expired recovery can
    // tell a real account (prompt to sign in) apart from a guest (silently
    // re-bootstrap) after the session — and thus this signal — is gone.
    useEffect(() => {
        if (sessionUser?.id) {
            setLastAuthKind(isAnonymousUser ? 'anonymous' : 'account');
        }
    }, [sessionUser?.id, isAnonymousUser]);

    const anonymousBootstrapQuery = useQuery({
        queryKey: ['auth', 'anonymous-bootstrap'],
        enabled: !isSessionExpired && !sessionQuery.isLoading && !sessionUser,
        staleTime: Infinity,
        retry: false,
        refetchOnWindowFocus: false,
        queryFn: async () => {
            await signInAnonymous();
            await queryClient.invalidateQueries({ queryKey: authKeys.session() });
            return true;
        },
    });

    // Sign out
    const signOut = useMutation({
        mutationFn: async () => {
            await signOutRequest();
        },
        onSuccess: () => {
            trackEvent('sign_out');
            clearLastAuthKind();
            queryClient.setQueryData(authKeys.session(), null);
            void navigateToLoggedOut();
        },
    });

    return {
        user: (isSessionExpired ? null : sessionUser) as AuthUser | null,
        session: isSessionExpired ? null : sessionData,
        isAuthenticated: Boolean(effectiveSessionUser) && !isAnonymousUser,
        isGuest: !isSessionExpired && (isAnonymousUser || (!sessionUser && !sessionQuery.isLoading)),
        isLoading: sessionQuery.isLoading || anonymousBootstrapQuery.isFetching,
        isAnonymous: !isSessionExpired && isAnonymousUser,

        signOut,
    };
}
