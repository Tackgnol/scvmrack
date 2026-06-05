import { FastifyPluginAsync } from 'fastify';
import prisma from '../../lib/prisma.js';
import { ErrorSchema } from '../../schemas/equipment.js';
import { searchItems } from '../../lib/item-search-service.js';
import { isSupportedItemType, type SupportedItemType } from '../../lib/item-search.js';
import {
  apiError,
  badRequest,
  normalizeKnownApiError,
  notFound,
  sendApiError,
  type ApiHttpError,
} from '../../errors.js';

function knownOrUnexpected(
  error: unknown,
  code: string,
  message: string
): ApiHttpError {
  return normalizeKnownApiError(error) ?? apiError(500, code, message);
}

async function getItemFullByKey(itemType: SupportedItemType, key: string): Promise<Record<string, unknown> | null> {
  if (itemType === 'weapon') return prisma.weapon.findFirst({ where: { key } }) as Promise<Record<string, unknown> | null>;
  if (itemType === 'armor') return prisma.armor.findFirst({ where: { key } }) as Promise<Record<string, unknown> | null>;
  if (itemType === 'equipment') return prisma.equipment.findFirst({ where: { key } }) as Promise<Record<string, unknown> | null>;
  return prisma.pet.findFirst({ where: { key } }) as Promise<Record<string, unknown> | null>;
}

const equipment: FastifyPluginAsync = async (fastify) => {
  fastify.get<{
    Querystring: { q: string; locale?: string; limit?: number };
  }>(
    '/search',
    {
      config: {
        rateLimit: {
          max: process.env.NODE_ENV === 'test' ? 10000 : 50,
          timeWindow: '1 minute',
        },
      },
      schema: {
        description: 'Search items with fuzzy matching and locale awareness',
        tags: ['items'],
        querystring: {
          type: 'object',
          required: ['q'],
          properties: {
            q: { type: 'string', minLength: 1, maxLength: 100 },
            locale: { type: 'string', default: 'en', enum: ['en', 'pl'] },
            limit: { type: 'integer', default: 20, minimum: 1, maximum: 100 },
          },
        },
        response: {
          200: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                itemType: { type: 'string' },
                id: { type: 'number' },
                key: { type: 'string' },
                name: { type: 'string' },
              },
            },
          },
          400: ErrorSchema,
          429: ErrorSchema,
          500: ErrorSchema,
        },
      },
    },
    async (request, reply) => {
      const { q, locale, limit = 20 } = request.query;

      if (!q || q.trim().length === 0) {
        return sendApiError(
          reply,
          request,
          badRequest('EMPTY_SEARCH_QUERY', 'Search query is required')
        );
      }

      try {
        const mapped = await searchItems(q, locale, limit);
        void reply.header('Cache-Control', 'public, max-age=300, stale-while-revalidate=60');
        return mapped;
      } catch (err) {
        request.log.error(err, 'Search failed');
        throw knownOrUnexpected(err, 'EQUIPMENT_SEARCH_FAILED', 'Search failed');
      }
    }
  );

  fastify.get<{
    Params: {
      itemType: string;
      id: number;
    };
    Querystring: {
      key?: string;
    };
  }>(
    '/:itemType/:id',
    {
      schema: {
        description: 'Fetch full item by type and id',
        tags: ['items'],
        params: {
          type: 'object',
          required: ['itemType', 'id'],
          properties: {
            itemType: {
              type: 'string',
              enum: ['weapon', 'armor', 'equipment', 'pet'],
            },
            id: { type: 'integer', minimum: 1 },
          },
        },
        querystring: {
          type: 'object',
          properties: {
            key: { type: 'string', minLength: 1 },
          },
        },
        response: {
          400: ErrorSchema,
          404: ErrorSchema,
          500: ErrorSchema,
        },
      },
    },
    async (request, reply) => {
      const { itemType, id } = request.params;
      const { key } = request.query;

      try {
        let item: Record<string, unknown> | null = null;
        if (itemType === 'weapon') {
          item = await prisma.weapon.findFirst({ where: { id } }) as Record<string, unknown> | null;
        } else if (itemType === 'armor') {
          item = await prisma.armor.findFirst({ where: { id } }) as Record<string, unknown> | null;
        } else if (itemType === 'equipment') {
          item = await prisma.equipment.findFirst({ where: { id } }) as Record<string, unknown> | null;
        } else if (itemType === 'pet') {
          item = await prisma.pet.findFirst({ where: { id } }) as Record<string, unknown> | null;
        }

        // Fallback for stale search IDs: if the same hit key still exists, resolve by key.
        if (!item && key && isSupportedItemType(itemType)) {
          item = await getItemFullByKey(itemType, key);
        }

        if (!item) {
          return sendApiError(reply, request, notFound('ITEM_NOT_FOUND', 'Item not found'));
        }

        return item;
      } catch (err) {
        request.log.error(err, 'Item fetch failed');
        throw knownOrUnexpected(err, 'ITEM_FETCH_FAILED', 'Failed to fetch item');
      }
    }
  );
};

export default equipment;
