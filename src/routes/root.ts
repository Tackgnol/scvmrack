import { FastifyPluginAsync } from 'fastify';
import fastifyStatic from '@fastify/static';
import { access, readFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import { join } from 'node:path';

const apiPrefixes = [
  '/auth',
  '/characters',
  '/equipment',
  '/session',
  '/health',
];

const STATIC_PREFIXES = [
  '/assets',
  '/static',
  '/favicon',
  '/fonts',
];

const spaIndexCandidates = [
  join(process.cwd(), 'client', 'public', 'index.html'),
  join(process.cwd(), 'public', 'index.html'),
  join(process.cwd(), 'dist', 'index.html'),
];

const isApiRoute = (pathname: string): boolean =>
  apiPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

const isStaticRequest = (pathname: string): boolean =>
  STATIC_PREFIXES.some((prefix) => pathname.startsWith(prefix));

const isSpaRouteRequest = (url: string, acceptHeader?: string): boolean => {
  const pathname = url.split('?')[0] || '/';

  if (isApiRoute(pathname)) return false;
  if (isStaticRequest(pathname)) return false;

  // Only serve SPA for browser navigations expecting HTML
  return !(!acceptHeader || !acceptHeader.includes('text/html'));


};

const resolveSpaIndexPath = async (): Promise<string | null> => {
  for (const candidate of spaIndexCandidates) {
    try {
      await access(candidate, constants.R_OK);
      return candidate;
    } catch {
      // try next
    }
  }
  return null;
};

const root: FastifyPluginAsync = async (fastify): Promise<void> => {
  // ---------------------------------------
  // 1. Static files (MUST come first)
  // ---------------------------------------
  await fastify.register(fastifyStatic, {
    root: join(process.cwd(), 'client', 'public'),
    prefix: '/',
    wildcard: false,
  });

  // ---------------------------------------
  // 2. Health endpoint
  // ---------------------------------------
  fastify.get('/health', async () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
  }));

  // ---------------------------------------
  // 3. SPA fallback setup
  // ---------------------------------------
  const spaIndexPath = await resolveSpaIndexPath();
  let spaIndexHtmlCache: string | null = null;

  if (!spaIndexPath) {
    fastify.log.warn('SPA fallback disabled: index.html not found');
    return;
  }

  // ---------------------------------------
  // 4. Not Found handler (safe version)
  // ---------------------------------------
  fastify.setNotFoundHandler(async (request, reply) => {
    const accept = request.headers.accept;

    if (
      request.method === 'GET' &&
      isSpaRouteRequest(request.url, accept)
    ) {
      try {
        if (!spaIndexHtmlCache) {
          spaIndexHtmlCache = await readFile(spaIndexPath, 'utf8');
        }

        return reply
          .type('text/html; charset=utf-8')
          .send(spaIndexHtmlCache);
      } catch (error) {
        request.log.error(
          { err: error },
          'Failed to serve SPA index.html'
        );
      }
    }

    return reply.status(404).send({
      message: 'Not Found',
      statusCode: 404,
    });
  });
};

export default root;
