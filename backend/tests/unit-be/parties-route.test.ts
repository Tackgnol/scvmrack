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
const attachRoomCalls: Array<{
  session: AppSession;
  id: string;
  obrRoomId: string;
}> = [];
const detachRoomCalls: Array<{ session: AppSession; id: string }> = [];
const setMiseriesCalls: Array<{
  session: AppSession;
  id: string;
  miseryCount: number;
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
let attachRoomResult:
  | { ok: true; value: unknown }
  | { ok: false; error: ApiHttpError } = {
  ok: true,
  value: { id: PARTY_ID, obrRoomId: 'room-1' },
};
let detachRoomResult:
  | { ok: true; value: unknown }
  | { ok: false; error: ApiHttpError } = {
  ok: true,
  value: { id: PARTY_ID, obrRoomId: null },
};
let setMiseriesResult:
  | { ok: true; value: unknown }
  | { ok: false; error: ApiHttpError } = {
  ok: true,
  value: { miseryCount: 4, updatedCharacters: 2 },
};

function resetState(): void {
  promoteCalls.length = 0;
  attachRoomCalls.length = 0;
  detachRoomCalls.length = 0;
  setMiseriesCalls.length = 0;
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
  attachRoomResult = {
    ok: true,
    value: { id: PARTY_ID, obrRoomId: 'room-1' },
  };
  detachRoomResult = {
    ok: true,
    value: { id: PARTY_ID, obrRoomId: null },
  };
  setMiseriesResult = {
    ok: true,
    value: { miseryCount: 4, updatedCharacters: 2 },
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
      attachRoom: async (input: {
        session: AppSession;
        id: string;
        obrRoomId: string;
      }) => {
        attachRoomCalls.push(input);
        return attachRoomResult;
      },
      detachRoom: async (input: { session: AppSession; id: string }) => {
        detachRoomCalls.push(input);
        return detachRoomResult;
      },
      setMiseries: async (input: {
        session: AppSession;
        id: string;
        miseryCount: number;
      }) => {
        setMiseriesCalls.push(input);
        return setMiseriesResult;
      },
    }),
  },
});

// routes/parties/index.ts registers the sibling enemies plugin (autoload
// only loads one file per directory when an index file exists), so this
// module graph still reaches enemy-service.js and must keep it mocked to
// avoid a real, unmocked Prisma import in a DATABASE_URL-less test env.
mock.module('../../src/services/enemy-service.js', {
  namedExports: {
    createEnemyService: () => ({
      listForOwner: async () => ({ ok: true, value: [] }),
      listCardsForPlayer: async () => ({ ok: true, value: [] }),
      create: async () => ({ ok: true, value: {} }),
      update: async () => ({ ok: true, value: {} }),
      setHealth: async () => ({ ok: true, value: {} }),
      remove: async () => ({ ok: true, value: undefined }),
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

test('POST /promote forwards service conflicts', async () => {
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

test('POST /:id/attach-room forwards to the party service and returns 200 for the owner', async () => {
  resetState();
  currentSession = {
    session: { id: 'sess-gm' },
    user: { id: 'gm-1', isAnonymous: false },
  };
  const app = await buildApp();

  const response = await app.inject({
    method: 'POST',
    url: `/${PARTY_ID}/attach-room`,
    payload: { obrRoomId: 'room-1' },
  });

  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.json(), { id: PARTY_ID, obrRoomId: 'room-1' });
  assert.deepEqual(attachRoomCalls, [
    { session: currentSession, id: PARTY_ID, obrRoomId: 'room-1' },
  ]);

  await app.close();
});

test('POST /:id/attach-room forwards a room collision as 409', async () => {
  resetState();
  attachRoomResult = {
    ok: false,
    error: apiError(
      409,
      'ROOM_ALREADY_PROMOTED',
      'This Owlbear room is already linked to another party'
    ),
  };
  const app = await buildApp();

  const response = await app.inject({
    method: 'POST',
    url: `/${PARTY_ID}/attach-room`,
    payload: { obrRoomId: 'taken-room' },
  });

  assert.equal(response.statusCode, 409);
  assert.equal(response.json().code, 'ROOM_ALREADY_PROMOTED');

  await app.close();
});

test('POST /:id/attach-room forwards 404 for a non-owner', async () => {
  resetState();
  attachRoomResult = {
    ok: false,
    error: apiError(404, 'PARTY_NOT_FOUND', 'Party not found'),
  };
  currentSession = {
    session: { id: 'sess-stranger' },
    user: { id: 'stranger', isAnonymous: false },
  };
  const app = await buildApp();

  const response = await app.inject({
    method: 'POST',
    url: `/${PARTY_ID}/attach-room`,
    payload: { obrRoomId: 'room-1' },
  });

  assert.equal(response.statusCode, 404);
  assert.equal(response.json().code, 'PARTY_NOT_FOUND');

  await app.close();
});

test('POST /:id/detach-room forwards to the party service and returns 200 for the owner', async () => {
  resetState();
  currentSession = {
    session: { id: 'sess-gm' },
    user: { id: 'gm-1', isAnonymous: false },
  };
  const app = await buildApp();

  const response = await app.inject({
    method: 'POST',
    url: `/${PARTY_ID}/detach-room`,
  });

  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.json(), { id: PARTY_ID, obrRoomId: null });
  assert.deepEqual(detachRoomCalls, [{ session: currentSession, id: PARTY_ID }]);

  await app.close();
});

test('PUT /:id/miseries forwards the selected count to the party service', async () => {
  resetState();
  currentSession = {
    session: { id: 'sess-gm' },
    user: { id: 'gm-1', isAnonymous: false },
  };
  const app = await buildApp();

  const response = await app.inject({
    method: 'PUT',
    url: `/${PARTY_ID}/miseries`,
    payload: { miseryCount: 4 },
  });

  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.json(), {
    miseryCount: 4,
    updatedCharacters: 2,
  });
  assert.deepEqual(setMiseriesCalls, [
    { session: currentSession, id: PARTY_ID, miseryCount: 4 },
  ]);

  await app.close();
});

test('PUT /:id/miseries rejects values above seven before calling the service', async () => {
  resetState();
  const app = await buildApp();

  const response = await app.inject({
    method: 'PUT',
    url: `/${PARTY_ID}/miseries`,
    payload: { miseryCount: 8 },
  });

  assert.equal(response.statusCode, 400);
  assert.equal(setMiseriesCalls.length, 0);

  await app.close();
});
