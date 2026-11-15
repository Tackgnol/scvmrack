import assert from 'node:assert/strict';
import { beforeEach, mock, test } from 'node:test';

const PARTY = 'party-1';
const ROOM_PARTY = 'party-room';
const ROOM = 'room-1';
const GM = 'gm-1';

type Scvm = { userId: string | null; partyId: string | null };
type SeatParty = { id: string; ownerUserId: string; obrRoomId: string | null };
type Binding = { roomId: string; characterId: string };
type Freed = { userId: string } | { characterId: string };

/** An in-memory stand-in for the seat transactions: one party table, one character table, room bindings. */
const world = {
  parties: new Map<string, SeatParty>(),
  scvm: new Map<string, Scvm>(),
  bindings: [] as Binding[],
  /** Transactions run, by scope, in order. */
  transactions: [] as string[],
  failWith: null as Error | null,
  nextId: 0,
};

function seatOps() {
  return {
    countSeats: async (partyId: string, freed?: Freed) =>
      [...world.scvm].filter(([id, row]) => {
        if (row.partyId !== partyId) {
          return false;
        }
        if (freed && 'characterId' in freed) {
          return id !== freed.characterId;
        }
        if (freed && 'userId' in freed) {
          return row.userId !== freed.userId;
        }
        return true;
      }).length,
    seat: async (characterId: string, partyId: string) => {
      world.scvm.get(characterId)!.partyId = partyId;
    },
    createSeated: async (data: { userId?: string }, partyId: string) => {
      const id = `forged-${++world.nextId}`;
      world.scvm.set(id, { userId: data.userId ?? null, partyId });
      return id;
    },
    deleteCharactersOf: async (userId: string) => {
      for (const [id, row] of world.scvm) {
        if (row.userId === userId) {
          world.scvm.delete(id);
        }
      }
    },
    bindObrPlayer: async (binding: { roomId: string }, characterId: string) => {
      world.bindings.push({ roomId: binding.roomId, characterId });
    },
    unseat: async (characterId: string, partyId: string) => {
      const row = world.scvm.get(characterId);
      if (row?.partyId !== partyId) {
        return false;
      }
      row.partyId = null;
      return true;
    },
    clearRoomBindings: async (characterId: string, roomId: string) => {
      world.bindings = world.bindings.filter(
        (row) => row.roomId !== roomId || row.characterId !== characterId
      );
    },
    deleteCharacter: async (characterId: string) => world.scvm.delete(characterId),
  };
}

const roomOps = { kind: 'room-ops' };

mock.module('../../src/repositories/party-membership-repository.js', {
  namedExports: {
    partyMembershipRepository: {
      inParty: async (partyId: string, work: (party: SeatParty | null, ops: unknown) => Promise<unknown>) => {
        world.transactions.push(`party:${partyId}`);
        const result = await work(world.parties.get(partyId) ?? null, seatOps());
        if (world.failWith) {
          throw world.failWith;
        }
        return result;
      },
      inRoom: async (
        roomId: string,
        work: (party: SeatParty | null, ops: unknown, room: unknown) => Promise<unknown>
      ) => {
        world.transactions.push(`room:${roomId}`);
        const party = [...world.parties.values()].find((row) => row.obrRoomId === roomId) ?? null;
        const result = await work(party, seatOps(), roomOps);
        if (world.failWith) {
          throw world.failWith;
        }
        return result;
      },
    },
  },
});

const { createPartyMembership, ownerCannotJoin, PARTY_MAX_MEMBERS } = await import(
  '../../src/services/party-membership.js'
);

const events: Array<{ partyId: string; event: unknown }> = [];
const membership = () =>
  createPartyMembership({
    publish: (partyId: string, event: unknown) => {
      events.push({ partyId, event });
    },
  } as unknown as Parameters<typeof createPartyMembership>[0]);

function fill(partyId: string, seats: number, prefix = 'member'): string[] {
  const ids = Array.from({ length: seats }, (_, index) => `${prefix}-${index}`);
  for (const id of ids) {
    world.scvm.set(id, { userId: `${id}-owner`, partyId });
  }
  return ids;
}

