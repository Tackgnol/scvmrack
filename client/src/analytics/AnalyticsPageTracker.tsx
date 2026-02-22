import { useRouterState } from '@tanstack/react-router';
import { useEffect, useRef } from 'react';
import { getRuntimeDocumentTitle, getRuntimeOrigin } from '@/platform/runtime';
import { trackPageView } from '@/analytics/googleAnalytics';

const toPagePath = (pathname: string, search?: string, hash?: string): string => {
    return `${pathname}${search ?? ''}${hash ?? ''}`;
};

const toAbsoluteUrl = (path: string): string | undefined => {
    const origin = getRuntimeOrigin();
    if (!origin) {
        return undefined;
    }

    return new URL(path, origin).href;
};

export function AnalyticsPageTracker() {
    const location = useRouterState({
        select: (state) => state.location,
    });

    const lastTrackedPathRef = useRef<string>('');

    useEffect(() => {
        const currentPath = toPagePath(location.pathname, location.searchStr, location.hash);

        // React StrictMode runs effects twice in development.
        if (lastTrackedPathRef.current === currentPath) {
            return;
        }

        lastTrackedPathRef.current = currentPath;
        trackPageView({
            path: currentPath,
            title: getRuntimeDocumentTitle(),
            url: toAbsoluteUrl(currentPath),
            search: location.searchStr || undefined,
        });
    }, [location.hash, location.pathname, location.searchStr]);

    return null;
}
