import { Paper, Typography } from '@mui/material';
import { customStyles } from '@/theme/morkBorgTheme';
import AbilityModifierValue from '@components/atoms/AbilityModifierValue';
import AbilityValueControl from '@components/molecules/ability/AbilityValueControl';
import { type AbilityCardProps } from '@components/abilities/types';
import { useAbilityCard } from '@/hooks/useAbilityCard';

export default function AbilityCard({ ability, rotate = 0 }: AbilityCardProps) {
  const {
    value,
    label,
    description,
    modifier,
    characterKey,
    adjustAbility,
    setAbilityFromInput,
    decreaseAriaLabel,
    increaseAriaLabel,
  } = useAbilityCard(ability);

  return (
    <Paper sx={customStyles.abilityCardTwo.paper(rotate)}>
      <Typography
        variant="subtitle2"
        color="secondary"
        sx={customStyles.abilityCardTwo.label}
      >
        {label}
      </Typography>

      <AbilityValueControl
        value={value}
        label={label}
        onDecrease={() => adjustAbility(-1)}
        onIncrease={() => adjustAbility(1)}
        onInputChange={setAbilityFromInput}
        decreaseAriaLabel={decreaseAriaLabel}
        increaseAriaLabel={increaseAriaLabel}
      />

      <AbilityModifierValue
        modifier={modifier}
        cacheKey={`${characterKey}:ability:${ability}:modifier`}
      />

      <Typography variant="body2" sx={customStyles.abilityCardTwo.description}>
        {description}
      </Typography>
    </Paper>
  );
}
