import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import test from 'node:test';
import { Client } from 'pg';

const baseUrl = process.env.E2E_BASE_URL ?? 'http://localhost:3000';
const databaseUrl = process.env.DATABASE_URL;

class CookieJar {
  readonly cookies = new Map<string, string>();

  capture(response: Response): void {
    const setCookies =
      typeof response.headers.getSetCookie === 'function' ? response.headers.getSetCookie() : [];
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
      if (key && value) this.cookies.set(key, value);
    }
  }

  header(): string {
    return [...this.cookies.entries()].map(([key, value]) => `${key}=${value}`).join('; ');
  }
}

async function request(
  path: string,
  options: { method?: string; json?: unknown; jar?: CookieJar; csrf?: boolean } = {}
): Promise<Response> {
  const { method = 'GET', json, jar } = options;
  const headers: Record<string, string> = {};
  if (jar) {
    // Fetch the CSRF token first: it sets the secret cookie the request must carry.
    if (options.csrf) headers['x-csrf-token'] = await fetchCsrfToken(jar);
    const cookieHeader = jar.header();
    if (cookieHeader) headers.cookie = cookieHeader;
  }
  let body: string | undefined;
  if (json !== undefined) {
    headers['content-type'] = 'application/json';
    body = JSON.stringify(json);
  }
  const response = await fetch(new URL(path, baseUrl), { method, headers, body });
  if (jar) jar.capture(response);
  return response;
}

async function fetchCsrfToken(jar: CookieJar): Promise<string> {
  const response = await fetch(new URL('/api/csrf-token', baseUrl), {
    headers: { cookie: jar.header() },
  });
  jar.capture(response);
  assert.equal(response.status, 200);
  return ((await response.json()) as { token: string }).token;
}

async function expectStatus(response: Response, expected: number): Promise<void> {
  if (response.status === expected) return;
  assert.fail(`${response.url} returned ${response.status}, expected ${expected}: ${await response.text()}`);
}

async function withDatabase<T>(callback: (client: Client) => Promise<T>): Promise<T> {
  assert.ok(databaseUrl, 'DATABASE_URL is required for integration fixtures');
  const client = new Client({ connectionString: databaseUrl });
  await client.connect();
  try {
    return await callback(client);
  } finally {
    await client.end();
  }
}

async function anonymousSession(): Promise<{ jar: CookieJar; userId: string }> {
  const jar = new CookieJar();
  const response = await request('/api/auth/sign-in/anonymous', { method: 'POST', json: {}, jar });
  await expectStatus(response, 200);
  const userId = ((await response.json()) as { user?: { id?: string } }).user?.id;
  assert.equal(typeof userId, 'string');
  return { jar, userId: userId! };
}

