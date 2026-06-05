import assert from 'node:assert/strict';
import { mock, test } from 'node:test';

type CatalogRow = {
  id: number;
  key: string;
  tags: string[];
};

type TranslationRow = {
  locale: string;
  key: string;
  value: string;
};

const catalogs: Record<'weapon' | 'armor' | 'equipment' | 'pet', CatalogRow[]> = {
  weapon: [{ id: 1, key: 'weapons.sword', tags: ['weapon', 'melee'] }],
  armor: [{ id: 2, key: 'armor.mail', tags: ['armor', 'metal'] }],
  equipment: [{ id: 3, key: 'equipment.rope', tags: ['equipment', 'tool'] }],
  pet: [{ id: 4, key: 'pets.hawk', tags: ['pet', 'companion'] }],
};

const translations: TranslationRow[] = [
  { locale: 'en', key: 'weapons.sword', value: 'Sword' },
  { locale: 'pl', key: 'weapons.sword', value: 'Miecz' },
  { locale: 'en', key: 'armor.mail', value: 'Mail Armor' },
  { locale: 'pl', key: 'armor.mail', value: 'Kolczuga' },
  { locale: 'en', key: 'equipment.rope', value: 'Rope' },
  { locale: 'pl', key: 'equipment.rope', value: 'Lina' },
  { locale: 'en', key: 'pets.hawk', value: 'Hawk' },
  { locale: 'pl', key: 'pets.hawk', value: 'Jastrzab' },
];

const calls = {
  weapon: 0,
  armor: 0,
  equipment: 0,
  pet: 0,
  translation: 0,
};

function resetCalls(): void {
  calls.weapon = 0;
  calls.armor = 0;
  calls.equipment = 0;
  calls.pet = 0;
  calls.translation = 0;
}

function catalogFindMany(itemType: keyof typeof catalogs) {
  return async () => {
    calls[itemType]++;
    return catalogs[itemType];
  };
}

const prismaMock = {
  weapon: {
    findMany: catalogFindMany('weapon'),
  },
  armor: {
    findMany: catalogFindMany('armor'),
  },
  equipment: {
    findMany: catalogFindMany('equipment'),
  },
  pet: {
    findMany: catalogFindMany('pet'),
  },
  translation: {
    findMany: async ({
      where,
    }: {
      where: { key: { in: string[] }; locale: { in: string[] } };
    }) => {
      calls.translation++;
      return translations.filter((row) =>
        where.key.in.includes(row.key) && where.locale.in.includes(row.locale)
      );
    },
  },
};

mock.module('../../src/lib/prisma.js', {
  defaultExport: prismaMock,
});

const { clearItemSearchCache, searchItems } = await import('../../src/lib/item-search-service.js');

test('searchItems loads catalog documents and reuses the cached index', async () => {
  clearItemSearchCache();
  resetCalls();

  const first = await searchItems('miecz', 'pl', 10);
  const second = await searchItems('sword', 'en', 10);

  assert.deepEqual(first[0], {
    itemType: 'weapon',
    id: 1,
    key: 'weapons.sword',
    name: 'Miecz',
  });
  assert.deepEqual(second[0], {
    itemType: 'weapon',
    id: 1,
    key: 'weapons.sword',
    name: 'Sword',
  });
  assert.deepEqual(calls, {
    weapon: 1,
    armor: 1,
    equipment: 1,
    pet: 1,
    translation: 1,
  });
});

test('clearItemSearchCache forces the next search to rebuild from Prisma', async () => {
  clearItemSearchCache();
  resetCalls();

  await searchItems('rope', 'en', 10);
  clearItemSearchCache();
  await searchItems('lina', 'pl', 10);

  assert.deepEqual(calls, {
    weapon: 2,
    armor: 2,
    equipment: 2,
    pet: 2,
    translation: 2,
  });
});
