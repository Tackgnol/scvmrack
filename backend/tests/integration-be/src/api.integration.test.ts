import assert from 'node:assert/strict';
import test from 'node:test';

const baseUrl = process.env.E2E_BASE_URL ?? 'http://localhost:3000';

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

  has(name: string): boolean {
    return this.cookies.has(name);
  }
}

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

async function fetchCsrfToken(jar: CookieJar): Promise<string> {
  const response = await request('/api/csrf-token', { jar });
  assert.equal(response.status, 200, 'CSRF token fetch should succeed');
  const { token } = (await response.json()) as { token: string };
  assert.equal(typeof token, 'string');
  return token;
}

async function expectStatus(response: Response, expectedStatus: number): Promise<void> {
  if (response.status === expectedStatus) return;
  const payload = await response.text();
  assert.fail(
    `${response.url} returned ${response.status}, expected ${expectedStatus}. Payload: ${payload}`
  );
}

type ApiErrorPayload = {
  error?: string;
  message?: string;
  code?: string;
  statusCode?: number;
  requestId?: string;
  details?: Array<{ field?: string; message?: string; code?: string }>;
};

type AbilityStat = 'strength' | 'agility' | 'presence' | 'toughness';

type RollValue = {
  source: 'server' | 'table';
  dice?: number[];
  total: number;
};

type ImprovementAbilityRoll = {
  roll: RollValue;
  fromScore: number;
  fromModifier: number;
  toModifier: number;
  toScore: number;
  outcome: 'increase' | 'decrease' | 'same';
};

type ImprovementDraft = {
  sequence: number;
  snapshot: {
    characterUpdatedAt: string;
    maxHp: number;
    silver: number;
    abilities: Record<AbilityStat, number>;
    abilityKeys: string[];
    equipmentFingerprint: string;
    snapshotHash: string;
  };
  hp: {
    check: RollValue;
    fromMaxHp: number;
    succeeds: boolean;
    increase: RollValue | null;
    toMaxHp: number;
  };
  debris:
    | { roll: RollValue; kind: 'nothing' }
    | { roll: RollValue; kind: 'silver'; silver: RollValue; amount: number }
    | { roll: RollValue; kind: 'uncleanScroll'; scroll: RollValue; itemKey: string }
    | { roll: RollValue; kind: 'sacredScroll'; scroll: RollValue; itemKey: string };
  abilities: Record<AbilityStat, ImprovementAbilityRoll>;
  scumSpecialties:
    | { kind: 'notScum' }
    | {
        kind: 'firstImprovement';
        existing: { key: string; rollValue: number };
        added: { key: string; rollValue: number; roll: RollValue };
      }
    | {
        kind: 'laterImprovement';
        primary: { key: string; rollValue: number };
        secondary: { key: string; rollValue: number };
        rerollMode: 'none' | 'primary' | 'secondary' | 'both';
      };
};

type ImprovementPreview = {
  id: string;
  characterId: string;
  sequence: number;
  rolledDraft: ImprovementDraft;
  snapshotHash: string;
  createdAt: string;
  updatedAt: string;
};

type CharacterPayload = {
  id: string;
  maxHp: number;
  silver: number;
  strength: number;
  agility: number;
  presence: number;
  toughness: number;
};

const abilityStats: AbilityStat[] = ['strength', 'agility', 'presence', 'toughness'];

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
  const requestId = payload.requestId;
  assert.ok(typeof requestId === 'string');
  assert.ok(requestId.length > 0);
  assert.equal(payload.error, payload.message);
  if (expectedMessage) {
    assert.equal(payload.message, expectedMessage);
  } else {
    const message = payload.message;
    assert.ok(typeof message === 'string');
    assert.ok(message.length > 0);
  }

  return payload;
}

test('GET /health returns service status', async () => {
  const response = await request('/health');
  await expectStatus(response, 200);

  const payload = (await response.json()) as { status: string; timestamp: string };
  assert.equal(payload.status, 'ok');
  assert.equal(typeof payload.timestamp, 'string');
  assert.ok(!Number.isNaN(Date.parse(payload.timestamp)));
});

