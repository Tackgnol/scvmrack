/**
 * Inventory hydration — shared between the PATCH route (write time) and
 * the TypeScript character generator (Phase 5).
 *
 * Mirrors the PL/pgSQL hydrate_inventory_uses + resolve_item_default_uses
 * functions from inventory_management.sql.
 */
import { catalogRepository } from '../repositories/catalog-repository.js';
import { statToModifier } from './ability-modifiers.js';
import type { Roller } from '@tackgnol/rpg-tools-roller';

type InventoryItem = Record<string, unknown>;

/**
 * Walk an inventory array and fill in a default `uses` array for items that
 * don't already have one.  Items with a non-empty `uses` array are left alone.
 */
export async function hydrateInventoryUses(
  items: unknown[],
  presence: number,
  scrollDefault: boolean,
  roller: Roller,
): Promise<unknown[]> {
  const keys = items
    .filter((item): item is InventoryItem => item !== null && typeof item === 'object')
    .map((item) => item['key'])
    .filter((key): key is string => typeof key === 'string' && key.length > 0);

  const uniqueKeys = [...new Set(keys)];

  const [petRows, equipmentRows] = await Promise.all([
    catalogRepository.findPetsByKeys(uniqueKeys),
    catalogRepository.findEquipmentByKeys(uniqueKeys),
  ]);

  const petMap = new Map(petRows.map((p) => [p.key, p]));
  const equipMap = new Map(equipmentRows.map((e) => [e.key, e]));

  return Promise.all(
    items.map(async (item) => {
      if (item === null || typeof item !== 'object') return item;
      const obj = item as InventoryItem;
      const key = typeof obj['key'] === 'string' ? obj['key'] : null;

      const existingUses = obj['uses'];
      if (Array.isArray(existingUses) && existingUses.length > 0) return item;

      if (!key) return item;

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
