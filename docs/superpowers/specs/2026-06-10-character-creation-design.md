# Character Creation Flow — Design

**Date:** 2026-06-10
**Branch:** `feat/character-creation`
**Status:** Approved

## Summary

An opt-in character creation flow where the player picks a class (or classless, or
random), sees a fully rolled scvm, re-rolls individual sections until satisfied, and
confirms. Rolls are strictly rules-as-written: every value comes from the dice — no
hand-picking. The existing silent auto-create (`/character/new`) is untouched.

## Decisions

| Question | Decision |
|---|---|
| Player freedom | RAW re-rolls only; classless scvm supported. No hand-picking values. |
| Entry point | Separate opt-in route (`/character/create`); silent auto-create stays. |
| Persistence | Draft until confirmed — no DB row until the player confirms. |
| Re-roll granularity | Section-level (stats+HP, gear, abilities, name, personality, omens+silver, origin). |
| Cascades | Auto-cascade: re-rolling stats re-derives HP and Presence-dependent gear quantities while keeping the same items. |
| Layout | Class gate screen first, then the sheet. Desktop: one-pager with per-section re-roll. Mobile: step wizard. Both are thin containers over shared section components. |
| Discovery | Two buttons wherever "new character" is offered: "Quick scvm" (instant random) and "Forge a scvm" (this flow). |

## Architecture: seed-based stateless drafts

The character becomes a pure function of `(class choice, section seeds)`, leaning on
the seedable ChaCha20 roller (`@tackgnol/rpg-tools-roller`).

```ts
type CharacterDraft = {
  classId: number | null;   // null + classless=true → classless scvm
  classless: boolean;
  seeds: SectionSeeds;
};

type SectionSeeds = {
  name: string;
  stats: string;        // 4 stats + HP roll
  omens: string;
  silver: string;
  origin: string;
  abilities: string;    // random ability picks + granted items
  gear: string;         // carry + table 1 + table 2 + weapon + armor + uses hydration
  personality: string;  // habit, tale, body description, trait1, trait2
};
```

Properties that fall out of this model:

1. **Auto-cascade is automatic.** A new stats seed re-runs the pipeline; the gear
   seed is unchanged, so gear rolls are identical but Presence-derived quantities
   (torches, lantern oil, ammo) re-derive, and HP re-derives from Toughness.
2. **No trust problem.** The client only ever submits seeds, and every seed is a
   legal seed — tampering yields a different fair roll. The server does all rolling.
3. **No server state, no orphans.** The draft IS the seed bundle. It lives in
   `sessionStorage` client-side and survives refresh. Abandonment costs nothing.

### Backend core refactor (`backend/src/lib/`)

- Split `generate-character.ts`'s main flow into per-section functions, each taking
  its own `Roller` seeded from the corresponding section seed. Section order in the
  pipeline is fixed and documented (determinism contract).
- New core: `buildCharacterData(draft, catalog/class) → CharacterData` — pure
  generation, no DB write.
- Existing `generateCharacter` becomes: random seeds → `buildCharacterData` →
  `prisma.character.create`. The current random-create path and the new flow share
  one pipeline.
- **Classless path:** skip class lookup; book defaults — no stat modifiers, d8 HP,
  2d6×10 silver, d10 weapon die, d4 armor die, no class abilities, no origin. The
  `abilities` and `origin` seeds are unused.
- **Class switch semantics:** changing class re-runs the pipeline with the same
  seeds ("same dice, new modifiers"). The class gate precedes rolling so this rarely
  surfaces, but "back to class pick" behaves sanely.

### Draft hydration

Extract the hydration half of `getCharacterFull` into
`hydrateCharacterRow(row, locale)`; `getCharacterFull(id, locale)` becomes fetch +
hydrate. The draft endpoints feed it in-memory `CharacterData` shaped like a row
(`id: null`). The frontend preview has exactly the shape of a real character read,
so sections render identically during creation and on the live sheet.

## API surface

All endpoints follow repository → service → controller layering with
`ServiceResult` / `sendServiceError`. JSON schemas live in `backend/src/schemas/`.

### `POST /api/characters/draft`

Body: `{ classId?: number, classless?: boolean, seeds?: SectionSeeds }`
(no classId and no classless → random class; `seeds` supplied → rehydrate an
existing draft, e.g. after refresh; otherwise generate fresh seeds).
Returns `{ draft, preview }`. Requires a session. No DB write.

### `POST /api/characters/draft/reroll/:section`

`section ∈ {name, stats, omens, silver, origin, abilities, gear, personality}` —
enum-validated path param, single handler. Body: `{ draft }`. Replaces that
section's seed with a fresh one, re-runs the pipeline, returns `{ draft, preview }`.

**Graduation path:** when a section someday needs custom behavior (e.g. ability
picking), register an explicit static route (`/draft/reroll/abilities`) with its own
schema and service method; Fastify prefers static segments over params, the other
sections are untouched, no client breaks.

