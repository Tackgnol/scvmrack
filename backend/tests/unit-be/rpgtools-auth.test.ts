import assert from 'node:assert/strict';
import test, { mock } from 'node:test';

import Fastify from 'fastify';

type LinkAccountPayload = {
  anonymousUser: { user: { id: string } };
  newUser: { user: { id: string } };
};

type SharedAuthOptions = {
  baseURL: string;
  trustedOrigins: string[];
  logto: {
    endpoint: string;
    clientId: string;
    clientSecret: string;
    redirectUri: string;
  };
  onLinkAccount: (payload: LinkAccountPayload) => Promise<void>;
};

const updateManyCalls: unknown[] = [];
let registeredSharedAuthOptions: SharedAuthOptions | null = null;

const prismaMock = {
  character: {
    updateMany: async (args: unknown) => {
      updateManyCalls.push(args);
      return { count: 2 };
    },
    findFirst: async () => null,
    update: async () => ({}),
  },
  claimCode: {
    create: async () => ({}),
    findUnique: async () => null,
    delete: async () => ({}),
  },
};

mock.module('../../src/lib/prisma.js', {
  defaultExport: prismaMock,
});

mock.module('@tackgnol/rpgtools-shared-auth', {
  namedExports: {
    prismaAdapter: (prisma: unknown, options: unknown) => ({ prisma, options }),
    rpgtoolsSharedAuth: async (fastify: {
      decorate: (name: string, value: unknown) => void;
    }, options: SharedAuthOptions) => {
      registeredSharedAuthOptions = options;
      fastify.decorate('auth', {
        handler: async () =>
          new Response(JSON.stringify({ url: 'https://auth.example.test/redirect' }), {
            headers: { 'content-type': 'application/json' },
          }),
      });
    },
  },
});

const { default: rpgtoolsAuthPlugin } = await import('../../src/plugins/rpgtools-auth.js');

test('rpgtools auth link hook transfers anonymous characters to the linked user', async () => {
  updateManyCalls.length = 0;
  registeredSharedAuthOptions = null;

  const app = Fastify({ logger: false });
  await app.register(rpgtoolsAuthPlugin);
  await app.ready();

  assert.ok(registeredSharedAuthOptions);
  await registeredSharedAuthOptions.onLinkAccount({
    anonymousUser: { user: { id: 'anonymous-user-id' } },
    newUser: { user: { id: 'linked-user-id' } },
  });

  assert.deepEqual(updateManyCalls, [
    {
      where: { userId: 'anonymous-user-id' },
      data: { userId: 'linked-user-id' },
    },
  ]);

  await app.close();
});

test('rpgtools auth plugin keeps local and configured origins trusted', async () => {
  registeredSharedAuthOptions = null;

  const originalClientOrigin = process.env.CLIENT_ORIGIN;
  const originalClientGateway = process.env.CLIENT_GATEWAY;
  process.env.CLIENT_ORIGIN = 'https://client.example.test';
  process.env.CLIENT_GATEWAY = 'https://gateway.example.test';

  const app = Fastify({ logger: false });
  try {
    await app.register(rpgtoolsAuthPlugin);
    await app.ready();

    assert.ok(registeredSharedAuthOptions);
    assert.deepEqual(
      registeredSharedAuthOptions.trustedOrigins,
      [
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'https://scvmrack.rpgtools.co',
        'https://client.example.test',
        'https://gateway.example.test',
      ],
    );
  } finally {
    if (originalClientOrigin === undefined) {
      delete process.env.CLIENT_ORIGIN;
    } else {
      process.env.CLIENT_ORIGIN = originalClientOrigin;
    }

    if (originalClientGateway === undefined) {
      delete process.env.CLIENT_GATEWAY;
    } else {
      process.env.CLIENT_GATEWAY = originalClientGateway;
    }

    await app.close();
  }
});
