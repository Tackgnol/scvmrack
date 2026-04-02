import assert from 'node:assert/strict';
import test, { beforeEach, mock } from 'node:test';
import Fastify, { FastifyInstance } from 'fastify';
import { fastifyCookie } from '@fastify/cookie';

import {
  mockGetSession,
  mockHandler,
  resetSession,
  setSession,
  setSessionError,
} from './helpers/authMock.ts';

// auth.ts calls betterAuth() at module level — keep the same shared mock in place.
// authRoutes.test.ts (runs first alphabetically) puts this in the ESM cache; calling
// mock.module() here updates the registry so a fresh sessionResolver load sees it too.
mock.module('../../src/services/auth.ts', {
  defaultExport: {
    api: { getSession: mockGetSession },
    handler: mockHandler,
  },
});

const { default: sessionResolverPlugin } = await import(
  '../../src/plugins/sessionResolver.ts'
);

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildApp(): FastifyInstance {
  const app = Fastify({ logger: false });
  // @fastify/cookie must be registered before sessionResolver (declared dependency)
  app.register(fastifyCookie);
  app.register(sessionResolverPlugin);

  // Test routes that expose the resolved appSession
  app.get('/whoami', (req, reply) => reply.send(req.appSession));
  app.get('/auth/sign-in', (req, reply) => reply.send(req.appSession));
  app.post('/auth/register', (req, reply) => reply.send(req.appSession));

  return app;
}

beforeEach(() => {
  resetSession();
});

// ── /auth/* bypass ────────────────────────────────────────────────────────────

test('GET /auth/* returns null appSession without calling auth.api.getSession', async () => {
  const app = buildApp();
  const res = await app.inject({ method: 'GET', url: '/auth/sign-in' });
  await app.close();

  assert.equal(res.statusCode, 200);
  assert.equal(res.body, 'null');
  assert.equal(mockGetSession.mock.callCount(), 0);
});

test('POST /auth/* returns null appSession without calling auth.api.getSession', async () => {
  const app = buildApp();
  const res = await app.inject({ method: 'POST', url: '/auth/register' });
  await app.close();

  assert.equal(res.body, 'null');
  assert.equal(mockGetSession.mock.callCount(), 0);
});

// ── Valid session mapping ─────────────────────────────────────────────────────

test('valid session is mapped to AppSession with correct fields', async () => {
  const expiresAt = new Date('2099-12-31T00:00:00.000Z');
  setSession({
    session: { id: 'sess-abc', expiresAt: expiresAt.toISOString() },
    user: { id: 'user-xyz', isAnonymous: false },
  });

  const app = buildApp();
  const res = await app.inject({ method: 'GET', url: '/whoami' });
  await app.close();

  const body = JSON.parse(res.body);
  assert.equal(body.id, 'sess-abc');
  assert.equal(body.userId, 'user-xyz');
  assert.equal(body.expiresAt, expiresAt.toISOString());
  assert.equal(body.isGuest, false);
});

test('anonymous user session sets isGuest = true', async () => {
  setSession({
    session: { id: 'sess-anon', expiresAt: new Date().toISOString() },
    user: { id: 'user-anon', isAnonymous: true },
  });

  const app = buildApp();
  const res = await app.inject({ method: 'GET', url: '/whoami' });
  await app.close();

  const body = JSON.parse(res.body);
  assert.equal(body.isGuest, true);
  assert.equal(body.userId, 'user-anon');
});

// ── Null / error cases ────────────────────────────────────────────────────────

test('auth.api.getSession returning null sets appSession to null', async () => {
  // resetSession() already sets result = null (default)
  const app = buildApp();
  const res = await app.inject({ method: 'GET', url: '/whoami' });
  await app.close();

  assert.equal(res.body, 'null');
});

test('auth.api.getSession returning session with no user sets appSession to null', async () => {
  setSession({ session: { id: 'sess-1', expiresAt: new Date().toISOString() }, user: null });

  const app = buildApp();
  const res = await app.inject({ method: 'GET', url: '/whoami' });
  await app.close();

  assert.equal(res.body, 'null');
});

test('auth.api.getSession throwing sets appSession to null (no 500 propagation)', async () => {
  setSessionError();

  const app = buildApp();
  const res = await app.inject({ method: 'GET', url: '/whoami' });
  await app.close();

  assert.equal(res.statusCode, 200);
  assert.equal(res.body, 'null');
});
