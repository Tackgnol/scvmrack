import { useCharacter } from '@/CharacterContext/CharacterContext';
import { statToModifier } from '@/utils/stats';
import { useTranslation } from 'react-i18next';
import { type AbilityName } from '@components/abilities/types';

export function useAbilityCard(ability: AbilityName) {
  const { character, updateField } = useCharacter();
  const { t } = useTranslation();

  const value = character?.[ability] ?? 10;
  const label = t(`attributes.${ability}`);
  const description = t(`attributes.${ability}Desc`);
  const modifier = statToModifier(value);
  const characterKey = character?.id ?? 'unknown';

  const setAbilityValue = (nextValue: number) => {
    const clamped = Math.max(1, Math.min(21, nextValue));
    updateField(ability, clamped);
  };

  const adjustAbility = (delta: number) => {
    setAbilityValue(value + delta);
  };

  const setAbilityFromInput = (rawValue: string) => {
    const parsed = parseInt(rawValue, 10);
    setAbilityValue(Number.isNaN(parsed) ? 10 : parsed);
  };

  return {
    value,
    label,
    description,
    modifier,
    characterKey,
    adjustAbility,
    setAbilityFromInput,
    decreaseAriaLabel: t('common.decreaseStat', 'Decrease {{stat}}', {
      stat: label,
    }),
    increaseAriaLabel: t('common.increaseStat', 'Increase {{stat}}', {
      stat: label,
    }),
  };
}
