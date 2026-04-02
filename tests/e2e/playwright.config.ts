import { defineConfig } from '@playwright/test';

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:5173';
const debug = process.env.PLAYWRIGHT_DEBUG === '1';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  retries: debug ? 0 : 1,
  outputDir: 'test-results',
  expect: {
    timeout: 15000,
  },
  use: {
    baseURL,
    trace: debug ? 'on' : 'retain-on-failure',
    screenshot: debug ? 'on' : 'only-on-failure',
  },
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
    ['junit', { outputFile: '../../reports/e2e.xml' }],
  ],
});
