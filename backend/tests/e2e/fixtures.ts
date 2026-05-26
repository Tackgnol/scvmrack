import { test as base } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

export interface Fixtures {
  cleanContext: void;
  seededCharacter: {
    id: string;
  };
}

interface WorkerFixtures {
  workerAuthState: string | undefined;
  workerUserId: string | undefined;
}

const authDir = resolve('tests/e2e/.auth');
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:5173';
const apiBaseURL = process.env.API_BASE_URL ?? 'http://localhost:3000';
type CookieJar = Map<string, string>;

function metadataPath(parallelIndex: number): string {
  return `${authDir}/user-${parallelIndex}-metadata.json`;
}

function statePath(parallelIndex: number): string {
  return `${authDir}/user-${parallelIndex}.json`;
}

function readAuthMetadata(parallelIndex: number): { userId: string } {
  return JSON.parse(readFileSync(metadataPath(parallelIndex), 'utf-8')) as {
    userId: string;
  };
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

export const test = base.extend<Fixtures, WorkerFixtures>({
  workerAuthState: [
    async ({ browser }, use, workerInfo) => {
      if (workerInfo.project.name !== 'authed') {
        await use(undefined);
        return;
      }

      await mkdir(authDir, { recursive: true });

      const uniqueEmail = `e2e_${workerInfo.parallelIndex}_${crypto.randomUUID()}@example.com`;
      const password = 'E2eTestPassword123!';
      const testRouteCookies: CookieJar = new Map();
      const createUserResponse = await postTestRoute(
        '/test/users',
        {
          name: `E2E Worker ${workerInfo.parallelIndex}`,
          email: uniqueEmail,
          password,
        },
        testRouteCookies
      );

      if (!createUserResponse.ok) {
        throw new Error(
          `Failed to create test user for worker ${workerInfo.parallelIndex}: ` +
            `${createUserResponse.status} ${await createUserResponse.text()}`
        );
      }

      const { userId, sessionCookie } = (await createUserResponse.json()) as {
        userId: string;
        sessionCookie: string;
      };

      if (!sessionCookie) {
        throw new Error(`Test user for worker ${workerInfo.parallelIndex} has no session cookie`);
      }

      const context = await browser.newContext();
      const url = new URL(baseURL);
      for (const cookie of sessionCookie.split('; ').filter(Boolean)) {
        const [nameValue] = cookie.split(';');
        const eqIdx = nameValue.indexOf('=');
        if (eqIdx <= 0) continue;

        await context.addCookies([
          {
            name: nameValue.slice(0, eqIdx),
            value: nameValue.slice(eqIdx + 1),
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

      const authStatePath = statePath(workerInfo.parallelIndex);
      await context.storageState({ path: authStatePath });
      await context.close();
      await writeFile(
        metadataPath(workerInfo.parallelIndex),
        JSON.stringify({ userId, email: uniqueEmail }, null, 2)
      );

      await use(authStatePath);
    },
    { scope: 'worker' },
  ],

  workerUserId: [
    async ({ workerAuthState }, use, workerInfo) => {
      if (workerInfo.project.name !== 'authed' || !workerAuthState) {
        await use(undefined);
        return;
      }

      await use(readAuthMetadata(workerInfo.parallelIndex).userId);
    },
    { scope: 'worker' },
  ],

  storageState: async ({ workerAuthState }, use, testInfo) => {
    await use(testInfo.project.name === 'authed' ? workerAuthState : undefined);
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

  seededCharacter: async ({ workerUserId }, use) => {
    if (!workerUserId) {
      throw new Error('seededCharacter is only available in the authed Playwright project');
    }

    const testRouteCookies: CookieJar = new Map();
    const charRes = await postTestRoute(
      '/test/characters',
      { userId: workerUserId },
      testRouteCookies
    );

    if (!charRes.ok) {
      throw new Error(
        `Failed to create seeded character: ${charRes.status} ${await charRes.text()}`
      );
    }

    const { id } = (await charRes.json()) as { id: string };
    await use({ id });
  },
});

export { expect } from '@playwright/test';
