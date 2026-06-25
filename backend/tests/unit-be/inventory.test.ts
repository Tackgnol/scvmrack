import assert from 'node:assert/strict';
import test, { mock } from 'node:test';

import type { Roller } from '@tackgnol/rpg-tools-roller';

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

type PetRow = {
  key: string;
  hp: number;
};

type EquipmentRow = {
  key: string;
  tags: string[];
  defaultAmount: number | null;
};

const petRows: PetRow[] = [
  { key: 'pets.hound', hp: 60 },
];

const equipmentRows: EquipmentRow[] = [
  { key: 'equipment.medicine-chest', tags: ['consumable'], defaultAmount: 4 },
  { key: 'equipment.violet-poison', tags: ['consumable'], defaultAmount: null },
  { key: 'equipment.bomb', tags: ['consumable'], defaultAmount: 1 },
  { key: 'equipment.rope', tags: ['tool'], defaultAmount: null },
];

function filterByKeys<T extends { key: string }>(
  rows: T[],
  args: { where?: { key?: { in?: string[] } } },
): T[] {
  const keys = args.where?.key?.in;
  return keys ? rows.filter((row) => keys.includes(row.key)) : rows;
}

const catalogRepositoryMock = {
  findPetsByKeys: async (keys: string[]) => filterByKeys(petRows, { where: { key: { in: keys } } }),
  findEquipmentByKeys: async (keys: string[]) => filterByKeys(equipmentRows, { where: { key: { in: keys } } }),
};

mock.module('../../src/repositories/catalog-repository.js', {
  namedExports: { catalogRepository: catalogRepositoryMock },
});

const { hydrateInventoryUses } = await import('../../src/lib/inventory.js');

test('hydrateInventoryUses fills default uses from pets, scrolls, rolled poison, and consumables', async () => {
  const roller = new ScriptedRoller([3]);
  const existingUses = [false];

  const result = await hydrateInventoryUses(
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

test('hydrateInventoryUses does not add scroll defaults when disabled for storage', async () => {
  const roller = new ScriptedRoller([]);

  const result = await hydrateInventoryUses(
    [{ key: 'scroll.unclean.1' }],
    10,
    false,
    roller as unknown as Roller,
  );

  assert.deepEqual(result, [{ key: 'scroll.unclean.1' }]);
  assert.deepEqual(roller.calls, []);
});
