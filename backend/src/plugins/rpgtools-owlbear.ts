import fp from 'fastify-plugin';
import type { FastifyInstance } from 'fastify';
import { createRoomParticipationService } from '../services/room-participation-service.js';
import { sendServiceError } from '../errors.js';
import {
  RoomParamsSchema,
  RoomBindingParamsSchema,
  RoomBindingBodySchema,
} from '../schemas/obr.js';
import { limitMax } from '../lib/rate-limits.js';

export default fp(
  async function rpgtoolsOwlbearPlugin(fastify: FastifyInstance) {
    const config = { rateLimit: { max: limitMax(50), timeWindow: '1 minute' } };
    fastify.get<{
      Params: { roomId: string };
      Querystring: { ids?: string; locale?: string };
    }>(
      '/api/obr/rooms/:roomId/cards', {
        config,
        schema: {
          params: RoomParamsSchema,
          querystring: {
            type: 'object',
            properties: {
              ids: { type: 'string', maxLength: 2000 },
              locale: { type: 'string', enum: ['en', 'pl'] },
            },
          },
        },
      },
      async (request, reply) => {
        const result = await createRoomParticipationService(request.log).cards(
          request.params.roomId,
          (request.query.ids ?? '').split(','),
          request.query.locale ?? 'en'
        );
        if (!result.ok) {
          return sendServiceError(reply, request, result.error);
      }
        return result.value;
      });

    fastify.get<{ Params: { roomId: string } }>(
      '/api/obr/rooms/:roomId/bindings',
      { config, schema: { params: RoomParamsSchema } },
      async (request, reply) => {
        const result = await createRoomParticipationService(request.log).read(
          request.params.roomId,
          request.appSession
        );
        if (!result.ok) {
          return sendServiceError(reply, request, result.error);
        }
        return {
          roomId: request.params.roomId,
          players: result.value.players,
          tokens: result.value.tokens,
        };
      }
);
    for (const kind of ['player', 'token'] as const) {
      const path = `/api/obr/rooms/:roomId/${kind}s/:bindingId/character`;
      for (const method of ['PUT', 'DELETE'] as const) {
        fastify.route<{
          Params: { roomId: string; bindingId: string };
          Body: {
            characterId: string;
            playerId?: string;
            connectionId?: string;
          };
        }>({
          method,
          url: path,
          config,
          schema: {
            params: RoomBindingParamsSchema,
            ...(method === 'PUT' ? { body: RoomBindingBodySchema } : {}),
          },
          handler: async (request, reply) => {
            const result = await createRoomParticipationService(
              request.log
            ).bind({
              roomId: request.params.roomId,
              id: request.params.bindingId,
              kind,
              ...(request.method === 'PUT' ? request.body : {}),
              session: request.appSession,
            });
            if (!result.ok) {
              return sendServiceError(reply, request, result.error);
            }
            return request.method === 'DELETE'
              ? reply.code(204).send()
              : result.value;
          },
        });
      }
    }
  },
  { dependencies: ['swagger'] }
);
