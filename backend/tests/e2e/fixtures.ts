import { test as base } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

export interface Fixtures {
  cleanContext: void;
  testAuthUser: {
    authStatePath: string;
    email: string;
    userId: string;
  } | undefined;
  seedCharacter: (options?: { name?: string }) => Promise<{
    id: string;
  }>;
  seededCharacter: {
    id: string;
  };
}

const authDir = resolve('tests/e2e/.auth');
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:5173';
const apiBaseURL = process.env.API_BASE_URL ?? 'http://localhost:3000';
type CookieJar = Map<string, string>;

function shouldApplyBrowserAuthCookie(name: string): boolean {
  const normalizedName = name.replace(/^__Secure-/, '');

  if (!normalizedName.startsWith('better-auth.')) {
    return false;
  }

  // /test/users creates a user by anonymous sign-in, then flips the DB row to
  // isAnonymous=false. Better Auth's session-data cookie can still contain the
  // anonymous user snapshot, so keep only the session token and let get-session
  // read the fresh user from the DB.
  return (
    !normalizedName.includes('.session_data') &&
    !normalizedName.includes('.account_data')
  );
}

function parseBrowserAuthCookies(
  sessionCookie: string
): Array<{ name: string; value: string }> {
  const cookies: Array<{ name: string; value: string }> = [];

  for (const part of sessionCookie.split(/;\s*/).filter(Boolean)) {
    const separatorIndex = part.indexOf('=');
    if (separatorIndex <= 0) continue;

    const name = part.slice(0, separatorIndex);
    if (!shouldApplyBrowserAuthCookie(name)) continue;

    cookies.push({
      name,
      value: part.slice(separatorIndex + 1),
    });
  }

  return cookies;
}

function collectSetCookieHeaders(headers: Headers): string[] {
  const getSetCookie = (headers as Headers & { getSetCookie?: () => string[] }).getSetCookie;
  if (getSetCookie) {
    return getSetCookie.call(headers);
  }

  const setCookie = headers.get('set-cookie');
  return setCookie ? [setCookie] : [];
}

function storeResponseCookies(headers: Headers, cookies: CookieJar): void {
  for (const setCookie of collectSetCookieHeaders(headers)) {
    const [nameValue] = setCookie.split(';');
    const separatorIndex = nameValue.indexOf('=');
    if (separatorIndex <= 0) continue;

    cookies.set(nameValue.slice(0, separatorIndex), nameValue.slice(separatorIndex + 1));
  }
}

function serializeCookies(cookies: CookieJar): string {
  return [...cookies.entries()].map(([name, value]) => `${name}=${value}`).join('; ');
}

async function getCsrfToken(cookies: CookieJar): Promise<string> {
  const response = await fetch(`${apiBaseURL}/api/csrf-token`, {
    headers: { cookie: serializeCookies(cookies) },
  });

  storeResponseCookies(response.headers, cookies);

  if (!response.ok) {
    throw new Error(`Failed to get CSRF token: ${response.status} ${await response.text()}`);
  }

  const { token } = (await response.json()) as { token?: string };
  if (!token) {
    throw new Error('CSRF endpoint returned no token');
  }

  return token;
}

async function postTestRoute(path: string, data: unknown, cookies: CookieJar): Promise<Response> {
  const csrfToken = await getCsrfToken(cookies);
  const response = await fetch(`${apiBaseURL}${path}`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-csrf-token': csrfToken,
      cookie: serializeCookies(cookies),
    },
    body: JSON.stringify(data),
  });

  storeResponseCookies(response.headers, cookies);
  return response;
}

async function createSeededCharacter(
  userId: string,
  options: { name?: string } = {}
): Promise<{ id: string }> {
  const testRouteCookies: CookieJar = new Map();
  const charRes = await postTestRoute(
    '/test/characters',
    { userId, ...options },
    testRouteCookies
  );

  if (!charRes.ok) {
    throw new Error(
      `Failed to create seeded character: ${charRes.status} ${await charRes.text()}`
    );
  }

  return (await charRes.json()) as { id: string };
}

/**
 * Create an extra authenticated user via the test fixture route. Useful when a
 * test needs a *second* actor (e.g. a party member joining the GM's party).
 */
