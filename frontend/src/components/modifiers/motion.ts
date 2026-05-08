import { keyframes } from '@mui/system';

export const shiftBadge = keyframes`
  0% { opacity: 0; transform: translateY(-6px) scale(0.98); }
  20% { opacity: 1; transform: translateY(0) scale(1); }
  80% { opacity: 1; transform: translateY(0) scale(1); }
  100% { opacity: 0; transform: translateY(4px) scale(0.98); }
`;

export const getModifierTileMotion = (prefersReducedMotion: boolean) => ({
  initial: prefersReducedMotion
    ? false
    : { opacity: 0, y: 8, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: prefersReducedMotion
    ? { opacity: 0 }
    : { opacity: 0, y: 8, scale: 0.96 },
  transition: prefersReducedMotion
    ? { duration: 0 }
    : {
        layout: { type: 'spring', stiffness: 460, damping: 36, mass: 0.42 },
        opacity: { duration: 0.16, ease: 'easeOut' },
        scale: { duration: 0.16, ease: 'easeOut' },
        y: { type: 'spring', stiffness: 520, damping: 34, mass: 0.38 },
      },
});
