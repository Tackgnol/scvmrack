import type { FastifyPluginAsync } from 'fastify';
import type { JsonSchemaToTsProvider } from '@fastify/type-provider-json-schema-to-ts';
import { sendServiceError } from '../../errors.js';
import { ErrorSchema } from '../../schemas/equipment.js';
import {
  ModerationReportBodySchema,
  ModerationReportResponseSchema,
} from '../../schemas/moderation.js';
import { createModerationService } from '../../services/moderation-service.js';
import { reportLimit } from '../../lib/rate-limits.js';

const reports: FastifyPluginAsync = async (fastify) => {
  const app = fastify.withTypeProvider<JsonSchemaToTsProvider>();
  app.post(
    '/',
    {
      config: reportLimit,
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
      const result = await createModerationService(request.log).submit(
        request.body
      );
      if (!result.ok) {
        return sendServiceError(reply, request, result.error);
      }
      return reply.code(201).send(result.value);
    }
  );
};
export default reports;
