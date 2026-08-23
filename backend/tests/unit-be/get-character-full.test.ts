import assert from 'node:assert/strict';
import { mock, test } from 'node:test';

type CharacterRow = Record<string, unknown> & {
  id: string;
  classId: number | null;
};

type WeaponRow = {
  key: string;
  dice: number[];
  tags: string[];
  value: number | null;
  ammoType: string | null;
  modifiers: unknown;
};

type ArmorRow = {
  key: string;
  dice: number[];
  tags: string[];
  value: number | null;
  maxTier: number | null;
  modifiers: unknown;
};

type EquipmentRow = {
  key: string;
  tags: string[];
  value: number | null;
  ammoType: string | null;
};

type PetRow = {
  key: string;
  tags: string[];
  actionDie: number[];
  buff: unknown;
};

type ClassRow = {
  id: number;
  name: string;
  appendix: string;
  nameKey: string | null;
  descriptionKey: string | null;
};

type TranslationRow = {
  locale: string;
  key: string;
  value: string;
};

type ClassAbilityModifierRow = {
  classId: number;
  abilityKey: string;
  value: number;
  source: string;
  statistic: string;
  exclude: string[];
};

type Fixture = {
  characters: CharacterRow[];
  weapons: WeaponRow[];
  armors: ArmorRow[];
  equipment: EquipmentRow[];
  pets: PetRow[];
  classes: ClassRow[];
  translations: TranslationRow[];
  classAbilityModifiers: ClassAbilityModifierRow[];
};

