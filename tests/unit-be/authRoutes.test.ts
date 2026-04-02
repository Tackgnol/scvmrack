import assert from 'node:assert/strict';
import test, { beforeEach, mock } from 'node:test';
import Fastify, { FastifyInstance } from 'fastify';
import rateLimit from '@fastify/rate-limit';

import {
  getCapturedRequest,
  mockGetSession,
  mockHandler,
  resetHandler,
  resetSession,
  setHandlerResponse,
} from './helpers/authMock.ts';

// crypto.ts has module-level env var guards — set before it is first imported
process.env.EMAIL_PEPPER ??= 'test-pepper-at-least-32-chars-long!!';
process.env.EMAIL_ENCRYPTION_KEY ??= '0'.repeat(64);
process.env.BETTER_AUTH_SECRET ??= 'test-secret-for-unit-tests';

// auth.ts calls betterAuth() at module level — must be mocked before authRoutes is imported
mock.module('../../src/services/auth.ts', {
  defaultExport: {
    handler: mockHandler,
    api: { getSession: mockGetSession },
  },
});

const turnstileState: {
  enabled: boolean;
  verificationResult: { success: boolean; errorCodes: string[] };
} = {
  enabled: false,
  verificationResult: { success: true, errorCodes: [] },
};

const mockIsTurnstileEnabled = mock.fn(() => turnstileState.enabled);
const mockVerifyTurnstileToken = mock.fn(
  async () => turnstileState.verificationResult
);

mock.module('../../src/services/turnstile.ts', {
  namedExports: {
    isTurnstileEnabled: mockIsTurnstileEnabled,
    verifyTurnstileToken: mockVerifyTurnstileToken,
  },
});

// Dynamic imports: env vars are set and auth mock is in place
const { generateEmailBlindIndex } = await import('../../src/services/crypto.ts');
const { loginAttempts } = await import('../../src/services/loginLockout.ts');
const { default: authRoutes } = await import('../../src/routes/auth/index.ts');

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildApp(options: { withRateLimit?: boolean } = {}): FastifyInstance {
  const app = Fastify({ logger: false });
  if (options.withRateLimit) {
    app.register(rateLimit, {
      max: 1000,
      timeWindow: '1 minute',
    });
  }
  app.register(authRoutes, { prefix: '/auth' });
  return app;
}

async function postAuth(
  app: FastifyInstance,
  path: string,
  body: Record<string, unknown>,
  extraHeaders?: Record<string, string>
) {
  return app.inject({
    method: 'POST',
    url: path,
    headers: { 'content-type': 'application/json', ...extraHeaders },
    payload: JSON.stringify(body),
  });
}

beforeEach(() => {
  resetHandler();
  resetSession();
  turnstileState.enabled = false;
  turnstileState.verificationResult = { success: true, errorCodes: [] };
  mockIsTurnstileEnabled.mock.resetCalls();
  mockVerifyTurnstileToken.mock.resetCalls();
});

// ── Email blind index transform ───────────────────────────────────────────────

test('body.email is replaced with <blind-index>@bidx.local before forwarding to auth', async () => {
  const email = 'user@example.com';
  const expectedHash = generateEmailBlindIndex(email);

  const app = buildApp();
  await postAuth(app, '/auth/sign-in/email', { email, password: 'secret' });
  await app.close();

  const captured = getCapturedRequest();
  assert.ok(captured, 'auth.handler should have been called');
  const forwardedEmail = (captured.body as Record<string, string>)?.email;
  assert.equal(forwardedEmail, `${expectedHash}@bidx.local`);
});

test('generateEmailBlindIndex is case-insensitive (UPPER@EXAMPLE.COM → same hash)', async () => {
  const lower = generateEmailBlindIndex('user@example.com');
  const upper = generateEmailBlindIndex('USER@EXAMPLE.COM');
  assert.equal(lower, upper);
});

// ── Header stripping ──────────────────────────────────────────────────────────

test('x-plain-email from incoming request is stripped and replaced with value from body', async () => {
  const app = buildApp();
  await postAuth(
    app,
    '/auth/sign-in/email',
    { email: 'user@example.com', password: 'secret' },
    { 'x-plain-email': 'attacker@evil.com' }
  );
  await app.close();

  // Must be the real email from body, not the attacker-injected value
  assert.equal(getCapturedRequest()?.headers['x-plain-email'], 'user@example.com');
});

