import fp from 'fastify-plugin';
import cors, { FastifyCorsOptions } from '@fastify/cors';

export default fp<FastifyCorsOptions>(async (fastify) => {
  const defaultOrigins = [
    'http://localhost:5173',
    'https://scvmrack.rpgtools.eu.org',
  ];

  const envOrigins = [process.env.CLIENT_ORIGIN, process.env.CLIENT_GATEWAY]
    .filter((origin): origin is string => !!origin)
    .map((o) => o.trim());

  const origins = Array.from(new Set([...defaultOrigins, ...envOrigins]));

  fastify.register(cors, {
    origin: origins,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-csrf-token'],
    credentials: true,
    maxAge: 3600,
  });
});
