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

test('guest session can create, list, fetch and delete character', async () => {
  const jar = new CookieJar();

  const sessionResponse = await request('/session/info', { jar });
  await expectStatus(sessionResponse, 200);
  assert.equal(jar.has('guest-session'), true);

  const sessionPayload = (await sessionResponse.json()) as {
    isGuest: boolean;
    isAuthenticated: boolean;
  };
  assert.equal(sessionPayload.isGuest, true);
  assert.equal(sessionPayload.isAuthenticated, false);

  const createResponse = await request('/characters/new', {
    method: 'POST',
    json: {},
    jar,
  });
  await expectStatus(createResponse, 201);
  const createdCharacter = (await createResponse.json()) as { id: string };
  assert.equal(typeof createdCharacter.id, 'string');

  const listResponse = await request('/characters', { jar });
  await expectStatus(listResponse, 200);
  const characters = (await listResponse.json()) as Array<{ id?: string }>;
  assert.equal(Array.isArray(characters), true);
  assert.equal(
    characters.some((character) => character.id === createdCharacter.id),
    true
  );

  const fetchResponse = await request(`/characters/${createdCharacter.id}`, { jar });
  await expectStatus(fetchResponse, 200);
  const fetchedCharacter = (await fetchResponse.json()) as { id: string };
  assert.equal(fetchedCharacter.id, createdCharacter.id);

  const deleteResponse = await request(`/characters/${createdCharacter.id}`, {
    method: 'DELETE',
    jar,
  });
  await expectStatus(deleteResponse, 204);

  const fetchAfterDeleteResponse = await request(`/characters/${createdCharacter.id}`, {
    jar,
  });
  await expectStatus(fetchAfterDeleteResponse, 404);
});
