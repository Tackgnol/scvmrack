import { useCallback, useMemo, useState } from 'react';
import { useCharacter } from '@/CharacterContext/CharacterContext';
import { type EquipmentItem } from '@/hooks/models';
import { type ItemSearchHit } from '@/hooks/useEquipmentSearch';
import { aggregateItems, type AggregatedItem } from '@/utils/aggregateItems';

type AddEquipmentPayload = EquipmentItem & {
  action_die?: unknown;
  hp?: unknown;
  default_amount?: number;
  ammo_start?: number;
};

export function useOnHandSection() {
  const {
    character,
    updateEquipmentItem,
    removeEquipmentItem,
    moveToStorage,
    addEquipmentItem,
  } = useCharacter();

  const equipment = character?.equipment ?? [];
  const aggregated = useMemo(() => aggregateItems(equipment), [equipment]);
  const [editingGroup, setEditingGroup] =
    useState<AggregatedItem<EquipmentItem> | null>(null);
  const [loadingItems, setLoadingItems] = useState<ItemSearchHit[]>([]);

  const handleAdjustQuantity = (
    item: EquipmentItem,
    newTotal: number,
    currentIndices: number[],
  ) => {
    const diff = newTotal - currentIndices.length;
    if (diff > 0) {
      // When adding ammo items to a stack, use amount=1 per slot (each slot = 1 physical item)
      // so the aggregate count matches the actual inventory entries
      const isAmmoItem =
        Array.isArray(item.tags) && item.tags.includes('ammo');
      for (let i = 0; i < diff; i++) {
        addEquipmentItem({
          ...item,
          ...(isAmmoItem ? { amount: 1 } : {}),
        });
      }
    } else if (diff < 0) {
      [...currentIndices]
        .slice(newTotal)
        .reverse()
        .forEach((idx) => removeEquipmentItem(idx));
    }
  };

  const handleAddItem = useCallback(
    async (hit: ItemSearchHit) => {
      const loadingKey = `${hit.itemType}-${hit.id}`;
      setLoadingItems((prev) => [...prev, hit]);

      try {
        const baseUrl = import.meta.env.VITE_BACKEND_URL ?? '';
        const itemUrl = new URL(`${baseUrl}/equipment/${hit.itemType}/${hit.id}`);
        console.log(itemUrl);
        if (hit.key) {
          itemUrl.searchParams.set('key', hit.key);
        }

        const response = await fetch(itemUrl.toString());
        if (!response.ok) return;
        const payload = await response.json();
        const fullItem =
          payload && typeof payload === 'object'
            ? (payload as AddEquipmentPayload)
            : ({} as AddEquipmentPayload);

        const isPet =
          hit.itemType === 'pet' ||
          (Array.isArray(fullItem.tags) && fullItem.tags.includes('pet'));

        const actionDice = (
          Array.isArray(fullItem.action_die) ? fullItem.action_die : []
        )
          .map((value: unknown) => Number(value))
          .filter((value: number) => Number.isFinite(value) && value > 0);

        const petHp = Number(fullItem.hp);
        const initialUses =
          isPet && Number.isFinite(petHp) && petHp > 0
            ? Array.from({ length: petHp }, () => true)
            : [];

        const isAmmo = Array.isArray(fullItem.tags) && fullItem.tags.includes('ammo');
        const ammoDefault = fullItem.default_amount ?? fullItem.ammo_start;
        const initialAmount =
          isAmmo && ammoDefault != null && Number.isFinite(Number(ammoDefault))
            ? Number(ammoDefault)
            : 1;

        if (isAmmo && initialAmount > 1) {
            for (let i = 0; i < initialAmount; i++) {
                addEquipmentItem({
                    ...fullItem,
                    name: fullItem.name ?? hit.name,
                    dice: actionDice.length > 0 ? actionDice : fullItem.dice,
                    uses: initialUses,
                });
            }
        } else {
            addEquipmentItem({
                ...fullItem,
                name: fullItem.name ?? hit.name,
                dice: actionDice.length > 0 ? actionDice : fullItem.dice,
                uses: initialUses,
            });
        }
      } catch {
        return;
      } finally {
        setLoadingItems((prev) =>
          prev.filter((item) => `${item.itemType}-${item.id}` !== loadingKey),
        );
      }
    },
    [addEquipmentItem],
  );

  return {
    aggregated,
    loadingItems,
    editingGroup,
    setEditingGroup,
    handleAddItem,
    handleAdjustQuantity,
    handleUpdate: (indices: number[], updated: EquipmentItem) =>
      indices.forEach((idx) => updateEquipmentItem(idx, updated)),
    handleDelete: (indices: number[]) =>
      [...indices].reverse().forEach((idx) => removeEquipmentItem(idx)),
    handleMove: (indices: number[]) =>
      [...indices].reverse().forEach((idx) => moveToStorage(idx)),
  };
}
