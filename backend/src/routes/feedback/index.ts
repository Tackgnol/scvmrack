import type { FastifyPluginAsync } from 'fastify';
import type { JsonSchemaToTsProvider } from '@fastify/type-provider-json-schema-to-ts';
import { FeedbackBodySchema, FeedbackResponseSchema } from '../../schemas/feedback.js';
import { ErrorSchema } from '../../schemas/equipment.js';
import { sendServiceError } from '../../errors.js';
import { createFeedbackService } from '../../services/feedback-service.js';

const feedback: FastifyPluginAsync = async (fastify) => {
  const app = fastify.withTypeProvider<JsonSchemaToTsProvider>();

  // POST /api/feedback - Forward a user feedback / unexpected-error report to GlitchTip
  app.post(
    '/',
    {
      config: {
        rateLimit: {
          max: process.env.NODE_ENV === 'test' ? 10000 : 20,
          timeWindow: '1 minute',
        },
      },
      schema: {
        description:
          'Submit a user feedback or unexpected-error report; forwarded to GlitchTip server-side.',
        tags: ['feedback'],
        body: FeedbackBodySchema,
        response: {
          200: FeedbackResponseSchema,
          400: ErrorSchema,
          429: ErrorSchema,
          500: ErrorSchema,
        },
      },
    },
    async (request, reply) => {
      const result = createFeedbackService(request.log).submit(request.body);

      if (!result.ok) {
        return sendServiceError(reply, request, result.error);
      }

      const { eventId, forwarded } = result.value;
      if (!forwarded) {
        request.log.info(
          { requestId: request.id, source: request.body.source },
          'Feedback received but Sentry is not configured; skipping forward'
        );
      } else {
        request.log.info(
          { requestId: request.id, eventId, kind: request.body.kind },
          'Feedback forwarded to GlitchTip'
        );
      }

      return { eventId };
    }
  );
};

export default feedback;
