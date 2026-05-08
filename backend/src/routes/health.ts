import type { FastifyPluginAsync } from 'fastify';

const health: FastifyPluginAsync = async (fastify): Promise<void> => {
  const handler = async () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });

  fastify.get('/health', handler);
};

export default health;