test('GET /api/health returns service status for proxied checks', async () => {
  const response = await request('/api/health');
  await expectStatus(response, 200);

  const payload = (await response.json()) as { status: string; timestamp: string };
  assert.equal(payload.status, 'ok');
  assert.equal(typeof payload.timestamp, 'string');
  assert.ok(!Number.isNaN(Date.parse(payload.timestamp)));
});

test('CSRF protection rejects state-changing requests without token', async () => {
  const jar = new CookieJar();

  // Bootstrap an anonymous session
  const anonResponse = await request('/api/auth/sign-in/anonymous', {
    method: 'POST',
    json: {},
    jar,
  });
  await expectStatus(anonResponse, 200);

  // POST without CSRF token should be rejected
  const noTokenResponse = await request('/api/characters/new', {
    method: 'POST',
    json: {},
    jar,
  });
  await expectStatus(noTokenResponse, 403);

  // POST with invalid CSRF token should be rejected
  const badTokenResponse = await request('/api/characters/new', {
    method: 'POST',
    json: {},
    headers: { 'x-csrf-token': 'completely-bogus-token' },
    jar,
  });
  await expectStatus(badTokenResponse, 403);

  // POST with valid CSRF token should succeed
  const csrfToken = await fetchCsrfToken(jar);
  const goodResponse = await request('/api/characters/new', {
    method: 'POST',
    json: {},
    headers: { 'x-csrf-token': csrfToken },
    jar,
  });
  await expectStatus(goodResponse, 201);
});

test('anonymous session can create, list, fetch and delete character', async () => {
  const jar = new CookieJar();

  // Bootstrap an anonymous session via Better Auth
  const anonResponse = await request('/api/auth/sign-in/anonymous', {
    method: 'POST',
    json: {},
    jar,
  });
  await expectStatus(anonResponse, 200);

  // Fetch a CSRF token
  const csrfToken = await fetchCsrfToken(jar);

  // Create a character
  const createResponse = await request('/api/characters/new', {
    method: 'POST',
    json: {},
    headers: { 'x-csrf-token': csrfToken },
    jar,
  });
  await expectStatus(createResponse, 201);
  const createdCharacter = (await createResponse.json()) as { id: string };
  assert.equal(typeof createdCharacter.id, 'string');

  // List characters
  const listResponse = await request('/api/characters', { jar });
  await expectStatus(listResponse, 200);
  const characters = (await listResponse.json()) as Array<{ id?: string }>;
  assert.equal(Array.isArray(characters), true);
  assert.equal(
    characters.some((character) => character.id === createdCharacter.id),
    true
  );

  // Fetch character
  const fetchResponse = await request(`/api/characters/${createdCharacter.id}`, { jar });
  await expectStatus(fetchResponse, 200);
  const fetchedCharacter = (await fetchResponse.json()) as { id: string };
  assert.equal(fetchedCharacter.id, createdCharacter.id);

  // Fetch a fresh CSRF token before delete
  const csrfToken2 = await fetchCsrfToken(jar);

  // Delete character
  const deleteResponse = await request(`/api/characters/${createdCharacter.id}`, {
    method: 'DELETE',
    headers: { 'x-csrf-token': csrfToken2 },
    jar,
  });
  await expectStatus(deleteResponse, 204);

  // Verify deleted
  const fetchAfterDeleteResponse = await request(`/api/characters/${createdCharacter.id}`, {
    jar,
  });
  await expectApiError(
    fetchAfterDeleteResponse,
    404,
    'CHARACTER_NOT_FOUND',
    'Character not found'
  );
});

test('DELETE /api/characters/:id returns 404 when the same character is deleted twice', async () => {
  const jar = await bootstrapAnonymousSession();
  const id = await createCharacter(jar);
  const csrf = await fetchCsrfToken(jar);

  const firstDeleteResponse = await request(`/api/characters/${id}`, {
    method: 'DELETE',
    headers: { 'x-csrf-token': csrf },
    jar,
  });
  await expectStatus(firstDeleteResponse, 204);

  const secondCsrf = await fetchCsrfToken(jar);
  const secondDeleteResponse = await request(`/api/characters/${id}`, {
    method: 'DELETE',
    headers: { 'x-csrf-token': secondCsrf },
    jar,
  });
  await expectApiError(
    secondDeleteResponse,
    404,
    'CHARACTER_NOT_FOUND',
    'Character not found'
  );
});

