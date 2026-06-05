import { useState } from 'react';
import { useCharacter } from '@/CharacterContext/CharacterContext';
import { type EquipmentItem } from '@/hooks/models';
import { aggregateItems, type AggregatedItem } from '@/utils/aggregateItems';

export function useStorageSection() {
  const {
    character,
    updateStorageItem,
    removeStorageItem,
    moveToEquipment,
    addStorageItem,
  } = useCharacter();

  const storage = character?.storage ?? [];
  const aggregated = aggregateItems(storage);
  const [editingGroup, setEditingGroup] =
    useState<AggregatedItem<EquipmentItem> | null>(null);

  const handleAdjustQuantity = (
    item: EquipmentItem,
    newTotal: number,
    currentIndices: number[],
  ) => {
    const diff = newTotal - currentIndices.length;
    if (diff > 0) {
      for (let i = 0; i < diff; i++) addStorageItem({ ...item });
    } else if (diff < 0) {
      [...currentIndices]
        .slice(newTotal)
        .reverse()
        .forEach((idx) => removeStorageItem(idx));
    }
  };

  return {
    aggregated,
    editingGroup,
    setEditingGroup,
    handleAdjustQuantity,
    handleUpdate: (indices: number[], updated: EquipmentItem) =>
      indices.forEach((idx) => updateStorageItem(idx, updated)),
    handleDelete: (indices: number[]) =>
      [...indices].reverse().forEach((idx) => removeStorageItem(idx)),
    handleMove: (indices: number[]) =>
      [...indices].reverse().forEach((idx) => moveToEquipment(idx)),
  };
}
