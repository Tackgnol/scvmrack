import { useEffect, useMemo, useRef, useState } from 'react';

type AnimatedNumberProps = {
    value: number;
    durationMs?: number;
    decimals?: number;
    format?: (value: number) => string;
    className?: string;
    cacheKey?: string;
};

const lastRenderedValueCache = new Map<string, number>();

function easeOutCubic(t: number): number {
    return 1 - Math.pow(1 - t, 3);
}

export default function AnimatedNumber({
    value,
    durationMs = 260,
    decimals = 0,
    format,
    className,
    cacheKey,
}: AnimatedNumberProps) {
    const [displayValue, setDisplayValue] = useState<number>(() => {
        if (cacheKey && lastRenderedValueCache.has(cacheKey)) {
            return lastRenderedValueCache.get(cacheKey) as number;
        }
        return value;
    });
    const [isPulsing, setIsPulsing] = useState(false);
    const previousValueRef = useRef<number>(displayValue);
    const rafRef = useRef<number | null>(null);
    const pulseTimeoutRef = useRef<number | null>(null);

    const formatter = useMemo(() => {
        if (format) {
            return format;
        }
        return (raw: number) => raw.toFixed(decimals);
    }, [format, decimals]);

    useEffect(() => {
        const from = previousValueRef.current;
        const to = value;
        previousValueRef.current = value;

        if (from === to) {
            setDisplayValue(to);
            if (cacheKey) {
                lastRenderedValueCache.set(cacheKey, to);
            }
            return;
        }

        const prefersReducedMotion =
            typeof window !== 'undefined' &&
            window.matchMedia &&
            window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        if (prefersReducedMotion || durationMs <= 0) {
            setDisplayValue(to);
            if (cacheKey) {
                lastRenderedValueCache.set(cacheKey, to);
            }
            return;
        }

        setIsPulsing(true);
        if (pulseTimeoutRef.current !== null) {
            window.clearTimeout(pulseTimeoutRef.current);
        }
        pulseTimeoutRef.current = window.setTimeout(() => {
            setIsPulsing(false);
            pulseTimeoutRef.current = null;
        }, Math.min(320, Math.max(180, durationMs)));

        const startAt = performance.now();

        const tick = (now: number) => {
            const elapsed = now - startAt;
            const progress = Math.min(1, elapsed / durationMs);
            const eased = easeOutCubic(progress);
            const nextValue = from + (to - from) * eased;

            setDisplayValue(nextValue);

            if (progress < 1) {
                rafRef.current = window.requestAnimationFrame(tick);
            } else if (cacheKey) {
                lastRenderedValueCache.set(cacheKey, to);
            }
        };

        rafRef.current = window.requestAnimationFrame(tick);

        return () => {
            if (rafRef.current !== null) {
                window.cancelAnimationFrame(rafRef.current);
                rafRef.current = null;
            }
            if (pulseTimeoutRef.current !== null) {
                window.clearTimeout(pulseTimeoutRef.current);
                pulseTimeoutRef.current = null;
            }
        };
    }, [value, durationMs, cacheKey]);

    return (
        <span
            className={className}
            style={{
                fontVariantNumeric: 'tabular-nums',
                display: 'inline-block',
                transform: isPulsing ? 'translateY(-1px) scale(1.03)' : 'translateY(0) scale(1)',
                transition: 'transform 180ms ease',
            }}
        >
            {formatter(displayValue)}
        </span>
    );
}
