import { useCallback, useEffect, useState } from 'react';
import { type EquipmentItem } from '@/hooks/models';
import { type AggregatedItem } from '@/utils/aggregateItems';
import { useCharacter } from '@/CharacterContext/CharacterContext';
import {
  resolveSellPrice,
  type SellPrice,
} from '@components/organisms/inventoryItem/resolveSellValue';

type Callbacks = {
  onUpdate: (indices: number[], updated: EquipmentItem) => void;
  onDelete: (indices: number[]) => void;
  onAdjustQuantity: (
    item: EquipmentItem,
    newTotal: number,
    currentIndices: number[],
  ) => void;
  onClose: () => void;
};

export type UseInventoryItemEditor = {
  /** The item being edited (or null when nothing is open). */
  item: EquipmentItem | null;
  /** Original indices in the underlying array. */
  indices: number[];
  /** Original aggregated quantity (server-side snapshot). */
  quantity: number;
  /** Editable name, description, comments. */
  editName: string;
  setEditName: (next: string) => void;
  editDescription: string;
  setEditDescription: (next: string) => void;
  editComments: string;
  setEditComments: (next: string) => void;
  /** Local quantity used by the stepper; flushes on save. */
  localQuantity: number;
  setLocalQuantity: (next: number) => void;
  /** Resolved sell price (per unit + provenance flag). */
  sellPrice: SellPrice;
  /** Total sell value at the current local quantity. */
  sellTotal: number;
  /** Save: flush quantity + field edits, then close. */
  save: () => void;
  /** Sell: bump silver by sellTotal, delete the items, then close. */
  sell: () => void;
};

// Hook form of the inventory-item editor. Owns the local edit state, the
// quantity-stepper readout, and the sell math. Parallel in shape to
// useCustomItemForm so the two modals read as a family.
export function useInventoryItemEditor(
  aggregated: AggregatedItem<EquipmentItem> | null,
  open: boolean,
  { onUpdate, onDelete, onAdjustQuantity, onClose }: Callbacks,
): UseInventoryItemEditor {
  const { character, updateField } = useCharacter();

  const item = aggregated?.item ?? null;
  const indices = aggregated?.indices ?? [];
  const quantity = aggregated?.quantity ?? 1;

  const [editName, setEditName] = useState(item?.name ?? '');
  const [editDescription, setEditDescription] = useState(
    item?.description ?? '',
  );
  const [editComments, setEditComments] = useState(item?.comments ?? '');
  const [localQuantity, setLocalQuantity] = useState(quantity);

  useEffect(() => {
    if (!open || !item) return;
    setEditName(item.name ?? '');
    setEditDescription(item.description ?? '');
    setEditComments(item.comments ?? '');
    setLocalQuantity(quantity);
  }, [open, item, quantity]);

  const sellPrice: SellPrice = item
    ? resolveSellPrice(item)
    : { perUnit: 0, fromCatalog: false };
  const sellTotal = sellPrice.perUnit * localQuantity;

  const save = useCallback(() => {
    if (!item) return;
    // Strip `amount` so new slots get amount: 1 — important for ammo items
    // where the existing amount on the item would otherwise be spread onto
    // newly-created slots.
    const { amount: _amount, ...itemWithoutAmount } = item;
    const updatedItem: EquipmentItem = {
      ...itemWithoutAmount,
      name: editName,
      description: editDescription,
      comments: editComments,
    };

    if (localQuantity !== quantity) {
      onAdjustQuantity(updatedItem, localQuantity, indices);
    }

    const retainedCount = Math.min(indices.length, localQuantity);
    const retainedIndices = indices.slice(0, retainedCount);
    if (retainedIndices.length > 0) {
      onUpdate(retainedIndices, updatedItem);
    }

    onClose();
  }, [
    item,
    editName,
    editDescription,
    editComments,
    localQuantity,
    quantity,
    indices,
    onAdjustQuantity,
    onUpdate,
    onClose,
  ]);

  const sell = useCallback(() => {
    if (character) {
      updateField('silver', (character.silver || 0) + sellTotal);
    }
    onDelete(indices);
    onClose();
  }, [character, sellTotal, indices, onDelete, onClose, updateField]);

  return {
    item,
    indices,
    quantity,
    editName,
    setEditName,
    editDescription,
    setEditDescription,
    editComments,
    setEditComments,
    localQuantity,
    setLocalQuantity,
    sellPrice,
    sellTotal,
    save,
    sell,
  };
}
