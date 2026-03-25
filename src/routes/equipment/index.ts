import { FastifyPluginAsync } from 'fastify';
import db from '../../services/db.js';
import { getItemFull, searchItems } from '../../queries/equipment.queries.js';

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
                item_type: { type: 'string' },
                id: { type: 'number' },
                key: { type: 'string' },
                name: { type: 'string' },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { q, locale, limit = 20 } = request.query;

      if (!q || q.trim().length === 0) return [];

      try {
        const rows = await searchItems.run({ q, locale, limit }, db);
        return rows.map((r) => ({
          item_type: r.itemType,
          id: r.id,
          key: r.key,
          name: r.name,
        }));
      } catch (err) {
        request.log.error(err, 'Search failed');
        return reply.status(500).send({ error: 'Search failed' });
      }
    }
  );

  fastify.get<{
    Params: {
      itemType: string;
      id: number;
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
      },
    },
    async (request, reply) => {
      const { itemType, id } = request.params;

      try {
        const results = await getItemFull.run({ itemType, id }, db);
        if (results.length === 0 || results[0].getItemFull == null) {
          return reply.status(404).send({ error: 'Item not found' });
        }

        return results[0].getItemFull;
      } catch (err) {
        request.log.error(err, 'Item fetch failed');
        return reply.status(500).send({ error: 'Failed to fetch item' });
      }
    }
  );
};

export default equipment;
