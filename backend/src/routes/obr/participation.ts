import type { FastifyPluginAsync } from 'fastify';
import type { JsonSchemaToTsProvider } from '@fastify/type-provider-json-schema-to-ts';
import { sendServiceError } from '../../errors.js';
import { createRoomParticipationService } from '../../services/room-participation-service.js';
import { limitMax } from '../../lib/rate-limits.js';
import {
  RoomParamsSchema as roomParams,
  RoomParticipationSchema,
} from '../../schemas/obr.js';
const participation: FastifyPluginAsync = async (fastify) => {
  const app = fastify.withTypeProvider<JsonSchemaToTsProvider>();
  const config = { rateLimit: { max: limitMax(50), timeWindow: '1 minute' } };
  app.get(
    '/rooms/:roomId/participation',
    {
      config,
      schema: {
        params: roomParams,
        response: { 200: RoomParticipationSchema },
      },
    },
    async (request, reply) => {
      const result = await createRoomParticipationService(
        request.log,
        fastify.partyBus
      ).read(request.params.roomId, request.appSession);
      if (!result.ok) {
        return sendServiceError(reply, request, result.error);
      }
      return result.value;
    }
  );
  app.post(
    '/rooms/:roomId/participation/remove',
    {
      config,
      schema: {
        params: roomParams,
        response: { 200: RoomParticipationSchema },
        body: {
          type: 'object',
          required: ['characterId', 'operationId'],
          additionalProperties: false,
          properties: {
            characterId: { type: 'string', format: 'uuid' },
            operationId: { type: 'string', format: 'uuid' },
          },
        },
      },
    },
    async (request, reply) => {
      const result = await createRoomParticipationService(
        request.log,
        fastify.partyBus
      ).remove({
        ...request.body,
        roomId: request.params.roomId,
        session: request.appSession,
      });
      if (!result.ok) {
        return sendServiceError(reply, request, result.error);
      }
      return result.value;
    }
  );
  app.post(
    '/rooms/:roomId/participation/cleanup/:id/ack',
    {
      config,
      schema: {
        params: {
          ...roomParams,
          required: ['roomId', 'id'],
          properties: {
            ...roomParams.properties,
            id: { type: 'string', format: 'uuid' },
          },
        },
        response: { 200: RoomParticipationSchema },
      },
    },
    async (request, reply) => {
      const result = await createRoomParticipationService(
        request.log
      ).acknowledge(
        request.params.roomId,
        request.params.id,
        request.appSession
      );
      if (!result.ok) {
        return sendServiceError(reply, request, result.error);
      }
      return result.value;
    }
  );
};
export default participation;
