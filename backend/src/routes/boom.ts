import type { FastifyPluginAsync } from 'fastify';

const boom: FastifyPluginAsync = async (fastify): Promise<void> => {
  const token = process.env.DEBUG_BOOM_TOKEN;
  if (!token) return;

  fastify.get('/boom', async (request) => {
    if (request.headers['x-debug-token'] !== token) {
      throw fastify.httpErrors.notFound();
    }
    throw new Error(`deliberate-boom-${Date.now()}`);
  });
};

export default boom;
