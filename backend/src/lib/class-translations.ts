import { catalogRepository } from '../repositories/catalog-repository.js';

/** The language a one-language class falls back to when it isn't written in `locale`, else null. */
function authoredLanguage(locale: string, classLanguages: readonly string[]): string | null {
  return classLanguages.length > 0 && !classLanguages.includes(locale) ? classLanguages[0] : null;
}

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
  const fallback = authoredLanguage(locale, classLanguages);
  if (fallback) {
    const missing = keys.filter((key) => !translations.has(key));
    for (const row of await catalogRepository.findTranslations(fallback, missing)) {
      translations.set(row.key, row.value);
    }
  }
  return translations;
}

type ClassText = {
  name: string;
  nameKey: string | null;
  descriptionKey: string | null;
  languages: readonly string[];
};

/**
 * Each class's name and description in the reader's locale, in one query for the whole list.
 * A class written in one language falls back to its authored language, then the name to the
 * stored `name`; a description with no translation is null.
 */
export async function translatedClassTexts(
  locale: string,
  classes: readonly ClassText[],
): Promise<Array<{ name: string; description: string | null }>> {
  const authoredFallback = (cls: ClassText) => authoredLanguage(locale, cls.languages);
  const keys = classes.flatMap((cls) =>
    [cls.nameKey, cls.descriptionKey].filter((k): k is string => k !== null)
  );
  const locales = new Set([locale, ...classes.flatMap((cls) => authoredFallback(cls) ?? [])]);
  const rows = await catalogRepository.findTranslationsMultiLocale(keys, [...locales]);
  const text = new Map(rows.map((row) => [`${row.locale}:${row.key}`, row.value]));
  return classes.map((cls) => {
    const fallback = authoredFallback(cls);
    const get = (key: string | null) =>
      key === null
        ? undefined
        : text.get(`${locale}:${key}`) ?? (fallback ? text.get(`${fallback}:${key}`) : undefined);
    return { name: get(cls.nameKey) ?? cls.name, description: get(cls.descriptionKey) ?? null };
  });
}
