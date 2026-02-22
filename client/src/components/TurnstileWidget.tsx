import { Box, Typography } from "@mui/material";
import { useEffect, useRef } from "react";

type TurnstileWidgetId = string | number;

interface TurnstileRenderOptions {
    sitekey: string;
    callback: (token: string) => void;
    "expired-callback": () => void;
    "error-callback": () => void;
    theme?: "light" | "dark" | "auto";
    size?: "normal" | "compact";
}

interface TurnstileApi {
    render: (container: string | HTMLElement, options: TurnstileRenderOptions) => TurnstileWidgetId;
    reset: (widgetId?: TurnstileWidgetId) => void;
    remove: (widgetId: TurnstileWidgetId) => void;
}

declare global {
    interface Window {
        turnstile?: TurnstileApi;
    }
}

const TURNSTILE_SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
let turnstileScriptPromise: Promise<void> | null = null;

function loadTurnstileScript(): Promise<void> {
    if (typeof window === "undefined") {
        return Promise.resolve();
    }

    if (window.turnstile) {
        return Promise.resolve();
    }

    if (!turnstileScriptPromise) {
        turnstileScriptPromise = new Promise((resolve, reject) => {
            const existing = document.querySelector<HTMLScriptElement>(`script[src="${TURNSTILE_SCRIPT_SRC}"]`);

            if (existing) {
                if (window.turnstile) {
                    resolve();
                    return;
                }
                existing.addEventListener("load", () => resolve(), { once: true });
                existing.addEventListener("error", () => reject(new Error("Failed to load Turnstile")), { once: true });
                return;
            }

            const script = document.createElement("script");
            script.src = TURNSTILE_SCRIPT_SRC;
            script.async = true;
            script.defer = true;
            script.onload = () => resolve();
            script.onerror = () => reject(new Error("Failed to load Turnstile"));
            document.head.appendChild(script);
        });
    }

    return turnstileScriptPromise;
}

interface TurnstileWidgetProps {
    siteKey: string;
    onTokenChange: (token: string | null) => void;
    resetSignal: number;
}

export function TurnstileWidget({ siteKey, onTokenChange, resetSignal }: TurnstileWidgetProps) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const widgetIdRef = useRef<TurnstileWidgetId | null>(null);

    useEffect(() => {
        let cancelled = false;

        loadTurnstileScript()
            .then(() => {
                if (cancelled || !containerRef.current || !window.turnstile) {
                    return;
                }

                widgetIdRef.current = window.turnstile.render(containerRef.current, {
                    sitekey: siteKey,
                    callback: (token: string) => onTokenChange(token),
                    "expired-callback": () => onTokenChange(null),
                    "error-callback": () => onTokenChange(null),
                    theme: "dark",
                    size: "normal",
                });
            })
            .catch(() => {
                onTokenChange(null);
            });

        return () => {
            cancelled = true;
            if (widgetIdRef.current !== null && window.turnstile) {
                window.turnstile.remove(widgetIdRef.current);
                widgetIdRef.current = null;
            }
        };
    }, [siteKey, onTokenChange]);

    useEffect(() => {
        if (widgetIdRef.current !== null && window.turnstile) {
            window.turnstile.reset(widgetIdRef.current);
            onTokenChange(null);
        }
    }, [resetSignal, onTokenChange]);

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
