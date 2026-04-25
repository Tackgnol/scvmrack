#!/usr/bin/env node
// Database migration runner.
//
// Pipeline:
//   1. Ensure schema_migrations table exists.
//   2. Apply any migrations/*.sql not yet recorded (each in a transaction,
//      checksum-locked once applied).
//   3. Re-apply every file in init/03-functions/ and init/04-views/
//      (CREATE OR REPLACE — safe to run every deploy).
//   4. REFRESH MATERIALIZED VIEW item_search.
//
// Bails on first failure. Never partial-applies a migration.

import { readdir, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import pg from 'pg';

const { Client } = pg;
const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const MIGRATIONS_DIR = path.join(ROOT, 'migrations');
const FUNCTIONS_DIR = path.join(ROOT, 'init', '03-functions');
const VIEWS_DIR = path.join(ROOT, 'init', '04-views');

async function listSqlFiles(dir) {
    let entries;
    try {
        entries = await readdir(dir, { withFileTypes: true });
    } catch (err) {
        if (err.code === 'ENOENT') return [];
        throw err;
    }
    return entries
        .filter((e) => e.isFile() && e.name.endsWith('.sql'))
        .map((e) => e.name)
        .sort();
}

function checksum(text) {
    return createHash('sha256').update(text).digest('hex');
}

async function ensureSchemaTable(client) {
    await client.query(`
        CREATE TABLE IF NOT EXISTS schema_migrations (
            version    text        PRIMARY KEY,
            checksum   text        NOT NULL,
            applied_at timestamptz NOT NULL DEFAULT now()
        )
    `);
}

async function applyMigrations(client) {
    await ensureSchemaTable(client);

    const { rows } = await client.query(
        'SELECT version, checksum FROM schema_migrations'
    );
    const applied = new Map(rows.map((r) => [r.version, r.checksum]));

    const files = await listSqlFiles(MIGRATIONS_DIR);
    if (files.length === 0) {
        console.log('  (no migrations on disk)');
        return;
    }

    for (const file of files) {
        const version = file.replace(/\.sql$/, '');
        const sql = await readFile(path.join(MIGRATIONS_DIR, file), 'utf8');
        const sum = checksum(sql);

        if (applied.has(version)) {
            if (applied.get(version) !== sum) {
                throw new Error(
                    `Migration ${file} has been modified after being applied ` +
                        `(checksum mismatch). Migrations are immutable — ` +
                        `revert the file or create a new migration.`
                );
            }
            console.log(`  = ${file} (already applied)`);
            continue;
        }

        console.log(`  + ${file}`);
        await client.query('BEGIN');
        try {
            await client.query(sql);
            await client.query(
                'INSERT INTO schema_migrations (version, checksum) VALUES ($1, $2)',
                [version, sum]
            );
            await client.query('COMMIT');
        } catch (err) {
            await client.query('ROLLBACK');
            throw new Error(`Migration ${file} failed: ${err.message}`);
        }
    }
}

async function reapplyDir(client, dir, label) {
    const files = await listSqlFiles(dir);
    for (const file of files) {
        console.log(`  ~ ${label}/${file}`);
        const sql = await readFile(path.join(dir, file), 'utf8');
        await client.query(sql);
    }
}

async function refreshMaterializedViews(client) {
    const { rows } = await client.query(
        `SELECT relname FROM pg_class
         WHERE relkind = 'm' AND relnamespace = 'public'::regnamespace`
    );
    for (const row of rows) {
        console.log(`  ↻ refresh materialized view ${row.relname}`);
        await client.query(`REFRESH MATERIALIZED VIEW ${row.relname}`);
    }
}

async function main() {
    const client = new Client({
        host: process.env.DATABASE_HOST,
        port: Number(process.env.DATABASE_PORT) || 5432,
        user: process.env.DATABASE_USER,
        password: process.env.DATABASE_PASSWORD,
        database: process.env.DATABASE_NAME,
    });

    await client.connect();
    try {
        console.log('==> migrations');
        await applyMigrations(client);

        console.log('==> functions');
        await reapplyDir(client, FUNCTIONS_DIR, 'functions');

        console.log('==> views');
        await reapplyDir(client, VIEWS_DIR, 'views');

        console.log('==> materialized views');
        await refreshMaterializedViews(client);

        console.log('done.');
    } finally {
        await client.end();
    }
}

main().catch((err) => {
    console.error('migration failed:', err.message);
    process.exit(1);
});
