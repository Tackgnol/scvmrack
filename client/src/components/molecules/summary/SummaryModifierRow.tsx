import { Box, Typography } from '@mui/material';
import { morkBorgColors } from '@/theme/morkBorgTheme';

interface SummaryModifierRowProps {
  label: string;
  value: number;
}

const formatSigned = (value: number): string => {
  if (value > 0) return `+${value}`;
  return `${value}`;
};

export default function SummaryModifierRow({
  label,
  value,
}: SummaryModifierRowProps) {
  return (
    <Box
      sx={{
        px: 0.7,
        py: 0.4,
        border: `1px solid ${morkBorgColors.darkGrey}`,
        bgcolor: 'rgba(10,10,10,0.78)',
        display: 'grid',
        gridTemplateColumns: '1fr auto',
        alignItems: 'center',
        gap: 1,
      }}
    >
      <Typography
        sx={{
          color: morkBorgColors.white,
          fontSize: '0.74rem',
          lineHeight: 1.15,
          fontFamily: "'Antonio', sans-serif",
          letterSpacing: '0.03em',
        }}
      >
        {label}
      </Typography>
      <Typography
        sx={{
          color: value >= 0 ? morkBorgColors.yellow : morkBorgColors.pink,
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: '0.94rem',
          letterSpacing: '0.03em',
        }}
      >
        {formatSigned(value)}
      </Typography>
    </Box>
  );
}
