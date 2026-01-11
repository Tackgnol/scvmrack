import fp from 'fastify-plugin';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import {FastifyInstance} from 'fastify';

export default fp(async function securityPlugin(fastify: FastifyInstance) {
    // Security headers (XSS, clickjacking, MIME sniffing, etc.)
    await fastify.register(helmet, {
        contentSecurityPolicy: false,  // Disable if you have a frontend
    });

    // Rate limiting
    await fastify.register(rateLimit, {
        max: 100,
        timeWindow: '1 minute',
        // Optional: different limits for different routes
        // keyGenerator: (request) => request.ip
    });

    fastify.log.info('Security plugins loaded');
});