const seatsIn = (partyId: string) =>
  [...world.scvm.values()].filter((row) => row.partyId === partyId).length;

beforeEach(() => {
  world.parties = new Map([
    [PARTY, { id: PARTY, ownerUserId: GM, obrRoomId: null }],
    [ROOM_PARTY, { id: ROOM_PARTY, ownerUserId: GM, obrRoomId: ROOM }],
  ]);
  world.scvm = new Map([['scvm', { userId: 'player', partyId: null }]]);
  world.bindings = [];
  world.transactions = [];
  world.failWith = null;
  world.nextId = 0;
  events.length = 0;
});

test('the cap defaults to ten seats', () => {
  assert.equal(PARTY_MAX_MEMBERS, 10);
});

test('a scvm takes a free seat and the roster hears one join', async () => {
  const result = await membership().takeSeat({ partyId: PARTY, userId: 'player', characterId: 'scvm' });

  assert.deepEqual(result, { ok: true, value: 'scvm' });
  assert.equal(world.scvm.get('scvm')?.partyId, PARTY);
  assert.deepEqual(events, [{ partyId: PARTY, event: { type: 'character.joined', characterId: 'scvm' } }]);
});

test('the eleventh scvm is refused with PARTY_FULL and nothing changes', async () => {
  fill(PARTY, PARTY_MAX_MEMBERS);

  const result = await membership().takeSeat({ partyId: PARTY, userId: 'player', characterId: 'scvm' });

  assert.equal(result.ok, false);
  assert.equal(!result.ok && result.error.statusCode, 409);
  assert.equal(!result.ok && result.error.code, 'PARTY_FULL');
  assert.equal(world.scvm.get('scvm')?.partyId, null);
  assert.equal(seatsIn(PARTY), PARTY_MAX_MEMBERS);
  assert.deepEqual(events, []);
});

test("the party's GM is refused a seat before the cap is counted", async () => {
  fill(PARTY, PARTY_MAX_MEMBERS);

  const result = await membership().takeSeat({ partyId: PARTY, userId: GM, characterId: 'scvm' });

  assert.equal(!result.ok && result.error.statusCode, 403);
  assert.equal(!result.ok && result.error.code, 'PARTY_OWNER_CANNOT_JOIN');
  assert.equal(!result.ok && result.error.message, 'A game master cannot join their own party');
  assert.equal(world.scvm.get('scvm')?.partyId, null);
  assert.deepEqual(events, []);
});

test('a replacement takes a seat in a full party, since the scvm it replaces is on its way out', async () => {
  const [dying] = fill(PARTY, PARTY_MAX_MEMBERS);

  const result = await membership().takeSeat({
    partyId: PARTY,
    userId: 'player',
    characterId: 'scvm',
    replacing: dying,
  });

  assert.deepEqual(result, { ok: true, value: 'scvm' });
  assert.equal(world.scvm.get('scvm')?.partyId, PARTY);
  // The old scvm leaves when its owner deletes it, not here.
  assert.equal(world.scvm.get(dying)?.partyId, PARTY);
  assert.deepEqual(events, [{ partyId: PARTY, event: { type: 'character.joined', characterId: 'scvm' } }]);
});

test('a replacement is refused when the party is full even without the scvm it replaces', async () => {
  fill(PARTY, PARTY_MAX_MEMBERS);
  world.scvm.set('dying', { userId: 'player', partyId: PARTY });

  const result = await membership().takeSeat({
    partyId: PARTY,
    userId: 'player',
    characterId: 'scvm',
    replacing: 'dying',
  });

  assert.equal(!result.ok && result.error.code, 'PARTY_FULL');
  assert.deepEqual(events, []);
});

