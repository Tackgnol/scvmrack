import { useEffect, useState } from 'react';

/**
 * Keeps a loading state visible for at least `minMs` so a fast load doesn't flash
 * the skeleton for a single frame. While `active` is true the result is true
 * (derived, no state write); the minimum-display window starts on mount and an
 * async timer flips it off, so the result goes false either when `active` ends
 * (if the window already elapsed) or when the window elapses (if `active` ended
 * early). Intended for cases where `active` is true at mount (the loading case);
 * if we mount inactive the window starts already-elapsed so nothing shows.
 */
export function useMinimumVisible(active: boolean, minMs: number): boolean {
    const [windowElapsed, setWindowElapsed] = useState(!active);

    useEffect(() => {
        const id = setTimeout(() => setWindowElapsed(true), minMs);
        return () => clearTimeout(id);
        // Start the minimum-display window once on mount; minMs is a constant.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return active || !windowElapsed;
}
