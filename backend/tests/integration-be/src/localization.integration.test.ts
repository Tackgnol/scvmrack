import assert from 'node:assert/strict';
import test from 'node:test';

const baseUrl = process.env.E2E_BASE_URL ?? 'http://localhost:3000';

class CookieJar {
  readonly cookies = new Map<string, string>();
  capture(response: Response): void {
    const setCookies = typeof response.headers.getSetCookie === 'function'
      ? response.headers.getSetCookie() : [];
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
    return [...this.cookies.entries()].map(([k, v]) => `${k}=${v}`).join('; ');
  }
}

async function request(path: string, options: { method?: string; json?: unknown; headers?: Record<string, string>; jar?: CookieJar } = {}): Promise<Response> {
  const { method = 'GET', json, headers = {}, jar } = options;
  const requestHeaders: Record<string, string> = { ...headers };
  if (jar) { const h = jar.header(); if (h) requestHeaders.cookie = h; }
  let body: string | undefined;
  if (json !== undefined) { requestHeaders['content-type'] = 'application/json'; body = JSON.stringify(json); }
  const response = await fetch(new URL(path, baseUrl), { method, headers: requestHeaders, body });
  if (jar) jar.capture(response);
  return response;
}

async function fetchCsrfToken(jar: CookieJar): Promise<string> {
  const r = await request('/api/csrf-token', { jar });
  assert.equal(r.status, 200, 'CSRF token fetch should succeed');
  const { token } = (await r.json()) as { token: string };
  assert.equal(typeof token, 'string', 'CSRF token should be a string');
  return token;
}

async function bootstrapAnonymousSession(): Promise<CookieJar> {
  const jar = new CookieJar();
  const r = await request('/api/auth/sign-in/anonymous', { method: 'POST', json: {}, jar });
  assert.equal(r.status, 200, 'anonymous sign-in should succeed');
  return jar;
}

async function createCharacterWithClass(jar: CookieJar, classId: number): Promise<string> {
  const csrf = await fetchCsrfToken(jar);
  const r = await request('/api/characters/new', { method: 'POST', json: { classId }, headers: { 'x-csrf-token': csrf }, jar });
  assert.equal(r.status, 201, 'character creation should succeed');
  const { id } = (await r.json()) as { id: string };
  return id;
}

// ── Localization: GET /api/characters/:id?locale= ─────────────────────────────

test('GET /api/characters/:id?locale=en returns English className', async () => {
  const jar = await bootstrapAnonymousSession();
  const id = await createCharacterWithClass(jar, 1);

  const response = await request(`/api/characters/${id}?locale=en`, { jar });
  assert.equal(response.status, 200, 'fetch with locale=en should succeed');

  const enCharacter = (await response.json()) as { id: string; classId: number; className: string };
  assert.equal(enCharacter.classId, 1, 'classId should be 1');
  assert.equal(typeof enCharacter.className, 'string', 'className should be a string');
  assert.ok(enCharacter.className.length > 0, 'className should be non-empty');
  assert.equal(
    enCharacter.className,
    'Fanged Deserter',
    'className for classId 1 with locale=en should be "Fanged Deserter" (seed data)'
  );
});

test('GET /api/characters/:id?locale=pl returns Polish className', async () => {
  const jar = await bootstrapAnonymousSession();
  const id = await createCharacterWithClass(jar, 1);

  const enResponse = await request(`/api/characters/${id}?locale=en`, { jar });
  assert.equal(enResponse.status, 200, 'fetch with locale=en should succeed');
  const enCharacter = (await enResponse.json()) as { classId: number; className: string };
  assert.equal(enCharacter.classId, 1, 'classId should be 1 for en response');
  assert.ok(enCharacter.className.length > 0, 'en className should be non-empty');

  const plResponse = await request(`/api/characters/${id}?locale=pl`, { jar });
  assert.equal(plResponse.status, 200, 'fetch with locale=pl should succeed');
  const plCharacter = (await plResponse.json()) as { classId: number; className: string };
  assert.equal(plCharacter.classId, 1, 'classId should be 1 for pl response');
  assert.ok(plCharacter.className.length > 0, 'pl className should be non-empty');

  assert.notEqual(
    plCharacter.className,
    enCharacter.className,
    'Polish className should differ from English className for the same character'
  );
});

// ── Localization: GET /api/characters via Accept-Language header ──────────────

test('GET /api/characters returns localized className via Accept-Language header', async () => {
  const jar = await bootstrapAnonymousSession();
  const id = await createCharacterWithClass(jar, 1);

  const plListResponse = await request('/api/characters', {
    headers: { 'accept-language': 'pl' },
    jar,
  });
  assert.equal(plListResponse.status, 200, 'list with Accept-Language: pl should succeed');
  const plList = (await plListResponse.json()) as Array<{ id: string; classId: number; className: string }>;
  assert.ok(Array.isArray(plList), 'pl list response should be an array');
  const plCharacter = plList.find((c) => c.id === id);
  assert.ok(plCharacter !== undefined, 'created character should appear in pl list');
  assert.ok(plCharacter.className.length > 0, 'pl className should be non-empty');

  const enListResponse = await request('/api/characters', {
    headers: { 'accept-language': 'en' },
    jar,
  });
  assert.equal(enListResponse.status, 200, 'list with Accept-Language: en should succeed');
  const enList = (await enListResponse.json()) as Array<{ id: string; classId: number; className: string }>;
  assert.ok(Array.isArray(enList), 'en list response should be an array');
  const enCharacter = enList.find((c) => c.id === id);
  assert.ok(enCharacter !== undefined, 'created character should appear in en list');
  assert.ok(enCharacter.className.length > 0, 'en className should be non-empty');

  assert.notEqual(
    plCharacter.className,
    enCharacter.className,
    'Polish className from list should differ from English className for the same character'
  );
});
