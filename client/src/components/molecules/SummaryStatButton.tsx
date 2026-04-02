import { Box, Typography } from '@mui/material';
import { type ReactNode } from 'react';
import { customStyles, morkBorgColors } from '@/theme/morkBorgTheme';

interface SummaryStatButtonProps {
  label: string;
  children: ReactNode;
  isActive: boolean;
  onHoverOpen: (element: HTMLElement) => void;
  onHoverClose: () => void;
  onPinToggle: (element: HTMLElement) => void;
}

export default function SummaryStatButton({
  label,
  children,
  isActive,
  onHoverOpen,
  onHoverClose,
  onPinToggle,
}: SummaryStatButtonProps) {
  return (
    <Box
      component="button"
      type="button"
      onMouseEnter={(event) => onHoverOpen(event.currentTarget)}
      onMouseLeave={onHoverClose}
      onFocus={(event) => onHoverOpen(event.currentTarget)}
      onBlur={onHoverClose}
      onClick={(event) => onPinToggle(event.currentTarget)}
      aria-expanded={isActive}
      aria-haspopup="dialog"
      sx={{
        ...customStyles.summaryStat,
        cursor: 'help',
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
