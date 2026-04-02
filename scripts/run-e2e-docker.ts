import { spawnSync } from 'node:child_process';

if (process.argv.includes('--debug')) {
  process.env.PLAYWRIGHT_DEBUG = '1';
}

const composeBaseArgs = ['compose', '-f', 'compose.e2e.yaml'];
const cleanupArgs = [...composeBaseArgs, 'down', '--volumes', '--remove-orphans'];

function runDocker(args) {
  const result = spawnSync('docker', args, { stdio: 'inherit' });

  if (result.error) {
    console.error(result.error.message);
    return 1;
  }

  return result.status ?? 1;
}

// Clean any stale test stack state first so reruns don't fail on orphaned containers.
runDocker(cleanupArgs);

const upExitCode = runDocker([
  ...composeBaseArgs,
  'up',
  '--build',
  '--abort-on-container-exit',
  '--exit-code-from',
  'e2e',
  'db',
  'mailpit',
  'api',
  'web',
  'e2e',
]);

const downExitCode = runDocker(cleanupArgs);

if (upExitCode !== 0) {
  process.exit(upExitCode);
}

if (downExitCode !== 0) {
  process.exit(downExitCode);
}
