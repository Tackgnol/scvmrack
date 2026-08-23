import assert from 'node:assert/strict';
import test from 'node:test';
import { Client } from 'pg';

const baseUrl = process.env.E2E_BASE_URL ?? 'http://localhost:3000';
const databaseUrl = process.env.DATABASE_URL;

class CookieJar {
  readonly cookies = new Map<string, string>();

  capture(response: Response): void {
    const setCookies =
      typeof response.headers.getSetCookie === 'function'
        ? response.headers.getSetCookie()
        : [];

    if (setCookies.length === 0) {
      const single = response.headers.get('set-cookie');
      if (single) setCookies.push(single);
    }

    for (const rawCookie of setCookies) {
      const firstChunk = rawCookie.split(';')[0];
      const separator = firstChunk.indexOf('=');
      if (separator <= 0) continue;
      const key = firstChunk.slice(0, separator).trim();
      const value = firstChunk.slice(separator + 1).trim();
      if (!key || !value) continue;
      this.cookies.set(key, value);
    }
  }

  header(): string {
    return [...this.cookies.entries()]
      .map(([key, value]) => `${key}=${value}`)
      .join('; ');
  }
}

type ApiErrorPayload = {
  error?: string;
  message?: string;
  code?: string;
  statusCode?: number;
  requestId?: string;
  details?: Array<{ field?: string; message?: string; code?: string }>;
};

type EnemyFull = {
  id: string;
  partyId: string;
  name: string;
  type: string;
  habitat: string;
  description: string;
  playerDescription: string;
  currentHealth: number;
  healthPercent: number;
  maxHealth: number;
  morale: number;
  armorDie: string;
  armorDescription: string;
  attacks: Array<{ id: string; name: string; die: string }>;
  specials: Array<{ id: string; name: string; description: string }>;
  loot: Array<{ id: string; label: string; value: string }>;
  statuses: Array<{ id: string; percent: number; label: string }>;
};

type EnemyCard = {
  id: string;
  name: string;
  type: string;
  habitat: string;
  playerDescription: string;
  healthPercent: number;
  statusId: string;
  statusLabel: string;
};

type PartyDetail = {
  id: string;
  name: string;
  inviteToken: string;
  invitePath: string;
};

const ENEMY_BODY = {
  name: 'Ash Wight',
  type: 'Undead',
  habitat: 'Ash chapel',
  description: 'It remembers the reliquary route.',
  playerDescription: 'Grey ash falls from its mouth.',
  currentHealth: 4,
  maxHealth: 8,
  morale: 7,
  armorDie: '-d2',
  armorDescription: 'Soot-caked bones',
  attacks: [{ id: 'attack-1', name: 'Ash claw', die: 'd6' }],
  specials: [
    {
      id: 'special-1',
      name: 'Choking ash',
      description: 'Presence DR12 or cough blood.',
    },
  ],
  loot: [{ id: 'loot-1', label: 'Relic ash', value: '20s' }],
  statuses: [
    { id: 'deaths-door', percent: 25, label: "At death's door" },
    { id: 'severely-wounded', percent: 50, label: 'Severely wounded' },
    { id: 'wounded', percent: 75, label: 'Wounded' },
    { id: 'healthy', percent: 100, label: 'Healthy' },
  ],
};

async function request(
  path: string,
  options: {
    method?: string;
    json?: unknown;
    headers?: Record<string, string>;
    jar?: CookieJar;
  } = {}
): Promise<Response> {
  const { method = 'GET', json, headers = {}, jar } = options;

  const requestHeaders: Record<string, string> = { ...headers };
  if (jar) {
    const cookieHeader = jar.header();
    if (cookieHeader) requestHeaders.cookie = cookieHeader;
  }

  let body: string | undefined;
  if (json !== undefined) {
    requestHeaders['content-type'] = 'application/json';
    body = JSON.stringify(json);
  }

  const response = await fetch(new URL(path, baseUrl), {
    method,
    headers: requestHeaders,
    body,
  });

  if (jar) jar.capture(response);
  return response;
}

