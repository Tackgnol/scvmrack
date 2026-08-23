import { Box, Typography } from '@mui/material';
import { type ReactNode } from 'react';
import { customStyles, morkBorgColors } from '@/theme/morkBorgTheme';
import { keyframes } from '@mui/system';

const inkWash = keyframes`
  0%, 100% {
    opacity: 0;
  }
  35% {
    opacity: 0.75;
  }
`;

interface SummaryStatButtonProps {
  label: string;
  children: ReactNode;
  isActive: boolean;
  reacting?: boolean;
  prefersReducedMotion?: boolean;
  onPinToggle: (element: HTMLElement) => void;
}

export default function SummaryStatButton({
  label,
  children,
  isActive,
  reacting = false,
  prefersReducedMotion = false,
  onPinToggle,
}: SummaryStatButtonProps) {
  // Tap to toggle the detail popover; it dismisses on click-away. We deliberately
  // do NOT open on hover/focus — on touch that fired on incidental focus and
  // covered the stats the user was reading.
  return (
    <Box
      component="button"
      type="button"
      onClick={(event) => onPinToggle(event.currentTarget)}
      aria-expanded={isActive}
      aria-haspopup="dialog"
      data-reacting={reacting || undefined}
      sx={{
        ...customStyles.summaryStat,
        position: 'relative',
        cursor: 'pointer',
        width: '100%',
        borderTop: 'none',
        borderBottom: 'none',
        borderLeft: 'none',
        backgroundColor:
          isActive || (reacting && prefersReducedMotion)
            ? 'rgba(255, 233, 0, 0.07)'
            : 'transparent',
        boxShadow:
          reacting && prefersReducedMotion
            ? `inset 0 0 0 3px ${morkBorgColors.pink}`
            : undefined,
        transition: 'background-color 140ms ease, box-shadow 140ms ease',
        '&::after': {
          content: '""',
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          backgroundColor: 'rgba(255, 62, 181, 0.08)',
          boxShadow: `inset 0 0 0 2px ${morkBorgColors.pink}`,
          opacity: 0,
          animation:
            reacting && !prefersReducedMotion
              ? `${inkWash} 280ms cubic-bezier(0.16, 1, 0.3, 1)`
              : undefined,
        },
        '&:hover': {
          backgroundColor: 'rgba(255, 233, 0, 0.09)',
          boxShadow: `inset 0 0 0 1px ${morkBorgColors.pink}`,
        },
        '&:focus-visible': {
          outline: `2px dashed ${morkBorgColors.pink}`,
          outlineOffset: -3,
        },
      }}
    >
      <Typography variant="subtitle2" color="secondary" sx={customStyles.summaryStatLabel}>
        {label}
      </Typography>
      {children}
    </Box>
  );
}
