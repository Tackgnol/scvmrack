# Changelog

All notable changes to Scvm Rack are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project aims to
follow [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.2] - 2026-06-06

Launch-readiness pass from the full-codebase audit
(`docs/launch-audit-2026-06-06.md`).

### Fixed
- **Character editor edit-loss.** Rapid edits could be silently dropped or
  reverted. Saves are now serialized, reconciled directly from the (already
  hydrated) PATCH response instead of refetching after every edit, auto-retried
  on transient 5xx/network failures, and flushed on unmount. This also removes a
  redundant `GET` per edit and fixes a locale cache-key mismatch between the
  query and the save path.
- **Orphaned characters.** New characters now bind their owner atomically at
  creation, so a partial failure can no longer leave an unowned, unreachable row.
- **Inventory stacking.** Distinct items that share a name (e.g. a d4 vs d6
  "Dagger", or a custom vs catalog item) no longer collapse into one corrupted
  stack; aggregation now keys on a stable item key / identity signature.
- **`origin` overflow.** The backend sanitizer capped `origin` at 1000 chars
  while the column is `VarChar(255)`; it is now bounded to 255 to prevent a
  failed insert.
- **Social share card.** Added the missing `preview.png` referenced by the OG/
  Twitter meta tags (links previewed blank before).
- **Auto-create race.** First-run character auto-create no longer uses a
  module-level abort controller shared across hook instances/tabs/StrictMode
  double-invokes, which could abort each other and duplicate or orphan creates;
  the controller is now per-instance.
- **Generation determinism.** Starting-weapon selection is now deterministic
  when several weapons share a roll slot, and granted class items/pets resolve
  by stable catalog key (with the legacy display-name map as fallback) so an
  item rename/translation no longer silently breaks granting.

### Added
- `sitemap.xml` and a `Sitemap:` directive in `robots.txt`.
- "Known issues" FAQ entry (English + Polish) documenting the stacked-item edit
  quirk and its workaround.

### Changed
- Dropped the 274 KB SVG favicon in favor of the existing PNG/ICO icons.
- Archived the superseded PL/pgSQL functions (`generate_character`,
  `get_character_full`, `update_character`) to `backend/init/_archive/` so they
  are no longer re-applied on every deploy.

### Internal
- Split the 466-line `useCurrentCharacter` god-hook into focused hooks
  (`useCharacterValidationIssues`, `useAutoCreateCharacter`,
  `useCharacterActions`); public API unchanged.
- Generator armor-catalog lookup is now O(1) via a `key` map instead of a
  per-item linear scan of the flattened catalog.
- Restructured **all three** route groups (characters, equipment, feedback) into
  Repository → Service → Controller behind a shared `services/result.ts`
  (`ServiceResult` type + `ok`/`fail`/`unexpected`) and a shared
  `sendServiceError` controller helper (4xx → client, 5xx → central
  handler/Sentry). Repositories (`character-`, `equipment-`, `feedback-`) own all
  Prisma/external access; services hold the logic; route files are thin
  controllers. The equipment `GET /:itemType/:id` duplication (parallel id/key
  if-else chains) collapses into single repository resolvers. Behavior and HTTP
  responses unchanged. Added service unit tests covering happy paths, the
  ownership/validation matrix, and every unexpected/5xx error mapping
  (characters 24, equipment 8, feedback 3); backend unit tests 40 → 75.

### Docs
- Added the launch audit report (`docs/launch-audit-2026-06-06.md`).

## [0.3.0] - 2026-06-05

Prisma migration and alpha prep. _(Backfilled.)_

### Changed
- **Character generation moved off Postgres.** `generate_character` and
  `get_character_full` were ported from PL/pgSQL to TypeScript, with character
  generation driven by a seedable ChaCha20 engine
  (`@tackgnol/rpg-tools-roller`) instead of Postgres `random()`. Character
  updates now go through Prisma directly rather than the `update_character`
  stored function.
- Database access standardized on Prisma (parameterized queries / tagged-
  template raw SQL).

### Fixed
- Frontend validation of character text-field limits.

### Added
- In-app bug report modal triggers and manual feedback surfaced in GlitchTip.
