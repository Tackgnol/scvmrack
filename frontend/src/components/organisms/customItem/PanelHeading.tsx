import { Box, Typography } from '@mui/material';
import { type ReactNode } from 'react';
import { morkBorgColors } from '@/theme/morkBorgTheme';

interface PanelHeadingProps {
  children: ReactNode;
}

const wrapStyle = {
  display: 'grid',
  gridTemplateColumns: 'auto 1fr',
  alignItems: 'center',
  gap: 1.25,
  mb: 1.25,
  // The rule reads as a hand-set lead-in: bracket → label → bar of color.
  // Keeping it flush-left (not centered) matches editorial layout, not SaaS.
} as const;

const bracketStyle = {
  color: morkBorgColors.yellow,
  fontFamily: "'Bebas Neue', sans-serif",
  fontSize: '1.05rem',
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
  lineHeight: 1,
  whiteSpace: 'nowrap',
} as const;

const ruleStyle = {
  height: '3px',
  backgroundColor: morkBorgColors.yellow,
  display: 'block',
} as const;

// Yellow editorial rule with a flush-left Bebas Neue heading. Used as the
// top divider of every sub-panel in the custom-item modal so each block
// reads as a discrete movement instead of a continuous form.
export default function PanelHeading({ children }: PanelHeadingProps) {
  return (
    <Box sx={wrapStyle}>
      <Typography sx={bracketStyle}>◢ {children} ◣</Typography>
      <Box sx={ruleStyle} aria-hidden />
    </Box>
  );
}
