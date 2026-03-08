import { spawnSync } from 'node:child_process';

const composeBaseArgs = ['compose', '-f', 'compose.integration-be.yaml'];

function runDocker(args: string[]): number {
  const result = spawnSync('docker', args, { stdio: 'inherit' });

  if (result.error) {
    console.error(result.error.message);
    return 1;
  }

  return result.status ?? 1;
}

const upExitCode = runDocker([
  ...composeBaseArgs,
  'up',
  '--build',
  '--abort-on-container-exit',
  '--exit-code-from',
  'integration',
]);

const downExitCode = runDocker([
  ...composeBaseArgs,
  'down',
  '--volumes',
  '--remove-orphans',
]);

if (upExitCode !== 0) {
  process.exit(upExitCode);
}

if (downExitCode !== 0) {
  process.exit(downExitCode);
}
