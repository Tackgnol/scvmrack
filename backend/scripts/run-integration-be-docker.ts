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

// Build all images up front, including the short-lived integration runner.
const buildExitCode = runDocker([...composeBaseArgs, 'build']);

const dbExitCode =
  buildExitCode !== 0
    ? buildExitCode
    : runDocker([
        ...composeBaseArgs,
        'up',
        '-d',
        '--wait',
        '--wait-timeout',
        '300',
        'db',
      ]);

const migrateExitCode =
  dbExitCode !== 0 ? dbExitCode : runDocker([...composeBaseArgs, 'run', '--rm', 'migrate']);

const apiExitCode =
  migrateExitCode !== 0
    ? migrateExitCode
    : runDocker([
        ...composeBaseArgs,
        'up',
        '-d',
        '--wait',
        '--wait-timeout',
        '300',
        '--no-deps',
        'api',
      ]);

let testExitCode = apiExitCode;

if (apiExitCode === 0) {
  // Run the integration container as the only short-lived test step. This avoids
  // docker compose tearing the stack down when the one-shot migrate container exits.
  testExitCode = runDocker([...composeBaseArgs, 'run', '--rm', '--no-deps', 'integration']);
} else {
  console.error(
    `\nintegration stack failed to become healthy (exit ${apiExitCode}); skipping tests.`
  );
  runDocker([...composeBaseArgs, 'logs', '--no-color', '--tail', '80']);
}

const downExitCode = runDocker(cleanupArgs);

process.exit(testExitCode !== 0 ? testExitCode : downExitCode);
