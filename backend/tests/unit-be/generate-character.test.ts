import assert from 'node:assert/strict';
import { test } from 'node:test';

import type { Roller } from '@tackgnol/rpg-tools-roller';
import {
  randomSectionSeeds,
  seededRollerFor,
  type DraftSection,
  type RollerFor,
} from '../../src/lib/draft-seeds.js';
import {
  rollCharacter,
  rollQuickCharacter,
  type ClassSpec,
  type RollInputs,
  type RollTables,
} from '../../src/lib/generate-character.js';
import { baseTables, bookClassSpec, bookStatDice } from './roll-inputs-fixture.js';

type RollExpectation = {
  notation: string;
  total: number;
};

class ScriptedRoller {
  public readonly calls: string[] = [];

  constructor(private readonly rolls: RollExpectation[]) {}

  async roll(notation: string): Promise<{ total: number }> {
    this.calls.push(notation);
    const next = this.rolls.shift();
    assert.ok(next, `unexpected roll ${notation}`);
    assert.equal(notation, next.notation);
    return { total: next.total };
  }

  assertComplete(): void {
    assert.deepEqual(this.rolls, []);
  }
}

function asRoller(roller: ScriptedRoller): Roller {
  return roller as unknown as Roller;
}

function classInputs(spec: ClassSpec = bookClassSpec(), tables: RollTables = baseTables(), classId = 1): RollInputs {
  return { classId, spec, tables };
}

function classlessInputs(tables: RollTables = baseTables()): RollInputs {
  return { classId: null, spec: null, tables };
}

/** Like `seededRollerFor`, but the given sections roll on scripted rollers. */
function scriptedFor(scripted: Partial<Record<DraftSection, ScriptedRoller>>): RollerFor {
  const seeded = seededRollerFor(randomSectionSeeds());
  return (section) => {
    const roller = scripted[section];
    return roller ? asRoller(roller) : seeded(section);
  };
}

function recordingRollerFor(calls: string[], total = 1): RollerFor {
  return (section) =>
    ({
      roll: async (notation: string) => {
        calls.push(`${section}:${notation}`);
        return { total };
      },
    }) as unknown as Roller;
}

test('a quick roll takes every section from one scripted roller, in section order', async () => {
  const roller = new ScriptedRoller([
    { notation: '3d6', total: 11 },
    { notation: '3d6', total: 9 },
    { notation: '3d6', total: 14 },
    { notation: '3d6', total: 3 },
    { notation: '1d8', total: 5 },
    { notation: '1d2', total: 2 },
    { notation: '1d6', total: 4 },
    { notation: '1d6', total: 6 },
    { notation: '1d2', total: 2 },
    { notation: '1d2', total: 1 },
    { notation: '1d6', total: 3 },
    { notation: '1d12', total: 2 },
    { notation: '1d12', total: 1 },
    { notation: '1d4', total: 3 },
    { notation: '1d10', total: 4 },
    { notation: '1d4', total: 3 },
    { notation: '1d1', total: 1 },
    { notation: '1d2', total: 1 },
    { notation: '1d1', total: 1 },
    { notation: '1d1', total: 1 },
    { notation: '1d3', total: 2 },
    { notation: '1d2', total: 2 },
  ]);

  const data = await rollQuickCharacter(classInputs(), asRoller(roller));

  roller.assertComplete();
  assert.deepEqual(roller.calls, [
    '3d6',
    '3d6',
    '3d6',
    '3d6',
    '1d8',
    '1d2',
    '1d6',
    '1d6',
    '1d2',
    '1d2',
    '1d6',
    '1d12',
    '1d12',
    '1d4',
    '1d10',
    '1d4',
    '1d1',
    '1d2',
    '1d1',
    '1d1',
    '1d3',
    '1d2',
  ]);

  assert.deepEqual(data, {
    name: 'Bora',
    classId: 1,
    origin: 'origin.one',
    strength: 13,
    agility: 8,
    presence: 14,
    toughness: 3,
    maxHp: 2,
    currentHp: 2,
    omens: 2,
    maxOmens: 2,
    silver: 100,
    habit: 'habit.one',
    tale: 'tale.one',
    bodyDescription: 'body.one',
    trait1: 'trait.two',
    trait2: 'trait.three',
    abilities: [{ key: 'abilities.fixed' }, { key: 'abilities.random-lockpicks' }],
    equipment: [
      { key: 'equipment.backpack', tags: ['carry'] },
      { key: 'equipment.torches', tags: ['light'] },
      { key: 'equipment.torches', tags: ['light'] },
      { key: 'equipment.torches', tags: ['light'] },
      { key: 'equipment.torches', tags: ['light'] },
      { key: 'equipment.torches', tags: ['light'] },
      {
        key: 'equipment.life-elixir',
        tags: ['consumable'],
        uses: [false, false, false],
      },
      { key: 'equipment.arrows', tags: ['ammo'] },
      { key: 'equipment.arrows', tags: ['ammo'] },
      { key: 'equipment.arrows', tags: ['ammo'] },
      { key: 'equipment.arrows', tags: ['ammo'] },
      { key: 'equipment.arrows', tags: ['ammo'] },
      { key: 'equipment.arrows', tags: ['ammo'] },
      { key: 'equipment.arrows', tags: ['ammo'] },
      { key: 'equipment.lockpicks', tags: ['tool'] },
    ],
    equippedWeapons: [{ key: 'weapons.shortbow' }],
    equippedArmor: { key: 'armor.mail' },
  });
});

