import { Box, Typography } from '@mui/material';
import { morkBorgColors } from '@/theme/morkBorgTheme';

interface SummaryListItemRowProps {
  label: string;
}

export default function SummaryListItemRow({ label }: SummaryListItemRowProps) {
  return (
    <Box
      sx={{
        px: 0.7,
        py: 0.4,
        border: `1px solid ${morkBorgColors.darkGrey}`,
        bgcolor: 'rgba(10,10,10,0.78)',
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
    </Box>
  );
}
