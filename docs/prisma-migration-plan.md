# Prisma-First Migration Plan (Revised)

Migrate scvmrack so runtime backend code uses Prisma Client instead of raw SQL, and so
Prisma owns the schema from a clean slate. Live data is preserved by **dump-and-import**, not
by baselining Prisma onto the existing custom-SQL database.

This revision is grounded in the current repo state. Key facts it accounts for:

- Prisma migrations **already exist** (`20260508160000_init`,
  `20260508173000_link_characters_to_users`) but are **incomplete**: they create only the
  auth tables and then `ALTER` `characters`. The `characters` table, every game/catalog
  table, all functions, and the search view are created by the **custom `init/` SQL image**.
- `backend/prisma.config.ts` currently marks the game/schema tables (and `characters`) as
  `tables.external`, which is how Prisma coexists with the custom SQL today.
- **Decision: tabula rasa.** Rather than baseline Prisma onto the live custom-SQL schema, we
  start fresh — Prisma owns everything from its first migration — and re-import the live
  user-owned data from a dump. This removes the entire `resolve --applied` / external-table
  retirement complexity.
- **Decision: adopt `@tackgnol/rpg-tools-roller` as the RNG** (sibling package at
  `../rpg-tools-roller`). Replacing Postgres `random()` with the roller is a primary
  motivation for this migration. The roller has a pluggable engine (`OSRandomEngine` CSPRNG
  for prod) and a **seedable `ChaCha20Engine`** for deterministic tests, and is already
  property-tested + chi-square self-tested.
- Equipment search (`equipment/index.ts`) relies on weighted full-text search, `unaccent`,
  and `pg_trgm` similarity — **not expressible** through Prisma Client. It stays on raw SQL
  behind a Fastify cache (see Phase 6).
- `generate_character.sql` (614 lines) and `get_character_full.sql` (755 lines) are large,
  stateful, randomized PL/pgSQL. They are the dominant porting risk.

## Success Criteria

1. Live user-owned data (`user`, `account`, `characters`) is preserved across the cutover via
   dump-and-import; row counts and key checksums match before/after.
2. Existing REST API response shapes remain compatible.
3. Backend runtime code uses no raw Prisma SQL **except an explicit, documented allowlist**
   (currently: equipment search — see Phase 6).
4. Prisma owns schema and migrations from a clean slate; the custom DB init image is retired.
5. PostgreSQL-specific SQL remains allowed inside Prisma migrations for extensions, indexes,
   and the search view only.

## Data Safety Requirements

- Take a production DB backup **before** any cutover work.
- Preserve live data by **dump-and-import**, not in-place baselining. The dump set is
  `user` + `account` + `characters` (sessions/verification/claim_code are ephemeral or
  short-lived and may be dropped).
- Never use `prisma migrate reset` outside disposable local/test DBs.
- Never use destructive `prisma db push` against shared/prod DBs.
- Once tabula rasa is adopted, `backend/prisma.config.ts` `tables.external` is removed
  wholesale (Prisma owns the tables) — but only on the new Prisma-owned schema, never against
  the live custom-SQL DB.
- Seeds are **fresh-DB-only**. Post-launch catalog changes (new items, fixed translations)
  flow through ordinary Prisma migrations, not re-runnable seeds — so seeds can never clobber
  hand-corrected catalog rows.
- Dropping SQL functions/views is allowed **only after** runtime code no longer calls them.
- The cutover must be rehearsed end-to-end on a restored backup before the real rollout, with
  a row-count + catalog-checksum comparison.

---

## Phase 0: Regression Coverage

Establish behavioral nets **before** touching schema ownership or ports.

- Integration tests: character create, fetch, patch, list, delete.
- Equipment tests: search and full item fetch (capture current ranking/locale-fallback
  behavior as the baseline — see Phase 6 caveat).
- Localized response tests for `en` and `pl`.
- Generation **shape** invariants: stats present, class assigned, inventory/abilities/equipped
  items populated, hydrated uses resolved.
- A "no raw SQL" guard test that is **allowlist-driven** (not a blanket grep). It permits raw
  SQL only in files on an explicit allowlist (the equipment search path) and fails on any new
  occurrence. This lets it pass throughout the migration instead of failing from Phase 0–5.

## Phase 0.5: Data Export / Import (tabula rasa cutover)

Replaces in-place baselining. The goal is a repeatable script that rebuilds a clean
Prisma-owned database and re-loads live data.

- Build a dump script that exports `user`, `account`, and `characters` from prod (data only).
- Build an import script that, against a freshly migrated + seeded Prisma database, loads the
  dump in FK order (`user` → `account` → `characters`). `characters` JSON columns and
  `user_id` FK must round-trip unchanged.
- Rehearse the full cutover on a restored backup: fresh `migrate deploy` → seed → import dump.
- Verify: row counts for `user`/`account`/`characters` match the dump; catalog tables match
  the seed checksums; spot-check a hydrated character response is byte-identical pre/post.

## Phase 0.6: Roller + Parity Harness (precondition for Phases 4–5)

Adopting the roller makes generator randomness a **replacement**, not a reproduction of
Postgres `random()` — so "match the old SQL's random outcomes" is explicitly a non-goal.

- Add `@tackgnol/rpg-tools-roller` as a dependency. Production uses its CSPRNG engine; tests
  inject the **seeded `ChaCha20Engine`** so the generation/port becomes fully deterministic.
- The roller's dice engine is already tested — do **not** re-verify RNG quality. What still
  needs tests is the **port of scvmrack's game rules** (class selection, stats, equipment
  tables, omens, silver, auto-equip), which has only ever run in PL/pgSQL.
