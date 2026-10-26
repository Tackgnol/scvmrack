import type { FastifyPluginAsync } from 'fastify';
import type { JsonSchemaToTsProvider } from '@fastify/type-provider-json-schema-to-ts';
import { sendServiceError } from '../../errors.js';
import {
  CharacterSchema,
  ErrorSchema,
  LocaleQuerySchema,
} from '../../schemas/character.js';
import { ObrPlayerParamsSchema } from '../../schemas/obr.js';
import { createObrAssignmentService } from '../../services/obr-assignment-service.js';
import { limitMax } from '../../lib/rate-limits.js';
import participation from './participation.js';
import bindings from './bindings.js';

const obrRoutes: FastifyPluginAsync = async (fastify) => {
  await fastify.register(participation);
  await fastify.register(bindings);
  const app = fastify.withTypeProvider<JsonSchemaToTsProvider>();

  app.post(
    '/rooms/:roomId/players/:playerId/character/claim',
    {
      config: {
        rateLimit: {
          max: limitMax(30),
          timeWindow: '1 minute',
        },
      },
      schema: {
        description: 'Claim the scvm assigned to the current Owlbear player.',
        tags: ['obr'],
        params: ObrPlayerParamsSchema,
        querystring: LocaleQuerySchema,
        response: {
          200: CharacterSchema,
          400: ErrorSchema,
          401: ErrorSchema,
          404: ErrorSchema,
          500: ErrorSchema,
        },
      },
    },
    async (request, reply) => {
      const result = await createObrAssignmentService(
        request.log
      ).claimAssignedPlayerCharacter({
        session: request.appSession,
        roomId: request.params.roomId,
        playerId: request.params.playerId,
        locale: request.query.locale ?? 'en',
      });

      if (!result.ok) {
        return sendServiceError(reply, request, result.error);
      }

      return result.value;
    }
  );
};

export default obrRoutes;
