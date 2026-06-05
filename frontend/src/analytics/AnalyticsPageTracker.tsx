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

type RouterLocation = {
    pathname?: string;
    searchStr?: string;
    hash?: string;
};

const toTrackedLocation = (location: RouterLocation) => {
    const pathname = location.pathname ?? '/';
    const search = location.searchStr || undefined;
    return {
        path: toPagePath(pathname, location.searchStr, location.hash),
        search,
    };
};

export function AnalyticsPageTracker() {
    const trackedLocation = useRouterState({
        select: (state) => toTrackedLocation(state.location),
    });

    const lastTrackedPathRef = useRef<string>('');

    useEffect(() => {
        const currentPath = trackedLocation.path;

        // React StrictMode runs effects twice in development.
        if (lastTrackedPathRef.current === currentPath) {
            return;
        }

        lastTrackedPathRef.current = currentPath;
        trackPageView({
            path: currentPath,
            title: getRuntimeDocumentTitle(),
            url: toAbsoluteUrl(currentPath),
            search: trackedLocation.search,
        });
    }, [trackedLocation.path, trackedLocation.search]);

    return null;
}
