import { useCharacter } from '@/CharacterContext/CharacterContext';
import { isPetItem } from '@/hooks/useEquipmentSections';
import { useTrackedUsePips } from '@/hooks/useTrackedUsePips';
import { type EquipmentUseEntry } from '@components/uses/types';

export function usePetSection() {
  const { character, toggleScrollUse, isSaving } = useCharacter();
  const trackedPips = useTrackedUsePips({
    isSaving,
    onToggle: toggleScrollUse,
  });

  const petsWithIndices: EquipmentUseEntry[] = (character?.equipment ?? []).flatMap(
    (item, index) =>
      isPetItem(item)
        ? [{ item, equipmentIndex: index, uses: item.uses ?? [] }]
        : [],
  );

  return {
    petsWithIndices,
    ...trackedPips,
  };
}
