import type { FastifyPluginAsync } from 'fastify';

const ALLOWED_PROJECTS = new Set(['5', '6']);

const tunnel: FastifyPluginAsync = async (fastify): Promise<void> => {
  fastify.addContentTypeParser(
    'application/x-sentry-envelope',
    { parseAs: 'string' },
    (_req, body, done) => done(null, body)
  );

  fastify.post(
    '/tunnel',
    {
      config: {
        rateLimit: {
          max: process.env.NODE_ENV === 'test' ? 10000 : 60,
          timeWindow: '1 minute',
        },
      },
    },
    async (request, reply) => {
      const envelope = request.body;
      if (typeof envelope !== 'string' || envelope.length === 0) {
        return reply.code(400).send({ error: 'empty envelope' });
      }

      const headerLine = envelope.split('\n', 1)[0];
      let dsnUrl: URL;
      try {
        const header = JSON.parse(headerLine) as { dsn?: unknown };
        if (typeof header.dsn !== 'string') throw new Error('no dsn');
        dsnUrl = new URL(header.dsn);
      } catch {
        return reply.code(400).send({ error: 'invalid envelope header' });
      }

      const projectId = dsnUrl.pathname.replace(/^\/+/, '');
      if (!ALLOWED_PROJECTS.has(projectId)) {
        return reply.code(400).send({ error: 'unknown project' });
      }

      const upstream = `${dsnUrl.protocol}//${dsnUrl.host}/api/${projectId}/envelope/`;
      const response = await fetch(upstream, {
        method: 'POST',
        headers: { 'content-type': 'application/x-sentry-envelope' },
        body: envelope,
      });

      return reply
        .code(response.status)
        .type(response.headers.get('content-type') ?? 'application/json')
        .send(await response.text());
    }
  );
};

export default tunnel;
