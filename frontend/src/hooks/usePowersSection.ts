import { useCharacter } from '@/CharacterContext/CharacterContext';
import { isScrollItem } from '@/hooks/useEquipmentSections';
import { useTrackedUsePips } from '@/hooks/useTrackedUsePips';
import { type EquipmentUseEntry } from '@components/uses/types';
import { useMemo } from 'react';

const DEFAULT_MAX_USES = 4;

export function usePowersSection() {
  const { character, toggleScrollUse, isSaving } = useCharacter();
  const trackedPips = useTrackedUsePips({
    isSaving,
    onToggle: toggleScrollUse,
  });

  const scrollsWithIndices = useMemo<EquipmentUseEntry[]>(
    () =>
      (character?.equipment ?? [])
        .map((item, index) => ({
          item,
          equipmentIndex: index,
          uses: item.uses ?? Array(DEFAULT_MAX_USES).fill(false),
        }))
        .filter(({ item }) => isScrollItem(item)),
    [character?.equipment],
  );

  return {
    scrollsWithIndices,
    ...trackedPips,
  };
}
