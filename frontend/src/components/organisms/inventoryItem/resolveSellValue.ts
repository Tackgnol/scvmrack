import { type EquipmentItem } from '@/hooks/models';

// When an item doesn't carry a `value`, fall back to a flat sell price so
// users can still offload random junk. Catalog items and custom items both
// usually carry value, so this is the unusual-data path.
const FALLBACK_SELL_VALUE = 10;

export type SellPrice = {
  perUnit: number;
  /** true when the price comes from `item.value`; false when we fell back. */
  fromCatalog: boolean;
};

export function resolveSellPrice(item: EquipmentItem): SellPrice {
  if (typeof item.value === 'number' && item.value > 0) {
    return { perUnit: item.value, fromCatalog: true };
  }
  return { perUnit: FALLBACK_SELL_VALUE, fromCatalog: false };
}
