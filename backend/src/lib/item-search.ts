import MiniSearch, { type SearchResult } from 'minisearch';
import { isSupportedLocale, resolveLocale, type SupportedLocale } from '../config/locales.js';

export const SUPPORTED_ITEM_TYPES = ['weapon', 'armor', 'equipment', 'pet'] as const;

export type SupportedItemType = (typeof SUPPORTED_ITEM_TYPES)[number];

export type ItemSearchCatalogRow = {
  itemType: SupportedItemType;
  id: number;
  key: string;
  tags: string[];
};

export type ItemSearchTranslationRow = {
  locale: string;
  key: string;
  value: string;
};

export type ItemSearchDocument = {
  id: string;
  itemType: SupportedItemType;
  dbId: number;
  key: string;
  nameEn: string;
  namePl: string;
  names: string;
  tags: string;
  category: string;
};

export type ItemSearchResult = {
  itemType: SupportedItemType;
  id: number;
  key: string;
  name: string;
};

const CATEGORY_ALIASES: Record<SupportedItemType, string> = {
  weapon: 'weapon bron broń uzbrojenie orez oręż arms armament',
  armor: 'armor armour zbroja pancerz ubior ubiór protection shield',
  equipment: 'equipment ekwipunek przedmiot narzedzie narzędzie tool item',
  pet: 'pet zwierzak chowaniec towarzysz companion',
};

const SEARCH_FIELDS = ['names', 'key', 'tags', 'category'];
const STORE_FIELDS = ['itemType', 'dbId', 'key', 'nameEn', 'namePl'];

const SPECIAL_CHARACTER_MAP: Record<string, string> = {
  Ł: 'L',
  ł: 'l',
  Ø: 'O',
  ø: 'o',
  Ð: 'D',
  đ: 'd',
  Æ: 'AE',
  æ: 'ae',
  Œ: 'OE',
  œ: 'oe',
};

export function isSupportedItemType(itemType: unknown): itemType is SupportedItemType {
  return typeof itemType === 'string' && SUPPORTED_ITEM_TYPES.includes(itemType as SupportedItemType);
}

export function normalizeSearchText(value: string): string {
  return value
    .replace(/[ŁłØøÐđÆæŒœ]/g, (char) => SPECIAL_CHARACTER_MAP[char] ?? char)
    .normalize('NFKD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}

function tokenizeSearchText(value: string): string[] {
  return normalizeSearchText(value)
    .split(/[^a-z0-9]+/u)
    .filter((term) => term.length > 0);
}

function processSearchTerm(term: string): string | false {
  const normalized = normalizeSearchText(term).trim();
  return normalized.length > 0 ? normalized : false;
}

export function buildItemSearchDocuments(
  catalogRows: ItemSearchCatalogRow[],
  translations: ItemSearchTranslationRow[],
): ItemSearchDocument[] {
  const translationsByKey = new Map<string, Partial<Record<SupportedLocale, string>>>();

  for (const translation of translations) {
    if (!isSupportedLocale(translation.locale)) {
      continue;
    }

    const locale = translation.locale;
    const existing = translationsByKey.get(translation.key) ?? {};
    existing[locale] = translation.value;
    translationsByKey.set(translation.key, existing);
  }

  return catalogRows.map((row) => {
    const names = translationsByKey.get(row.key) ?? {};
    const nameEn = names.en ?? row.key;
    const namePl = names.pl ?? row.key;

    return {
      id: `${row.itemType}:${row.id}`,
      itemType: row.itemType,
      dbId: row.id,
      key: row.key,
      nameEn,
      namePl,
      names: [row.key, nameEn, namePl].join(' '),
      tags: row.tags.join(' '),
      category: CATEGORY_ALIASES[row.itemType],
    };
  });
}

export function createItemSearchIndex(documents: ItemSearchDocument[]): MiniSearch<ItemSearchDocument> {
  const index = new MiniSearch<ItemSearchDocument>({
    fields: SEARCH_FIELDS,
    storeFields: STORE_FIELDS,
    tokenize: tokenizeSearchText,
    processTerm: processSearchTerm,
    searchOptions: {
      boost: {
        names: 8,
        key: 5,
        tags: 3,
        category: 1,
      },
      combineWith: 'AND',
      prefix: true,
      fuzzy: (term) => (term.length >= 4 ? 0.2 : false),
      weights: {
        prefix: 0.8,
        fuzzy: 0.45,
      },
    },
  });

  index.addAll(documents);
  return index;
}

type StoredItemSearchResult = SearchResult & {
  itemType?: unknown;
  dbId?: unknown;
  key?: unknown;
  nameEn?: unknown;
  namePl?: unknown;
};

export function searchItemIndex(
  index: MiniSearch<ItemSearchDocument>,
  query: string,
  localeInput: unknown,
  limit: number,
): ItemSearchResult[] {
  const normalizedQuery = normalizeSearchText(query).trim();
  if (normalizedQuery.length === 0) {
    return [];
  }

  const locale = resolveLocale(localeInput);

  return index
    .search(normalizedQuery)
    .slice(0, limit)
    .map((result): ItemSearchResult | null => {
      const row = result as StoredItemSearchResult;
      if (
        !isSupportedItemType(row.itemType) ||
        typeof row.dbId !== 'number' ||
        !Number.isFinite(row.dbId) ||
        typeof row.key !== 'string'
      ) {
        return null;
      }

      const localizedName = locale === 'pl' ? row.namePl : row.nameEn;

      return {
        itemType: row.itemType,
        id: row.dbId,
        key: row.key,
        name: typeof localizedName === 'string' && localizedName.length > 0
          ? localizedName
          : row.key,
      };
    })
    .filter((result): result is ItemSearchResult => result !== null);
}
