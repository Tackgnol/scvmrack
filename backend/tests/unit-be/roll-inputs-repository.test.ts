import assert from 'node:assert/strict';
import { mock, test } from 'node:test';

import { CLASSLESS_DEFAULTS } from '../../src/lib/classless-defaults.js';

const classQueries: unknown[] = [];
const weaponQueries: unknown[] = [];

const statDice = {
  strength: { count: 3, faces: 6, modifier: 0, dropLowest: false },
  agility: { count: 3, faces: 6, modifier: 0, dropLowest: false },
  presence: { count: 3, faces: 6, modifier: 0, dropLowest: false },
  toughness: { count: 3, faces: 6, modifier: 0, dropLowest: false },
};

const prismaMock = {
  class: {
    findUniqueOrThrow: async (args: unknown) => {
      classQueries.push(args);
      return {
        id: 7,
        hpDie: null,
        omenDie: 4,
        weaponDie: null,
        armorDie: null,
        silverDice: [6],
        silverModifier: null,
        statDice,
        randomAbilityCount: null,
      };
    },
  },
  origin: { findMany: async () => [{ key: 'origin.a' }, { key: 'origin.b' }] },
  ability: {
    findMany: async () => [
      { id: 1, key: 'abilities.a', isRandom: false, position: 1, grantItemKey: null, grantPetKey: null },
    ],
  },
  name: { findMany: async () => [{ name: 'Ash' }, { name: 'Bora' }] },
  weapon: {
    findMany: async (args: unknown) => {
      weaponQueries.push(args);
      return [{ key: 'weapons.club', tags: ['weapon'], roll: 1, ammoType: null, defaultAmount: null }];
    },
  },
  armor: { findMany: async () => [] },
  equipment: { findMany: async () => [] },
  pet: { findMany: async () => [] },
  habit: { findMany: async () => [{ key: 'habit.a' }] },
  tale: { findMany: async () => [{ key: 'tale.a' }] },
  bodyDescription: { findMany: async () => [{ key: 'body.a' }] },
  trait: { findMany: async () => [{ key: 'trait.a' }, { key: 'trait.b' }] },
};

mock.module('../../src/lib/prisma.js', { defaultExport: prismaMock });

const { rollInputsRepository } = await import('../../src/repositories/roll-inputs-repository.js');

test('a stored class with unset dice rolls with the classless defaults', async () => {
  const inputs = await rollInputsRepository.load(7);

  assert.equal(inputs.classId, 7);
  assert.deepEqual(inputs.spec, {
    hpDie: CLASSLESS_DEFAULTS.hpDie,
    omenDie: 4,
    weaponDie: CLASSLESS_DEFAULTS.weaponDie,
    armorDie: CLASSLESS_DEFAULTS.armorDie,
    silverDice: [6],
    silverModifier: CLASSLESS_DEFAULTS.silverModifier,
    statDice,
    originKeys: ['origin.a', 'origin.b'],
    abilities: [
      { id: 1, key: 'abilities.a', isRandom: false, position: 1, grantItemKey: null, grantPetKey: null },
    ],
    randomAbilityCount: 0,
  });
});

test('the roll tables are plain keys and names, with weapons in id order', async () => {
  classQueries.length = 0;
  weaponQueries.length = 0;

  const inputs = await rollInputsRepository.load(null);

  assert.deepEqual(classQueries, [], 'a classless roll loads no class');
  assert.equal(inputs.spec, null);
  assert.deepEqual(inputs.tables.names, ['Ash', 'Bora']);
  assert.deepEqual(inputs.tables.habits, ['habit.a']);
  assert.deepEqual(inputs.tables.tales, ['tale.a']);
  assert.deepEqual(inputs.tables.bodyDescriptions, ['body.a']);
  assert.deepEqual(inputs.tables.traits, ['trait.a', 'trait.b']);
  assert.deepEqual((weaponQueries[0] as { orderBy?: unknown }).orderBy, { id: 'asc' });
});
