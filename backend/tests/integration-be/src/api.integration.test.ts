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

test('GET /health returns service status', async () => {
  const response = await request('/health');
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
  await expectStatus(fetchAfterDeleteResponse, 404);
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
  await expectStatus(secondDeleteResponse, 404);
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
  await expectStatus(patchResponse, 400);
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

// ── Ownership enforcement ─────────────────────────────────────────────────────

test('GET /api/characters/:id returns 403 for a character owned by a different session', async () => {
  const ownerJar = await bootstrapAnonymousSession();
  const id = await createCharacter(ownerJar);

  // Different session — no access
  const otherJar = await bootstrapAnonymousSession();
  const getResponse = await request(`/api/characters/${id}`, { jar: otherJar });
  await expectStatus(getResponse, 403);
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
  await expectStatus(patchResponse, 403);
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
  await expectStatus(deleteResponse, 403);
});

test('GET /api/characters/:id returns 401 with no session', async () => {
  const ownerJar = await bootstrapAnonymousSession();
  const id = await createCharacter(ownerJar);

  const response = await request(`/api/characters/${id}`); // no jar
  await expectStatus(response, 401);
});

// ── Input validation ──────────────────────────────────────────────────────────

test('GET /api/characters/:id returns 400 for a non-UUID id', async () => {
  const jar = await bootstrapAnonymousSession();
  const response = await request('/api/characters/not-a-valid-uuid', { jar });
  await expectStatus(response, 400);
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
  await expectStatus(response, 400);
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
  await expectStatus(response, 400);
});
