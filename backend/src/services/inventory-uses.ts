import type { Roller } from '@tackgnol/rpg-tools-roller';
import { fillInventoryUses, inventoryKeys } from '../lib/inventory.js';
import { catalogRepository } from '../repositories/catalog-repository.js';

/** Loads the catalog rows an inventory's items need, then fills in their default `uses`. */
export async function hydrateInventoryUses(
  items: unknown[],
  presence: number,
  scrollDefault: boolean,
  roller: Roller,
): Promise<unknown[]> {
  const keys = inventoryKeys(items);
  const [pets, equipment] = await Promise.all([
    catalogRepository.findPetsByKeys(keys),
    catalogRepository.findEquipmentByKeys(keys),
  ]);
  return fillInventoryUses(items, { pets, equipment }, presence, scrollDefault, roller);
}
