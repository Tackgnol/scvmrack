import { CharacterProvider } from "@/CharacterContext/CharacterContext";
import { SnackbarProvider } from "@/SnackbarContext/SnackbarProvider";
import { initializeAnalyticsConsent } from '@/analytics/googleAnalytics';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from '@tanstack/react-router';
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

initializeAnalyticsConsent();

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <SnackbarProvider>
            <QueryClientProvider client={queryClient}>
                <CharacterProvider>
                    <RouterProvider router={router} />
                </CharacterProvider>
            </QueryClientProvider>
        </SnackbarProvider>
    </React.StrictMode>
);
