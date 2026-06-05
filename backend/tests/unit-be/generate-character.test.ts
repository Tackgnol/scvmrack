import assert from 'node:assert/strict';
import { mock, test } from 'node:test';

import type { Roller } from '@tackgnol/rpg-tools-roller';

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

type ClassRow = {
  id: number;
  hpDie: number;
  silverDice: number[];
  silverModifier: number;
  weaponDie: number;
  armorDie: number;
  statModifiers: Record<string, number>;
  randomAbilityCount: number;
  randomAbilities: Array<{ gainItem?: string; gainPet?: string }>;
};

type AbilityRow = {
  classId: number;
  key: string;
  isRandom: boolean;
  rollValue: number | null;
};

type OriginRow = {
  classId: number;
  key: string;
};

type WeaponRow = {
  id: number;
  key: string;
  tags: string[];
  roll: number | null;
  ammoType: string | null;
  defaultAmount: number | null;
};

type ArmorRow = {
  id: number;
  key: string;
  tags: string[];
  maxTier: number | null;
};

type EquipRow = {
  id: number;
  key: string;
  tags: string[];
};

type PetRow = {
  key: string;
  tags: string[];
};

type CharacterCreateData = Record<string, unknown>;

type Fixture = {
  classes: ClassRow[];
  abilities: AbilityRow[];
  names: Array<{ name: string }>;
  origins: OriginRow[];
  weapons: WeaponRow[];
  armors: ArmorRow[];
  equipment: EquipRow[];
  pets: PetRow[];
  habits: Array<{ key: string }>;
  tales: Array<{ key: string }>;
  bodies: Array<{ key: string }>;
  traits: Array<{ key: string }>;
  characterId: string;
  createdCharacters: CharacterCreateData[];
};

function baseFixture(): Fixture {
  return {
    classes: [
      {
        id: 1,
        hpDie: 8,
        silverDice: [6, 6],
        silverModifier: 10,
        weaponDie: 10,
        armorDie: 4,
        statModifiers: {
          strength: 2,
          agility: -1,
          presence: 0,
          toughness: 0,
        },
        randomAbilityCount: 1,
        randomAbilities: [{ gainItem: 'Lockpicks' }],
      },
    ],
    abilities: [
      { classId: 1, key: 'abilities.fixed', isRandom: false, rollValue: null },
      { classId: 1, key: 'abilities.random-lockpicks', isRandom: true, rollValue: 1 },
    ],
    names: [{ name: 'Ash' }, { name: 'Bora' }],
    origins: [
      { classId: 1, key: 'origin.one' },
      { classId: 1, key: 'origin.two' },
    ],
    weapons: [
      {
        id: 1,
        key: 'weapons.shortbow',
        tags: ['weapon', 'ranged'],
        roll: 4,
        ammoType: 'Arrow',
        defaultAmount: 6,
      },
      {
        id: 2,
        key: 'weapons.crossbow',
        tags: ['weapon', 'ranged'],
        roll: 6,
        ammoType: 'Bolt',
        defaultAmount: 2,
      },
    ],
    armors: [
      { id: 1, key: 'armor.light', tags: ['armor'], maxTier: 1 },
      { id: 2, key: 'armor.mail', tags: ['armor'], maxTier: 2 },
    ],
    equipment: [
      { id: 1, key: 'equipment.backpack', tags: ['carry'] },
      { id: 2, key: 'equipment.torches', tags: ['light'] },
      { id: 3, key: 'equipment.life-elixir', tags: ['consumable'] },
      { id: 4, key: 'equipment.arrows', tags: ['ammo'] },
      { id: 5, key: 'equipment.bolts', tags: ['ammo'] },
      { id: 6, key: 'equipment.lockpicks', tags: ['tool'] },
      { id: 7, key: 'equipment.tent', tags: ['shelter'] },
      { id: 8, key: 'scroll.unclean.one', tags: ['scroll', 'unclean'] },
      { id: 9, key: 'scroll.unclean.two', tags: ['scroll', 'unclean'] },
      { id: 10, key: 'scroll.sacred.one', tags: ['scroll', 'sacred'] },
    ],
    pets: [],
    habits: [{ key: 'habit.one' }, { key: 'habit.two' }],
    tales: [{ key: 'tale.one' }],
    bodies: [{ key: 'body.one' }],
    traits: [{ key: 'trait.one' }, { key: 'trait.two' }, { key: 'trait.three' }],
    characterId: 'generated-character-id',
    createdCharacters: [],
  };
}

