import assert from 'node:assert/strict';
import test from 'node:test';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const RAW_SQL_PATTERN = /\$queryRaw|\$executeRaw/;

// Files permitted to contain raw Prisma SQL.
// Add an entry here (and document why) when introducing a new sanctioned exception.
// Remove the entry when the raw SQL is replaced with a typed Prisma query.
const ALLOWLIST = new Set<string>([
  // party-repository: a single `pg_advisory_xact_lock` in joinInTransaction
  // serializes concurrent joins to one party so the member cap can't overflow.
  // Not expressible via the typed Prisma client; all other access stays typed.
  'repositories/party-repository.ts',
]);

function walkTs(dir: string): string[] {
  const results: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      results.push(...walkTs(full));
    } else if (entry.endsWith('.ts')) {
      results.push(full);
    }
  }
  return results;
}

test('no $queryRaw or $executeRaw outside the allowlist', () => {
  // backend/tests/unit-be/ -> backend/ -> src/
  const srcDir = join(__dirname, '..', '..', 'src');
  const violations: string[] = [];

  for (const file of walkTs(srcDir)) {
    const rel = relative(srcDir, file).replace(/\\/g, '/');
    if (ALLOWLIST.has(rel)) continue;
    const content = readFileSync(file, 'utf-8');
    if (RAW_SQL_PATTERN.test(content)) {
      violations.push(`  ${rel} — contains raw Prisma SQL ($queryRaw/$executeRaw)`);
    }
  }

  assert.equal(
    violations.length,
    0,
    `Raw SQL found outside the allowlist. Remove or add to ALLOWLIST in no-raw-sql.test.ts:\n${violations.join('\n')}`,
  );
});
