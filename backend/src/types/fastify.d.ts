import 'fastify';

declare module 'fastify' {
  interface FastifyContextConfig {
    rateLimit?: unknown;
  }
}
