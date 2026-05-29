import { FastifyPluginAsync } from 'fastify';
import { Prisma } from '@prisma/client';
import prisma from '../../lib/prisma.js';
import { ErrorSchema } from '../../schemas/equipment.js';
import {
  apiError,
  badRequest,
  normalizeKnownApiError,
  notFound,
  sendApiError,
  type ApiHttpError,
} from '../../errors.js';

type Json = Prisma.JsonValue;

type SupportedItemType = 'weapon' | 'armor' | 'equipment' | 'pet';
type SearchItemRow = {
  item_type: string | null;
  id: number | null;
  key: string | null;
  name: string | null;
};
type ItemFullRow = { getItemFull: Json | null };

function knownOrUnexpected(
  error: unknown,
  code: string,
  message: string
): ApiHttpError {
  return normalizeKnownApiError(error) ?? apiError(500, code, message);
}

async function getItemFullByKey(itemType: SupportedItemType, key: string): Promise<Json | null> {
  if (itemType === 'weapon') {
    const [row] = await prisma.$queryRaw<Array<{ item: Json | null }>>`
      SELECT to_jsonb(w) AS item FROM weapons w WHERE w.key = ${key} LIMIT 1
    `;
    return row?.item ?? null;
  }

  if (itemType === 'armor') {
    const [row] = await prisma.$queryRaw<Array<{ item: Json | null }>>`
      SELECT to_jsonb(a) AS item FROM armors a WHERE a.key = ${key} LIMIT 1
    `;
    return row?.item ?? null;
  }

  if (itemType === 'equipment') {
    const [row] = await prisma.$queryRaw<Array<{ item: Json | null }>>`
      SELECT to_jsonb(e) AS item FROM equipment e WHERE e.key = ${key} LIMIT 1
    `;
    return row?.item ?? null;
  }

  const [row] = await prisma.$queryRaw<Array<{ item: Json | null }>>`
    SELECT to_jsonb(p) AS item FROM pets p WHERE p.key = ${key} LIMIT 1
  `;
  return row?.item ?? null;
}

const equipment: FastifyPluginAsync = async (fastify) => {
  fastify.get<{
    Querystring: { q: string; locale: string; limit?: number };
  }>(
    '/search',
    {
      config: {
        rateLimit: {
          max: process.env.NODE_ENV === 'test' ? 10000 : 30,
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
        const rows = await prisma.$queryRaw<SearchItemRow[]>`
          WITH ranked_matches AS (
              SELECT
                  s.item_type,
                  s.id,
                  s.key,
                  s.name,
                  s.locale,
                  ts_rank(s.document, plainto_tsquery('simple', unaccent(${q}))) AS ts_score,
                  similarity(s.normalized_name, lower(unaccent(${q}))) AS sim_score
              FROM item_search s
              WHERE (
                  s.document @@ plainto_tsquery('simple', unaccent(${q}))
                  OR s.normalized_name % lower(unaccent(${q}))
                  OR s.normalized_name LIKE (lower(unaccent(${q})) || '%')
              )
          ),
          best_matches AS (
              SELECT DISTINCT ON (item_type, id)
                  item_type,
                  id,
                  key,
                  ts_score,
                  sim_score
              FROM ranked_matches
              ORDER BY item_type, id, ts_score DESC, sim_score DESC
          )
          SELECT
              b.item_type,
              b.id,
              b.key,
              COALESCE(t.name, b.key) AS name
          FROM best_matches b
          LEFT JOIN item_search t
              ON t.id = b.id
              AND t.item_type = b.item_type
              AND t.locale = ${locale}
          ORDER BY b.ts_score DESC, b.sim_score DESC
          LIMIT ${limit}
        `;
        return rows
          .map((row) => {
            const itemType = row.item_type;
            if (
              itemType !== 'weapon' &&
              itemType !== 'armor' &&
              itemType !== 'equipment' &&
              itemType !== 'pet'
            ) {
              return null;
            }

            if (typeof row.id !== 'number' || !Number.isFinite(row.id)) {
              return null;
            }

            return {
              itemType,
              id: row.id,
              key: row.key ?? '',
              name: row.name ?? row.key ?? '',
            };
          })
          .filter((row): row is { itemType: 'weapon' | 'armor' | 'equipment' | 'pet'; id: number; key: string; name: string } => row !== null);
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
        const results = await prisma.$queryRaw<ItemFullRow[]>`
          SELECT get_item_full(${itemType}, ${id}) AS "getItemFull"
        `;
        let item = results[0]?.getItemFull ?? null;

        // Fallback for stale search IDs: if the same hit key still exists, resolve by key.
        if (!item && key && (itemType === 'weapon' || itemType === 'armor' || itemType === 'equipment' || itemType === 'pet')) {
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
