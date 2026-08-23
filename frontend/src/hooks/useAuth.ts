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
import { synchronizeOwnershipScope } from '@/auth/ownershipScope';
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

// Read the invite-route flag from appHistory, the SAME source the rest of the
// app (auto-create gate, route components) reacts to — NOT window.location.
// On an SPA hop appHistory.location updates immediately while window.location
// lags a tick (TanStack flushes pushState later). Reading window.location here
// left useAuth thinking we were still on /join during /join -> /character/new,
// which suppressed the anonymous bootstrap and let guest auto-create fire
// against a session that did not exist yet.
const getInviteRouteSnapshot = (): boolean =>
    (appHistory.location?.pathname ?? '/').startsWith('/join/');

type UseAuthOptions = {
    bootstrapAnonymous?: boolean;
    fetchSession?: boolean;
};

// ============================================
// Auth Hook
// ============================================
export function useAuth(options: UseAuthOptions = {}) {
    const { bootstrapAnonymous = true, fetchSession: fetchSessionEnabled = true } = options;
    const queryClient = useQueryClient();
    const isInviteRoute = useSyncExternalStore(
        subscribeToHistory,
        getInviteRouteSnapshot,
        () => false
    );
    const shouldBootstrapAnonymous = bootstrapAnonymous && !isInviteRoute;
    const isSessionExpired = useSyncExternalStore(
        subscribeToHistory,
        getSessionExpiredSnapshot,
        () => false
    );

    // Session query - validates cookie on load
    const sessionQuery = useQuery({
        queryKey: authKeys.session(),
        queryFn: fetchSession,
        enabled: fetchSessionEnabled,
        staleTime: 1000 * 60 * 5,
        retry: false,
        refetchOnWindowFocus: false,
    });

    const sessionData = sessionQuery.data as AuthSession | null | undefined;
    const sessionUser = sessionData?.user as (AuthSessionUser & AuthUser) | undefined;
    const effectiveSessionUser = isSessionExpired ? undefined : sessionUser;
    const isAnonymousUser = Boolean(sessionUser?.isAnonymous);

    useEffect(() => {
        synchronizeOwnershipScope(queryClient, sessionUser?.id ?? null);
    }, [queryClient, sessionUser?.id]);

    // Record the kind of the live session so the session-expired recovery can
    // tell a real account (prompt to sign in) apart from a guest (silently
    // re-bootstrap) after the session — and thus this signal — is gone.
    useEffect(() => {
        if (sessionUser?.id) {
            setLastAuthKind(isAnonymousUser ? 'anonymous' : 'account');
        }
    }, [sessionUser?.id, isAnonymousUser]);

    // We know we must mint an anonymous session: bootstrap is allowed, the
    // session query has settled, and it found no user. This is the `enabled`
    // condition for the bootstrap query, lifted out so the loading state can
    // also depend on it (see `isLoading` below).
    const anonymousBootstrapEnabled =
        shouldBootstrapAnonymous &&
        !isSessionExpired &&
        fetchSessionEnabled &&
        !sessionQuery.isLoading &&
        !sessionUser;

    const anonymousBootstrapQuery = useQuery({
        queryKey: ['auth', 'anonymous-bootstrap'],
        enabled: anonymousBootstrapEnabled,
        staleTime: Infinity,
        retry: false,
        refetchOnWindowFocus: false,
        queryFn: async () => {
            await signInAnonymous();
            const createdSession = await fetchSession();
            if (!createdSession?.user) {
                throw new Error('Anonymous session did not start');
            }
            queryClient.setQueryData(authKeys.session(), createdSession);
            return createdSession;
        },
    });

    // Treat the window from "we know we must bootstrap" until the sign-in
    // request resolves as loading — not just while it is in flight. On SPA
    // navigation the session query is often already cached as null (not
    // loading), so there is a render where neither query reports loading but no
    // anonymous cookie exists yet. Without this, first-run flows (guest
    // auto-create, party-join redemption) fire against a not-yet-minted session,
    // race the bootstrap, and stall on an endless spinner. Gated on the
    // request's own outcome (`data`/`isError`) so a sign-in that resolves
    // without producing a user can never hang loading forever.
    const isBootstrappingAnonymous =
        anonymousBootstrapEnabled &&
        !anonymousBootstrapQuery.data &&
        !anonymousBootstrapQuery.isError;

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
        isLoading:
            sessionQuery.isLoading ||
            anonymousBootstrapQuery.isFetching ||
            isBootstrappingAnonymous,
        isAnonymous: !isSessionExpired && isAnonymousUser,

        signOut,
    };
}
