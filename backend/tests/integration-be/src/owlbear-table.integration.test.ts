import assert from 'node:assert/strict';
import { createHash, randomUUID } from 'node:crypto';
import test from 'node:test';
import { Client } from 'pg';

const base = process.env.E2E_BASE_URL ?? 'http://localhost:3000';
type Actor = { token: string; userId: string };
type Scvm = {
  id: string;
  classId: number | null;
  className: string | null;
  currentHp: number;
  maxHp: number;
  omens: number;
  silver: number;
  miseryCount: number;
  abilities: Array<{ name: string }>;
  equipment: Array<{ name: string }>;
};
type Party = {
  id: string;
  inviteToken?: string;
  members: Array<{ characterId: string }>;
};
type Binding = { characterId: string; playerId?: string; tokenId?: string };
type Bindings = { players: Binding[]; tokens: Binding[] };
type Card = { id: string; currentHp: number; omens: number; silver: number };

async function call<T>(
  path: string,
  actor?: Actor,
  method = 'GET',
  body?: unknown,
  status = 200
): Promise<T> {
  const response = await fetch(new URL(path, base), {
    method,
    headers: {
      ...(actor ? { Authorization: `Bearer ${actor.token}` } : {}),
      ...(body === undefined ? {} : { 'content-type': 'application/json' }),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  if (response.status !== status) {
    assert.fail(
      `${method} ${path}: expected ${status}, got ${response.status}: ${await response.text()}`
    );
  }
  return response.status === 204
    ? (undefined as T)
    : ((await response.json()) as T);
}

async function actor(gm = false): Promise<Actor> {
  const response = await fetch(new URL('/api/auth/sign-in/anonymous', base), {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: '{}',
  });
  assert.equal(response.status, 200);
  const token = response.headers.get('set-auth-token');
  assert.ok(token, 'Embedded sign-in supplies a bearer token');
  const { user } = (await response.json()) as { user: { id: string } };
  if (gm) {
    assert.ok(
      process.env.DATABASE_URL,
      'An isolated integration database is required'
    );
    const db = new Client({ connectionString: process.env.DATABASE_URL });
    await db.connect();
    try {
      // Only identity setup bypasses HTTP; every game-state assertion uses the public API.
      await db.query(
        'UPDATE "user" SET "isAnonymous" = false, email = $2 WHERE id = $1',
        [user.id, `obr-${randomUUID()}@example.test`]
      );
    } finally {
      await db.end();
    }
  }
  return { token, userId: user.id };
}

async function room() {
  const gm = await actor(true);
  const roomId = `qa-${randomUUID()}`;
  const party = await call<Party>('/api/parties/promote', gm, 'POST', {
    obrRoomId: roomId,
    name: 'Owlbear QA warband',
  });
  return { gm, roomId, party };
}

test('roll and forge confirmation save the current player binding without a mounted-panel write', async () => {
  const { roomId } = await room();
  const player = await actor(true);
  const query = `obrRoom=${roomId}&obrPlayer=creation-player`;
  const rolled = await call<Scvm>(
    `/api/characters/new?${query}`,
    player,
    'POST',
    {},
    201
  );
  const readBinding = async () =>
    (await call<Bindings>(`/api/obr/rooms/${roomId}/bindings`)).players.find(
      (row) => row.playerId === 'creation-player'
    );
  assert.equal((await readBinding())?.characterId, rolled.id);
  const seeds = Object.fromEntries(
    [
      'name',
      'stats',
      'omens',
      'silver',
      'origin',
      'abilities',
      'gear',
      'personality',
    ].map((section) => [
      section,
      createHash('sha256').update(`room-forge:${section}`).digest('hex'),
    ])
  );
  const { draft } = await call<{ draft: unknown }>(
    `/api/characters/draft?${query}`,
    player,
    'POST',
    { classId: 1, seeds }
  );
  const forged = await call<Scvm>(
    `/api/characters/new?${query}`,
    player,
    'POST',
    { draft },
    201
  );
  assert.notEqual(forged.id, rolled.id);
  assert.equal((await readBinding())?.characterId, forged.id);
  assert.equal(
    (await readBinding())?.characterId,
    forged.id,
    'reopening reads the durable server assignment'
  );
  assert.equal(
    (await call<Scvm>(`/api/characters/${rolled.id}`, player)).id,
    rolled.id
  );
});

test('room removal commits membership and bindings together, retains cleanup, and safely replays (RPG-336)', async () => {
  const { gm, roomId, party } = await room();
  const player = await actor();
  const scvm = await call<Scvm>(
    `/api/characters/new?obrRoom=${roomId}&obrPlayer=member`,
    player,
    'POST',
    {},
    201
  );
  await call(
    `/api/obr/rooms/${roomId}/tokens/token-1/character`,
    player,
    'PUT',
    { characterId: scvm.id }
  );
  const path = `/api/obr/rooms/${roomId}/participation/remove`;
  const command = { characterId: scvm.id, operationId: randomUUID() };
  const removed = await call<{
    cleanup: Array<{ id: string; tokenId: string }>;
  }>(path, gm, 'POST', command);
  assert.equal(removed.cleanup.length, 1);
  assert.equal(removed.cleanup[0].tokenId, 'token-1');
  assert.deepEqual(
    (await call<Party>(`/api/parties/${party.id}`, gm)).members,
    []
  );
  assert.deepEqual(await call<Bindings>(`/api/obr/rooms/${roomId}/bindings`), {
    roomId,
    players: [],
    tokens: [],
  });
  assert.deepEqual(
    await call(`/api/obr/rooms/${roomId}/cards?ids=${scvm.id}`),
    []
  );
  const lateClaimant = await actor(true);
  await call(
    `/api/obr/rooms/${roomId}/players/member/character/claim`,
    lateClaimant,
    'POST',
    {},
    404
  );
  const reopened = await call<{ cleanup: unknown[] }>(
    `/api/obr/rooms/${roomId}/participation`,
    gm
  );
  assert.deepEqual(reopened.cleanup, removed.cleanup);
  assert.deepEqual(
    (await call<{ cleanup: unknown[] }>(path, gm, 'POST', command)).cleanup,
    removed.cleanup
  );
  assert.equal(
    (await call<Scvm>(`/api/characters/${scvm.id}`, player)).id,
    scvm.id
  );
});

test('normal kick and self-leave use room removal policy without giving strangers control', async () => {
  for (const action of ['kick', 'leave']) {
    const { gm, roomId, party } = await room();
    const player = await actor();
    const stranger = await actor(true);
    const scvm = await call<Scvm>(
      `/api/characters/new?obrRoom=${roomId}&obrPlayer=member`,
      player,
      'POST',
      {},
      201
    );
    await call(
      `/api/obr/rooms/${roomId}/tokens/token-1/character`,
      player,
      'PUT',
      { characterId: scvm.id }
    );
    await call(
      `/api/obr/rooms/${roomId}/participation/remove`,
      stranger,
      'POST',
      {
        characterId: scvm.id,
        operationId: randomUUID(),
      },
      403
    );
    assert.equal(
      (await call<Party>(`/api/parties/${party.id}`, gm)).members.length,
      1
    );
    assert.equal(
      (await call<Bindings>(`/api/obr/rooms/${roomId}/bindings`)).tokens.length,
      1
    );
    assert.deepEqual(
      (
        await call<{ cleanup: unknown[] }>(
          `/api/obr/rooms/${roomId}/participation`,
          gm
        )
      ).cleanup,
      []
    );
    await call(
      `/api/parties/${party.id}/${action}`,
      action === 'kick' ? gm : player,
      'POST',
      { characterId: scvm.id },
      204
    );
    assert.deepEqual(
      (await call<Bindings>(`/api/obr/rooms/${roomId}/bindings`)).players,
      []
    );
    assert.deepEqual(
      (await call<Bindings>(`/api/obr/rooms/${roomId}/bindings`)).tokens,
      []
    );
    assert.equal(
      (
        await call<{ cleanup: unknown[] }>(
          `/api/obr/rooms/${roomId}/participation`,
          gm
        )
      ).cleanup.length,
      1
    );
    assert.equal(
      (await call<Scvm>(`/api/characters/${scvm.id}`, player)).id,
      scvm.id
    );
  }
});

test('old cleanup and duplicate removals cannot erase a deliberate rejoin or a new token generation', async () => {
  const { gm, roomId, party } = await room();
  const player = await actor();
  const scvm = await call<Scvm>(
    `/api/characters/new?obrRoom=${roomId}&obrPlayer=member`,
    player,
    'POST',
    {},
    201
  );
  const tokenPath = `/api/obr/rooms/${roomId}/tokens/token-1/character`;
  const original = await call<{ generation: string }>(
    tokenPath,
    player,
    'PUT',
    { characterId: scvm.id }
  );
  assert.equal(typeof original.generation, 'string');
  const command = { characterId: scvm.id, operationId: randomUUID() };
  const path = `/api/obr/rooms/${roomId}/participation/remove`;
  const removed = await call<{
    cleanup: Array<{ id: string; generation: string }>;
  }>(path, gm, 'POST', command);
  assert.equal(removed.cleanup[0].generation, original.generation);
  await call('/api/parties/join', player, 'POST', {
    token: party.inviteToken,
    characterId: scvm.id,
  });
  const rebound = await call<{ generation: string }>(tokenPath, player, 'PUT', {
    characterId: scvm.id,
  });
  assert.notEqual(rebound.generation, original.generation);
  await call(path, gm, 'POST', command);
  await call(
    `/api/obr/rooms/${roomId}/participation/cleanup/${removed.cleanup[0].id}/ack`,
    player,
    'POST',
    {},
    403
  );
  await call(
    `/api/obr/rooms/${roomId}/participation/cleanup/${removed.cleanup[0].id}/ack`,
    gm,
    'POST',
    {}
  );
  const current = await call<{
    memberIds: string[];
    tokens: Array<{ generation: string }>;
    cleanup: unknown[];
  }>(`/api/obr/rooms/${roomId}/participation`, gm);
  assert.deepEqual(current.memberIds, [scvm.id]);
  assert.equal(current.tokens[0].generation, rebound.generation);
  assert.deepEqual(current.cleanup, []);
});

test('a handoff requires registration, explicit approval and the initiating secret before one atomic redemption', async () => {
  const popup = await actor(true);
  const registered = await call<{
    handoffId: string;
    secret: string;
    code: string;
  }>('/api/auth/obr-handoff/register', undefined, 'POST', {});
  const proof = { handoffId: registered.handoffId, secret: registered.secret };
  assert.equal(
    (
      await call<{ state: string }>(
        '/api/auth/obr-handoff/take',
        undefined,
        'POST',
        proof
      )
    ).state,
    'awaiting-approval'
  );
  await call(
    '/api/auth/obr-handoff/approve',
    popup,
    'POST',
    {
      handoffId: randomUUID(),
      code: registered.code,
      expectedUserId: popup.userId,
    },
    410
  );
  await call(
    '/api/auth/obr-handoff/approve',
    popup,
    'POST',
    {
      handoffId: registered.handoffId,
      code: 'WRONG',
      expectedUserId: popup.userId,
    },
    400
  );
  await call('/api/auth/obr-handoff/redeem', undefined, 'POST', proof, 410);
  await call(
    '/api/auth/obr-handoff/approve',
    popup,
    'POST',
    {
      handoffId: registered.handoffId,
      code: registered.code,
      expectedUserId: 'another-account',
    },
    409
  );
  await call('/api/auth/obr-handoff/approve', popup, 'POST', {
    handoffId: registered.handoffId,
    code: registered.code,
    expectedUserId: popup.userId,
  });
  await call(
    '/api/auth/obr-handoff/take',
    undefined,
    'POST',
    { ...proof, secret: 'x'.repeat(43) },
    401
  );
  const approved = await call<{ state: string; user: { id: string } }>(
    '/api/auth/obr-handoff/take',
    undefined,
    'POST',
    proof
  );
  assert.equal(approved.state, 'approved');
  assert.equal(approved.user.id, popup.userId);
  const responses = await Promise.all(
    [1, 2].map(() =>
      fetch(new URL('/api/auth/obr-handoff/redeem', base), {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(proof),
      })
    )
  );
  assert.deepEqual(
    responses.map((response) => response.status).sort(),
    [200, 410]
  );
  assert.equal(
    responses.filter((response) => response.headers.has('set-auth-token'))
      .length,
    1
  );
  const received = responses.find((response) => response.status === 200)!;
  const session = await call<{ user: { id: string } }>(
    '/api/auth/get-session',
    {
      token: received.headers.get('set-auth-token')!,
      userId: popup.userId,
    }
  );
  assert.equal(session.user.id, popup.userId);
  await call('/api/auth/obr-handoff/redeem', undefined, 'POST', proof, 410);
});

test('full-sheet exchange needs a receiving secret and concurrent redemption creates only one session', async () => {
  const player = await actor(true);
  const secret = randomUUID() + randomUUID();
  await call('/api/auth/obr-exchange/issue', player, 'POST', {}, 400);
  const issued = await call<{ token: string }>(
    '/api/auth/obr-exchange/issue',
    player,
    'POST',
    { recipientSecret: secret }
  );
  await call('/api/auth/obr-exchange/redeem', undefined, 'POST', issued, 400);
  await call(
    '/api/auth/obr-exchange/redeem',
    undefined,
    'POST',
    { ...issued, recipientSecret: 'wrong'.repeat(10) },
    401
  );
  const responses = await Promise.all(
    [1, 2].map(() =>
      fetch(new URL('/api/auth/obr-exchange/redeem', base), {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...issued, recipientSecret: secret }),
      })
    )
  );
  assert.deepEqual(
    responses.map((response) => response.status).sort(),
    [200, 410]
  );
  assert.equal(
    responses.filter((response) => response.headers.has('set-auth-token'))
      .length,
    1
  );
});

test('rejecting a handoff in the approval page prevents later approval and redemption', async () => {
  const popup = await actor(true);
  const registered = await call<{
    handoffId: string;
    secret: string;
    code: string;
  }>('/api/auth/obr-handoff/register', undefined, 'POST', {});
  await call('/api/auth/obr-handoff/reject', popup, 'POST', {
    handoffId: registered.handoffId,
  });
  await call(
    '/api/auth/obr-handoff/approve',
    popup,
    'POST',
    {
      handoffId: registered.handoffId,
      code: registered.code,
      expectedUserId: popup.userId,
    },
    410
  );
  await call(
    '/api/auth/obr-handoff/redeem',
    undefined,
    'POST',
    registered,
    410
  );
});

test('expired handoffs cannot resume, and approved sign-in carries anonymous ownership to the receiving account', async () => {
  const popup = await actor(true);
  const expired = await call<{
    handoffId: string;
    secret: string;
    code: string;
  }>('/api/auth/obr-handoff/register', undefined, 'POST', {});
  const db = new Client({ connectionString: process.env.DATABASE_URL });
  await db.connect();
  try {
    // Clock fixture only; outcomes are checked through public auth/character endpoints.
    const digest = createHash('sha256')
      .update(expired.handoffId)
      .digest('base64url');
    await db.query(
      'UPDATE verification SET "expiresAt" = NOW() - INTERVAL \'1 second\' WHERE identifier = $1',
      [`obr-handoff:${digest}`]
    );
  } finally {
    await db.end();
  }
  await call(
    '/api/auth/obr-handoff/approve',
    popup,
    'POST',
    {
      handoffId: expired.handoffId,
      code: expired.code,
      expectedUserId: popup.userId,
    },
    410
  );
  await call('/api/auth/obr-handoff/redeem', undefined, 'POST', expired, 410);
  const guest = await actor();
  const scvm = await call<Scvm>('/api/characters/new', guest, 'POST', {}, 201);
  const active = await call<{
    handoffId: string;
    secret: string;
    code: string;
  }>('/api/auth/obr-handoff/register', guest, 'POST', {});
  await call('/api/auth/obr-handoff/approve', popup, 'POST', {
    handoffId: active.handoffId,
    code: active.code,
    expectedUserId: popup.userId,
  });
  await call('/api/auth/obr-handoff/redeem', guest, 'POST', active);
  assert.equal(
    (await call<Scvm>(`/api/characters/${scvm.id}`, popup)).id,
    scvm.id
  );
  await call(`/api/characters/${scvm.id}`, popup, 'PATCH', { silver: 73 });
  assert.equal(
    (await call<Scvm>(`/api/characters/${scvm.id}`, popup)).silver,
    73
  );
});

test('Owlbear custom-class roll joins and binds once, and full-sheet handoff preserves live card values', async () => {
  const { gm, roomId, party } = await room();
  const localized = (en: string) => ({ en, pl: '' });
  const die = { count: 3, faces: 6, modifier: 0, dropLowest: false };
  const createdClass = await call<{ id: number }>(
    '/api/classes',
    gm,
    'POST',
    {
      draft: {
        languages: ['en'],
        name: localized('OBR Ash Cartographer'),
        description: localized('Keeps the ash roads.'),
        stats: { strength: die, agility: die, presence: die, toughness: die },
        hpDie: 12,
        omenDie: 2,
        weaponDie: 10,
        armorDie: 4,
        silver: { count: 2, faces: 6, multiplier: 10 },
        origins: [localized('A burnt chapel')],
        abilities: [
          {
            random: false,
            name: localized('Cinder Map'),
            text: localized('Read the ash roads.'),
            modifiers: [],
            grantItem: 'new:map',
            grantPet: null,
            table: null,
          },
        ],
        items: [
          {
            ref: 'new:map',
            type: 'gear',
            name: localized('Cinder Atlas'),
            description: localized('The ash roads.'),
            value: 0,
            weapon: {
              diceCount: 1,
              diceFaces: 6,
              damageModifier: 0,
              reach: 'melee',
              ammo: 'none',
              ammoCount: 10,
              ammoName: '',
              modifiers: [],
            },
            armor: { tier: 1, modifiers: [] },
            gear: {
              kind: 'carried',
              uses: 0,
              effect: 'text',
              effectDie: 6,
              statuses: [],
            },
            pet: {
              hp: 4,
              actionDie: 4,
              action: 'attack',
              humanoid: false,
              buffs: [],
            },
          },
        ],
        randomAbilityCount: 0,
        gettingBetterRule: 'book',
        gettingBetterNote: localized(''),
      },
    },
    201
  );
  const pool = await call<{
    classes: Array<{ classId: number; lineageId: string }>;
  }>(`/api/parties/${party.id}/class-pool?locale=en`, gm);
  const custom = pool.classes.find((c) => c.classId === createdClass.id);
  assert.ok(custom);
  await call(
    `/api/parties/${party.id}/class-pool/lineages/${custom.lineageId}`,
    gm,
    'PUT',
    { enabled: true }
  );
  await call(`/api/parties/${party.id}/class-pool/classless`, gm, 'PUT', {
    enabled: false,
  });
  for (const cls of pool.classes.filter((c) => c.classId !== createdClass.id)) {
    await call(
      `/api/parties/${party.id}/class-pool/lineages/${cls.lineageId}`,
      gm,
      'PUT',
      { enabled: false }
    );
  }
  const offered = await call<{
    classes: Array<{ id: number }>;
    classlessEnabled: boolean;
  }>(`/api/characters/classes?locale=en&obrRoom=${roomId}`);
  assert.deepEqual(
    offered.classes.map((c) => c.id),
    [createdClass.id]
  );
  assert.equal(offered.classlessEnabled, false);
  const blocked = await actor();
  const rejected = await call<{ code: string }>(
    `/api/characters/new?obrRoom=${roomId}&obrPlayer=blocked`,
    blocked,
    'POST',
    { classless: true },
    409
  );
  assert.equal(rejected.code, 'CLASSLESS_NOT_AVAILABLE');
  const player = await actor();
  const scvm = await call<Scvm>(
    `/api/characters/new?locale=en&obrRoom=${roomId}&obrPlayer=player-1`,
    player,
    'POST',
    { classId: createdClass.id },
    201
  );
  assert.equal(scvm.className, 'OBR Ash Cartographer');
  assert.ok(scvm.abilities.some((a) => a.name === 'Cinder Map'));
  assert.ok(scvm.equipment.some((item) => item.name === 'Cinder Atlas'));
  const joined = await call<Party>(`/api/parties/${party.id}`, gm);
  assert.deepEqual(
    joined.members.map((m) => m.characterId),
    [scvm.id]
  );
  const bindings = await call<Bindings>(`/api/obr/rooms/${roomId}/bindings`);
  assert.ok(
    bindings.players.some(
      (b) => b.playerId === 'player-1' && b.characterId === scvm.id
    )
  );
  await call(
    `/api/obr/rooms/${roomId}/tokens/token-1/character`,
    player,
    'PUT',
    { characterId: scvm.id, playerId: 'player-1' }
  );
  await call(`/api/characters/${scvm.id}`, player, 'PATCH', {
    currentHp: 1,
    omens: 0,
    silver: 37,
  });
  const cards = await call<Card[]>(
    `/api/obr/rooms/${roomId}/cards?ids=${scvm.id}&locale=en`
  );
  assert.deepEqual(
    cards.map((c) => [c.id, c.currentHp, c.omens, c.silver]),
    [[scvm.id, 1, 0, 37]]
  );
  const recipientSecret = randomUUID() + randomUUID();
  const issued = await call<{ token: string }>(
    '/api/auth/obr-exchange/issue',
    player,
    'POST',
    { recipientSecret }
  );
  const redeem = await fetch(new URL('/api/auth/obr-exchange/redeem', base), {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ ...issued, recipientSecret }),
  });
  assert.equal(redeem.status, 200);
  const tabToken = redeem.headers.get('set-auth-token');
  assert.ok(tabToken);
  const tab = { token: tabToken, userId: player.userId };
  await call(`/api/characters/${scvm.id}`, tab, 'PATCH', { silver: 41 });
  const again = await call<Card[]>(
    `/api/obr/rooms/${roomId}/cards?ids=${scvm.id}&locale=en`
  );
  assert.equal(again[0].silver, 41);
  await call(`/api/parties/${party.id}/class-pool/classless`, gm, 'PUT', {
    enabled: true,
  });
  const classlessPlayer = await actor();
  const classless = await call<Scvm>(
    `/api/characters/new?locale=en&obrRoom=${roomId}&obrPlayer=player-2`,
    classlessPlayer,
    'POST',
    { classless: true },
    201
  );
  assert.equal(classless.classId, null);
});

