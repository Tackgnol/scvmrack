import fp from 'fastify-plugin';
import { AsyncLocalStorage } from 'node:async_hooks';
import type { FastifyRequest } from 'fastify';
import { authCallbackPath, reportAuthCallbackError } from '../lib/auth-callback-errors.js';

const serverFailures = new Set([
  'unable_to_create_user',
  'unable_to_create_session',
  'unable_to_link_account',
  'internal_server_error',
  'user_info_is_missing',
  'email_is_missing',
  'id_is_missing',
  'name_is_missing',
]);

export default fp(async function authErrorReporting(fastify) {
  const callbacks = new AsyncLocalStorage<FastifyRequest>();
  let sessionCookieName: string | undefined;
  fastify.addHook('onRequest', (request, _reply, done) => {
    if (new URL(request.url, 'http://localhost').pathname === authCallbackPath) {
      callbacks.run(request, done);
    } else {
      done();
    }
  });
  fastify.addHook('onReady', async () => {
    if (!fastify.hasDecorator('auth')) return;
    const context: {
      authCookies: { sessionToken: { name: string } };
      logger: { error: (...args: unknown[]) => void };
    } = await fastify.auth.$context;
    sessionCookieName = context.authCookies.sessionToken.name;
    const originalError = context.logger.error.bind(context.logger);
    // Better Auth collapses server configuration errors and rejected codes into one redirect.
    context.logger.error = (...args) => {
      const request = callbacks.getStore();
      if (request) {
        for (const value of args) {
          if (!value || typeof value !== 'object') continue;
          if ('error' in value && typeof value.error === 'string' &&
            ['invalid_client', 'unauthorized_client', 'invalid_scope', 'server_error', 'temporarily_unavailable'].includes(value.error)) {
            reportAuthCallbackError(request, value.error);
          } else if ('body' in value && value.body && typeof value.body === 'object' &&
            'code' in value.body && value.body.code === 'INVALID_OAUTH_CONFIG') {
            reportAuthCallbackError(request, 'invalid_oauth_config');
          }
        }
      }
      originalError(...args);
    };
  });
  // Better Auth can return failures without throwing to Fastify's error handler.
  fastify.addHook('onResponse', async (request, reply) => {
    if (reply.statusCode >= 500) {
      reportAuthCallbackError(request, `http_${reply.statusCode}`);
      return;
    }
    if (reply.statusCode < 300 || reply.statusCode >= 400) {
      return;
    }
    const incoming = new URL(request.url, 'http://localhost');
    if (
      incoming.pathname !== authCallbackPath || incoming.searchParams.has('error') ||
      !incoming.searchParams.get('code') || !incoming.searchParams.get('state')
    ) {
      return;
    }
    const location = reply.getHeader('location');
    if (typeof location !== 'string') {
      return;
    }
    const outgoing = new URL(location, 'http://localhost');
    const setCookies = reply.getHeader('set-cookie');
    const cookies = Array.isArray(setCookies) ? setCookies : typeof setCookies === 'string' ? [setCookies] : [];
    if (outgoing.pathname !== '/api/auth/error' || cookies.some((cookie) =>
      sessionCookieName && cookie.startsWith(`${sessionCookieName}=`) && !cookie.startsWith(`${sessionCookieName}=;`))) {
      return;
    }
    const failure = outgoing.searchParams.get('error');
    if (!failure || !serverFailures.has(failure)) {
      return;
    }

    reportAuthCallbackError(request, failure);
  });
});
