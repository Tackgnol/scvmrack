import assert from 'node:assert/strict';
import { beforeEach, mock, test } from 'node:test';
import { Prisma } from '@prisma/client';
import { randomSectionSeeds } from '../../src/lib/draft-seeds.js';

const VALID_ID = '11111111-1111-4111-8111-111111111111';
const PARTY_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

// ---- Mutable mock state ----
type OwnerRow = { userId: string | null } | null;

const state = {
  ownerRow: null as OwnerRow,
  accessRow: null as Record<string, unknown> | null,
  presenceRow: null as { presence: number } | null,
  partyIdRow: null as { partyId: string | null } | null,
  deleteResult: { count: 1 },
  countValue: 0,
  listRows: [] as Array<Record<string, unknown>>,
  classNameMap: new Map<number, string>(),
  classNameMapCalls: [] as Array<{ classIds: number[]; locale: string }>,
  classExistsResult: true,
  updateError: null as unknown,
  generateError: null as unknown,
  createFromDraftError: null as unknown,
  fullError: null as unknown,
  countError: null as unknown,
  listError: null as unknown,
  deleteError: null as unknown,
  deleteOthersError: null as unknown,
  deleteOthersResult: { count: 0 },
  deleteOthersCalls: [] as Array<{ userId: string; keepId: string }>,
  userHasCharactersResult: false,
  generatedId: 'generated-id',
  fullResult: { id: VALID_ID, name: 'Hero' } as Record<string, unknown> | null,
  // When set, getCharacterFull resolves per-id from this map (missing key → null);
  // otherwise it falls back to fullResult. Powers the getCards batch-read tests.
  fullById: null as Record<string, Record<string, unknown> | null> | null,
  fullCalls: [] as Array<{ id: string; locale: string }>,
  // When set, filterIdsInRoom returns only these ids; otherwise it passes ids
  // through (all bound to the room). Powers the (roomId, id) gate tests.
  inRoomIds: null as string[] | null,
  filterRoomCalls: [] as Array<{ ids: string[]; roomId: string }>,
  setObrRoomCalls: [] as Array<{ id: string; roomId: string }>,
  setObrRoomError: null as unknown,
  updateCalls: [] as Array<{ id: string; data: unknown }>,
  generateCalls: [] as Array<{ classId: number | null; userId?: string }>,
  createFromDraftCalls: [] as Array<{ draft: unknown; userId: string }>,
  hydrateCalls: 0,
};

function resetState(): void {
  state.ownerRow = { userId: 'user-1' };
  state.accessRow = null;
  state.presenceRow = { presence: 10 };
  state.partyIdRow = { partyId: null };
  state.deleteResult = { count: 1 };
  state.countValue = 0;
  state.listRows = [];
  state.classNameMap = new Map();
  state.classNameMapCalls = [];
  state.classExistsResult = true;
  state.updateError = null;
  state.generateError = null;
  state.createFromDraftError = null;
  state.fullError = null;
  state.countError = null;
  state.listError = null;
  state.deleteError = null;
  state.deleteOthersError = null;
  state.deleteOthersResult = { count: 0 };
  state.deleteOthersCalls = [];
  state.userHasCharactersResult = false;
  state.generatedId = 'generated-id';
  state.fullResult = { id: VALID_ID, name: 'Hero' };
  state.fullById = null;
  state.fullCalls = [];
  state.inRoomIds = null;
  state.filterRoomCalls = [];
  state.setObrRoomCalls = [];
  state.setObrRoomError = null;
  state.updateCalls = [];
  state.generateCalls = [];
  state.createFromDraftCalls = [];
  state.hydrateCalls = 0;
}

