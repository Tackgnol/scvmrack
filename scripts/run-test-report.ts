#!/usr/bin/env node
/**
 * run-test-report.ts
 *
 * Runs all offline test suites (BE unit, FE unit, FE browser), then generates
 * reports/index.html regardless of individual suite exit codes.
 *
 * Exits 1 if any suite had failures (the generator also reflects this).
 */
import { spawnSync } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const nodeCommand = process.execPath;

interface Suite {
  label: string;
  npmScript: string;
  prefix?: string; // npm --prefix <dir>
}

const suites: Suite[] = [
  { label: 'Unit Tests (Backend)', npmScript: 'test:report:unit:be' },
  { label: 'Unit Tests (Frontend)', npmScript: 'test:report:unit:fe' },
  { label: 'Browser Tests (Frontend)', npmScript: 'test:report:browser' },
];

const failed: string[] = [];

for (const suite of suites) {
  console.log(`\n${'─'.repeat(60)}`);
  console.log(`▶ ${suite.label}`);
  console.log('─'.repeat(60));

  const result = spawnSync(npmCommand, ['run', suite.npmScript], {
    cwd: root,
    stdio: 'inherit',
    shell: false,
  });

  if (result.status !== 0) {
    failed.push(suite.label);
    console.log(`✗ ${suite.label} — exited with code ${result.status}`);
  } else {
    console.log(`✓ ${suite.label}`);
  }
}

// Always generate the HTML report
console.log(`\n${'─'.repeat(60)}`);
console.log('▶ Generating combined HTML report');
console.log('─'.repeat(60));

const genResult = spawnSync(nodeCommand, ['--import', 'tsx', 'scripts/generate-test-report.ts'], {
  cwd: root,
  stdio: 'inherit',
  shell: false,
});

console.log('\n' + '═'.repeat(60));
if (failed.length > 0) {
  console.log(`FAILED suites: ${failed.join(', ')}`);
  process.exit(1);
} else if (genResult.status !== 0) {
  process.exit(genResult.status ?? 1);
} else {
  console.log('ALL SUITES PASSED');
}