// ── Helpers used by tests below ───────────────────────────────────────────────

async function bootstrapAnonymousSession(): Promise<CookieJar> {
  const jar = new CookieJar();
  const response = await request('/api/auth/sign-in/anonymous', { method: 'POST', json: {}, jar });
  assert.equal(response.status, 200, 'anonymous sign-in should succeed');
  return jar;
}

async function createCharacter(jar: CookieJar): Promise<string> {
  const csrf = await fetchCsrfToken(jar);
  const response = await request('/api/characters/new', {
    method: 'POST',
    json: {},
    headers: { 'x-csrf-token': csrf },
    jar,
  });
  assert.equal(response.status, 201, 'character creation should succeed');
  const { id } = (await response.json()) as { id: string };
  assert.equal(typeof id, 'string');
  return id;
}

async function createCharacterWithBody(
  jar: CookieJar,
  body: Record<string, unknown>
): Promise<string> {
  const csrf = await fetchCsrfToken(jar);
  const response = await request('/api/characters/new', {
    method: 'POST',
    json: body,
    headers: { 'x-csrf-token': csrf },
    jar,
  });
  assert.equal(response.status, 201, 'character creation should succeed');
  const { id } = (await response.json()) as { id: string };
  assert.equal(typeof id, 'string');
  return id;
}

function tableRoll(total: number): RollValue {
  return { source: 'table', total };
}

function scoreToModifier(score: number): number {
  if (score <= 4) return -3;
  if (score <= 6) return -2;
  if (score <= 8) return -1;
  if (score <= 12) return 0;
  if (score <= 14) return 1;
  if (score <= 16) return 2;
  if (score <= 18) return 3;
  if (score === 19) return 4;
  if (score === 20) return 5;
  return 6;
}

function modifierToCanonicalScore(modifier: number): number {
  switch (modifier) {
    case -3:
      return 4;
    case -2:
      return 5;
    case -1:
      return 7;
    case 0:
      return 9;
    case 1:
      return 13;
    case 2:
      return 15;
    case 3:
      return 17;
    case 4:
      return 19;
    case 5:
      return 20;
    default:
      return 21;
  }
}

function tableAbilityImprovement(fromScore: number): ImprovementAbilityRoll {
  const roll = tableRoll(6);
  const fromModifier = scoreToModifier(fromScore);
  const toModifier = Math.min(6, fromModifier + 1);
  const toScore = modifierToCanonicalScore(toModifier);

  return {
    roll,
    fromScore,
    fromModifier,
    toModifier,
    toScore,
    outcome: toModifier > fromModifier ? 'increase' : 'same',
  };
}

function buildTableEditedImprovement(preview: ImprovementPreview): {
  draft: ImprovementDraft;
  expected: {
    maxHp: number;
    silver: number;
    abilities: Record<AbilityStat, number>;
  };
} {
  const snapshot = preview.rolledDraft.snapshot;
  const abilities = Object.fromEntries(
    abilityStats.map((stat) => [stat, tableAbilityImprovement(snapshot.abilities[stat])])
  ) as Record<AbilityStat, ImprovementAbilityRoll>;
  const expectedAbilities = Object.fromEntries(
    abilityStats.map((stat) => [stat, abilities[stat].toScore])
  ) as Record<AbilityStat, number>;

  return {
    draft: {
      ...preview.rolledDraft,
      hp: {
        check: tableRoll(snapshot.maxHp),
        fromMaxHp: snapshot.maxHp,
        succeeds: true,
        increase: tableRoll(1),
        toMaxHp: snapshot.maxHp + 1,
      },
      debris: {
        roll: tableRoll(4),
        kind: 'silver',
        silver: tableRoll(3),
        amount: 3,
      },
      abilities,
      scumSpecialties: { kind: 'notScum' },
    },
    expected: {
      maxHp: snapshot.maxHp + 1,
      silver: snapshot.silver + 3,
      abilities: expectedAbilities,
    },
  };
}

// ── PATCH /api/characters/:id ─────────────────────────────────────────────────────

