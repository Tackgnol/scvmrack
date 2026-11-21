import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import test from 'node:test';
import { Client } from 'pg';

// Party seats against the real database: the member cap, its party lock, the
// GM rule on replacement and room cleanup on leaving. The integration stack
// runs with the default cap of ten.
const base = process.env.E2E_BASE_URL ?? 'http://localhost:3000';
const CAP = 10;

type Actor = { token: string; userId: string };
type Scvm = { id: string; partyId: string | null };
type Party = {
  id: string;
  inviteToken: string;
  memberCount: number;
  members: Array<{ characterId: string }>;
};
type Bindings = {
  players: Array<{ characterId: string }>;
  tokens: Array<{ characterId: string }>;
};

/** Sends one request, with a bearer session when `actor` is given (bearer requests need no CSRF token). */
function send(
  path: string,
  actor?: Actor,
  method = 'GET',
  body?: unknown
): Promise<Response> {
  return fetch(new URL(path, base), {
    method,
    headers: {
      ...(actor ? { Authorization: `Bearer ${actor.token}` } : {}),
      ...(body === undefined ? {} : { 'content-type': 'application/json' }),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}

async function call<T>(
  path: string,
  actor?: Actor,
  method = 'GET',
  body?: unknown,
  status = 200
): Promise<T> {
  const response = await send(path, actor, method, body);
  if (response.status !== status) {
    assert.fail(
      `${method} ${path}: expected ${status}, got ${response.status}: ${await response.text()}`
    );
  }
  return response.status === 204
    ? (undefined as T)
    : ((await response.json()) as T);
}

async function withDatabase<T>(work: (db: Client) => Promise<T>): Promise<T> {
  assert.ok(
    process.env.DATABASE_URL,
    'An isolated integration database is required'
  );
  const db = new Client({ connectionString: process.env.DATABASE_URL });
  await db.connect();
  try {
    return await work(db);
  } finally {
    await db.end();
  }
}

/** A new session; `signedIn` turns it into a non-guest account, which may be a GM and keep many scvm. */
async function actor(signedIn = false): Promise<Actor> {
  const response = await fetch(new URL('/api/auth/sign-in/anonymous', base), {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: '{}',
  });
  assert.equal(response.status, 200);
  const token = response.headers.get('set-auth-token');
  assert.ok(token, 'Embedded sign-in supplies a bearer token');
  const { user } = (await response.json()) as { user: { id: string } };
  if (signedIn) {
    // Only identity setup bypasses HTTP.
    await withDatabase((db) =>
      db.query(
        'UPDATE "user" SET "isAnonymous" = false, email = $2 WHERE id = $1',
        [user.id, `seats-${randomUUID()}@example.test`]
      )
    );
  }
  return { token, userId: user.id };
}

async function gmParty(): Promise<{ gm: Actor; party: Party }> {
  const gm = await actor(true);
  const party = await call<Party>(
    '/api/parties',
    gm,
    'POST',
    { name: 'Seat test warband' },
    201
  );
  return { gm, party };
}

function rollScvm(owner: Actor): Promise<Scvm> {
  return call<Scvm>('/api/characters/new', owner, 'POST', {}, 201);
}

async function rollScvms(owner: Actor, count: number): Promise<Scvm[]> {
  const scvms: Scvm[] = [];
  for (let index = 0; index < count; index++) {
    scvms.push(await rollScvm(owner));
  }
  return scvms;
}

function join(owner: Actor, inviteToken: string, characterId: string): Promise<Response> {
  return send('/api/parties/join', owner, 'POST', { token: inviteToken, characterId });
}

async function seatsIn(partyId: string): Promise<number> {
  return withDatabase(async (db) => {
    const result = await db.query(
      'SELECT count(*)::int AS n FROM characters WHERE party_id = $1',
      [partyId]
    );
    return result.rows[0].n as number;
  });
}

async function partyIdOf(characterId: string): Promise<string | null> {
  return withDatabase(async (db) => {
    const result = await db.query(
      'SELECT party_id FROM characters WHERE id = $1',
      [characterId]
    );
    return (result.rows[0]?.party_id as string | null | undefined) ?? null;
  });
}

async function fillParty(party: Party, owner: Actor, seats: number): Promise<Scvm[]> {
  const members = await rollScvms(owner, seats);
  for (const scvm of members) {
    const response = await join(owner, party.inviteToken, scvm.id);
    assert.equal(response.status, 200, await response.text());
  }
  return members;
}

test('the eleventh join is refused with PARTY_FULL and the party keeps ten seats', async () => {
  const { party } = await gmParty();
  const player = await actor(true);
  await fillParty(party, player, CAP);
  const eleventh = await rollScvm(player);

  const refused = await join(player, party.inviteToken, eleventh.id);

  assert.equal(refused.status, 409);
  const body = (await refused.json()) as { code: string; message: string };
  assert.equal(body.code, 'PARTY_FULL');
  assert.equal(body.message, 'This party is full');
  assert.equal(await seatsIn(party.id), CAP);
  assert.equal(await partyIdOf(eleventh.id), null);
});

test('concurrent joins never seat more scvm than the cap', async () => {
  const { party } = await gmParty();
  const player = await actor(true);
  const contenders = await rollScvms(player, CAP + 4);

  const responses = await Promise.all(
    contenders.map((scvm) => join(player, party.inviteToken, scvm.id))
  );

  const statuses = responses.map((response) => response.status).sort((a, b) => a - b);
  assert.deepEqual(statuses, [
    ...Array<number>(CAP).fill(200),
    ...Array<number>(4).fill(409),
  ]);
  for (const response of responses.filter((r) => r.status === 409)) {
    assert.equal(((await response.json()) as { code: string }).code, 'PARTY_FULL');
  }
  assert.equal(await seatsIn(party.id), CAP);
});

test('a replacement joins a full party, and the count is back to ten once the old scvm is deleted', async () => {
  const { gm, party } = await gmParty();
  const player = await actor(true);
  const [dying] = await fillParty(party, player, CAP);
  const replacement = await rollScvm(player);

  const replaced = await call<{ partyId: string; redirect: string }>(
    `/api/parties/${party.id}/replace-member`,
    player,
    'POST',
    { oldCharacterId: dying.id, newCharacterId: replacement.id }
  );

  assert.equal(replaced.partyId, party.id);
  assert.equal(replaced.redirect, `/party/${party.id}/character/${replacement.id}`);
  assert.equal(await partyIdOf(replacement.id), party.id);
  // The client deletes the old scvm after the replacement is seated (kill and replace).
  assert.equal(await partyIdOf(dying.id), party.id);
  await call(`/api/characters/${dying.id}`, player, 'DELETE', undefined, 204);

  assert.equal(await seatsIn(party.id), CAP);
  const roster = await call<Party>(`/api/parties/${party.id}`, gm);
  assert.equal(roster.memberCount, CAP);
  assert.ok(roster.members.some((member) => member.characterId === replacement.id));
  assert.ok(!roster.members.some((member) => member.characterId === dying.id));
});

test("a replacement by the party's GM is refused like a join", async () => {
  const { gm, party } = await gmParty();
  const [seated, replacement] = await rollScvms(gm, 2);
  // A GM's own scvm can only already sit in their party from before they ran it.
  await withDatabase((db) =>
    db.query(
      'UPDATE characters SET party_id = $1, joined_at = now() WHERE id = $2',
      [party.id, seated.id]
    )
  );

  const refused = await send(`/api/parties/${party.id}/replace-member`, gm, 'POST', {
    oldCharacterId: seated.id,
    newCharacterId: replacement.id,
  });

  assert.equal(refused.status, 403);
  const body = (await refused.json()) as { code: string; message: string };
  assert.equal(body.code, 'PARTY_OWNER_CANNOT_JOIN');
  assert.equal(body.message, 'A game master cannot join their own party');
  assert.equal(await partyIdOf(replacement.id), null);
  assert.equal(await seatsIn(party.id), 1);
});

test('leaving and kicking without a room give up the seat', async () => {
  const { gm, party } = await gmParty();
  const player = await actor(true);
  const [leaver, kicked] = await fillParty(party, player, 2);

  await call(`/api/parties/${party.id}/leave`, player, 'POST', { characterId: leaver.id }, 204);
  await call(`/api/parties/${party.id}/kick`, gm, 'POST', { characterId: kicked.id }, 204);

  assert.equal(await partyIdOf(leaver.id), null);
  assert.equal(await partyIdOf(kicked.id), null);
  assert.equal(await seatsIn(party.id), 0);
  const again = await send(`/api/parties/${party.id}/leave`, player, 'POST', { characterId: leaver.id });
  assert.equal(again.status, 404);
  assert.equal(((await again.json()) as { code: string }).code, 'PARTY_MEMBERSHIP_NOT_FOUND');
});

async function roomPartyOf(roomId: string): Promise<{ id: string; ownerUserId: string } | null> {
  return withDatabase(async (db) => {
    const result = await db.query(
      'SELECT id, owner_user_id AS "ownerUserId" FROM parties WHERE obr_room_id = $1',
      [roomId]
    );
    return (result.rows[0] as { id: string; ownerUserId: string } | undefined) ?? null;
  });
}

test('attaching a room while a scvm is forged into its empty system party never deadlocks', async () => {
  const gm = await actor(true);
  const rooms = Array.from({ length: 6 }, () => `seats-race-${randomUUID()}`);

  const outcomes = await Promise.all(
    rooms.map(async (roomId) => {
      // A guest opening the room creates its empty system-owned party.
      await call('/api/parties/promote', await actor(), 'POST', { obrRoomId: roomId });
      const system = await roomPartyOf(roomId);
      assert.equal(system?.ownerUserId, 'system:obr-room');
      const warband = await call<Party>('/api/parties', gm, 'POST', { name: 'Race warband' }, 201);
      const forger = await actor();

      const [attach, forge] = await Promise.all([
        send(`/api/parties/${warband.id}/attach-room`, gm, 'POST', { obrRoomId: roomId }),
        send(`/api/characters/new?obrRoom=${roomId}&obrPlayer=racer`, forger, 'POST', {}),
      ]);
      return {
        roomId,
        warband,
        attach: { status: attach.status, body: await attach.text() },
        forge: { status: forge.status, body: await forge.text() },
      };
    })
  );

  for (const { roomId, warband, attach, forge } of outcomes) {
    assert.ok([200, 409].includes(attach.status), `attach ${roomId}: ${attach.status} ${attach.body}`);
    assert.ok([201, 404].includes(forge.status), `forge ${roomId}: ${forge.status} ${forge.body}`);
    const roomParty = await roomPartyOf(roomId);
    if (attach.status === 200) {
      assert.equal(roomParty?.id, warband.id, 'an attach that succeeded owns the room');
    }
    if (forge.status === 201) {
      const scvm = JSON.parse(forge.body) as Scvm;
      assert.equal(await partyIdOf(scvm.id), roomParty?.id, 'a forged scvm sits in the party the room points at');
    }
  }
});

test("leaving a room party clears the scvm's player and token bindings in the room", async () => {
  const gm = await actor(true);
  const roomId = `seats-${randomUUID()}`;
  const party = await call<Party>('/api/parties/promote', gm, 'POST', {
    obrRoomId: roomId,
    name: 'Seat test room',
  });
  const player = await actor();
  const stayer = await actor();
  const scvm = await call<Scvm>(
    `/api/characters/new?obrRoom=${roomId}&obrPlayer=leaver`,
    player,
    'POST',
    {},
    201
  );
  const other = await call<Scvm>(
    `/api/characters/new?obrRoom=${roomId}&obrPlayer=stayer`,
    stayer,
    'POST',
    {},
    201
  );
  await call(`/api/obr/rooms/${roomId}/tokens/token-1/character`, player, 'PUT', {
    characterId: scvm.id,
  });
  const before = await call<Bindings>(`/api/obr/rooms/${roomId}/bindings`);
  assert.ok(before.players.some((row) => row.characterId === scvm.id));
  assert.ok(before.tokens.some((row) => row.characterId === scvm.id));

  await call(`/api/parties/${party.id}/leave`, player, 'POST', { characterId: scvm.id }, 204);

  const after = await call<Bindings>(`/api/obr/rooms/${roomId}/bindings`);
  assert.ok(!after.players.some((row) => row.characterId === scvm.id));
  assert.ok(!after.tokens.some((row) => row.characterId === scvm.id));
  assert.ok(after.players.some((row) => row.characterId === other.id));
  assert.equal(await partyIdOf(scvm.id), null);
  assert.equal(await partyIdOf(other.id), party.id);
  const roster = await call<Party>(`/api/parties/${party.id}`, gm);
  assert.deepEqual(
    roster.members.map((member) => member.characterId),
    [other.id]
  );
});
