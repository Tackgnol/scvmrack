import { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';
import crypto from 'crypto';
import { query, queryOne } from '../services/db.js';
import auth from '../services/auth.js';

// ============================================
// Types
// ============================================
export interface AppSession {
    id: string;
    userId: string | null;
    expiresAt: Date;
    isGuest: boolean;
    guestSessionId: string | null;  // Original guest session ID (for claiming after auth)
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
    fastify.addHook('preHandler', async (request: FastifyRequest, reply: FastifyReply) => {
        // Skip for auth routes - Better Auth handles those
        if (request.url.startsWith('/auth/')) {
            request.appSession = null;
            return;
        }

        // 1. Check for Better Auth session (authenticated user)
        try {
            const authSession = await auth.api.getSession({
                headers: request.headers as any
            });

            if (authSession?.session && authSession?.user) {
                const isAnonymous = Boolean((authSession.user as any).isAnonymous);
                // Better Auth session (authenticated or anonymous guest).
                const guestSessionId = request.cookies?.['guest-session'] || null;

                request.appSession = {
                    id: authSession.session.id,
                    userId: authSession.user.id,
                    expiresAt: new Date(authSession.session.expiresAt),
                    isGuest: isAnonymous,
                    guestSessionId
                };
                return;
            }
        } catch (err) {
            // Auth check failed, continue to guest session
            request.log.debug('Auth session check failed, trying guest session');
        }

        // 2. Check for existing guest session cookie
        const guestSessionId = request.cookies?.['guest-session'];

        if (guestSessionId) {
            // Validate guest session exists and not expired
            const guestSession = await queryOne<{ id: string; expires_at: Date }>(
                `SELECT id, expires_at FROM guest_sessions
                 WHERE id = $1 AND expires_at > NOW()`,
                [guestSessionId]
            );

            if (guestSession) {
                request.appSession = {
                    id: guestSession.id,
                    userId: null,
                    expiresAt: new Date(guestSession.expires_at),
                    isGuest: true,
                    guestSessionId: guestSession.id  // Same as id for guests
                };
                return;
            }

            // Invalid/expired session - clear the cookie
            reply.clearCookie('guest-session', { path: '/' });
        }

        // 3. Create new guest session
        const newSessionId = crypto.randomUUID();
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

        await query(
            `INSERT INTO guest_sessions (id, expires_at, created_at)
             VALUES ($1, $2, NOW())`,
            [newSessionId, expiresAt]
        );

        reply.setCookie('guest-session', newSessionId, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            expires: expiresAt
        });

        request.appSession = {
            id: newSessionId,
            userId: null,
            expiresAt,
            isGuest: true,
            guestSessionId: newSessionId  // Same as id for guests
        };

        request.log.info({ sessionId: newSessionId }, 'Created new guest session');
    });
};

export default fp(guestSessionPlugin, {
    name: 'guest-session',
    dependencies: ['@fastify/cookie']
});
