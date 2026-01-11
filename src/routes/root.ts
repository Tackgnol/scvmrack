import { FastifyPluginAsync } from 'fastify';

const root: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
  // GET /health
  fastify.get('/health', async () => ({
    status: 'ok',
    timestamp: new Date().toISOString()
  }));

};

export default root;
