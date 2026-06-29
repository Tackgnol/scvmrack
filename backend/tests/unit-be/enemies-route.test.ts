import assert from 'node:assert/strict';
import test, { beforeEach, mock } from 'node:test';

import Fastify from 'fastify';
import { apiError, type ApiHttpError } from '../../src/errors.js';

type AppSession = {
  session?: { id?: string | null } | null;
  user?: { id?: string | null; isAnonymous?: boolean | null } | null;
} | null;

const UUID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const ENEMY = {
  id: UUID,
  partyId: 'p1',
  name: 'Goblin',
  morale: 7,
  currentHealth: 4,
  healthPercent: 50,
};
const CARD = {
  id: UUID,
  name: 'Goblin',
  playerDescription: 'Small and rotten',
  healthPercent: 50,
  statusId: 'severely-wounded',
  statusLabel: 'Severely wounded',
};

let session: AppSession = null;
let ownerResult:
  | { ok: true; value: unknown }
  | { ok: false; error: ApiHttpError } = { ok: true, value: [ENEMY] };
let cardsResult:
  | { ok: true; value: unknown }
  | { ok: false; error: ApiHttpError } = { ok: true, value: [CARD] };
const calls: Array<{ method: string; arg: unknown }> = [];

mock.module('../../src/services/enemy-service.js', {
  namedExports: {
    createEnemyService: () => ({
      listForOwner: async (arg: unknown) => {
        calls.push({ method: 'listForOwner', arg });
        return ownerResult;
      },
      listCardsForPlayer: async (arg: unknown) => {
        calls.push({ method: 'listCardsForPlayer', arg });
        return cardsResult;
      },
      create: async (arg: unknown) => {
        calls.push({ method: 'create', arg });
        return { ok: true, value: ENEMY };
      },
      update: async (arg: unknown) => {
        calls.push({ method: 'update', arg });
        return { ok: true, value: ENEMY };
      },
      setHealth: async (arg: unknown) => {
        calls.push({ method: 'setHealth', arg });
        return { ok: true, value: ENEMY };
      },
      remove: async (arg: unknown) => {
        calls.push({ method: 'remove', arg });
        return { ok: true, value: undefined };
      },
    }),
  },
});

const { default: errorHandlerPlugin } = await import(
  '../../src/plugins/error-handler.js'
);
const { default: partyRoutes } = await import(
  '../../src/routes/parties/index.js'
);

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
      session;
  });
  await app.register(errorHandlerPlugin);
  await app.register(partyRoutes);
  await app.ready();
  return app;
}

const validBody = {
  name: 'Goblin',
  playerDescription: 'Small and rotten',
  currentHealth: 4,
  statuses: [{ id: 'h', percent: 100, label: 'Healthy' }],
};

beforeEach(() => {
  calls.length = 0;
  session = null;
  ownerResult = { ok: true, value: [ENEMY] };
  cardsResult = { ok: true, value: [CARD] };
});

test('GET by-room enemies forwards owner read', async () => {
  session = {
    session: { id: 's' },
    user: { id: 'gm', isAnonymous: false },
  };
  const app = await buildApp();

  const res = await app.inject({
    method: 'GET',
    url: '/by-room/room-1/enemies',
  });

  assert.equal(res.statusCode, 200);
  assert.equal(res.json()[0].morale, 7);
  assert.equal(calls[0].method, 'listForOwner');
  await app.close();
});

test('GET enemies/cards forwards (roomId, characterId)', async () => {
  const app = await buildApp();

  const res = await app.inject({
    method: 'GET',
    url: `/by-room/room-1/enemies/cards?characterId=${UUID}`,
  });

  assert.equal(res.statusCode, 200);
  assert.equal('morale' in res.json()[0], false);
  assert.deepEqual(calls[0].arg, { roomId: 'room-1', characterId: UUID });
  await app.close();
});

test('POST enemies validates the body before the service', async () => {
  session = {
    session: { id: 's' },
    user: { id: 'gm', isAnonymous: false },
  };
  const app = await buildApp();

  const res = await app.inject({
    method: 'POST',
    url: '/by-room/room-1/enemies',
    payload: { name: '' },
  });

  assert.equal(res.statusCode, 400);
  assert.equal(calls.length, 0);
  await app.close();
});

test('POST enemies forwards valid creates', async () => {
  session = {
    session: { id: 's' },
    user: { id: 'gm', isAnonymous: false },
  };
  const app = await buildApp();

  const res = await app.inject({
    method: 'POST',
    url: '/by-room/room-1/enemies',
    payload: validBody,
  });

  assert.equal(res.statusCode, 201);
  assert.equal(calls[0].method, 'create');
  await app.close();
});

test('PATCH health forwards the value', async () => {
  session = {
    session: { id: 's' },
    user: { id: 'gm', isAnonymous: false },
  };
  const app = await buildApp();

  const res = await app.inject({
    method: 'PATCH',
    url: `/by-room/room-1/enemies/${UUID}/health`,
    payload: { currentHealth: 3 },
  });

  assert.equal(res.statusCode, 200);
  assert.equal(calls[0].method, 'setHealth');
  await app.close();
});

test('DELETE enemy returns 204', async () => {
  session = {
    session: { id: 's' },
    user: { id: 'gm', isAnonymous: false },
  };
  const app = await buildApp();

  const res = await app.inject({
    method: 'DELETE',
    url: `/by-room/room-1/enemies/${UUID}`,
  });

  assert.equal(res.statusCode, 204);
  await app.close();
});

test('owner read surfaces a service 404', async () => {
  session = {
    session: { id: 's' },
    user: { id: 'gm', isAnonymous: false },
  };
  ownerResult = {
    ok: false,
    error: apiError(404, 'PARTY_NOT_FOUND', 'Party not found'),
  };
  const app = await buildApp();

  const res = await app.inject({
    method: 'GET',
    url: '/by-room/room-1/enemies',
  });

  assert.equal(res.statusCode, 404);
  await app.close();
});
