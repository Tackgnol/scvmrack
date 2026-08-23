import type { FastifyPluginAsync } from 'fastify';
import type { JsonSchemaToTsProvider } from '@fastify/type-provider-json-schema-to-ts';
import {
  EnemyBodySchema,
  EnemyCardListSchema,
  EnemyCardsQuerySchema,
  EnemyFullSchema,
  EnemyHealthBodySchema,
  EnemyListSchema,
  RoomEnemyParamsSchema,
  RoomParamsSchema,
} from '../../schemas/enemy.js';
import { ErrorSchema } from '../../schemas/party.js';
import { sendServiceError } from '../../errors.js';
import { createEnemyService } from '../../services/enemy-service.js';

// OBR room enemy board. Room-trust by design: the unguessable OBR room id is
// the capability (see enemy-service.ts). Registered by routes/parties/index.ts
// (not autoloaded directly: @fastify/autoload skips sibling files in a
// directory that has an index file), so it inherits the /api/parties prefix.
const partyEnemies: FastifyPluginAsync = async (fastify): Promise<void> => {
  const app = fastify.withTypeProvider<JsonSchemaToTsProvider>();

  const enemyService = (request: {
    log: Parameters<typeof createEnemyService>[0];
  }) => createEnemyService(request.log);

  // GET /by-room/:roomId/enemies - full stat blocks for OBR room GMs.
  app.get(
    '/by-room/:roomId/enemies',
    {
      schema: {
        description: 'List full enemies for an Owlbear room GM',
        tags: ['enemies'],
        params: RoomParamsSchema,
        response: {
          200: EnemyListSchema,
          400: ErrorSchema,
          404: ErrorSchema,
          500: ErrorSchema,
        },
      },
    },
    async (request, reply) => {
      const result = await enemyService(request).listForOwner({
        roomId: request.params.roomId,
      });

      if (!result.ok) {
        return sendServiceError(reply, request, result.error);
      }
      return result.value;
    }
  );

  // GET /by-room/:roomId/enemies/cards?characterId= - safe player projection.
  app.get(
    '/by-room/:roomId/enemies/cards',
    {
      config: {
        rateLimit: {
          max: process.env.NODE_ENV === 'test' ? 10000 : 30,
          timeWindow: '1 minute',
        },
      },
      schema: {
        description: 'Safe enemy cards for a player bound to the room',
        tags: ['enemies'],
        params: RoomParamsSchema,
        querystring: EnemyCardsQuerySchema,
        response: {
          200: EnemyCardListSchema,
          400: ErrorSchema,
          429: ErrorSchema,
          500: ErrorSchema,
        },
      },
    },
    async (request, reply) => {
      const result = await enemyService(request).listCardsForPlayer({
        roomId: request.params.roomId,
        characterId: request.query.characterId,
      });

      if (!result.ok) {
        return sendServiceError(reply, request, result.error);
      }
      return result.value;
    }
  );

  // POST /by-room/:roomId/enemies - create an enemy for an OBR room.
  app.post(
    '/by-room/:roomId/enemies',
    {
      schema: {
        description: 'Create an enemy for an Owlbear room',
        tags: ['enemies'],
        params: RoomParamsSchema,
        body: EnemyBodySchema,
        response: {
          201: EnemyFullSchema,
          400: ErrorSchema,
          404: ErrorSchema,
          500: ErrorSchema,
        },
      },
    },
    async (request, reply) => {
      const result = await enemyService(request).create({
        roomId: request.params.roomId,
        body: request.body,
      });

      if (!result.ok) {
        return sendServiceError(reply, request, result.error);
      }
      return reply.status(201).send(result.value);
    }
  );

  // PATCH /by-room/:roomId/enemies/:enemyId - full update for an OBR room.
  app.patch(
    '/by-room/:roomId/enemies/:enemyId',
    {
      schema: {
        description: 'Update an enemy for an Owlbear room',
        tags: ['enemies'],
        params: RoomEnemyParamsSchema,
        body: EnemyBodySchema,
        response: {
          200: EnemyFullSchema,
          400: ErrorSchema,
          404: ErrorSchema,
          500: ErrorSchema,
        },
      },
    },
    async (request, reply) => {
      const result = await enemyService(request).update({
        roomId: request.params.roomId,
        enemyId: request.params.enemyId,
        body: request.body,
      });

      if (!result.ok) {
        return sendServiceError(reply, request, result.error);
      }
      return result.value;
    }
  );

  // PATCH /by-room/:roomId/enemies/:enemyId/health - atomic health set.
  app.patch(
    '/by-room/:roomId/enemies/:enemyId/health',
    {
      schema: {
        description: 'Set an enemy current health for an Owlbear room',
        tags: ['enemies'],
        params: RoomEnemyParamsSchema,
        body: EnemyHealthBodySchema,
        response: {
          200: EnemyFullSchema,
          400: ErrorSchema,
          404: ErrorSchema,
          500: ErrorSchema,
        },
      },
    },
    async (request, reply) => {
      const result = await enemyService(request).setHealth({
        roomId: request.params.roomId,
        enemyId: request.params.enemyId,
        currentHealth: request.body.currentHealth,
      });

      if (!result.ok) {
        return sendServiceError(reply, request, result.error);
      }
      return result.value;
    }
  );

  // DELETE /by-room/:roomId/enemies/:enemyId - delete an enemy for an OBR room.
  app.delete(
    '/by-room/:roomId/enemies/:enemyId',
    {
      schema: {
        description: 'Delete an enemy for an Owlbear room',
        tags: ['enemies'],
        params: RoomEnemyParamsSchema,
        response: {
          204: { type: 'null' },
          400: ErrorSchema,
          404: ErrorSchema,
          500: ErrorSchema,
        },
      },
    },
    async (request, reply) => {
      const result = await enemyService(request).remove({
        roomId: request.params.roomId,
        enemyId: request.params.enemyId,
      });

      if (!result.ok) {
        return sendServiceError(reply, request, result.error);
      }
      return reply.status(204).send(null);
    }
  );
};

export default partyEnemies;