export async function createTestUser(
  name = 'E2E Player'
): Promise<{ userId: string; sessionCookie: string }> {
  const cookies: CookieJar = new Map();
  const email = `e2e_player_${crypto.randomUUID()}@example.com`;
  const response = await postTestRoute(
    '/test/users',
    { name, email, password: 'E2eTestPassword123!' },
    cookies
  );
  if (!response.ok) {
    throw new Error(`createTestUser failed: ${response.status} ${await response.text()}`);
  }
  const { userId, sessionCookie } = (await response.json()) as {
    userId: string;
    sessionCookie: string;
  };
  if (!sessionCookie) {
    throw new Error('createTestUser returned no session cookie');
  }
  return { userId, sessionCookie };
}

export { createSeededCharacter };

/**
 * Apply a `/test/users` sessionCookie blob to a browser context and acknowledge
 * the privacy notice, so a hand-built context behaves like the default authed
 * fixture (which sets these via `cleanContext` + storageState).
 */
export async function prepareActorContext(
  context: import('@playwright/test').BrowserContext,
  sessionCookie: string
): Promise<void> {
  await context.addInitScript(() => {
    localStorage.setItem(
      'scvmgrinder-privacy-settings-v1',
      JSON.stringify({ acknowledged: true, analyticsEnabled: false })
    );
  });
  const url = new URL(baseURL);
  for (const cookie of parseBrowserAuthCookies(sessionCookie)) {
    await context.addCookies([
      {
        name: cookie.name,
        value: cookie.value,
        domain: url.hostname,
        path: '/',
        httpOnly: true,
        secure: url.protocol === 'https:',
      },
    ]);
  }
}

export const test = base.extend<Fixtures>({
  testAuthUser: async ({ browser }, use, testInfo) => {
    if (testInfo.project.name !== 'authed') {
      await use(undefined);
      return;
    }

    await mkdir(authDir, { recursive: true });

    const uniqueEmail = `e2e_${testInfo.workerIndex}_${crypto.randomUUID()}@example.com`;
    const password = 'E2eTestPassword123!';
    const testRouteCookies: CookieJar = new Map();
    const createUserResponse = await postTestRoute(
      '/test/users',
      {
        name: `E2E Test ${testInfo.workerIndex}`,
        email: uniqueEmail,
        password,
      },
      testRouteCookies
    );

    if (!createUserResponse.ok) {
      throw new Error(
        `Failed to create test user for ${testInfo.title}: ` +
          `${createUserResponse.status} ${await createUserResponse.text()}`
      );
    }

    const { userId, sessionCookie } = (await createUserResponse.json()) as {
      userId: string;
      sessionCookie: string;
    };

    if (!sessionCookie) {
      throw new Error(`Test user for ${testInfo.title} has no session cookie`);
    }

    const context = await browser.newContext();
    const url = new URL(baseURL);
    for (const cookie of parseBrowserAuthCookies(sessionCookie)) {
      await context.addCookies([
        {
          name: cookie.name,
          value: cookie.value,
          domain: url.hostname,
          path: '/',
          httpOnly: true,
          secure: url.protocol === 'https:',
        },
      ]);
    }

    const page = await context.newPage();
    await page.goto(baseURL);
    await page.evaluate(
      ({ email }) => {
        localStorage.setItem(
          'scvmgrinder-privacy-settings-v1',
          JSON.stringify({ acknowledged: true, analyticsEnabled: false })
        );
        localStorage.setItem('scvmrack-e2e-user-email', email);
      },
      { email: uniqueEmail }
    );

    const authStatePath = `${authDir}/user-${testInfo.workerIndex}-${crypto.randomUUID()}.json`;
    await context.storageState({ path: authStatePath });
    await context.close();

    await use({ authStatePath, email: uniqueEmail, userId });
  },

  storageState: async ({ testAuthUser }, use, testInfo) => {
    await use(testInfo.project.name === 'authed' ? testAuthUser?.authStatePath : undefined);
  },

  cleanContext: [
    async ({ context }, use) => {
      await context.addInitScript(() => {
        localStorage.setItem(
          'scvmgrinder-privacy-settings-v1',
          JSON.stringify({ acknowledged: true, analyticsEnabled: false })
        );
      });
      await use();
    },
    { auto: true },
  ],

  seedCharacter: async ({ testAuthUser }, use) => {
    if (!testAuthUser) {
      throw new Error('seedCharacter is only available in the authed Playwright project');
    }

    await use((options) => createSeededCharacter(testAuthUser.userId, options));
  },

  seededCharacter: async ({ seedCharacter }, use) => {
    await use(await seedCharacter());
  },
});

export { expect } from '@playwright/test';