mock.module('../../src/repositories/character-repository.js', {
  namedExports: {
    characterRepository: {
      getOwnerId: async () => state.ownerRow,
      getPartyAccessContext: async () => {
        if (state.accessRow !== null) {
          return state.accessRow;
        }
        if (!state.ownerRow) {
          return null;
        }
        return {
          userId: state.ownerRow.userId,
          sessionId: null,
          partyId: state.partyIdRow?.partyId ?? null,
          party: null,
        };
      },
      getPresence: async () => state.presenceRow,
      getPartyId: async () => state.partyIdRow,
      filterIdsInRoom: async (ids: string[], roomId: string) => {
        state.filterRoomCalls.push({ ids, roomId });
        return state.inRoomIds ?? ids;
      },
      setObrRoom: async (id: string, roomId: string) => {
        state.setObrRoomCalls.push({ id, roomId });
        if (state.setObrRoomError) throw state.setObrRoomError;
        return {};
      },
      update: async (id: string, data: unknown) => {
        state.updateCalls.push({ id, data });
        if (state.updateError) throw state.updateError;
        return {};
      },
      deleteById: async () => {
        if (state.deleteError) throw state.deleteError;
        return state.deleteResult;
      },
      deleteOthersForUser: async (userId: string, keepId: string) => {
        state.deleteOthersCalls.push({ userId, keepId });
        if (state.deleteOthersError) throw state.deleteOthersError;
        return state.deleteOthersResult;
      },
      userHasCharacters: async () => state.userHasCharactersResult,
      count: async () => {
        if (state.countError) throw state.countError;
        return state.countValue;
      },
      listSummariesByUser: async () => {
        if (state.listError) throw state.listError;
        return state.listRows;
      },
      getClassNameMap: async (classIds: number[], locale: string) => {
        state.classNameMapCalls.push({ classIds, locale });
        return state.classNameMap;
      },
      classExists: async () => state.classExistsResult,
    },
  },
});

mock.module('../../src/lib/generate-character.js', {
  namedExports: {
    generateCharacter: async (classId: number | null, _roller: unknown, userId?: string) => {
      state.generateCalls.push({ classId, userId });
      if (state.generateError) throw state.generateError;
      return state.generatedId;
    },
    createCharacterFromDraft: async (draft: unknown, userId: string) => {
      state.createFromDraftCalls.push({ draft, userId });
      if (state.createFromDraftError) throw state.createFromDraftError;
      return 'draft-character-id';
    },
  },
});

mock.module('../../src/lib/get-character-full.js', {
  namedExports: {
    getCharacterFull: async (id: string, locale: string) => {
      state.fullCalls.push({ id, locale });
      if (state.fullError) throw state.fullError;
      if (state.fullById) {
        return state.fullById[id] ?? null;
      }
      return state.fullResult;
    },
  },
});

mock.module('../../src/lib/inventory.js', {
  namedExports: {
    hydrateInventoryUses: async (items: unknown[]) => {
      state.hydrateCalls++;
      return items;
    },
  },
});

const { createCharacterService } = await import('../../src/services/character-service.js');

const noopLog = { error: () => {} };
const service = () => createCharacterService(noopLog);
const publishedEvents: Array<{
  partyId: string;
  event: { type: string; [key: string]: unknown };
}> = [];
const serviceWithBus = () =>
  createCharacterService(noopLog, {
    publish: (
      partyId: string,
      event: { type: string; [key: string]: unknown }
    ) => {
      publishedEvents.push({ partyId, event });
    },
    subscribe: () => () => {},
  });
const session = (id: string | null) => (id ? { user: { id } } : null);
const guestSession = (id: string) => ({ user: { id, isAnonymous: true } });

beforeEach(() => {
  resetState();
  publishedEvents.length = 0;
});

// ---- generate ----
test('generate requires a session', async () => {
  const r = await service().generate({ session: null, locale: 'en' });
  assert.equal(r.ok, false);
  assert.equal((r as { error: { statusCode: number; code: string } }).error.statusCode, 401);
  assert.equal(state.generateCalls.length, 0);
});

test('generate binds ownership at creation and returns the full character', async () => {
  const r = await service().generate({ session: session('user-1'), classId: 2, locale: 'pl' });
  assert.equal(r.ok, true);
  assert.deepEqual(state.generateCalls, [{ classId: 2, userId: 'user-1' }]);
  assert.deepEqual(state.createFromDraftCalls, []);
  assert.deepEqual((r as { value: unknown }).value, state.fullResult);
});

test('generate with a draft rebuilds from seeds and persists via createCharacterFromDraft', async () => {
  const seeds = randomSectionSeeds();
  const draft = { classId: 1, classless: false, seeds };

  const result = await service().generate({
    session: session('user-1'),
    draft,
    locale: 'en',
  });

  assert.equal(result.ok, true);
  assert.deepEqual(state.generateCalls, []);
  assert.deepEqual(state.createFromDraftCalls, [{ draft, userId: 'user-1' }]);
});

