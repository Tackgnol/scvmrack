import assert from 'node:assert/strict';
import test, { mock } from 'node:test';

import type { Roller } from '@tackgnol/rpg-tools-roller';
import { fillInventoryUses, type UsesCatalog } from '../../src/lib/inventory.js';

class ScriptedRoller {
  public readonly calls: string[] = [];

  constructor(private readonly totals: number[]) {}

  async roll(notation: string): Promise<{ total: number }> {
    this.calls.push(notation);
    const next = this.totals.shift();
    assert.notEqual(next, undefined, `unexpected roll ${notation}`);
    return { total: next! };
  }

  assertComplete(): void {
    assert.deepEqual(this.totals, []);
  }
}

const catalog: UsesCatalog = {
  pets: [
    { key: 'pets.hound', hp: 60 },
  ],
  equipment: [
    { key: 'equipment.medicine-chest', tags: ['consumable'], defaultAmount: 4 },
    { key: 'equipment.violet-poison', tags: ['consumable'], defaultAmount: null },
    { key: 'equipment.bomb', tags: ['consumable'], defaultAmount: 1 },
    { key: 'equipment.rope', tags: ['tool'], defaultAmount: null },
  ],
};

const keyLookups: string[][] = [];

mock.module('../../src/repositories/catalog-repository.js', {
  namedExports: {
    catalogRepository: {
      findPetsByKeys: async (keys: string[]) => {
        keyLookups.push(keys);
        return catalog.pets.filter((row) => keys.includes(row.key));
      },
      findEquipmentByKeys: async (keys: string[]) => {
        keyLookups.push(keys);
        return catalog.equipment.filter((row) => keys.includes(row.key));
      },
    },
  },
});

const { hydrateInventoryUses } = await import('../../src/services/inventory-uses.js');

test('fillInventoryUses fills default uses from pets, scrolls, rolled poison, and consumables', async () => {
  const roller = new ScriptedRoller([3]);
  const existingUses = [false];

  const result = await fillInventoryUses(
    [
      { key: 'pets.hound' },
      { key: 'scroll.unclean.1' },
      { key: 'equipment.violet-poison' },
      { key: 'equipment.medicine-chest' },
      { key: 'equipment.bomb', uses: existingUses },
      { key: 'equipment.rope' },
      { name: 'custom item' },
      null,
    ],
    catalog,
    14,
    true,
    roller as unknown as Roller,
  );

  assert.deepEqual(result, [
    { key: 'pets.hound', uses: Array(50).fill(true) },
    { key: 'scroll.unclean.1', uses: [false, false, false, false] },
    { key: 'equipment.violet-poison', uses: [false, false, false, false] },
    { key: 'equipment.medicine-chest', uses: [false, false, false, false, false] },
    { key: 'equipment.bomb', uses: existingUses },
    { key: 'equipment.rope' },
    { name: 'custom item' },
    null,
  ]);
  assert.deepEqual(roller.calls, ['1d4']);
  roller.assertComplete();
});

test('fillInventoryUses does not add scroll defaults when disabled for storage', async () => {
  const roller = new ScriptedRoller([]);

  const result = await fillInventoryUses(
    [{ key: 'scroll.unclean.1' }],
    catalog,
    10,
    false,
    roller as unknown as Roller,
  );

  assert.deepEqual(result, [{ key: 'scroll.unclean.1' }]);
  assert.deepEqual(roller.calls, []);
});

test('hydrateInventoryUses looks up each item key once and fills uses from the rows found', async () => {
  keyLookups.length = 0;
  const roller = new ScriptedRoller([]);

  const result = await hydrateInventoryUses(
    [
      { key: 'pets.hound' },
      { key: 'equipment.medicine-chest' },
      { key: 'pets.hound' },
      { key: '' },
      { name: 'custom item' },
      null,
    ],
    10,
    true,
    roller as unknown as Roller,
  );

  assert.deepEqual(keyLookups, [
    ['pets.hound', 'equipment.medicine-chest'],
    ['pets.hound', 'equipment.medicine-chest'],
  ]);
  assert.deepEqual(result, [
    { key: 'pets.hound', uses: Array(50).fill(true) },
    { key: 'equipment.medicine-chest', uses: [false, false, false, false] },
    { key: 'pets.hound', uses: Array(50).fill(true) },
    { key: '' },
    { name: 'custom item' },
    null,
  ]);
});
