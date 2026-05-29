import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config';
import { playwright } from '@vitest/browser-playwright';

const { test: _unitTestConfig, ...viteConfigWithoutUnitTests } =
  viteConfig as any;

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

const isCiChromiumRun =
  process.env.CI === 'true' &&
  browserInstances.length === 1 &&
  browserInstances[0]?.browser === 'chromium';

export default mergeConfig(
  viteConfigWithoutUnitTests,
  defineConfig({
    optimizeDeps: {
      include: ['@mui/icons-material/WarningAmber'],
    },
    test: {
      name: 'browser',
      testTimeout: 30000,
      // Keep cross-browser runs serial: Firefox was unstable under cross-file concurrency.
      fileParallelism: false,
      maxWorkers: 1,
      browser: {
        enabled: true,
        instances: browserInstances,
        provider: playwright({
          launchOptions: isCiChromiumRun
            ? {
                args: ['--disable-dev-shm-usage', '--no-sandbox'],
              }
            : undefined,
        }),
        headless: !process.argv.includes('--ui'),
        viewport: { width: 1280, height: 720 },
      },
      include: ['test/browser/**/*.test.tsx'],
      setupFiles: ['./test/setup-browser.ts'],
      exclude: ['test/unit/**/*'],
      coverage: {
        provider: 'istanbul',
        reportsDirectory: './coverage-browser',
        include: ['src/**/*.{ts,tsx}'],
        exclude: ['src/**/*.d.ts', 'src/api/schema.ts', 'src/main.tsx'],
      },
    },
  })
);