test('gear hydration rolls on the gear roller after the item pool, using the rolled Presence and scroll defaults', async () => {
  const tables = baseTables();
  tables.equipment.push(
    { key: 'equipment.violet-poison', tags: ['consumable'], defaultAmount: null, classId: null },
    { key: 'equipment.lantern-oil', tags: ['consumable'], defaultAmount: 2, classId: null },
  );
  const spec: ClassSpec = {
    ...bookClassSpec(),
    statDice: bookStatDice(),
    abilities: [
      { id: 1, key: 'abilities.poison', isRandom: false, position: 1, grantItemKey: 'equipment.violet-poison', grantPetKey: null },
      { id: 2, key: 'abilities.oil', isRandom: false, position: 2, grantItemKey: 'equipment.lantern-oil', grantPetKey: null },
      { id: 3, key: 'abilities.scroll', isRandom: false, position: 3, grantItemKey: 'scroll.sacred.one', grantPetKey: null },
    ],
    randomAbilityCount: 0,
  };
  const stats = new ScriptedRoller([
    { notation: '3d6', total: 10 },
    { notation: '3d6', total: 10 },
    { notation: '3d6', total: 16 },
    { notation: '3d6', total: 10 },
    { notation: '1d8', total: 4 },
  ]);
  const gear = new ScriptedRoller([
    { notation: '1d6', total: 1 },
    { notation: '1d12', total: 6 },
    { notation: '1d12', total: 12 },
    { notation: '1d10', total: 1 },
    { notation: '1d4', total: 1 },
    { notation: '1d4', total: 3 },
  ]);

  const data = await rollCharacter(classInputs(spec, tables), scriptedFor({ stats, gear }));

  stats.assertComplete();
  gear.assertComplete();
  assert.equal(data.presence, 16);
  assert.deepEqual(data.equipment, [
    { key: 'equipment.sharp-needle', tags: [] },
    { key: 'equipment.tent', tags: ['shelter'] },
    { key: 'equipment.violet-poison', tags: ['consumable'], uses: [false, false, false, false] },
    { key: 'equipment.lantern-oil', tags: ['consumable'], uses: [false, false, false, false] },
    { key: 'scroll.sacred.one', tags: ['scroll', 'sacred'], uses: [false, false, false, false] },
  ]);
});