test('generate with an incomplete classless draft returns 400', async () => {
  const result = await service().generate({
    session: session('user-1'),
    draft: {
      classId: null,
      classless: true,
      seeds: randomSectionSeeds(),
      dropLowestAbilities: ['strength'],
    },
    locale: 'en',
  });

  assert.equal(result.ok, false);
  assert.equal((result as any).error.statusCode, 400);
  assert.equal((result as any).error.code, 'CLASSLESS_STATS_INCOMPLETE');
  assert.deepEqual(state.createFromDraftCalls, []);
});

test('generate with a complete classless draft persists via createCharacterFromDraft', async () => {
  const seeds = randomSectionSeeds();
  const draft = {
    classId: null,
    classless: true,
    seeds,
    dropLowestAbilities: ['strength', 'presence'] as const,
  };

  const result = await service().generate({
    session: session('user-1'),
    draft,
    locale: 'en',
  });

  assert.equal(result.ok, true);
  assert.deepEqual(state.generateCalls, []);
  assert.deepEqual(state.createFromDraftCalls, [{ draft, userId: 'user-1' }]);
});

test('generate with a draft rejects an unknown class with 404', async () => {
  state.classExistsResult = false;

  const result = await service().generate({
    session: session('user-1'),
    draft: { classId: 42, classless: false, seeds: randomSectionSeeds() },
    locale: 'en',
  });

  assert.equal(result.ok, false);
  assert.equal((result as any).error.code, 'CLASS_NOT_FOUND');
  assert.deepEqual(state.createFromDraftCalls, []);
});

test('generate returns 409 when a guest already owns a scvm and did not opt into replacing', async () => {
  state.userHasCharactersResult = true;
  const r = await service().generate({ session: guestSession('guest-1'), classId: 2, locale: 'en' });
  assert.equal(r.ok, false);
  assert.equal((r as any).error.statusCode, 409);
  assert.equal((r as any).error.code, 'SCVM_ALREADY_EXISTS');
  // Conflict is decided before any write.
  assert.deepEqual(state.generateCalls, []);
  assert.deepEqual(state.deleteOthersCalls, []);
});

test('generate lets a guest forge their first scvm (no existing, no replace)', async () => {
  state.userHasCharactersResult = false;
  const r = await service().generate({ session: guestSession('guest-1'), classId: 2, locale: 'en' });
  assert.equal(r.ok, true);
  assert.equal(state.generateCalls.length, 1);
  assert.deepEqual(state.deleteOthersCalls, []);
});

test('generate replaces a guest\'s scvm when replace is opted in (create first, then prune)', async () => {
  state.userHasCharactersResult = true;
  state.generatedId = 'new-guest-char';
  const r = await service().generate({
    session: guestSession('guest-1'),
    classId: 2,
    replace: true,
    locale: 'en',
  });
  assert.equal(r.ok, true);
  assert.equal(state.generateCalls.length, 1);
  assert.deepEqual(state.deleteOthersCalls, [
    { userId: 'guest-1', keepId: 'new-guest-char' },
  ]);
});

test('generate never blocks or prunes an authenticated account (keeps the full roster)', async () => {
  state.userHasCharactersResult = true;
  const r = await service().generate({ session: session('user-1'), classId: 2, locale: 'en' });
  assert.equal(r.ok, true);
  assert.deepEqual(state.deleteOthersCalls, []);
});

test('generate still succeeds for a guest when pruning the prior scvm fails', async () => {
  state.userHasCharactersResult = true;
  state.deleteOthersError = new Error('prune boom');
  const r = await service().generate({ session: guestSession('guest-1'), replace: true, locale: 'en' });
  assert.equal(r.ok, true);
  assert.deepEqual((r as { value: unknown }).value, state.fullResult);
});

test('generate fails 500 when the generated character cannot be fetched', async () => {
  state.fullResult = null;
  const r = await service().generate({ session: session('user-1'), locale: 'en' });
  assert.equal(r.ok, false);
  assert.equal((r as any).error.statusCode, 500);
  assert.equal((r as any).error.code, 'CHARACTER_GENERATION_FETCH_FAILED');
});

// ---- ownership matrix (via getById) ----
test('getById rejects an invalid UUID with 400', async () => {
  const r = await service().getById({ id: 'not-a-uuid', session: session('user-1'), locale: 'en' });
  assert.equal(r.ok, false);
  assert.equal((r as any).error.code, 'INVALID_CHARACTER_ID');
});

