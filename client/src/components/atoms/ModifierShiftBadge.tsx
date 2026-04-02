import { Box } from '@mui/material';
import { morkBorgColors } from '@/theme/morkBorgTheme';
import { shiftBadge } from '@components/modifiers/motion';

interface ModifierShiftBadgeProps {
  label: string;
  reduceMotion: boolean;
}

export default function ModifierShiftBadge({
  label,
  reduceMotion,
}: ModifierShiftBadgeProps) {
  return (
    <Box
      sx={{
        position: 'absolute',
        top: -12,
        right: 12,
        px: 1.25,
        py: 0.35,
        bgcolor: morkBorgColors.yellow,
        color: morkBorgColors.black,
        border: `2px solid ${morkBorgColors.black}`,
        boxShadow: `3px 3px 0 ${morkBorgColors.black}`,
        fontFamily: "'Antonio', sans-serif",
        fontSize: { xs: '0.7rem', sm: '0.6rem' },
        letterSpacing: '0.2em',
        textTransform: 'uppercase',
        animation: reduceMotion
          ? 'none'
          : `${shiftBadge} 900ms cubic-bezier(0.22, 1, 0.36, 1)`,
        pointerEvents: 'none',
      }}
    >
      {label}
    </Box>
  );
}