test('a draft reference table carries its result and linked item into the test roll', async () => {
  const abilityRoller = new ScriptedRoller([{ notation: '1d2', total: 2 }]);
  const spec: ClassSpec = {
    hpDie: 8,
    omenDie: 2,
    weaponDie: 10,
    armorDie: 4,
    silverDice: [6, 6],
    silverModifier: 10,
    statDice: bookStatDice(),
    originKeys: [],
    abilities: [{
      id: 1,
      key: 'Table Vision',
      isRandom: false,
      position: 0,
      grantItemKey: null,
      grantPetKey: null,
      table: {
        die: 2,
        rows: [
          { text: 'Ash', itemKey: null },
          { text: 'Lock and key', itemKey: 'equipment.lockpicks' },
        ],
      },
    }],
    randomAbilityCount: 0,
  };

  const data = await rollCharacter(
    { classId: null, spec, tables: baseTables() },
    scriptedFor({ abilities: abilityRoller }),
  );

  assert.deepEqual(data.abilities, [{
    key: 'Table Vision',
    tableResult: { roll: 2, text: 'Lock and key', itemKey: 'equipment.lockpicks' },
  }]);
  assert.ok(data.equipment.some((item) => (item as { key?: string }).key === 'equipment.lockpicks'));
  abilityRoller.assertComplete();
});

test('a quick roll lets rolled scrolls reduce starting weapon and armor dice', async () => {
  const tables = baseTables();
  tables.names = ['Ash'];
  tables.habits = [];
  tables.tales = [];
  tables.bodyDescriptions = [];
  tables.traits = [];
  const spec: ClassSpec = {
    ...bookClassSpec(),
    silverDice: [6],
    statDice: bookStatDice(),
    originKeys: [],
    abilities: [],
    randomAbilityCount: 0,
  };

  const roller = new ScriptedRoller([
    { notation: '3d6', total: 10 },
    { notation: '3d6', total: 10 },
    { notation: '3d6', total: 4 },
    { notation: '3d6', total: 2 },
    { notation: '1d8', total: 1 },
    { notation: '1d2', total: 1 },
    { notation: '1d6', total: 1 },
    { notation: '1d1', total: 1 },
    { notation: '1d6', total: 1 },
    { notation: '1d12', total: 5 },
    { notation: '1d2', total: 2 },
    { notation: '1d12', total: 12 },
    { notation: '1d6', total: 6 },
    { notation: '1d2', total: 2 },
    { notation: '1d1', total: 1 },
  ]);

  const data = await rollQuickCharacter(classInputs(spec, tables), asRoller(roller));

  roller.assertComplete();
  assert.deepEqual(roller.calls, [
    '3d6',
    '3d6',
    '3d6',
    '3d6',
    '1d8',
    '1d2',
    '1d6',
    '1d1',
    '1d6',
    '1d12',
    '1d2',
    '1d12',
    '1d6',
    '1d2',
    '1d1',
  ]);

  assert.equal(data.maxHp, 1);
  assert.equal(data.currentHp, 1);
  assert.deepEqual(data.equippedWeapons, [{ key: 'weapons.crossbow' }]);
  assert.deepEqual(data.equippedArmor, { key: 'armor.light' });
  assert.deepEqual(data.equipment, [
    { key: 'scroll.unclean.two', tags: ['scroll', 'unclean'], uses: [false, false, false, false] },
    { key: 'equipment.tent', tags: ['shelter'] },
  ]);
});

