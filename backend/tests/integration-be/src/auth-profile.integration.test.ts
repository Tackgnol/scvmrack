import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createServer } from 'node:http';
import { once } from 'node:events';
import test from 'node:test';
import { PrismaClient } from '@prisma/client';
import { createRpgAuth, prismaAdapter } from '@tackgnol/rpgtools-shared-auth';

test('first Logto login persists the preferred username and repeat login reuses the account', async () => {
  const prisma = new PrismaClient();
  const email = `auth-profile-${randomUUID()}@example.com`;
  const subject = randomUUID();
  const createdUserIds: string[] = [];
  const appOrigin = 'http://localhost:3210';
  let issuer = '';
  const provider = createServer((request, response) => {
    response.setHeader('content-type', 'application/json');
    if (request.url === '/oidc/.well-known/openid-configuration') {
      response.end(JSON.stringify({
        issuer,
        authorization_endpoint: `${issuer}/authorize`,
        token_endpoint: `${issuer}/token`,
        userinfo_endpoint: `${issuer}/userinfo`,
      }));
    } else if (request.url === '/token') {
      response.end(JSON.stringify({ access_token: 'local-test-access-token', token_type: 'Bearer', expires_in: 3600 }));
    } else if (request.url === '/userinfo') {
      response.end(JSON.stringify({ sub: subject, email, email_verified: true, name: 'Test Agent', preferred_username: 'test_agent' }));
    } else {
      response.writeHead(404).end();
    }
  });
  provider.listen(0, '127.0.0.1');
  await once(provider, 'listening');
  const address = provider.address();
  assert.ok(address && typeof address !== 'string');
  issuer = `http://127.0.0.1:${address.port}`;
  process.env.BETTER_AUTH_SECRET ??= 'local-auth-profile-regression-secret-only';
  const auth = createRpgAuth({
    databaseAdapter: prismaAdapter(prisma, { provider: 'postgresql' }),
    appBaseUrl: `${appOrigin}/api/auth`,
    trustedOrigins: [appOrigin],
    logto: {
      endpoint: issuer,
      clientId: 'local-test-client',
      clientSecret: 'local-test-client-secret',
      redirectUri: `${appOrigin}/api/auth/oauth2/callback/logto`,
    },
    onAnonymousClaim: async () => {},
  });
  const cookieHeader = (response: Response) => response.headers.getSetCookie()
    .map((cookie) => cookie.split(';')[0]).join('; ');

  const signIn = async () => {
    const start = await auth.handler(new Request(`${appOrigin}/api/auth/sign-in/oauth2`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin: appOrigin },
      body: JSON.stringify({ providerId: 'logto', callbackURL: `${appOrigin}/success` }),
    }));
    assert.equal(start.status, 200);
    const { url } = await start.json();
    const state = new URL(url).searchParams.get('state');
    assert.ok(state);
    const callback = await auth.handler(new Request(
      `${appOrigin}/api/auth/oauth2/callback/logto?code=local-test-code&state=${encodeURIComponent(state)}`,
      { headers: { cookie: cookieHeader(start) } },
    ));
    assert.equal(callback.headers.get('location'), `${appOrigin}/success`);
    const session = await auth.api.getSession({ headers: new Headers({ cookie: cookieHeader(callback) }) });
    assert.ok(session?.user.id);
    createdUserIds.push(session.user.id);
    return session;
  };

  try {
    const first = await signIn();
    assert.equal(first.user.preferred_username, 'test_agent');
    assert.equal(first.user.logto_sub, subject);
    assert.equal(first.user.isAnonymous, false);
    const returning = await signIn();
    assert.equal(returning.user.id, first.user.id);
    assert.equal(returning.user.preferred_username, 'test_agent');

    const anonymous = await auth.handler(new Request(`${appOrigin}/api/auth/sign-in/anonymous`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin: appOrigin },
      body: '{}',
    }));
    assert.equal(anonymous.status, 200);
    const guest = await auth.api.getSession({ headers: new Headers({ cookie: cookieHeader(anonymous) }) });
    assert.ok(guest?.user.id);
    createdUserIds.push(guest.user.id);
    assert.equal(guest.user.isAnonymous, true);
    assert.equal(guest.user.preferred_username, null);
  } finally {
    await prisma.user.deleteMany({ where: { OR: [{ email }, { id: { in: createdUserIds } }] } });
    await prisma.$disconnect();
    await new Promise<void>((resolve, reject) => provider.close((error) => error ? reject(error) : resolve()));
  }
});
