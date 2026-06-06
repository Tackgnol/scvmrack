import { FastifyPluginAsync } from 'fastify';
import { ErrorSchema } from '../../schemas/equipment.js';
import { sendServiceError } from '../../errors.js';
import { createEquipmentService } from '../../services/equipment-service.js';

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

      const result = await createEquipmentService(request.log).search({
        q,
        locale,
        limit,
      });

      if (!result.ok) {
        return sendServiceError(reply, request, result.error);
      }

      void reply.header(
        'Cache-Control',
        'public, max-age=300, stale-while-revalidate=60'
      );
      return result.value;
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

      const result = await createEquipmentService(request.log).getItem({
        itemType,
        id,
        key,
      });

      if (!result.ok) {
        return sendServiceError(reply, request, result.error);
      }
      return result.value;
    }
  );
};

export default equipment;
