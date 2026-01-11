import {Header} from "@/components";
import { Outlet } from '@tanstack/react-router';
import { Box, Container, CssBaseline, ThemeProvider } from '@mui/material';
import { customStyles, morkBorgTheme } from '@/theme/morkBorgTheme';

export function RootLayout() {
    return (
        <ThemeProvider theme={morkBorgTheme}>
            <CssBaseline />
            <Box sx={customStyles.layout.root}>
                <Container maxWidth="md">
                    <Header/>
                    <Outlet />
                </Container>
            </Box>
        </ThemeProvider>
    );
}
