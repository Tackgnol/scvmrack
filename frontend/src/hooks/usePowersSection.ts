import { useCharacter } from '@/CharacterContext/CharacterContext';
import { isScrollItem } from '@/hooks/useEquipmentSections';
import { useTrackedUsePips } from '@/hooks/useTrackedUsePips';
import { type EquipmentUseEntry } from '@components/uses/types';

const DEFAULT_MAX_USES = 4;

export function usePowersSection() {
  const { character, toggleScrollUse, isSaving } = useCharacter();
  const trackedPips = useTrackedUsePips({
    isSaving,
    onToggle: toggleScrollUse,
  });

  const scrollsWithIndices: EquipmentUseEntry[] = (character?.equipment ?? []).flatMap(
    (item, index) =>
      isScrollItem(item)
        ? [
            {
              item,
              equipmentIndex: index,
              uses: item.uses ?? Array(DEFAULT_MAX_USES).fill(false),
            },
          ]
        : [],
  );

  return {
    scrollsWithIndices,
    ...trackedPips,
  };
}
