import { useCharacter } from '@/CharacterContext/CharacterContext';
import { useTrackedUsePips } from '@/hooks/useTrackedUsePips';
import { isConsumableUseItem } from '@/hooks/useEquipmentSections';
import { type EquipmentUseEntry } from '@components/uses/types';

export function useConsumableSection() {
  const { character, toggleScrollUse, isSaving } = useCharacter();
  const trackedPips = useTrackedUsePips({
    isSaving,
    onToggle: toggleScrollUse,
  });

  const consumablesWithIndices: EquipmentUseEntry[] = (character?.equipment ?? []).flatMap(
    (item, index) =>
      isConsumableUseItem(item)
        ? [{ item, equipmentIndex: index, uses: item.uses ?? [] }]
        : [],
  );

  return {
    consumablesWithIndices,
    ...trackedPips,
  };
}