let fixture = baseFixture();
const hydrateCalls: Array<{
  items: unknown[];
  presence: number;
  scrollDefault: boolean;
  roller: unknown;
}> = [];

function resetFixture(next: Fixture = baseFixture()): void {
  fixture = next;
  hydrateCalls.length = 0;
}

const prismaMock = {
  class: {
    findMany: async () => fixture.classes.map(({ id }) => ({ id })),
    findUnique: async ({ where }: { where: { id: number } }) =>
      fixture.classes.find((row) => row.id === where.id) ?? null,
    findUniqueOrThrow: async ({ where }: { where: { id: number } }) => {
      const row = fixture.classes.find((cls) => cls.id === where.id);
      if (!row) throw new Error(`Class ${where.id} not found`);
      return row;
    },
  },
  ability: {
    findMany: async ({ where }: { where: { classId: number } }) =>
      fixture.abilities.filter((row) => row.classId === where.classId),
  },
  name: {
    findMany: async () => fixture.names,
  },
  origin: {
    findMany: async ({ where }: { where: { classId: number } }) =>
      fixture.origins
        .filter((row) => row.classId === where.classId)
        .map(({ key }) => ({ key })),
  },
  weapon: {
    findMany: async () => fixture.weapons,
  },
  armor: {
    findMany: async () => fixture.armors,
  },
  equipment: {
    findMany: async () => fixture.equipment,
  },
  pet: {
    findMany: async () => fixture.pets,
  },
  habit: {
    findMany: async () => fixture.habits,
  },
  tale: {
    findMany: async () => fixture.tales,
  },
  bodyDescription: {
    findMany: async () => fixture.bodies,
  },
  trait: {
    findMany: async () => fixture.traits,
  },
  character: {
    create: async ({ data }: { data: CharacterCreateData }) => {
      fixture.createdCharacters.push(data);
      return { id: fixture.characterId };
    },
  },
};

async function hydrateInventoryUsesMock(
  items: unknown[],
  presence: number,
  scrollDefault: boolean,
  roller: unknown,
): Promise<unknown[]> {
  hydrateCalls.push({ items, presence, scrollDefault, roller });
  return items.map((item) =>
    item !== null && typeof item === 'object'
      ? { ...(item as Record<string, unknown>), hydrated: true }
      : item,
  );
}

mock.module('../../src/lib/prisma.js', {
  defaultExport: prismaMock,
});

mock.module('../../src/lib/inventory.js', {
  namedExports: {
    hydrateInventoryUses: hydrateInventoryUsesMock,
  },
});

const { generateCharacter } = await import('../../src/lib/generate-character.js');

test('generateCharacter stores the payload produced by a scripted roller', async () => {
  resetFixture();
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

  const id = await generateCharacter(1, roller as unknown as Roller);

  assert.equal(id, 'generated-character-id');
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

  assert.equal(hydrateCalls.length, 1);
  assert.equal(hydrateCalls[0].presence, 14);
  assert.equal(hydrateCalls[0].scrollDefault, true);
  assert.equal(hydrateCalls[0].roller, roller);

  const created = fixture.createdCharacters[0];
  assert.deepEqual(created, {
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
      { key: 'equipment.backpack', tags: ['carry'], hydrated: true },
      { key: 'equipment.torches', tags: ['light'], hydrated: true },
      { key: 'equipment.torches', tags: ['light'], hydrated: true },
      { key: 'equipment.torches', tags: ['light'], hydrated: true },
      { key: 'equipment.torches', tags: ['light'], hydrated: true },
      { key: 'equipment.torches', tags: ['light'], hydrated: true },
      {
        key: 'equipment.life-elixir',
        tags: ['consumable'],
        uses: [false, false, false],
        hydrated: true,
      },
      { key: 'equipment.arrows', tags: ['ammo'], hydrated: true },
      { key: 'equipment.arrows', tags: ['ammo'], hydrated: true },
      { key: 'equipment.arrows', tags: ['ammo'], hydrated: true },
      { key: 'equipment.arrows', tags: ['ammo'], hydrated: true },
      { key: 'equipment.arrows', tags: ['ammo'], hydrated: true },
      { key: 'equipment.arrows', tags: ['ammo'], hydrated: true },
      { key: 'equipment.arrows', tags: ['ammo'], hydrated: true },
      { key: 'equipment.lockpicks', tags: ['tool'], hydrated: true },
    ],
    equippedWeapons: [{ key: 'weapons.shortbow' }],
    equippedArmor: { key: 'armor.mail' },
  });
});