test('Owlbear bindings enforce ownership and room scope; unbinding never deletes the scvm', async () => {
  const owner = await actor();
  const stranger = await actor();
  const scvm = await call<Scvm>('/api/characters/new', owner, 'POST', {}, 201);
  const roomId = `qa-${randomUUID()}`;
  await call(
    `/api/obr/rooms/${roomId}/tokens/token-1/character`,
    stranger,
    'PUT',
    { characterId: scvm.id },
    403
  );
  await call(
    `/api/obr/rooms/${roomId}/tokens/token-1/character`,
    owner,
    'PUT',
    { characterId: scvm.id }
  );
  const cards = await call<Card[]>(
    `/api/obr/rooms/${roomId}/cards?ids=${scvm.id}`
  );
  assert.deepEqual(
    cards.map((c) => c.id),
    [scvm.id]
  );
  assert.deepEqual(
    await call(`/api/obr/rooms/other-${roomId}/cards?ids=${scvm.id}`),
    []
  );
  await call(
    `/api/obr/rooms/${roomId}/tokens/token-1/character`,
    owner,
    'DELETE',
    undefined,
    204
  );
  const bindings = await call<Bindings>(`/api/obr/rooms/${roomId}/bindings`);
  assert.deepEqual(bindings.tokens, []);
  assert.deepEqual(
    await call(`/api/obr/rooms/${roomId}/cards?ids=${scvm.id}`),
    []
  );
  assert.equal(
    (await call<Scvm>(`/api/characters/${scvm.id}`, owner)).id,
    scvm.id
  );
  await call('/api/auth/sign-out', owner, 'POST', {});
  await call(
    `/api/characters/${scvm.id}`,
    owner,
    'PATCH',
    { silver: 999 },
    401
  );
  const resumed = await actor();
  const db = new Client({ connectionString: process.env.DATABASE_URL });
  await db.connect();
  try {
    // Authentication fixture: model a new sign-in for the original identity.
    // The retried save still goes through real auth and ownership checks.
    await db.query('UPDATE "session" SET "userId" = $1 WHERE "userId" = $2', [
      owner.userId,
      resumed.userId,
    ]);
  } finally {
    await db.end();
  }
  assert.equal(
    (await call<Scvm>(`/api/characters/${scvm.id}`, resumed)).silver,
    scvm.silver
  );
  await call(`/api/characters/${scvm.id}`, resumed, 'PATCH', { silver: 999 });
  assert.equal(
    (await call<Scvm>(`/api/characters/${scvm.id}`, resumed)).silver,
    999
  );
});

