import {motion, useMotionValue, useReducedMotion, useSpring} from 'motion/react';
import {useEffect, useMemo, useRef, useState} from 'react';

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

export default function AnimatedNumber({
    value,
    durationMs = 260,
    decimals = 0,
    format,
    className,
    cacheKey,
}: AnimatedNumberProps) {
    const prefersReducedMotion = Boolean(useReducedMotion());
    const springConfig = useMemo(() => durationToSpring(durationMs), [durationMs]);

    const initialValueRef = useRef<number>(
        cacheKey && lastRenderedValueCache.has(cacheKey)
            ? (lastRenderedValueCache.get(cacheKey) as number)
            : value
    );

    const motionValue = useMotionValue(initialValueRef.current);
    const springValue = useSpring(motionValue, springConfig);
    const [displayValue, setDisplayValue] = useState<number>(initialValueRef.current);
    const [isPulsing, setIsPulsing] = useState(false);
    const previousValueRef = useRef<number>(initialValueRef.current);
    const previousCacheKeyRef = useRef<string | undefined>(cacheKey);
    const pulseTimeoutRef = useRef<number | null>(null);

    const formatter = useMemo(() => {
        if (format) {
            return format;
        }
        return (raw: number) => raw.toFixed(decimals);
    }, [format, decimals]);

    useEffect(() => {
        const unsubscribe = springValue.on('change', (latest) => {
            setDisplayValue(latest);
            if (cacheKey) {
                lastRenderedValueCache.set(cacheKey, latest);
            }
        });

        return () => unsubscribe();
    }, [springValue, cacheKey]);

    useEffect(() => {
        if (previousCacheKeyRef.current === cacheKey) return;

        previousCacheKeyRef.current = cacheKey;

        const nextValue = cacheKey && lastRenderedValueCache.has(cacheKey)
            ? (lastRenderedValueCache.get(cacheKey) as number)
            : value;

        previousValueRef.current = nextValue;
        motionValue.jump(nextValue);
        setDisplayValue(nextValue);
    }, [cacheKey, value, motionValue]);

    useEffect(() => {
        const from = previousValueRef.current;
        const to = value;
        previousValueRef.current = to;

        if (from === to) {
            motionValue.jump(to);
            setDisplayValue(to);
            if (cacheKey) {
                lastRenderedValueCache.set(cacheKey, to);
            }
            return;
        }

        if (prefersReducedMotion || durationMs <= 0) {
            motionValue.jump(to);
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

        motionValue.set(to);
    }, [value, durationMs, cacheKey, prefersReducedMotion, motionValue]);

    useEffect(() => {
        return () => {
            if (pulseTimeoutRef.current !== null) {
                window.clearTimeout(pulseTimeoutRef.current);
                pulseTimeoutRef.current = null;
            }
        };
    }, []);

    return (
        <motion.span
            className={className}
            animate={isPulsing ? {y: -1, scale: 1.03} : {y: 0, scale: 1}}
            transition={prefersReducedMotion ? {duration: 0} : {duration: 0.18, ease: 'easeOut'}}
            style={{
                fontVariantNumeric: 'tabular-nums',
                display: 'inline-block',
            }}
        >
            {formatter(displayValue)}
        </motion.span>
    );
}
