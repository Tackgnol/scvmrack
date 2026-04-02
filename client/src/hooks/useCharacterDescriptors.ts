import { useCharacter } from '@/CharacterContext/CharacterContext';
import { type Ability } from '@/hooks/models';

type DescriptorField = 'trait1' | 'trait2' | 'habit' | 'bodyDescription' | 'origin';

export function useCharacterDescriptors() {
  const { character, isLoading, updateField, updateAbilities } = useCharacter();

  const updateAbilityComment = (index: number, ability: Ability, comment: string) => {
    if (!character?.abilities) return;
    const newAbilities = [...character.abilities] as Ability[];
    newAbilities[index] = { ...ability, comment };
    updateAbilities(newAbilities);
  };

  const updateDescriptorField = (field: DescriptorField, value: string) => {
    updateField(field, value);
  };

  return {
    character,
    isLoading,
    isOccultHerbmaster: character?.classId === 6,
    abilities: character?.abilities ?? [],
    updateAbilityComment,
    updateDescriptorField,
  };
}