test('getById requires a session', async () => {
  const r = await service().getById({ id: VALID_ID, session: null, locale: 'en' });
  assert.equal((r as any).error.statusCode, 401);
});

test('getById returns 404 when the character does not exist', async () => {
  state.ownerRow = null;
  const r = await service().getById({ id: VALID_ID, session: session('user-1'), locale: 'en' });
  assert.equal((r as any).error.statusCode, 404);
  assert.equal((r as any).error.code, 'CHARACTER_NOT_FOUND');
});

test('getById returns 403 when the session does not own the character', async () => {
  state.ownerRow = { userId: 'someone-else' };
  const r = await service().getById({ id: VALID_ID, session: session('user-1'), locale: 'en' });
  assert.equal((r as any).error.statusCode, 403);
  assert.equal((r as any).error.code, 'CHARACTER_ACCESS_DENIED');
});

test('getById returns the character for its owner', async () => {
  const r = await service().getById({ id: VALID_ID, session: session('user-1'), locale: 'en' });
  assert.equal(r.ok, true);
  assert.deepEqual((r as any).value, {
    ...state.fullResult,
    viewerAccess: 'owner',
  });
});

test('getById returns a read-only party view for the party GM', async () => {
  state.accessRow = {
    userId: 'player-1',
    sessionId: null,
    partyId: PARTY_ID,
    party: {
      ownerUserId: 'gm-1',
      members: [{ userId: 'player-1', sessionId: null }],
    },
  };

  const r = await service().getById({
    id: VALID_ID,
    session: session('gm-1'),
    locale: 'en',
  });

  assert.equal(r.ok, true);
  assert.equal((r as any).value.viewerAccess, 'party');
});

test('getById returns a read-only party view for another party member', async () => {
  state.accessRow = {
    userId: 'player-1',
    sessionId: null,
    partyId: PARTY_ID,
    party: {
      ownerUserId: 'gm-1',
      members: [
        { userId: 'player-1', sessionId: null },
        { userId: 'player-2', sessionId: null },
      ],
    },
  };

  const r = await service().getById({
    id: VALID_ID,
    session: session('player-2'),
    locale: 'en',
  });

  assert.equal(r.ok, true);
  assert.equal((r as any).value.viewerAccess, 'party');
});

// ---- getCards (compact batch read) ----
const VALID_ID_2 = '22222222-2222-4222-8222-222222222222';

test('getCards returns a card per valid id in input order, sans private fields', async () => {
  state.fullById = {
    [VALID_ID]: { id: VALID_ID, name: 'Alpha', currentHp: 5, notes: 'secret-a' },
    [VALID_ID_2]: { id: VALID_ID_2, name: 'Beta', currentHp: 3, notes: 'secret-b' },
  };

  const r = await service().getCards({ ids: [VALID_ID, VALID_ID_2], roomId: 'room-1', locale: 'en' });

  assert.equal(r.ok, true);
  const cards = (r as any).value as Array<Record<string, unknown>>;
  assert.equal(cards.length, 2);
  // Input order is preserved.
  assert.equal(cards[0].id, VALID_ID);
  assert.equal(cards[0].name, 'Alpha');
  assert.equal(cards[1].id, VALID_ID_2);
  assert.equal(cards[1].name, 'Beta');
  // Compact projection shape: private fields are dropped.
  assert.equal('notes' in cards[0], false);
  assert.equal('notes' in cards[1], false);
  // Allowlisted card fields are present.
  assert.equal(cards[0].currentHp, 5);
  assert.ok('equippedWeapons' in cards[0]);
});

test('getCards silently drops a non-UUID id and only fetches valid ones', async () => {
  state.fullById = {
    [VALID_ID]: { id: VALID_ID, name: 'Alpha' },
  };

  const r = await service().getCards({ ids: ['not-a-uuid', VALID_ID], roomId: 'room-1', locale: 'en' });

  assert.equal(r.ok, true);
  const cards = (r as any).value as Array<Record<string, unknown>>;
  assert.equal(cards.length, 1);
  assert.equal(cards[0].id, VALID_ID);
  // Only the valid id reached getCharacterFull.
  assert.deepEqual(state.fullCalls, [{ id: VALID_ID, locale: 'en' }]);
});

