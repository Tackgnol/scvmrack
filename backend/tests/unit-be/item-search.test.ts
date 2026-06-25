import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildItemSearchDocuments,
  createItemSearchIndex,
  normalizeSearchText,
  searchItemIndex,
  type ItemSearchCatalogRow,
  type ItemSearchTranslationRow,
} from '../../src/lib/item-search.js';

const catalogRows: ItemSearchCatalogRow[] = [
  {
    itemType: 'weapon',
    id: 1,
    key: 'weapons.sword',
    tags: ['weapon', 'melee'],
  },
  {
    itemType: 'equipment',
    id: 2,
    key: 'equipment.grappling-hook',
    tags: ['equipment', 'tool'],
  },
  {
    itemType: 'equipment',
    id: 3,
    key: 'scroll.unclean.1',
    tags: ['scroll', 'unclean'],
  },
  { itemType: 'pet', id: 4, key: 'pets.small-dog', tags: ['pet', 'companion'] },
];

const translations: ItemSearchTranslationRow[] = [
  { locale: 'en', key: 'weapons.sword', value: 'Sword' },
  { locale: 'pl', key: 'weapons.sword', value: 'Miecz' },
  { locale: 'en', key: 'equipment.grappling-hook', value: 'Grappling Hook' },
  { locale: 'pl', key: 'equipment.grappling-hook', value: 'Kotwiczka' },
  { locale: 'en', key: 'scroll.unclean.1', value: 'Tongue of Eris' },
  { locale: 'pl', key: 'scroll.unclean.1', value: 'Język Eris' },
  { locale: 'en', key: 'pets.small-dog', value: 'Small Dog' },
  { locale: 'pl', key: 'pets.small-dog', value: 'Mały pies' },
];

function makeIndex() {
  return createItemSearchIndex(
    buildItemSearchDocuments(catalogRows, translations)
  );
}

test('normalizeSearchText removes accents and lowercases search text', () => {
  assert.equal(normalizeSearchText('Broń JĘZYK Łódź'), 'bron jezyk lodz');
});

test('searchItemIndex returns localized names', () => {
  const results = searchItemIndex(makeIndex(), 'sword', 'pl', 10);

  assert.deepEqual(results[0], {
    itemType: 'weapon',
    id: 1,
    key: 'weapons.sword',
    name: 'Miecz',
  });
});

test('searchItemIndex matches Polish names without requiring accents', () => {
  const results = searchItemIndex(makeIndex(), 'jezyk', 'en', 10);

  assert.equal(results[0]?.key, 'scroll.unclean.1');
  assert.equal(results[0]?.name, 'Tongue of Eris');
});

test('searchItemIndex matches category aliases and tags', () => {
  const index = makeIndex();

  assert.equal(searchItemIndex(index, 'bron', 'en', 10)[0]?.itemType, 'weapon');
  assert.equal(
    searchItemIndex(index, 'unclean', 'en', 10)[0]?.key,
    'scroll.unclean.1'
  );
  assert.equal(
    searchItemIndex(index, 'companion', 'en', 10)[0]?.itemType,
    'pet'
  );
});

test('searchItemIndex supports typo-tolerant item name search', () => {
  const results = searchItemIndex(makeIndex(), 'grapling', 'en', 10);

  assert.equal(results[0]?.key, 'equipment.grappling-hook');
});

test('searchItemIndex respects the result limit', () => {
  const results = searchItemIndex(makeIndex(), 'equipment', 'en', 1);

  assert.equal(results.length, 1);
});