function baseFixture(): Fixture {
  const createdAt = new Date('2026-03-01T10:00:00.000Z');
  const updatedAt = new Date('2026-03-02T11:00:00.000Z');

  return {
    characters: [
      {
        id: 'character-1',
        name: 'Ash',
        classId: 1,
        origin: 'origin.one',
        strength: 9,
        agility: 10,
        presence: 13,
        toughness: 7,
        maxHp: 5,
        currentHp: 4,
        omens: 2,
        maxOmens: 3,
        silver: 60,
        habit: 'habit.one',
        tale: 'tale.one',
        bodyDescription: 'body.one',
        trait1: 'trait.one',
        trait2: 'trait.two',
        notes: 'still breathing',
        miseryCount: 3,
        abilities: [
          { key: 'abilities.fixed', comment: 'once per day' },
          { custom: 'loose-note' },
        ],
        equipment: [
          {
            key: 'equipment.rope',
            comments: 'frayed',
            tags: ['custom'],
            dice: [2],
            use_count_rule: { type: 'fixed', count: 1 },
          },
          { key: 'pets.hawk', suppress_pet_buff: false },
          { key: 'weapons.shortbow', amount: 3, tags: ['found'], dice: [2] },
          { key: 'equipment.backpack' },
          { key: 'equipment.arrows', amount: 2 },
          { key: 'custom.bundle.one', name: 'Bundle one' },
          { key: 'custom.bundle.two', name: 'Bundle two' },
          { key: 'custom.bundle.three', name: 'Bundle three' },
          { key: 'custom.bundle.four', name: 'Bundle four' },
          // Keeps the warband over capacity now that the inventory bow is exempt
          // (ammoType 'Arrow'); see the encumbrance assertion below.
          { key: 'custom.bundle.five', name: 'Bundle five' },
        ],
        storage: [{ key: 'equipment.rope' }],
        equippedWeapons: [
          { key: 'weapons.shortbow', comments: 'drawn' },
          {
            key: 'custom.weapon',
            name: 'Rust Pike',
            description: 'A bent spike',
            dice: [6],
            tags: ['weapon'],
            value: '12',
            modifiers: [
              {
                value: 2,
                source: 'Crude leverage',
                statistic: 'strength',
                exclude: [],
              },
            ],
          },
        ],
        equippedArmor: { key: 'armor.mail', max_tier: 2 },
        modifiers: [
          { value: 1, statistic: 'strength', exclude: ['melee'], source: 'Manual grip' },
          { value: -1, statistic: 'presence', exclude: [], source: 'Distracted' },
        ],
        createdAt,
        updatedAt,
      },
    ],
    weapons: [
      {
        key: 'weapons.shortbow',
        dice: [6],
        tags: ['weapon', 'ranged'],
        value: 15,
        ammoType: 'Arrow',
        modifiers: [
          {
            value: 1,
            source: 'Sighted bow',
            statistic: 'presence',
            exclude: ['ranged'],
          },
        ],
      },
    ],
    armors: [
      {
        key: 'armor.mail',
        dice: [4],
        tags: ['armor', 'metal'],
        value: 20,
        maxTier: 2,
        modifiers: [
          {
            value: -1,
            source: 'Heavy mail',
            statistic: 'agility',
            exclude: [],
          },
        ],
      },
    ],
    equipment: [
      { key: 'equipment.rope', tags: ['equipment', 'tool'], value: 5, ammoType: null },
      { key: 'equipment.backpack', tags: ['carry'], value: 6, ammoType: null },
      { key: 'equipment.arrows', tags: ['ammo'], value: 1, ammoType: 'Arrow' },
    ],
    pets: [
      {
        key: 'pets.hawk',
        tags: ['pet', 'companion'],
        actionDie: [6],
        buff: [
          {
            value: 1,
            source: 'Hawk eyes',
            statistic: 'presence',
            exclude: [],
          },
        ],
      },
    ],
    classes: [
      {
        id: 1,
        name: 'Fanged Deserter',
        appendix: 'Fallback class text',
        nameKey: 'classes.fanged.name',
        descriptionKey: 'classes.fanged.description',
      },
    ],
    translations: [
      { locale: 'en', key: 'classes.fanged.name', value: 'Klowy dezerter' },
      { locale: 'en', key: 'classes.fanged.description', value: 'Opis klasy' },
      { locale: 'en', key: 'origin.one', value: 'Z rowu' },
      { locale: 'en', key: 'habit.one', value: 'Zaciska zeby' },
      { locale: 'en', key: 'tale.one', value: 'Widzial koniec' },
      { locale: 'en', key: 'body.one', value: 'Blady' },
      { locale: 'en', key: 'trait.one', value: 'Ponury' },
      { locale: 'en', key: 'trait.two', value: 'Glodny' },
      { locale: 'en', key: 'equipment.rope', value: 'Lina' },
      { locale: 'en', key: 'equipment.rope.description', value: 'Postrzepiony sznur' },
      { locale: 'en', key: 'pets.hawk', value: 'Jastrzab' },
      { locale: 'en', key: 'pets.hawk.description', value: 'Czujne ptaszysko' },
      { locale: 'en', key: 'weapons.shortbow', value: 'Krotki luk' },
      { locale: 'en', key: 'weapons.shortbow.description', value: 'Luk na bliski dystans' },
      { locale: 'en', key: 'equipment.backpack', value: 'Plecak' },
      { locale: 'en', key: 'equipment.backpack.description', value: 'Trzyma graty' },
      { locale: 'en', key: 'equipment.arrows', value: 'Strzaly' },
      { locale: 'en', key: 'equipment.arrows.description', value: 'Krzywe pociski' },
      { locale: 'en', key: 'armor.mail', value: 'Kolczuga' },
      { locale: 'en', key: 'armor.mail.description', value: 'Ciezkie ogniwa' },
      { locale: 'en', key: 'abilities.fixed', value: 'Stala zdolnosc' },
      { locale: 'en', key: 'abilities.fixed.description', value: 'Zawsze dziala' },
    ],
    classAbilityModifiers: [
      {
        classId: 1,
        abilityKey: 'abilities.fixed',
        value: 2,
        source: 'Fixed Ability',
        statistic: 'strength',
        exclude: [],
      },
    ],
  };
}

let fixture = baseFixture();

function resetFixture(next: Fixture = baseFixture()): void {
  fixture = next;
}

function filterByKey<T extends { key: string }>(
  rows: T[],
  args: { where?: { key?: { in?: string[] } } } = {},
): T[] {
  const keys = args.where?.key?.in;
  return keys ? rows.filter((row) => keys.includes(row.key)) : rows;
}

const characterRepositoryMock = {
  findFullRow: async (id: string) =>
    fixture.characters.find((row) => row.id === id) ?? null,
};