test('PATCH /api/characters/:id updates character fields and returns updated character', async () => {
  const jar = await bootstrapAnonymousSession();
  const id = await createCharacter(jar);
  const csrf = await fetchCsrfToken(jar);

  const patchResponse = await request(`/api/characters/${id}`, {
    method: 'PATCH',
    json: { name: 'Grimdark Hero' },
    headers: { 'x-csrf-token': csrf },
    jar,
  });
  await expectStatus(patchResponse, 200);

  const updated = (await patchResponse.json()) as { id: string; name?: string };
  assert.equal(updated.id, id);
  assert.equal(updated.name, 'Grimdark Hero');
});

test('PATCH /api/characters/:id with empty body returns 400', async () => {
  const jar = await bootstrapAnonymousSession();
  const id = await createCharacter(jar);
  const csrf = await fetchCsrfToken(jar);

  const patchResponse = await request(`/api/characters/${id}`, {
    method: 'PATCH',
    json: {},
    headers: { 'x-csrf-token': csrf },
    jar,
  });
  await expectApiError(
    patchResponse,
    400,
    'EMPTY_CHARACTER_UPDATE',
    'No valid fields to update'
  );
});

test('PATCH /api/characters/:id requires CSRF token', async () => {
  const jar = await bootstrapAnonymousSession();
  const id = await createCharacter(jar);

  const patchResponse = await request(`/api/characters/${id}`, {
    method: 'PATCH',
    json: { name: 'Should Fail' },
    jar,
  });
  await expectStatus(patchResponse, 403);
});

test('POST /api/characters/:id/improvements/:improvementId/apply applies a full table-edited improvement', async () => {
  const jar = await bootstrapAnonymousSession();
  const id = await createCharacterWithBody(jar, { classId: 1 });

  const previewCsrf = await fetchCsrfToken(jar);
  const previewResponse = await request(`/api/characters/${id}/improvements/preview`, {
    method: 'POST',
    headers: { 'x-csrf-token': previewCsrf },
    jar,
  });
  await expectStatus(previewResponse, 200);

  const preview = (await previewResponse.json()) as ImprovementPreview;
  assert.equal(preview.characterId, id);
  assert.equal(preview.sequence, 1);
  assert.equal(preview.rolledDraft.scumSpecialties.kind, 'notScum');

  const reopenCsrf = await fetchCsrfToken(jar);
  const reopenResponse = await request(`/api/characters/${id}/improvements/preview`, {
    method: 'POST',
    headers: { 'x-csrf-token': reopenCsrf },
    jar,
  });
  await expectStatus(reopenResponse, 200);

  const reopenedPreview = (await reopenResponse.json()) as ImprovementPreview;
  assert.equal(reopenedPreview.id, preview.id);
  assert.deepEqual(reopenedPreview.rolledDraft, preview.rolledDraft);

  const { draft, expected } = buildTableEditedImprovement(preview);
  const applyCsrf = await fetchCsrfToken(jar);
  const applyResponse = await request(
    `/api/characters/${id}/improvements/${preview.id}/apply?locale=en`,
    {
      method: 'POST',
      json: { draft },
      headers: { 'x-csrf-token': applyCsrf },
      jar,
    }
  );
  await expectStatus(applyResponse, 200);

  const applied = (await applyResponse.json()) as CharacterPayload;
  assert.equal(applied.id, id);
  assert.equal(applied.maxHp, expected.maxHp);
  assert.equal(applied.silver, expected.silver);
  for (const stat of abilityStats) {
    assert.equal(applied[stat], expected.abilities[stat], `${stat} should be applied`);
  }

  const fetchResponse = await request(`/api/characters/${id}`, { jar });
  await expectStatus(fetchResponse, 200);
  const persisted = (await fetchResponse.json()) as CharacterPayload;
  assert.equal(persisted.maxHp, expected.maxHp);
  assert.equal(persisted.silver, expected.silver);
  for (const stat of abilityStats) {
    assert.equal(persisted[stat], expected.abilities[stat], `${stat} should persist`);
  }

  const nextPreviewCsrf = await fetchCsrfToken(jar);
  const nextPreviewResponse = await request(`/api/characters/${id}/improvements/preview`, {
    method: 'POST',
    headers: { 'x-csrf-token': nextPreviewCsrf },
    jar,
  });
  await expectStatus(nextPreviewResponse, 200);

  const nextPreview = (await nextPreviewResponse.json()) as ImprovementPreview;
  assert.equal(nextPreview.sequence, 2);
  assert.equal(nextPreview.rolledDraft.snapshot.maxHp, expected.maxHp);
  assert.equal(nextPreview.rolledDraft.snapshot.silver, expected.silver);
  for (const stat of abilityStats) {
    assert.equal(nextPreview.rolledDraft.snapshot.abilities[stat], expected.abilities[stat]);
  }
});

