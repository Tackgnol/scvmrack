import { catalogRepository } from '../repositories/catalog-repository.js';

/**
 * Translations for `keys` in the reader's locale. A class written in one
 * language (its `languages` lacks the locale) fills missing rows from its
 * authored language, `languages[0]`.
 */
export async function findTranslationsWithAuthoredFallback(
  locale: string,
  classLanguages: readonly string[],
  keys: string[],
): Promise<Map<string, string>> {
  const rows = await catalogRepository.findTranslations(locale, keys);
  const translations = new Map(rows.map((row) => [row.key, row.value]));
  if (classLanguages.length > 0 && !classLanguages.includes(locale)) {
    const missing = keys.filter((key) => !translations.has(key));
    for (const row of await catalogRepository.findTranslations(classLanguages[0], missing)) {
      translations.set(row.key, row.value);
    }
  }
  return translations;
}
