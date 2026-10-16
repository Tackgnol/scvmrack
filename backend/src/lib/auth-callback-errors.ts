import type { FastifyReply, FastifyRequest } from 'fastify';
import * as Sentry from '@sentry/node';

export const authCallbackPath = '/api/auth/oauth2/callback/logto';
const reportedRequests = new WeakSet<FastifyRequest>();

/** Whether a raw request target is the Logto callback (never throws, unlike `new URL` on a malformed target). */
export function isAuthCallback(url: string): boolean {
  return url.split('?', 1)[0] === authCallbackPath;
}

/** Leave callback exceptions to the sanitized reporter instead of automatic capture. */
export function shouldReportFastifyError(_error: unknown, request: object, reply: Pick<FastifyReply, 'statusCode'>): boolean {
  const isCallback = 'url' in request && typeof request.url === 'string' && isAuthCallback(request.url);
  return reply.statusCode >= 500 && !isCallback;
}

/** Report a callback failure once, excluding OAuth and profile data from its event. */
export function reportAuthCallbackError(request: FastifyRequest, failure: string): boolean {
  if (!isAuthCallback(request.url)) {
    return false;
  }
  if (reportedRequests.has(request)) {
    return true;
  }
  request.log.error({ authFailure: failure }, 'Logto callback failed');
  if (!Sentry.isInitialized()) {
    return false;
  }
  reportedRequests.add(request);
  Sentry.withScope((scope) => {
    // OAuth request data and library breadcrumbs can contain codes, tokens, and profiles.
    scope.addEventProcessor((event) => ({
      event_id: event.event_id,
      timestamp: event.timestamp,
      platform: event.platform,
      level: 'error',
      exception: event.exception,
      release: event.release,
      environment: event.environment,
      sdk: event.sdk,
      tags: { source: 'backend', auth_provider: 'logto', auth_failure: failure },
      contexts: { auth_callback: { request_id: request.id, provider: 'logto' } },
      request: { method: request.method, url: authCallbackPath },
      transaction: `GET ${authCallbackPath}`,
      fingerprint: ['auth_callback', failure],
    }));
    Sentry.captureException(new Error(`Logto callback failed: ${failure}`));
  });
  return true;
}