test('host header is stripped from the forwarded request', async () => {
  const app = buildApp();
  await postAuth(app, '/auth/sign-in/email', { email: 'user@example.com', password: 'secret' });
  await app.close();

  assert.equal(getCapturedRequest()?.headers['host'], undefined);
});

test('content-length header is stripped from the forwarded request', async () => {
  const app = buildApp();
  await postAuth(app, '/auth/sign-in/email', { email: 'user@example.com', password: 'secret' });
  await app.close();

  assert.equal(getCapturedRequest()?.headers['content-length'], undefined);
});

test('turnstileToken is removed from body before forwarding to auth', async () => {
  const app = buildApp();
  await postAuth(app, '/auth/sign-in/email', {
    email: 'user@example.com',
    password: 'secret',
    turnstileToken: 'cf-token-xyz',
  });
  await app.close();

  assert.equal(
    (getCapturedRequest()?.body as Record<string, unknown>)?.turnstileToken,
    undefined
  );
});

test('turnstile-protected auth routes reject requests with a missing token before auth is called', async () => {
  turnstileState.enabled = true;

  const app = buildApp();
  const res = await postAuth(app, '/auth/sign-in/email', {
    email: 'user@example.com',
    password: 'secret',
  });
  await app.close();

  assert.equal(res.statusCode, 400);
  assert.match(res.body, /Captcha verification is required/);
  assert.equal(mockVerifyTurnstileToken.mock.callCount(), 0);
  assert.equal(mockHandler.mock.callCount(), 0);
});

test('turnstile-protected auth routes reject invalid tokens before auth is called', async () => {
  turnstileState.enabled = true;
  turnstileState.verificationResult = {
    success: false,
    errorCodes: ['timeout-or-duplicate'],
  };

  const app = buildApp();
  const res = await postAuth(app, '/auth/sign-in/email', {
    email: 'user@example.com',
    password: 'secret',
    turnstileToken: 'expired-token',
  });
  await app.close();

  assert.equal(res.statusCode, 400);
  assert.match(res.body, /Captcha verification failed/);
  assert.equal(mockVerifyTurnstileToken.mock.callCount(), 1);
  assert.equal(mockHandler.mock.callCount(), 0);
});

test('sign-up rejects a missing turnstile token before auth is called', async () => {
  turnstileState.enabled = true;

  const app = buildApp();
  const res = await postAuth(app, '/auth/sign-up/email', {
    email: 'user@example.com',
    password: 'secret',
    name: 'Test User',
  });
  await app.close();

  assert.equal(res.statusCode, 400);
  assert.match(res.body, /Captcha verification is required/);
  assert.equal(mockVerifyTurnstileToken.mock.callCount(), 0);
  assert.equal(mockHandler.mock.callCount(), 0);
});

test('forgot-password rejects invalid turnstile tokens before auth is called', async () => {
  turnstileState.enabled = true;
  turnstileState.verificationResult = {
    success: false,
    errorCodes: ['timeout-or-duplicate'],
  };

  const app = buildApp();
  const res = await postAuth(app, '/auth/request-password-reset', {
    email: 'user@example.com',
    turnstileToken: 'expired-token',
  });
  await app.close();

  assert.equal(res.statusCode, 400);
  assert.match(res.body, /Captcha verification failed/);
  assert.equal(mockVerifyTurnstileToken.mock.callCount(), 1);
  assert.equal(mockHandler.mock.callCount(), 0);
});

// ── Error normalization ───────────────────────────────────────────────────────

test('sign-up: 4xx from auth is normalized to 200 with generic message', async () => {
  setHandlerResponse(
    new Response(JSON.stringify({ error: 'email already in use' }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    })
  );

  const app = buildApp();
  const res = await postAuth(app, '/auth/sign-up/email', {
    email: 'existing@example.com',
    password: 'secret',
    name: 'Test',
  });
  await app.close();

  assert.equal(res.statusCode, 200);
  assert.match(JSON.parse(res.body).message, /If this email is registered/);
});

test('forgot-password: 4xx from auth is normalized to 200 with generic message', async () => {
  setHandlerResponse(
    new Response(JSON.stringify({ error: 'user not found' }), {
      status: 422,
      headers: { 'content-type': 'application/json' },
    })
  );

  const app = buildApp();
  const res = await postAuth(app, '/auth/request-password-reset', {
    email: 'nobody@example.com',
  });
  await app.close();

  assert.equal(res.statusCode, 200);
  assert.match(JSON.parse(res.body).message, /If this email is registered/);
});

