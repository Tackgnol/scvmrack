import fp from 'fastify-plugin';
import cors, { FastifyCorsOptions } from '@fastify/cors';

export default fp<FastifyCorsOptions>(async (fastify) => {
    const defaultOrigins = [
        "http://localhost:5173",
        "https://scvmgrinder.tackgnol.usermd.net",
        "https://scvmgrinder.rpgtools.eu.org"
    ];

    const envOrigins = [
        process.env.CLIENT_ORIGIN,
        process.env.CLIENT_GATEWAY,
    ].filter((origin): origin is string => !!origin);

    const origins = Array.from(new Set([...defaultOrigins, ...envOrigins]));

    // Add versions with port 3000 for direct backend access
    const originsWithPort = origins.map(o => `${o}:3000`);

    fastify.register(cors, {
        origin: [...origins, ...originsWithPort],

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
