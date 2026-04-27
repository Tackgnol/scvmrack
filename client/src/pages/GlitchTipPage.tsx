import * as Sentry from '@sentry/react';
import { Link } from '@tanstack/react-router';
import { Box, Button, Typography } from '@mui/material';
import { useState } from 'react';
import { Seo } from '@/seo/Seo';
import { morkBorgColors } from '@/theme/morkBorgTheme';

const isGlitchTipEnabled = Boolean(import.meta.env.VITE_GLITCHTIP_DSN) && !import.meta.env.DEV;

export function GlitchTipPage() {
    const [eventId, setEventId] = useState<string | null>(null);

    const captureTestMessage = () => {
        setEventId(Sentry.captureMessage('Test message from Scvm Rack frontend'));
    };

    const throwTestError = () => {
        throw new Error('Test GlitchTip error from Scvm Rack frontend');
    };

    return (
        <>
            <Seo
                title="GlitchTip Verification"
                description="GlitchTip verification route for Scvm Rack frontend monitoring."
                path="/glitchtip"
                noIndex
            />
            <Box
                sx={{
                    bgcolor: morkBorgColors.black,
                    border: `3px solid ${morkBorgColors.yellow}`,
                    boxShadow: `6px 6px 0 ${morkBorgColors.pink}`,
                    color: morkBorgColors.white,
                    display: 'grid',
                    gap: 2,
                    mt: 3,
                    mx: { xs: 2, sm: 0 },
                    p: { xs: 2, sm: 3 },
                }}
            >
                <Typography
                    variant="h4"
                    sx={{
                        color: morkBorgColors.yellow,
                        fontFamily: "'Bebas Neue', sans-serif",
                    }}
                >
                    GlitchTip Verification
                </Typography>
                <Typography sx={{ color: morkBorgColors.white }}>
                    Frontend reporting is {isGlitchTipEnabled ? 'enabled' : 'disabled'} for this build.
                </Typography>
                {eventId && (
                    <Typography sx={{ color: morkBorgColors.yellow, wordBreak: 'break-word' }}>
                        Event sent: {eventId}
                    </Typography>
                )}
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                    <Button
                        onClick={captureTestMessage}
                        variant="contained"
                        disabled={!isGlitchTipEnabled}
                    >
                        Send message
                    </Button>
                    <Button
                        onClick={throwTestError}
                        variant="outlined"
                        color="error"
                        disabled={!isGlitchTipEnabled}
                    >
                        Throw error
                    </Button>
                    <Button component={Link} to="/" variant="outlined">
                        Back
                    </Button>
                </Box>
            </Box>
        </>
    );
}