test('getCards drops ids whose character no longer exists (null full)', async () => {
  state.fullById = {
    [VALID_ID]: null,
    [VALID_ID_2]: { id: VALID_ID_2, name: 'Beta' },
  };

  const r = await service().getCards({ ids: [VALID_ID, VALID_ID_2], roomId: 'room-1', locale: 'en' });

  assert.equal(r.ok, true);
  const cards = (r as any).value as Array<Record<string, unknown>>;
  assert.equal(cards.length, 1);
  assert.equal(cards[0].id, VALID_ID_2);
});

test('getCards returns ok([]) for empty/all-invalid ids without fetching', async () => {
  const empty = await service().getCards({ ids: [], roomId: 'room-1', locale: 'en' });
  assert.equal(empty.ok, true);
  assert.deepEqual((empty as any).value, []);

  const allInvalid = await service().getCards({ ids: ['x', 'not-a-uuid'], roomId: 'room-1', locale: 'en' });
  assert.equal(allInvalid.ok, true);
  assert.deepEqual((allInvalid as any).value, []);

  assert.deepEqual(state.fullCalls, []);
});

test('getCards caps the batch at the first 50 ids in input order', async () => {
  const ids = Array.from(
    { length: 61 },
    (_, i) => `${i.toString(16).padStart(8, '0')}-1111-4111-8111-111111111111`
  );

  const r = await service().getCards({ ids, roomId: 'room-1', locale: 'en' });

  assert.equal(r.ok, true);
  assert.equal(state.fullCalls.length, 50);
  assert.deepEqual(
    state.fullCalls.map((c) => c.id),
    ids.slice(0, 50)
  );
});

test('getCards maps an unexpected failure to 5xx CHARACTER_CARDS_FAILED', async () => {
  state.fullError = new Error('boom');
  const r = await service().getCards({ ids: [VALID_ID], roomId: 'room-1', locale: 'en' });
  assert.equal((r as any).error.statusCode, 500);
  assert.equal((r as any).error.code, 'CHARACTER_CARDS_FAILED');
});

test('getCards drops ids not bound to the room and only fetches the survivors', async () => {
  state.inRoomIds = [VALID_ID_2]; // VALID_ID is bound to a different room
  state.fullById = {
    [VALID_ID]: { id: VALID_ID, name: 'Alpha' },
    [VALID_ID_2]: { id: VALID_ID_2, name: 'Beta' },
  };

  const r = await service().getCards({
    ids: [VALID_ID, VALID_ID_2],
    roomId: 'room-1',
    locale: 'en',
  });

  assert.equal(r.ok, true);
  const cards = (r as any).value as Array<Record<string, unknown>>;
  assert.equal(cards.length, 1);
  assert.equal(cards[0].id, VALID_ID_2);
  assert.deepEqual(state.filterRoomCalls, [
    { ids: [VALID_ID, VALID_ID_2], roomId: 'room-1' },
  ]);
  assert.deepEqual(state.fullCalls, [{ id: VALID_ID_2, locale: 'en' }]);
});

test('getCards returns ok([]) without a roomId and never hits the repo', async () => {
  const r = await service().getCards({ ids: [VALID_ID], roomId: '', locale: 'en' });
  assert.equal(r.ok, true);
  assert.deepEqual((r as any).value, []);
  assert.deepEqual(state.filterRoomCalls, []);
  assert.deepEqual(state.fullCalls, []);
});

// ---- bindObrRoom (capability-gate write half) ----
test('bindObrRoom stamps the room for the owner', async () => {
  state.ownerRow = { userId: 'user-1' };
  const r = await service().bindObrRoom({
    id: VALID_ID,
    session: session('user-1'),
    roomId: '  room-1  ',
  });
  assert.equal(r.ok, true);
  assert.deepEqual(state.setObrRoomCalls, [{ id: VALID_ID, roomId: 'room-1' }]);
});

test('bindObrRoom rejects a non-owner with 403 and writes nothing', async () => {
  state.ownerRow = { userId: 'someone-else' };
  const r = await service().bindObrRoom({
    id: VALID_ID,
    session: session('user-1'),
    roomId: 'room-1',
  });
  assert.equal(r.ok, false);
  assert.equal((r as any).error.statusCode, 403);
  assert.deepEqual(state.setObrRoomCalls, []);
});

