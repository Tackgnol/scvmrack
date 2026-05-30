import { Box, Typography } from '@mui/material';
import { type ReactNode } from 'react';
import { customStyles, morkBorgColors } from '@/theme/morkBorgTheme';

interface SummaryStatButtonProps {
  label: string;
  children: ReactNode;
  isActive: boolean;
  onPinToggle: (element: HTMLElement) => void;
}

export default function SummaryStatButton({
  label,
  children,
  isActive,
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
      sx={{
        ...customStyles.summaryStat,
        cursor: 'pointer',
        width: '100%',
        borderTop: 'none',
        borderBottom: 'none',
        borderLeft: 'none',
        backgroundColor: isActive ? 'rgba(255, 233, 0, 0.07)' : 'transparent',
        transition: 'background-color 140ms ease, box-shadow 140ms ease',
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