async function expectStatus(
  response: Response,
  expectedStatus: number
): Promise<void> {
  if (response.status === expectedStatus) return;
  const payload = await response.text();
  assert.fail(
    `${response.url} returned ${response.status}, expected ${expectedStatus}. Payload: ${payload}`
  );
}

async function expectApiError(
  response: Response,
  expectedStatus: number,
  expectedCode: string,
  expectedMessage?: string
): Promise<ApiErrorPayload> {
  await expectStatus(response, expectedStatus);

  const payload = (await response.json()) as ApiErrorPayload;
  assert.equal(payload.statusCode, expectedStatus);
  assert.equal(payload.code, expectedCode);
  assert.equal(payload.error, payload.message);
  assert.ok(typeof payload.requestId === 'string');
  assert.ok(payload.requestId.length > 0);
  if (expectedMessage) {
    assert.equal(payload.message, expectedMessage);
  } else {
    assert.equal(typeof payload.message, 'string');
    assert.ok(payload.message.length > 0);
  }
  return payload;
}

async function fetchCsrfToken(jar: CookieJar): Promise<string> {
  const response = await request('/api/csrf-token', { jar });
  await expectStatus(response, 200);
  const { token } = (await response.json()) as { token: string };
  assert.equal(typeof token, 'string');
  return token;
}

async function bootstrapAnonymousSession(): Promise<{
  jar: CookieJar;
  userId: string;
}> {
  const jar = new CookieJar();
  const response = await request('/api/auth/sign-in/anonymous', {
    method: 'POST',
    json: {},
    jar,
  });
  await expectStatus(response, 200);
  const payload = (await response.json()) as { user?: { id?: string } };
  const userId = payload.user?.id;
  assert.equal(typeof userId, 'string');
  return { jar, userId };
}

async function bootstrapGmSession(label: string): Promise<{
  jar: CookieJar;
  userId: string;
}> {
  const session = await bootstrapAnonymousSession();
  await withDatabase((client) =>
    client.query(
      'UPDATE "user" SET name = $2, email = $3, "emailVerified" = true, "isAnonymous" = false WHERE id = $1',
      [
        session.userId,
        `GM ${label}`,
        `${label}.${Date.now()}.${Math.random()
          .toString(36)
          .slice(2)}@example.test`,
      ]
    )
  );
  return session;
}

async function withDatabase<T>(
  callback: (client: Client) => Promise<T>
): Promise<T> {
  assert.ok(databaseUrl, 'DATABASE_URL is required for integration fixtures');
  const client = new Client({ connectionString: databaseUrl });
  await client.connect();
  try {
    return await callback(client);
  } finally {
    await client.end();
  }
}

async function promoteRoom(
  jar: CookieJar,
  roomId: string
): Promise<PartyDetail> {
  const csrf = await fetchCsrfToken(jar);
  const response = await request('/api/parties/promote', {
    method: 'POST',
    json: { obrRoomId: roomId, name: `Room ${roomId}` },
    headers: { 'x-csrf-token': csrf },
    jar,
  });
  await expectStatus(response, 200);
  return (await response.json()) as PartyDetail;
}

async function createEnemy(
  jar: CookieJar,
  roomId: string,
  body = ENEMY_BODY
): Promise<EnemyFull> {
  const csrf = await fetchCsrfToken(jar);
  const response = await request(`/api/parties/by-room/${roomId}/enemies`, {
    method: 'POST',
    json: body,
    headers: { 'x-csrf-token': csrf },
    jar,
  });
  await expectStatus(response, 201);
  return (await response.json()) as EnemyFull;
}

async function createCharacter(jar: CookieJar): Promise<string> {
  const csrf = await fetchCsrfToken(jar);
  const response = await request('/api/characters/new', {
    method: 'POST',
    json: {},
    headers: { 'x-csrf-token': csrf },
    jar,
  });
  await expectStatus(response, 201);
  const { id } = (await response.json()) as { id: string };
  assert.equal(typeof id, 'string');
  return id;
}