test("a replacement by the party's GM is refused like a join", async () => {
  world.scvm.set('dying', { userId: GM, partyId: PARTY });
  world.scvm.set('scvm', { userId: GM, partyId: null });

  const result = await membership().takeSeat({
    partyId: PARTY,
    userId: GM,
    characterId: 'scvm',
    replacing: 'dying',
  });

  assert.equal(!result.ok && result.error.statusCode, 403);
  assert.equal(!result.ok && result.error.code, 'PARTY_OWNER_CANNOT_JOIN');
  assert.equal(world.scvm.get('scvm')?.partyId, null);
  assert.deepEqual(events, []);
});

test('a forged scvm is created seated and bound to its Owlbear player', async () => {
  const result = await membership().takeSeat({
    partyId: ROOM_PARTY,
    userId: 'player',
    create: { userId: 'player' } as never,
    obrBinding: { roomId: ROOM, playerId: 'obr-player' },
  });

  assert.deepEqual(result, { ok: true, value: 'forged-1' });
  assert.equal(world.scvm.get('forged-1')?.partyId, ROOM_PARTY);
  assert.deepEqual(world.bindings, [{ roomId: ROOM, characterId: 'forged-1' }]);
  assert.deepEqual(events, [{ partyId: ROOM_PARTY, event: { type: 'character.joined', characterId: 'forged-1' } }]);
});

test("a guest's old scvm free their seats and are deleted as the new one is forged", async () => {
  fill(PARTY, PARTY_MAX_MEMBERS - 1);
  world.scvm.set('old-guest-scvm', { userId: 'guest', partyId: PARTY });

  const result = await membership().takeSeat({
    partyId: PARTY,
    userId: 'guest',
    create: { userId: 'guest' } as never,
    replacingGuest: 'guest',
  });

  assert.equal(result.ok, true);
  assert.equal(world.scvm.has('old-guest-scvm'), false);
  assert.equal(seatsIn(PARTY), PARTY_MAX_MEMBERS);
});

test('a scvm forged into a full party is not created', async () => {
  fill(PARTY, PARTY_MAX_MEMBERS);
  const before = world.scvm.size;

  const result = await membership().takeSeat({
    partyId: PARTY,
    userId: 'player',
    create: { userId: 'player' } as never,
  });

  assert.equal(!result.ok && result.error.code, 'PARTY_FULL');
  assert.equal(world.scvm.size, before);
  assert.deepEqual(events, []);
});

test('the GM rule is the same refusal everywhere', () => {
  assert.equal(ownerCannotJoin({ ownerUserId: GM }, 'player'), null);
  assert.equal(ownerCannotJoin({ ownerUserId: GM }, null), null);
  assert.equal(ownerCannotJoin({ ownerUserId: GM }, GM)?.code, 'PARTY_OWNER_CANNOT_JOIN');
});

test('leaving gives up the seat under the party transaction and the roster hears it once', async () => {
  world.scvm.set('scvm', { userId: 'player', partyId: PARTY });

  const left = await membership().giveUpSeat({ partyId: PARTY, characterId: 'scvm', reason: 'left' });

  assert.equal(left, true);
  assert.equal(world.scvm.get('scvm')?.partyId, null);
  assert.deepEqual(world.transactions, [`party:${PARTY}`]);
  assert.deepEqual(events, [{ partyId: PARTY, event: { type: 'character.left', characterId: 'scvm' } }]);
});

test('a kick is announced as a kick', async () => {
  world.scvm.set('scvm', { userId: 'player', partyId: PARTY });

  await membership().giveUpSeat({ partyId: PARTY, characterId: 'scvm', reason: 'kicked' });

  assert.deepEqual(events, [{ partyId: PARTY, event: { type: 'character.kicked', characterId: 'scvm' } }]);
});

test("leaving a room party clears the scvm's bindings in that room only", async () => {
  world.scvm.set('scvm', { userId: 'player', partyId: ROOM_PARTY });
  world.bindings = [
    { roomId: ROOM, characterId: 'scvm' },
    { roomId: ROOM, characterId: 'other' },
    { roomId: 'elsewhere', characterId: 'scvm' },
  ];

  await membership().giveUpSeat({ partyId: ROOM_PARTY, characterId: 'scvm', reason: 'left' });

  assert.deepEqual(world.bindings, [
    { roomId: ROOM, characterId: 'other' },
    { roomId: 'elsewhere', characterId: 'scvm' },
  ]);
});

