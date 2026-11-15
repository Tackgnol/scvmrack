import assert from 'node:assert/strict';
import { mock, test } from 'node:test';

import { Prisma } from '@prisma/client';
import type { Roller } from '@tackgnol/rpg-tools-roller';
import { ABILITY_STATS, statToModifier } from '../../src/lib/ability-modifiers.js';
import { randomSectionSeeds, seededRollerFor } from '../../src/lib/draft-seeds.js';
import { rollCharacter, type ClassSpec, type RollInputs } from '../../src/lib/generate-character.js';
import { baseTables, bookClassSpec, bookStatDice } from './roll-inputs-fixture.js';

let specs = new Map<number, ClassSpec>();
const loadCalls: Array<number | null> = [];

function reset(next: Map<number, ClassSpec> = new Map([[1, bookClassSpec()]])): void {
  specs = next;
  loadCalls.length = 0;
}

function inputsFor(classId: number | null): RollInputs {
  if (classId === null) {
    return { classId, spec: null, tables: baseTables() };
  }
  const spec = specs.get(classId);
  if (!spec) {
    throw new Error(`Class ${classId} not found`);
  }
  return { classId, spec, tables: baseTables() };
}

mock.module('../../src/lib/prisma.js', { defaultExport: {} });
mock.module('../../src/repositories/roll-inputs-repository.js', {
  namedExports: {
    rollInputsRepository: {
      load: async (classId: number | null) => {
        loadCalls.push(classId);
        return inputsFor(classId);
      },
      loadTables: async () => baseTables(),
    },
  },
});

const {
  characterCreateDataFromDraft,
  randomCharacterCreateData,
  rollCharacterData,
} = await import('../../src/services/character-generation.js');

test('rollCharacterData loads the class once and rolls exactly what the generator rolls from it', async () => {
  reset();
  const seeds = randomSectionSeeds();

  const data = await rollCharacterData(1, seededRollerFor(seeds));

  assert.deepEqual(loadCalls, [1]);
  assert.deepEqual(data, await rollCharacter(inputsFor(1), seededRollerFor(seeds)));
});

test('characterCreateDataFromDraft builds exactly what rollCharacterData produces', async () => {
  reset();
  const seeds = randomSectionSeeds();
  const draft = { classId: 1, classless: false, seeds };

  const expected = await rollCharacterData(1, seededRollerFor(seeds));

  const created = (await characterCreateDataFromDraft(draft, 'user-123')) as Record<string, unknown>;

  assert.equal(created.userId, 'user-123');
  const { userId: _userId, ...rest } = created;
  assert.deepEqual(
    {
      ...rest,
      equippedArmor: rest.equippedArmor === Prisma.DbNull ? null : rest.equippedArmor,
    },
    expected,
  );
});

test('characterCreateDataFromDraft keeps a sanitized draft name override', async () => {
  reset();
  const seeds = randomSectionSeeds();
  const draft = { classId: 1, classless: false, seeds, name: '  Rotmaw  ' };

  const created = (await characterCreateDataFromDraft(draft, 'user-123')) as Record<string, unknown>;
  assert.equal(created.name, 'Rotmaw');
});

test('characterCreateDataFromDraft with classless=true ignores classId', async () => {
  reset();
  const seeds = randomSectionSeeds();

  const created = (await characterCreateDataFromDraft({
    classId: 1,
    classless: true,
    seeds,
    dropLowestAbilities: ['strength', 'presence'],
  }, 'user-123')) as Record<string, unknown>;

  assert.deepEqual(loadCalls, [null]);
  assert.equal(created.classId, null);
  assert.deepEqual(created.abilities, []);
  assert.equal(created.classlessStatOptions, undefined);
});

test('a quick Classless roll boosts exactly two abilities and grants no class abilities', async () => {
  reset();
  let sixSidedRoll = 0;
  const fallback = seededRollerFor(randomSectionSeeds())('gear');
  const roller = {
    async roll(notation: string) {
      if (notation === '1d6' && sixSidedRoll < 16) {
        return { total: [1, 2, 3, 6][sixSidedRoll++ % 4] };
      }
      return fallback.roll(notation);
    },
  } as unknown as Roller;
  const created = await randomCharacterCreateData(null, roller, 'guest-qa');
  assert.equal(created.classId, null);
  assert.equal(created.userId, 'guest-qa');
  assert.deepEqual(created.abilities, []);
  // Each four-die set is 1,2,3,6: dropping high gives 6, dropping low gives 11.
  assert.deepEqual(ABILITY_STATS.map(stat => Number(created[stat])).sort((a, b) => a - b), [6, 6, 11, 11]);
});

test('a quick roll without a user leaves the row unowned and stores a missing armor as DbNull', async () => {
  const spec: ClassSpec = { ...bookClassSpec(), armorDie: 1 };
  reset(new Map([[1, spec]]));
  const roller = seededRollerFor(randomSectionSeeds())('stats');

  const created = await randomCharacterCreateData(1, roller);

  assert.equal('userId' in created, false);
  assert.equal(created.equippedArmor, Prisma.DbNull);
  assert.equal('classlessStatOptions' in created, false);
});

test('forging a saved Custom Class persists its catalog item and pet grants (RPG-358)', async () => {
  reset(new Map([[42, {
    ...bookClassSpec(),
    abilities: [{
      id: 1,
      key: 'abilities.cc-42-1',
      isRandom: false,
      position: 1,
      grantItemKey: 'equipment.lockpicks',
      grantPetKey: 'pets.hawk',
    }],
    randomAbilityCount: 0,
  }]]));
  const created = await randomCharacterCreateData(42, seededRollerFor(randomSectionSeeds())('stats'));
  assert.equal(created.classId, 42);
  const keys = (created.equipment as Array<{ key: string }>).map(item => item.key);
  assert.ok(keys.includes('equipment.lockpicks'));
  assert.ok(keys.includes('pets.hawk'));
});

for (const { count, total, modifier, expected, expectedModifier } of [
  { count: 2, total: 2, modifier: -6, expected: 1, expectedModifier: -3 },
  { count: 6, total: 72, modifier: 6, expected: 21, expectedModifier: 6 },
]) {
  test(`previewing and forging bounds a raw Strength of ${total + modifier} to ${expected}`, async () => {
    reset(new Map([[1, {
      ...bookClassSpec(),
      statDice: { ...bookStatDice(), strength: { count, faces: 12, modifier, dropLowest: false } },
    }]]));
    const makeRoller = (): Roller => {
      let first = true;
      return { roll: async () => {
        const result = first ? total : 1;
        first = false;
        return { total: result };
      } } as unknown as Roller;
    };
    const roller = makeRoller();
    const preview = await rollCharacterData(1, () => roller);
    assert.equal(preview.strength, expected);
    const saved = await randomCharacterCreateData(1, makeRoller());
    assert.equal(saved.strength, expected);
    assert.equal(statToModifier(Number(saved.strength)), expectedModifier);
  });
}
