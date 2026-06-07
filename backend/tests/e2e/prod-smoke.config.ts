import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.PROD_SMOKE_BASE_URL;

if (!baseURL) {
  throw new Error(
    'Set PROD_SMOKE_BASE_URL before running production smoke, for example: ' +
      'PROD_SMOKE_BASE_URL=https://scvmrack.rpgtools.co npm --prefix backend/tests/e2e run test:prod-smoke'
  );
}

const parsedBaseURL = new URL(baseURL);

if (parsedBaseURL.protocol !== 'https:' && process.env.ALLOW_INSECURE_PROD_SMOKE !== '1') {
  throw new Error(
    `Refusing to run production smoke against non-HTTPS target ${baseURL}. ` +
      'Set ALLOW_INSECURE_PROD_SMOKE=1 only for local dry-runs.'
  );
}

export default defineConfig({
  testDir: '.',
  testMatch: /prod-smoke\.spec\.ts/,
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 45000,
  expect: {
    timeout: 10000,
  },
  outputDir: 'test-results/prod-smoke',

  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'prod-smoke',
      use: {
        ...devices['Desktop Chrome'],
      },
    },
  ],

  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'playwright-report/prod-smoke' }],
    ['junit', { outputFile: '../../reports/prod-smoke.xml' }],
  ],
});