test('searchItemIndex finds Occult Herbmaster decoctions by official English names', () => {
  const decoctionRows: ItemSearchCatalogRow[] = [
    {
      itemType: 'equipment',
      id: 31,
      key: 'equipment.red-poison',
      tags: ['consumable', 'poison', 'decoction', 'wywar', 'wywary'],
    },
    {
      itemType: 'equipment',
      id: 54,
      key: 'equipment.ezumiel-vapor',
      tags: ['consumable', 'decoction', 'wywar', 'wywary'],
    },
    {
      itemType: 'equipment',
      id: 55,
      key: 'equipment.southern-frog',
      tags: ['consumable', 'decoction', 'wywar', 'wywary'],
    },
    {
      itemType: 'equipment',
      id: 56,
      key: 'equipment.elixir-vitalis',
      tags: ['consumable', 'decoction', 'wywar', 'wywary'],
    },
    {
      itemType: 'equipment',
      id: 57,
      key: 'equipment.spider-owl-soup',
      tags: ['consumable', 'decoction', 'wywar', 'wywary'],
    },
    {
      itemType: 'equipment',
      id: 58,
      key: 'equipment.fernors-philtre',
      tags: ['consumable', 'decoction', 'wywar', 'wywary'],
    },
    {
      itemType: 'equipment',
      id: 59,
      key: 'equipment.hyphos-snuff',
      tags: ['consumable', 'decoction', 'wywar', 'wywary'],
    },
    {
      itemType: 'equipment',
      id: 32,
      key: 'equipment.black-poison',
      tags: ['consumable', 'poison', 'decoction', 'wywar', 'wywary'],
    },
  ];

  const decoctionTranslations: ItemSearchTranslationRow[] = [
    { locale: 'en', key: 'equipment.red-poison', value: 'Red Poison' },
    { locale: 'en', key: 'equipment.ezumiel-vapor', value: "Ezumiel's Vapor" },
    {
      locale: 'en',
      key: 'equipment.southern-frog',
      value: 'Southern Frog Stew',
    },
    { locale: 'en', key: 'equipment.elixir-vitalis', value: 'Elixir Vitalis' },
    {
      locale: 'en',
      key: 'equipment.spider-owl-soup',
      value: 'Spider-Owl Soup',
    },
    {
      locale: 'en',
      key: 'equipment.fernors-philtre',
      value: "Fernor's Philtre",
    },
    {
      locale: 'en',
      key: 'equipment.hyphos-snuff',
      value: "Hyphos' Enervating Snuff",
    },
    { locale: 'en', key: 'equipment.black-poison', value: 'Black Poison' },
  ];

  const index = createItemSearchIndex(
    buildItemSearchDocuments(decoctionRows, decoctionTranslations)
  );

  assert.equal(
    searchItemIndex(index, 'red poison', 'en', 10)[0]?.key,
    'equipment.red-poison'
  );
  assert.equal(
    searchItemIndex(index, 'ezumiel vapor', 'en', 10)[0]?.key,
    'equipment.ezumiel-vapor'
  );
  assert.equal(
    searchItemIndex(index, 'southern frog stew', 'en', 10)[0]?.key,
    'equipment.southern-frog'
  );
  assert.equal(
    searchItemIndex(index, 'elixir vitalis', 'en', 10)[0]?.key,
    'equipment.elixir-vitalis'
  );
  assert.equal(
    searchItemIndex(index, 'spider owl soup', 'en', 10)[0]?.key,
    'equipment.spider-owl-soup'
  );
  assert.equal(
    searchItemIndex(index, 'fernors philtre', 'en', 10)[0]?.key,
    'equipment.fernors-philtre'
  );
  assert.equal(
    searchItemIndex(index, 'hyphos enervating snuff', 'en', 10)[0]?.key,
    'equipment.hyphos-snuff'
  );
  assert.equal(
    searchItemIndex(index, 'black poison', 'en', 10)[0]?.key,
    'equipment.black-poison'
  );
  assert.equal(searchItemIndex(index, 'decoction', 'en', 10).length, 8);
  assert.equal(searchItemIndex(index, 'wywar', 'pl', 10).length, 8);
  assert.equal(searchItemIndex(index, 'wywary', 'pl', 10).length, 8);
});
