import { Box } from '@mui/material';
import { customStyles } from '@/theme/morkBorgTheme';
import { AbilityCard } from '@components/index';
import { ABILITY_CARD_CONFIG } from '@components/abilities/abilityConfig';

export default function AbilityCardsGrid() {
  return (
    <Box sx={customStyles.abilities.grid}>
      {ABILITY_CARD_CONFIG.map(({ ability, rotate }) => (
        <AbilityCard key={ability} ability={ability} rotate={rotate} />
      ))}
    </Box>
  );
}