// ── Ownership enforcement ─────────────────────────────────────────────────────

test('GET /api/characters/:id returns 403 for a character owned by a different session', async () => {
  const ownerJar = await bootstrapAnonymousSession();
  const id = await createCharacter(ownerJar);

  // Different session — no access
  const otherJar = await bootstrapAnonymousSession();
  const getResponse = await request(`/api/characters/${id}`, { jar: otherJar });
  await expectApiError(
    getResponse,
    403,
    'CHARACTER_ACCESS_DENIED',
    "You don't have access to this scvm"
  );
});

test('PATCH /api/characters/:id returns 403 for a character owned by a different session', async () => {
  const ownerJar = await bootstrapAnonymousSession();
  const id = await createCharacter(ownerJar);

  const otherJar = await bootstrapAnonymousSession();
  const csrf = await fetchCsrfToken(otherJar);
  const patchResponse = await request(`/api/characters/${id}`, {
    method: 'PATCH',
    json: { name: 'Stolen' },
    headers: { 'x-csrf-token': csrf },
    jar: otherJar,
  });
  await expectApiError(
    patchResponse,
    403,
    'CHARACTER_ACCESS_DENIED',
    "You don't have access to this scvm"
  );
});

test('DELETE /api/characters/:id returns 403 for a character owned by a different session', async () => {
  const ownerJar = await bootstrapAnonymousSession();
  const id = await createCharacter(ownerJar);

  const otherJar = await bootstrapAnonymousSession();
  const csrf = await fetchCsrfToken(otherJar);
  const deleteResponse = await request(`/api/characters/${id}`, {
    method: 'DELETE',
    headers: { 'x-csrf-token': csrf },
    jar: otherJar,
  });
  await expectApiError(
    deleteResponse,
    403,
    'CHARACTER_ACCESS_DENIED',
    "You don't have access to this scvm"
  );
});

test('GET /api/characters/:id returns 401 with no session', async () => {
  const ownerJar = await bootstrapAnonymousSession();
  const id = await createCharacter(ownerJar);

  const response = await request(`/api/characters/${id}`); // no jar
  await expectApiError(response, 401, 'SESSION_REQUIRED', 'Session required');
});

// ── Input validation ──────────────────────────────────────────────────────────

test('GET /api/characters/:id returns 400 for a non-UUID id', async () => {
  const jar = await bootstrapAnonymousSession();
  const response = await request('/api/characters/not-a-valid-uuid', { jar });
  const payload = await expectApiError(response, 400, 'VALIDATION_ERROR');
  assert.ok(payload.details?.some((detail) => detail.field === 'id'));
});

test('PATCH /api/characters/:id returns 400 for a non-UUID id', async () => {
  const jar = await bootstrapAnonymousSession();
  const csrf = await fetchCsrfToken(jar);
  const response = await request('/api/characters/not-a-valid-uuid', {
    method: 'PATCH',
    json: { name: 'x' },
    headers: { 'x-csrf-token': csrf },
    jar,
  });
  const payload = await expectApiError(response, 400, 'VALIDATION_ERROR');
  assert.ok(payload.details?.some((detail) => detail.field === 'id'));
});

// ── GET /api/characters/count ─────────────────────────────────────────────────────

test('GET /api/characters/count returns a numeric total (public endpoint)', async () => {
  const beforeResponse = await request('/api/characters/count');
  await expectStatus(beforeResponse, 200);
  const beforePayload = (await beforeResponse.json()) as { total: number };
  assert.equal(typeof beforePayload.total, 'number');

  const jar = await bootstrapAnonymousSession();
  const id = await createCharacter(jar);

  const afterCreateResponse = await request('/api/characters/count');
  await expectStatus(afterCreateResponse, 200);
  const afterCreatePayload = (await afterCreateResponse.json()) as { total: number };
  assert.equal(typeof afterCreatePayload.total, 'number');
  assert.ok(
    afterCreatePayload.total > beforePayload.total,
    `expected public character count to increase after creating ${id}`
  );

  const csrf = await fetchCsrfToken(jar);
  const deleteResponse = await request(`/api/characters/${id}`, {
    method: 'DELETE',
    headers: { 'x-csrf-token': csrf },
    jar,
  });
  await expectStatus(deleteResponse, 204);
});

