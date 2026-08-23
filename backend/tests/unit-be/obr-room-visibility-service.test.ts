import assert from 'node:assert/strict';
import test, { beforeEach, mock } from 'node:test';

const ROOM = 'room-1';
const OWNER_ID = 'user-1';
const OWNER_SESSION = { user: { id: OWNER_ID } };
const OTHER_SESSION = { user: { id: 'user-2' } };
const BOUND_ID = '11111111-1111-4111-8111-111111111111';
const PARTY_ID = '22222222-2222-4222-8222-222222222222';
const OWNER_ID_CHARACTER = '33333333-3333-4333-8333-333333333333';
const MISSING_ID = '44444444-4444-4444-8444-444444444444';

let boundIds = new Set<string>();
let partyIds = new Set<string>();
let accessRows = new Map<string, unknown>();

mock.module('../../src/lib/obr-bindings-db.js', {
  namedExports: {
    obrBindingsDb: {
      filterCharacterIdsInRoom: async (ids: string[]) =>
        ids.filter((id) => boundIds.has(id)),
    },
  },
});

mock.module('../../src/repositories/character-repository.js', {
  namedExports: {
    characterRepository: {
      filterCharacterIdsInRoomParty: async (ids: string[]) =>
        ids.filter((id) => partyIds.has(id)),
      getPartyAccessContext: async (id: string) => accessRows.get(id) ?? null,
    },
  },
});

const {
  canUseCharacterInObrRoom,
  filterAdditionalVisibleCharacterIdsInObrRoom,
  filterVisibleCharacterIdsInObrRoom,
  isCharacterVisibleInObrRoom,
} = await import('../../src/services/obr-room-visibility-service.js');

beforeEach(() => {
  boundIds = new Set([BOUND_ID]);
  partyIds = new Set([PARTY_ID]);
  accessRows = new Map([
    [
      OWNER_ID_CHARACTER,
      {
        userId: OWNER_ID,
        sessionId: null,
        partyId: null,
        party: null,
      },
    ],
    [
      BOUND_ID,
      {
        userId: null,
        sessionId: 'other-session',
        partyId: null,
        party: null,
      },
    ],
  ]);
});

test('filterVisibleCharacterIdsInObrRoom combines binding and room-party visibility', async () => {
  const result = await filterVisibleCharacterIdsInObrRoom(
    [BOUND_ID, PARTY_ID, MISSING_ID, BOUND_ID, 'not-a-uuid'],
    ROOM
  );

  assert.deepEqual(result, [BOUND_ID, PARTY_ID]);
});

test('filterAdditionalVisibleCharacterIdsInObrRoom returns only room-party members for package extras', async () => {
  const result = await filterAdditionalVisibleCharacterIdsInObrRoom(
    [BOUND_ID, PARTY_ID, MISSING_ID],
    ROOM
  );

  assert.deepEqual(result, [PARTY_ID]);
});

test('isCharacterVisibleInObrRoom checks the combined visibility rule', async () => {
  assert.equal(await isCharacterVisibleInObrRoom(BOUND_ID, ROOM), true);
  assert.equal(await isCharacterVisibleInObrRoom(PARTY_ID, ROOM), true);
  assert.equal(await isCharacterVisibleInObrRoom(MISSING_ID, ROOM), false);
});

test('canUseCharacterInObrRoom allows owners and room-visible scvms', async () => {
  assert.equal(
    await canUseCharacterInObrRoom(OWNER_SESSION, OWNER_ID_CHARACTER, ROOM),
    true
  );
  assert.equal(
    await canUseCharacterInObrRoom(OTHER_SESSION, BOUND_ID, ROOM),
    true
  );
  assert.equal(
    await canUseCharacterInObrRoom(OTHER_SESSION, OWNER_ID_CHARACTER, ROOM),
    false
  );
  assert.equal(
    await canUseCharacterInObrRoom(OTHER_SESSION, 'not-a-uuid', ROOM),
    false
  );
});