async function bindCharacterToRoom(
  jar: CookieJar,
  characterId: string,
  roomId: string
): Promise<void> {
  const csrf = await fetchCsrfToken(jar);
  const response = await request(
    `/api/obr/rooms/${roomId}/players/player-1/character`,
    {
      method: 'PUT',
      json: { characterId },
      headers: { 'x-csrf-token': csrf },
      jar,
    }
  );
  await expectStatus(response, 200);
}

test('anonymous Owlbear sessions can manage enemies after room promotion', async () => {
  const { jar } = await bootstrapAnonymousSession();
  const roomId = `anon-enemies-${Date.now()}`;

  const unpromotedReadResponse = await request(
    `/api/parties/by-room/${roomId}/enemies`,
    {
      jar,
    }
  );
  await expectApiError(
    unpromotedReadResponse,
    404,
    'PARTY_NOT_FOUND',
    'Party not found'
  );

  const unpromotedCsrf = await fetchCsrfToken(jar);
  const unpromotedCreateResponse = await request(
    `/api/parties/by-room/${roomId}/enemies`,
    {
      method: 'POST',
      json: ENEMY_BODY,
      headers: { 'x-csrf-token': unpromotedCsrf },
      jar,
    }
  );
  await expectApiError(
    unpromotedCreateResponse,
    404,
    'PARTY_NOT_FOUND',
    'Party not found'
  );

  const party = await promoteRoom(jar, roomId);
  const created = await createEnemy(jar, roomId);
  assert.equal(created.partyId, party.id);
  assert.equal(created.name, 'Ash Wight');

  const readResponse = await request(`/api/parties/by-room/${roomId}/enemies`, {
    jar,
  });
  await expectStatus(readResponse, 200);
  const enemies = (await readResponse.json()) as EnemyFull[];
  assert.equal(enemies.length, 1);
  assert.equal(enemies[0].id, created.id);

  const csrf = await fetchCsrfToken(jar);
  const healthResponse = await request(
    `/api/parties/by-room/${roomId}/enemies/${created.id}/health`,
    {
      method: 'PATCH',
      json: { currentHealth: 1 },
      headers: { 'x-csrf-token': csrf },
      jar,
    }
  );
  await expectStatus(healthResponse, 200);
  const wounded = (await healthResponse.json()) as EnemyFull;
  assert.equal(wounded.currentHealth, 1);
});

test('GM enemy writes require a promoted Owlbear room party', async () => {
  const { jar } = await bootstrapGmSession('unpromoted-enemies');
  const csrf = await fetchCsrfToken(jar);

  const response = await request(
    '/api/parties/by-room/unpromoted-room/enemies',
    {
      method: 'POST',
      json: ENEMY_BODY,
      headers: { 'x-csrf-token': csrf },
      jar,
    }
  );

  await expectApiError(response, 404, 'PARTY_NOT_FOUND', 'Party not found');
});

test('room party owner can create, list, update health, and delete enemies', async () => {
  const roomId = `enemy-owner-${Date.now()}`;
  const { jar } = await bootstrapGmSession('enemy-owner');
  const party = await promoteRoom(jar, roomId);

  const created = await createEnemy(jar, roomId);
  assert.equal(created.partyId, party.id);
  assert.equal(created.name, 'Ash Wight');
  assert.equal(created.description, ENEMY_BODY.description);
  assert.equal(created.playerDescription, ENEMY_BODY.playerDescription);
  assert.equal(created.currentHealth, 4);
  assert.equal(created.maxHealth, 8);
  assert.equal(created.healthPercent, 50);
  assert.deepEqual(created.attacks, ENEMY_BODY.attacks);

  const listResponse = await request(`/api/parties/by-room/${roomId}/enemies`, {
    jar,
  });
  await expectStatus(listResponse, 200);
  const enemies = (await listResponse.json()) as EnemyFull[];
  assert.equal(enemies.length, 1);
  assert.equal(enemies[0].id, created.id);

  const healthCsrf = await fetchCsrfToken(jar);
  const healthResponse = await request(
    `/api/parties/by-room/${roomId}/enemies/${created.id}/health`,
    {
      method: 'PATCH',
      json: { currentHealth: 2 },
      headers: { 'x-csrf-token': healthCsrf },
      jar,
    }
  );
  await expectStatus(healthResponse, 200);
  const wounded = (await healthResponse.json()) as EnemyFull;
  assert.equal(wounded.currentHealth, 2);
  assert.equal(wounded.healthPercent, 25);

  const deleteCsrf = await fetchCsrfToken(jar);
  const deleteResponse = await request(
    `/api/parties/by-room/${roomId}/enemies/${created.id}`,
    {
      method: 'DELETE',
      headers: { 'x-csrf-token': deleteCsrf },
      jar,
    }
  );
  await expectStatus(deleteResponse, 204);

  const afterDeleteResponse = await request(
    `/api/parties/by-room/${roomId}/enemies`,
    { jar }
  );
  await expectStatus(afterDeleteResponse, 200);
  assert.deepEqual(await afterDeleteResponse.json(), []);
});

