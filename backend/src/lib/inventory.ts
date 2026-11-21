/**
 * Inventory uses hydration, shared between the PATCH route (write time) and
 * the TypeScript character generator. Works on catalog rows already loaded,
 * so the generator can call it mid-roll without I/O.
 *
 * Mirrors the PL/pgSQL hydrate_inventory_uses + resolve_item_default_uses
 * functions from inventory_management.sql.
 */
import { statToModifier } from './ability-modifiers.js';
import type { Roller } from '@tackgnol/rpg-tools-roller';

type InventoryItem = Record<string, unknown>;

/** The catalog rows that decide an item's default uses. */
export type UsesCatalog = {
  pets: ReadonlyArray<{ key: string; hp: number }>;
  equipment: ReadonlyArray<{ key: string; tags: string[]; defaultAmount: number | null }>;
};

/** The distinct item keys of an inventory array: what its {@link UsesCatalog} must cover. */
export function inventoryKeys(items: unknown[]): string[] {
  const keys = items
    .filter((item): item is InventoryItem => item !== null && typeof item === 'object')
    .map((item) => item['key'])
    .filter((key): key is string => typeof key === 'string' && key.length > 0);

  return [...new Set(keys)];
}

/**
 * Walk an inventory array and fill in a default `uses` array for items that
 * don't already have one, from `catalog`. Items with a non-empty `uses` array are left alone.
 */
export async function fillInventoryUses(
  items: unknown[],
  catalog: UsesCatalog,
  presence: number,
  scrollDefault: boolean,
  roller: Roller,
): Promise<unknown[]> {
  const petMap = new Map(catalog.pets.map((p) => [p.key, p]));
  const equipMap = new Map(catalog.equipment.map((e) => [e.key, e]));

  return Promise.all(
    items.map(async (item) => {
      if (item === null || typeof item !== 'object') {
        return item;
      }
      const obj = item as InventoryItem;
      const key = typeof obj['key'] === 'string' ? obj['key'] : null;

      const existingUses = obj['uses'];
      if (Array.isArray(existingUses) && existingUses.length > 0) {
        return item;
      }

      if (!key) {
        return item;
      }

      const pet = petMap.get(key);
      if (pet && pet.hp > 0) {
        return { ...obj, uses: Array(Math.min(pet.hp, 50)).fill(true) };
      }

      if (scrollDefault && key.startsWith('scroll.')) {
        return { ...obj, uses: [false, false, false, false] };
      }

      if (key === 'equipment.violet-poison') {
        const roll = (await roller.roll('1d4')).total;
        return { ...obj, uses: Array(roll + 1).fill(false) };
      }

      const equip = equipMap.get(key);
      if (equip && equip.tags.includes('consumable') && (equip.defaultAmount ?? 0) > 0) {
        const base = equip.defaultAmount!;
        const modifier =
          key === 'equipment.lantern-oil' || key === 'equipment.medicine-chest'
            ? statToModifier(presence)
            : 0;
        const count = Math.max(0, base + modifier);
        return { ...obj, uses: Array(count).fill(false) };
      }

      return item;
    }),
  );
}
