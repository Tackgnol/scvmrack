#!/usr/bin/env node
/**
 * test-parity-direct.ts
 *
 * Phase 4 parity check: for each class (1–6 + random), generates a character via
 * the SQL generate_character function, then fetches it through BOTH the SQL
 * get_character_full function (via $queryRaw) AND the TypeScript getCharacterFull
 * implementation and compares the outputs field-by-field.
 *
 * Usage: node --import tsx backend/scripts/test-parity-direct.ts
 * Requires DATABASE_URL in .env (or environment).
 */
import 'dotenv/config';
import prisma from '../src/lib/prisma.js';
import { getCharacterFull } from '../src/lib/get-character-full.js';
import { camelCaseJsonbFields } from '../src/utils.js';

type AnyRecord = Record<string, unknown>;

// ── Normalization ─────────────────────────────────────────────────────────────

function normalize(obj: unknown): unknown {
  if (obj instanceof Date) return '<timestamp>';
  if (typeof obj !== 'object' || obj === null) return obj;
  if (Array.isArray(obj)) return obj.map(normalize);
  const result: AnyRecord = {};
  for (const [k, v] of Object.entries(obj as AnyRecord)) {
    if (k === 'id' && typeof v === 'string' && /^[0-9a-f-]{36}$/i.test(v)) {
      result[k] = '<uuid>';
    } else if (
      (k === 'createdAt' || k === 'updatedAt') &&
      (typeof v === 'string' || v instanceof Date)
    ) {
      result[k] = '<timestamp>';
    } else {
      result[k] = normalize(v);
    }
  }
  return result;
}

/** Sort array-valued fields that SQL doesn't guarantee order for. */
function sortArrays(obj: unknown, fields: string[]): unknown {
  if (typeof obj !== 'object' || obj === null) return obj;
  if (Array.isArray(obj)) return obj.map(item => sortArrays(item, fields));
  const result = { ...(obj as AnyRecord) };
  for (const field of fields) {
    if (Array.isArray(result[field])) {
      result[field] = (result[field] as unknown[]).sort((a, b) => {
        const aKey = (a as AnyRecord)?.key ?? JSON.stringify(a);
        const bKey = (b as AnyRecord)?.key ?? JSON.stringify(b);
        return String(aKey).localeCompare(String(bKey));
      });
    }
  }
  return result;
}

const UNORDERED_ARRAY_FIELDS = ['abilities', 'equipment', 'storage', 'equippedWeapons'];

// ── Diff ──────────────────────────────────────────────────────────────────────

function diff(expected: unknown, actual: unknown, path = ''): string[] {
  if (JSON.stringify(expected) === JSON.stringify(actual)) return [];
  const errors: string[] = [];

  if (Array.isArray(expected) && Array.isArray(actual)) {
    if (expected.length !== actual.length) {
      errors.push(`${path}: array len expected=${expected.length} actual=${actual.length}`);
    }
    for (let i = 0; i < Math.min(expected.length, actual.length); i++) {
      errors.push(...diff(expected[i], actual[i], `${path}[${i}]`));
    }
    return errors;
  }

  if (
    typeof expected === 'object' && expected !== null && !Array.isArray(expected) &&
    typeof actual   === 'object' && actual   !== null && !Array.isArray(actual)
  ) {
    const e = expected as AnyRecord;
    const a = actual   as AnyRecord;
    for (const k of new Set([...Object.keys(e), ...Object.keys(a)])) {
      if (!(k in e)) errors.push(`${path}.${k}: extra in actual (${JSON.stringify(a[k])})`);
      else if (!(k in a)) errors.push(`${path}.${k}: missing in actual (expected ${JSON.stringify(e[k])})`);
      else errors.push(...diff(e[k], a[k], `${path}.${k}`));
    }
    return errors;
  }

  errors.push(`${path}: sql=${JSON.stringify(expected)} ts=${JSON.stringify(actual)}`);
  return errors;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

async function generateAndBind(classId: number | null): Promise<string> {
  const [res] = await prisma.$queryRaw<[{ generateCharacter: string }]>`
    SELECT generate_character(${classId}::integer) AS "generateCharacter"
  `;
  const id = res.generateCharacter;
  // Bind to a synthetic user so getCharacterFull can find it
  const userId = 'parity-test-user';
  await prisma.$executeRaw`
    INSERT INTO "user"(id, name, email, "emailVerified", "updatedAt")
    VALUES (${userId}, 'Parity Test', 'parity@test.invalid', false, NOW())
    ON CONFLICT (id) DO NOTHING
  `;
  await prisma.character.update({ where: { id }, data: { userId } });
  return id;
}

async function fetchSql(id: string, locale: string): Promise<AnyRecord> {
  const rows = await prisma.$queryRaw<AnyRecord[]>`
    SELECT * FROM get_character_full(${id}::uuid, ${locale})
  `;
  if (!rows[0]) throw new Error(`SQL get_character_full returned nothing for ${id}`);
  return camelCaseJsonbFields(rows[0]) as AnyRecord;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('Phase 4 parity: SQL get_character_full vs TypeScript getCharacterFull\n');

  const classes: Array<number | null> = [1, 2, 3, 4, 5, 6, null];
  const locales = ['en', 'pl'];

  let pass = 0;
  let fail = 0;

  for (const classId of classes) {
    const label = classId === null ? 'random' : `class ${classId}`;
    let id: string;
    try {
      id = await generateAndBind(classId);
    } catch (err) {
      console.error(`  ✗ ${label}: failed to generate — ${err}`);
      fail++;
      continue;
    }

    for (const locale of locales) {
      try {
        const [sqlOut, tsOut] = await Promise.all([
          fetchSql(id, locale),
          getCharacterFull(id, locale),
        ]);

        if (!tsOut) {
          console.error(`  ✗ ${label} [${locale}]: TypeScript returned null`);
          fail++;
          continue;
        }

        const normSql = sortArrays(normalize(sqlOut), UNORDERED_ARRAY_FIELDS);
        const normTs  = sortArrays(normalize(tsOut as unknown), UNORDERED_ARRAY_FIELDS);
        const diffs = diff(normSql, normTs);
        if (diffs.length === 0) {
          console.log(`  ✓ ${label} [${locale}]`);
          pass++;
        } else {
          console.error(`  ✗ ${label} [${locale}]`);
          for (const d of diffs.slice(0, 15)) console.error(`      ${d}`);
          if (diffs.length > 15) console.error(`      … and ${diffs.length - 15} more`);
          fail++;
        }
      } catch (err) {
        console.error(`  ✗ ${label} [${locale}]: ${err}`);
        fail++;
      }
    }

    // Clean up test character
    await prisma.character.deleteMany({ where: { id } }).catch(() => {});
  }

  // Clean up synthetic user
  await prisma.$executeRaw`DELETE FROM "user" WHERE id = 'parity-test-user'`.catch(() => {});

  console.log(`\n${pass} passed, ${fail} failed`);
  if (fail > 0) process.exit(1);
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
