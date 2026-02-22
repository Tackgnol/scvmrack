import { Box, Typography } from "@mui/material";
import { useTurnstileWidget } from '@/hooks/useTurnstileWidget';

interface TurnstileWidgetProps {
    siteKey: string;
    onTokenChange: (token: string | null) => void;
    resetSignal: number;
}

export function TurnstileWidget({ siteKey, onTokenChange, resetSignal }: TurnstileWidgetProps) {
    const { containerRef } = useTurnstileWidget({
        siteKey,
        onTokenChange,
        resetSignal,
        theme: 'dark',
        size: 'normal',
    });

    return (
        <Box
            sx={{
                mt: 2,
                mb: 2,
                px: 1.5,
                py: 1.25,
                border: "1px solid rgba(255, 233, 0, 0.45)",
                background: "linear-gradient(180deg, rgba(26,26,26,0.95) 0%, rgba(10,10,10,0.95) 100%)",
                boxShadow: "inset 0 0 0 1px rgba(255, 62, 181, 0.2)",
                borderRadius: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 1,
            }}
        >
            <Box ref={containerRef} sx={{ minHeight: 65 }} />
            <Typography
                variant="caption"
                sx={{ textAlign: "center", opacity: 0.85, color: "#ffe900", letterSpacing: "0.03em" }}
            >
                Protected by Cloudflare Turnstile
            </Typography>
        </Box>
    );
}
