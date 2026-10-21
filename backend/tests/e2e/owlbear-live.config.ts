import { defineConfig } from '@playwright/test';

// Explicitly separate from CI: this suite signs into a real third-party room.
export default defineConfig({
  testDir: './owlbear-live',
  workers: 1,
  retries: 0,
  timeout: 120_000,
  expect: { timeout: 20_000 },
  outputDir: '../../../output/playwright/owlbear-live',
  reporter: 'list',
  use: {
    channel: 'chrome',
    headless: false,
    // Never capture credentials, login pages, exchange tokens or cookies.
    trace: 'off',
    screenshot: 'off',
    video: 'off',
  },
});
