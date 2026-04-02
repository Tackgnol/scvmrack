import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config';
import { playwright } from '@vitest/browser-playwright';

const browserInstances = (
  process.env.VITEST_BROWSER_INSTANCES ?? 'chromium,firefox,webkit'
)
  .split(',')
  .map((browser) => browser.trim())
  .filter(Boolean)
  .map((browser) => ({
    browser: browser as 'chromium' | 'firefox' | 'webkit',
    context: { reducedMotion: 'reduce' as const },
  }));

export default mergeConfig(
  viteConfig as any,
  defineConfig({
    test: {
      name: 'browser',
      testTimeout: 30000,
      // Keep cross-browser runs serial: Firefox was unstable under cross-file concurrency.
      fileParallelism: false,
      maxWorkers: 1,
      browser: {
        enabled: true,
        instances: browserInstances,
        provider: playwright(),
        headless: !process.argv.includes('--ui'),
        viewport: { width: 1280, height: 720 },
      },
      include: ['test/browser/**/*.test.tsx'],
      setupFiles: ['./test/setup-browser.ts'],
      exclude: ['test/unit/**/*'],
      coverage: {
        provider: 'istanbul',
        reportsDirectory: './coverage-browser',
      },
    },
  })
);