test('the attached party owner manages member bindings without gaining access to unrelated characters or rooms', async () => {
  const { gm, roomId, party } = await room();
  const player = await actor();
  const member = await call<Scvm>(
    `/api/characters/new?obrRoom=${roomId}&obrPlayer=member`,
    player,
    'POST',
    {},
    201
  );
  const stranger = await actor(true);
  const tokenPath = `/api/obr/rooms/${roomId}/tokens/gm-token/character`;
  const playerPath = `/api/obr/rooms/${roomId}/players/assigned-member/character`;
  await call(tokenPath, gm, 'PUT', { characterId: member.id });
  const cards = await call<Card[]>(
    `/api/obr/rooms/${roomId}/cards?ids=${member.id}`
  );
  assert.equal(cards[0].id, member.id);
  await call(tokenPath, stranger, 'PUT', { characterId: member.id }, 403);
  await call(tokenPath, stranger, 'DELETE', undefined, 403);
  await call(playerPath, gm, 'PUT', { characterId: member.id });
  await call(playerPath, stranger, 'DELETE', undefined, 403);
  await call(
    `/api/obr/rooms/other-${roomId}/tokens/gm-token/character`,
    gm,
    'PUT',
    { characterId: member.id },
    403
  );
  const unrelated = await call<Scvm>(
    '/api/characters/new',
    stranger,
    'POST',
    {},
    201
  );
  await call(tokenPath, gm, 'PUT', { characterId: unrelated.id }, 403);
  await call(tokenPath, gm, 'DELETE', undefined, 204);
  await call(playerPath, gm, 'DELETE', undefined, 204);
  const bindings = await call<Bindings>(`/api/obr/rooms/${roomId}/bindings`);
  assert.deepEqual(bindings.tokens, []);
  assert.equal(
    bindings.players.some((binding) => binding.playerId === 'assigned-member'),
    false
  );
  assert.equal(
    (await call<Scvm>(`/api/characters/${member.id}`, player)).id,
    member.id
  );
  await call(`/api/parties/${party.id}/detach-room`, gm, 'POST', {});
  await call(tokenPath, gm, 'PUT', { characterId: member.id }, 403);
});

