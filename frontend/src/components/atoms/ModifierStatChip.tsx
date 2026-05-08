import { Chip } from '@mui/material';
import { morkBorgColors } from '@/theme/morkBorgTheme';

type ModifierStatChipDensity = 'regular' | 'compact';

interface ModifierStatChipProps {
  label: string;
  density?: ModifierStatChipDensity;
}

const densityStyles = {
  regular: {
    height: { xs: 26, sm: 22 },
    fontSize: { xs: '0.68rem', sm: '0.6rem' },
  },
  compact: {
    height: { xs: 24, sm: 20 },
    fontSize: { xs: '0.65rem', sm: '0.55rem' },
  },
} as const;

export default function ModifierStatChip({
  label,
  density = 'regular',
}: ModifierStatChipProps) {
  return (
    <Chip
      label={label}
      size="small"
      sx={{
        bgcolor: morkBorgColors.pink,
        color: morkBorgColors.black,
        flexShrink: 0,
        ...densityStyles[density],
      }}
    />
  );
}
