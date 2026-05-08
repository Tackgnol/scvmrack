import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:5173';
const debug = process.env.PLAYWRIGHT_DEBUG === '1';
const isCI = process.env.CI === 'true';
const includeRegression = process.env.PLAYWRIGHT_INCLUDE_REGRESSION === '1';
const parsedWorkers = process.env.PLAYWRIGHT_WORKERS
  ? Number(process.env.PLAYWRIGHT_WORKERS)
  : undefined;
const configuredWorkers = Number.isFinite(parsedWorkers) ? parsedWorkers : undefined;

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  workers: configuredWorkers ?? (includeRegression ? 1 : 2),
  retries: isCI ? 1 : 0,
  timeout: 60000,
  expect: {
    timeout: 10000,
  },
  outputDir: 'test-results',

  use: {
    baseURL,
    trace: debug ? 'on' : 'retain-on-failure',
    screenshot: debug ? 'on' : 'only-on-failure',
  },

  projects: [
    {
      name: 'guest',
      testDir: './tests/guest',
      use: {
        ...devices['Desktop Chrome'],
      },
    },

    {
      name: 'authed',
      testDir: './tests/authed',
      use: {
        ...devices['Desktop Chrome'],
      },
    },

    ...(includeRegression
      ? [
          {
            name: 'regression',
            testDir: './tests/regression',
            use: {
              ...devices['Desktop Chrome'],
            },
          },
        ]
      : []),
  ],

  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
    ['junit', { outputFile: '../../reports/e2e.xml' }],
  ],
});
