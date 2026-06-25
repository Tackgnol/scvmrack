import { spawnSync } from 'node:child_process';

if (process.argv.includes('--debug')) {
  process.env.PLAYWRIGHT_DEBUG = '1';
}

const composeBaseArgs = ['compose', '-f', '../compose.e2e.yaml'];
const cleanupArgs = [...composeBaseArgs, 'down', '--volumes', '--remove-orphans'];

function runDocker(args: string[]): number {
  const result = spawnSync('docker', args, { stdio: 'inherit' });

  if (result.error) {
    console.error(result.error.message);
    return 1;
  }

  return result.status ?? 1;
}

// Clean any stale test stack state first so reruns don't fail on orphaned
// containers or leftover volumes.
runDocker(cleanupArgs);

// Build ALL images up front — including the `e2e` runner. `up` below only
// touches the long-lived services, and `run` does not rebuild on its own, so
// without this the test container would execute a stale image that misses
// newly added/edited specs.
const buildExitCode = runDocker([...composeBaseArgs, 'build']);

// Bring the stack up DETACHED and block until it is genuinely ready. `--wait`
// holds until db/mailpit/api/web report healthy, which in turn requires the
// one-shot `migrate` container (an api dependency) to complete first.
//
// We deliberately do NOT use `up --abort-on-container-exit --exit-code-from e2e`
// here: `migrate` exits the moment it finishes seeding, and that flag would tear
// the entire stack down with it before the tests run (docker/compose#10233).
// Separating "stand up the world" from "run the tests" removes that race.
const upExitCode =
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
        'mailpit',
        'api',
        'web',
      ]);

let testExitCode = upExitCode;

if (upExitCode === 0) {
  // Run the Playwright container's default command synchronously. `run` returns
  // the test runner's OWN exit code directly — no abort-on-exit ambiguity
  // between the short-lived test container and the long-lived services.
  testExitCode = runDocker([...composeBaseArgs, 'run', '--rm', 'e2e']);
} else {
  console.error(
    `\ne2e stack failed to become healthy (exit ${upExitCode}); skipping tests.`
  );
  // Surface recent logs so the failure is diagnosable in CI output.
  runDocker([...composeBaseArgs, 'logs', '--no-color', '--tail', '80']);
}

const downExitCode = runDocker(cleanupArgs);

process.exit(testExitCode !== 0 ? testExitCode : downExitCode);