### `POST /api/characters` (existing create)

Gains an optional `draft` body field. Present: validate shape, rebuild via
`buildCharacterData(draft)`, persist with ownership bound at creation (as today).
Absent: current random behavior — `useAutoCreateCharacter` is untouched.

### Cross-cutting

- **Validation:** seeds are opaque strings (max length 64); unknown section → 400;
  unknown `classId` → 404 `class_not_found`.
- **Rate limiting:** draft/reroll join the existing 30 req/min character bucket.
- **CSRF:** POSTs outside `/api/auth/*` — shared-auth double-submit applies as-is.
- **OpenAPI:** schema additions flow into the generated frontend client.

## Frontend

### Route

`/character/create`, lazy-loaded. Two internal phases: class gate → sheet. Phase
state lives in the page (no deep-linking into a half-built draft); refresh recovery
comes from sessionStorage.

### Components (atomic design, feature subfolders)

```
components/
├── organisms/character-create/
│   ├── ClassGate.tsx            # 6 class cards + Classless + Random, lore blurbs
│   ├── CreateSheetDesktop.tsx   # thin container: stacks all sections (one-pager)
│   ├── CreateSheetMobile.tsx    # thin container: wizard steps + live mini-summary
│   └── CreateSummaryBar.tsx     # sticky confirm bar (create + re-roll-everything)
└── molecules/character-create/
    ├── DraftSection.tsx         # generic frame: title, slot, re-roll button, rolling state
    ├── DraftStatsSection.tsx
    ├── DraftAbilitiesSection.tsx
    ├── DraftGearSection.tsx
    ├── DraftNameSection.tsx
    ├── DraftFlavorSection.tsx   # personality + origin
    └── DraftVitalsSection.tsx   # omens + silver
```

Visual sections map 1:1 to seeds except two grouped panels: `DraftVitalsSection`
hosts two independent re-roll controls (omens ⟳, silver ⟳) and
`DraftFlavorSection` hosts two (personality ⟳, origin ⟳). Each control calls
`/draft/reroll/:section` for its own seed — the API stays one-seed-per-call.

Container choice (desktop one-pager vs mobile wizard) via the theme's existing
breakpoint helpers. The sections are the product; the containers are thin.

### State — `useCharacterDraft`

- Holds `{ draft, preview }`; calls the three endpoints via the generated `$api`
  client.
- Re-roll: spinner on the affected section only (no optimistic data — only the
  server rolls). One re-roll in flight; queued clicks coalesce.
- Persists the seed bundle to `sessionStorage`; on mount with a stored draft,
  rehydrate via `POST /draft` with stored seeds.
- Confirm: `POST /api/characters` with the draft → set active character id,
  navigate to the sheet, invalidate the characters list. No interaction with the
  optimistic PATCH editor (no per-PATCH invalidation concern — this is a create).

### Entry points & i18n

Character list and header "new character" affordances get both buttons:
"Quick scvm" → `/character/new`, "Forge a scvm" → `/character/create`. All new keys
added to both `en.json` and `pl.json` (app is English-locked; pl kept in sync per
convention).

### Motion

Quiet, barely-there: a brief content fade on the section that changed. No ka-chunk.

## Error handling

- **Draft/reroll failure (network/5xx):** keep last preview, snackbar with retry.
  Nothing is lost — the seeds are still in hand. No auto-retry (user-initiated,
  retry just rolls again).
- **Confirm failure:** stay in the flow, snackbar with retry; draft survives.
- **Stored draft is stale** (deleted classId, corrupted storage): clear it, return
  to the class gate silently.
- **Session expiry mid-flow:** existing session-expired modal; seeds survive
  re-auth in sessionStorage.

## Testing

- **Backend unit (pipeline):** same `(class, seeds)` → identical output, twice;
  stats-seed-only change → gear item keys unchanged, Presence-derived quantities
  re-derived (auto-cascade contract pinned); classless produces book defaults;
  existing `generateCharacter` tests keep passing.
- **Backend unit (service):** draft/reroll/confirm with mocked repositories — auth
  required, unknown section → 400, dead classId → 404.
- **Frontend browser:** ClassGate renders 8 cards and dispatches; section re-roll
  updates only that section; confirm navigates to sheet; sessionStorage
  rehydration on remount.
- **E2E:** one happy path — open create, pick class, re-roll stats, confirm, land
  on the sheet with the character persisted.
- Validation checklist per CLAUDE.md before committing.

## Release mechanics

When the version is cut: bump both `package.json`s, add `release/<version>.md` and
a `release/README.md` row, add a ReleasePage card with `release.v<xyz>.*` keys in
both locales, tag `v<version>`.

## Non-goals (this iteration)

- Hand-picking abilities, stats, or items (RAW re-rolls only).
- Free-text name editing in the flow (the sheet already supports renaming).
- Cross-device draft persistence.
- Any change to the silent auto-create first-run flow.
