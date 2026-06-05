import 'dotenv/config';
import { Client } from 'pg';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SEED_FILES = [
  '001_game_data.sql',
  '002_class_ability_modifiers.sql',
  '003_extra_modifiers.sql',
  '004_fix_hallucinated_abilities_migration.sql',
  // 005 skipped — ALTER TABLE for isAnonymous column, handled by Prisma migration
  '006_align_equipment_catalog.sql',
  '007_consumable_default_amounts.sql',
  '008_remove_ammo_consumable_tags.sql',
  '009_sync_class_ability_modifiers.sql',
];

const SEED_DIR = join(__dirname, '..', 'init', '05-seed');

// Each file gets its own connection so pg_dump's `set_config('search_path', '', false)`
// header in 001_game_data.sql doesn't bleed into subsequent files.
async function runFile(file: string): Promise<void> {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  const sql = readFileSync(join(SEED_DIR, file), 'utf-8');
  try {
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    await client.end();
  }
}

async function isAlreadySeeded(): Promise<boolean> {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    const res = await client.query('SELECT COUNT(*) FROM classes');
    return parseInt(res.rows[0].count, 10) > 0;
  } finally {
    await client.end();
  }
}

async function main() {
  if (await isAlreadySeeded()) {
    console.log('Catalog data already present — skipping seed.');
    return;
  }

  console.log('Seeding catalog data...');
  for (const file of SEED_FILES) {
    console.log(`  ${file}...`);
    await runFile(file);
  }
  console.log('Seed complete.');
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
