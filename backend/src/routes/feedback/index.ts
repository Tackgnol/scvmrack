import { FastifyPluginAsync } from 'fastify';
import * as Sentry from '@sentry/node';
import { recordFeedback, type FeedbackInput, type FeedbackSentry } from '../../feedback.js';
import { FeedbackBodySchema, FeedbackResponseSchema } from '../../schemas/feedback.js';
import { ErrorSchema } from '../../schemas/equipment.js';

// Adapter over the Sentry namespace so recordFeedback stays decoupled from the SDK.
const sentryAdapter: FeedbackSentry = {
  withScope: (callback) => Sentry.withScope((scope) => callback(scope)),
  captureException: (error) => Sentry.captureException(error),
  captureFeedback: (feedback, hint) => Sentry.captureFeedback(feedback, hint),
};

const feedback: FastifyPluginAsync = async (fastify) => {
  // POST /api/feedback - Forward a user feedback / unexpected-error report to GlitchTip
  fastify.post<{ Body: FeedbackInput }>(
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
    async (request) => {
      if (!Sentry.isInitialized()) {
        request.log.info(
          { requestId: request.id, source: request.body.source },
          'Feedback received but Sentry is not configured; skipping forward'
        );
        return { eventId: '' };
      }

      const { eventId } = recordFeedback(request.body, sentryAdapter);
      request.log.info(
        { requestId: request.id, eventId, kind: request.body.kind },
        'Feedback forwarded to GlitchTip'
      );

      return { eventId };
    }
  );
};

export default feedback;
