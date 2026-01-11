import fp from 'fastify-plugin';
import cors, { FastifyCorsOptions } from '@fastify/cors';

export default fp<FastifyCorsOptions>(async (fastify) => {
    await fastify.register(cors, {
        origin: [
            'http://localhost:5173',
            'http://127.0.0.1:5173',
            // Add production URL later
        ],
        credentials: true,
        methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    });
});
