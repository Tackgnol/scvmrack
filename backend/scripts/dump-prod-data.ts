#!/usr/bin/env node
/**
 * dump-prod-data.ts
 *
 * Exports live user data from the database to a JSON file.
 * Preserves `user`, `account`, and `characters` rows across a tabula-rasa
 * migration that blows away and rebuilds the schema from Prisma migrations.
 *
 * Usage: node --import tsx backend/scripts/dump-prod-data.ts [output-file]
 * Defaults to dump.json in the current working directory.
 *
 * Reads DATABASE_URL from environment (or DATABASE_* vars); loads .env via dotenv.
 */
import 'dotenv/config';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import prisma from '../src/lib/prisma.js';

async function main(): Promise<void> {
  const outputPath = process.argv[2]
    ? resolve(process.argv[2])
    : resolve(process.cwd(), 'dump.json');

  console.log('Connecting to database…');

  const [users, accounts, characters] = await Promise.all([
    prisma.user.findMany(),
    prisma.account.findMany(),
    prisma.character.findMany(),
  ]);

  const counts = {
    users: users.length,
    accounts: accounts.length,
    characters: characters.length,
  };

  console.log(`Fetched: ${counts.users} users, ${counts.accounts} accounts, ${counts.characters} characters`);

  const dump = {
    meta: {
      exported_at: new Date().toISOString(),
      counts,
    },
    users,
    accounts,
    characters,
  };

  writeFileSync(outputPath, JSON.stringify(dump, null, 2), 'utf8');

  console.log(`Dump written to: ${outputPath}`);
}

main()
  .catch((err) => {
    console.error('Export failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
