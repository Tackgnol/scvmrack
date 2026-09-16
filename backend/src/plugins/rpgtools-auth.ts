import fp from 'fastify-plugin';
import type { FastifyInstance } from 'fastify';
import { prismaAdapter, rpgtoolsSharedAuth } from '@tackgnol/rpgtools-shared-auth';
import prisma from '../lib/prisma.js';

const defaultTrustedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'https://scvmrack.rpgtools.co',
  // Owlbear Rodeo embeds the app in a cross-origin iframe (same class as the
  // itch.io embed); its requests originate from www.owlbear.rodeo.
  'https://www.owlbear.rodeo',
];

function envOrDefault(name: string, fallback: string): string {
  return process.env[name] || fallback;
}

export default fp(async function rpgtoolsAuthPlugin(fastify: FastifyInstance) {
  const authBaseUrl = envOrDefault('AUTH_BASE_URL', 'http://localhost:3000/api/auth');
  await fastify.register(rpgtoolsSharedAuth, {
    baseURL: authBaseUrl,
    // itch.io embed support: requests marked with x-embedded-session get
    // SameSite=None; Partitioned cookies so the iframe can hold a session.
    embeddedSessions: true,
    obrExchange: { allowAnonymousIssue: true },
    database: prismaAdapter(prisma, { provider: 'postgresql' }),
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
      endpoint: envOrDefault('LOGTO_ENDPOINT', 'https://auth.rpgtools.co'),
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

  // /api/auth/oauth2/login/logto is provided by the shared-auth plugin since
  // 1.3.0 (it takes a same-origin `returnTo` query param instead of the old
  // local route's `callbackURL`).
  fastify.log.info('rpgtools-shared-auth registered');
});