test('generateCharacter lets rolled scrolls reduce starting weapon and armor dice', async () => {
  const next = baseFixture();
  next.classes[0] = {
    ...next.classes[0],
    silverDice: [6],
    statModifiers: {},
    randomAbilityCount: 0,
    randomAbilities: [],
  };
  next.abilities = [];
  next.names = [{ name: 'Ash' }];
  next.origins = [];
  next.habits = [];
  next.tales = [];
  next.bodies = [];
  next.traits = [];
  resetFixture(next);

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

  await generateCharacter(1, roller as unknown as Roller);

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

  const created = fixture.createdCharacters[0];
  assert.equal(created.maxHp, 1);
  assert.equal(created.currentHp, 1);
  assert.deepEqual(created.equippedWeapons, [{ key: 'weapons.crossbow' }]);
  assert.deepEqual(created.equippedArmor, { key: 'armor.light' });
  assert.deepEqual(created.equipment, [
    { key: 'scroll.unclean.two', tags: ['scroll', 'unclean'], hydrated: true },
    { key: 'equipment.tent', tags: ['shelter'], hydrated: true },
  ]);
});

test('generateCharacter can pick a random class and grant a pet from a random ability', async () => {
  const next = baseFixture();
  next.classes = [
    next.classes[0],
    {
      id: 2,
      hpDie: 8,
      silverDice: [6],
      silverModifier: 10,
      weaponDie: 4,
      armorDie: 2,
      statModifiers: {},
      randomAbilityCount: 1,
      randomAbilities: [{ gainPet: 'Hawk' }],
    },
  ];
  next.abilities = [
    { classId: 2, key: 'abilities.random-hawk', isRandom: true, rollValue: 1 },
  ];
  next.names = [{ name: 'Carrion' }];
  next.origins = [{ classId: 2, key: 'origin.random' }];
  next.weapons = [
    ...next.weapons,
    {
      id: 3,
      key: 'weapons.club',
      tags: ['weapon', 'melee'],
      roll: 2,
      ammoType: null,
      defaultAmount: 1,
    },
  ];
  next.equipment = [
    ...next.equipment,
    { id: 11, key: 'equipment.rope', tags: ['tool'] },
  ];
  next.pets = [{ key: 'pets.hawk', tags: ['pet', 'companion'] }];
  next.habits = [];
  next.tales = [];
  next.bodies = [];
  next.traits = [];
  resetFixture(next);

  const roller = new ScriptedRoller([
    { notation: '1d2', total: 2 },
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

  await generateCharacter(null, roller as unknown as Roller);

  roller.assertComplete();
  const created = fixture.createdCharacters[0];
  assert.equal(created.classId, 2);
  assert.equal(created.name, 'Carrion');
  assert.equal(created.origin, 'origin.random');
  assert.equal(created.silver, 30);
  assert.deepEqual(created.abilities, [{ key: 'abilities.random-hawk' }]);
  assert.deepEqual(created.equippedWeapons, [{ key: 'weapons.club' }]);
  assert.deepEqual(created.equipment, [
    { key: 'equipment.rope', tags: ['tool'], hydrated: true },
    { key: 'equipment.tent', tags: ['shelter'], hydrated: true },
    { key: 'pets.hawk', tags: ['pet', 'companion'], hydrated: true },
  ]);
  assert.deepEqual(hydrateCalls[0].items, [
    { key: 'equipment.rope', tags: ['tool'] },
    { key: 'equipment.tent', tags: ['shelter'] },
    { key: 'pets.hawk', tags: ['pet', 'companion'] },
  ]);
});

test('generateCharacter fails clearly when random class generation has no classes', async () => {
  const next = baseFixture();
  next.classes = [];
  resetFixture(next);

  const roller = new ScriptedRoller([]);

  await assert.rejects(
    () => generateCharacter(null, roller as unknown as Roller),
    /No classes found in database/,
  );
  assert.deepEqual(roller.calls, []);
  assert.deepEqual(fixture.createdCharacters, []);
});
