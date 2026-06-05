import { useEffect, useRef, useState } from 'react';

const SHOW_DELAY_MS = 140;
const MIN_VISIBLE_MS = 420;

// Debounces a raw `isSaving` flag into a display flag: waits SHOW_DELAY_MS before
// showing (so quick saves don't flash) and keeps it visible at least MIN_VISIBLE_MS
// once shown (so it doesn't blink out instantly).
export function useSavingIndicator(isSaving: boolean): boolean {
  const [showSaving, setShowSaving] = useState(false);
  const showTimeoutRef = useRef<number | null>(null);
  const hideTimeoutRef = useRef<number | null>(null);
  const visibleSinceRef = useRef<number | null>(null);

  useEffect(() => {
    if (isSaving) {
      if (!showSaving && showTimeoutRef.current === null) {
        showTimeoutRef.current = window.setTimeout(() => {
          setShowSaving(true);
          visibleSinceRef.current = Date.now();
          showTimeoutRef.current = null;
        }, SHOW_DELAY_MS);
      }
    } else {
      if (showTimeoutRef.current !== null) {
        window.clearTimeout(showTimeoutRef.current);
        showTimeoutRef.current = null;
      }
      if (showSaving) {
        const elapsed = Date.now() - (visibleSinceRef.current ?? Date.now());
        const remaining = Math.max(0, MIN_VISIBLE_MS - elapsed);
        hideTimeoutRef.current = window.setTimeout(() => {
          setShowSaving(false);
          visibleSinceRef.current = null;
          hideTimeoutRef.current = null;
        }, remaining);
      }
    }

    return () => {
      if (showTimeoutRef.current !== null) {
        window.clearTimeout(showTimeoutRef.current);
        showTimeoutRef.current = null;
      }
      if (hideTimeoutRef.current !== null) {
        window.clearTimeout(hideTimeoutRef.current);
        hideTimeoutRef.current = null;
      }
    };
  }, [isSaving, showSaving]);

  return showSaving;
}
