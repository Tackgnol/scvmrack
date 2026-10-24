import assert from 'node:assert/strict';
import test, { mock } from 'node:test';
import Fastify from 'fastify';
import { memoryAdapter } from 'better-auth/adapters/memory';
import { rpgtoolsSharedAuth } from '@tackgnol/rpgtools-shared-auth';

test('real shared-auth callbacks honour local returnTo and contain external and legacy targets (RPG-335)', async (t) => {
  const origin = 'http://localhost:3210';
  const provider = 'https://logto.example.test';
  const fetchMock = mock.method(
    globalThis,
    'fetch',
    async (input: RequestInfo | URL) => {
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
        return Response.json({
          access_token: 'local-provider-fixture',
          token_type: 'Bearer',
          expires_in: 3600,
        });
      }
      assert.equal(url.pathname, '/userinfo');
      return Response.json({
        sub: 'redirect-test',
        name: 'Redirect test',
        email: 'redirect@example.test',
        email_verified: true,
      });
    }
  );
  const app = Fastify({ logger: false });
  try {
    await app.register(rpgtoolsSharedAuth, {
      baseURL: `${origin}/api/auth`,
      trustedOrigins: [origin],
      security: { csrf: { hmacKey: 'redirect-test-fixture-hmac-key' } },
      database: memoryAdapter({
        user: [],
        account: [],
        session: [],
        verification: [],
      }),
      logto: {
        endpoint: provider,
        clientId: 'local-client',
        clientSecret: 'local-client-fixture',
        redirectUri: `${origin}/api/auth/oauth2/callback/logto`,
      },
    });
    for (const [parameter, target, destination] of [
      ['returnTo', '/faq', '/faq'],
      ['returnTo', 'https://evil.example/after', '/'],
      ['callbackURL', 'https://evil.example/after', '/'],
    ]) {
      await t.test(
        `${parameter}=${target} ends at ${destination}`,
        async () => {
          const start = await app.inject({
            method: 'GET',
            url: `/api/auth/oauth2/login/logto?${new URLSearchParams({
              [parameter]: target,
            })}`,
            headers: { host: 'localhost:3210' },
          });
          assert.equal(start.statusCode, 302);
          const authorization = new URL(start.headers.location!);
          assert.equal(authorization.origin, provider);
          assert.equal(
            authorization.searchParams.get('redirect_uri'),
            `${origin}/api/auth/oauth2/callback/logto`
          );
          const state = authorization.searchParams.get('state');
          assert.ok(state);
          const setCookies = start.headers['set-cookie'];
          const cookies = (
            Array.isArray(setCookies) ? setCookies : [String(setCookies)]
          )
            .map((value) => value.split(';')[0])
            .join('; ');
          const callback = await app.inject({
            method: 'GET',
            url: `/api/auth/oauth2/callback/logto?${new URLSearchParams({
              code: 'local-code-fixture',
              state,
            })}`,
            headers: { host: 'localhost:3210', cookie: cookies },
          });
          assert.equal(callback.statusCode, 302);
          const final = new URL(callback.headers.location!, origin);
          assert.equal(final.origin, origin);
          assert.equal(final.pathname + final.search, destination);
          assert.match(
            JSON.stringify(callback.headers['set-cookie']),
            /session_token=/
          );
        }
      );
    }
  } finally {
    await app.close();
    fetchMock.mock.restore();
  }
});
