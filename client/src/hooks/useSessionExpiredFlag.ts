import { useCallback } from 'react';
import { useRouterState } from '@tanstack/react-router';
import { clearCurrentSearchParam, SESSION_EXPIRED_QUERY_PARAM } from '@/router/navigation';

export function useSessionExpiredFlag() {
    const isSessionExpired = useRouterState({
        select: (state) =>
            new URLSearchParams(state.location.searchStr).has(SESSION_EXPIRED_QUERY_PARAM),
    });

    const clearSessionExpiredFlag = useCallback(async () => {
        await clearCurrentSearchParam(SESSION_EXPIRED_QUERY_PARAM);
    }, []);

    return {
        isSessionExpired,
        clearSessionExpiredFlag,
    };
}
