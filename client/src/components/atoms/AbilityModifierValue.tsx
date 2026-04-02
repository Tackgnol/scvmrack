import { Typography } from '@mui/material';
import { customStyles } from '@/theme/morkBorgTheme';
import { AnimatedNumber } from '@components/index';

interface AbilityModifierValueProps {
  modifier: number;
  cacheKey: string;
}

export default function AbilityModifierValue({
  modifier,
  cacheKey,
}: AbilityModifierValueProps) {
  return (
    <Typography variant="h4" sx={customStyles.abilityCard.modifier}>
      <AnimatedNumber
        value={modifier}
        cacheKey={cacheKey}
        durationMs={260}
        format={(next) => {
          const rounded = Math.round(next);
          return rounded >= 0 ? `+${rounded}` : `${rounded}`;
        }}
      />
    </Typography>
  );
}