test('bindObrRoom rejects an empty room id with 400', async () => {
  state.ownerRow = { userId: 'user-1' };
  const r = await service().bindObrRoom({
    id: VALID_ID,
    session: session('user-1'),
    roomId: '   ',
  });
  assert.equal(r.ok, false);
  assert.equal((r as any).error.statusCode, 400);
  assert.equal((r as any).error.code, 'INVALID_OBR_ROOM_ID');
  assert.deepEqual(state.setObrRoomCalls, []);
});

// ---- update ----
test('update rejects an empty patch with 400', async () => {
  const r = await service().update({
    id: VALID_ID,
    session: session('user-1'),
    body: { unknownField: 1 },
    rawLocale: 'en',
  });
  assert.equal((r as any).error.code, 'EMPTY_CHARACTER_UPDATE');
  assert.equal(state.updateCalls.length, 0);
});

test('update hydrates inventory uses and persists', async () => {
  const r = await service().update({
    id: VALID_ID,
    session: session('user-1'),
    body: { equipment: [{ key: 'weapons.sword', name: 'Sword' }] },
    rawLocale: 'en',
  });
  assert.equal(r.ok, true);
  assert.equal(state.hydrateCalls, 1);
  assert.equal(state.updateCalls.length, 1);
});

test('update preserves plain punctuation instead of html-encoding saved text', async () => {
  const r = await service().update({
    id: VALID_ID,
    session: session('user-1'),
    body: { notes: "It's quite obnoxious really" },
    rawLocale: 'en',
  });

  assert.equal(r.ok, true);
  assert.deepEqual(state.updateCalls[0], {
    id: VALID_ID,
    data: { notes: "It's quite obnoxious really" },
  });
});

test('update publishes changed fields when the character belongs to a party', async () => {
  state.partyIdRow = { partyId: PARTY_ID };
  const r = await serviceWithBus().update({
    id: VALID_ID,
    session: session('user-1'),
    body: { name: 'Hero II', currentHp: 3 },
    rawLocale: 'en',
  });

  assert.equal(r.ok, true);
  assert.deepEqual(publishedEvents, [
    {
      partyId: PARTY_ID,
      event: {
        type: 'character.updated',
        characterId: VALID_ID,
        fields: ['name', 'currentHp'],
      },
    },
  ]);
});

test('update does not publish when the character is not in a party', async () => {
  const r = await serviceWithBus().update({
    id: VALID_ID,
    session: session('user-1'),
    body: { name: 'Hero II' },
    rawLocale: 'en',
  });

  assert.equal(r.ok, true);
  assert.deepEqual(publishedEvents, []);
});

test('update maps a Prisma P2025 to a 404 not-found', async () => {
  state.updateError = new Prisma.PrismaClientKnownRequestError('not found', {
    code: 'P2025',
    clientVersion: '6.19.3',
  });
  const r = await service().update({
    id: VALID_ID,
    session: session('user-1'),
    body: { name: 'Hero' },
    rawLocale: 'en',
  });
  assert.equal((r as any).error.statusCode, 404);
  assert.equal((r as any).error.code, 'CHARACTER_NOT_FOUND');
});

// ---- list ----
test('list requires a session', async () => {
  const r = await service().list({ session: null, acceptLanguage: 'en' });
  assert.equal((r as any).error.statusCode, 401);
});