test('the attached GM clears orphaned bindings without acquiring character or other-room access (RPG-334)', async () => {
  const { gm, roomId, party } = await room();
  const otherRoom = await room();
  const player = await actor();
  const scvm = await call<Scvm>(
    `/api/characters/new?obrRoom=${roomId}&obrPlayer=former`,
    player,
    'POST',
    {},
    201
  );
  const playerPath = `/api/obr/rooms/${roomId}/players/former/character`;
  const tokenPath = `/api/obr/rooms/${roomId}/tokens/former/character`;
  const otherPath = `/api/obr/rooms/${otherRoom.roomId}/tokens/former/character`;
  await call(tokenPath, player, 'PUT', { characterId: scvm.id });
  await call(otherPath, player, 'PUT', { characterId: scvm.id });
  const fixtureDb = new Client({ connectionString: process.env.DATABASE_URL });
  await fixtureDb.connect();
  try {
    // Recreate a pre-redesign orphan; new kicks deliberately cannot produce one.
    await fixtureDb.query(
      'UPDATE characters SET party_id = NULL, joined_at = NULL WHERE id = $1',
      [scvm.id]
    );
  } finally {
    await fixtureDb.end();
  }
  assert.deepEqual(
    (await call<Party>(`/api/parties/${party.id}`, gm)).members,
    []
  );
  for (const path of [playerPath, tokenPath]) {
    await call(path, otherRoom.gm, 'DELETE', undefined, 403);
    await call(path, undefined, 'DELETE', undefined, 403);
    await call(path, gm, 'PUT', { characterId: scvm.id }, 403);
    await call(path, gm, 'DELETE', undefined, 204);
  }
  const bindings = await call<Bindings>(`/api/obr/rooms/${roomId}/bindings`);
  assert.deepEqual(bindings.players, []);
  assert.deepEqual(bindings.tokens, []);
  await call(otherPath, gm, 'DELETE', undefined, 403);
  assert.equal(
    (await call<Bindings>(`/api/obr/rooms/${otherRoom.roomId}/bindings`))
      .tokens[0].characterId,
    scvm.id
  );
  assert.equal(
    (await call<Scvm>(`/api/characters/${scvm.id}`, player)).id,
    scvm.id
  );
  await call(`/api/characters/${scvm.id}`, gm, 'GET', undefined, 403);
  await call(tokenPath, gm, 'PUT', { characterId: scvm.id }, 403);
});

