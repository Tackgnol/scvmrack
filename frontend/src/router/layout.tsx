import { AnalyticsPageTracker } from '@/analytics/AnalyticsPageTracker';
import { NetworkActivityIndicator } from '@/components/atoms/NetworkActivityIndicator';
import Header from '@/components/organisms/Header';
import { SessionExpiredGate } from '@components/molecules/session/SessionExpiredGate';
import { Outlet, useRouterState } from '@tanstack/react-router';
import { Box, Container, CssBaseline, ThemeProvider } from '@mui/material';
import { customStyles, morkBorgTheme } from '@/theme/morkBorgTheme';
import { keyframes } from '@mui/system';
import { lazy, Suspense, useEffect, useState } from 'react';
import { getPrivacySettings } from '@/privacy/privacySettings';
import { subscribeOpenPrivacyDrawer } from '@/privacy/privacyDrawerBus';

const PrivacyNoticeDrawer = lazy(() =>
    import('@/components/organisms/PrivacyNoticeDrawer').then((m) => ({
        default: m.PrivacyNoticeDrawer,
    }))
);

function PrivacyNoticeHost() {
    const [loadReason, setLoadReason] = useState<'initial' | 'request' | null>(() =>
        getPrivacySettings().acknowledged ? null : 'initial'
    );

    useEffect(() => {
        return subscribeOpenPrivacyDrawer(() => setLoadReason('request'));
    }, []);

    if (!loadReason) {
        return null;
    }

    return (
        <Suspense fallback={null}>
            <PrivacyNoticeDrawer openOnMount={loadReason === 'request'} />
        </Suspense>
    );
}

const routeFadeIn = keyframes`
    from {
        opacity: 0.6;
        transform: translateY(4px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
`;

export function RootLayout() {
    const pathname = useRouterState({
        select: (state) => state.location.pathname,
    });
    const isPrintRoute = pathname === '/print';

    return (
        <ThemeProvider theme={morkBorgTheme}>
            <AnalyticsPageTracker />
            {!isPrintRoute && <SessionExpiredGate />}
            {!isPrintRoute && <PrivacyNoticeHost />}
            <CssBaseline />
            <Box
                className={isPrintRoute ? 'print-layout-root' : undefined}
                sx={customStyles.layout.root}
            >
                <Container maxWidth={isPrintRoute ? false : 'md'} disableGutters={isPrintRoute}>
                    {!isPrintRoute && (
                        <Box className="print-hidden">
                            <Header />
                        </Box>
                    )}
                    <Box
                        component="main"
                        id="main-content"
                        key={pathname}
                        sx={{
                            // Reserve vertical space so the layout doesn't collapse
                            // (and snap back) during the brief empty frame on route swap.
                            minHeight: isPrintRoute ? undefined : '70vh',
                            animation: `${routeFadeIn} 200ms cubic-bezier(0.22, 1, 0.36, 1)`,
                            '@media (prefers-reduced-motion: reduce)': {
                                animation: 'none',
                            },
                        }}
                    >
                        <Outlet />
                    </Box>
                </Container>
                {!isPrintRoute && (
                    <Box className="print-hidden">
                        <NetworkActivityIndicator />
                    </Box>
                )}
            </Box>
        </ThemeProvider>
    );
}
