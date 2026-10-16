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
      typeof response.headers.getSetCookie === 'function'
        ? response.headers.getSetCookie()
        : [];
    if (setCookies.length === 0) {
      const single = response.headers.get('set-cookie');
      if (single) {
        setCookies.push(single);
      }
    }
    for (const rawCookie of setCookies) {
      const firstChunk = rawCookie.split(';')[0];
      const separator = firstChunk.indexOf('=');
      if (separator <= 0) {
        continue;
      }
      const key = firstChunk.slice(0, separator).trim();
      const value = firstChunk.slice(separator + 1).trim();
      if (key && value) {
        this.cookies.set(key, value);
      }
    }
  }

  header(): string {
    return [...this.cookies.entries()]
      .map(([key, value]) => `${key}=${value}`)
      .join('; ');
  }
}

async function request(
  path: string,
  options: {
    method?: string;
    json?: unknown;
    jar?: CookieJar;
    csrf?: boolean;
  } = {}
): Promise<Response> {
  const { method = 'GET', json, jar } = options;
  const headers: Record<string, string> = {};
  if (jar) {
    // Fetch the CSRF token first: it sets the secret cookie the request must carry.
    if (options.csrf) {
      headers['x-csrf-token'] = await fetchCsrfToken(jar);
    }
    const cookieHeader = jar.header();
    if (cookieHeader) {
      headers.cookie = cookieHeader;
    }
  }
  let body: string | undefined;
  if (json !== undefined) {
    headers['content-type'] = 'application/json';
    body = JSON.stringify(json);
  }
  const response = await fetch(new URL(path, baseUrl), {
    method,
    headers,
    body,
  });
  if (jar) {
    jar.capture(response);
  }
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

async function expectStatus(
  response: Response,
  expected: number
): Promise<void> {
  if (response.status === expected) {
    return;
  }
  assert.fail(
    `${response.url} returned ${
      response.status
    }, expected ${expected}: ${await response.text()}`
  );
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

async function anonymousSession(): Promise<{ jar: CookieJar; userId: string }> {
  const jar = new CookieJar();
  const response = await request('/api/auth/sign-in/anonymous', {
    method: 'POST',
    json: {},
    jar,
  });
  await expectStatus(response, 200);
  const userId = ((await response.json()) as { user?: { id?: string } }).user
    ?.id;
  assert.equal(typeof userId, 'string');
  return { jar, userId: userId! };
}

async function gmParty(): Promise<{
  jar: CookieJar;
  id: string;
  inviteToken: string;
}> {
  const gm = await anonymousSession();
  await withDatabase((client) =>
    client.query(
      'UPDATE "user" SET name = $2, email = $3, "emailVerified" = true, "isAnonymous" = false WHERE id = $1',
      [
        gm.userId,
        'GM join test',
        `gm.${Date.now()}.${Math.random().toString(36).slice(2)}@example.test`,
      ]
    )
  );
  const roomId = `join-room-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`;
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

const sections = [
  'name',
  'stats',
  'omens',
  'silver',
  'origin',
  'abilities',
  'gear',
  'personality',
];
const seeds = Object.fromEntries(
  sections.map((section) => [
    section,
    createHash('sha256').update(`join:${section}`).digest('hex'),
  ])
);

async function characterCount(userId: string): Promise<number> {
  return withDatabase(async (client) => {
    const result = await client.query(
      'SELECT count(*)::int AS n FROM characters WHERE user_id = $1',
      [userId]
    );
    return result.rows[0].n as number;
  });
}

test("an invite's class list is the party's default pool: the six Book Classes", async () => {
  const party = await gmParty();
  const player = await anonymousSession();

  const response = await request(
    `/api/characters/classes?locale=en&invite=${party.inviteToken}`,
    {
      jar: player.jar,
    }
  );

  await expectStatus(response, 200);
  const classes = (await response.json()) as Array<{ id: number }>;
  assert.deepEqual(
    classes.map((cls) => cls.id),
    [1, 2, 3, 4, 5, 6]
  );
});

async function forgeThroughInvite(
  jar: CookieJar,
  inviteToken: string,
  options: { classId?: number; replace?: boolean } = {}
): Promise<Response> {
  const draftResponse = await request(
    `/api/characters/draft?locale=en&invite=${inviteToken}`,
    { method: 'POST', json: { classId: options.classId ?? 1, seeds }, jar, csrf: true }
  );
  await expectStatus(draftResponse, 200);
  const { draft } = (await draftResponse.json()) as { draft: unknown };
  return request(`/api/characters/new?locale=en&invite=${inviteToken}`, {
    method: 'POST',
    json: { draft, replace: options.replace ?? false },
    jar,
    csrf: true,
  });
}

test('forging through an invite creates the scvm already in the party', async () => {
  const party = await gmParty();
  const player = await anonymousSession();

  const created = await forgeThroughInvite(player.jar, party.inviteToken, { classId: 3 });

  await expectStatus(created, 201);
  const character = (await created.json()) as {
    id: string;
    partyId: string | null;
    classId: number;
  };
  assert.equal(character.partyId, party.id);
  assert.equal(character.classId, 3);
});

test("owner-less scvm still hold party seats when a guest replaces theirs", async () => {
  const party = await gmParty();
  const guest = await anonymousSession();
  const elsewhere = await gmParty();
  await expectStatus(await forgeThroughInvite(guest.jar, elsewhere.inviteToken), 201);
  for (let seat = 0; seat < 10; seat++) {
    const player = await anonymousSession();
    await expectStatus(await forgeThroughInvite(player.jar, party.inviteToken), 201);
  }
  await withDatabase((client) =>
    client.query('UPDATE characters SET user_id = NULL WHERE party_id = $1', [party.id])
  );

  const created = await forgeThroughInvite(guest.jar, party.inviteToken, { replace: true });

  await expectStatus(created, 409);
  assert.equal(((await created.json()) as { code: string }).code, 'PARTY_FULL');
  assert.equal(await characterCount(guest.userId), 1);
});

test('a class taken out of the pool mid-forge is refused on confirm and nothing is created', async () => {
  const party = await gmParty();
  const player = await anonymousSession();
  const draftResponse = await request(
    `/api/characters/draft?locale=en&invite=${party.inviteToken}`,
    {
      method: 'POST',
      json: { classId: 2, seeds },
      jar: player.jar,
      csrf: true,
    }
  );
  await expectStatus(draftResponse, 200);
  const { draft } = (await draftResponse.json()) as { draft: unknown };

  await withDatabase((client) =>
    client.query(
      'DELETE FROM party_class_pools WHERE party_id = $1 AND lineage_id = (SELECT lineage_id FROM classes WHERE id = 2)',
      [party.id]
    )
  );
  const created = await request(
    `/api/characters/new?locale=en&invite=${party.inviteToken}`,
    {
      method: 'POST',
      json: { draft },
      jar: player.jar,
      csrf: true,
    }
  );

  await expectStatus(created, 409);
  assert.equal(
    ((await created.json()) as { code: string }).code,
    'CLASS_NOT_AVAILABLE'
  );
  assert.equal(await characterCount(player.userId), 0);
});

test('a rotated invite creates nothing', async () => {
  const party = await gmParty();
  const player = await anonymousSession();
  const draftResponse = await request(
    `/api/characters/draft?locale=en&invite=${party.inviteToken}`,
    {
      method: 'POST',
      json: { classId: 1, seeds },
      jar: player.jar,
      csrf: true,
    }
  );
  await expectStatus(draftResponse, 200);
  const { draft } = (await draftResponse.json()) as { draft: unknown };

  const rotated = await request(`/api/parties/${party.id}/regenerate-link`, {
    method: 'POST',
    jar: party.jar,
    csrf: true,
  });
  await expectStatus(rotated, 200);
  const created = await request(
    `/api/characters/new?locale=en&invite=${party.inviteToken}`,
    {
      method: 'POST',
      json: { draft },
      jar: player.jar,
      csrf: true,
    }
  );

  await expectStatus(created, 410);
  assert.equal(await characterCount(player.userId), 0);
});

type PoolView = {
  classlessEnabled: boolean;
  classes: Array<{
    lineageId: string;
    classId: number;
    group: string;
    enabled: boolean;
  }>;
  removed: unknown[];
};

test("the GM's pool panel switches classes and Classless, and invites follow it", async () => {
  const party = await gmParty();

  const initial = await request(
    `/api/parties/${party.id}/class-pool?locale=en`,
    { jar: party.jar }
  );
  await expectStatus(initial, 200);
  const view = (await initial.json()) as PoolView;
  assert.equal(view.classlessEnabled, true);
  assert.deepEqual(
    view.classes.filter((c) => c.enabled).map((c) => [c.classId, c.group]),
    [1, 2, 3, 4, 5, 6].map((id) => [id, 'book'])
  );

  const hermit = view.classes.find((c) => c.classId === 3)!;
  const switched = await request(
    `/api/parties/${party.id}/class-pool/lineages/${hermit.lineageId}?locale=en`,
    {
      method: 'PUT',
      json: { enabled: false },
      jar: party.jar,
      csrf: true,
    }
  );
  await expectStatus(switched, 200);
  assert.equal(
    ((await switched.json()) as PoolView).classes.find((c) => c.classId === 3)!
      .enabled,
    false
  );

  const classless = await request(
    `/api/parties/${party.id}/class-pool/classless?locale=en`,
    {
      method: 'PUT',
      json: { enabled: false },
      jar: party.jar,
      csrf: true,
    }
  );
  await expectStatus(classless, 200);
  assert.equal(((await classless.json()) as PoolView).classlessEnabled, false);

  const player = await anonymousSession();
  const offered = await request(
    `/api/characters/classes?locale=en&invite=${party.inviteToken}`,
    {
      jar: player.jar,
    }
  );
  await expectStatus(offered, 200);
  assert.deepEqual(
    ((await offered.json()) as Array<{ id: number }>).map((c) => c.id),
    [1, 2, 4, 5, 6]
  );
});

test("someone else's party pool is not found", async () => {
  const party = await gmParty();
  const stranger = await anonymousSession();

  const response = await request(
    `/api/parties/${party.id}/class-pool?locale=en`,
    { jar: stranger.jar }
  );

  await expectStatus(response, 404);
});

function customClassDraft(name: string) {
  const stat = { count: 3, faces: 6, modifier: 0, dropLowest: false };
  return {
    languages: ['en'],
    name: { en: name, pl: '' },
    description: { en: 'The mire keeps what you give it.', pl: '' },
    stats: {
      strength: stat,
      agility: stat,
      presence: { ...stat, count: 4, dropLowest: true },
      toughness: stat,
    },
    hpDie: 6,
    omenDie: 4,
    weaponDie: 8,
    armorDie: 2,
    silver: { count: 2, faces: 6, multiplier: 10 },
    origins: [{ en: 'A drowned village', pl: '' }],
    abilities: [
      {
        random: false,
        name: { en: 'Bone-Reader', pl: '' },
        text: { en: 'Ask a skull one question a day.', pl: '' },
        modifiers: [
          {
            statistic: 'presence',
            value: 2,
            exclude: [
              'melee',
              'ranged',
              'defence',
              'cast',
              'heal',
              'buff',
              'item',
            ],
          },
        ],
        grantItem: 'new:flail',
        grantPet: null,
        table: null,
      },
      {
        random: true,
        name: { en: 'Grave Sense', pl: '' },
        text: { en: 'Smell the dead.', pl: '' },
        modifiers: [],
        grantItem: null,
        grantPet: null,
        table: null,
      },
      {
        random: true,
        name: { en: 'Mire Walk', pl: '' },
        text: { en: 'Never sink.', pl: '' },
        modifiers: [],
        grantItem: null,
        grantPet: null,
        table: null,
      },
    ],
    randomAbilityCount: 1,
    items: [
      {
        ref: 'new:flail',
        type: 'weapon',
        name: { en: `Reliquary Flail ${name}`, pl: '' },
        description: { en: 'A chain of saint knuckles.', pl: '' },
        value: 30,
        weapon: {
          diceCount: 2,
          diceFaces: 4,
          damageModifier: 1,
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
  const testScvm = (await rolled.json()) as {
    origin: string;
    abilities: Array<{ name: string }>;
  };
  assert.equal(testScvm.origin, 'A drowned village');
  assert.equal(testScvm.abilities.length, 2);
  assert.equal(testScvm.abilities[0].name, 'Bone-Reader');
  assert.ok(JSON.stringify(testScvm).includes(`Reliquary Flail ${name}`));

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
  assert.equal(
    ((await clash.json()) as { code: string }).code,
    'CLASS_NAME_TAKEN'
  );

  const mine = await request('/api/classes/mine?locale=en', { jar: party.jar });
  await expectStatus(mine, 200);
  const list = (await mine.json()) as Array<{
    id: number;
    name: string;
    visibility: string;
  }>;
  assert.deepEqual(list[0], { ...list[0], id, name, visibility: 'private' });

  const pool = await request(`/api/parties/${party.id}/class-pool?locale=en`, {
    jar: party.jar,
  });
  const own = ((await pool.json()) as PoolView).classes.find(
    (c) => c.classId === id
  )!;
  assert.equal(own.group, 'mine');
  const enabled = await request(
    `/api/parties/${party.id}/class-pool/lineages/${own.lineageId}?locale=en`,
    {
      method: 'PUT',
      json: { enabled: true },
      jar: party.jar,
      csrf: true,
    }
  );
  await expectStatus(enabled, 200);

  const player = await anonymousSession();
  const offered = await request(
    `/api/characters/classes?locale=en&invite=${party.inviteToken}`,
    { jar: player.jar }
  );
  const offeredClasses = (await offered.json()) as Array<{
    id: number;
    name: string;
  }>;
  assert.equal(offeredClasses.find((c) => c.id === id)?.name, name);

  const draftResponse = await request(
    `/api/characters/draft?locale=en&invite=${party.inviteToken}`,
    {
      method: 'POST',
      json: { classId: id, seeds },
      jar: player.jar,
      csrf: true,
    }
  );
  await expectStatus(draftResponse, 200);
  const { draft, preview } = (await draftResponse.json()) as {
    draft: unknown;
    preview: { origin: string };
  };
  assert.equal(preview.origin, 'A drowned village');
  const created = await request(
    `/api/characters/new?locale=en&invite=${party.inviteToken}`,
    {
      method: 'POST',
      json: { draft },
      jar: player.jar,
      csrf: true,
    }
  );
  await expectStatus(created, 201);
  const scvm = (await created.json()) as { id: string; classId: number };
  assert.equal(scvm.classId, id);

  const edited = await request(`/api/classes/${id}`, {
    method: 'PUT',
    json: {
      draft: {
        ...customClassDraft(name),
        origins: [
          { en: 'The peat bog', pl: '' },
          { en: 'A gibbet', pl: '' },
        ],
      },
    },
    jar: party.jar,
    csrf: true,
  });
  await expectStatus(edited, 200);
  const latestId = ((await edited.json()) as { id: number }).id;
  assert.notEqual(latestId, id);
  const reloaded = await request(`/api/classes/${latestId}`, { jar: party.jar });
  const reloadedDraft = (
    (await reloaded.json()) as {
      draft: {
        origins: Array<{ en: string; key: string }>;
        abilities: Array<{
          key: string;
          random: boolean;
          modifiers: unknown[];
        }>;
        randomAbilityCount: number;
      };
    }
  ).draft;
  const origins = reloadedDraft.origins;
  assert.deepEqual(
    reloadedDraft.abilities.map((a) => [a.random, a.modifiers.length]),
    [
      [false, 1],
      [true, 0],
      [true, 0],
    ]
  );
  const reloadedItems = (
    reloadedDraft as unknown as {
      items: Array<{ ref: string; weapon: { diceCount: number } }>;
    }
  ).items;
  assert.equal(reloadedItems.length, 1);
  assert.match(reloadedItems[0].ref, /^weapons\.cc-\d+-\d+$/);
  assert.equal(reloadedItems[0].weapon.diceCount, 2);
  assert.equal(reloadedDraft.randomAbilityCount, 1);
  assert.deepEqual(
    origins.map((o) => o.en),
    ['The peat bog', 'A gibbet']
  );
  assert.ok(origins.every((o) => /^cc\.\d+\.origin\.\d+$/.test(o.key)));

  // The GM removed the origin this scvm rolled; the scvm keeps its text.
  const sheet = await request(`/api/characters/${scvm.id}?locale=en`, {
    jar: player.jar,
  });
  await expectStatus(sheet, 200);
  const sheetBody = (await sheet.json()) as {
    origin: string;
    abilities: Array<{ name: string; description: string }>;
    computedModifiers: Array<{
      source: string;
      statistic: string;
      value: number;
    }>;
  };
  assert.equal(sheetBody.origin, 'A drowned village');
  assert.equal(sheetBody.abilities.length, 2);
  assert.deepEqual(sheetBody.abilities[0], {
    ...sheetBody.abilities[0],
    name: 'Bone-Reader',
    description: 'Ask a skull one question a day.',
  });
  assert.ok(
    sheetBody.computedModifiers.some(
      (m) =>
        m.source === 'Bone-Reader' &&
        m.statistic === 'presence' &&
        m.value === 2
    )
  );
  // The fixed ability granted its Class Item, by its own name, with its dice.
  assert.ok(JSON.stringify(sheetBody).includes(`Reliquary Flail ${name}`));

  // Class Items stay out of item search.
  const search = await request(
    `/api/equipment/search?q=${encodeURIComponent(
      'Reliquary Flail'
    )}&locale=en`,
    { jar: party.jar }
  );
  await expectStatus(search, 200);
  assert.ok(!JSON.stringify(await search.json()).includes(name));
});

test('a moderator bans new class creation without blocking existing classes, then lifts the ban', async () => {
  const admin = await anonymousSession();
  const gm = await anonymousSession();
  await withDatabase(async (client) => {
    await client.query(
      'UPDATE "user" SET id = $2, name = $3, email = $4, "emailVerified" = true, "isAnonymous" = false WHERE id = $1',
      [admin.userId, 'integration-admin', 'Moderation admin', 'integration-admin@example.test']
    );
    await client.query(
      'UPDATE "user" SET name = $2, email = $3, "emailVerified" = true, "isAnonymous" = false WHERE id = $1',
      [gm.userId, 'Creation ban GM', `ban.${Date.now()}@example.test`]
    );
  });

  const draft = customClassDraft(`Ban test ${Date.now()}`);
  const existing = await request('/api/classes', { method: 'POST', json: { draft }, jar: gm.jar, csrf: true });
  await expectStatus(existing, 201);
  const saved = (await existing.json()) as { id: number; draft: unknown };
  const unfinished = await request('/api/classes/drafts', { method: 'POST', json: { classId: null, draft }, jar: gm.jar, csrf: true });
  await expectStatus(unfinished, 201);
  const draftId = ((await unfinished.json()) as { id: number }).id;

  const banned = await request(`/api/admin/creation-bans/${gm.userId}`, {
    method: 'POST', json: { reason: 'Repeated removals' }, jar: admin.jar, csrf: true,
  });
  await expectStatus(banned, 200);
  const own = await request('/api/classes/creation-ban', { jar: gm.jar });
  await expectStatus(own, 200);
  assert.deepEqual(await own.json(), { banned: true });
  const deniedHistory = await request(`/api/admin/creation-bans/${gm.userId}`, { jar: gm.jar });
  await expectStatus(deniedHistory, 404);

  const newDraft = await request('/api/classes/drafts', { method: 'POST', json: { classId: null, draft }, jar: gm.jar, csrf: true });
  await expectStatus(newDraft, 403);
  assert.equal(((await newDraft.json()) as { code: string }).code, 'CLASS_CREATION_BANNED');
  const newClass = await request('/api/classes', { method: 'POST', json: { draft: customClassDraft(`Blocked ${Date.now()}`) }, jar: gm.jar, csrf: true });
  await expectStatus(newClass, 403);
  assert.equal(((await newClass.json()) as { code: string }).code, 'CLASS_CREATION_BANNED');
  await expectStatus(await request(`/api/classes/drafts/${draftId}`, { method: 'PUT', json: { draft, revision: 1 }, jar: gm.jar, csrf: true }), 200);
  await expectStatus(await request(`/api/classes/${saved.id}`, { method: 'PUT', json: { draft: saved.draft }, jar: gm.jar, csrf: true }), 200);
  await expectStatus(await request(`/api/classes/${saved.id}/publish`, { method: 'POST', json: { confirmed: true }, jar: gm.jar, csrf: true }), 200);

  const inspected = await request(`/api/admin/creation-bans/${gm.userId}`, { jar: admin.jar });
  await expectStatus(inspected, 200);
  const history = (await inspected.json()) as { active: { reason: string }; history: Array<{ action: string; actorUserId: string; reason: string }> };
  assert.equal(history.active.reason, 'Repeated removals');
  assert.deepEqual(history.history.map((entry) => [entry.action, entry.actorUserId, entry.reason]), [
    ['class_creation_banned', 'integration-admin', 'Repeated removals'],
  ]);

  await expectStatus(await request(`/api/admin/creation-bans/${gm.userId}`, { method: 'DELETE', json: { reason: 'Appeal upheld' }, jar: admin.jar, csrf: true }), 200);
  const after = await request(`/api/admin/creation-bans/${gm.userId}`, { jar: admin.jar });
  await expectStatus(after, 200);
  assert.deepEqual(((await after.json()) as { history: Array<{ action: string }> }).history.map((entry) => entry.action), [
    'class_creation_unbanned', 'class_creation_banned',
  ]);
  const newAfterUnban = await request('/api/classes', { method: 'POST', json: { draft: customClassDraft(`Unbanned ${Date.now()}`) }, jar: gm.jar, csrf: true });
  await expectStatus(newAfterUnban, 201);

  const reportIds = await withDatabase(async (client) => {
    const ids: string[] = [];
    for (const explanation of ['Earlier report', 'Repeated report', 'New report']) {
      const result = await client.query(
        `INSERT INTO moderation_reports (class_id, reason, explanation, reporter_name, reporter_email, good_faith, updated_at)
         VALUES ($1, 'other', $2, 'Reporter', $3, true, NOW()) RETURNING id`,
        [saved.id, explanation, `${explanation.replaceAll(' ', '-')}@example.test`]
      );
      ids.push(result.rows[0].id as string);
    }
    return ids;
  });
  await expectStatus(await request(`/api/admin/reports/${reportIds[0]}/take-down`, { method: 'POST', json: { reason: 'Earlier violation', ground: 'abusive_or_hateful' }, jar: admin.jar, csrf: true }), 200);
  await expectStatus(await request(`/api/admin/reports/${reportIds[0]}/restore`, { method: 'POST', json: { reason: 'Appeal upheld' }, jar: admin.jar, csrf: true }), 200);
  await expectStatus(await request(`/api/admin/reports/${reportIds[1]}/take-down`, { method: 'POST', json: { reason: 'Repeated violation', ground: 'abusive_or_hateful' }, jar: admin.jar, csrf: true }), 200);
  await expectStatus(await request('/api/admin/reports', { jar: gm.jar }), 404);

  const queue = await request('/api/admin/reports', { jar: admin.jar });
  await expectStatus(queue, 200);
  const groups = (await queue.json()) as Array<{
    ownerUserId: string | null;
    removalHistory: Array<{ className: string; date: string; reason: string; restored: boolean }>;
    reports: Array<{ id: string }>;
  }>;
  const group = groups.find((entry) => entry.ownerUserId === gm.userId);
  assert.ok(group);
  assert.deepEqual(group.reports.map((report) => report.id), [reportIds[2]]);
  assert.equal(group.removalHistory.length, 2);
  assert.equal(group.removalHistory.find((entry) => entry.reason === 'Earlier violation')?.restored, true);
  assert.equal(group.removalHistory.find((entry) => entry.reason === 'Repeated violation')?.restored, false);
  assert.ok(group.removalHistory.every((entry) => entry.className && !Number.isNaN(Date.parse(entry.date))));
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
