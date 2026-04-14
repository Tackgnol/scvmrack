import { useCharacter } from '@/CharacterContext/CharacterContext';
import { useTrackedUsePips } from '@/hooks/useTrackedUsePips';
import { isConsumableUseItem } from '@/hooks/useEquipmentSections';
import { type EquipmentUseEntry } from '@components/uses/types';
import { useMemo } from 'react';

export function useConsumableSection() {
  const { character, toggleScrollUse, isSaving } = useCharacter();
  const trackedPips = useTrackedUsePips({
    isSaving,
    onToggle: toggleScrollUse,
  });

  const consumablesWithIndices = useMemo<EquipmentUseEntry[]>(
    () =>
      (character?.equipment ?? [])
        .map((item, index) => ({
          item,
          equipmentIndex: index,
          uses: item.uses ?? [],
        }))
        .filter(({ item }) => isConsumableUseItem(item)),
    [character?.equipment],
  );

  return {
    consumablesWithIndices,
    ...trackedPips,
  };
}
