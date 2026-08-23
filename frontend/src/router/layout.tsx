import { AnalyticsPageTracker } from '@/analytics/AnalyticsPageTracker';
import { AppFooter } from '@/components/molecules/AppFooter';
import { NetworkActivityIndicator } from '@/components/atoms/NetworkActivityIndicator';
import { CharacterSheetSkeleton } from '@/components/molecules/character/CharacterSheetSkeleton';
import Header from '@/components/organisms/Header';
import { PartyHost } from '@/components/organisms/party/PartyHost';
import { SessionExpiredGate } from '@components/molecules/session/SessionExpiredGate';
import { Outlet, useRouterState } from '@tanstack/react-router';
import { Box, Container, CssBaseline, ThemeProvider } from '@mui/material';
import { customStyles, morkBorgTheme } from '@/theme/morkBorgTheme';
import { lazy, Suspense, useEffect, useState } from 'react';
import { getPrivacySettings } from '@/privacy/privacySettings';
import { subscribeOpenPrivacyDrawer } from '@/privacy/privacyDrawerBus';
import { isPartyCharacterRoutePath, isSheetRoutePath } from '@/router/routeClassification';

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

export function RootLayout() {
    const pathname = useRouterState({
        select: (state) => state.location.pathname,
    });
    const isPrintRoute = pathname === '/print';
    const isJoinRoute = pathname.startsWith('/join/');
    const isPartyCharacterRoute = isPartyCharacterRoutePath(pathname);
    const isSheetRoute = isSheetRoutePath(pathname);

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
                            viewTransitionName: isPrintRoute ? 'none' : 'scvm-main',
                        }}
                    >
                        <Suspense fallback={isSheetRoute ? <CharacterSheetSkeleton /> : null}>
                            <Outlet />
                        </Suspense>
                    </Box>
                    {!isPrintRoute && <AppFooter />}
                </Container>
                {!isPrintRoute && (
                    <Box className="print-hidden">
                        <NetworkActivityIndicator />
                    </Box>
                )}
                {!isPrintRoute && !isJoinRoute && !isPartyCharacterRoute && <PartyHost />}
            </Box>
        </ThemeProvider>
    );
}
