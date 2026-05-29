import fp from 'fastify-plugin';
import * as Sentry from '@sentry/node';
import type { FastifyError } from 'fastify';
import {
  apiError,
  normalizeApiError,
  toApiErrorPayload,
} from '../errors.js';

export default fp(async function errorHandlerPlugin(fastify) {
  fastify.setErrorHandler((error: FastifyError, request, reply) => {
    const api = normalizeApiError(error);

    if (api.statusCode >= 500) {
      request.log.error({ err: error, requestId: request.id }, api.message);
      if (Sentry.isInitialized()) {
        Sentry.captureException(error);
      }
    } else {
      request.log.info(
        { err: error, requestId: request.id, statusCode: api.statusCode },
        api.message
      );
    }

    return reply
      .status(api.statusCode)
      .send(toApiErrorPayload(api, request.id));
  });

  fastify.setNotFoundHandler((request, reply) => {
    const api = apiError(
      404,
      'ROUTE_NOT_FOUND',
      `Route ${request.method} ${request.url} not found`
    );

    return reply.status(404).send(toApiErrorPayload(api, request.id));
  });
});
