import { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';
import auth from '../services/auth.js';

// ============================================
// Types
// ============================================
export interface AppSession {
    id: string;
    userId: string;
    expiresAt: Date;
    isGuest: boolean;
}

// Augment FastifyRequest to include appSession
declare module 'fastify' {
    interface FastifyRequest {
        appSession: AppSession | null;
    }
}

// ============================================
// Guest Session Plugin
// ============================================
const guestSessionPlugin: FastifyPluginAsync = async (fastify): Promise<void> => {
    // Add session to every request
    fastify.addHook('preHandler', async (request: FastifyRequest, _reply: FastifyReply) => {
        // Skip for auth routes - Better Auth handles those
        if (request.url.startsWith('/auth/')) {
            request.appSession = null;
            return;
        }

        // Check for Better Auth session (authenticated or anonymous)
        try {
            const authSession = await auth.api.getSession({
                headers: request.headers as any
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
            request.log.debug('Auth session check failed');
        }

        // No valid session
        request.appSession = null;
    });
};

export default fp(guestSessionPlugin, {
    name: 'guest-session',
    dependencies: ['@fastify/cookie']
});
