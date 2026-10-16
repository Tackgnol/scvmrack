import assert from 'node:assert/strict';
import test, { mock } from 'node:test';
import Fastify from 'fastify';
import * as Sentry from '@sentry/node';
import { memoryAdapter } from 'better-auth/adapters/memory';
import { rpgtoolsSharedAuth } from '@tackgnol/rpgtools-shared-auth';
import authErrorReporting from '../../src/plugins/auth-error-reporting.ts';
import errorHandler from '../../src/plugins/error-handler.ts';
import { shouldReportFastifyError } from '../../src/lib/auth-callback-errors.ts';

function cookies(value: string | string[] | number | undefined): string {
  const values = typeof value === 'string' ? [value] : Array.isArray(value) ? value : [];
  return values.map((cookie) => cookie.split(';')[0]).join('; ');
}

test('handled OAuth failures emit a sanitized Sentry event while normal outcomes stay silent', async () => {
  const events: Sentry.Event[] = [];
  Sentry.init({
    dsn: 'https://public@glitchtip.example.test/1',
    defaultIntegrations: false,
    integrations: [Sentry.fastifyIntegration({
      shouldHandleError: shouldReportFastifyError,
    })],
    release: 'auth-reporting-test',
    environment: 'test',
    transport: () => ({
      send: async (envelope) => {
        for (const [header, payload] of envelope[1]) {
          if (header.type === 'event') events.push(payload as Sentry.Event);
        }
        return { statusCode: 200 };
      },
      flush: async () => true,
    }),
  });
  const globalScope = Sentry.getGlobalScope();
  globalScope.setUser({ email: 'private-email@example.test' });
  globalScope.setContext('profile', { token: 'profile-secret' });
  globalScope.setExtra('token', 'extra-secret');
  globalScope.addBreadcrumb({ message: 'breadcrumb-secret' });
  globalScope.addEventProcessor((event) => ({
    ...event,
    request: {
      url: 'https://app.example.test/callback?code=oauth-secret-code',
      headers: { authorization: 'Bearer header-secret', cookie: 'cookie-secret' },
      data: { password: 'body-secret' },
      query_string: 'state=state-secret',
    },
  }));

  const origin = 'http://localhost:3210';
  const provider = 'https://local-logto.example.test';
  let omitEmail = false;
  const fetchMock = mock.method(globalThis, 'fetch', async (input: RequestInfo | URL) => {
    const url = new URL(input instanceof Request ? input.url : String(input));
    assert.equal(url.origin, provider);
    if (url.pathname === '/oidc/.well-known/openid-configuration') {
      return Response.json({
        issuer: provider,
        authorization_endpoint: `${provider}/authorize`,
        token_endpoint: `${provider}/token`,
        userinfo_endpoint: `${provider}/userinfo`,
      });
    }
    if (url.pathname === '/token') {
      return Response.json({ access_token: 'provider-token-secret', token_type: 'Bearer', expires_in: 3600 });
    }
    assert.equal(url.pathname, '/userinfo');
    return Response.json({ sub: 'test-subject', name: 'Test Agent', email: omitEmail ? undefined : 'private-email@example.test', email_verified: true });
  });
  const adapterFactory = memoryAdapter({ user: [], account: [], session: [], verification: [] });
  let failingModel: 'user' | 'session' | undefined = 'user';
  const app = Fastify({ logger: false, requestIdHeader: 'x-request-id' });
  try {
    await app.register(authErrorReporting);
    await app.register(errorHandler);
    await app.register(rpgtoolsSharedAuth, {
      baseURL: `${origin}/api/auth`,
      trustedOrigins: [origin],
      database: (options: Parameters<typeof adapterFactory>[0]) => {
        const adapter = adapterFactory(options);
        const wrapped: typeof adapter = {
          ...adapter,
          create: new Proxy(adapter.create, {
            apply(target, receiver, args) {
              if (args[0].model === failingModel) {
                throw Object.assign(new Error('Unknown argument preferred_username; private-email@example.test; provider-token-secret'), {
                  name: 'PrismaClientValidationError',
                });
              }
              return Reflect.apply(target, receiver, args);
            },
          }),
          transaction: async <R>(callback: Parameters<typeof adapter.transaction<R>>[0]) => callback(wrapped),
        };
        return wrapped;
      },
      logto: {
        endpoint: provider,
        clientId: 'local-client',
        clientSecret: 'local-client-secret',
        redirectUri: `${origin}/api/auth/oauth2/callback/logto`,
      },
    });
    app.get('/ordinary-redirect', async (_request, reply) => reply.redirect('/?error=unable_to_create_user'));
    await app.ready();

    const callback = async (query: Record<string, string> = {}) => {
      const start = await app.inject({ method: 'GET', url: '/api/auth/oauth2/login/logto', headers: { host: 'localhost:3210' } });
      assert.equal(start.statusCode, 302);
      const state = new URL(start.headers.location!).searchParams.get('state');
      assert.ok(state);
      const params = new URLSearchParams({ code: 'oauth-secret-code', state, ...query });
      return app.inject({
        method: 'GET',
        url: `/api/auth/oauth2/callback/logto?${params}`,
        headers: { host: 'localhost:3210', cookie: cookies(start.headers['set-cookie']), 'x-request-id': 'qa-request-309' },
      });
    };

    const failed = await callback();
    assert.equal(failed.statusCode, 302);
    assert.match(failed.headers.location!, /error=unable_to_create_user/);
    await Sentry.flush(2000);
    assert.equal(events.length, 1);
    assert.equal(events[0].tags?.auth_failure, 'unable_to_create_user');
    assert.deepEqual(events[0].contexts?.auth_callback, { request_id: 'qa-request-309', provider: 'logto' });
    assert.equal(events[0].release, 'auth-reporting-test');
    failingModel = undefined;
    const success = await callback();
    assert.equal(success.statusCode, 302);
    assert.equal(success.headers.location, '/');
    assert.match(cookies(success.headers['set-cookie']), /session_token=/);
    await callback({ error: 'access_denied' });
    await callback({ code: 'invalid', state: 'invalid' });
    await callback({ error: 'unable_to_create_user' });
    await callback({ iss: 'https://wrong-issuer.example.test' });
    await app.inject({ method: 'GET', url: '/ordinary-redirect' });
    await Sentry.flush(2000);
    assert.equal(events.length, 1);

    failingModel = 'session';
    const sessionFailure = await callback();
    assert.equal(sessionFailure.statusCode, 500);
    await Sentry.flush(2000);
    assert.equal(events.length, 2);
    assert.equal(events[1].tags?.auth_failure, 'http_500');

    failingModel = undefined;
    omitEmail = true;
    const profileFailure = await callback();
    assert.match(profileFailure.headers.location!, /error=email_is_missing/);
    await Sentry.flush(2000);
    assert.equal(events.length, 3);
    assert.equal(events[2].tags?.auth_failure, 'email_is_missing');

    const crashingApp = Fastify({ logger: false });
    try {
      await crashingApp.register(authErrorReporting);
      await crashingApp.register(errorHandler);
      crashingApp.get('/api/auth/oauth2/callback/logto', async () => {
        throw new Error('A callback exception thrown to Fastify');
      });
      const crashed = await crashingApp.inject({ method: 'GET', url: '/api/auth/oauth2/callback/logto?code=oauth-secret-code&state=state-secret' });
      assert.equal(crashed.statusCode, 500);
      await Sentry.flush(2000);
      assert.equal(events.length, 4);
      assert.equal(events[3].tags?.auth_failure, 'http_500');
    } finally {
      await crashingApp.close();
    }
    for (const event of events) {
      for (const secret of [
        'private-email@example.test', 'oauth-secret-code', 'provider-token-secret', 'profile-secret',
        'extra-secret', 'breadcrumb-secret', 'header-secret', 'cookie-secret', 'body-secret', 'state-secret',
      ]) {
        assert.equal(JSON.stringify(event).includes(secret), false, secret);
      }
    }
  } finally {
    await app.close();
    fetchMock.mock.restore();
    await Sentry.close(2000);
  }
});
