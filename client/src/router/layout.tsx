import { AnalyticsPageTracker } from '@/analytics/AnalyticsPageTracker';
import { PrivacyNoticeDrawer } from '@/components/PrivacyNoticeDrawer';
import { NetworkActivityIndicator } from '@/components/NetworkActivityIndicator';
import {Header} from "@/components";
import { Outlet, useRouterState } from '@tanstack/react-router';
import { Box, Container, CssBaseline, ThemeProvider } from '@mui/material';
import { customStyles, morkBorgTheme } from '@/theme/morkBorgTheme';
import { keyframes } from '@mui/system';

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

    return (
        <ThemeProvider theme={morkBorgTheme}>
            <AnalyticsPageTracker />
            <PrivacyNoticeDrawer />
            <CssBaseline />
            <Box sx={customStyles.layout.root}>
                <Container maxWidth="md">
                    <Header/>
                    <Box
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
                <NetworkActivityIndicator />
            </Box>
        </ThemeProvider>
    );
}
