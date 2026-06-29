import assert from 'node:assert/strict';
import test, { mock } from 'node:test';

import Fastify from 'fastify';
import { apiError, type ApiHttpError } from '../../src/errors.js';

type AppSession = {
  session?: { id?: string | null } | null;
  user?: { id?: string | null; isAnonymous?: boolean | null } | null;
} | null;

const PARTY_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const promoteCalls: Array<{
  session: AppSession;
  obrRoomId: string;
  name?: string | null;
}> = [];

let currentSession: AppSession = null;
let promoteResult:
  | { ok: true; value: unknown }
  | { ok: false; error: ApiHttpError } = {
  ok: true,
  value: {
    id: PARTY_ID,
    name: 'Room party',
    role: 'gm',
    inviteToken: 'tok',
    invitePath: '/join/tok',
    memberCount: 0,
    maxMembers: 10,
    members: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
};

function resetState(): void {
  promoteCalls.length = 0;
  currentSession = null;
  promoteResult = {
    ok: true,
    value: {
      id: PARTY_ID,
      name: 'Room party',
      role: 'gm',
      inviteToken: 'tok',
      invitePath: '/join/tok',
      memberCount: 0,
      maxMembers: 10,
      members: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  };
}

mock.module('../../src/services/party-service.js', {
  namedExports: {
    createPartyService: () => ({
      maxMembers: 10,
      promoteRoom: async (input: {
        session: AppSession;
        obrRoomId: string;
        name?: string | null;
      }) => {
        promoteCalls.push(input);
        return promoteResult;
      },
    }),
  },
});

const { default: errorHandlerPlugin } = await import('../../src/plugins/error-handler.js');
const { default: partyRoutes } = await import('../../src/routes/parties/index.js');

async function buildApp() {
  const app = Fastify({ logger: false });
  app.decorateRequest('appSession', null);
  app.decorate('partyBus', {
    publish: () => {},
    subscribe: () => () => {},
    connectPresence: () => () => {},
    presenceSnapshot: () => ({}),
  });
  app.addHook('onRequest', async (request) => {
    (request as typeof request & { appSession: AppSession }).appSession =
      currentSession;
  });
  await app.register(errorHandlerPlugin);
  await app.register(partyRoutes);
  await app.ready();
  return app;
}

test('GET /limits returns the configured max members without auth', async () => {
  resetState();
  currentSession = null;
  const app = await buildApp();

  const response = await app.inject({ method: 'GET', url: '/limits' });

  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.json(), { maxMembers: 10 });

  await app.close();
});

test('POST /promote forwards OBR room promotion to the party service', async () => {
  resetState();
  currentSession = {
    session: { id: 'sess-gm' },
    user: { id: 'gm-1', isAnonymous: false },
  };
  const app = await buildApp();

  const response = await app.inject({
    method: 'POST',
    url: '/promote',
    payload: { obrRoomId: 'room-1', name: 'Room party' },
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.json().id, PARTY_ID);
  assert.deepEqual(promoteCalls, [
    {
      session: currentSession,
      obrRoomId: 'room-1',
      name: 'Room party',
    },
  ]);

  await app.close();
});

test('POST /promote rejects an invalid body before calling the service', async () => {
  resetState();
  const app = await buildApp();

  const response = await app.inject({
    method: 'POST',
    url: '/promote',
    payload: { name: 'Room party' },
  });

  assert.equal(response.statusCode, 400);
  assert.equal(promoteCalls.length, 0);

  await app.close();
});

test('POST /promote returns a conflict for a room owned by another GM', async () => {
  resetState();
  promoteResult = {
    ok: false,
    error: apiError(
      409,
      'ROOM_ALREADY_PROMOTED',
      'This Owlbear room has already been promoted'
    ),
  };
  const app = await buildApp();

  const response = await app.inject({
    method: 'POST',
    url: '/promote',
    payload: { obrRoomId: 'room-1' },
  });

  assert.equal(response.statusCode, 409);
  assert.equal(response.json().code, 'ROOM_ALREADY_PROMOTED');

  await app.close();
});
