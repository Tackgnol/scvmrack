import type { FastifyPluginAsync } from 'fastify';
import { createRoomParticipationService } from '../../services/room-participation-service.js';
import { sendServiceError } from '../../errors.js';
import {
  RoomParamsSchema,
  RoomBindingParamsSchema,
  RoomBindingBodySchema,
  RoomCardsQuerySchema,
  RoomBindingsResponseSchema,
} from '../../schemas/obr.js';
import { ErrorSchema } from '../../schemas/equipment.js';
import { roomRouteConfig as config } from './config.js';

const bindings: FastifyPluginAsync = async (fastify) => {
  fastify.get<{
    Params: { roomId: string };
    Querystring: { ids?: string; locale?: string };
  }>(
    '/rooms/:roomId/cards',
    {
      config,
      schema: {
        params: RoomParamsSchema,
        querystring: RoomCardsQuerySchema,
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
    }
  );

  fastify.get<{ Params: { roomId: string } }>(
    '/rooms/:roomId/bindings',
    {
      config,
      schema: {
        params: RoomParamsSchema,
        response: { 200: RoomBindingsResponseSchema, 400: ErrorSchema, 500: ErrorSchema },
      },
    },
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
    const path = `/rooms/:roomId/${kind}s/:bindingId/character`;
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
          ).updateBinding({
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
};
export default bindings;
