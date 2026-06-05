import { useCharacter } from "@/CharacterContext/CharacterContext";
import { type EquipmentItem } from "@/hooks/models";
import { collectKnownAmmoTypes } from "@/inventory/customItems";
import { type ItemSearchHit } from "@/hooks/useEquipmentSearch";
import { type AggregatedItem, aggregateItems } from "@/utils/aggregateItems";
import { useState } from "react";

type AddEquipmentPayload = EquipmentItem & {
  action_die?: unknown;
  hp?: unknown;
  default_amount?: number;
  ammo_start?: number;
};

const isAmmoStack = (item: EquipmentItem): boolean =>
  item.category === "ammo" ||
  (Array.isArray(item.tags) && item.tags.includes("ammo"));

const normalizeAmmoType = (value: string | undefined): string =>
  value?.trim().toLowerCase() ?? "";

export function useOnHandSection() {
  const {
    character,
    updateEquipmentItem,
    removeEquipmentItem,
    moveToStorage,
    addEquipmentItem,
  } = useCharacter();

  const equipment = character?.equipment ?? [];
  const aggregated = aggregateItems(equipment);
  const ammoTypes = collectKnownAmmoTypes(character);
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
      const isAmmoItem = Array.isArray(item.tags) && item.tags.includes("ammo");
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

  const handleAddItem = async (hit: ItemSearchHit) => {
    const loadingKey = `${hit.itemType}-${hit.id}`;
    setLoadingItems((prev) => [...prev, hit]);

    try {
      const baseUrl = import.meta.env.VITE_BACKEND_URL ?? "";
      const itemUrl = new URL(
        `${baseUrl}/api/equipment/${hit.itemType}/${hit.id}`,
        window.location.origin,
      );
      if (hit.key) {
        itemUrl.searchParams.set("key", hit.key);
      }

      const response = await fetch(itemUrl.toString());
      if (response.ok) {
        const payload = await response.json();
        const fullItem =
          payload && typeof payload === "object"
            ? (payload as AddEquipmentPayload)
            : ({} as AddEquipmentPayload);

        const isPet =
          hit.itemType === "pet" ||
          (Array.isArray(fullItem.tags) && fullItem.tags.includes("pet"));

        const actionDice = (
          Array.isArray(fullItem.action_die) ? fullItem.action_die : []
        ).flatMap((value: unknown) => {
          const parsed = Number(value);
          return Number.isFinite(parsed) && parsed > 0 ? [parsed] : [];
        });

        const petHp = Number(fullItem.hp);
        const initialUses =
          isPet && Number.isFinite(petHp) && petHp > 0
            ? Array.from({ length: petHp }, () => true)
            : [];

        const isAmmo =
          Array.isArray(fullItem.tags) && fullItem.tags.includes("ammo");
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
      }
    } catch {
      // Ignore failed item fetches; the pending marker is cleared below.
    }

    setLoadingItems((prev) =>
      prev.filter((item) => `${item.itemType}-${item.id}` !== loadingKey),
    );
  };

  const handleAddCustomItems = (items: EquipmentItem[]) => {
    // Snapshot the current equipment so we can resolve ammo merge targets
    // against a stable view. We intentionally do NOT re-read between
    // updates — each call processes at most one ammo item (see
    // buildCustomItemBundle), so there's no within-batch collision risk.
    const currentEquipment = character?.equipment ?? [];

    items.forEach((item) => {
      if (!isAmmoStack(item)) {
        addEquipmentItem(item);
        return;
      }

      const normalizedType = normalizeAmmoType(item.ammoType);
      const matchIndex = normalizedType
        ? currentEquipment.findIndex(
            (existing) =>
              isAmmoStack(existing) &&
              normalizeAmmoType(existing.ammoType) === normalizedType,
          )
        : -1;

      if (matchIndex >= 0) {
        const existing = currentEquipment[matchIndex];
        const mergedAmount = (existing.amount ?? 0) + (item.amount ?? 0);
        updateEquipmentItem(matchIndex, {
          ...existing,
          amount: mergedAmount,
        });
      } else {
        addEquipmentItem(item);
      }
    });
  };

  return {
    character,
    aggregated,
    ammoTypes,
    loadingItems,
    editingGroup,
    setEditingGroup,
    handleAddItem,
    handleAddCustomItems,
    handleAdjustQuantity,
    handleUpdate: (indices: number[], updated: EquipmentItem) =>
      indices.forEach((idx) => updateEquipmentItem(idx, updated)),
    handleDelete: (indices: number[]) =>
      [...indices].reverse().forEach((idx) => removeEquipmentItem(idx)),
    handleMove: (indices: number[]) =>
      [...indices].reverse().forEach((idx) => moveToStorage(idx)),
  };
}
