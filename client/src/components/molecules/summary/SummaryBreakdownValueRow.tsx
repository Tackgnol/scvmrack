import { Typography } from '@mui/material';
import { morkBorgColors } from '@/theme/morkBorgTheme';

interface SummaryBreakdownValueRowProps {
  label: string;
  value: string;
}

export default function SummaryBreakdownValueRow({
  label,
  value,
}: SummaryBreakdownValueRowProps) {
  return (
    <>
      <Typography sx={{ color: 'rgba(245,245,245,0.8)', fontSize: '0.78rem' }}>
        {label}
      </Typography>
      <Typography sx={{ color: morkBorgColors.white, fontFamily: "'Bebas Neue', sans-serif" }}>
        {value}
      </Typography>
    </>
  );
}
