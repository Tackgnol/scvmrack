import {
  ClickAwayListener,
  Fade,
  Paper,
  Popper,
  type PopperProps,
} from '@mui/material';
import { type ReactNode } from 'react';
import { morkBorgColors } from '@/theme/morkBorgTheme';

interface SummaryDetailPopperProps {
  open: boolean;
  anchorEl: HTMLElement | null;
  accentColor: string;
  onClickAway: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  children: ReactNode;
}

const popperModifiers: PopperProps['modifiers'] = [
  {
    name: 'offset',
    options: {
      offset: [0, 10],
    },
  },
];

export default function SummaryDetailPopper({
  open,
  anchorEl,
  accentColor,
  onClickAway,
  onMouseEnter,
  onMouseLeave,
  children,
}: SummaryDetailPopperProps) {
  return (
    <Popper
      open={open}
      anchorEl={anchorEl}
      placement="top"
      transition
      modifiers={popperModifiers}
      sx={{ zIndex: (theme) => theme.zIndex.modal + 1 }}
    >
      {({ TransitionProps }) => (
        <ClickAwayListener onClickAway={onClickAway}>
          <Fade {...TransitionProps} timeout={150}>
            <Paper
              onMouseEnter={onMouseEnter}
              onMouseLeave={onMouseLeave}
              sx={{
                width: { xs: 270, sm: 315 },
                maxWidth: 'calc(100vw - 20px)',
                px: 1.25,
                py: 1.15,
                borderRadius: 0,
                bgcolor: '#060606',
                color: morkBorgColors.white,
                border: `2px solid ${accentColor}`,
                borderTopWidth: 4,
                boxShadow: `6px 6px 0 ${morkBorgColors.black}, 0 0 0 1px ${morkBorgColors.pink}`,
                backgroundImage: 'linear-gradient(165deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0) 65%), linear-gradient(0deg, rgba(255,233,0,0.06), rgba(255,233,0,0.01))',
              }}
            >
              {children}
            </Paper>
          </Fade>
        </ClickAwayListener>
      )}
    </Popper>
  );
}