const catalogRepositoryMock = {
  findWeaponsByKeys: async (keys: string[]) => filterByKey(fixture.weapons, { where: { key: { in: keys } } }),
  findArmorsByKeys: async (keys: string[]) => filterByKey(fixture.armors, { where: { key: { in: keys } } }),
  findEquipmentByKeys: async (keys: string[]) => filterByKey(fixture.equipment, { where: { key: { in: keys } } }),
  findPetsByKeys: async (keys: string[]) => filterByKey(fixture.pets, { where: { key: { in: keys } } }),
  findClassById: async (id: number) =>
    fixture.classes.find((row) => row.id === id) ?? null,
  findTranslations: async (locale: string, keys: string[]) =>
    fixture.translations.filter((row) => row.locale === locale && keys.includes(row.key)),
  findClassAbilityModifiers: async (classId: number, abilityKeys: string[]) =>
    fixture.classAbilityModifiers.filter(
      (row) => row.classId === classId && abilityKeys.includes(row.abilityKey)
    ),
};

mock.module('../../src/repositories/character-repository.js', {
  namedExports: { characterRepository: characterRepositoryMock },
});

mock.module('../../src/repositories/catalog-repository.js', {
  namedExports: { catalogRepository: catalogRepositoryMock },
});

const { getCharacterFull } = await import('../../src/lib/get-character-full.js');

test('getCharacterFull returns null for a missing character', async () => {
  resetFixture();

  const result = await getCharacterFull('missing-character', 'en');

  assert.equal(result, null);
});

test('getCharacterFull resolves catalog data, translations, modifiers, and derived fields', async () => {
  resetFixture();

  const result = await getCharacterFull('character-1', 'en');

  assert.ok(result);
  assert.equal(result.id, 'character-1');
  assert.equal(result.name, 'Ash');
  assert.equal(result.className, 'Klowy dezerter');
  assert.equal(result.classDescription, 'Opis klasy');
  assert.equal(result.origin, 'Z rowu');
  assert.equal(result.habit, 'Zaciska zeby');
  assert.equal(result.tale, 'Widzial koniec');
  assert.equal(result.bodyDescription, 'Blady');
  assert.equal(result.trait1, 'Ponury');
  assert.equal(result.trait2, 'Glodny');
  assert.equal(result.miseryCount, 3);
  assert.equal(result.createdAt, '2026-03-01T10:00:00.000Z');
  assert.equal(result.updatedAt, '2026-03-02T11:00:00.000Z');

  const equipment = result.equipment as Array<Record<string, unknown>>;
  assert.deepEqual(equipment[0], {
    key: 'equipment.rope',
    name: 'Lina',
    description: 'Postrzepiony sznur',
    comments: 'frayed',
    value: 5,
    tags: ['custom', 'equipment', 'tool'],
    dice: [2],
    uses: [],
    useCountRule: { type: 'fixed', count: 1 },
    modifiers: [],
  });
  assert.deepEqual(equipment[1], {
    key: 'pets.hawk',
    name: 'Jastrzab',
    description: 'Czujne ptaszysko',
    tags: ['companion', 'pet'],
    dice: [6],
    uses: [],
    modifiers: [],
  });
  assert.deepEqual(equipment[2], {
    key: 'weapons.shortbow',
    name: 'Krotki luk',
    description: 'Luk na bliski dystans',
    value: 15,
    tags: ['found', 'ranged', 'weapon'],
    dice: [2, 6],
    uses: [],
    ammoType: 'Arrow',
    amount: 3,
    modifiers: [],
  });

  assert.deepEqual(result.storage, [
    {
      key: 'equipment.rope',
      name: 'Lina',
      description: 'Postrzepiony sznur',
      value: 5,
      tags: ['equipment', 'tool'],
      dice: [],
      uses: [],
      modifiers: [],
    },
  ]);

  assert.deepEqual(result.equippedWeapons, [
    {
      key: 'weapons.shortbow',
      name: 'Krotki luk',
      description: 'Luk na bliski dystans',
      comments: 'drawn',
      value: 15,
      dice: [6],
      tags: ['ranged', 'weapon'],
      ammoType: 'Arrow',
      modifiers: [],
    },
    {
      key: 'custom.weapon',
      name: 'Rust Pike',
      description: 'A bent spike',
      value: 12,
      dice: [6],
      tags: ['weapon'],
      modifiers: [
        {
          value: 2,
          source: 'Crude leverage',
          statistic: 'strength',
          exclude: [],
        },
      ],
    },
  ]);

  assert.deepEqual(result.equippedArmor, {
    key: 'armor.mail',
    name: 'Kolczuga',
    description: 'Ciezkie ogniwa',
    value: 20,
    dice: [4],
    maxTier: 2,
    currentTier: 2,
    tags: ['armor', 'metal'],
    modifiers: [],
  });

  assert.deepEqual(result.abilities, [
    {
      key: 'abilities.fixed',
      name: 'Stala zdolnosc',
      description: 'Zawsze dziala',
      comment: 'once per day',
    },
    { custom: 'loose-note' },
  ]);

  // Encumbrance mirrors the frontend's isEncumbranceExemptItem: ammo-typed items
  // are excluded. The inventory `weapons.shortbow` resolves with ammoType 'Arrow'
  // from the weapon catalog, so it no longer counts. A plain `custom.bundle.five`
  // was added to the fixture to keep the warband one over capacity (9 > 8) and
  // retain over-capacity-modifier coverage; without the bow exemption this would
  // be 10.
  assert.equal(result.encumbrance, 9);
  assert.equal(result.maxEncumbrance, 8);
  assert.equal(result.drToDodge, 15);
  assert.equal(result.drToMelee, 8);
  assert.equal(result.drToRanged, 11);

  assert.deepEqual(result.computedModifiers, [
    {
      value: -1,
      source: 'Heavy mail',
      statistic: 'agility',
      exclude: [],
      origin: 'armor',
      originKey: 'armor.armor.mail',
      originName: 'Kolczuga',
    },
    {
      value: 1,
      source: 'Sighted bow',
      statistic: 'presence',
      exclude: ['ranged'],
      origin: 'weapon',
      originKey: 'weapon.weapons.shortbow',
      originName: 'Krotki luk',
    },
    {
      value: 2,
      source: 'Crude leverage',
      statistic: 'strength',
      exclude: [],
      origin: 'weapon',
      originKey: 'custom.weapon',
      originName: 'Rust Pike',
    },
    {
      value: 1,
      source: 'Hawk eyes',
      statistic: 'presence',
      exclude: [],
      origin: 'pet',
      originKey: 'pet.pets.hawk',
      originName: 'Jastrzab',
    },
    {
      value: 2,
      source: 'Fixed Ability',
      statistic: 'strength',
      exclude: [],
      origin: 'system',
      originKey: 'class_ability.abilities.fixed',
      originName: 'Fixed Ability',
    },
    {
      value: -2,
      source: 'Over capacity: -2 Agility to all tests',
      statistic: 'agility',
      exclude: [],
      origin: 'system',
      originKey: 'system.encumbrance.over_capacity',
      originName: 'Encumbrance',
    },
  ]);
});

