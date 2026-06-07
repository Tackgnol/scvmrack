import { expect, test, type APIRequestContext, type APIResponse } from '@playwright/test';
import { randomUUID } from 'node:crypto';

type ApiErrorPayload = {
  code?: string;
  error?: string;
  message?: string;
  requestId?: string;
  statusCode?: number;
};

const privateDataPattern =
  /\b(user_id|userId|email|password|session|cookie|csrf|claim|token|secret)\b/i;

function serialized(payload: unknown): string {
  return JSON.stringify(payload);
}

async function expectJsonResponse<T>(response: APIResponse, expectedStatus: number): Promise<T> {
  expect(response.status()).toBe(expectedStatus);
  const contentType = response.headers()['content-type'] ?? '';
  expect(contentType).toContain('application/json');
  return (await response.json()) as T;
}

async function expectApiError(
  response: APIResponse,
  expectedStatus: number,
  expectedCode: string
): Promise<ApiErrorPayload> {
  const payload = await expectJsonResponse<ApiErrorPayload>(response, expectedStatus);
  expect(payload.statusCode).toBe(expectedStatus);
  expect(payload.code).toBe(expectedCode);
  expect(typeof payload.message).toBe('string');
  expect(typeof payload.requestId).toBe('string');
  return payload;
}

async function fetchCsrfToken(request: APIRequestContext): Promise<string> {
  const response = await request.get('/api/csrf-token');
  const payload = await expectJsonResponse<{ token?: string }>(response, 200);
  if (typeof payload.token !== 'string') {
    throw new Error('CSRF endpoint returned no token');
  }
  return payload.token;
}

async function expectOAuthCallbackRejected(response: APIResponse): Promise<void> {
  expect(response.status()).toBe(403);
  expect(response.headers().location).toBeUndefined();
  expect(await response.text()).toContain('INVALID_CALLBACK_URL');
}

test.describe('production non-mutating smoke', () => {
  test('health endpoint returns ok with security headers', async ({ request }) => {
    const response = await request.get('/api/health');
    const payload = await expectJsonResponse<{ status?: string; timestamp?: string }>(response, 200);
    const headers = response.headers();

    expect(payload.status).toBe('ok');
    expect(typeof payload.timestamp).toBe('string');
    expect(Number.isNaN(Date.parse(payload.timestamp ?? ''))).toBe(false);

    expect(headers['strict-transport-security']).toContain('max-age=');
    expect(headers['content-security-policy']).toContain("frame-ancestors 'none'");
    expect(headers['x-content-type-options']).toBe('nosniff');
    expect(headers['referrer-policy']).toBe('no-referrer');
    expect(headers['x-frame-options']).toBe('SAMEORIGIN');
  });

  test('public aggregate and equipment endpoints expose only public data', async ({ request }) => {
    const countResponse = await request.get('/api/characters/count');
    const countPayload = await expectJsonResponse<{ total?: number }>(countResponse, 200);
    expect(typeof countPayload.total).toBe('number');
    expect(serialized(countPayload)).not.toMatch(privateDataPattern);

    const equipmentResponse = await request.get('/api/equipment/search?q=sword&limit=5');
    const equipmentPayload = await expectJsonResponse<unknown>(equipmentResponse, 200);
    const equipmentJson = serialized(equipmentPayload);
    expect(equipmentJson.length).toBeGreaterThan(2);
    expect(equipmentJson).not.toMatch(privateDataPattern);
  });

  test('negative API checks preserve auth, validation, and redirect posture', async ({ request }) => {
    await expectApiError(await request.get('/api/characters/not-a-uuid'), 400, 'VALIDATION_ERROR');

    await expectApiError(
      await request.get(`/api/characters/${randomUUID()}`),
      401,
      'SESSION_REQUIRED'
    );

    await expectOAuthCallbackRejected(
      await request.get(
        '/api/auth/oauth2/login/logto?callbackURL=https%3A%2F%2Fevil.example%2Fafter',
        { maxRedirects: 0 }
      )
    );
  });

  test('public non-mutating pages render without API server errors', async ({ page }) => {
    const serverErrors: string[] = [];

    page.on('response', (response) => {
      const url = response.url();
      if (url.includes('/api/') && response.status() >= 500) {
        serverErrors.push(`${response.status()} ${url}`);
      }
    });

    for (const path of ['/faq', '/release', '/characters']) {
      await page.goto(path, { waitUntil: 'domcontentloaded' });
      await expect(page.locator('body')).toBeVisible();
    }

    expect(serverErrors).toEqual([]);
  });
});

test.describe('production mutating smoke', () => {
  test.skip(
    process.env.ALLOW_MUTATING_PROD_SMOKE !== '1',
    'Set ALLOW_MUTATING_PROD_SMOKE=1 to create and delete disposable production data.'
  );

  test('anonymous character create, save, fetch, and delete works', async ({ request }) => {
    let characterId: string | undefined;

    try {
      const signInResponse = await request.post('/api/auth/sign-in/anonymous', { data: {} });
      expect(signInResponse.status()).toBe(200);

      const createCsrf = await fetchCsrfToken(request);
      const createResponse = await request.post('/api/characters/new?locale=en', {
        data: {},
        headers: { 'x-csrf-token': createCsrf },
      });
      const created = await expectJsonResponse<{ id?: string }>(createResponse, 201);
      expect(typeof created.id).toBe('string');
      characterId = created.id;

      const note = `prod-smoke ${new Date().toISOString()} ${randomUUID()}`;
      const patchCsrf = await fetchCsrfToken(request);
      const patchResponse = await request.patch(`/api/characters/${characterId}`, {
        data: { notes: note },
        headers: { 'x-csrf-token': patchCsrf },
      });
      const patched = await expectJsonResponse<{ notes?: string }>(patchResponse, 200);
      expect(patched.notes).toBe(note);

      const fetchResponse = await request.get(`/api/characters/${characterId}`);
      const fetched = await expectJsonResponse<{ id?: string; notes?: string }>(fetchResponse, 200);
      expect(fetched.id).toBe(characterId);
      expect(fetched.notes).toBe(note);

      const deleteCsrf = await fetchCsrfToken(request);
      const deleteResponse = await request.delete(`/api/characters/${characterId}`, {
        headers: { 'x-csrf-token': deleteCsrf },
      });
      expect(deleteResponse.status()).toBe(204);

      await expectApiError(
        await request.get(`/api/characters/${characterId}`),
        404,
        'CHARACTER_NOT_FOUND'
      );
      characterId = undefined;
    } finally {
      if (characterId) {
        const cleanupCsrf = await fetchCsrfToken(request);
        const cleanupResponse = await request.delete(`/api/characters/${characterId}`, {
          headers: { 'x-csrf-token': cleanupCsrf },
        });
        expect([204, 404]).toContain(cleanupResponse.status());
      }
    }
  });
});
