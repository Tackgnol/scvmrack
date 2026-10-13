import assert from 'node:assert/strict';
import { mock, test } from 'node:test';

const queries: Array<{ keys: string[]; locales: string[] }> = [];
const rows = [
  { locale: 'pl', key: 'class.a.name', value: 'Wiedźma' },
  { locale: 'en', key: 'class.a.name', value: 'Witch' },
  { locale: 'en', key: 'cc.7.name', value: 'Bog Witch' },
  { locale: 'en', key: 'cc.7.description', value: 'The mire keeps.' },
];
mock.module('../../src/repositories/catalog-repository.js', {
  namedExports: {
    catalogRepository: {
      findTranslationsMultiLocale: async (keys: string[], locales: string[]) => {
        queries.push({ keys, locales });
        return rows.filter((row) => keys.includes(row.key) && locales.includes(row.locale));
      },
    },
  },
});

const { translatedClassTexts } = await import('../../src/lib/class-translations.js');

test('a class list is translated in one query, falling back to each class’s authored language', async () => {
  const texts = await translatedClassTexts('pl', [
    { name: 'Witch', nameKey: 'class.a.name', descriptionKey: null, languages: ['en', 'pl'] },
    { name: 'Bog Witch', nameKey: 'cc.7.name', descriptionKey: 'cc.7.description', languages: ['en'] },
    { name: 'Stored', nameKey: 'cc.8.name', descriptionKey: 'cc.8.description', languages: ['pl'] },
  ]);

  assert.deepEqual(texts, [
    { name: 'Wiedźma', description: null },
    { name: 'Bog Witch', description: 'The mire keeps.' },
    { name: 'Stored', description: null },
  ]);
  assert.equal(queries.length, 1);
  assert.deepEqual(queries[0].locales, ['pl', 'en']);
});