test('getCharacterFull localizes computed modifier source labels', async () => {
  const fixtureWithPolishModifierSources = baseFixture();
  fixtureWithPolishModifierSources.translations.push(
    { locale: 'pl', key: 'armor.mail', value: 'Kolczuga' },
    { locale: 'pl', key: 'weapons.shortbow', value: 'Krotki luk' },
    { locale: 'pl', key: 'pets.hawk', value: 'Jastrzab' },
    { locale: 'pl', key: 'modifier.source.heavy_mail', value: 'Ciezka kolczuga' },
    { locale: 'pl', key: 'modifier.source.sighted_bow', value: 'Wycelowany luk' },
    { locale: 'pl', key: 'modifier.source.hawk_eyes', value: 'Sokoli wzrok' },
    { locale: 'pl', key: 'modifier.source.fixed_ability', value: 'Stala zdolnosc' },
  );
  resetFixture(fixtureWithPolishModifierSources);

  const result = await getCharacterFull('character-1', 'pl');

  assert.ok(result);
  const computedModifiers = result.computedModifiers as Array<Record<string, unknown>>;
  assert.equal(computedModifiers[0].source, 'Ciezka kolczuga');
  assert.equal(computedModifiers[0].originName, 'Kolczuga');
  assert.equal(computedModifiers[1].source, 'Wycelowany luk');
  assert.equal(computedModifiers[1].originName, 'Krotki luk');
  assert.equal(computedModifiers[3].source, 'Sokoli wzrok');
  assert.equal(computedModifiers[3].originName, 'Jastrzab');
  assert.equal(computedModifiers[4].source, 'Stala zdolnosc');
  assert.equal(computedModifiers[4].originName, 'Stala zdolnosc');
});
