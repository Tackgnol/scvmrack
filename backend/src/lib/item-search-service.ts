import { catalogRepository } from '../repositories/catalog-repository.js';
import {
  buildItemSearchDocuments,
  createItemSearchIndex,
  searchItemIndex,
  type ItemSearchCatalogRow,
  type ItemSearchDocument,
  type ItemSearchResult,
} from './item-search.js';

const SEARCH_INDEX_TTL_MS = 5 * 60 * 1000;

type ItemSearchCache = {
  index: ReturnType<typeof createItemSearchIndex>;
  expiresAt: number;
};

let cachedSearch: ItemSearchCache | null = null;
let pendingSearchBuild: Promise<ItemSearchCache> | null = null;

async function loadItemSearchDocuments(): Promise<ItemSearchDocument[]> {
  const { weapons, armors, equipment, pets } = await catalogRepository.findAllItemsForSearch();

  const catalogRows: ItemSearchCatalogRow[] = [
    ...weapons.map((item) => ({ itemType: 'weapon' as const, ...item })),
    ...armors.map((item) => ({ itemType: 'armor' as const, ...item })),
    ...equipment.map((item) => ({ itemType: 'equipment' as const, ...item })),
    ...pets.map((item) => ({ itemType: 'pet' as const, ...item })),
  ];

  const keys = catalogRows.map((item) => item.key);
  const translations = await catalogRepository.findTranslationsMultiLocale(keys, ['en', 'pl']);

  return buildItemSearchDocuments(catalogRows, translations);
}

async function buildItemSearchCache(): Promise<ItemSearchCache> {
  const documents = await loadItemSearchDocuments();

  return {
    index: createItemSearchIndex(documents),
    expiresAt: Date.now() + SEARCH_INDEX_TTL_MS,
  };
}

async function getItemSearchCache(): Promise<ItemSearchCache> {
  if (cachedSearch && cachedSearch.expiresAt > Date.now()) {
    return cachedSearch;
  }

  if (!pendingSearchBuild) {
    pendingSearchBuild = buildItemSearchCache()
      .then((nextCache) => {
        cachedSearch = nextCache;
        return nextCache;
      })
      .finally(() => {
        pendingSearchBuild = null;
      });
  }

  return pendingSearchBuild;
}

export async function searchItems(
  query: string,
  locale: unknown,
  limit: number,
): Promise<ItemSearchResult[]> {
  const cache = await getItemSearchCache();
  return searchItemIndex(cache.index, query, locale, limit);
}

export function clearItemSearchCache(): void {
  cachedSearch = null;
  pendingSearchBuild = null;
}
