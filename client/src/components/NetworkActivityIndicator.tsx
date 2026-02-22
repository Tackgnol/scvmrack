import { Box, Fade } from "@mui/material";
import { useIsFetching, useIsMutating } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { morkBorgColors } from "@/theme/morkBorgTheme";
import defaultIndicatorGif from "@/assets/skeleton.gif";

const REQUEST_INDICATOR_GIF = import.meta.env.VITE_REQUEST_INDICATOR_GIF || defaultIndicatorGif;

export function NetworkActivityIndicator() {
    const isFetching = useIsFetching();
    const isMutating = useIsMutating();
    const isBusy = isFetching + isMutating > 0;
    const [isVisible, setIsVisible] = useState(false);
    const [imageFailed, setImageFailed] = useState(false);

    useEffect(() => {
        let timer: number | undefined;

        if (isBusy) {
            timer = window.setTimeout(() => setIsVisible(true), 100);
        } else {
            setIsVisible(false);
        }

        return () => {
            if (timer !== undefined) {
                window.clearTimeout(timer);
            }
        };
    }, [isBusy]);

    return (
        <Fade in={isVisible} timeout={{ enter: 170, exit: 220 }} unmountOnExit>
            <Box
                aria-hidden
                sx={{
                    position: "fixed",
                    right: { xs: 10, sm: 14 },
                    bottom: { xs: 10, sm: 14 },
                    width: { xs: 90, sm: 142 },
                    height: { xs: 90, sm: 142 },
                    zIndex: 1300,
                    pointerEvents: "none",
                    opacity: 0.85,
                    transform: isVisible ? "translateY(0) scale(1)" : "translateY(8px) scale(0.9)",
                    transition: "transform 240ms cubic-bezier(0.22, 1, 0.36, 1)",
                    willChange: "transform, opacity",
                }}
            >
                {imageFailed ? (
                    <Box
                        sx={{
                            width: "100%",
                            height: "100%",
                            borderRadius: "50%",
                            backgroundColor: morkBorgColors.pink,
                            border: `2px solid ${morkBorgColors.yellow}`,
                            boxShadow: "0 0 0 1px #000",
                            "@keyframes requestPulse": {
                                "0%": { transform: "scale(0.8)", opacity: 0.5 },
                                "50%": { transform: "scale(1)", opacity: 1 },
                                "100%": { transform: "scale(0.8)", opacity: 0.5 },
                            },
                            animation: "requestPulse 1s ease-in-out infinite",
                        }}
                    />
                ) : (
                    <img
                        src={REQUEST_INDICATOR_GIF}
                        alt=""
                        width="100%"
                        height="100%"
                        onError={() => setImageFailed(true)}
                        style={{
                            display: "block",
                            objectFit: "contain",
                            filter: "drop-shadow(0 0 3px rgba(0,0,0,0.65))",
                        }}
                    />
                )}
            </Box>
        </Fade>
    );
}
