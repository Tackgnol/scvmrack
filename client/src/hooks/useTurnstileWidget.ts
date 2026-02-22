import { useEffect, useRef } from 'react';
import { isBrowserRuntime } from '@/platform/runtime';

type TurnstileWidgetId = string | number;

interface TurnstileRenderOptions {
    sitekey: string;
    callback: (token: string) => void;
    'expired-callback': () => void;
    'error-callback': () => void;
    theme?: 'light' | 'dark' | 'auto';
    size?: 'normal' | 'compact';
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

const TURNSTILE_SCRIPT_SRC =
    'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

let turnstileScriptPromise: Promise<void> | null = null;

function loadTurnstileScript(): Promise<void> {
    if (!isBrowserRuntime()) {
        return Promise.resolve();
    }

    if (window.turnstile) {
        return Promise.resolve();
    }

    if (!turnstileScriptPromise) {
        turnstileScriptPromise = new Promise((resolve, reject) => {
            const existing = document.querySelector<HTMLScriptElement>(
                `script[src="${TURNSTILE_SCRIPT_SRC}"]`
            );

            if (existing) {
                if (window.turnstile) {
                    resolve();
                    return;
                }

                existing.addEventListener('load', () => resolve(), { once: true });
                existing.addEventListener(
                    'error',
                    () => reject(new Error('Failed to load Turnstile')),
                    { once: true }
                );
                return;
            }

            const script = document.createElement('script');
            script.src = TURNSTILE_SCRIPT_SRC;
            script.async = true;
            script.defer = true;
            script.onload = () => resolve();
            script.onerror = () => reject(new Error('Failed to load Turnstile'));
            document.head.appendChild(script);
        });
    }

    return turnstileScriptPromise;
}

interface UseTurnstileWidgetOptions {
    siteKey: string;
    onTokenChange: (token: string | null) => void;
    resetSignal: number;
    theme?: 'light' | 'dark' | 'auto';
    size?: 'normal' | 'compact';
}

export function useTurnstileWidget({
    siteKey,
    onTokenChange,
    resetSignal,
    theme = 'dark',
    size = 'normal',
}: UseTurnstileWidgetOptions) {
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
                    'expired-callback': () => onTokenChange(null),
                    'error-callback': () => onTokenChange(null),
                    theme,
                    size,
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
    }, [onTokenChange, siteKey, size, theme]);

    useEffect(() => {
        if (widgetIdRef.current !== null && window.turnstile) {
            window.turnstile.reset(widgetIdRef.current);
            onTokenChange(null);
        }
    }, [onTokenChange, resetSignal]);

    return {
        containerRef,
    };
}
