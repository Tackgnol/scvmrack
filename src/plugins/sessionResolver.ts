import { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';
import auth from '../services/auth.js';

export interface AppSession {
  id: string;
  userId: string;
  expiresAt: Date;
  isGuest: boolean;
}

declare module 'fastify' {
  interface FastifyRequest {
    appSession: AppSession | null;
  }
}

const sessionResolverPlugin: FastifyPluginAsync = async (
  fastify
): Promise<void> => {
  fastify.addHook(
    'preHandler',
    async (request: FastifyRequest, _reply: FastifyReply) => {
      if (request.url.startsWith('/auth/')) {
        request.appSession = null;
        return;
      }
      try {
        const authSession = await auth.api.getSession({
          headers: request.headers as any,
        });
        if (authSession?.session && authSession?.user) {
          const isAnonymous = Boolean((authSession.user as any).isAnonymous);
          request.appSession = {
            id: authSession.session.id,
            userId: authSession.user.id,
            expiresAt: new Date(authSession.session.expiresAt),
            isGuest: isAnonymous,
          };
          return;
        }
      } catch (err) {
        request.log.debug({ err }, 'Auth session check failed');
      }
      request.appSession = null;
    }
  );
};

export default fp(sessionResolverPlugin, {
  name: 'session-resolver',
  dependencies: ['@fastify/cookie'],
});
