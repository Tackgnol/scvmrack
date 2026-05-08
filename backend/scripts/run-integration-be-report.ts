#!/usr/bin/env node
/**
 * run-integration-be-report.ts
 *
 * Ensures the integration test Docker stack is running (compose.integration-be-local.yaml),
 * then runs integration tests from the host with JUnit output.
 *
 * The test stack runs on port 3001 (not 3000) so it does not conflict with
 * the regular dev compose stack.
 *
 * - Checks if the integration API is reachable at localhost:3001/health
 * - If not → builds and starts compose.integration-be-local.yaml
 * - Waits for the API to become healthy (polling /health)
 * - Runs integration tests against http://localhost:3001
 * - Leaves the stack running (user manages lifecycle)
 */
import { spawnSync } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';

const INTEGRATION_PORT = 3001;
const API_BASE = `http://localhost:${INTEGRATION_PORT}`;
const COMPOSE_FILE = 'compose.integration-be-local.yaml';
// Separate project name avoids collisions with the dev stack (scvmgrinder_be)
const COMPOSE_PROJECT = 'scvmgrinder-integration';
const POLL_INTERVAL_MS = 3000;
const MAX_WAIT_MS = 120_000;

async function isApiReachable(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(3000) });
    return res.ok;
  } catch {
    return false;
  }
}

async function waitForApi(): Promise<boolean> {
  const deadline = Date.now() + MAX_WAIT_MS;
  while (Date.now() < deadline) {
    if (await isApiReachable()) return true;
    await new Promise(r => setTimeout(r, POLL_INTERVAL_MS));
    process.stdout.write('.');
  }
  return false;
}

function compose(...args: string[]): number | null {
  const result = spawnSync(
    'docker',
    ['compose', '-p', COMPOSE_PROJECT, '-f', COMPOSE_FILE, ...args],
    { cwd: root, stdio: 'inherit', shell: false }
  );
  return result.status;
}

async function main() {
  if (await isApiReachable()) {
    console.log(`Integration API already running at localhost:${INTEGRATION_PORT}`);
  } else {
    console.log(`Starting integration test stack (${COMPOSE_FILE})...`);

    // Build the image first so we get the latest code
    const buildStatus = compose('build', 'api');
    if (buildStatus !== 0) {
      console.error('docker compose build api failed');
      process.exit(1);
    }

    const upStatus = compose('up', '-d');
    if (upStatus !== 0) {
      console.error('docker compose up -d failed');
      process.exit(1);
    }

    console.log(`Waiting up to ${MAX_WAIT_MS / 1000}s for API to become healthy...`);
    const ready = await waitForApi();
    console.log('');

    if (!ready) {
      console.error(`API did not become reachable within ${MAX_WAIT_MS / 1000}s`);
      console.error(`Check: docker compose -p ${COMPOSE_PROJECT} -f ${COMPOSE_FILE} logs api`);
      process.exit(1);
    }

    console.log('API is healthy.');
  }

  const result = spawnSync(
    npmCommand,
    ['--prefix', 'tests/integration-be', 'run', 'test:report'],
    {
      cwd: root,
      stdio: 'inherit',
      shell: false,
      env: { ...process.env, E2E_BASE_URL: API_BASE },
    }
  );

  process.exit(result.status ?? 1);
}

main();