test('a quick roll grants a pet from a random ability', async () => {
  const tables = baseTables();
  tables.names = ['Carrion'];
  tables.weapons.push({ key: 'weapons.club', tags: ['weapon', 'melee'], roll: 2, ammoType: null, defaultAmount: 1 });
  tables.equipment.push({ key: 'equipment.rope', tags: ['tool'], defaultAmount: null, classId: null });
  tables.pets = [{ key: 'pets.hawk', tags: ['pet', 'companion'], hp: 2 }];
  tables.habits = [];
  tables.tales = [];
  tables.bodyDescriptions = [];
  tables.traits = [];
  const spec: ClassSpec = {
    hpDie: 8,
    silverDice: [6],
    silverModifier: 10,
    weaponDie: 4,
    armorDie: 2,
    statDice: bookStatDice(),
    omenDie: 2,
    originKeys: ['origin.random'],
    abilities: [
      { id: 1, key: 'abilities.random-hawk', isRandom: true, position: 1, grantItemKey: null, grantPetKey: 'pets.hawk' },
    ],
    randomAbilityCount: 1,
  };

  const roller = new ScriptedRoller([
    { notation: '3d6', total: 10 },
    { notation: '3d6', total: 10 },
    { notation: '3d6', total: 10 },
    { notation: '3d6', total: 10 },
    { notation: '1d8', total: 4 },
    { notation: '1d2', total: 1 },
    { notation: '1d6', total: 3 },
    { notation: '1d1', total: 1 },
    { notation: '1d1', total: 1 },
    { notation: '1d6', total: 1 },
    { notation: '1d12', total: 1 },
    { notation: '1d12', total: 12 },
    { notation: '1d4', total: 2 },
    { notation: '1d2', total: 1 },
  ]);

  const data = await rollQuickCharacter(classInputs(spec, tables, 2), asRoller(roller));

  roller.assertComplete();
  assert.equal(data.classId, 2);
  assert.equal(data.name, 'Carrion');
  assert.equal(data.origin, 'origin.random');
  assert.equal(data.silver, 30);
  assert.deepEqual(data.abilities, [{ key: 'abilities.random-hawk' }]);
  assert.deepEqual(data.equippedWeapons, [{ key: 'weapons.club' }]);
  assert.deepEqual(data.equipment, [
    { key: 'equipment.rope', tags: ['tool'] },
    { key: 'equipment.tent', tags: ['shelter'] },
    { key: 'pets.hawk', tags: ['pet', 'companion'], uses: [true, true] },
  ]);
});

test('a fixed ability grants its item and pet to every character of the class', async () => {
  const tables = baseTables();
  tables.pets = [{ key: 'pets.hawk', tags: ['pet', 'companion'], hp: 1 }];
  const spec: ClassSpec = {
    ...bookClassSpec(),
    abilities: [{
      id: 1,
      key: 'abilities.fixed',
      isRandom: false,
      position: 1,
      grantItemKey: 'equipment.lockpicks',
      grantPetKey: 'pets.hawk',
    }],
    randomAbilityCount: 0,
  };

  const data = await rollCharacter(classInputs(spec, tables), seededRollerFor(randomSectionSeeds()));

  const keys = (data.equipment as Array<{ key: string }>).map((item) => item.key);
  assert.ok(keys.includes('equipment.lockpicks'), `expected lockpicks in ${keys.join(', ')}`);
  assert.ok(keys.includes('pets.hawk'), `expected hawk in ${keys.join(', ')}`);
});

const seedsRolledBeforeStatDice = {
  name: '1'.repeat(64),
  stats: '2'.repeat(64),
  omens: '3'.repeat(64),
  silver: '4'.repeat(64),
  origin: '5'.repeat(64),
  abilities: '6'.repeat(64),
  gear: '7'.repeat(64),
  personality: '8'.repeat(64),
};

test('a Book Class rolls the same stats and omens from the same seeds as plain 3d6 + modifier did', async () => {
  const data = await rollCharacter(classInputs(), seededRollerFor(seedsRolledBeforeStatDice));

  assert.deepEqual(
    {
      strength: data.strength,
      agility: data.agility,
      presence: data.presence,
      toughness: data.toughness,
      maxHp: data.maxHp,
      omens: data.omens,
    },
    { strength: 16, agility: 8, presence: 10, toughness: 9, maxHp: 7, omens: 1 },
  );
});

test('stats roll from the class dice spec, dropping the lowest die when set', async () => {
  const spec: ClassSpec = {
    ...bookClassSpec(),
    statDice: {
      ...bookStatDice(),
      strength: { count: 4, faces: 6, modifier: 1, dropLowest: true },
      agility: { count: 2, faces: 10, modifier: -3, dropLowest: false },
    },
  };
  const calls: string[] = [];

  const data = await rollCharacter(classInputs(spec), recordingRollerFor(calls));

  const statCalls = calls.filter((call) => call.startsWith('stats:'));
  assert.deepEqual(statCalls.slice(0, 7), [
    'stats:1d6',
    'stats:1d6',
    'stats:1d6',
    'stats:1d6',
    'stats:2d10',
    'stats:3d6',
    'stats:3d6',
  ]);
  assert.equal(data.strength, 3 + 1, 'three kept dice of 1 plus the modifier');
  assert.equal(data.agility, 1);
});

