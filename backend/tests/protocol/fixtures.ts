import { test as base } from '@playwright/test';
import Fastify from 'fastify';
import { memoryAdapter, type MemoryDB } from 'better-auth/adapters/memory';
import { rpgtoolsSharedAuth } from '@tackgnol/rpgtools-shared-auth/server';
import tunnel from '../../src/routes/tunnel.js';

const frontendOrigin = 'http://127.0.0.1:5278';

export const test = base.extend<{
  protocol: {
    apiOrigin: string; envelopes: string[]; csrfRequests: number; anonymousRequests: number;
    statuses: number[]; hold: boolean; release: () => void; db: MemoryDB;
    claims: Array<{ guestId: string; userId: string }>;
  };
}>({
  protocol: async ({}, use) => {
    process.env.NODE_ENV = 'test';
    process.env.BETTER_AUTH_SECRET = 'local-protocol-test-secret-at-least-32-characters';
    const upstream = Fastify();
    const api = Fastify();
    let release = () => {};
    const state = {
      apiOrigin: '', envelopes: [] as string[], csrfRequests: 0, anonymousRequests: 0,
      statuses: [] as number[], hold: false, release: () => release(),
      db: { user: [], session: [], account: [], verification: [] } as MemoryDB,
      claims: [] as Array<{ guestId: string; userId: string }>,
    };
    upstream.addContentTypeParser('application/x-sentry-envelope', { parseAs: 'string' }, (_request, body, done) => done(null, body));
    upstream.post('/api/7/envelope/', async request => {
      state.envelopes.push(String(request.body));
      if (state.hold) {
        await new Promise<void>(resolve => { release = resolve; });
      }
      return {};
    });
    process.env.GLITCHTIP_UPSTREAM = await upstream.listen({ host: '127.0.0.1', port: 0 });
    api.addHook('onRequest', async (request, reply) => {
      reply.header('access-control-allow-origin', frontendOrigin);
      reply.header('access-control-allow-credentials', 'true');
      reply.header('access-control-allow-headers', 'content-type,x-csrf-token,authorization');
      reply.header('access-control-expose-headers', 'set-auth-token');
      if (request.method === 'OPTIONS') { return reply.code(204).send(); }
      if (request.url === '/api/csrf-token') { state.csrfRequests++; }
      if (request.url === '/api/auth/sign-in/anonymous') { state.anonymousRequests++; }
    });
    api.addHook('onResponse', async (request, reply) => {
      if (request.method === 'POST' && request.url === '/api/tunnel') { state.statuses.push(reply.statusCode); }
    });
    await api.register(rpgtoolsSharedAuth, {
      database: memoryAdapter(state.db), baseURL: frontendOrigin + '/api/auth',
      trustedOrigins: [frontendOrigin, 'http://127.0.0.1:*'], bearerSessions: true,
      onLinkAccount: async ({ anonymousUser, newUser }) => {
        state.claims.push({ guestId: anonymousUser.user.id, userId: newUser.user.id });
      },
      security: { csrf: { hmacKey: 'local-protocol-hmac-at-least-32-characters' } },
      logto: { endpoint: 'https://unused.example', clientId: 'fixture', clientSecret: 'fixture', redirectUri: frontendOrigin + '/callback' },
    });
    await api.register(tunnel, { prefix: '/api' });
    api.get('/approval-fixture', async (_request, reply) => reply
      .header('cross-origin-opener-policy', 'same-origin')
      .header('content-security-policy', `default-src 'self'; script-src ${frontendOrigin}; connect-src 'self'`)
      .type('text/html').send(`<html lang="en"><title>Isolated approval fixture</title><body><script type="module" src="${frontendOrigin}/test/contracts/popupApproval.ts"></script></body></html>`));
    state.apiOrigin = await api.listen({ host: '127.0.0.1', port: 0 });
    try {
      await use(state);
    } finally {
      release();
      await api.close();
      await upstream.close();
    }
  },
});
export { expect } from '@playwright/test';
