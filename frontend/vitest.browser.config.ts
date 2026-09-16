import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config';
import { playwright } from '@vitest/browser-playwright';

const { test: _unitTestConfig, ...viteConfigWithoutUnitTests } =
  viteConfig as any;

// Default to a single engine (chromium). Running chromium+firefox+webkit in one
// process is the main source of browser-test flakiness: the engines contend for
// resources and time out. Use `npm run test:browser:all` to exercise every engine
// sequentially (one vitest process per engine), or set VITEST_BROWSER_INSTANCES.
const browserInstances = (process.env.VITEST_BROWSER_INSTANCES ?? 'chromium')
  .split(',')
  .flatMap((rawBrowser) => {
    const browser = rawBrowser.trim();
    return browser
      ? [
          {
            browser: browser as 'chromium' | 'firefox' | 'webkit',
            context: { reducedMotion: 'reduce' as const },
          },
        ]
      : [];
  });

const isCiChromiumRun =
  process.env.CI === 'true' &&
  browserInstances.length === 1 &&
  browserInstances[0]?.browser === 'chromium';

export default mergeConfig(
  viteConfigWithoutUnitTests,
  defineConfig({
    optimizeDeps: {
      include: [
        '@mui/icons-material/WarningAmber',
        '@sentry/browser',
        'react-dom/client',
      ],
    },
    test: {
      name: 'browser',
      testTimeout: 30000,
      // Real browsers occasionally lose a timing race on interaction/poll assertions;
      // a small retry keeps the suite trustworthy without masking hard failures.
      retry: process.env.CI === 'true' ? 2 : 1,
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
