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

  if (json !== undefined) {
    requestHeaders['content-type'] = 'application/json';
  }

  const response = await fetch(new URL(path, baseUrl), {
    method,
    headers: requestHeaders,
    body: json !== undefined ? JSON.stringify(json) : undefined,
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

test('GET /test/users returns 404 when test routes are disabled', async () => {
  const response = await request('/test/users');
  assert.equal(
    response.status,
    404,
    `/test/users should return 404 in production, got ${response.status}`
  );
});

test('POST /test/users returns 404 when test routes are disabled', async () => {
  const jar = new CookieJar();
  const csrf = await fetchCsrfToken(jar);
  const response = await request('/test/users', {
    method: 'POST',
    json: { name: 'Test', email: 'test@example.com', password: 'test' },
    headers: { 'x-csrf-token': csrf },
    jar,
  });
  assert.equal(
    response.status,
    404,
    `/test/users POST should return 404 in production, got ${response.status}`
  );
});

test('POST /test/characters returns 404 when test routes are disabled', async () => {
  const jar = new CookieJar();
  const csrf = await fetchCsrfToken(jar);
  const response = await request('/test/characters', {
    method: 'POST',
    json: { userId: '00000000-0000-0000-0000-000000000000' },
    headers: { 'x-csrf-token': csrf },
    jar,
  });
  assert.equal(
    response.status,
    404,
    `/test/characters should return 404 in production, got ${response.status}`
  );
});

test('DELETE /test/data returns 404 when test routes are disabled', async () => {
  const jar = new CookieJar();
  const csrf = await fetchCsrfToken(jar);
  const response = await request('/test/data?email=test@example.com', {
    method: 'DELETE',
    headers: { 'x-csrf-token': csrf },
    jar,
  });
  assert.equal(
    response.status,
    404,
    `/test/data DELETE should return 404 in production, got ${response.status}`
  );
});