test('Owlbear party attach restores members, Miseries and safe enemy state without exposing GM notes in player cards', async () => {
  const { gm, roomId, party } = await room();
  const player = await actor();
  const scvm = await call<Scvm>(
    `/api/characters/new?obrRoom=${roomId}&obrPlayer=player-1`,
    player,
    'POST',
    {},
    201
  );
  const enemy = await call<{ id: string }>(
    `/api/parties/by-room/${roomId}/enemies`,
    gm,
    'POST',
    {
      name: 'QA Ash Wight',
      type: 'Undead',
      habitat: 'Chapel',
      description: 'GM secret: silver reliquary.',
      playerDescription: 'Ash falls from its mouth.',
      currentHealth: 8,
      maxHealth: 8,
      morale: 7,
      armorDie: '-d2',
      armorDescription: 'Bones',
      attacks: [],
      specials: [],
      loot: [],
      statuses: [
        { id: 'wounded', percent: 50, label: 'Wounded' },
        { id: 'healthy', percent: 100, label: 'Healthy' },
      ],
    },
    201
  );
  await call(`/api/parties/${party.id}/miseries`, gm, 'PUT', {
    miseryCount: 3,
  });
  await call(
    `/api/parties/by-room/${roomId}/enemies/${enemy.id}/health`,
    gm,
    'PATCH',
    { currentHealth: 4 }
  );
  const safe = await call<Array<Record<string, unknown>>>(
    `/api/parties/by-room/${roomId}/enemies/cards?characterId=${scvm.id}`
  );
  assert.equal(safe[0].healthPercent, 50);
  assert.equal(safe[0].playerDescription, 'Ash falls from its mouth.');
  for (const key of ['description', 'loot', 'attacks', 'morale']) {
    assert.equal(key in safe[0], false);
  }
  assert.equal(
    (await call<Scvm>(`/api/characters/${scvm.id}`, player)).miseryCount,
    3
  );
  await call(`/api/parties/${party.id}/detach-room`, gm, 'POST', {});
  const nextRoom = `qa-${randomUUID()}`;
  await call(`/api/parties/${party.id}/attach-room`, gm, 'POST', {
    obrRoomId: nextRoom,
  });
  const restored = await call<Party>(`/api/parties/${party.id}`, gm);
  assert.deepEqual(
    restored.members.map((m) => m.characterId),
    [scvm.id]
  );
  const threats = await call<Array<{ id: string; currentHealth: number }>>(
    `/api/parties/by-room/${nextRoom}/enemies`,
    gm
  );
  assert.deepEqual(
    threats.map((e) => [e.id, e.currentHealth]),
    [[enemy.id, 4]]
  );
  await call(
    `/api/parties/${party.id}/attach-room`,
    player,
    'POST',
    { obrRoomId: roomId },
    404
  );
});
