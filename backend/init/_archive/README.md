# Archived SQL functions

These PL/pgSQL functions were the original Postgres-side implementations. They
were superseded by the TypeScript port during the Prisma migration (v0.3.0):

| Archived SQL | Replaced by |
|---|---|
| `generate_character.sql` | `src/lib/generate-character.ts` (seedable ChaCha20 roller) |
| `get_character_full.sql` | `src/lib/get-character-full.ts` |
| `update_character.sql` | direct `prisma.character.update` in `src/routes/characters/` |
| `004_rename_ammo_start_to_default_amount.sql` | a patch note for `get_character_full.sql` |

They are kept here **for reference only**. They are intentionally outside
`03-functions/` so `scripts/migrate.js` no longer re-applies them on every
deploy (it only scans `03-functions/` and `04-views/`).

Nothing in the runtime path calls these functions. The only remaining references
are dev-only migration-verification scripts (`scripts/test-parity-direct.ts`,
`scripts/capture-golden-corpus.ts`) which are themselves migration scaffolding
and can be removed once the cutover is considered final.
