import { AnalyticsPageTracker } from '@/analytics/AnalyticsPageTracker';
import { Header, NetworkActivityIndicator } from '@components/index';
import { Outlet, useRouterState } from '@tanstack/react-router';
import { Box, Container, CssBaseline, ThemeProvider } from '@mui/material';
import { customStyles, morkBorgTheme } from '@/theme/morkBorgTheme';
import { keyframes } from '@mui/system';
import { lazy, Suspense } from 'react';

const PrivacyNoticeDrawer = lazy(() => import('@components/index').then(m => ({ default: m.PrivacyNoticeDrawer })));

const routeFadeIn = keyframes`
    from {
        opacity: 0;
        transform: translateY(6px);
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
            {!isPrintRoute && (
                <Suspense fallback={null}>
                    <PrivacyNoticeDrawer />
                </Suspense>
            )}
            <CssBaseline />
            <Box sx={customStyles.layout.root}>
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
                            animation: `${routeFadeIn} 400ms cubic-bezier(0.22, 1, 0.36, 1)`,
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
