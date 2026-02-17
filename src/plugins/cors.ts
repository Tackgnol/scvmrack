import fp from 'fastify-plugin';
import cors, { FastifyCorsOptions } from '@fastify/cors';

export default fp<FastifyCorsOptions>(async (fastify) => {
    fastify.register(cors, {
        origin: [
            process.env.CLIENT_ORIGIN,
            process.env.CLIENT_GATEWAY,
        ].filter((origin): origin is string => !!origin),

        methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allowedHeaders: [
            "Content-Type",
            "Authorization",
            "X-Requested-With"
        ],
        credentials: true,
        maxAge: 86400
    });
});
