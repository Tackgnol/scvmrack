#!/usr/bin/env node
import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const clientDir = resolve(__dirname, '../client');
const coverageUnit = resolve(clientDir, 'coverage-unit/coverage-final.json');
const coverageBrowser = resolve(clientDir, 'coverage-browser/coverage-final.json');
const mergedDir = resolve(clientDir, 'coverage-merged');
const nycOutputDir = resolve(clientDir, '.nyc_output');

mkdirSync(mergedDir, { recursive: true });
mkdirSync(nycOutputDir, { recursive: true });

const copiedFiles: string[] = [];

if (existsSync(coverageUnit)) {
  copyFileSync(coverageUnit, resolve(mergedDir, 'unit.json'));
  copiedFiles.push('coverage-unit/coverage-final.json');
}

if (existsSync(coverageBrowser)) {
  copyFileSync(coverageBrowser, resolve(mergedDir, 'browser.json'));
  copiedFiles.push('coverage-browser/coverage-final.json');
}

if (copiedFiles.length === 0) {
  console.error(
    'No client coverage JSON files were found. Run `npm run test:coverage:unit` or `npm run test:coverage:browser` first.',
  );
  process.exit(1);
}

const mergeResult = spawnSync(
  'npx',
  ['nyc', 'merge', 'coverage-merged', '.nyc_output/out.json'],
  { cwd: clientDir, stdio: 'inherit', shell: true },
);

if (mergeResult.status !== 0) {
  process.exit(mergeResult.status ?? 1);
}

const reportResult = spawnSync(
  'npx',
  ['nyc', 'report', '--reporter=html', '--reporter=text', '--report-dir', './coverage'],
  { cwd: clientDir, stdio: 'inherit', shell: true },
);

process.exit(reportResult.status ?? 1);
