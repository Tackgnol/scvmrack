import {
    m,
    useMotionValue,
    useMotionValueEvent,
    useReducedMotion,
    useSpring,
    useTransform,
} from 'motion/react';
import { useEffect, useRef } from 'react';
import { useValuePulse } from '@/hooks/useValuePulse';

type AnimatedNumberProps = {
    value: number;
    durationMs?: number;
    decimals?: number;
    format?: (value: number) => string;
    className?: string;
    cacheKey?: string;
};

const lastRenderedValueCache = new Map<string, number>();

type SpringConfig = {
    damping: number;
    stiffness: number;
    mass: number;
};

function durationToSpring(durationMs: number): SpringConfig {
    // Convert duration hint to spring feel: shorter duration => stiffer spring.
    const clamped = Math.max(140, Math.min(700, durationMs));
    const t = (clamped - 140) / (700 - 140);
    return {
        damping: 18 + t * 12,
        stiffness: 500 - t * 300,
        mass: 0.36 + t * 0.2,
    };
}

function getInitialValue(cacheKey: string | undefined, value: number): number {
    return cacheKey && lastRenderedValueCache.has(cacheKey)
        ? (lastRenderedValueCache.get(cacheKey) as number)
        : value;
}

export default function AnimatedNumber({
    value,
    durationMs = 260,
    decimals = 0,
    format,
    className,
    cacheKey,
}: AnimatedNumberProps) {
    const prefersReducedMotion = Boolean(useReducedMotion());
    const springConfig = durationToSpring(durationMs);

    const formatter = format ?? ((raw: number) => raw.toFixed(decimals));

    // The displayed text is rendered straight off the spring as a MotionValue, so
    // updates patch the DOM without re-rendering React (no displayValue state to copy
    // into, no setState inside effects).
    const motionValue = useMotionValue(getInitialValue(cacheKey, value));
    const springValue = useSpring(motionValue, springConfig);
    const display = useTransform(springValue, (latest) => formatter(latest));

    const isPulsing = useValuePulse(
        value,
        prefersReducedMotion || durationMs <= 0,
        Math.min(320, Math.max(180, durationMs)),
    );
    const previousValueRef = useRef<number | null>(null);
    if (previousValueRef.current === null) {
        previousValueRef.current = motionValue.get();
    }
    const previousCacheKeyRef = useRef<string | undefined>(cacheKey);

    // Remember the latest value per cacheKey (no re-render) so a remounted instance
    // with the same key resumes where it left off.
    useMotionValueEvent(springValue, 'change', (latest) => {
        if (cacheKey) {
            lastRenderedValueCache.set(cacheKey, latest);
        }
    });

    // When the cacheKey identity changes, jump to that key's remembered value.
    useEffect(() => {
        if (previousCacheKeyRef.current === cacheKey) return;

        previousCacheKeyRef.current = cacheKey;

        const nextValue = cacheKey && lastRenderedValueCache.has(cacheKey)
            ? (lastRenderedValueCache.get(cacheKey) as number)
            : value;

        previousValueRef.current = nextValue;
        motionValue.jump(nextValue);
    }, [cacheKey, value, motionValue]);

    // Animate toward the latest value (or jump it when motion is off / unchanged).
    useEffect(() => {
        const from = previousValueRef.current ?? value;
        const to = value;
        previousValueRef.current = to;

        if (from === to || prefersReducedMotion || durationMs <= 0) {
            motionValue.jump(to);
            if (cacheKey) {
                lastRenderedValueCache.set(cacheKey, to);
            }
            return;
        }

        motionValue.set(to);
    }, [value, durationMs, cacheKey, prefersReducedMotion, motionValue]);

    return (
        <m.span
            className={className}
            animate={isPulsing ? {y: -1, scale: 1.03} : {y: 0, scale: 1}}
            transition={prefersReducedMotion ? {duration: 0} : {duration: 0.18, ease: 'easeOut'}}
            style={{
                fontVariantNumeric: 'tabular-nums',
                display: 'inline-block',
            }}
        >
            {display}
        </m.span>
    );
}
