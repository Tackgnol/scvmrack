import assert from 'node:assert/strict';
import { beforeEach, mock, test } from 'node:test';

const CHARACTER_ID = '822cdfa1-1d09-4504-94e7-1d5bb2efcb11';

const state = {
  binding: null as { characterId: string } | null,
  accessRow: null as {
    userId: string | null;
    sessionId: string | null;
    partyId: string | null;
    party: null;
  } | null,
  fullCharacter: null as Record<string, unknown> | null,
  bindingCalls: [] as Array<{ roomId: string; playerId: string }>,
  transferCalls: [] as Array<{ characterId: string; userId: string }>,
  pruneCalls: [] as Array<{ userId: string; keepId: string }>,
  fullCalls: [] as Array<{ characterId: string; locale: string }>,
  pruneError: null as unknown,
  bindingError: null as unknown,
  logCalls: [] as Array<{ obj: unknown; msg?: string }>,
};

function resetState() {
  state.binding = { characterId: CHARACTER_ID };
  state.accessRow = {
    userId: 'gm-1',
    sessionId: null,
    partyId: 'party-1',
    party: null,
  };
  state.fullCharacter = {
    id: CHARACTER_ID,
    name: 'Foolium',
    className: 'Wretch',
    classDescription: null,
    origin: null,
    strength: 10,
    agility: 10,
    presence: 10,
    toughness: 10,
    maxHp: 4,
    currentHp: 4,
    silver: 0,
    omens: 1,
    maxOmens: 1,
    abilities: [],
    equipment: [],
    storage: [],
    equippedWeapons: [],
    equippedArmor: null,
    encumbrance: 0,
    maxEncumbrance: 8,
    createdAt: '2026-07-06T00:00:00.000Z',
    updatedAt: '2026-07-06T00:00:00.000Z',
  };
  state.bindingCalls = [];
  state.transferCalls = [];
  state.pruneCalls = [];
  state.fullCalls = [];
  state.pruneError = null;
  state.bindingError = null;
  state.logCalls = [];
}

mock.module('../../src/lib/obr-bindings-db.js', {
  namedExports: {
    obrBindingsDb: {
      getPlayerBinding: async (roomId: string, playerId: string) => {
        state.bindingCalls.push({ roomId, playerId });
        if (state.bindingError) throw state.bindingError;
        return state.binding;
      },
    },
  },
});

mock.module('../../src/repositories/character-repository.js', {
  namedExports: {
    characterRepository: {
      getPartyAccessContext: async () => state.accessRow,
      transferOwnership: async (characterId: string, userId: string) => {
        state.transferCalls.push({ characterId, userId });
        return {};
      },
      deleteOthersForUser: async (userId: string, keepId: string) => {
        state.pruneCalls.push({ userId, keepId });
        if (state.pruneError) throw state.pruneError;
        return { count: 1 };
      },
    },
  },
});

mock.module('../../src/lib/get-character-full.js', {
  namedExports: {
    getCharacterFull: async (characterId: string, locale: string) => {
      state.fullCalls.push({ characterId, locale });
      return state.fullCharacter;
    },
  },
});

const { createObrAssignmentService } = await import('../../src/services/obr-assignment-service.js');

const log = {
  error: (obj: unknown, msg?: string) => {
    state.logCalls.push({ obj, msg });
  },
};

const service = () => createObrAssignmentService(log);
const session = (id: string, anonymous = false) => ({
  user: { id, isAnonymous: anonymous },
});

beforeEach(() => {
  resetState();
});

test('claimAssignedPlayerCharacter requires a session user', async () => {
  const result = await service().claimAssignedPlayerCharacter({
    session: null,
    roomId: 'room-1',
    playerId: 'player-1',
    locale: 'en',
  });

  assert.equal(result.ok, false);
  assert.equal((result as any).error.statusCode, 401);
  assert.deepEqual(state.bindingCalls, []);
});

test('claimAssignedPlayerCharacter returns 404 when the player has no assignment', async () => {
  state.binding = null;

  const result = await service().claimAssignedPlayerCharacter({
    session: session('player-user-1'),
    roomId: 'room-1',
    playerId: 'player-1',
    locale: 'en',
  });

  assert.equal(result.ok, false);
  assert.equal((result as any).error.code, 'OBR_PLAYER_ASSIGNMENT_NOT_FOUND');
  assert.deepEqual(state.transferCalls, []);
  assert.deepEqual(state.fullCalls, []);
});

test('claimAssignedPlayerCharacter transfers a GM-owned assigned scvm to the player session', async () => {
  const result = await service().claimAssignedPlayerCharacter({
    session: session('player-user-1', true),
    roomId: 'room-1',
    playerId: 'player-1',
    locale: 'pl',
  });

  assert.equal(result.ok, true);
  assert.deepEqual(state.bindingCalls, [
    { roomId: 'room-1', playerId: 'player-1' },
  ]);
  assert.deepEqual(state.transferCalls, [
    { characterId: CHARACTER_ID, userId: 'player-user-1' },
  ]);
  assert.deepEqual(state.pruneCalls, [
    { userId: 'player-user-1', keepId: CHARACTER_ID },
  ]);
  assert.deepEqual(state.fullCalls, [
    { characterId: CHARACTER_ID, locale: 'pl' },
  ]);
  assert.equal((result as any).value.viewerAccess, 'owner');
  assert.equal((result as any).value.id, CHARACTER_ID);
});

test('claimAssignedPlayerCharacter does not transfer when the session already owns the scvm', async () => {
  state.accessRow = {
    userId: 'player-user-1',
    sessionId: null,
    partyId: 'party-1',
    party: null,
  };

  const result = await service().claimAssignedPlayerCharacter({
    session: session('player-user-1'),
    roomId: 'room-1',
    playerId: 'player-1',
    locale: 'en',
  });

  assert.equal(result.ok, true);
  assert.deepEqual(state.transferCalls, []);
  assert.deepEqual(state.pruneCalls, []);
});

test('claimAssignedPlayerCharacter keeps the claim when anonymous pruning fails', async () => {
  state.pruneError = new Error('prune failed');

  const result = await service().claimAssignedPlayerCharacter({
    session: session('player-user-1', true),
    roomId: 'room-1',
    playerId: 'player-1',
    locale: 'en',
  });

  assert.equal(result.ok, true);
  assert.deepEqual(state.transferCalls, [
    { characterId: CHARACTER_ID, userId: 'player-user-1' },
  ]);
  assert.equal(state.logCalls.length, 1);
});

test('claimAssignedPlayerCharacter maps unexpected binding errors to 500', async () => {
  state.bindingError = new Error('db down');

  const result = await service().claimAssignedPlayerCharacter({
    session: session('player-user-1'),
    roomId: 'room-1',
    playerId: 'player-1',
    locale: 'en',
  });

  assert.equal(result.ok, false);
  assert.equal((result as any).error.statusCode, 500);
  assert.equal((result as any).error.code, 'OBR_ASSIGNMENT_CLAIM_FAILED');
});
