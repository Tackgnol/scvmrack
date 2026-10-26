import type { FastifyPluginAsync } from 'fastify';
import { HealthResponseSchema } from '../schemas/health.js';

const health: FastifyPluginAsync = async (fastify): Promise<void> => {
  const handler = async () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });

  fastify.get('/health', { schema: { response: { 200: HealthResponseSchema } } }, handler);
};

export default health;
