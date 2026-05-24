import type { FastifyPluginAsync } from 'fastify';

const ALLOWED_PROJECTS = new Set(['6']);

const tunnel: FastifyPluginAsync = async (fastify): Promise<void> => {
  const upstreamHost = process.env.GLITCHTIP_UPSTREAM;
  if (!upstreamHost) {
    fastify.log.warn(
      'GLITCHTIP_UPSTREAM not set; /api/tunnel route not registered'
    );
    return;
  }

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
      let projectId: string;
      let sentryKey: string;
      try {
        const header = JSON.parse(headerLine) as { dsn?: unknown };
        if (typeof header.dsn !== 'string') throw new Error('no dsn');
        const dsnUrl = new URL(header.dsn);
        projectId = dsnUrl.pathname.replace(/^\/+/, '');
        sentryKey = dsnUrl.username;
        if (!sentryKey) throw new Error('no key');
      } catch {
        return reply.code(400).send({ error: 'invalid envelope header' });
      }

      if (!ALLOWED_PROJECTS.has(projectId)) {
        return reply.code(400).send({ error: 'unknown project' });
      }

      const upstream = `${upstreamHost.replace(/\/+$/, '')}/api/${projectId}/envelope/`;
      const response = await fetch(upstream, {
        method: 'POST',
        headers: {
          'content-type': 'application/x-sentry-envelope',
          'x-sentry-auth': `Sentry sentry_version=7, sentry_key=${sentryKey}, sentry_client=scvmrack-tunnel/1.0`,
        },
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
