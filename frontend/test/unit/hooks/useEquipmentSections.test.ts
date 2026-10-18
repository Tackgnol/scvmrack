import { expect, test } from 'vitest';
import { isConsumableUseItem, isEncumbranceExemptItem } from '@/hooks/useEquipmentSections';
import { catalogTorches } from '../../fixtures/catalogConsumables';

test('catalog Torches expose controls while fresh or fully spent', () => {
  expect(isConsumableUseItem(catalogTorches)).toBe(true);
  expect(isConsumableUseItem({ ...catalogTorches, uses: catalogTorches.uses?.map(() => true) })).toBe(true);
});

test('a carried bow counts toward encumbrance; its arrows do not', () => {
  const bow = { key: 'weapons.bow', name: 'Bow', tags: ['ranged', 'weapon'], ammoType: 'Arrow' };
  const customArrows = { key: 'custom.ammo.1', name: 'Bone arrows', tags: ['custom', 'ammo'], ammoType: 'Arrow' };
  const untaggedAmmo = { key: 'custom.ammo.2', name: 'Pellets', tags: [], ammoType: 'Pellet' };

  expect(isEncumbranceExemptItem(bow)).toBe(false);
  expect(isEncumbranceExemptItem(customArrows)).toBe(true);
  expect(isEncumbranceExemptItem(untaggedAmmo)).toBe(true);
});