test('a scvm no longer in the party gives up nothing and nothing is announced', async () => {
  world.scvm.set('scvm', { userId: 'player', partyId: 'another-party' });

  const left = await membership().giveUpSeat({ partyId: PARTY, characterId: 'scvm', reason: 'kicked' });

  assert.equal(left, false);
  assert.equal(world.scvm.get('scvm')?.partyId, 'another-party');
  assert.deepEqual(events, []);
});

test('deleting a seated scvm deletes it and announces that it left', async () => {
  world.scvm.set('scvm', { userId: 'player', partyId: PARTY });

  const deleted = await membership().giveUpSeat({ partyId: PARTY, characterId: 'scvm', reason: 'deleted' });

  assert.equal(deleted, true);
  assert.equal(world.scvm.has('scvm'), false);
  assert.deepEqual(events, [{ partyId: PARTY, event: { type: 'character.left', characterId: 'scvm' } }]);
});

test('deleting a scvm that is already gone announces nothing', async () => {
  world.scvm.delete('scvm');

  const deleted = await membership().giveUpSeat({ partyId: PARTY, characterId: 'scvm', reason: 'deleted' });

  assert.equal(deleted, false);
  assert.deepEqual(events, []);
});

test('a failed transaction announces nothing', async () => {
  world.scvm.set('scvm', { userId: 'player', partyId: PARTY });
  world.failWith = new Error('rolled back');

  await assert.rejects(
    membership().giveUpSeat({ partyId: PARTY, characterId: 'scvm', reason: 'left' }),
    /rolled back/
  );
  await assert.rejects(
    membership().takeSeat({ partyId: PARTY, userId: 'player', characterId: 'scvm' }),
    /rolled back/
  );
  assert.deepEqual(events, []);
});

test('a room removal gives up the seat, clears the room bindings and is announced once, after its work', async () => {
  world.scvm.set('scvm', { userId: 'player', partyId: ROOM_PARTY });
  world.bindings = [{ roomId: ROOM, characterId: 'scvm' }];
  const seen: unknown[] = [];

  const result = await membership().inRoom(ROOM, async (room, seat) => {
    seen.push(room);
    await seat.giveUp('scvm', 'kicked');
    seen.push([...events]);
    return 'snapshot';
  });

  assert.equal(result, 'snapshot');
  assert.deepEqual(seen, [roomOps, []]);
  assert.equal(world.scvm.get('scvm')?.partyId, null);
  assert.deepEqual(world.bindings, []);
  assert.deepEqual(world.transactions, [`room:${ROOM}`]);
  assert.deepEqual(events, [{ partyId: ROOM_PARTY, event: { type: 'character.kicked', characterId: 'scvm' } }]);
});

test('a room removal of a scvm that is only bound clears its bindings and still tells the room party', async () => {
  world.bindings = [{ roomId: ROOM, characterId: 'scvm' }];

  await membership().inRoom(ROOM, (_room, seat) => seat.giveUp('scvm', 'left'));

  assert.equal(world.scvm.get('scvm')?.partyId, null);
  assert.deepEqual(world.bindings, []);
  assert.deepEqual(events, [{ partyId: ROOM_PARTY, event: { type: 'character.left', characterId: 'scvm' } }]);
});

test('a room with no party clears bindings without an announcement', async () => {
  world.bindings = [{ roomId: 'lonely-room', characterId: 'scvm' }];

  await membership().inRoom('lonely-room', (_room, seat) => seat.giveUp('scvm', 'kicked'));

  assert.deepEqual(world.bindings, []);
  assert.deepEqual(events, []);
});

test('a room removal that gives up no seat, or fails, announces nothing', async () => {
  await membership().inRoom(ROOM, async () => 'replayed');
  world.failWith = new Error('rolled back');
  await assert.rejects(
    membership().inRoom(ROOM, (_room, seat) => seat.giveUp('scvm', 'kicked')),
    /rolled back/
  );

  assert.deepEqual(events, []);
});
