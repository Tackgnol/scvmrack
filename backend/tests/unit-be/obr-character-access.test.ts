import assert from 'node:assert/strict';
import { beforeEach, mock, test } from 'node:test';

const state = {
  binding: null as null | { characterId: string },
  calls: [] as Array<{ roomId: string; playerId: string }>,
};

mock.module('../../src/lib/obr-bindings-db.js', {
  namedExports: {
    obrBindingsDb: {
      getPlayerBinding: async (roomId: string, playerId: string) => {
        state.calls.push({ roomId, playerId });
        return state.binding;
      },
    },
  },
});

const {
  hasObrPlayerCharacterAccess,
  readObrCharacterAccessHeaders,
} = await import('../../src/lib/obr-character-access.js');

beforeEach(() => {
  state.binding = null;
  state.calls = [];
});

test('readObrCharacterAccessHeaders returns normalized room and player headers', () => {
  const context = readObrCharacterAccessHeaders({
    'x-obr-room-id': ' room-1 ',
    'x-obr-player-id': ' player-1 ',
    'x-obr-connection-id': ' conn-1 ',
  });

  assert.deepEqual(context, {
    roomId: 'room-1',
    playerId: 'player-1',
    connectionId: 'conn-1',
  });
});

test('readObrCharacterAccessHeaders ignores incomplete or oversized headers', () => {
  assert.equal(
    readObrCharacterAccessHeaders({ 'x-obr-room-id': 'room-1' }),
    null
  );
  assert.equal(
    readObrCharacterAccessHeaders({
      'x-obr-room-id': 'x'.repeat(257),
      'x-obr-player-id': 'player-1',
    }),
    null
  );
});

test('hasObrPlayerCharacterAccess requires the player binding to match the character', async () => {
  state.binding = { characterId: 'char-1' };

  assert.equal(
    await hasObrPlayerCharacterAccess('char-1', {
      roomId: 'room-1',
      playerId: 'player-1',
    }),
    true
  );
  assert.deepEqual(state.calls, [{ roomId: 'room-1', playerId: 'player-1' }]);

  assert.equal(
    await hasObrPlayerCharacterAccess('char-2', {
      roomId: 'room-1',
      playerId: 'player-1',
    }),
    false
  );
});
