import { spawnSync } from 'node:child_process';

const composeBaseArgs = ['compose', '-f', '../compose.integration-be.yaml'];
const cleanupArgs = [...composeBaseArgs, 'down', '--volumes', '--remove-orphans'];

function runDocker(args: string[]): number {
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
  'integration',
  'db',
  'api',
  'integration',
]);

const downExitCode = runDocker(cleanupArgs);

if (upExitCode !== 0) {
  process.exit(upExitCode);
}

if (downExitCode !== 0) {
  process.exit(downExitCode);
}
