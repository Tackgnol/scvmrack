import { spawnSync } from 'node:child_process';

const composeBaseArgs = ['compose', '-f', 'compose.yaml'];

function runDocker(args: string[]): number {
  const result = spawnSync('docker', args, { stdio: 'inherit' });
  if (result.error) {
    console.error(result.error.message);
    return 1;
  }
  return result.status ?? 1;
}

function waitForHealthy(containerName: string, maxRetries: number = 30): boolean {
  console.log('Waiting for PostgreSQL to be ready...');
  for (let i = 0; i < maxRetries; i++) {
    try {
      const result = spawnSync('docker', ['inspect', '--format={{.State.Health.Status}}', containerName], {
        encoding: 'utf-8',
        stdio: ['ignore', 'pipe', 'ignore'],
      });
      const status = result.stdout?.trim();
      if (status === 'healthy') {
        console.log('PostgreSQL is ready!');
        return true;
      }
    } catch {
      // Container not ready yet
    }
    process.stdout.write('.');
    spawnSync(process.execPath, ['-e', 'setTimeout(()=>{}, 2000)']);
  }
  return false;
}

// Start DB container in detached mode
console.log('Starting PostgreSQL container...');
const upResult = runDocker([...composeBaseArgs, 'up', '-d', 'db']);
if (upResult !== 0) {
  console.error('Failed to start DB container');
  process.exit(1);
}

// Get container name
const containerName = spawnSync('docker', ['compose', 'ps', '-q', 'db'], { encoding: 'utf-8' }).stdout?.trim();

if (!containerName) {
  console.error('Could not get container name');
  process.exit(1);
}

// Wait for healthy
if (!waitForHealthy(containerName)) {
  console.error('Timeout waiting for DB');
  runDocker([...composeBaseArgs, 'down', '--volumes']);
  process.exit(1);
}

// Build DATABASE_URL
const dbUser = process.env.DATABASE_USER || 'p1002_scmgrinder';
const dbPassword = process.env.DATABASE_PASSWORD || 'p1002_scmgrinder';
const dbHost = process.env.DATABASE_HOST || 'localhost';
const dbPort = process.env.DATABASE_PORT || '5433';
const dbName = process.env.DATABASE_NAME || 'p1002_scmgrinder';

const databaseUrl = `postgresql://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/${dbName}`;

console.log('\nRunning pgTyped...');
console.log(`DATABASE_URL: ${databaseUrl}`);

// Run pgtyped
const pgtypedResult = spawnSync('npx', ['pgtyped', '--config', 'pgtyped.json'], {
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, DATABASE_URL: databaseUrl },
});

const pgtypedExitCode = pgtypedResult.status ?? 1;

console.log('\nCleaning up containers...');
runDocker([...composeBaseArgs, 'down', '--volumes']);

if (pgtypedExitCode !== 0) {
  console.error(`pgTyped failed with exit code ${pgtypedExitCode}`);
  process.exit(pgtypedExitCode);
}

console.log('Done!');
