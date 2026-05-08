import fp from 'fastify-plugin';
import type { FastifyInstance } from 'fastify';
import { rpgtoolsSharedAuth } from '@tackgnol/rpgtools-shared-auth';
import prisma from '../lib/prisma.js';

const defaultTrustedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://scvmrack.rpgtools.eu.org',
];

function envOrDefault(name: string, fallback: string): string {
  return process.env[name] || fallback;
}

export default fp(async function rpgtoolsAuthPlugin(fastify: FastifyInstance) {
  const authBaseUrl = envOrDefault('AUTH_BASE_URL', 'http://localhost:3000/api/auth');
  const appBaseUrl = envOrDefault('APP_BASE_URL', process.env.CLIENT_ORIGIN || 'http://localhost:5173');
  await fastify.register(rpgtoolsSharedAuth, {
    baseURL: authBaseUrl,
    trustedOrigins: Array.from(
      new Set(
        [
          ...defaultTrustedOrigins,
          process.env.CLIENT_ORIGIN,
          process.env.CLIENT_GATEWAY,
        ].filter((origin): origin is string => Boolean(origin))
      )
    ),
    logto: {
      endpoint: envOrDefault('LOGTO_ENDPOINT', 'https://auth.rpgtools.eu.org'),
      clientId: envOrDefault('LOGTO_APP_ID', 'dev-logto-app-id'),
      clientSecret: envOrDefault('LOGTO_APP_SECRET', 'dev-logto-app-secret'),
      redirectUri: envOrDefault(
        'LOGTO_REDIRECT_URI',
        'http://localhost:3000/api/auth/oauth2/callback/logto'
      ),
    },
    onLinkAccount: async ({ anonymousUser, newUser }) => {
      await prisma.character.updateMany({
        where: { userId: anonymousUser.user.id },
        data: { userId: newUser.user.id },
      });
    },
    db: {
      character: {
        findUnique: async ({ where }) =>
          prisma.character.findFirst({
            where: { id: where.id, userId: where.userId },
          }),
        update: async ({ where, data }) =>
          prisma.character.update({
            where: { id: where.id },
            data,
          }),
      },
      claimCode: {
        create: (args) => prisma.claimCode.create(args),
        findUnique: (args) => prisma.claimCode.findUnique(args),
        delete: (args) => prisma.claimCode.delete(args),
      },
    },
  });

  fastify.get('/api/auth/oauth2/login/logto', async (request, reply) => {
    const query = request.query as { callbackURL?: string } | undefined;
    const callbackURL = query?.callbackURL || appBaseUrl;
    const headers = new Headers();

    for (const [key, value] of Object.entries(request.headers)) {
      if (Array.isArray(value)) {
        headers.set(key, value.join(', '));
      } else if (value) {
        headers.set(key, String(value));
      }
    }

    headers.set('content-type', 'application/json');

    const response = await fastify.auth.handler(
      new Request(`${authBaseUrl}/sign-in/oauth2`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          providerId: 'logto',
          callbackURL,
        }),
      })
    );

    const setCookies = response.headers.getSetCookie ? response.headers.getSetCookie() : [];
    if (setCookies.length > 0) {
      reply.header('set-cookie', setCookies);
    }

    const contentType = response.headers.get('content-type');
    const text = await response.text();

    if (!response.ok) {
      return reply.status(response.status).send(text);
    }

    if (!contentType?.includes('application/json')) {
      return reply.status(response.status).send(text);
    }

    const payload = JSON.parse(text) as { url?: string };
    if (!payload.url) {
      return reply.status(502).send({ error: 'missing_oauth_redirect_url' });
    }

    return reply.redirect(payload.url);
  });

  fastify.log.info('rpgtools-shared-auth registered');
});