test('another GM can read and mutate enemies for the promoted Owlbear room', async () => {
  const roomId = `enemy-owner-gate-${Date.now()}`;
  const owner = await bootstrapGmSession('enemy-owner-gate-owner');
  const outsider = await bootstrapGmSession('enemy-owner-gate-outsider');
  await promoteRoom(owner.jar, roomId);
  const enemy = await createEnemy(owner.jar, roomId);

  const readResponse = await request(`/api/parties/by-room/${roomId}/enemies`, {
    jar: outsider.jar,
  });
  await expectStatus(readResponse, 200);
  const enemies = (await readResponse.json()) as EnemyFull[];
  assert.equal(enemies.length, 1);
  assert.equal(enemies[0].id, enemy.id);

  const csrf = await fetchCsrfToken(outsider.jar);
  const healthResponse = await request(
    `/api/parties/by-room/${roomId}/enemies/${enemy.id}/health`,
    {
      method: 'PATCH',
      json: { currentHealth: 1 },
      headers: { 'x-csrf-token': csrf },
      jar: outsider.jar,
    }
  );
  await expectStatus(healthResponse, 200);
  const wounded = (await healthResponse.json()) as EnemyFull;
  assert.equal(wounded.currentHealth, 1);
});

test('player enemy cards are safe projections gated by room-bound character id', async () => {
  const roomId = `enemy-cards-${Date.now()}`;
  const gm = await bootstrapGmSession('enemy-cards-gm');
  await promoteRoom(gm.jar, roomId);
  const enemy = await createEnemy(gm.jar, roomId);

  const player = await bootstrapAnonymousSession();
  const characterId = await createCharacter(player.jar);

  const unboundResponse = await request(
    `/api/parties/by-room/${roomId}/enemies/cards?characterId=${characterId}`
  );
  await expectStatus(unboundResponse, 200);
  assert.deepEqual(await unboundResponse.json(), []);

  await bindCharacterToRoom(player.jar, characterId, roomId);

  const cardsResponse = await request(
    `/api/parties/by-room/${roomId}/enemies/cards?characterId=${characterId}`
  );
  await expectStatus(cardsResponse, 200);
  const cards = (await cardsResponse.json()) as EnemyCard[];
  assert.equal(cards.length, 1);
  assert.deepEqual(cards[0], {
    id: enemy.id,
    name: 'Ash Wight',
    type: 'Undead',
    habitat: 'Ash chapel',
    playerDescription: 'Grey ash falls from its mouth.',
    healthPercent: 50,
    statusId: 'severely-wounded',
    statusLabel: 'Severely wounded',
  });
  assert.equal('description' in cards[0], false);
  assert.equal('attacks' in cards[0], false);
  assert.equal('loot' in cards[0], false);

  const wrongRoomResponse = await request(
    `/api/parties/by-room/other-${roomId}/enemies/cards?characterId=${characterId}`
  );
  await expectStatus(wrongRoomResponse, 200);
  assert.deepEqual(await wrongRoomResponse.json(), []);
});
