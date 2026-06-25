# Migrations

> **DEPRECATED — the custom runner is retired.** This directory and its
> runner (`scripts/migrate.js`) are **not applied by any environment**.
> The project is now **Prisma-only**: production (`deploy.yaml`), canary
> (`deploy-dev.yaml`), and dev (`compose.dev.yaml`) all run
> `prisma migrate deploy`, and the full live schema (extensions, fuzzy-search
> indexes, the `item_search` view, and the live functions) lives in
> `prisma/migrations/20260603000000_init_full`. Add new schema changes as
> **Prisma migrations** (`cd backend && npx prisma migrate dev --name <change>`),
> not files here. The notes below are kept for historical reference only.

---

Versioned, append-only SQL migrations. Each file is applied **once** and recorded in the `schema_migrations` table with a checksum.

## How `init/` and `migrations/` relate

`init/01-extensions/`, `init/02-schema/`, `init/05-seed/` are **frozen at the baseline** (= the state captured in `0001_baseline.sql`). They exist only so that `docker compose up` (which mounts `./init` into Postgres' `docker-entrypoint-initdb.d`) can produce a working dev DB on first startup without needing the migrate runner.

**Do not edit those frozen folders.** All schema and content changes from this point forward belong in `migrations/00NN_*.sql`.

`init/03-functions/` and `init/04-views/` are different — they hold idempotent `CREATE OR REPLACE` definitions that the runner re-applies on every deploy. Edit those files freely when the function/view body changes; no migration needed.

## Rules

1. **Filenames must sort lexicographically** in the order they should apply. Use a 4-digit zero-padded prefix: `0042_add_foo.sql`.
2. **Migrations are immutable.** Once a file has been applied to any environment, do not edit it. The runner verifies checksums and refuses to proceed if a recorded migration's content changed. To fix or revise: write a new migration.
3. **Each migration runs in a single transaction.** If your statement can't run in a transaction (e.g. `CREATE INDEX CONCURRENTLY`), split it into its own migration and document the caveat in a comment at the top.
4. **Idempotency is not required for migrations** — the runner won't re-apply them. But it's nice to have.
5. **Never put functions or views here.** Those live in `init/03-functions/` and `init/04-views/` and are re-applied (`CREATE OR REPLACE`) on every deploy.
6. **Seed/content changes** are migrations too. Use `INSERT ... ON CONFLICT DO NOTHING` if you want to be tolerant of partial prior state.

## How the runner works

`scripts/migrate.js` does, in order:

1. Ensures `schema_migrations(version, checksum, applied_at)` exists.
2. Applies any `migrations/*.sql` whose `version` (filename without `.sql`) is not yet in the table, in lexicographic order. Each in its own transaction.
3. Re-applies **every** file in `init/03-functions/` (function definitions, idempotent).
4. Re-applies **every** file in `init/04-views/` (view definitions, idempotent).
5. Refreshes every materialized view in the `public` schema.

## Local dev workflow

Your dev DB is bootstrapped from the **frozen** `init/` folders the first time you run `docker compose up`. To apply migrations on top of that baseline:

```bash
npm run migrate:local
```

This points at `localhost:5433` (the port `compose.yaml` exposes) with the dev credentials. It's a no-op when there's nothing pending — safe to run any time, especially after pulling.

When you add a schema change:

```bash
# 1. Create the migration file.
touch migrations/0042_add_foo.sql

# 2. Write the SQL (see "Rules" above).

# 3. Apply it to your local DB to verify.
npm run migrate:local
```

That's it. Don't touch `init/01,02,05`.

## Production / pipeline

The `migrate` service in `compose.prod.yaml` runs the same script as a one-shot before the `api` container starts. Woodpecker invokes it via:

```bash
docker compose -f compose.prod.yaml run --rm migrate
```

## Running against an arbitrary DB

`npm run migrate` (no `:local`) reads `DATABASE_HOST`, `DATABASE_PORT`, `DATABASE_USER`, `DATABASE_PASSWORD`, `DATABASE_NAME` from the environment and runs against whatever those point to. Use this from inside a container, or for one-off pointing at a non-default target.

## Adding a new migration

```bash
# Pick the next available version number.
ls migrations/ | tail
# Create it.
touch migrations/0042_add_foo.sql
```

Inside, write plain SQL. No magic.

```sql
ALTER TABLE characters ADD COLUMN IF NOT EXISTS foo text;
CREATE INDEX IF NOT EXISTS characters_foo_idx ON characters(foo);
```

If the change touches a function in `init/03-functions/` or a view in `init/04-views/`, edit those files too — they get re-applied automatically.