test('list merges localized class names', async () => {
  state.listRows = [
    {
      id: VALID_ID,
      name: 'Hero',
      classId: 2,
      currentHp: 5,
      maxHp: 8,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];
  state.classNameMap = new Map([[2, 'Occult Herbmaster']]);
  const r = await service().list({ session: session('user-1'), acceptLanguage: 'pl' });
  assert.equal(r.ok, true);
  assert.equal((r as any).value[0].className, 'Occult Herbmaster');
  assert.equal(state.classNameMapCalls[0]?.locale, 'pl');
});

test('list query locale overrides Accept-Language', async () => {
  state.listRows = [
    {
      id: VALID_ID,
      name: 'Hero',
      classId: 2,
      currentHp: 5,
      maxHp: 8,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const r = await service().list({
    session: session('user-1'),
    rawLocale: 'en',
    acceptLanguage: 'pl',
  });

  assert.equal(r.ok, true);
  assert.equal(state.classNameMapCalls[0]?.locale, 'en');
});

// ---- remove ----
test('remove returns 404 when nothing was deleted', async () => {
  state.deleteResult = { count: 0 };
  const r = await service().remove({ id: VALID_ID, session: session('user-1') });
  assert.equal((r as any).error.statusCode, 404);
});

test('remove succeeds for the owner', async () => {
  const r = await service().remove({ id: VALID_ID, session: session('user-1') });
  assert.equal(r.ok, true);
});

test('remove publishes character.left when the deleted character belonged to a party', async () => {
  state.partyIdRow = { partyId: PARTY_ID };
  const r = await serviceWithBus().remove({
    id: VALID_ID,
    session: session('user-1'),
  });

  assert.equal(r.ok, true);
  assert.deepEqual(publishedEvents, [
    {
      partyId: PARTY_ID,
      event: { type: 'character.left', characterId: VALID_ID },
    },
  ]);
});

// ---- count ----
test('count returns the total', async () => {
  state.countValue = 42;
  const r = await service().count();
  assert.equal(r.ok, true);
  assert.deepEqual((r as any).value, { total: 42 });
});

// ---- unexpected (5xx) error mapping per method ----
test('generate maps an unexpected failure to 5xx CHARACTER_GENERATION_FAILED', async () => {
  state.generateError = new Error('boom');
  const r = await service().generate({ session: session('user-1'), locale: 'en' });
  assert.equal((r as any).error.statusCode, 500);
  assert.equal((r as any).error.code, 'CHARACTER_GENERATION_FAILED');
});

test('getById maps an unexpected failure to 5xx CHARACTER_FETCH_FAILED', async () => {
  state.fullError = new Error('boom');
  const r = await service().getById({ id: VALID_ID, session: session('user-1'), locale: 'en' });
  assert.equal((r as any).error.statusCode, 500);
  assert.equal((r as any).error.code, 'CHARACTER_FETCH_FAILED');
});

test('update maps a non-P2025 failure to 5xx CHARACTER_UPDATE_FAILED', async () => {
  state.updateError = new Error('boom');
  const r = await service().update({
    id: VALID_ID,
    session: session('user-1'),
    body: { name: 'Hero' },
    rawLocale: 'en',
  });
  assert.equal((r as any).error.statusCode, 500);
  assert.equal((r as any).error.code, 'CHARACTER_UPDATE_FAILED');
});

test('update returns 404 when the character vanishes before re-fetch', async () => {
  state.fullResult = null;
  state.partyIdRow = { partyId: PARTY_ID };
  const r = await serviceWithBus().update({
    id: VALID_ID,
    session: session('user-1'),
    body: { name: 'Hero' },
    rawLocale: 'en',
  });
  assert.equal((r as any).error.statusCode, 404);
  assert.equal((r as any).error.code, 'CHARACTER_NOT_FOUND');
  assert.deepEqual(publishedEvents, []);
});

test('list maps an unexpected failure to 5xx CHARACTER_LIST_FAILED', async () => {
  state.listError = new Error('boom');
  const r = await service().list({ session: session('user-1'), acceptLanguage: 'en' });
  assert.equal((r as any).error.statusCode, 500);
  assert.equal((r as any).error.code, 'CHARACTER_LIST_FAILED');
});

test('remove maps a "Character not found" failure to a 404', async () => {
  state.deleteError = new Error('Character not found during delete');
  const r = await service().remove({ id: VALID_ID, session: session('user-1') });
  assert.equal((r as any).error.statusCode, 404);
  assert.equal((r as any).error.code, 'CHARACTER_NOT_FOUND');
});

test('remove maps an unexpected failure to 5xx CHARACTER_DELETE_FAILED', async () => {
  state.deleteError = new Error('db down');
  const r = await service().remove({ id: VALID_ID, session: session('user-1') });
  assert.equal((r as any).error.statusCode, 500);
  assert.equal((r as any).error.code, 'CHARACTER_DELETE_FAILED');
});

test('count maps an unexpected failure to 5xx CHARACTER_COUNT_FAILED', async () => {
  state.countError = new Error('boom');
  const r = await service().count();
  assert.equal((r as any).error.statusCode, 500);
  assert.equal((r as any).error.code, 'CHARACTER_COUNT_FAILED');
});
