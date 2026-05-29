// Runs the browser test suite against each engine in its OWN vitest process,
// sequentially. Running chromium+firefox+webkit inside a single process is the
// main source of flakiness (engines contend for resources and time out), so we
// isolate them here instead.
//
// Usage:
//   node scripts/run-browser-matrix.mjs                 # chromium, firefox, webkit
//   node scripts/run-browser-matrix.mjs chromium,webkit # a custom subset
import { spawnSync } from 'node:child_process';

const engines = (process.argv[2] ?? 'chromium,firefox,webkit')
  .split(',')
  .map((engine) => engine.trim())
  .filter(Boolean);

for (const engine of engines) {
  console.log(`\n=== Browser tests: ${engine} ===`);
  const result = spawnSync(
    'npx',
    ['vitest', 'run', '--config', 'vitest.browser.config.ts'],
    {
      stdio: 'inherit',
      shell: process.platform === 'win32',
      env: { ...process.env, VITEST_BROWSER_INSTANCES: engine },
    }
  );

  if (result.status !== 0) {
    console.error(`\nBrowser tests failed for ${engine}.`);
    process.exit(result.status ?? 1);
  }
}

console.log(`\nAll browser engines passed: ${engines.join(', ')}`);