test('sign-in: non-4xx response is NOT normalized', async () => {
  setHandlerResponse(
    new Response(JSON.stringify({ token: 'abc' }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    })
  );

  const app = buildApp();
  const res = await postAuth(app, '/auth/sign-in/email', {
    email: 'user@example.com',
    password: 'correct',
  });
  await app.close();

  assert.equal(res.statusCode, 200);
  assert.deepEqual(JSON.parse(res.body), { token: 'abc' });
});

// ── Per-account lockout ───────────────────────────────────────────────────────

test('pre-locked account returns 429 with retry-after before auth is called', async () => {
  const email = 'locked@example.com';
  const emailHash = generateEmailBlindIndex(email);
  loginAttempts.set(emailHash, { count: 5, lockedUntil: Date.now() + 60_000 });

  try {
    const app = buildApp();
    const res = await postAuth(app, '/auth/sign-in/email', { email, password: 'anything' });
    await app.close();

    assert.equal(res.statusCode, 429);
    assert.ok(res.headers['retry-after'], 'should include retry-after header');
    assert.equal(mockHandler.mock.callCount(), 0, 'auth.handler must not be called for locked accounts');
  } finally {
    loginAttempts.delete(emailHash);
  }
});

// ── Login failure / success tracking ─────────────────────────────────────────

test('auth 401 increments the per-account failure count', async () => {
  setHandlerResponse(
    new Response(JSON.stringify({ error: 'invalid credentials' }), {
      status: 401,
      headers: { 'content-type': 'application/json' },
    })
  );

  const email = 'failing@example.com';
  const emailHash = generateEmailBlindIndex(email);
  loginAttempts.delete(emailHash);

  const app = buildApp();
  await postAuth(app, '/auth/sign-in/email', { email, password: 'wrong' });
  await app.close();

  const record = loginAttempts.get(emailHash);
  assert.ok(record, 'failure record should exist after a 401');
  assert.equal(record?.count, 1);
  loginAttempts.delete(emailHash);
});

test('auth 200 clears the per-account failure state', async () => {
  const email = 'recovering@example.com';
  const emailHash = generateEmailBlindIndex(email);
  loginAttempts.set(emailHash, { count: 3, lockedUntil: 0 });

  const app = buildApp();
  await postAuth(app, '/auth/sign-in/email', { email, password: 'correct' });
  await app.close();

  assert.equal(loginAttempts.has(emailHash), false);
});

test('sign-up is rate limited after 10 requests per minute', async () => {
  const previousNodeEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';

  try {
    const app = buildApp({ withRateLimit: true });

    for (let attempt = 1; attempt <= 10; attempt++) {
      const res = await postAuth(app, '/auth/sign-up/email', {
        email: `signup-${attempt}@example.com`,
        password: 'secret',
        name: `Test ${attempt}`,
      });
      assert.equal(res.statusCode, 200);
    }

    const blocked = await postAuth(app, '/auth/sign-up/email', {
      email: 'signup-blocked@example.com',
      password: 'secret',
      name: 'Blocked User',
    });
    await app.close();

    assert.equal(blocked.statusCode, 429);
    assert.ok(blocked.headers['retry-after'], 'should include retry-after header');
    assert.equal(mockHandler.mock.callCount(), 10);
  } finally {
    process.env.NODE_ENV = previousNodeEnv;
  }
});

test('forgot-password is rate limited after 10 requests per minute', async () => {
  const previousNodeEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';

  try {
    const app = buildApp({ withRateLimit: true });

    for (let attempt = 1; attempt <= 10; attempt++) {
      const res = await postAuth(app, '/auth/request-password-reset', {
        email: `forgot-${attempt}@example.com`,
      });
      assert.equal(res.statusCode, 200);
    }

    const blocked = await postAuth(app, '/auth/request-password-reset', {
      email: 'forgot-blocked@example.com',
    });
    await app.close();

    assert.equal(blocked.statusCode, 429);
    assert.ok(blocked.headers['retry-after'], 'should include retry-after header');
    assert.equal(mockHandler.mock.callCount(), 10);
  } finally {
    process.env.NODE_ENV = previousNodeEnv;
  }
});
