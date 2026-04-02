import { useCharacter } from '@/CharacterContext/CharacterContext';
import { useTrackedUsePips } from '@/hooks/useTrackedUsePips';
import { type EquipmentUseEntry } from '@components/uses/types';
import { useMemo } from 'react';

function isPetItem(item: { key?: string; tags?: string[] }): boolean {
  const tags = item.tags ?? [];
  const key = item.key ?? '';
  return tags.includes('pet') || key.startsWith('pet.') || key.startsWith('pets.');
}

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
