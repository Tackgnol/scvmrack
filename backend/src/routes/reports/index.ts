import type { FastifyPluginAsync } from 'fastify';
import type { JsonSchemaToTsProvider } from '@fastify/type-provider-json-schema-to-ts';
import { randomUUID } from 'node:crypto';
import { sendServiceError } from '../../errors.js';
import { ErrorSchema } from '../../schemas/equipment.js';
import {
  ModerationReportBodySchema,
  ModerationReportResponseSchema,
} from '../../schemas/moderation.js';
import { createModerationService } from '../../services/moderation-service.js';
import { limitMax } from '../../lib/rate-limits.js';

const reports: FastifyPluginAsync = async (fastify) => {
  const app = fastify.withTypeProvider<JsonSchemaToTsProvider>();
  app.post(
    '/',
    {
      config: {
        rateLimit: {
          max: limitMax(5),
          timeWindow: '1 hour',
        },
      },
      schema: {
        description:
          'Submit a signed-out report about a class for human review',
        tags: ['reports'],
        body: ModerationReportBodySchema,
        response: {
          201: ModerationReportResponseSchema,
          400: ErrorSchema,
          404: ErrorSchema,
          429: ErrorSchema,
          500: ErrorSchema,
        },
      },
    },
    async (request, reply) => {
      if (request.body.website?.trim())
        return reply.code(201).send({ id: randomUUID() });
      const result = await createModerationService(request.log).submit(
        request.body
      );
      if (!result.ok) return sendServiceError(reply, request, result.error);
      return reply.code(201).send(result.value);
    }
  );
};
export default reports;