// ── GET /api/equipment/search ─────────────────────────────────────────────────────

test('GET /api/equipment/search returns an array of matching items', async () => {
  const response = await request('/api/equipment/search?q=sword');
  await expectStatus(response, 200);
  const items = (await response.json()) as Array<{ name?: string; key?: string }>;
  assert.equal(Array.isArray(items), true);
  assert.ok(items.length > 0, 'expected sword query to return at least one item');
  assert.ok(
    items.some((item) => {
      const haystack = `${item.name ?? ''} ${item.key ?? ''}`.toLowerCase();
      return haystack.includes('sword');
    }),
    'expected at least one search result to match the sword query'
  );
});

test('GET /api/equipment/search result items have expected shape', async () => {
  const response = await request('/api/equipment/search?q=a&limit=5');
  await expectStatus(response, 200);
  const items = (await response.json()) as Array<{
    itemType: string;
    id: number;
    key: string;
    name: string;
  }>;
  assert.equal(Array.isArray(items), true);
  for (const item of items) {
    assert.ok(['weapon', 'armor', 'equipment', 'pet'].includes(item.itemType), `unexpected itemType: ${item.itemType}`);
    assert.equal(typeof item.id, 'number');
    assert.equal(typeof item.key, 'string');
    assert.equal(typeof item.name, 'string');
  }
});

test('GET /api/equipment/search returns 400 when q param is missing', async () => {
  const response = await request('/api/equipment/search');
  const payload = await expectApiError(response, 400, 'VALIDATION_ERROR');
  assert.ok(payload.details?.some((detail) => detail.field === 'q'));
});

test('GET /api/equipment/search returns 400 when q param is blank', async () => {
  const response = await request('/api/equipment/search?q=%20%20');
  await expectApiError(
    response,
    400,
    'EMPTY_SEARCH_QUERY',
    'Search query is required'
  );
});

// ── Character generation shape invariants ─────────────────────────────────────

test('POST /api/characters/new returns a fully-shaped character', async () => {
  const jar = await bootstrapAnonymousSession();
  const csrf = await fetchCsrfToken(jar);

  const response = await request('/api/characters/new', {
    method: 'POST',
    json: {},
    headers: { 'x-csrf-token': csrf },
    jar,
  });
  await expectStatus(response, 201);

  const char = (await response.json()) as Record<string, unknown>;

  assert.equal(typeof char.id, 'string', 'id should be a string (UUID)');
  assert.ok((char.id as string).length > 0, 'id should be non-empty');
  assert.match(
    char.id as string,
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    'id should be a valid UUID'
  );

  assert.equal(typeof char.name, 'string', 'name should be a string');
  assert.ok((char.name as string).length > 0, 'name should be non-empty');

  for (const stat of ['strength', 'agility', 'presence', 'toughness'] as const) {
    assert.ok(Number.isInteger(char[stat] as number), `${stat} should be an integer`);
  }

  assert.ok(Number.isInteger(char.currentHp as number), 'currentHp should be an integer');
  assert.ok((char.currentHp as number) >= 1, 'currentHp should be >= 1');

  assert.ok(Number.isInteger(char.maxHp as number), 'maxHp should be an integer');
  assert.ok((char.maxHp as number) >= 1, 'maxHp should be >= 1');

  assert.ok(Number.isInteger(char.omens as number), 'omens should be an integer');
  assert.ok((char.omens as number) >= 0, 'omens should be >= 0');

  assert.ok(Number.isInteger(char.maxOmens as number), 'maxOmens should be an integer');
  assert.ok((char.maxOmens as number) >= 0, 'maxOmens should be >= 0');

  assert.ok(Number.isInteger(char.silver as number), 'silver should be an integer');
  assert.ok((char.silver as number) >= 0, 'silver should be >= 0');

  assert.ok(Array.isArray(char.abilities), 'abilities should be an array');
  assert.ok(Array.isArray(char.equipment), 'equipment should be an array');
  assert.ok(Array.isArray(char.storage), 'storage should be an array');
  assert.ok(Array.isArray(char.equippedWeapons), 'equippedWeapons should be an array');

  assert.ok(Number.isInteger(char.encumbrance as number), 'encumbrance should be an integer');
  assert.ok(Number.isInteger(char.maxEncumbrance as number), 'maxEncumbrance should be an integer');

  assert.equal(typeof char.createdAt, 'string', 'createdAt should be a string');
  assert.ok(
    !Number.isNaN(Date.parse(char.createdAt as string)),
    'createdAt should parse as a valid date'
  );
});

