import { useCharacter } from '@/CharacterContext/CharacterContext';
import { isPetItem } from '@/hooks/useEquipmentSections';
import { useTrackedUsePips } from '@/hooks/useTrackedUsePips';
import { type EquipmentUseEntry } from '@components/uses/types';
import { useMemo } from 'react';

export function usePetSection() {
  const { character, toggleScrollUse, isSaving } = useCharacter();
  const trackedPips = useTrackedUsePips({
    isSaving,
    onToggle: toggleScrollUse,
  });

  const petsWithIndices = useMemo<EquipmentUseEntry[]>(
    () =>
      (character?.equipment ?? [])
        .map((item, index) => ({
          item,
          equipmentIndex: index,
          uses: item.uses ?? [],
        }))
        .filter(({ item }) => isPetItem(item)),
    [character?.equipment],
  );

  return {
    petsWithIndices,
    ...trackedPips,
  };
}
