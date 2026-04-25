import fp from 'fastify-plugin';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import csrfProtection from '@fastify/csrf-protection';
import { FastifyInstance } from 'fastify';

export default fp(async function securityPlugin(fastify: FastifyInstance) {
  // Security headers
  await fastify.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        // Allowed Google Fonts stylesheets
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        // Allowed the actual font files to download from Gstatic
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        // Allowed the Flags API for images
        imgSrc: ["'self'", "data:", "https://flagsapi.com"],
        connectSrc: ["'self'"],
        frameAncestors: ["'none'"],
      },
    },
    strictTransportSecurity: {
      maxAge: 31536000,
      includeSubDomains: true,
    },
    referrerPolicy: {
      policy: 'strict-origin-when-cross-origin',
    },
    xContentTypeOptions: true,
  });

  // Rate limiting
  await fastify.register(rateLimit, {
    max: process.env.NODE_ENV === 'test' ? 10000 : 50,
    timeWindow: '1 minute',
  });

  // CSRF protection using cookie-based double-submit pattern
  const hmacKey = process.env.BETTER_AUTH_SECRET || process.env.SESSION_SECRET;
  if (!hmacKey) {
    throw new Error(
        'BETTER_AUTH_SECRET or SESSION_SECRET must be set for CSRF protection'
    );
  }

  await fastify.register(csrfProtection, {
    sessionPlugin: '@fastify/cookie',
    csrfOpts: { hmacKey },
    cookieOpts: {
      signed: false,
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      secure: !['development', 'test'].includes(process.env.NODE_ENV ?? ''),
    },
  });

  // GET /csrf-token - SPA fetches a CSRF token to include in state-changing requests
  fastify.get('/csrf-token', async (_request, reply) => {
    const token = reply.generateCsrf();
    return { token };
  });

  // Enforce CSRF on state-changing methods, except auth routes (Better Auth handles its own)
  fastify.addHook('preHandler', (request, reply, done) => {
    const method = request.method.toUpperCase();
    if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
      return done();
    }

    // Skip auth routes - Better Auth manages its own session security
    if (request.url.startsWith('/auth/')) {
      return done();
    }

    fastify.csrfProtection(request, reply, done);
  });

  fastify.log.info('Security plugins loaded');
});
