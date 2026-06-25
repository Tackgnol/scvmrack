import assert from 'node:assert/strict';
import { beforeEach, mock, test } from 'node:test';

const PARTY_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const OTHER_PARTY_ID = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const CHAR_ID = '11111111-1111-4111-8111-111111111111';

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
  charForJoin: null as CharForJoin,
  charForJoinById: new Map<string, NonNullable<CharForJoin>>(),
  ownerList: [] as Array<PartyRow & { memberCount: number }>,
  joinThrows: null as unknown,
  createThrows: null as unknown,
  // call captures
  setCalls: [] as Array<{ characterId: string; partyId: string | null }>,
  joinCalls: [] as Array<{ characterId: string; partyId: string; cap: number }>,
  rotateCalls: [] as Array<{ id: string; token: string }>,
  deleteCalls: [] as string[],
  renameCalls: [] as Array<{ id: string; name: string }>,
  createdToken: 'created-token',
};

const publishedEvents: Array<{
  partyId: string;
  event: { type: string; [key: string]: unknown };
}> = [];

function resetState(): void {
  state.party = null;
  state.partyByToken = null;
  state.charForJoin = null;
  state.charForJoinById = new Map();
  state.ownerList = [];
  state.joinThrows = null;
  state.createThrows = null;
  state.setCalls = [];
  state.joinCalls = [];
  state.rotateCalls = [];
  state.deleteCalls = [];
  state.renameCalls = [];
  state.createdToken = 'created-token';
  publishedEvents.length = 0;
}

mock.module('../../src/repositories/party-repository.js', {
  namedExports: {
    PartyFullError,
    partyRepository: {
      createParty: async (input: { ownerUserId: string; name: string; inviteToken: string }) => {
        if (state.createThrows) throw state.createThrows;
        return {
          id: PARTY_ID,
          name: input.name,
          ownerUserId: input.ownerUserId,
          inviteToken: input.inviteToken,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      },
      listPartiesByOwner: async () => state.ownerList,
      getPartyById: async () => state.party,
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
      deleteParty: async (id: string) => {
        state.deleteCalls.push(id);
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
