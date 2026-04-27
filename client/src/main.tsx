import './instrument';
import { CharacterProvider } from "@/CharacterContext/CharacterContext";
import { SnackbarProvider } from "@/SnackbarContext/SnackbarProvider";
import { initializeAnalyticsConsent } from '@/analytics/googleAnalytics';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from '@tanstack/react-router';
import * as Sentry from '@sentry/react';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { router } from './router';

import './styles/global.css';
import './i18n';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 1000 * 60 * 5, // 5 min
            retry: 1,
        },
    },
});

const RuntimeErrorFallback = React.lazy(() =>
    import('@/pages/NotFoundPage').then(m => ({ default: m.NotFoundPage }))
);

initializeAnalyticsConsent();

ReactDOM.createRoot(document.getElementById('root')!, {
    onUncaughtError: Sentry.reactErrorHandler(),
    onRecoverableError: Sentry.reactErrorHandler(),
}).render(
    <React.StrictMode>
        <Sentry.ErrorBoundary
            fallback={(
                <React.Suspense fallback={null}>
                    <RuntimeErrorFallback
                        homeLinkMode="anchor"
                        heading="500"
                        stamp="Runtime Error"
                        tagline="The sheet tore. We have the blood trail."
                        seoTitle="Runtime error"
                        seoDescription="The app hit an unexpected error."
                        seoPath="/error"
                        seoNoIndex
                    />
                </React.Suspense>
            )}
        >
            <SnackbarProvider>
                <QueryClientProvider client={queryClient}>
                    <CharacterProvider>
                        <RouterProvider router={router} />
                    </CharacterProvider>
                </QueryClientProvider>
            </SnackbarProvider>
        </Sentry.ErrorBoundary>
    </React.StrictMode>
);
