#!/usr/bin/env node
import { copyFileSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '..');
const clientDir = resolve(rootDir, 'client');
const nycBin = resolve(clientDir, 'node_modules/nyc/bin/nyc.js');
const mergeInputDir = resolve(rootDir, '.nyc_output/full-coverage-input');
const mergeOutputDir = resolve(rootDir, '.nyc_output/full-coverage-output');
const mergedCoverage = resolve(mergeOutputDir, 'out.json');
const reportDir = resolve(rootDir, 'coverage');

const coverageFiles = [
  {
    label: 'backend',
    source: resolve(rootDir, 'coverage-backend/coverage-final.json'),
    target: 'backend.json',
  },
  {
    label: 'client unit',
    source: resolve(clientDir, 'coverage-unit/coverage-final.json'),
    target: 'client-unit.json',
  },
  {
    label: 'client browser',
    source: resolve(clientDir, 'coverage-browser/coverage-final.json'),
    target: 'client-browser.json',
  },
];

if (!existsSync(nycBin)) {
  console.error(
    'Could not find client-local nyc. Run `npm install` in the client directory first.',
  );
  process.exit(1);
}

const missingFiles = coverageFiles.filter(({ source }) => !existsSync(source));

if (missingFiles.length > 0) {
  console.error('Missing coverage inputs:');
  for (const { label, source } of missingFiles) {
    console.error(`- ${label}: ${source}`);
  }
  console.error(
    'Run `npm run test:coverage:backend` and `npm run test:coverage:client` before merging.',
  );
  process.exit(1);
}

rmSync(mergeInputDir, { recursive: true, force: true });
rmSync(mergeOutputDir, { recursive: true, force: true });
rmSync(reportDir, { recursive: true, force: true });
mkdirSync(mergeInputDir, { recursive: true });
mkdirSync(mergeOutputDir, { recursive: true });

for (const { source, target } of coverageFiles) {
  copyFileSync(source, resolve(mergeInputDir, target));
}

const mergeResult = spawnSync(
  process.execPath,
  [nycBin, 'merge', mergeInputDir, mergedCoverage],
  { cwd: rootDir, stdio: 'inherit' },
);

if (mergeResult.status !== 0) {
  process.exit(mergeResult.status ?? 1);
}

const reportResult = spawnSync(
  process.execPath,
  [
    nycBin,
    'report',
    '--temp-dir',
    mergeOutputDir,
    '--reporter=html',
    '--reporter=text',
    '--reporter=lcov',
    '--reporter=json',
    '--report-dir',
    reportDir,
  ],
  { cwd: rootDir, stdio: 'inherit' },
);

process.exit(reportResult.status ?? 1);