test('POST /api/characters/new with explicit classId returns a character bound to that class', async () => {
  const jar = await bootstrapAnonymousSession();
  const csrf = await fetchCsrfToken(jar);

  const response = await request('/api/characters/new', {
    method: 'POST',
    json: { classId: 1 },
    headers: { 'x-csrf-token': csrf },
    jar,
  });
  await expectStatus(response, 201);

  const char = (await response.json()) as Record<string, unknown>;

  assert.equal(char.classId, 1, 'classId should equal the requested classId (1)');
  // classId 1 is "Fanged Deserter" in the seed data
  assert.equal(
    typeof char.className,
    'string',
    'className should be a string (classId 1 = "Fanged Deserter" in seed data)'
  );
  assert.ok((char.className as string).length > 0, 'className should be non-empty');
});

test('POST /api/characters/new — inventory items with use_effect have boolean uses arrays', async () => {
  const jar = await bootstrapAnonymousSession();
  const csrf = await fetchCsrfToken(jar);

  const response = await request('/api/characters/new', {
    method: 'POST',
    json: {},
    headers: { 'x-csrf-token': csrf },
    jar,
  });
  await expectStatus(response, 201);

  const char = (await response.json()) as {
    equipment: Array<Record<string, unknown>>;
    storage: Array<Record<string, unknown>>;
  };

  const allItems = [...char.equipment, ...char.storage];

  for (const item of allItems) {
    if (!Object.prototype.hasOwnProperty.call(item, 'uses')) continue;
    assert.ok(
      Array.isArray(item.uses),
      `item.uses should be an array, got ${typeof item.uses} for item: ${JSON.stringify(item)}`
    );
    for (const use of item.uses as unknown[]) {
      assert.equal(
        typeof use,
        'boolean',
        `each element of item.uses should be boolean, got ${typeof use} for item: ${JSON.stringify(item)}`
      );
    }
  }
});

// ── GET /api/equipment/:itemType/:id ──────────────────────────────────────────

test('GET /api/equipment/:itemType/:id returns a full item for each valid type', async () => {
  const searchResponse = await request('/api/equipment/search?q=a&limit=4');
  await expectStatus(searchResponse, 200);
  const searchItems = (await searchResponse.json()) as Array<{
    itemType: 'weapon' | 'armor' | 'equipment' | 'pet';
    id: number;
    key: string;
    name: string;
  }>;

  // Build a map of itemType -> first seen id (search may not return all four types)
  const byType = new Map<string, number>();
  for (const item of searchItems) {
    if (!byType.has(item.itemType)) {
      byType.set(item.itemType, item.id);
    }
  }

  for (const [itemType, id] of byType.entries()) {
    const response = await request(`/api/equipment/${itemType}/${id}`);
    await expectStatus(response, 200);
    const body = (await response.json()) as Record<string, unknown>;
    assert.equal(typeof body.key, 'string', `${itemType}/${id}: key should be a string`);
    assert.ok((body.key as string).length > 0, `${itemType}/${id}: key should be non-empty`);
    assert.equal(typeof body.id, 'number', `${itemType}/${id}: id should be a number`);
    assert.equal(body.id, id, `${itemType}/${id}: id in response should match requested id`);
  }
});

test('GET /api/equipment/:itemType/:id returns 404 for a non-existent id', async () => {
  const response = await request('/api/equipment/weapon/999999');
  await expectApiError(response, 404, 'ITEM_NOT_FOUND');
});

test('GET /api/equipment/:itemType/:id returns 400 for invalid itemType', async () => {
  const response = await request('/api/equipment/potion/1');
  await expectApiError(response, 400, 'VALIDATION_ERROR');
});
