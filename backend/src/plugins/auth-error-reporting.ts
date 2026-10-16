import fp from 'fastify-plugin';
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
    const failure = new URL(location, 'http://localhost').searchParams.get('error');
    if (!failure || !serverFailures.has(failure)) {
      return;
    }

    reportAuthCallbackError(request, failure);
  });
});
