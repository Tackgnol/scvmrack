import assert from 'node:assert/strict';
import { beforeEach, mock, test } from 'node:test';

const PARTY_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const OTHER_PARTY_ID = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const CHAR_ID = '11111111-1111-4111-8111-111111111111';
const OBR_ROOM_ID = 'obr-room-1';

class PartyFullError extends Error {
  constructor() {
    super('Party is full');
    this.name = 'PartyFullError';
  }
}

// ---- Mutable mock state ----
type PartyRow = {
  id: string;
  name: string;
  ownerUserId: string;
  inviteToken: string;
  obrRoomId?: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type Member = {
  id: string;
  name: string;
  classId: number | null;
  currentHp: number;
  maxHp: number;
  userId: string | null;
  sessionId: string | null;
  joinedAt: Date | null;
};

type CharForJoin = {
  id: string;
  userId: string | null;
  sessionId: string | null;
  partyId: string | null;
} | null;

const state = {
  party: null as (PartyRow & { members: Member[] }) | null,
  partyByToken: null as PartyRow | null,
  partyByObrRoomId: null as (PartyRow & { members: Member[] }) | null,
  charForJoin: null as CharForJoin,
  charForJoinById: new Map<string, NonNullable<CharForJoin>>(),
  ownerList: [] as Array<PartyRow & { memberCount: number }>,
  joinThrows: null as unknown,
  createThrows: null as unknown,
  getByObrThrows: null as unknown,
  // call captures
  ensureSystemUserCalls: [] as Array<{
    id: string;
    name: string;
    email: string;
  }>,
  createCalls: [] as Array<{
    ownerUserId: string;
    name: string;
    inviteToken: string;
    obrRoomId?: string | null;
  }>,
  setCalls: [] as Array<{ characterId: string; partyId: string | null }>,
  joinCalls: [] as Array<{ characterId: string; partyId: string; cap: number }>,
  rotateCalls: [] as Array<{ id: string; token: string }>,
  deleteCalls: [] as string[],
  renameCalls: [] as Array<{ id: string; name: string }>,
  miseryCharacterIds: [] as string[],
  setMiseryCalls: [] as Array<{ partyId: string; miseryCount: number }>,
  setPartyOwnerCalls: [] as Array<{ id: string; ownerUserId: string }>,
  setObrRoomCalls: [] as Array<{ id: string; obrRoomId: string | null }>,
  createdToken: 'created-token',
};

const publishedEvents: Array<{
  partyId: string;
  event: { type: string; [key: string]: unknown };
}> = [];

function resetState(): void {
  state.party = null;
  state.partyByToken = null;
  state.partyByObrRoomId = null;
  state.charForJoin = null;
  state.charForJoinById = new Map();
  state.ownerList = [];
  state.joinThrows = null;
  state.createThrows = null;
  state.getByObrThrows = null;
  state.ensureSystemUserCalls = [];
  state.createCalls = [];
  state.setCalls = [];
  state.joinCalls = [];
  state.rotateCalls = [];
  state.deleteCalls = [];
  state.renameCalls = [];
  state.miseryCharacterIds = [];
  state.setMiseryCalls = [];
  state.setPartyOwnerCalls = [];
  state.setObrRoomCalls = [];
  state.createdToken = 'created-token';
  publishedEvents.length = 0;
}

mock.module('../../src/repositories/party-repository.js', {
  namedExports: {
    PartyFullError,
    partyRepository: {
      ensureSystemUser: async (input: {
        id: string;
        name: string;
        email: string;
      }) => {
        state.ensureSystemUserCalls.push(input);
      },
      createParty: async (input: {
        ownerUserId: string;
        name: string;
        inviteToken: string;
        obrRoomId?: string | null;
      }) => {
        if (state.createThrows) throw state.createThrows;
        state.createCalls.push(input);
        return {
          id: PARTY_ID,
          name: input.name,
          ownerUserId: input.ownerUserId,
          inviteToken: input.inviteToken,
          obrRoomId: input.obrRoomId ?? null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      },
      listPartiesByOwner: async () => state.ownerList,
      getPartyById: async () => state.party,
      getPartyByObrRoomId: async () => {
        if (state.getByObrThrows) throw state.getByObrThrows;
        return state.partyByObrRoomId;
      },
      getPartyByInviteToken: async () => state.partyByToken,
      getCharacterForJoin: async (id: string) =>
        state.charForJoinById.get(id) ?? state.charForJoin,
      countMembers: async () => state.party?.members.length ?? 0,
      setCharacterParty: async (characterId: string, partyId: string | null) => {
        state.setCalls.push({ characterId, partyId });
      },
      joinInTransaction: async (input: { characterId: string; partyId: string; cap: number }) => {
        state.joinCalls.push(input);
        if (state.joinThrows) throw state.joinThrows;
      },
      rotateInviteToken: async (id: string, token: string) => {
        state.rotateCalls.push({ id, token });
      },
      renameParty: async (id: string, name: string) => {
        state.renameCalls.push({ id, name });
      },
      setPartyMiseryCount: async (partyId: string, miseryCount: number) => {
        state.setMiseryCalls.push({ partyId, miseryCount });
        return state.miseryCharacterIds;
      },
      deleteParty: async (id: string) => {
        state.deleteCalls.push(id);
      },
      setPartyOwner: async (id: string, ownerUserId: string) => {
        state.setPartyOwnerCalls.push({ id, ownerUserId });
      },
      setPartyObrRoom: async (id: string, obrRoomId: string | null) => {
        state.setObrRoomCalls.push({ id, obrRoomId });
      },
    },
  },
});

const { createPartyService } = await import('../../src/services/party-service.js');

const noopLog = { error: () => {} };
const service = () => createPartyService(noopLog);
const serviceWithBus = () =>
  createPartyService(noopLog, {
    publish: (
      partyId: string,
      event: { type: string; [key: string]: unknown }
    ) => {
      publishedEvents.push({ partyId, event });
    },
    subscribe: () => () => {},
  });

// session helpers
const gm = (id = 'gm-1') => ({ session: { id: 'sess-gm' }, user: { id, isAnonymous: false } });
const account = (id = 'user-1') => ({ session: { id: 'sess-acc' }, user: { id, isAnonymous: false } });
const guest = (sessId = 'sess-anon', userId = 'anon-user') => ({
  session: { id: sessId },
  user: { id: userId, isAnonymous: true },
});

function partyWith(members: Partial<Member>[] = [], owner = 'gm-1'): PartyRow & { members: Member[] } {
  return {
    id: PARTY_ID,
    name: 'Warband',
    ownerUserId: owner,
    inviteToken: 'tok-abc',
    obrRoomId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    members: members.map((m, i) => ({
      id: m.id ?? `c-${i}`,
      name: m.name ?? `Member ${i}`,
      classId: m.classId ?? null,
      currentHp: m.currentHp ?? 5,
      maxHp: m.maxHp ?? 8,
      userId: m.userId ?? null,
      sessionId: m.sessionId ?? null,
      joinedAt: m.joinedAt ?? new Date(),
    })),
  };
}

beforeEach(() => resetState());

// ───────────────────────── createParty ─────────────────────────
test('createParty requires a GM (account, non-anon)', async () => {
  const r = await service().createParty({ session: guest(), name: 'X' });
  assert.equal(r.ok, false);
  assert.equal((r as any).error.statusCode, 401);
});

test('createParty rejects a missing session', async () => {
  const r = await service().createParty({ session: null, name: 'X' });
  assert.equal((r as any).error.statusCode, 401);
});

test('createParty succeeds for a GM and returns an invite path', async () => {
  const r = await service().createParty({ session: gm(), name: 'Doom Crew' });
  assert.equal(r.ok, true);
  const v = (r as any).value;
  assert.equal(v.role, 'gm');
  assert.equal(v.name, 'Doom Crew');
  assert.equal(typeof v.inviteToken, 'string');
  assert.equal(v.invitePath, `/join/${v.inviteToken}`);
  assert.equal(v.memberCount, 0);
});

test('createParty defaults the name when blank', async () => {
  const r = await service().createParty({ session: gm(), name: '   ' });
  assert.equal((r as any).value.name, 'Untitled Warband');
});

test('createParty maps an unexpected failure to 5xx', async () => {
  state.createThrows = new Error('db down');
  const r = await service().createParty({ session: gm(), name: 'X' });
  assert.equal((r as any).error.statusCode, 500);
  assert.equal((r as any).error.code, 'PARTY_CREATE_FAILED');
});

// ───────────────────────── promote room ─────────────────────────
test('promoteRoom creates a system-owned room party for anonymous OBR use', async () => {
  const r = await service().promoteRoom({
    session: guest(),
    obrRoomId: OBR_ROOM_ID,
    name: 'Room party',
  });

  assert.equal(r.ok, true);
  assert.equal(state.ensureSystemUserCalls.length, 1);
  assert.equal(state.createCalls.length, 1);
  assert.equal(state.createCalls[0].ownerUserId, 'system:obr-room');
  assert.equal(state.createCalls[0].obrRoomId, OBR_ROOM_ID);
});

test('promoteRoom never leaks the invite token on fresh system-owned creation', async () => {
  const r = await service().promoteRoom({
    session: guest('sess-anon-2', 'anon-2'),
    obrRoomId: OBR_ROOM_ID,
    name: 'Room party',
  });

  assert.equal(r.ok, true);
  const value = (r as any).value as Record<string, unknown>;
  assert.equal(value.role, 'member');
  assert.equal('inviteToken' in value, false);
  assert.equal('invitePath' in value, false);
});

test('promoteRoom rejects a blank OBR room id', async () => {
  const r = await service().promoteRoom({
    session: gm(),
    obrRoomId: '   ',
    name: 'Room party',
  });

  assert.equal((r as any).error.statusCode, 400);
  assert.equal((r as any).error.code, 'INVALID_OBR_ROOM_ID');
  assert.equal(state.createCalls.length, 0);
});

test('promoteRoom returns an existing owned room party idempotently', async () => {
  state.partyByObrRoomId = {
    ...partyWith([{ id: CHAR_ID, userId: 'player-1' }], 'gm-1'),
    obrRoomId: OBR_ROOM_ID,
  };

  const r = await service().promoteRoom({
    session: gm('gm-1'),
    obrRoomId: OBR_ROOM_ID,
    name: 'Ignored name',
  });

  assert.equal(r.ok, true);
  assert.equal((r as any).value.id, PARTY_ID);
  assert.equal((r as any).value.role, 'gm');
  assert.equal((r as any).value.inviteToken, 'tok-abc');
  assert.equal((r as any).value.memberCount, 1);
  assert.equal(state.createCalls.length, 0);
});

test('promoteRoom returns an existing room party for another OBR GM', async () => {
  state.partyByObrRoomId = {
    ...partyWith([], 'other-gm'),
    obrRoomId: OBR_ROOM_ID,
  };

  const r = await service().promoteRoom({
    session: gm('gm-1'),
    obrRoomId: OBR_ROOM_ID,
    name: 'Room party',
  });

  assert.equal(r.ok, true);
  assert.equal((r as any).value.id, PARTY_ID);
  assert.equal(state.createCalls.length, 0);
});

test('promoteRoom creates a durable party for a new OBR room', async () => {
  const r = await service().promoteRoom({
    session: gm('gm-1'),
    obrRoomId: ` ${OBR_ROOM_ID} `,
    name: '  Room party  ',
  });

  assert.equal(r.ok, true);
  assert.equal(state.createCalls.length, 1);
  assert.equal(state.createCalls[0].ownerUserId, 'gm-1');
  assert.equal(state.createCalls[0].name, 'Room party');
  assert.equal(state.createCalls[0].obrRoomId, OBR_ROOM_ID);
  assert.equal(typeof state.createCalls[0].inviteToken, 'string');
  assert.equal((r as any).value.role, 'gm');
  assert.equal((r as any).value.name, 'Room party');
  assert.equal((r as any).value.invitePath, `/join/${state.createCalls[0].inviteToken}`);
  assert.equal((r as any).value.memberCount, 0);
});

test('promoteRoom maps an unexpected failure to 5xx', async () => {
  state.getByObrThrows = new Error('db down');

  const r = await service().promoteRoom({
    session: gm('gm-1'),
    obrRoomId: OBR_ROOM_ID,
    name: 'Room party',
  });

  assert.equal((r as any).error.statusCode, 500);
  assert.equal((r as any).error.code, 'PARTY_PROMOTE_FAILED');
});

test('promoteRoom returns manage view (with invite token) to the owner', async () => {
  state.partyByObrRoomId = {
    ...partyWith([], 'user-1'),
    obrRoomId: OBR_ROOM_ID,
  };

  const r = await service().promoteRoom({
    session: account('user-1'),
    obrRoomId: OBR_ROOM_ID,
  });

  assert.equal(r.ok, true);
  assert.equal((r as any).value.role, 'gm');
  assert.ok((r as any).value.inviteToken);
});

test('promoteRoom never leaks the invite token to a non-owner', async () => {
  state.partyByObrRoomId = {
    ...partyWith([], 'user-1'),
    obrRoomId: OBR_ROOM_ID,
  };

  const r = await service().promoteRoom({
    session: account('user-2'),
    obrRoomId: OBR_ROOM_ID,
  });

  assert.equal(r.ok, true);
  const value = (r as any).value as Record<string, unknown>;
  assert.equal(value.role, 'member');
  assert.equal('inviteToken' in value, false);
  assert.equal('invitePath' in value, false);
});

test('promoteRoom returns token-less view to anonymous callers of an owned room', async () => {
  state.partyByObrRoomId = {
    ...partyWith([], 'user-1'),
    obrRoomId: OBR_ROOM_ID,
  };

  const r = await service().promoteRoom({
    session: guest('sess-anon-1', 'anon-1'),
    obrRoomId: OBR_ROOM_ID,
  });

  assert.equal(r.ok, true);
  assert.equal('inviteToken' in ((r as any).value as Record<string, unknown>), false);
});

test('promoteRoom lets a signed-in GM claim a system-owned room party', async () => {
  state.partyByObrRoomId = {
    ...partyWith([], 'system:obr-room'),
    id: 'party-sys',
    obrRoomId: OBR_ROOM_ID,
  };

  const r = await service().promoteRoom({
    session: account('user-2'),
    obrRoomId: OBR_ROOM_ID,
  });

  assert.equal(r.ok, true);
  assert.equal((r as any).value.role, 'gm');
  assert.deepEqual(state.setPartyOwnerCalls, [
    { id: 'party-sys', ownerUserId: 'user-2' },
  ]);
});

// ───────────────────────── listParties ─────────────────────────
test('listParties requires a GM', async () => {
  const r = await service().listParties({ session: guest() });
  assert.equal((r as any).error.statusCode, 401);
});

test('listParties returns the GM rows with counts and invite paths', async () => {
  state.ownerList = [
    {
      id: PARTY_ID,
      name: 'Warband',
      ownerUserId: 'gm-1',
      inviteToken: 'tok-abc',
      createdAt: new Date(),
      updatedAt: new Date(),
      memberCount: 3,
    },
  ];
  const r = await service().listParties({ session: gm() });
  assert.equal(r.ok, true);
  assert.equal((r as any).value[0].memberCount, 3);
  assert.equal((r as any).value[0].invitePath, '/join/tok-abc');
});

// ───────────────────────── getParty ─────────────────────────
test('getParty rejects an invalid UUID with 400', async () => {
  const r = await service().getParty({ session: gm(), id: 'nope' });
  assert.equal((r as any).error.code, 'INVALID_PARTY_ID');
});

test('getParty returns 404 when the party is missing', async () => {
  state.party = null;
  const r = await service().getParty({ session: gm(), id: PARTY_ID });
  assert.equal((r as any).error.statusCode, 404);
});

test('getParty gives the owner a manage view with the token', async () => {
  state.party = partyWith([{ id: CHAR_ID, userId: 'player-1' }], 'gm-1');
  const r = await service().getParty({ session: gm('gm-1'), id: PARTY_ID });
  assert.equal(r.ok, true);
  assert.equal((r as any).value.role, 'gm');
  assert.equal((r as any).value.inviteToken, 'tok-abc');
  assert.equal((r as any).value.invitePath, '/join/tok-abc');
  assert.equal((r as any).value.members.length, 1);
});

test('getParty gives a member a read view WITHOUT the token', async () => {
  state.party = partyWith([{ id: CHAR_ID, userId: 'player-1' }], 'gm-1');
  const r = await service().getParty({ session: account('player-1'), id: PARTY_ID });
  assert.equal(r.ok, true);
  assert.equal((r as any).value.role, 'member');
  assert.equal((r as any).value.inviteToken, undefined);
  assert.equal((r as any).value.members.length, 1);
  assert.equal((r as any).value.members[0].owned, true);
});

test('getParty recognizes an anonymous member by sessionId', async () => {
  state.party = partyWith([{ id: CHAR_ID, sessionId: 'sess-anon' }], 'gm-1');
  const r = await service().getParty({ session: guest('sess-anon', 'anon-user'), id: PARTY_ID });
  assert.equal(r.ok, true);
  assert.equal((r as any).value.role, 'member');
});

test('getParty returns 404 (no leak) for a non-owner non-member', async () => {
  state.party = partyWith([{ id: CHAR_ID, userId: 'player-1' }], 'gm-1');
  const r = await service().getParty({ session: account('stranger'), id: PARTY_ID });
  assert.equal((r as any).error.statusCode, 404);
  assert.equal((r as any).error.code, 'PARTY_NOT_FOUND');
});

// ───────────────────────── getInvite ─────────────────────────
test('getInvite returns public party metadata for a valid invite token', async () => {
  state.partyByToken = {
    id: PARTY_ID,
    name: 'Doom Choir',
    ownerUserId: 'gm-1',
    inviteToken: 'tok',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const r = await service().getInvite({ token: 'tok' });

  assert.equal(r.ok, true);
  assert.deepEqual((r as any).value, {
    id: PARTY_ID,
    name: 'Doom Choir',
    maxMembers: 10,
  });
});

test('getInvite invalid/rotated token → 410', async () => {
  state.partyByToken = null;
  const r = await service().getInvite({ token: 'dead' });
  assert.equal((r as any).error.statusCode, 410);
  assert.equal((r as any).error.code, 'PARTY_INVITE_INVALID');
});

test('getInvite empty token → 410', async () => {
  const r = await service().getInvite({ token: '' });
  assert.equal((r as any).error.statusCode, 410);
});

// ───────────────────────── join ─────────────────────────
test('join invalid/rotated token → 410', async () => {
  state.partyByToken = null;
  state.charForJoin = { id: CHAR_ID, userId: 'player-1', sessionId: null, partyId: null };
  const r = await service().joinParty({ session: account('player-1'), token: 'dead', characterId: CHAR_ID });
  assert.equal((r as any).error.statusCode, 410);
  assert.equal((r as any).error.code, 'PARTY_INVITE_INVALID');
});

test('join empty token → 410', async () => {
  const r = await service().joinParty({ session: account('player-1'), token: '', characterId: CHAR_ID });
  assert.equal((r as any).error.statusCode, 410);
});

test('join invalid character UUID → 400', async () => {
  const r = await service().joinParty({ session: account('player-1'), token: 'tok', characterId: 'bad' });
  assert.equal((r as any).error.code, 'INVALID_CHARACTER_ID');
});

test('join non-owner of character → 403', async () => {
  state.partyByToken = { id: PARTY_ID, name: 'W', ownerUserId: 'gm-1', inviteToken: 'tok', createdAt: new Date(), updatedAt: new Date() };
  state.charForJoin = { id: CHAR_ID, userId: 'someone-else', sessionId: null, partyId: null };
  const r = await service().joinParty({ session: account('player-1'), token: 'tok', characterId: CHAR_ID });
  assert.equal((r as any).error.statusCode, 403);
  assert.equal((r as any).error.code, 'CHARACTER_ACCESS_DENIED');
});

test('join character not found → 404', async () => {
  state.partyByToken = { id: PARTY_ID, name: 'W', ownerUserId: 'gm-1', inviteToken: 'tok', createdAt: new Date(), updatedAt: new Date() };
  state.charForJoin = null;
  const r = await service().joinParty({ session: account('player-1'), token: 'tok', characterId: CHAR_ID });
  assert.equal((r as any).error.statusCode, 404);
});

test('join by the GM of THIS party → 403 (GM does not play)', async () => {
  state.partyByToken = { id: PARTY_ID, name: 'W', ownerUserId: 'gm-1', inviteToken: 'tok', createdAt: new Date(), updatedAt: new Date() };
  state.charForJoin = { id: CHAR_ID, userId: 'gm-1', sessionId: null, partyId: null };
  const r = await service().joinParty({ session: gm('gm-1'), token: 'tok', characterId: CHAR_ID });
  assert.equal((r as any).error.statusCode, 403);
  assert.equal((r as any).error.code, 'PARTY_OWNER_CANNOT_JOIN');
});

test('join when already in THIS party → idempotent ok (no write)', async () => {
  state.partyByToken = { id: PARTY_ID, name: 'W', ownerUserId: 'gm-1', inviteToken: 'tok', createdAt: new Date(), updatedAt: new Date() };
  state.charForJoin = { id: CHAR_ID, userId: 'player-1', sessionId: null, partyId: PARTY_ID };
  const r = await service().joinParty({ session: account('player-1'), token: 'tok', characterId: CHAR_ID });
  assert.equal(r.ok, true);
  assert.equal((r as any).value.partyId, PARTY_ID);
  assert.equal((r as any).value.redirect, `/party/${PARTY_ID}/character/${CHAR_ID}`);
  assert.equal(state.joinCalls.length, 0);
});

test('join when in ANOTHER party → 409', async () => {
  state.partyByToken = { id: PARTY_ID, name: 'W', ownerUserId: 'gm-1', inviteToken: 'tok', createdAt: new Date(), updatedAt: new Date() };
  state.charForJoin = { id: CHAR_ID, userId: 'player-1', sessionId: null, partyId: OTHER_PARTY_ID };
  const r = await service().joinParty({ session: account('player-1'), token: 'tok', characterId: CHAR_ID });
  assert.equal((r as any).error.statusCode, 409);
  assert.equal((r as any).error.code, 'CHARACTER_IN_ANOTHER_PARTY');
});

test('join when cap is full (tx sentinel) → 409', async () => {
  state.partyByToken = { id: PARTY_ID, name: 'W', ownerUserId: 'gm-1', inviteToken: 'tok', createdAt: new Date(), updatedAt: new Date() };
  state.charForJoin = { id: CHAR_ID, userId: 'player-1', sessionId: null, partyId: null };
  state.joinThrows = new PartyFullError();
  const r = await service().joinParty({ session: account('player-1'), token: 'tok', characterId: CHAR_ID });
  assert.equal((r as any).error.statusCode, 409);
  assert.equal((r as any).error.code, 'PARTY_FULL');
});

test('join happy path binds via the transaction and returns redirect', async () => {
  state.partyByToken = { id: PARTY_ID, name: 'W', ownerUserId: 'gm-1', inviteToken: 'tok', createdAt: new Date(), updatedAt: new Date() };
  state.charForJoin = { id: CHAR_ID, userId: 'player-1', sessionId: null, partyId: null };
  const r = await service().joinParty({ session: account('player-1'), token: 'tok', characterId: CHAR_ID });
  assert.equal(r.ok, true);
  assert.equal(state.joinCalls.length, 1);
  assert.equal(state.joinCalls[0].characterId, CHAR_ID);
  assert.equal(state.joinCalls[0].partyId, PARTY_ID);
  assert.equal(state.joinCalls[0].cap, 10);
  assert.equal((r as any).value.redirect, `/party/${PARTY_ID}/character/${CHAR_ID}`);
});

test('join happy path publishes a character.joined event', async () => {
  state.partyByToken = { id: PARTY_ID, name: 'W', ownerUserId: 'gm-1', inviteToken: 'tok', createdAt: new Date(), updatedAt: new Date() };
  state.charForJoin = { id: CHAR_ID, userId: 'player-1', sessionId: null, partyId: null };
  const r = await serviceWithBus().joinParty({ session: account('player-1'), token: 'tok', characterId: CHAR_ID });
  assert.equal(r.ok, true);
  assert.deepEqual(publishedEvents, [
    {
      partyId: PARTY_ID,
      event: { type: 'character.joined', characterId: CHAR_ID },
    },
  ]);
});

test('join idempotent path does not publish a roster event', async () => {
  state.partyByToken = { id: PARTY_ID, name: 'W', ownerUserId: 'gm-1', inviteToken: 'tok', createdAt: new Date(), updatedAt: new Date() };
  state.charForJoin = { id: CHAR_ID, userId: 'player-1', sessionId: null, partyId: PARTY_ID };
  const r = await serviceWithBus().joinParty({ session: account('player-1'), token: 'tok', characterId: CHAR_ID });
  assert.equal(r.ok, true);
  assert.deepEqual(publishedEvents, []);
});

test('join works for an anonymous owner matched by sessionId', async () => {
  state.partyByToken = { id: PARTY_ID, name: 'W', ownerUserId: 'gm-1', inviteToken: 'tok', createdAt: new Date(), updatedAt: new Date() };
  state.charForJoin = { id: CHAR_ID, userId: 'anon-user', sessionId: 'sess-anon', partyId: null };
  const r = await service().joinParty({ session: guest('sess-anon', 'anon-user'), token: 'tok', characterId: CHAR_ID });
  assert.equal(r.ok, true);
  assert.equal(state.joinCalls.length, 1);
});

test('join surfaces an unexpected failure as 5xx', async () => {
  state.partyByToken = { id: PARTY_ID, name: 'W', ownerUserId: 'gm-1', inviteToken: 'tok', createdAt: new Date(), updatedAt: new Date() };
  state.charForJoin = { id: CHAR_ID, userId: 'player-1', sessionId: null, partyId: null };
  state.joinThrows = new Error('boom');
  const r = await service().joinParty({ session: account('player-1'), token: 'tok', characterId: CHAR_ID });
  assert.equal((r as any).error.statusCode, 500);
  assert.equal((r as any).error.code, 'PARTY_JOIN_FAILED');
});

// ───────────────────────── replace member ─────────────────────────
test('replaceMember binds the new owned character to the old character party', async () => {
  const replacementId = '22222222-2222-4222-8222-222222222222';
  state.charForJoinById.set(CHAR_ID, {
    id: CHAR_ID,
    userId: 'player-1',
    sessionId: null,
    partyId: PARTY_ID,
  });
  state.charForJoinById.set(replacementId, {
    id: replacementId,
    userId: 'player-1',
    sessionId: null,
    partyId: null,
  });

  const r = await serviceWithBus().replaceMember({
    session: account('player-1'),
    id: PARTY_ID,
    oldCharacterId: CHAR_ID,
    newCharacterId: replacementId,
  });

  assert.equal(r.ok, true);
  assert.deepEqual(state.setCalls[0], {
    characterId: replacementId,
    partyId: PARTY_ID,
  });
  assert.equal((r as any).value.redirect, `/party/${PARTY_ID}/character/${replacementId}`);
  assert.deepEqual(publishedEvents, [
    {
      partyId: PARTY_ID,
      event: { type: 'character.joined', characterId: replacementId },
    },
  ]);
});

test('replaceMember rejects a replacement not owned by the caller', async () => {
  const replacementId = '22222222-2222-4222-8222-222222222222';
  state.charForJoinById.set(CHAR_ID, {
    id: CHAR_ID,
    userId: 'player-1',
    sessionId: null,
    partyId: PARTY_ID,
  });
  state.charForJoinById.set(replacementId, {
    id: replacementId,
    userId: 'someone-else',
    sessionId: null,
    partyId: null,
  });

  const r = await service().replaceMember({
    session: account('player-1'),
    id: PARTY_ID,
    oldCharacterId: CHAR_ID,
    newCharacterId: replacementId,
  });

  assert.equal((r as any).error.statusCode, 403);
  assert.equal(state.setCalls.length, 0);
});

test('replaceMember rejects when the old character is not in the party', async () => {
  const replacementId = '22222222-2222-4222-8222-222222222222';
  state.charForJoinById.set(CHAR_ID, {
    id: CHAR_ID,
    userId: 'player-1',
    sessionId: null,
    partyId: OTHER_PARTY_ID,
  });
  state.charForJoinById.set(replacementId, {
    id: replacementId,
    userId: 'player-1',
    sessionId: null,
    partyId: null,
  });

  const r = await service().replaceMember({
    session: account('player-1'),
    id: PARTY_ID,
    oldCharacterId: CHAR_ID,
    newCharacterId: replacementId,
  });

  assert.equal((r as any).error.statusCode, 404);
  assert.equal((r as any).error.code, 'PARTY_MEMBERSHIP_NOT_FOUND');
});

// ───────────────────────── leave ─────────────────────────
test('leave unbinds when the caller owns the char and it is in this party', async () => {
  state.charForJoin = { id: CHAR_ID, userId: 'player-1', sessionId: null, partyId: PARTY_ID };
  const r = await service().leaveParty({ session: account('player-1'), id: PARTY_ID, characterId: CHAR_ID });
  assert.equal(r.ok, true);
  assert.deepEqual(state.setCalls[0], { characterId: CHAR_ID, partyId: null });
});

test('leave publishes a character.left event after unbind', async () => {
  state.charForJoin = { id: CHAR_ID, userId: 'player-1', sessionId: null, partyId: PARTY_ID };
  const r = await serviceWithBus().leaveParty({ session: account('player-1'), id: PARTY_ID, characterId: CHAR_ID });
  assert.equal(r.ok, true);
  assert.deepEqual(publishedEvents, [
    {
      partyId: PARTY_ID,
      event: { type: 'character.left', characterId: CHAR_ID },
    },
  ]);
});

test('leave by a non-owner → 403', async () => {
  state.charForJoin = { id: CHAR_ID, userId: 'someone-else', sessionId: null, partyId: PARTY_ID };
  const r = await service().leaveParty({ session: account('player-1'), id: PARTY_ID, characterId: CHAR_ID });
  assert.equal((r as any).error.statusCode, 403);
  assert.equal(state.setCalls.length, 0);
});

test('leave when the char is not in this party → 404', async () => {
  state.charForJoin = { id: CHAR_ID, userId: 'player-1', sessionId: null, partyId: OTHER_PARTY_ID };
  const r = await service().leaveParty({ session: account('player-1'), id: PARTY_ID, characterId: CHAR_ID });
  assert.equal((r as any).error.statusCode, 404);
});

test('leave for a missing character → 404', async () => {
  state.charForJoin = null;
  const r = await service().leaveParty({ session: account('player-1'), id: PARTY_ID, characterId: CHAR_ID });
  assert.equal((r as any).error.statusCode, 404);
});

// ───────────────────────── kick ─────────────────────────
test('kick by the owner unbinds the member', async () => {
  state.party = partyWith([{ id: CHAR_ID, userId: 'player-1' }], 'gm-1');
  state.charForJoin = { id: CHAR_ID, userId: 'player-1', sessionId: null, partyId: PARTY_ID };
  const r = await service().kick({ session: gm('gm-1'), id: PARTY_ID, characterId: CHAR_ID });
  assert.equal(r.ok, true);
  assert.deepEqual(state.setCalls[0], { characterId: CHAR_ID, partyId: null });
});

test('kick publishes a character.kicked event after unbind', async () => {
  state.party = partyWith([{ id: CHAR_ID, userId: 'player-1' }], 'gm-1');
  state.charForJoin = { id: CHAR_ID, userId: 'player-1', sessionId: null, partyId: PARTY_ID };
  const r = await serviceWithBus().kick({ session: gm('gm-1'), id: PARTY_ID, characterId: CHAR_ID });
  assert.equal(r.ok, true);
  assert.deepEqual(publishedEvents, [
    {
      partyId: PARTY_ID,
      event: { type: 'character.kicked', characterId: CHAR_ID },
    },
  ]);
});

test('kick by a non-owner → 404 (no leak)', async () => {
  state.party = partyWith([{ id: CHAR_ID, userId: 'player-1' }], 'gm-1');
  state.charForJoin = { id: CHAR_ID, userId: 'player-1', sessionId: null, partyId: PARTY_ID };
  const r = await service().kick({ session: account('not-the-gm'), id: PARTY_ID, characterId: CHAR_ID });
  assert.equal((r as any).error.statusCode, 404);
  assert.equal(state.setCalls.length, 0);
});

test('kick a character not in this party → 404', async () => {
  state.party = partyWith([], 'gm-1');
  state.charForJoin = { id: CHAR_ID, userId: 'player-1', sessionId: null, partyId: OTHER_PARTY_ID };
  const r = await service().kick({ session: gm('gm-1'), id: PARTY_ID, characterId: CHAR_ID });
  assert.equal((r as any).error.statusCode, 404);
  assert.equal((r as any).error.code, 'PARTY_MEMBERSHIP_NOT_FOUND');
});

// ───────────────────────── regenerate-link ─────────────────────────
test('regenerateLink by the owner rotates the token', async () => {
  state.party = partyWith([], 'gm-1');
  const r = await service().regenerateLink({ session: gm('gm-1'), id: PARTY_ID });
  assert.equal(r.ok, true);
  assert.equal(state.rotateCalls.length, 1);
  const token = state.rotateCalls[0].token;
  assert.ok(token.length > 0);
  assert.equal((r as any).value.inviteToken, token);
  assert.equal((r as any).value.invitePath, `/join/${token}`);
});

test('regenerateLink publishes without exposing the new invite token', async () => {
  state.party = partyWith([], 'gm-1');
  const r = await serviceWithBus().regenerateLink({ session: gm('gm-1'), id: PARTY_ID });
  assert.equal(r.ok, true);
  assert.deepEqual(publishedEvents, [
    {
      partyId: PARTY_ID,
      event: { type: 'party.linkRotated' },
    },
  ]);
});

test('regenerateLink produces a token different from the old one', async () => {
  state.party = partyWith([], 'gm-1');
  const r = await service().regenerateLink({ session: gm('gm-1'), id: PARTY_ID });
  assert.notEqual((r as any).value.inviteToken, 'tok-abc');
});

test('regenerateLink by a non-owner → 404', async () => {
  state.party = partyWith([], 'gm-1');
  const r = await service().regenerateLink({ session: account('stranger'), id: PARTY_ID });
  assert.equal((r as any).error.statusCode, 404);
  assert.equal(state.rotateCalls.length, 0);
});

// ───────────────────────── rename ─────────────────────────
test('renameParty by the owner updates the name', async () => {
  state.party = partyWith([], 'gm-1');
  const r = await service().renameParty({ session: gm('gm-1'), id: PARTY_ID, name: 'New Name' });
  assert.equal(r.ok, true);
  assert.deepEqual(state.renameCalls[0], { id: PARTY_ID, name: 'New Name' });
});

test('renameParty rejects a blank name → 400', async () => {
  state.party = partyWith([], 'gm-1');
  const r = await service().renameParty({ session: gm('gm-1'), id: PARTY_ID, name: '   ' });
  assert.equal((r as any).error.code, 'INVALID_PARTY_NAME');
});

test('renameParty by a non-owner → 404', async () => {
  state.party = partyWith([], 'gm-1');
  const r = await service().renameParty({ session: account('stranger'), id: PARTY_ID, name: 'X' });
  assert.equal((r as any).error.statusCode, 404);
});

// ───────────────────────── set miseries ─────────────────────────
test('setMiseries updates every party character and publishes live invalidations', async () => {
  state.party = partyWith([], 'gm-1');
  state.miseryCharacterIds = [CHAR_ID, '22222222-2222-4222-8222-222222222222'];

  const r = await serviceWithBus().setMiseries({
    session: gm('gm-1'),
    id: PARTY_ID,
    miseryCount: 4,
  });

  assert.equal(r.ok, true);
  assert.deepEqual((r as any).value, {
    miseryCount: 4,
    updatedCharacters: 2,
  });
  assert.deepEqual(state.setMiseryCalls, [
    { partyId: PARTY_ID, miseryCount: 4 },
  ]);
  assert.deepEqual(publishedEvents, [
    {
      partyId: PARTY_ID,
      event: {
        type: 'character.updated',
        characterId: CHAR_ID,
        fields: ['miseryCount'],
      },
    },
    {
      partyId: PARTY_ID,
      event: {
        type: 'character.updated',
        characterId: '22222222-2222-4222-8222-222222222222',
        fields: ['miseryCount'],
      },
    },
  ]);
});

test('setMiseries rejects values outside zero through seven', async () => {
  state.party = partyWith([], 'gm-1');
  const r = await service().setMiseries({
    session: gm('gm-1'),
    id: PARTY_ID,
    miseryCount: 8,
  });

  assert.equal((r as any).error.statusCode, 400);
  assert.equal(state.setMiseryCalls.length, 0);
});

test('setMiseries is owner-only', async () => {
  state.party = partyWith([], 'gm-1');
  const r = await service().setMiseries({
    session: account('stranger'),
    id: PARTY_ID,
    miseryCount: 4,
  });

  assert.equal((r as any).error.statusCode, 404);
  assert.equal(state.setMiseryCalls.length, 0);
});

// ───────────────────────── disband ─────────────────────────
test('disbandParty by the owner deletes the party', async () => {
  state.party = partyWith([], 'gm-1');
  const r = await service().disbandParty({ session: gm('gm-1'), id: PARTY_ID });
  assert.equal(r.ok, true);
  assert.deepEqual(state.deleteCalls, [PARTY_ID]);
});

test('disbandParty publishes party.closed after delete', async () => {
  state.party = partyWith([], 'gm-1');
  const r = await serviceWithBus().disbandParty({ session: gm('gm-1'), id: PARTY_ID });
  assert.equal(r.ok, true);
  assert.deepEqual(publishedEvents, [
    {
      partyId: PARTY_ID,
      event: { type: 'party.closed' },
    },
  ]);
});

test('disbandParty by a non-owner → 404', async () => {
  state.party = partyWith([], 'gm-1');
  const r = await service().disbandParty({ session: account('stranger'), id: PARTY_ID });
  assert.equal((r as any).error.statusCode, 404);
  assert.equal(state.deleteCalls.length, 0);
});

test('owner-only ops require a session (401)', async () => {
  state.party = partyWith([], 'gm-1');
  const r = await service().disbandParty({ session: null, id: PARTY_ID });
  assert.equal((r as any).error.statusCode, 401);
});

// ───────────────────────── attach/detach room ─────────────────────────
test('attachRoom re-points the party room pointer for the owner', async () => {
  state.party = partyWith([], 'gm-1');
  const r = await service().attachRoom({
    session: gm('gm-1'),
    id: PARTY_ID,
    obrRoomId: 'new-room',
  });
  assert.equal(r.ok, true);
  assert.deepEqual(state.setObrRoomCalls, [{ id: PARTY_ID, obrRoomId: 'new-room' }]);
});

test('attachRoom rejects a room already claimed by another party with 409 ROOM_ALREADY_PROMOTED', async () => {
  state.party = partyWith([], 'gm-1');
  state.partyByObrRoomId = {
    ...partyWith([], 'other-gm'),
    id: OTHER_PARTY_ID,
    obrRoomId: 'taken-room',
  };
  const r = await service().attachRoom({
    session: gm('gm-1'),
    id: PARTY_ID,
    obrRoomId: 'taken-room',
  });
  assert.equal(r.ok, false);
  assert.equal((r as any).error.statusCode, 409);
  assert.equal((r as any).error.code, 'ROOM_ALREADY_PROMOTED');
  assert.equal(state.setObrRoomCalls.length, 0);
});

test('attachRoom is idempotent when the room already points at this party', async () => {
  state.party = partyWith([], 'gm-1');
  state.partyByObrRoomId = {
    ...partyWith([], 'gm-1'),
    id: PARTY_ID,
    obrRoomId: 'my-room',
  };
  const r = await service().attachRoom({
    session: gm('gm-1'),
    id: PARTY_ID,
    obrRoomId: 'my-room',
  });
  assert.equal(r.ok, true);
  assert.equal(state.setObrRoomCalls.length, 0);
});

test('attachRoom / detachRoom are owner-only (404 for non-owners)', async () => {
  state.party = partyWith([], 'gm-1');
  const attachResult = await service().attachRoom({
    session: account('stranger'),
    id: PARTY_ID,
    obrRoomId: 'new-room',
  });
  assert.equal(attachResult.ok, false);
  assert.equal((attachResult as any).error.statusCode, 404);

  const detachResult = await service().detachRoom({
    session: account('stranger'),
    id: PARTY_ID,
  });
  assert.equal(detachResult.ok, false);
  assert.equal((detachResult as any).error.statusCode, 404);
});

test('detachRoom clears the pointer', async () => {
  state.party = partyWith([], 'gm-1');
  const r = await service().detachRoom({ session: gm('gm-1'), id: PARTY_ID });
  assert.equal(r.ok, true);
  assert.deepEqual(state.setObrRoomCalls, [{ id: PARTY_ID, obrRoomId: null }]);
});
