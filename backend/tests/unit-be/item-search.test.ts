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
  { itemType: 'weapon', id: 1, key: 'weapons.sword', tags: ['weapon', 'melee'] },
  { itemType: 'equipment', id: 2, key: 'equipment.grappling-hook', tags: ['equipment', 'tool'] },
  { itemType: 'equipment', id: 3, key: 'scroll.unclean.1', tags: ['scroll', 'unclean'] },
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
  return createItemSearchIndex(buildItemSearchDocuments(catalogRows, translations));
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
  assert.equal(searchItemIndex(index, 'unclean', 'en', 10)[0]?.key, 'scroll.unclean.1');
  assert.equal(searchItemIndex(index, 'companion', 'en', 10)[0]?.itemType, 'pet');
});

test('searchItemIndex supports typo-tolerant item name search', () => {
  const results = searchItemIndex(makeIndex(), 'grapling', 'en', 10);

  assert.equal(results[0]?.key, 'equipment.grappling-hook');
});

test('searchItemIndex respects the result limit', () => {
  const results = searchItemIndex(makeIndex(), 'equipment', 'en', 1);

  assert.equal(results.length, 1);
});
