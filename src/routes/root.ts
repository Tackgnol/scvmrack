import { FastifyPluginAsync } from 'fastify';
import { access, readFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import { extname, join } from 'node:path';

const apiPrefixes = [
  '/auth',
  '/characters',
  '/equipment',
  '/session',
  '/health',
];

const spaIndexCandidates = [
  join(process.cwd(), 'public', 'index.html'),
  join(process.cwd(), 'client', 'public', 'index.html'),
];

const isApiRoute = (pathname: string): boolean =>
  apiPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

const isSpaRouteRequest = (url: string): boolean => {
  const pathname = url.split('?')[0] || '/';
  if (isApiRoute(pathname)) return false;
  // Skip static assets and file-like requests.
  return !extname(pathname);
};

const resolveSpaIndexPath = async (): Promise<string | null> => {
  for (const candidate of spaIndexCandidates) {
    try {
      await access(candidate, constants.R_OK);
      return candidate;
    } catch {
      // Continue to next candidate.
    }
  }
  return null;
};

const root: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
  // GET /health
  fastify.get('/health', async () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
  }));

  const spaIndexPath = await resolveSpaIndexPath();
  let spaIndexHtmlCache: string | null = null;

  if (!spaIndexPath) {
    fastify.log.warn('SPA fallback disabled: index.html was not found.');
    return;
  }

  fastify.setNotFoundHandler(async (request, reply) => {
    if (request.method === 'GET' && isSpaRouteRequest(request.url)) {
      try {
        if (!spaIndexHtmlCache) {
          spaIndexHtmlCache = await readFile(spaIndexPath, 'utf8');
        }
        return reply.type('text/html; charset=utf-8').send(spaIndexHtmlCache);
      } catch (error) {
        request.log.error(
          { err: error },
          'Failed to read SPA index.html for fallback response.'
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