test('omens roll the class omen die', async () => {
  const calls: string[] = [];

  await rollCharacter(classInputs({ ...bookClassSpec(), omenDie: 4 }), recordingRollerFor(calls));

  assert.deepEqual(calls.filter((call) => call.startsWith('omens:')), ['omens:1d4']);
});

test('classless scvm keep the d2 omen die', async () => {
  const calls: string[] = [];

  await rollCharacter(classlessInputs(), recordingRollerFor(calls));

  assert.deepEqual(calls.filter((call) => call.startsWith('omens:')), ['omens:1d2']);
});

test('generated abilities follow the class order, whatever order the random ones were picked in', async () => {
  const spec: ClassSpec = {
    ...bookClassSpec(),
    abilities: [
      { id: 3, key: 'abilities.last-fixed', isRandom: false, position: 3, grantItemKey: null, grantPetKey: null },
      { id: 2, key: 'abilities.second', isRandom: true, position: 2, grantItemKey: null, grantPetKey: null },
      { id: 1, key: 'abilities.first', isRandom: true, position: 1, grantItemKey: null, grantPetKey: null },
    ],
    randomAbilityCount: 2,
  };

  for (const seed of ['1', '2', '3', '4']) {
    const data = await rollCharacter(
      classInputs(spec),
      seededRollerFor({ ...randomSectionSeeds(), abilities: seed.repeat(64) }),
    );
    assert.deepEqual(
      (data.abilities as Array<{ key: string }>).map((ability) => ability.key),
      ['abilities.first', 'abilities.second', 'abilities.last-fixed'],
    );
  }
});

test('rollCharacter is deterministic for identical seeds and leaves its inputs untouched', async () => {
  const inputs = classInputs();
  const untouched = structuredClone(inputs);
  const seeds = randomSectionSeeds();

  const first = await rollCharacter(inputs, seededRollerFor(seeds));
  const second = await rollCharacter(inputs, seededRollerFor({ ...seeds }));

  assert.deepEqual(first, second);
  assert.deepEqual(inputs, untouched);
});

test('re-seeding only stats keeps gear identity but re-derives quantities', async () => {
  const inputs = classInputs();
  const seeds = randomSectionSeeds();

  const base = await rollCharacter(inputs, seededRollerFor(seeds));

  let rerolled = base;
  for (let i = 0; i < 50 && rerolled.presence === base.presence; i++) {
    rerolled = await rollCharacter(
      inputs,
      seededRollerFor({ ...seeds, stats: randomSectionSeeds().stats }),
    );
  }
  assert.notEqual(rerolled.presence, base.presence, 'expected a different presence within 50 attempts');

  const ammoKeys = new Set(['equipment.arrows', 'equipment.bolts']);
  const keys = (character: { equipment: unknown[] }) =>
    [...new Set(
      character.equipment
        .map((item) => (item as { key: string }).key)
        .filter((key) => !ammoKeys.has(key))
    )].sort();

  assert.deepEqual(keys(rerolled), keys(base));
  assert.deepEqual(rerolled.equippedWeapons, base.equippedWeapons);
  assert.deepEqual(rerolled.equippedArmor, base.equippedArmor);

  assert.equal(rerolled.name, base.name);
  assert.equal(rerolled.silver, base.silver);
  assert.equal(rerolled.omens, base.omens);
  assert.deepEqual(rerolled.abilities, base.abilities);

  assert.notDeepEqual(
    [rerolled.strength, rerolled.agility, rerolled.presence, rerolled.toughness],
    [base.strength, base.agility, base.presence, base.toughness],
  );
});

test('rollCharacter without a class spec produces a classless scvm with book defaults', async () => {
  const character = await rollCharacter(classlessInputs(), seededRollerFor(randomSectionSeeds()));

  assert.equal(character.classId, null);
  assert.equal(character.origin, null);
  assert.deepEqual(character.abilities, []);
  assert.equal(character.classlessStatOptions?.length, 4);
  assert.ok(
    character.silver >= 20 && character.silver <= 120,
    `silver ${character.silver} out of 2d6x10 range`,
  );
  for (const stat of [character.strength, character.agility, character.presence, character.toughness]) {
    assert.ok(stat >= 3 && stat <= 18, `stat ${stat} out of unmodified 3d6 range`);
  }
  assert.ok(character.maxHp >= 1);
  assert.equal(character.currentHp, character.maxHp);
});

