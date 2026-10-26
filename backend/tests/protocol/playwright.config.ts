import { defineConfig, devices } from '@playwright/test';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  testDir: '.', testMatch: '*.spec.ts', workers: 1, retries: 0, timeout: 30000,
  use: { baseURL: 'http://127.0.0.1:5278', trace: 'retain-on-failure' },
  projects: [
    { name: 'chromium', use: devices['Desktop Chrome'] },
    { name: 'firefox', use: devices['Desktop Firefox'] },
    { name: 'webkit', use: devices['Desktop Safari'] },
  ],
  webServer: {
    command: 'node node_modules/vite/bin/vite.js --config vite.protocol.config.ts --host 127.0.0.1 --port 5278 --strictPort',
    cwd: fileURLToPath(new URL('../../../frontend', import.meta.url)),
    url: 'http://127.0.0.1:5278', reuseExistingServer: false,
  },
});