- **Generation (Phase 5):** lock behavior with seeded deterministic snapshot tests against the
  new TS implementation, plus rule invariants (HP within die range, every class gets its
  abilities, silver within formula bounds). No distribution-statistics gating in CI.
- **Hydration (Phase 4):** this side is deterministic given a fixed character row, so assert
  exact parity against a golden corpus captured from the current SQL (IDs/timestamps
  normalized), for every class and locale.
- This harness gates merge of Phases 4 and 5.

## Phase 1: Prisma Schema Ownership

- **Introspect** existing tables with `prisma db pull` to author faithful models —
  preserves `SERIAL`/sequence ownership, `INTEGER[]`/`TEXT[]`, `ARRAY[...]` and JSONB
  defaults exactly.
- Add Prisma models for all game tables (classes, abilities, origins, weapons, armors,
  equipment, pets, names, body_descriptions, habits, tales, traits, translations).
- Add the missing `Character.modifiers` field if applicable.
- Keep current table/column names via `@@map`/`@map`.
- Generate a single clean initial migration that creates the full schema (tabula rasa — no
  external-table coexistence to manage; remove `tables.external` from `prisma.config.ts`).
- Keep PostgreSQL extensions and indexes in custom migration SQL. Ensure extensions
  (`pg_trgm`, `unaccent`) are created in an early migration **before** any trigram/FTS index.
- Convert game seed SQL into a **fresh-DB-only** Prisma seed process.

## Phase 2: Replace Simple Runtime SQL

- Replace the character list join SQL with Prisma queries plus a translation lookup.
- Replace item full-lookup SQL with Prisma repositories for weapons, armors, equipment, pets.
- Replace test-fixture character creation with the new TypeScript generation service.
- Keep Fastify routes thin: auth, validation, service call, response.

## Phase 3: Port Character Update

- Replace `update_character` with `prisma.character.update` plus TS inventory-use hydration.
- Preserve patched/current presence behavior.
- Preserve current error behavior for unauthorized, forbidden, missing, invalid, and empty
  cases. **Explicitly map Prisma `P2025` to the existing `CHARACTER_NOT_FOUND` response**
  (the route currently detects not-found by string-matching the SQL `RAISE`; access is
  checked first, so this path is low-probability but must be preserved).

## Phase 4: Port Character Hydration

- Replace `get_character_full` with a TS `getFullCharacter(id, locale)` service. (Gated by
  the Phase 0.6 golden-corpus parity for localized/computed fields.)
- Resolve localized class, origin, traits, habit, tale, body description, abilities,
  inventory, storage, equipped weapons, armor, and pets through Prisma.
- Port computed modifiers, encumbrance, and DR calculations to TS.
- Return the same camelCase API shape the frontend already consumes.

## Phase 5: Port Character Generation

- Replace `generate_character` with a TS generation service that uses the roller for every
  random decision. (Gated by Phase 0.6 seeded snapshots + rule invariants.)
- Port dice helpers and stat-modifier logic onto the roller's API.
- Port class selection, stats, HP, omens, silver, personality, origin, abilities, starting
  equipment, granted items/pets, auto-equip, and inventory hydration.
- Create new characters with `userId` immediately instead of create-then-bind.

## Phase 6: Equipment Search (raw SQL + Fastify cache)

The current search uses weighted `to_tsvector`/`setweight` + `plainto_tsquery`, `unaccent`,
and `pg_trgm` similarity (`%`, `similarity()`, `ts_rank`). This cannot be replicated through
Prisma Client without losing fuzzy/multilingual behavior, so:

- Keep search on `$queryRaw` and add the `equipment/index.ts` search path to the Phase 0
  raw-SQL **allowlist** as a documented exception.
- Replace the `item_search` **materialized** view with a plain view (or the inline query) and
  put a **Fastify cache** in front of the search endpoint, keyed by `(query, locale, limit)`.
  The catalog is near-static between seeds, so caching is safe; invalidate the cache on the
  rare seed/catalog change. This removes all `REFRESH MATERIALIZED VIEW` machinery.
- Preserve the response shape `{ itemType, id, key, name }`, locale fallback, and limit
  behavior. The view definition and its indexes live in a Prisma migration (infrastructure).

## Phase 7: Legacy Cleanup

- Remove obsolete functions/views from init **only after** runtime code no longer uses them
  (note: the search view is retained per Phase 6).
- Replace the custom DB image with plain Postgres + `prisma migrate deploy` + seed +
  one-time data import — **after** the Phase 0.5 cutover is rehearsed against a restored
  backup.
- Update dev, integration, and production compose flows.
- Update docs/AGENTS notes if migration, seed, or dump/import commands change.

---

## Verification

- `cd backend && npm run build:ts`
- `cd backend && npm run test`
- `cd backend && npm run test:integration`
- `cd backend && npm run test:e2e`
- `cd frontend && npm run test:browser` when frontend-visible behavior is touched.
- Roller parity harness (Phase 0.6) green before Phases 4–5 merge.
- Cutover dry-run on a restored backup: fresh `migrate deploy` → seed → import dump →
  row-count + catalog-checksum comparison; spot-check a hydrated character is identical
  pre/post.

## Assumptions

- Live user-owned data must survive the cutover (preserved via dump-and-import, not in place).
- Existing API behavior is mandatory.
- Saved character inventory remains JSON for this migration.
- `@tackgnol/rpg-tools-roller` is the RNG; reproducing Postgres `random()` outcomes is a
  non-goal.
- Equipment search stays on raw SQL behind a Fastify cache (sanctioned allowlist exception).
- Seeds are fresh-DB-only; post-launch catalog edits ship as migrations.
- Prisma migrations may include PostgreSQL-specific SQL for non-runtime database
  infrastructure (extensions, indexes, the search view).
- Work lands in small PRs, with the risky ports isolated behind the roller parity harness and
  tests.
