import { FastifyPluginAsync } from 'fastify';
import { query } from '../../services/db.js';

const sessionRoutes: FastifyPluginAsync = async (fastify): Promise<void> => {

    // GET /session/info - Get session info for frontend
    fastify.get('/info', async (request, reply) => {
        const session = request.appSession;

        if (!session) {
            return reply.status(401).send({ error: 'No session' });
        }

        const now = new Date();
        const daysUntilExpiry = (session.expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);

        return reply.send({
            isGuest: session.isGuest,
            isAuthenticated: !session.isGuest,
            expiresAt: session.expiresAt.toISOString(),
            daysUntilExpiry: Math.floor(daysUntilExpiry),
            // Only legacy guest sessions can be extended. Anonymous Better Auth
            // sessions have their own lifecycle and are renewed by auth.
            canExtend: session.isGuest && !session.userId && daysUntilExpiry <= 3,
        });
    });

    // POST /session/extend - Extend guest session by 7 days
    fastify.post('/extend', async (request, reply) => {
        const session = request.appSession;

        if (!session) {
            return reply.status(401).send({ error: 'No session' });
        }

        if (!session.isGuest || session.userId) {
            return reply.status(400).send({ error: 'Only guest sessions can be extended' });
        }

        const now = new Date();
        const daysUntilExpiry = (session.expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);

        // Only allow extending if within last 3 days of expiry
        if (daysUntilExpiry > 3) {
            return reply.status(400).send({
                error: 'Too early to extend',
                expiresAt: session.expiresAt.toISOString(),
                canExtendAt: new Date(session.expiresAt.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            });
        }

        // Extend by 7 days from now
        const newExpiry = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

        await query(
            `UPDATE guest_sessions SET expires_at = $1 WHERE id = $2`,
            [newExpiry, session.id]
        );

        // Update cookie
        reply.setCookie('guest-session', session.id, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            expires: newExpiry
        });

        return reply.send({
            extended: true,
            expiresAt: newExpiry.toISOString(),
        });
    });
};

export default sessionRoutes;