test('a classless roll exposes min/max stats and applies two selected max rolls', async () => {
  const tables = baseTables();
  tables.names = ['Ash'];
  tables.habits = [];
  tables.tales = [];
  tables.bodyDescriptions = [];
  tables.traits = [];

  const statsRoller = new ScriptedRoller([
    { notation: '1d6', total: 6 },
    { notation: '1d6', total: 6 },
    { notation: '1d6', total: 1 },
    { notation: '1d6', total: 1 },
    { notation: '1d6', total: 2 },
    { notation: '1d6', total: 2 },
    { notation: '1d6', total: 2 },
    { notation: '1d6', total: 2 },
    { notation: '1d6', total: 6 },
    { notation: '1d6', total: 5 },
    { notation: '1d6', total: 4 },
    { notation: '1d6', total: 3 },
    { notation: '1d6', total: 1 },
    { notation: '1d6', total: 2 },
    { notation: '1d6', total: 3 },
    { notation: '1d6', total: 4 },
    { notation: '1d8', total: 4 },
  ]);
  const omensRoller = new ScriptedRoller([{ notation: '1d2', total: 1 }]);
  const silverRoller = new ScriptedRoller([
    { notation: '1d6', total: 1 },
    { notation: '1d6', total: 2 },
  ]);
  const nameRoller = new ScriptedRoller([{ notation: '1d1', total: 1 }]);
  const gearRoller = new ScriptedRoller([
    { notation: '1d6', total: 1 },
    { notation: '1d12', total: 1 },
    { notation: '1d12', total: 5 },
    { notation: '1d10', total: 4 },
    { notation: '1d4', total: 1 },
  ]);
  const emptyRoller = new ScriptedRoller([]);
  const rollers = {
    stats: statsRoller,
    omens: omensRoller,
    silver: silverRoller,
    name: nameRoller,
    origin: emptyRoller,
    abilities: emptyRoller,
    gear: gearRoller,
    personality: emptyRoller,
  };

  const character = await rollCharacter(
    classlessInputs(tables),
    (section) => asRoller(rollers[section]),
    { dropLowestAbilities: ['strength', 'presence'] },
  );

  assert.equal(character.strength, 13);
  assert.equal(character.agility, 6);
  assert.equal(character.presence, 15);
  assert.equal(character.toughness, 6);
  assert.deepEqual(character.classlessStatOptions, [
    { ability: 'strength', dice: [6, 6, 1, 1], minTotal: 8, maxTotal: 13, selected: true },
    { ability: 'agility', dice: [2, 2, 2, 2], minTotal: 6, maxTotal: 6, selected: false },
    { ability: 'presence', dice: [6, 5, 4, 3], minTotal: 12, maxTotal: 15, selected: true },
    { ability: 'toughness', dice: [1, 2, 3, 4], minTotal: 6, maxTotal: 9, selected: false },
  ]);
  statsRoller.assertComplete();
  omensRoller.assertComplete();
  silverRoller.assertComplete();
  nameRoller.assertComplete();
  gearRoller.assertComplete();
});

test('a classless quick roll first rolls which two abilities take the drop-lowest result', async () => {
  const roller = new ScriptedRoller([
    { notation: '1d4', total: 1 },
    { notation: '1d3', total: 1 },
    { notation: '1d2', total: 1 },
  ]);
  const scriptedThenOnes = {
    async roll(notation: string) {
      if (roller.calls.length < 3) {
        return roller.roll(notation);
      }
      return { total: 1 };
    },
  } as unknown as Roller;

  const character = await rollQuickCharacter(classlessInputs(), scriptedThenOnes);

  roller.assertComplete();
  // Shuffling [str, agi, pre, tou] with three 1s ends as [agi, pre, tou, str].
  assert.deepEqual(
    character.classlessStatOptions?.filter((option) => option.selected).map((option) => option.ability),
    ['agility', 'presence'],
  );
});
