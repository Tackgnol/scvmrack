import assert from 'node:assert/strict';
import test, { beforeEach, mock } from 'node:test';
import Fastify from 'fastify';

type Session = { user: { id: string; isAnonymous?: boolean } } | null;

const CHARACTER_ID = '822cdfa1-1d09-4504-94e7-1d5bb2efcb11';

let currentSession: Session = null;
let serviceResult: unknown;
const serviceCalls: Array<{
  session: unknown;
  roomId: string;
  playerId: string;
  locale: string;
}> = [];

mock.module('../../src/services/obr-assignment-service.js', {
  namedExports: {
    createObrAssignmentService: () => ({
      claimAssignedPlayerCharacter: async (input: {
        session: unknown;
        roomId: string;
        playerId: string;
        locale: string;
      }) => {
        serviceCalls.push(input);
        return serviceResult;
      },
    }),
  },
});

const { apiError } = await import('../../src/errors.js');
const { default: errorHandlerPlugin } = await import('../../src/plugins/error-handler.js');
const { default: obrRoutes } = await import('../../src/routes/obr/index.js');

async function buildApp() {
  const app = Fastify({ logger: false });
  app.decorateRequest('appSession', null);
  app.addHook('onRequest', async (request) => {
    (request as typeof request & { appSession: Session }).appSession = currentSession;
  });
  await app.register(errorHandlerPlugin);
  await app.register(obrRoutes);
  await app.ready();
  return app;
}

beforeEach(() => {
  currentSession = { user: { id: 'player-user-1', isAnonymous: true } };
  serviceCalls.length = 0;
  serviceResult = {
    ok: true,
    value: {
      id: CHARACTER_ID,
      name: 'Foolium',
      viewerAccess: 'owner',
    },
  };
});

test('POST /rooms/:roomId/players/:playerId/character/claim forwards route params and session', async () => {
  const app = await buildApp();

  const response = await app.inject({
    method: 'POST',
    url: '/rooms/room-1/players/player-1/character/claim?locale=pl',
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.json().id, CHARACTER_ID);
  assert.deepEqual(serviceCalls, [
    {
      session: currentSession,
      roomId: 'room-1',
      playerId: 'player-1',
      locale: 'pl',
    },
  ]);

  await app.close();
});

test('POST /rooms/:roomId/players/:playerId/character/claim renders service errors', async () => {
  serviceResult = {
    ok: false,
    error: apiError(
      404,
      'OBR_PLAYER_ASSIGNMENT_NOT_FOUND',
      'No scvm is assigned to this Owlbear player.'
    ),
  };
  const app = await buildApp();

  const response = await app.inject({
    method: 'POST',
    url: '/rooms/room-1/players/player-1/character/claim',
  });

  assert.equal(response.statusCode, 404);
  assert.equal(response.json().code, 'OBR_PLAYER_ASSIGNMENT_NOT_FOUND');

  await app.close();
});
