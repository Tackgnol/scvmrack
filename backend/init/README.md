# `init/` — DEPRECATED (historical reference only)

> **This directory is no longer applied by any environment.** It is kept for
> historical reference. Do not add to it or edit it for new schema changes.

## Why this is dead

The project moved to a **Prisma-only** migration model. Every environment runs
`prisma migrate deploy`:

- **production** — `deploy.yaml`
- **canary** — `deploy-dev.yaml`
- **dev** — `compose.dev.yaml`

The Prisma migration `prisma/migrations/20260603000000_init_full` owns the
**entire live schema** — including the bits that used to live here:

- PostgreSQL extensions (`pg_trgm`, etc.) that were in `init/01-extensions/`,
- the fuzzy-search trigram indexes,
- the `item_search` view that was in `init/04-views/`,
- the live SQL functions (equipment search, inventory helpers, dice utils) that
  were in `init/03-functions/`.

Nothing invokes the old custom runner (`scripts/migrate.js`) on any live path,
so `init/01-extensions`, `init/02-schema`, `init/03-functions`, `init/04-views`,
and `init/05-seed` are all **off the live path**. (`00-init.sh` was the Postgres
`docker-entrypoint-initdb.d` bootstrap; the current dev/canary/prod flows apply
the Prisma migration instead.)

## Where things go now

- **Schema changes** → a new Prisma migration:
  `cd backend && npx prisma migrate dev --name <change>`.
- **Functions / views** → they are part of the Prisma migration SQL now; they
  are no longer re-applied from `init/03-functions` / `init/04-views`.
- **Seed/game data** → `backend/prisma/seed.ts` (`npm run prisma:seed`).

`init/_archive/` holds the already-dead PL/pgSQL (`generate_character`,
`get_character_full`, `update_character`) — see that folder's own README.
