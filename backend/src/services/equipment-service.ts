import { searchItems } from '../lib/item-search-service.js';
import { isSupportedItemType } from '../lib/item-search.js';
import { equipmentRepository } from '../repositories/equipment-repository.js';
import { badRequest, notFound } from '../errors.js';
import {
  fail,
  ok,
  unexpected,
  type ServiceLogger,
  type ServiceResult,
} from './result.js';

/**
 * Item search and lookup logic behind a stable {@link ServiceResult}. Data
 * access goes through the equipment repository (by-id/by-key) and the existing
 * fuzzy-search index.
 */
export function createEquipmentService(log: ServiceLogger) {
  return {
    async search(input: {
      q: string;
      locale?: string;
      limit: number;
    }): Promise<ServiceResult<Awaited<ReturnType<typeof searchItems>>>> {
      if (!input.q || input.q.trim().length === 0) {
        return fail(badRequest('EMPTY_SEARCH_QUERY', 'Search query is required'));
      }

      try {
        return ok(await searchItems(input.q, input.locale, input.limit));
      } catch (err) {
        return fail(unexpected(log, err, 'EQUIPMENT_SEARCH_FAILED', 'Search failed'));
      }
    },

    async getItem(input: {
      itemType: string;
      id: number;
      key?: string;
    }): Promise<ServiceResult<unknown>> {
      // The route schema restricts itemType to the supported enum; guard anyway.
      if (!isSupportedItemType(input.itemType)) {
        return fail(notFound('ITEM_NOT_FOUND', 'Item not found'));
      }

      try {
        let item = await equipmentRepository.findById(input.itemType, input.id);

        // Fallback for stale search IDs: if the same hit key still exists,
        // resolve by key.
        if (!item && input.key) {
          item = await equipmentRepository.findByKey(input.itemType, input.key);
        }

        if (!item) {
          return fail(notFound('ITEM_NOT_FOUND', 'Item not found'));
        }
        return ok(item);
      } catch (err) {
        return fail(unexpected(log, err, 'ITEM_FETCH_FAILED', 'Failed to fetch item'));
      }
    },
  };
}