async function gmParty(): Promise<{ jar: CookieJar; id: string; inviteToken: string }> {
  const gm = await anonymousSession();
  await withDatabase((client) =>
    client.query(
      'UPDATE "user" SET name = $2, email = $3, "emailVerified" = true, "isAnonymous" = false WHERE id = $1',
      [gm.userId, 'GM join test', `gm.${Date.now()}.${Math.random().toString(36).slice(2)}@example.test`]
    )
  );
  const roomId = `join-room-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const response = await request('/api/parties/promote', {
    method: 'POST',
    json: { obrRoomId: roomId, name: `Room ${roomId}` },
    jar: gm.jar,
    csrf: true,
  });
  await expectStatus(response, 200);
  const party = (await response.json()) as { id: string; inviteToken: string };
  return { jar: gm.jar, ...party };
}

const sections = ['name', 'stats', 'omens', 'silver', 'origin', 'abilities', 'gear', 'personality'];
const seeds = Object.fromEntries(
  sections.map((section) => [section, createHash('sha256').update(`join:${section}`).digest('hex')])
);

async function characterCount(userId: string): Promise<number> {
  return withDatabase(async (client) => {
    const result = await client.query('SELECT count(*)::int AS n FROM characters WHERE user_id = $1', [userId]);
    return result.rows[0].n as number;
  });
}

test("an invite's class list is the party's default pool: the six Book Classes", async () => {
  const party = await gmParty();
  const player = await anonymousSession();

  const response = await request(`/api/characters/classes?locale=en&invite=${party.inviteToken}`, {
    jar: player.jar,
  });

  await expectStatus(response, 200);
  const classes = (await response.json()) as Array<{ id: number }>;
  assert.deepEqual(classes.map((cls) => cls.id), [1, 2, 3, 4, 5, 6]);
});

test('forging through an invite creates the scvm already in the party', async () => {
  const party = await gmParty();
  const player = await anonymousSession();

  const draftResponse = await request(`/api/characters/draft?locale=en&invite=${party.inviteToken}`, {
    method: 'POST',
    json: { classId: 3, seeds },
    jar: player.jar,
    csrf: true,
  });
  await expectStatus(draftResponse, 200);
  const { draft } = (await draftResponse.json()) as { draft: unknown };

  const created = await request(`/api/characters/new?locale=en&invite=${party.inviteToken}`, {
    method: 'POST',
    json: { draft },
    jar: player.jar,
    csrf: true,
  });

  await expectStatus(created, 201);
  const character = (await created.json()) as { id: string; partyId: string | null; classId: number };
  assert.equal(character.partyId, party.id);
  assert.equal(character.classId, 3);
});

test('a class taken out of the pool mid-forge is refused on confirm and nothing is created', async () => {
  const party = await gmParty();
  const player = await anonymousSession();
  const draftResponse = await request(`/api/characters/draft?locale=en&invite=${party.inviteToken}`, {
    method: 'POST',
    json: { classId: 2, seeds },
    jar: player.jar,
    csrf: true,
  });
  await expectStatus(draftResponse, 200);
  const { draft } = (await draftResponse.json()) as { draft: unknown };

  await withDatabase((client) =>
    client.query(
      'DELETE FROM party_class_pools WHERE party_id = $1 AND lineage_id = (SELECT lineage_id FROM classes WHERE id = 2)',
      [party.id]
    )
  );
  const created = await request(`/api/characters/new?locale=en&invite=${party.inviteToken}`, {
    method: 'POST',
    json: { draft },
    jar: player.jar,
    csrf: true,
  });

  await expectStatus(created, 409);
  assert.equal(((await created.json()) as { code: string }).code, 'CLASS_NOT_AVAILABLE');
  assert.equal(await characterCount(player.userId), 0);
});

test('a rotated invite creates nothing', async () => {
  const party = await gmParty();
  const player = await anonymousSession();
  const draftResponse = await request(`/api/characters/draft?locale=en&invite=${party.inviteToken}`, {
    method: 'POST',
    json: { classId: 1, seeds },
    jar: player.jar,
    csrf: true,
  });
  await expectStatus(draftResponse, 200);
  const { draft } = (await draftResponse.json()) as { draft: unknown };

  const rotated = await request(`/api/parties/${party.id}/regenerate-link`, {
    method: 'POST',
    jar: party.jar,
    csrf: true,
  });
  await expectStatus(rotated, 200);
  const created = await request(`/api/characters/new?locale=en&invite=${party.inviteToken}`, {
    method: 'POST',
    json: { draft },
    jar: player.jar,
    csrf: true,
  });

  await expectStatus(created, 410);
  assert.equal(await characterCount(player.userId), 0);
});

type PoolView = {
  classlessEnabled: boolean;
  classes: Array<{ lineageId: string; classId: number; group: string; enabled: boolean }>;
  removed: unknown[];
};

test("the GM's pool panel switches classes and Classless, and invites follow it", async () => {
  const party = await gmParty();

  const initial = await request(`/api/parties/${party.id}/class-pool?locale=en`, { jar: party.jar });
  await expectStatus(initial, 200);
  const view = (await initial.json()) as PoolView;
  assert.equal(view.classlessEnabled, true);
  assert.deepEqual(
    view.classes.filter((c) => c.enabled).map((c) => [c.classId, c.group]),
    [1, 2, 3, 4, 5, 6].map((id) => [id, 'book'])
  );

  const hermit = view.classes.find((c) => c.classId === 3)!;
  const switched = await request(`/api/parties/${party.id}/class-pool/lineages/${hermit.lineageId}?locale=en`, {
    method: 'PUT',
    json: { enabled: false },
    jar: party.jar,
    csrf: true,
  });
  await expectStatus(switched, 200);
  assert.equal(((await switched.json()) as PoolView).classes.find((c) => c.classId === 3)!.enabled, false);

  const classless = await request(`/api/parties/${party.id}/class-pool/classless?locale=en`, {
    method: 'PUT',
    json: { enabled: false },
    jar: party.jar,
    csrf: true,
  });
  await expectStatus(classless, 200);
  assert.equal(((await classless.json()) as PoolView).classlessEnabled, false);

  const player = await anonymousSession();
  const offered = await request(`/api/characters/classes?locale=en&invite=${party.inviteToken}`, {
    jar: player.jar,
  });
  await expectStatus(offered, 200);
  assert.deepEqual(((await offered.json()) as Array<{ id: number }>).map((c) => c.id), [1, 2, 4, 5, 6]);
});

test("someone else's party pool is not found", async () => {
  const party = await gmParty();
  const stranger = await anonymousSession();

  const response = await request(`/api/parties/${party.id}/class-pool?locale=en`, { jar: stranger.jar });

  await expectStatus(response, 404);
});

function customClassDraft(name: string) {
  const stat = { count: 3, faces: 6, modifier: 0, dropLowest: false };
  return {
    languages: ['en'],
    name: { en: name, pl: '' },
    description: { en: 'The mire keeps what you give it.', pl: '' },
    stats: { strength: stat, agility: stat, presence: { ...stat, count: 4, dropLowest: true }, toughness: stat },
    hpDie: 6,
    omenDie: 4,
    weaponDie: 8,
    armorDie: 2,
    silver: { count: 2, faces: 6, multiplier: 10 },
    origins: [{ en: 'A drowned village', pl: '' }],
    gettingBetterRule: 'book',
    gettingBetterNote: { en: '', pl: '' },
  };
}

test('a forged class shows under My classes, joins the pool and a player rolls it through the invite', async () => {
  const party = await gmParty();
  const name = `Bog Witch ${Date.now()}`;

  const rolled = await request('/api/classes/test-roll?locale=en', {
    method: 'POST',
    json: { draft: customClassDraft(name), language: 'en' },
    jar: party.jar,
    csrf: true,
  });
  await expectStatus(rolled, 200);
  assert.equal(((await rolled.json()) as { origin: string }).origin, 'A drowned village');

  const saved = await request('/api/classes', {
    method: 'POST',
    json: { draft: customClassDraft(name) },
    jar: party.jar,
    csrf: true,
  });
  await expectStatus(saved, 201);
  const { id } = (await saved.json()) as { id: number };

  const clash = await request('/api/classes', {
    method: 'POST',
    json: { draft: customClassDraft(name) },
    jar: party.jar,
    csrf: true,
  });
  await expectStatus(clash, 409);
  assert.equal(((await clash.json()) as { code: string }).code, 'CLASS_NAME_TAKEN');

  const mine = await request('/api/classes/mine?locale=en', { jar: party.jar });
  await expectStatus(mine, 200);
  const list = (await mine.json()) as Array<{ id: number; name: string; visibility: string }>;
  assert.deepEqual(list[0], { ...list[0], id, name, visibility: 'private' });

  const pool = await request(`/api/parties/${party.id}/class-pool?locale=en`, { jar: party.jar });
  const own = ((await pool.json()) as PoolView).classes.find((c) => c.classId === id)!;
  assert.equal(own.group, 'mine');
  const enabled = await request(`/api/parties/${party.id}/class-pool/lineages/${own.lineageId}?locale=en`, {
    method: 'PUT',
    json: { enabled: true },
    jar: party.jar,
    csrf: true,
  });
  await expectStatus(enabled, 200);

  const player = await anonymousSession();
  const offered = await request(`/api/characters/classes?locale=en&invite=${party.inviteToken}`, { jar: player.jar });
  const offeredClasses = (await offered.json()) as Array<{ id: number; name: string }>;
  assert.equal(offeredClasses.find((c) => c.id === id)?.name, name);

  const draftResponse = await request(`/api/characters/draft?locale=en&invite=${party.inviteToken}`, {
    method: 'POST',
    json: { classId: id, seeds },
    jar: player.jar,
    csrf: true,
  });
  await expectStatus(draftResponse, 200);
  const { draft, preview } = (await draftResponse.json()) as { draft: unknown; preview: { origin: string } };
  assert.equal(preview.origin, 'A drowned village');
  const created = await request(`/api/characters/new?locale=en&invite=${party.inviteToken}`, {
    method: 'POST',
    json: { draft },
    jar: player.jar,
    csrf: true,
  });
  await expectStatus(created, 201);
  const scvm = (await created.json()) as { id: string; classId: number };
  assert.equal(scvm.classId, id);

  const edited = await request(`/api/classes/${id}`, {
    method: 'PUT',
    json: { draft: { ...customClassDraft(name), origins: [{ en: 'The peat bog', pl: '' }, { en: 'A gibbet', pl: '' }] } },
    jar: party.jar,
    csrf: true,
  });
  await expectStatus(edited, 200);
  const reloaded = await request(`/api/classes/${id}`, { jar: party.jar });
  const origins = ((await reloaded.json()) as { draft: { origins: Array<{ en: string; key: string }> } }).draft.origins;
  assert.deepEqual(origins.map((o) => o.en), ['The peat bog', 'A gibbet']);
  assert.ok(origins.every((o) => /^cc\.\d+\.origin\.\d+$/.test(o.key)));

  // The GM removed the origin this scvm rolled; the scvm keeps its text.
  const sheet = await request(`/api/characters/${scvm.id}?locale=en`, { jar: player.jar });
  await expectStatus(sheet, 200);
  assert.equal(((await sheet.json()) as { origin: string }).origin, 'A drowned village');
});

test("a guest can't forge a class", async () => {
  const guest = await anonymousSession();

  const response = await request('/api/classes', {
    method: 'POST',
    json: { draft: customClassDraft('Guest class') },
    jar: guest.jar,
    csrf: true,
  });

  await expectStatus(response, 401);
});
