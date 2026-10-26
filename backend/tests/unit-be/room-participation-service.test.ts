import assert from 'node:assert/strict';
import { beforeEach, mock, test } from 'node:test';
import type { AppSession } from '../../src/services/session.js';

const characterId = '822cdfa1-1d09-4504-94e7-1d5bb2efcb11';
const operationId = 'dbce1a10-49a8-4c23-bb7e-141d23d073ff';
const gm: AppSession = { user: { id: 'gm' } };
const state = {
  member: true,
  bound: true,
  receipt: null as { actorId: string; characterId: string } | null,
  writes: [] as string[],
  cleanup: [] as Array<{ generation: string; tokenId: string }>,
  events: [] as unknown[],
  error: null as Error | null,
  logs: [] as unknown[],
};
const ops = {
  getParty: async () => ({
    id: 'party',
    ownerUserId: 'gm',
    members: state.member ? [{ id: characterId }] : [],
  }),
  getCharacter: async () => ({
    id: characterId,
    userId: 'player',
    sessionId: null,
    partyId: state.member ? 'party' : null,
  }),
  getBindings: async () => ({
    players: state.bound
      ? [
          {
            obrPlayerId: 'player',
            characterId,
            obrConnectionId: null,
            assignedByPlayerId: 'player',
          },
        ]
      : [],
    tokens: state.bound
      ? [
          {
            obrTokenId: 'token',
            characterId,
            assignedPlayerId: null,
            generation: 'old-generation',
          },
        ]
      : [],
  }),
  getCleanup: async () => state.cleanup,
  getRemoval: async () => state.receipt,
  recordRemoval: async (receipt: { actorId: string; characterId: string }) => {
    state.receipt = receipt;
    state.writes.push('receipt');
  },
  addCleanup: async (item: { generation: string; tokenId: string }) => {
    state.cleanup.push(item);
    state.writes.push('cleanup');
  },
  removeMembership: async () => {
    state.member = false;
    state.writes.push('membership');
  },
  removeBindings: async () => {
    state.bound = false;
    state.writes.push('bindings');
  },
  setToken: async () => {
    state.writes.push('token');
    return {
      obrTokenId: 'token',
      characterId,
      assignedPlayerId: null,
      generation: 'fresh-generation',
    };
  },
  setPlayer: async () => {
    state.writes.push('player');
    return {
      obrPlayerId: 'player',
      characterId,
      obrConnectionId: null,
      assignedByPlayerId: 'player',
    };
  },
  clearToken: async () => {
    state.writes.push('clear-token');
  },
  clearPlayer: async () => {
    state.writes.push('clear-player');
  },
};
mock.module('../../src/repositories/room-participation-repository.js', {
  namedExports: {
    roomParticipationRepository: {
      transaction: async (
        _roomId: string,
        run: (value: typeof ops) => Promise<unknown>
      ) => {
        if (state.error) {
          throw state.error;
        }
        return run(ops);
      },
    },
  },
});
mock.module('../../src/lib/get-character-full.js', {
  namedExports: { getCharacterFull: async () => null },
});
const { createRoomParticipationService } =
  await import('../../src/services/room-participation-service.js');
const service = () =>
  createRoomParticipationService(
    {
      error: (error) => {
        state.logs.push(error);
      },
    },
    {
      publish: (_partyId: string, event: unknown) => {
        state.events.push(event);
      },
    } as Parameters<typeof createRoomParticipationService>[1]
  );
const removal = { roomId: 'room', characterId, operationId, session: gm };

beforeEach(() => {
  state.member = true;
  state.bound = true;
  state.receipt = null;
  state.writes = [];
  state.cleanup = [];
  state.events = [];
  state.logs = [];
  state.error = null;
});

test('removing a member clears both bindings and records captured generation cleanup', async () => {
  const result = await service().remove(removal);
  assert.ok(result.ok);
  assert.deepEqual(result.value.memberIds, []);
  assert.deepEqual(result.value.players, []);
  assert.deepEqual(result.value.tokens, []);
  assert.deepEqual(state.writes, [
    'receipt',
    'cleanup',
    'membership',
    'bindings',
  ]);
  assert.equal(state.cleanup[0].generation, 'old-generation');
  assert.deepEqual(state.events, [{ type: 'character.kicked', characterId }]);
});

test('a stored receipt makes a retry preserve a deliberate rejoin without another event', async () => {
  state.receipt = { actorId: 'gm', characterId };
  const result = await service().remove(removal);
  assert.ok(result.ok);
  assert.deepEqual(result.value.memberIds, [characterId]);
  assert.equal(result.value.tokens[0].generation, 'old-generation');
  assert.deepEqual(state.writes, []);
  assert.deepEqual(state.events, []);
});

test('an unrelated signed-in account cannot remove or update a binding', async () => {
  const session = { user: { id: 'outsider' } };
  const removed = await service().remove({ ...removal, session });
  const bound = await service().updateBinding({
    roomId: 'room',
    kind: 'token',
    id: 'token',
    characterId,
    session,
  });
  for (const result of [removed, bound]) {
    assert.ok(!result.ok);
    assert.equal(result.error.statusCode, 403);
  }
  assert.deepEqual(state.writes, []);
});

test('rebinding returns the repository fresh generation rather than its stale snapshot', async () => {
  const result = await service().updateBinding({
    roomId: 'room',
    kind: 'token',
    id: 'token',
    characterId,
    session: gm,
  });
  assert.ok(result.ok && result.value && 'generation' in result.value);
  assert.equal(result.value.generation, 'fresh-generation');
  assert.deepEqual(state.writes, ['token']);
});

test('an old GM assignment cannot be rebound after its member has left', async () => {
  state.member = false;
  const result = await service().updateBinding({
    roomId: 'room',
    kind: 'token',
    id: 'token',
    characterId,
    session: gm,
  });
  assert.ok(!result.ok);
  assert.equal(result.error.statusCode, 403);
  assert.deepEqual(state.writes, []);
});

test('a repository failure becomes a logged server error without publishing an event', async () => {
  state.error = new Error('database unavailable');
  const result = await service().remove(removal);
  assert.ok(!result.ok);
  assert.equal(result.error.statusCode, 500);
  assert.equal(state.logs.length, 1);
  assert.deepEqual(state.events, []);
});
