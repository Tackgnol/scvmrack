import { chromium, FullConfig } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:5173';
const apiBaseURL = process.env.API_BASE_URL ?? 'http://localhost:3000';
const authDir = 'tests/e2e/.auth';
const authStatePath = `${authDir}/user.json`;
const authMetadataPath = `${authDir}/user-metadata.json`;

export default async function globalSetup(_config: FullConfig) {
  await mkdir(authDir, { recursive: true });

  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  const uniqueEmail = `e2e_${crypto.randomUUID()}@example.com`;
  const password = 'E2eTestPassword123!';

  const res = await page.request.post(`${apiBaseURL}/test/users`, {
    data: {
      name: 'E2E Test User',
      email: uniqueEmail,
      password,
    },
  });

  if (!res.ok()) {
    throw new Error(
      `Failed to create test user: ${res.status()} ${await res.text()}`
    );
  }

  const { userId, sessionCookie } = (await res.json()) as {
    userId: string;
    sessionCookie: string;
  };

  if (!sessionCookie) {
    throw new Error('Test user response did not include a session cookie');
  }

  const url = new URL(baseURL);
  const cookieParts = sessionCookie.split('; ').filter(Boolean);
  for (const part of cookieParts) {
    const eqIdx = part.indexOf('=');
    if (eqIdx <= 0) continue;
    const name = part.slice(0, eqIdx);
    const value = part.slice(eqIdx + 1);
    await context.addCookies([
      {
        name,
        value,
        domain: url.hostname,
        path: '/',
        httpOnly: true,
        secure: url.protocol === 'https:',
      },
    ]);
  }

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
  await context.storageState({ path: authStatePath });
  await import('node:fs/promises').then(({ writeFile }) =>
    writeFile(authMetadataPath, JSON.stringify({ userId, email: uniqueEmail }, null, 2))
  );

  await browser.close();
}
