# Database Management

## Structure

```
init/                              ← mounted as docker-entrypoint-initdb.d
├── 00-init.sh                     # Orchestrator (runs everything in order)
├── 01-extensions/extensions.sql   # pg_trgm, unaccent
├── 02-schema/001_tables.sql       # All tables, indexes, constraints
├── 03-functions/                  # Stored procedures (idempotent, iterate freely)
│   ├── dice_and_utils.sql
│   ├── equipment_search.sql
│   ├── generate_character.sql
│   ├── get_character_full.sql
│   └── inventory_management.sql
├── 04-views/item_search.sql       # Materialized view
└── 05-seed/001_game_data.sql      # Game data (generate with db:dump-seed)

scripts/
├── db-reapply.sh                  # Reapply functions/views (Linux)
├── db-reapply.ps1                 # Reapply functions/views (Windows)
├── db-dump-seed.sh                # Dump seed data from running DB
└── fix-prod-drift.sql             # One-time production cleanup
```

## Workflows

### Changing a stored procedure
Edit the file in `init/03-functions/`, then reapply:
```bash
npm run db:reapply          # Linux/Mac
npm run db:reapply:win      # Windows
```

### Changing schema (tables, columns, indexes)
1. Edit `init/02-schema/001_tables.sql` (source of truth for fresh DBs)
2. Use Atlas to generate the diff for production:
   ```bash
   docker compose --profile ops run --rm schema-diff
   ```
3. Apply the diff on production via PhpPgAdmin

### Detecting drift
Atlas schema-diff now compares `init/02-schema/001_tables.sql` against
the running DB, instead of an old dump file.

### Deploying to production (mydevil.net)
- **Schema changes:** run Atlas diff, paste result in PhpPgAdmin
- **Functions/views:** paste the files from `init/03-functions/` and `init/04-views/` in PhpPgAdmin
- **First time:** run `scripts/fix-prod-drift.sql` to clean up stale function overload

## Philosophy
- **Schema** → `001_tables.sql` is the canonical source, Atlas generates diffs
- **Functions/views** → standalone files, reapplied on every deploy (idempotent)
- **Seed data** → dumped from working database
