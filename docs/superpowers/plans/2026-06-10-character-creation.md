# Character Creation Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Opt-in character creation flow: pick a class (or classless/random), see a fully rolled MÖRK BORG character, re-roll sections until satisfied, confirm — backed by seed-based stateless drafts.

**Architecture:** The character becomes a pure function of `(class choice, per-section ChaCha20 seeds)`. `generate-character.ts` is refactored so each generation section takes its own `Roller` via a `rollerFor(section)` factory; the legacy random path passes one shared roller (existing tests stay byte-for-byte green), the draft path passes per-section seeded rollers. Draft/reroll endpoints regenerate the whole pipeline from seeds — cascades (Presence→gear quantities, Toughness→HP) fall out automatically. Drafts are never persisted; the seed bundle lives in the client's sessionStorage.

**Tech Stack:** Fastify 5 + Prisma (repository→service→controller layering, `ServiceResult`), `@tackgnol/rpg-tools-roller` (ChaCha20Engine from `/test-utils` subpath export), React 18 + TanStack Router/Query + MUI, node:test + `mock.module` (backend), vitest browser mode (frontend).

**Spec:** `docs/superpowers/specs/2026-06-10-character-creation-design.md`

**Branch:** `feat/character-creation` (already created from `dev`)

**2026-06-13 scope update:** classless drafts now expose the MÖRK BORG `4d6, drop the lowest` rule as an explicit stat-choice step. The backend returns all four dice plus LOW/MAX totals for each ability; the draft stores `dropLowestAbilities`; confirming a classless draft requires exactly two selected MAX abilities.

---

## Codebase facts the implementer must know

- **Backend unit tests:** run from `backend/tests/unit-be/` with `npm test` (which is `node --import tsx --experimental-test-module-mocks --test "**/*.test.ts"`). Run a single file with `node --import tsx --experimental-test-module-mocks --test <file>.test.ts` in that directory. `mock.module(...)` calls MUST appear before the `await import(...)` of the module under test.
- **The existing create endpoint is `POST /api/characters/new`** (not `POST /api/characters`). Routes for the `characters` group live in `backend/src/routes/characters/index.ts`, autoloaded under `/api/characters`.
- **Never put Prisma calls or business logic in route files.** Repository (`src/repositories/`) → Service (`src/services/`, returns `ServiceResult`) → Controller (thin, uses `sendServiceError`).
- **`ChaCha20Engine`** is exported from `@tackgnol/rpg-tools-roller/test-utils` (see the package's `exports` map). It takes a `Uint8Array` seed. Despite the subpath name it is the deterministic engine this feature is built on; importing it in prod code is intentional.
- **`pickRandom` rolls `1dN` even when N=1** — preserve this so legacy scripted-roller tests keep their exact roll sequences.
- **Frontend generated client:** `frontend/src/api/schema.ts` comes from `npm run generate-api` (needs a running backend at `localhost:3000`). To avoid blocking on a live backend, new endpoints get a thin typed wrapper module (`frontend/src/api/draft.ts`) using the shared `client` (so CSRF/auth middleware apply). Regenerating schema.ts later is optional and non-breaking.
- **Frontend browser tests** use `vitest-browser-react` + `vi.mock` of `@/api`, `@/hooks/useAuth` etc. (see `frontend/test/browser/pages/CharactersListPage.test.tsx` for the canonical pattern).
- **i18n:** every new key goes into BOTH `frontend/src/i18n/en.json` and `pl.json`. App is English-locked but pl stays in sync.
- **Commits:** NEVER add a `Co-Authored-By` trailer.
- **Validation before finishing frontend tasks:** `cd frontend && npx tsc --noEmit && npm run lint`; browser tests + `npm run doctor` when components/hooks were touched.

## File structure (what gets created/modified)

```
backend/src/lib/draft-seeds.ts                      CREATE  seed types/helpers, seeded roller factory
backend/src/lib/generate-character.ts               MODIFY  extract buildCharacterData(classId, rollerFor); classless; createCharacterFromDraft
backend/src/lib/get-character-full.ts               MODIFY  extract hydrateCharacterRow(row, locale)
backend/src/repositories/character-repository.ts    MODIFY  + classExists(id), listClasses(locale)
backend/src/services/character-draft-service.ts     CREATE  createDraft / rerollSection / listClasses
backend/src/services/character-service.ts           MODIFY  generate() accepts optional draft
backend/src/schemas/draft.ts                        CREATE  Draft/Reroll/ClassList JSON schemas
backend/src/schemas/character.ts                    MODIFY  GenerateBodySchema gains optional draft
backend/src/routes/characters/index.ts              MODIFY  + POST /draft, POST /draft/reroll/:section, GET /classes
backend/tests/unit-be/draft-seeds.test.ts           CREATE
backend/tests/unit-be/generate-character.test.ts    MODIFY  (+ determinism & classless tests; existing tests unchanged)
backend/tests/unit-be/character-draft-service.test.ts CREATE
backend/tests/unit-be/character-service.test.ts     MODIFY  (+ generate-with-draft tests)
backend/tests/unit-be/characters-route.test.ts      MODIFY  (+ new route wiring tests)

frontend/src/api/draft.ts                           CREATE  typed client wrappers + shared draft types
frontend/src/hooks/useCharacterDraft.ts             CREATE  draft state machine + sessionStorage
frontend/src/components/organisms/character-create/ClassGate.tsx          CREATE
frontend/src/components/organisms/character-create/CreateSheetDesktop.tsx CREATE
frontend/src/components/organisms/character-create/CreateSheetMobile.tsx  CREATE
frontend/src/components/organisms/character-create/CreateSummaryBar.tsx   CREATE
frontend/src/components/molecules/character-create/DraftSection.tsx       CREATE
frontend/src/components/molecules/character-create/DraftStatsSection.tsx  CREATE
frontend/src/components/molecules/character-create/DraftAbilitiesSection.tsx CREATE
frontend/src/components/molecules/character-create/DraftGearSection.tsx   CREATE
frontend/src/components/molecules/character-create/DraftNameSection.tsx   CREATE
frontend/src/components/molecules/character-create/DraftFlavorSection.tsx CREATE
frontend/src/components/molecules/character-create/DraftVitalsSection.tsx CREATE
frontend/src/pages/CharacterCreatePage.tsx          CREATE
frontend/src/router/index.tsx                       MODIFY  + /character/create route
frontend/src/pages/CharactersListPage.tsx           MODIFY  + "Forge a scvm" button
frontend/src/i18n/en.json + pl.json                 MODIFY  + create.* keys
frontend/test/unit/hooks/useCharacterDraft.test.ts  CREATE
frontend/test/browser/organisms/ClassGate.test.tsx  CREATE
frontend/test/browser/pages/CharacterCreatePage.test.tsx CREATE
backend/tests/e2e/tests/authed/character-create.spec.ts CREATE
```

---

### Task 1: Seed helpers (`draft-seeds.ts`)

**Files:**
- Create: `backend/src/lib/draft-seeds.ts`
- Test: `backend/tests/unit-be/draft-seeds.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// backend/tests/unit-be/draft-seeds.test.ts
import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  DRAFT_SECTIONS,
  SEED_PATTERN,
  isSectionSeeds,
  randomSectionSeeds,
  randomSeed,
  seededRollerFor,
} from '../../src/lib/draft-seeds.js';

test('randomSeed produces 64-char lowercase hex and differs between calls', () => {
  const a = randomSeed();
  const b = randomSeed();
  assert.match(a, SEED_PATTERN);
  assert.match(b, SEED_PATTERN);
  assert.notEqual(a, b);
});

test('randomSectionSeeds covers every section with valid seeds', () => {
  const seeds = randomSectionSeeds();
  assert.deepEqual(Object.keys(seeds).sort(), [...DRAFT_SECTIONS].sort());
  for (const section of DRAFT_SECTIONS) {
    assert.match(seeds[section], SEED_PATTERN);
  }
});

test('isSectionSeeds accepts valid bundles and rejects bad ones', () => {
  assert.equal(isSectionSeeds(randomSectionSeeds()), true);
  assert.equal(isSectionSeeds(null), false);
  assert.equal(isSectionSeeds({}), false);
  const missing = { ...randomSectionSeeds() } as Record<string, string>;
  delete missing.gear;
  assert.equal(isSectionSeeds(missing), false);
  const badHex = { ...randomSectionSeeds(), stats: 'XYZ' };
  assert.equal(isSectionSeeds(badHex), false);
});

test('seededRollerFor is deterministic per seed and caches per section', async () => {
  const seeds = randomSectionSeeds();
  const rollerFor = seededRollerFor(seeds);

  // Same instance returned for the same section (sequence continuity).
  assert.equal(rollerFor('stats'), rollerFor('stats'));

  // Two factories over identical seeds produce identical roll sequences.
  const again = seededRollerFor({ ...seeds });
  const seq1 = [
    (await rollerFor('gear').roll('1d20')).total,
    (await rollerFor('gear').roll('1d20')).total,
    (await rollerFor('gear').roll('1d20')).total,
  ];
  const seq2 = [
    (await again('gear').roll('1d20')).total,
    (await again('gear').roll('1d20')).total,
    (await again('gear').roll('1d20')).total,
  ];
  assert.deepEqual(seq1, seq2);

  // A different seed gives a different sequence (overwhelmingly likely over 3d20).
  const other = seededRollerFor({ ...seeds, gear: randomSeed() });
  const seq3 = [
    (await other('gear').roll('1d20')).total,
    (await other('gear').roll('1d20')).total,
    (await other('gear').roll('1d20')).total,
  ];
  assert.notDeepEqual(seq1, seq3);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run (in `backend/tests/unit-be/`): `node --import tsx --experimental-test-module-mocks --test draft-seeds.test.ts`
Expected: FAIL — `Cannot find module '../../src/lib/draft-seeds.js'`

- [ ] **Step 3: Write the implementation**

```ts
// backend/src/lib/draft-seeds.ts
/**
 * Seed model for the character creation flow.
 *
 * A draft character is a pure function of (class choice, per-section seeds):
 * each generation section rolls on its own ChaCha20-seeded Roller, so replacing
 * one section's seed re-rolls exactly that section while every cross-section
 * derivation (Presence→gear quantities, Toughness→HP) recomputes naturally.
 */
import { randomBytes } from 'node:crypto';
import { Roller } from '@tackgnol/rpg-tools-roller';
// Deliberate prod import: the test-utils subpath is where the package exports
// its deterministic seedable engine, which this feature is built on.
import { ChaCha20Engine } from '@tackgnol/rpg-tools-roller/test-utils';

export const DRAFT_SECTIONS = [
  'name',
  'stats',
  'omens',
  'silver',
  'origin',
  'abilities',
  'gear',
  'personality',
] as const;

export type DraftSection = (typeof DRAFT_SECTIONS)[number];
export type SectionSeeds = Record<DraftSection, string>;
export type RollerFor = (section: DraftSection) => Roller;

export interface CharacterDraft {
  classId: number | null;
  classless: boolean;
  seeds: SectionSeeds;
}

/** 32 random bytes, hex-encoded. */
export const SEED_PATTERN = /^[0-9a-f]{64}$/;

export function randomSeed(): string {
  return randomBytes(32).toString('hex');
}

export function randomSectionSeeds(): SectionSeeds {
  return Object.fromEntries(
    DRAFT_SECTIONS.map((section) => [section, randomSeed()])
  ) as SectionSeeds;
}

export function isSectionSeeds(value: unknown): value is SectionSeeds {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }
  const record = value as Record<string, unknown>;
  return DRAFT_SECTIONS.every(
    (section) =>
      typeof record[section] === 'string' && SEED_PATTERN.test(record[section] as string)
  );
}

/**
 * Per-section seeded roller factory. Returns the SAME Roller instance for
 * repeated calls with the same section, so multi-roll sections (gear pool +
 * inventory-uses hydration) consume one continuous deterministic sequence.
 */
export function seededRollerFor(seeds: SectionSeeds): RollerFor {
  const cache = new Map<DraftSection, Roller>();
  return (section) => {
    let roller = cache.get(section);
    if (!roller) {
      roller = new Roller({
        engine: new ChaCha20Engine(Uint8Array.from(Buffer.from(seeds[section], 'hex'))),
      });
      cache.set(section, roller);
    }
    return roller;
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --import tsx --experimental-test-module-mocks --test draft-seeds.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add backend/src/lib/draft-seeds.ts backend/tests/unit-be/draft-seeds.test.ts
git commit -m "feat(backend): add per-section seed model for character drafts"
```

---

### Task 2: Refactor `generate-character.ts` to `buildCharacterData(classId, rollerFor)`

**Files:**
- Modify: `backend/src/lib/generate-character.ts`
- Test: `backend/tests/unit-be/generate-character.test.ts` (existing tests MUST pass unchanged)

The refactor extracts the body of `generateCharacter` (steps 2–11, everything between class resolution and the `prisma.character.create`) into an exported `buildCharacterData`. Every roll site switches from the single `roller` parameter to `rollerFor(<section>)`. The legacy `generateCharacter` passes `() => roller`, so the shared roller consumes the exact same sequence as before — the scripted-roller tests are the regression harness for this step.

- [ ] **Step 1: Run existing tests to establish the baseline**

Run (in `backend/tests/unit-be/`): `node --import tsx --experimental-test-module-mocks --test generate-character.test.ts`
Expected: PASS (4 tests). If not, stop — the baseline is broken.

- [ ] **Step 2: Apply the refactor**

In `backend/src/lib/generate-character.ts`:

1. Add imports at the top:

```ts
import type { DraftSection, RollerFor } from './draft-seeds.js';
```

2. Add the exported data type and classless defaults near the internal types:

```ts
/** Everything prisma.character.create needs except userId. */
export interface CharacterData {
  name: string;
  classId: number | null;
  origin: string | null;
  strength: number;
  agility: number;
  presence: number;
  toughness: number;
  maxHp: number;
  currentHp: number;
  omens: number;
  maxOmens: number;
  silver: number;
  habit: string | null;
  tale: string | null;
  bodyDescription: string | null;
  trait1: string | null;
  trait2: string | null;
  abilities: object[];
  equipment: unknown[];
  equippedWeapons: object[];
  equippedArmor: object | null;
}

/**
 * Classless scvm (MÖRK BORG core rules): no stat modifiers, d8 HP, 2d6×10
 * silver, d10 weapon die, d4 armor die, no class abilities, no origin.
 */
const CLASSLESS_DEFAULTS = {
  hpDie: 8,
  silverDice: [6, 6],
  silverModifier: 10,
  weaponDie: 10,
  armorDie: 4,
  statModifiers: {} as Record<string, number>,
  randomAbilityCount: 0,
};
```

3. Replace the body of `generateCharacter` from step 2 ("Pre-load all catalog data") through step 11 ("Personality") with a call to the new function, keeping class resolution and the insert:

```ts
export async function generateCharacter(
  classId: number | null,
  roller: Roller,
  userId?: string,
): Promise<string> {
  // 1. Resolve class (random if not supplied) — rolls on the caller's roller
  //    BEFORE any section roll, preserving the legacy sequence.
  let resolvedClassId: number;
  if (classId !== null) {
    resolvedClassId = classId;
  } else {
    const classes = await prisma.class.findMany({ select: { id: true } });
    const picked = await pickRandom(classes, roller);
    if (!picked) throw new Error('No classes found in database');
    resolvedClassId = picked.id;
  }

  // Shared roller for every section: identical roll sequence to the
  // pre-refactor implementation.
  const data = await buildCharacterData(resolvedClassId, () => roller);

  const character = await prisma.character.create({
    data: {
      ...(userId ? { userId } : {}),
      ...data,
      abilities: data.abilities as object[],
      equipment: data.equipment as object[],
      equippedWeapons: data.equippedWeapons as object[],
      equippedArmor: (data.equippedArmor as object | null) ?? Prisma.DbNull,
    },
    select: { id: true },
  });

  return character.id;
}
```

4. Add `buildCharacterData` containing the moved steps. `classId === null` means **classless**. Each section uses `rollerFor('<section>')`; multi-roll sections fetch the roller once at the top of the section:

```ts
/**
 * Build a full character payload without persisting it.
 *
 * `classId === null` produces a classless scvm (book defaults, no class
 * abilities, no origin). All randomness goes through `rollerFor(section)`;
 * pass `() => roller` for legacy single-roller behavior or
 * `seededRollerFor(seeds)` for deterministic per-section drafts.
 *
 * SECTION ORDER IS A DETERMINISM CONTRACT — do not reorder the section
 * blocks below; reordering changes what existing seeds reproduce.
 */
export async function buildCharacterData(
  classId: number | null,
  rollerFor: RollerFor,
): Promise<CharacterData> {
  const cls = classId !== null
    ? await prisma.class.findUniqueOrThrow({ where: { id: classId } })
    : null;

  // Pre-load all catalog data in parallel (origins only exist for classes).
  const [names, origins, weapons, armors, equips, pets] = await Promise.all([
    prisma.name.findMany({ select: { name: true } }),
    classId !== null
      ? prisma.origin.findMany({ where: { classId }, select: { key: true } })
      : Promise.resolve([] as Array<{ key: string }>),
    prisma.weapon.findMany({ orderBy: { id: 'asc' } }),
    prisma.armor.findMany(),
    prisma.equipment.findMany(),
    prisma.pet.findMany({ select: { key: true, tags: true } }),
  ]);

  const catalog = buildCatalogCache(weapons, armors, equips, pets);

  const hpDie = cls?.hpDie ?? CLASSLESS_DEFAULTS.hpDie;
  const silverDice = cls?.silverDice ?? CLASSLESS_DEFAULTS.silverDice;
  const silverModifier = cls?.silverModifier ?? CLASSLESS_DEFAULTS.silverModifier;
  const weaponDie = cls?.weaponDie ?? CLASSLESS_DEFAULTS.weaponDie;
  const armorDie = cls?.armorDie ?? CLASSLESS_DEFAULTS.armorDie;
  const statModifiers = (cls?.statModifiers ?? CLASSLESS_DEFAULTS.statModifiers) as Record<string, number>;

  // ── Section: stats (4 stats + HP) ────────────────────────────────────────
  const statsRoller = rollerFor('stats');
  const strength  = (await roll3d6(statsRoller)) + (statModifiers.strength  ?? 0);
  const agility   = (await roll3d6(statsRoller)) + (statModifiers.agility   ?? 0);
  const presence  = (await roll3d6(statsRoller)) + (statModifiers.presence  ?? 0);
  const toughness = (await roll3d6(statsRoller)) + (statModifiers.toughness ?? 0);
  const hpRoll = await rollDie(hpDie, statsRoller);
  const maxHp = Math.max(1, hpRoll + rollToModifier(toughness));

  // ── Section: omens ───────────────────────────────────────────────────────
  const omens = await rollDie(2, rollerFor('omens'));

  // ── Section: silver ──────────────────────────────────────────────────────
  const silverRoller = rollerFor('silver');
  let silver = 0;
  for (const die of silverDice) {
    silver += await rollDie(die, silverRoller);
  }
  silver *= silverModifier;

  // ── Section: name ────────────────────────────────────────────────────────
  const name = (await pickRandom(names, rollerFor('name')))?.name ?? 'Unknown';

  // ── Section: origin (classless has none; empty list rolls nothing) ──────
  const origin = (await pickRandom(origins, rollerFor('origin')))?.key ?? null;

  // ── Section: abilities + granted items ──────────────────────────────────
  const { abilities, grantedItems } = classId !== null
    ? await buildAbilityBundle(classId, rollerFor('abilities'), catalog)
    : { abilities: [] as AbilityEntry[], grantedItems: [] as PoolItem[] };

  // ── Section: gear (item pool, auto-equip, uses hydration) ───────────────
  const gearRoller = rollerFor('gear');
  const pool = await buildItemPool(
    weaponDie,
    armorDie,
    presence,
    gearRoller,
    catalog,
    equips,
    grantedItems,
  );
  const bundle = autoEquipItems(pool, catalog);
  const hydratedEquipment = await hydrateInventoryUses(
    bundle.equipment,
    presence,
    true,
    gearRoller,
  ) as unknown[];

  // ── Section: personality ─────────────────────────────────────────────────
  const personality = await pickPersonality(rollerFor('personality'));

  return {
    name,
    classId,
    origin,
    strength,
    agility,
    presence,
    toughness,
    maxHp,
    currentHp: maxHp,
    omens,
    maxOmens: omens,
    silver,
    habit: personality.habit,
    tale: personality.tale,
    bodyDescription: personality.bodyDescription,
    trait1: personality.trait1,
    trait2: personality.trait2,
    abilities: abilities as object[],
    equipment: hydratedEquipment,
    equippedWeapons: bundle.equippedWeapons as object[],
    equippedArmor: bundle.equippedArmor,
  };
}
```

Note the section order — stats, omens, silver, name, origin, abilities, gear, personality — matches the pre-refactor single-roller call order exactly. The `DraftSection` import is used by `RollerFor`; if TS flags `DraftSection` unused, drop it from the import (only `RollerFor` is needed).

- [ ] **Step 3: Run existing tests — they must pass UNCHANGED**

Run: `node --import tsx --experimental-test-module-mocks --test generate-character.test.ts`
Expected: PASS (4 tests). The scripted rollers verify byte-for-byte sequence preservation. If a sequence assertion fails, a section block was reordered or a roller is fetched in the wrong place — fix the refactor, do NOT touch the tests.

- [ ] **Step 4: Run the whole backend suite**

Run (in `backend/tests/unit-be/`): `npm test`  *(note: backend root `npm test` also runs frontend unit tests; from `tests/unit-be/` it runs only the backend files — use the directory-local run here)*
Expected: PASS — `character-service.test.ts` and `characters-route.test.ts` mock `generate-character.js` and are unaffected.

- [ ] **Step 5: Commit**

```bash
git add backend/src/lib/generate-character.ts
git commit -m "refactor(backend): extract buildCharacterData with per-section roller factory"
```

---

### Task 3: Determinism + classless tests for `buildCharacterData`

**Files:**
- Modify: `backend/tests/unit-be/generate-character.test.ts` (append new tests; do not edit existing ones)

These tests use REAL seeded rollers (no scripting) against the existing prisma mock fixture, pinning the three contracts: full determinism, stats-seed isolation (auto-cascade), and classless defaults.

- [ ] **Step 1: Append the failing tests**

Add to the imports at the top of the file (after the existing `Roller` type import):

```ts
import { randomSectionSeeds, seededRollerFor } from '../../src/lib/draft-seeds.js';
```

And change the module-under-test import line to also pull the new export:

```ts
const { generateCharacter, buildCharacterData } = await import('../../src/lib/generate-character.js');
```

Append at the end of the file:

```ts
test('buildCharacterData is deterministic for identical seeds', async () => {
  resetFixture();
  const seeds = randomSectionSeeds();

  const first = await buildCharacterData(1, seededRollerFor(seeds));
  const second = await buildCharacterData(1, seededRollerFor({ ...seeds }));

  assert.deepEqual(first, second);
  // Nothing was persisted.
  assert.deepEqual(fixture.createdCharacters, []);
});

test('re-seeding only stats keeps gear identity but re-derives quantities (auto-cascade)', async () => {
  resetFixture();
  const seeds = randomSectionSeeds();

  const base = await buildCharacterData(1, seededRollerFor(seeds));

  // Find a stats seed that lands a different presence, to exercise cascade.
  let rerolled = base;
  for (let i = 0; i < 50 && rerolled.presence === base.presence; i++) {
    rerolled = await buildCharacterData(
      1,
      seededRollerFor({ ...seeds, stats: randomSectionSeeds().stats }),
    );
  }
  assert.notEqual(rerolled.presence, base.presence, 'expected a different presence within 50 attempts');

  // Same gear seed ⇒ same d12/d6 table outcomes ⇒ the SET of distinct item
  // keys is stable — EXCEPT ammo (arrows/bolts), whose count is derived from
  // Presence and materialized as repeated entries; a count hitting 0 removes
  // the key entirely. That changing quantity IS the auto-cascade under test,
  // so ammo keys are excluded from the identity assertion.
  const AMMO_KEYS = new Set(['equipment.arrows', 'equipment.bolts']);
  const keys = (c: { equipment: unknown[] }) =>
    [...new Set(
      c.equipment
        .map((i) => (i as { key: string }).key)
        .filter((k) => !AMMO_KEYS.has(k))
    )].sort();
  assert.deepEqual(keys(rerolled), keys(base));
  // Item identity that must never cascade: weapon and armor picks.
  assert.deepEqual(rerolled.equippedWeapons, base.equippedWeapons);
  assert.deepEqual(rerolled.equippedArmor, base.equippedArmor);

  // Non-dependent sections are untouched.
  assert.equal(rerolled.name, base.name);
  assert.equal(rerolled.silver, base.silver);
  assert.equal(rerolled.omens, base.omens);
  assert.deepEqual(rerolled.abilities, base.abilities);

  // HP re-derives from the new toughness/stats roll.
  // (maxHp may coincide; the contract is it was recomputed, which determinism
  // already guarantees — assert stats actually changed instead.)
  assert.notDeepEqual(
    [rerolled.strength, rerolled.agility, rerolled.presence, rerolled.toughness],
    [base.strength, base.agility, base.presence, base.toughness],
  );
});

test('buildCharacterData(null) produces a classless scvm with book defaults', async () => {
  resetFixture();
  const seeds = randomSectionSeeds();

  const c = await buildCharacterData(null, seededRollerFor(seeds));

  assert.equal(c.classId, null);
  assert.equal(c.origin, null);
  assert.deepEqual(c.abilities, []);
  // Silver: 2d6 × 10 ⇒ between 20 and 120.
  assert.ok(c.silver >= 20 && c.silver <= 120, `silver ${c.silver} out of 2d6×10 range`);
  // Stats: plain 3d6, no class modifiers ⇒ 3..18.
  for (const stat of [c.strength, c.agility, c.presence, c.toughness]) {
    assert.ok(stat >= 3 && stat <= 18, `stat ${stat} out of unmodified 3d6 range`);
  }
  assert.ok(c.maxHp >= 1);
  assert.equal(c.currentHp, c.maxHp);
});
```

> The fixture's `class.findUniqueOrThrow` throws for unknown ids but `buildCharacterData(null, …)` never calls it — if the classless test errors with "Class … not found", the classless guard in the implementation is wrong.

- [ ] **Step 2: Run to verify the new tests fail or pass for the right reason**

Run: `node --import tsx --experimental-test-module-mocks --test generate-character.test.ts`
Expected: PASS if Task 2 was implemented correctly (these tests pin behavior that should already exist). If `auto-cascade` fails on the distinct-keys assertion, inspect whether the gear roller is being shared with another section (it must be exclusive to the gear block). If `classless` fails, check the `classId !== null` guards.

- [ ] **Step 3: Commit**

```bash
git add backend/tests/unit-be/generate-character.test.ts
git commit -m "test(backend): pin draft determinism, auto-cascade, and classless contracts"
```

---

### Task 4: Extract `hydrateCharacterRow` from `getCharacterFull`

**Files:**
- Modify: `backend/src/lib/get-character-full.ts`
- Test: existing `backend/tests/unit-be/get-character-full.test.ts` must stay green

- [ ] **Step 1: Apply the extraction**

In `get-character-full.ts`, the current `getCharacterFull(id, locale)` does: (1) `prisma.character.findUnique` then (2) hydrates `row`. Split it:

```ts
/**
 * Structural shape of a character row for hydration. A real Prisma row
 * satisfies it; so does an in-memory draft preview (id: null, fresh dates).
 */
export interface CharacterRowLike {
  id: string | null;
  name: string;
  classId: number | null;
  origin: string | null;
  strength: number;
  agility: number;
  presence: number;
  toughness: number;
  maxHp: number;
  currentHp: number;
  omens: number;
  maxOmens: number;
  silver: number;
  habit: string | null;
  tale: string | null;
  bodyDescription: string | null;
  trait1: string | null;
  trait2: string | null;
  notes?: string | null;
  abilities: unknown;
  equipment: unknown;
  storage?: unknown;
  equippedWeapons: unknown;
  equippedArmor: unknown;
  modifiers?: unknown;
  createdAt: Date;
  updatedAt: Date;
}

export async function getCharacterFull(
  id: string,
  locale: string,
): Promise<Record<string, unknown> | null> {
  const row = await prisma.character.findUnique({ where: { id } });
  if (!row) return null;
  return hydrateCharacterRow(row as unknown as CharacterRowLike, locale);
}

/**
 * Resolve catalog/translation data and computed fields for a row-shaped
 * character. Pure with respect to the `characters` table — only reads
 * catalog/translation tables. Used for both real reads and draft previews.
 */
export async function hydrateCharacterRow(
  row: CharacterRowLike,
  locale: string,
): Promise<Record<string, unknown>> {
  // ...everything that previously followed the findUnique, unchanged...
}
```

Mechanical notes:
- Move steps 2–9 and the final return-object assembly into `hydrateCharacterRow` verbatim. The only edits are the function boundary itself; every `row.<field>` reference works as-is against `CharacterRowLike`.
- If the final return object includes `id`, `createdAt`, `updatedAt` (it does), they pass through `row` — a draft preview supplies `id: null` and fresh dates.
- Where the existing code reads fields not in the interface (check `notes`, `storage`, `modifiers` usage), they're already optional/`unknown` above — extend the interface rather than casting if TS complains.

- [ ] **Step 2: Verify with existing tests**

Run (in `backend/tests/unit-be/`): `node --import tsx --experimental-test-module-mocks --test get-character-full.test.ts`
Expected: PASS unchanged.

- [ ] **Step 3: Compile check**

Run (in `backend/`): `npm run build:ts`
Expected: clean compile.

- [ ] **Step 4: Commit**

```bash
git add backend/src/lib/get-character-full.ts
git commit -m "refactor(backend): extract hydrateCharacterRow for row-less draft previews"
```

---

### Task 5: `createCharacterFromDraft` in lib

**Files:**
- Modify: `backend/src/lib/generate-character.ts`
- Test: `backend/tests/unit-be/generate-character.test.ts` (append)

- [ ] **Step 1: Append the failing test**

```ts
test('createCharacterFromDraft persists exactly what buildCharacterData produces', async () => {
  resetFixture();
  const seeds = randomSectionSeeds();
  const draft = { classId: 1, classless: false, seeds };

  const expected = await buildCharacterData(1, seededRollerFor(seeds));
  fixture.createdCharacters.length = 0;

  const { createCharacterFromDraft } = await import('../../src/lib/generate-character.js');
  const id = await createCharacterFromDraft(draft, 'user-123');

  assert.equal(id, 'generated-character-id');
  const created = fixture.createdCharacters[0] as Record<string, unknown>;
  assert.equal(created.userId, 'user-123');
  // Same seeds ⇒ identical payload (ignoring userId).
  const { userId: _u, ...rest } = created;
  assert.deepEqual(rest, expected);
});

test('createCharacterFromDraft with classless=true ignores classId', async () => {
  resetFixture();
  const seeds = randomSectionSeeds();
  const { createCharacterFromDraft } = await import('../../src/lib/generate-character.js');

  await createCharacterFromDraft({ classId: 1, classless: true, seeds }, 'user-123');

  const created = fixture.createdCharacters[0] as Record<string, unknown>;
  assert.equal(created.classId, null);
  assert.deepEqual(created.abilities, []);
});
```

- [ ] **Step 2: Run to verify failure**

Run: `node --import tsx --experimental-test-module-mocks --test generate-character.test.ts`
Expected: FAIL — `createCharacterFromDraft` is not exported.

- [ ] **Step 3: Implement**

In `generate-character.ts` add (after `generateCharacter`):

```ts
import type { CharacterDraft } from './draft-seeds.js';
import { seededRollerFor } from './draft-seeds.js';
```

```ts
/**
 * Deterministically rebuild a character from a confirmed draft and persist it.
 * The client only ever supplied seeds, so the server is the sole roller —
 * any tampered seed is just a different fair roll.
 */
export async function createCharacterFromDraft(
  draft: CharacterDraft,
  userId: string,
): Promise<string> {
  const classId = draft.classless ? null : draft.classId;
  const data = await buildCharacterData(classId, seededRollerFor(draft.seeds));

  const character = await prisma.character.create({
    data: {
      userId,
      ...data,
      abilities: data.abilities as object[],
      equipment: data.equipment as object[],
      equippedWeapons: data.equippedWeapons as object[],
      equippedArmor: (data.equippedArmor as object | null) ?? Prisma.DbNull,
    },
    select: { id: true },
  });

  return character.id;
}
```

- [ ] **Step 4: Run tests**

Run: `node --import tsx --experimental-test-module-mocks --test generate-character.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/src/lib/generate-character.ts backend/tests/unit-be/generate-character.test.ts
git commit -m "feat(backend): add createCharacterFromDraft (deterministic persist from seeds)"
```

---

### Task 6: Repository additions — `classExists`, `listClasses`

**Files:**
- Modify: `backend/src/repositories/character-repository.ts`

Repository functions are intentionally NOT unit-tested (they'd only exercise Prisma) — match the existing file's style. Read the existing `getClassNameMap` in this file first and mirror its translation-join approach.

- [ ] **Step 1: Add the two methods to `characterRepository`**

```ts
async classExists(id: number): Promise<boolean> {
  const row = await prisma.class.findUnique({ where: { id }, select: { id: true } });
  return row !== null;
},

/**
 * Classes for the creation gate: id + localized name/description.
 * Mirrors getClassNameMap's translation lookup.
 */
async listClasses(locale: string): Promise<Array<{ id: number; name: string | null; description: string | null }>> {
  const classes = await prisma.class.findMany({
    select: { id: true, nameKey: true, descriptionKey: true },
    orderBy: { id: 'asc' },
  });

  const keys = classes.flatMap((c) =>
    [c.nameKey, c.descriptionKey].filter((k): k is string => k !== null)
  );
  const translations = keys.length > 0
    ? await prisma.translation.findMany({
        where: { locale, key: { in: keys } },
        select: { key: true, value: true },
      })
    : [];
  const map = new Map(translations.map((t) => [t.key, t.value]));

  return classes.map((c) => ({
    id: c.id,
    name: c.nameKey ? (map.get(c.nameKey) ?? null) : null,
    description: c.descriptionKey ? (map.get(c.descriptionKey) ?? null) : null,
  }));
},
```

> If the Prisma `Class` model's fields differ (check `backend/prisma/schema.prisma` for `nameKey`/`descriptionKey` — `get-character-full.ts` reads `cls.nameKey`/`cls.descriptionKey`, so these names are correct), adjust the select accordingly.

- [ ] **Step 2: Compile check**

Run (in `backend/`): `npm run build:ts`
Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add backend/src/repositories/character-repository.ts
git commit -m "feat(backend): repository support for class existence and localized class list"
```

---

### Task 7: Draft service (`character-draft-service.ts`)

**Files:**
- Create: `backend/src/services/character-draft-service.ts`
- Test: `backend/tests/unit-be/character-draft-service.test.ts`

Follow the `character-service.ts` shape exactly: factory taking `ServiceLogger`, methods returning `ServiceResult`, `unexpected(log, …)` for catch-alls. Mock `generate-character.js`, `get-character-full.js`, and `character-repository.js` in tests (mirror `character-service.test.ts`'s `mock.module` usage).

- [ ] **Step 1: Write the failing tests**

```ts
// backend/tests/unit-be/character-draft-service.test.ts
import assert from 'node:assert/strict';
import { mock, test } from 'node:test';

const buildCalls: Array<{ classId: number | null; rollerFor: unknown }> = [];
const hydrateCalls: Array<{ row: Record<string, unknown>; locale: string }> = [];
let classExistsResult = true;
let listClassesResult: Array<{ id: number; name: string | null; description: string | null }> = [];

const fakeCharacterData = {
  name: 'Brint',
  classId: 1,
  origin: 'origin.one',
  strength: 10, agility: 10, presence: 10, toughness: 10,
  maxHp: 4, currentHp: 4, omens: 1, maxOmens: 1, silver: 60,
  habit: null, tale: null, bodyDescription: null, trait1: null, trait2: null,
  abilities: [], equipment: [], equippedWeapons: [], equippedArmor: null,
};

mock.module('../../src/lib/generate-character.js', {
  namedExports: {
    buildCharacterData: async (classId: number | null, rollerFor: unknown) => {
      buildCalls.push({ classId, rollerFor });
      return { ...fakeCharacterData, classId };
    },
    createCharacterFromDraft: async () => 'unused-here',
    generateCharacter: async () => 'unused-here',
  },
});

mock.module('../../src/lib/get-character-full.js', {
  namedExports: {
    getCharacterFull: async () => null,
    hydrateCharacterRow: async (row: Record<string, unknown>, locale: string) => {
      hydrateCalls.push({ row, locale });
      return { ...row, hydrated: true };
    },
  },
});

mock.module('../../src/repositories/character-repository.js', {
  namedExports: {
    characterRepository: {
      classExists: async () => classExistsResult,
      listClasses: async () => listClassesResult,
    },
  },
});

const { createCharacterDraftService } = await import('../../src/services/character-draft-service.js');
const { DRAFT_SECTIONS, SEED_PATTERN, randomSectionSeeds } = await import('../../src/lib/draft-seeds.js');

const log = { error: () => {}, warn: () => {}, info: () => {} };
const session = { user: { id: 'user-1' } };

function reset() {
  buildCalls.length = 0;
  hydrateCalls.length = 0;
  classExistsResult = true;
  listClassesResult = [];
}

test('createDraft requires a session', async () => {
  reset();
  const result = await createCharacterDraftService(log).createDraft({
    session: null, locale: 'en',
  });
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.error.statusCode, 401);
});

test('createDraft with explicit classId validates the class and returns draft + preview', async () => {
  reset();
  const result = await createCharacterDraftService(log).createDraft({
    session, classId: 3, locale: 'en',
  });
  assert.equal(result.ok, true);
  if (!result.ok) return;
  const { draft, preview } = result.value as {
    draft: { classId: number | null; classless: boolean; seeds: Record<string, string> };
    preview: Record<string, unknown>;
  };
  assert.equal(draft.classId, 3);
  assert.equal(draft.classless, false);
  for (const section of DRAFT_SECTIONS) assert.match(draft.seeds[section], SEED_PATTERN);
  assert.equal(buildCalls[0].classId, 3);
  assert.equal(preview.hydrated, true);
  // The synthetic preview row is id-less.
  assert.equal(hydrateCalls[0].row.id, null);
});

test('createDraft rejects an unknown classId with 404', async () => {
  reset();
  classExistsResult = false;
  const result = await createCharacterDraftService(log).createDraft({
    session, classId: 99, locale: 'en',
  });
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.error.statusCode, 404);
    assert.equal(result.error.code, 'CLASS_NOT_FOUND');
  }
});

test('createDraft classless skips class validation and builds with null', async () => {
  reset();
  const result = await createCharacterDraftService(log).createDraft({
    session, classless: true, locale: 'en',
  });
  assert.equal(result.ok, true);
  assert.equal(buildCalls[0].classId, null);
  if (result.ok) {
    const { draft } = result.value as { draft: { classId: number | null; classless: boolean } };
    assert.equal(draft.classless, true);
    assert.equal(draft.classId, null);
  }
});

test('createDraft with provided seeds reuses them (rehydration path)', async () => {
  reset();
  const seeds = randomSectionSeeds();
  const result = await createCharacterDraftService(log).createDraft({
    session, classId: 2, seeds, locale: 'en',
  });
  assert.equal(result.ok, true);
  if (result.ok) {
    const { draft } = result.value as { draft: { seeds: Record<string, string> } };
    assert.deepEqual(draft.seeds, seeds);
  }
});

test('rerollSection replaces exactly one seed', async () => {
  reset();
  const seeds = randomSectionSeeds();
  const result = await createCharacterDraftService(log).rerollSection({
    session,
    draft: { classId: 1, classless: false, seeds },
    section: 'stats',
    locale: 'en',
  });
  assert.equal(result.ok, true);
  if (!result.ok) return;
  const { draft } = result.value as { draft: { seeds: Record<string, string> } };
  assert.notEqual(draft.seeds.stats, seeds.stats);
  for (const section of DRAFT_SECTIONS.filter((s: string) => s !== 'stats')) {
    assert.equal(draft.seeds[section], seeds[section]);
  }
});

test('rerollSection validates the class still exists', async () => {
  reset();
  classExistsResult = false;
  const result = await createCharacterDraftService(log).rerollSection({
    session,
    draft: { classId: 1, classless: false, seeds: randomSectionSeeds() },
    section: 'gear',
    locale: 'en',
  });
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.error.statusCode, 404);
});

test('listClasses returns repository rows', async () => {
  reset();
  listClassesResult = [{ id: 1, name: 'Gutterborn Scvm', description: 'Born in a gutter.' }];
  const result = await createCharacterDraftService(log).listClasses({ locale: 'en' });
  assert.equal(result.ok, true);
  if (result.ok) assert.deepEqual(result.value, listClassesResult);
});
```

- [ ] **Step 2: Run to verify failure**

Run: `node --import tsx --experimental-test-module-mocks --test character-draft-service.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the service**

```ts
// backend/src/services/character-draft-service.ts
import { characterRepository } from '../repositories/character-repository.js';
import { buildCharacterData } from '../lib/generate-character.js';
import { hydrateCharacterRow } from '../lib/get-character-full.js';
import {
  randomSectionSeeds,
  randomSeed,
  seededRollerFor,
  type CharacterDraft,
  type DraftSection,
  type SectionSeeds,
} from '../lib/draft-seeds.js';
import { notFound, unauthorized } from '../errors.js';
import {
  fail,
  ok,
  unexpected,
  type ServiceLogger,
  type ServiceResult,
} from './result.js';
import type { AppSession } from './character-service.js';

export type DraftResult = {
  draft: CharacterDraft;
  preview: Record<string, unknown>;
};

function sessionUserId(session: AppSession): string | null {
  return session?.user?.id ?? null;
}

/**
 * Stateless draft generation for the character creation flow. A draft is
 * (class choice, per-section seeds); every method regenerates the full
 * character from seeds — nothing is persisted and nothing is trusted from
 * the client except seeds, which are all equally legal.
 */
export function createCharacterDraftService(log: ServiceLogger) {
  async function buildDraftResult(
    draft: CharacterDraft,
    locale: string,
  ): Promise<DraftResult> {
    const classId = draft.classless ? null : draft.classId;
    const data = await buildCharacterData(classId, seededRollerFor(draft.seeds));
    const now = new Date();
    const preview = await hydrateCharacterRow(
      {
        ...data,
        id: null,
        storage: [],
        modifiers: [],
        notes: null,
        createdAt: now,
        updatedAt: now,
      },
      locale,
    );
    return { draft, preview };
  }

  async function classNotFound(classId: number): Promise<boolean> {
    return !(await characterRepository.classExists(classId));
  }

  return {
    async createDraft(input: {
      session: AppSession;
      classId?: number | null;
      classless?: boolean;
      seeds?: SectionSeeds;
      locale: string;
    }): Promise<ServiceResult<DraftResult>> {
      if (!sessionUserId(input.session)) {
        return fail(unauthorized());
      }

      try {
        const classless = input.classless === true;
        let classId: number | null = classless ? null : (input.classId ?? null);

        if (classId !== null && (await classNotFound(classId))) {
          return fail(notFound('CLASS_NOT_FOUND', 'Class not found'));
        }

        // No class picked and not classless: pick a random class. This is a
        // one-time choice recorded in the draft, not a seeded section.
        if (classId === null && !classless) {
          const classes = await characterRepository.listClasses('en');
          if (classes.length === 0) {
            return fail(notFound('CLASS_NOT_FOUND', 'No classes available'));
          }
          classId = classes[Math.floor(Math.random() * classes.length)].id;
        }

        const draft: CharacterDraft = {
          classId,
          classless,
          seeds: input.seeds ?? randomSectionSeeds(),
        };
        return ok(await buildDraftResult(draft, input.locale));
      } catch (err) {
        return fail(
          unexpected(log, err, 'DRAFT_CREATE_FAILED', 'Failed to create character draft')
        );
      }
    },

    async rerollSection(input: {
      session: AppSession;
      draft: CharacterDraft;
      section: DraftSection;
      locale: string;
    }): Promise<ServiceResult<DraftResult>> {
      if (!sessionUserId(input.session)) {
        return fail(unauthorized());
      }

      try {
        if (
          !input.draft.classless &&
          input.draft.classId !== null &&
          (await classNotFound(input.draft.classId))
        ) {
          return fail(notFound('CLASS_NOT_FOUND', 'Class not found'));
        }

        const draft: CharacterDraft = {
          ...input.draft,
          seeds: { ...input.draft.seeds, [input.section]: randomSeed() },
        };
        return ok(await buildDraftResult(draft, input.locale));
      } catch (err) {
        return fail(
          unexpected(log, err, 'DRAFT_REROLL_FAILED', 'Failed to re-roll draft section')
        );
      }
    },

    async listClasses(input: {
      locale: string;
    }): Promise<ServiceResult<Array<{ id: number; name: string | null; description: string | null }>>> {
      try {
        return ok(await characterRepository.listClasses(input.locale));
      } catch (err) {
        return fail(
          unexpected(log, err, 'CLASS_LIST_FAILED', 'Failed to list classes')
        );
      }
    },
  };
}
```

> Check `backend/src/errors.ts` for the exact `notFound(code, message)` signature before writing — `character-service.ts` calls `notFound('CHARACTER_NOT_FOUND', 'Character not found')`, so the two-arg form is correct.

- [ ] **Step 4: Run tests**

Run: `node --import tsx --experimental-test-module-mocks --test character-draft-service.test.ts`
Expected: PASS (8 tests).

- [ ] **Step 5: Commit**

```bash
git add backend/src/services/character-draft-service.ts backend/tests/unit-be/character-draft-service.test.ts
git commit -m "feat(backend): character draft service (create, reroll, class list)"
```

---

### Task 8: Confirm path — `character-service.generate` accepts a draft

**Files:**
- Modify: `backend/src/services/character-service.ts`
- Test: `backend/tests/unit-be/character-service.test.ts` (append)

- [ ] **Step 1: Append failing tests**

Open `character-service.test.ts`, find the existing `mock.module('../../src/lib/generate-character.js', …)` block and ADD a `createCharacterFromDraft` named export to it (a `vi.fn`-style recorder consistent with the file's existing style — it currently records `generateCharacter` calls; mirror that):

```ts
// inside the existing namedExports of the generate-character.js mock:
createCharacterFromDraft: async (draft: unknown, userId: string) => {
  createFromDraftCalls.push({ draft, userId });
  return 'draft-character-id';
},
```

with a module-level `const createFromDraftCalls: Array<{ draft: unknown; userId: string }> = [];` and also add `classExists: async () => classExistsResult` (module-level `let classExistsResult = true;`) to the existing character-repository mock's `characterRepository` object.

Then append tests (adapt the existing tests' helper/session conventions in that file — it already has a valid session fixture and a `getCharacterFull` mock returning a character):

```ts
test('generate with a draft rebuilds from seeds and persists via createCharacterFromDraft', async () => {
  createFromDraftCalls.length = 0;
  classExistsResult = true;
  const seeds = randomSectionSeeds(); // import from ../../src/lib/draft-seeds.js at top
  const draft = { classId: 1, classless: false, seeds };

  const result = await createCharacterService(log).generate({
    session: validSession,
    draft,
    locale: 'en',
  });

  assert.equal(result.ok, true);
  assert.equal(createFromDraftCalls.length, 1);
  assert.deepEqual(createFromDraftCalls[0].draft, draft);
});

test('generate with a draft rejects an unknown class with 404', async () => {
  createFromDraftCalls.length = 0;
  classExistsResult = false;
  const result = await createCharacterService(log).generate({
    session: validSession,
    draft: { classId: 42, classless: false, seeds: randomSectionSeeds() },
    locale: 'en',
  });
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.error.code, 'CLASS_NOT_FOUND');
  assert.equal(createFromDraftCalls.length, 0);
});

test('generate without a draft keeps the legacy random path', async () => {
  createFromDraftCalls.length = 0;
  const result = await createCharacterService(log).generate({
    session: validSession,
    classId: 2,
    locale: 'en',
  });
  assert.equal(result.ok, true);
  assert.equal(createFromDraftCalls.length, 0);
});
```

*(The exact names `validSession` / `log` must be taken from the existing test file — read it first and reuse its fixtures. The third test may already exist in spirit; only add what's missing.)*

- [ ] **Step 2: Run to verify failure**

Run: `node --import tsx --experimental-test-module-mocks --test character-service.test.ts`
Expected: new tests FAIL (generate ignores `draft`).

- [ ] **Step 3: Implement**

In `character-service.ts`:

```ts
import { createCharacterFromDraft, generateCharacter } from '../lib/generate-character.js';
import type { CharacterDraft } from '../lib/draft-seeds.js';
```

Extend `generate`:

```ts
async generate(input: {
  session: AppSession;
  classId?: number | null;
  draft?: CharacterDraft | null;
  locale: string;
}): Promise<ServiceResult<unknown>> {
  const userId = sessionUserId(input.session);
  if (!userId) {
    return fail(unauthorized());
  }

  try {
    let characterId: string;
    if (input.draft) {
      // Confirmed creation-flow draft: deterministic rebuild from seeds.
      if (
        !input.draft.classless &&
        input.draft.classId !== null &&
        !(await characterRepository.classExists(input.draft.classId))
      ) {
        return fail(notFound('CLASS_NOT_FOUND', 'Class not found'));
      }
      characterId = await createCharacterFromDraft(input.draft, userId);
    } else {
      const roller = new Roller({ engine: new OSRandomEngine() });
      // Bind ownership at creation so a failure can never leave an orphaned,
      // unowned (and thus unreachable) character row.
      characterId = await generateCharacter(input.classId ?? null, roller, userId);
    }

    const character = await getCharacterFull(characterId, input.locale);
    // ...existing tail unchanged (CHARACTER_GENERATION_FETCH_FAILED, ok(character), catch)...
  }
}
```

- [ ] **Step 4: Run the full service test file**

Run: `node --import tsx --experimental-test-module-mocks --test character-service.test.ts`
Expected: PASS, including all pre-existing tests.

- [ ] **Step 5: Commit**

```bash
git add backend/src/services/character-service.ts backend/tests/unit-be/character-service.test.ts
git commit -m "feat(backend): character generate() accepts a confirmed creation draft"
```

---

### Task 9: Schemas + routes (`/draft`, `/draft/reroll/:section`, `/classes`, draft on `/new`)

**Files:**
- Create: `backend/src/schemas/draft.ts`
- Modify: `backend/src/schemas/character.ts` (GenerateBodySchema)
- Modify: `backend/src/routes/characters/index.ts`
- Test: `backend/tests/unit-be/characters-route.test.ts` (append)

- [ ] **Step 1: Write the schemas**

```ts
// backend/src/schemas/draft.ts
import { DRAFT_SECTIONS } from '../lib/draft-seeds.js';
import { CharacterSchema } from './character.js';

const SeedSchema = { type: 'string', pattern: '^[0-9a-f]{64}$' };

export const SectionSeedsSchema = {
  type: 'object',
  additionalProperties: false,
  required: [...DRAFT_SECTIONS],
  properties: Object.fromEntries(DRAFT_SECTIONS.map((s) => [s, SeedSchema])),
};

export const DraftSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['classId', 'classless', 'seeds'],
  properties: {
    classId: { type: ['integer', 'null'], minimum: 1, maximum: 100 },
    classless: { type: 'boolean' },
    seeds: SectionSeedsSchema,
  },
};

export const DraftBodySchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    classId: { type: 'integer', minimum: 1, maximum: 100 },
    classless: { type: 'boolean' },
    seeds: SectionSeedsSchema, // optional: rehydrate a stored draft
  },
};

export const RerollBodySchema = {
  type: 'object',
  additionalProperties: false,
  required: ['draft'],
  properties: {
    draft: DraftSchema,
  },
};

export const RerollParamsSchema = {
  type: 'object',
  required: ['section'],
  properties: {
    section: { type: 'string', enum: [...DRAFT_SECTIONS] },
  },
};

export const DraftResponseSchema = {
  type: 'object',
  properties: {
    draft: DraftSchema,
    preview: CharacterSchema,
  },
  required: ['draft', 'preview'],
};

export const ClassListResponseSchema = {
  type: 'array',
  items: {
    type: 'object',
    properties: {
      id: { type: 'integer' },
      name: { type: ['string', 'null'] },
      description: { type: ['string', 'null'] },
    },
    required: ['id'],
  },
};
```

In `backend/src/schemas/character.ts`, extend `GenerateBodySchema` (import `DraftSchema` would create a cycle — instead move nothing; reference via a loose object to keep the file decoupled):

```ts
export const GenerateBodySchema = {
  type: 'object',
  properties: {
    classId: { type: 'integer', minimum: 1, maximum: 6 },
    draft: {
      type: 'object',
      additionalProperties: false,
      required: ['classId', 'classless', 'seeds'],
      properties: {
        classId: { type: ['integer', 'null'], minimum: 1, maximum: 100 },
        classless: { type: 'boolean' },
        seeds: {
          type: 'object',
          additionalProperties: false,
          required: ['name', 'stats', 'omens', 'silver', 'origin', 'abilities', 'gear', 'personality'],
          properties: Object.fromEntries(
            ['name', 'stats', 'omens', 'silver', 'origin', 'abilities', 'gear', 'personality']
              .map((s) => [s, { type: 'string', pattern: '^[0-9a-f]{64}$' }])
          ),
        },
      },
    },
  },
} as const;
```

*(If the `as const` assertion fights `Object.fromEntries`, drop `as const` from this schema — it's only consumed by Fastify at runtime.)*

- [ ] **Step 2: Append failing route tests**

`characters-route.test.ts` builds a Fastify instance with mocked services (read its setup first; it mocks `character-service.js` via `mock.module`). Add an analogous `mock.module('../../src/services/character-draft-service.js', …)` whose `createCharacterDraftService` returns recordable `createDraft` / `rerollSection` / `listClasses` methods, then append tests:

```ts
test('POST /api/characters/draft forwards class choice and locale to the service', async () => {
  const res = await app.inject({
    method: 'POST',
    url: '/api/characters/draft?locale=en',
    payload: { classId: 2 },
  });
  assert.equal(res.statusCode, 200);
  assert.equal(draftCalls[0].classId, 2);
});

test('POST /api/characters/draft/reroll/:section rejects unknown sections with 400', async () => {
  const res = await app.inject({
    method: 'POST',
    url: '/api/characters/draft/reroll/luck',
    payload: { draft: validDraftPayload },
  });
  assert.equal(res.statusCode, 400);
});

test('POST /api/characters/draft/reroll/stats forwards draft and section', async () => {
  const res = await app.inject({
    method: 'POST',
    url: '/api/characters/draft/reroll/stats?locale=en',
    payload: { draft: validDraftPayload },
  });
  assert.equal(res.statusCode, 200);
  assert.equal(rerollCalls[0].section, 'stats');
});

test('GET /api/characters/classes returns the localized class list', async () => {
  const res = await app.inject({ method: 'GET', url: '/api/characters/classes?locale=en' });
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.json(), [{ id: 1, name: 'Gutterborn Scvm', description: null }]);
});

test('POST /api/characters/new accepts a draft body', async () => {
  const res = await app.inject({
    method: 'POST',
    url: '/api/characters/new?locale=en',
    payload: { draft: validDraftPayload },
  });
  assert.equal(res.statusCode, 201);
  assert.deepEqual(generateCalls.at(-1)?.draft, validDraftPayload);
});
```

with a shared fixture:

```ts
const validSeeds = Object.fromEntries(
  ['name', 'stats', 'omens', 'silver', 'origin', 'abilities', 'gear', 'personality']
    .map((s) => [s, 'a'.repeat(64)])
);
const validDraftPayload = { classId: 1, classless: false, seeds: validSeeds };
```

*(Adapt recorder names — `draftCalls`, `rerollCalls`, `generateCalls` — to the file's existing conventions; it already records service-method inputs for assertions.)*

- [ ] **Step 3: Run to verify failure**

Run: `node --import tsx --experimental-test-module-mocks --test characters-route.test.ts`
Expected: new tests FAIL (404 route not found).

- [ ] **Step 4: Add the routes**

In `backend/src/routes/characters/index.ts` add inside the plugin (thin controllers only):

```ts
import {
  ClassListResponseSchema,
  DraftBodySchema,
  DraftResponseSchema,
  RerollBodySchema,
  RerollParamsSchema,
} from '../../schemas/draft.js';
import { createCharacterDraftService } from '../../services/character-draft-service.js';
import type { CharacterDraft, DraftSection, SectionSeeds } from '../../lib/draft-seeds.js';
```

```ts
// POST /draft - Start (or rehydrate) a creation-flow draft. No DB write.
fastify.post<{
  Body: { classId?: number; classless?: boolean; seeds?: SectionSeeds };
  Querystring: { locale?: string };
}>(
  '/draft',
  {
    schema: {
      description: 'Generate a character draft preview (not persisted)',
      tags: ['characters'],
      querystring: LocaleQuerySchema,
      body: DraftBodySchema,
      response: {
        200: DraftResponseSchema,
        400: ErrorSchema,
        401: ErrorSchema,
        404: ErrorSchema,
        429: ErrorSchema,
        500: ErrorSchema,
      },
    },
  },
  async (request, reply) => {
    const result = await createCharacterDraftService(request.log).createDraft({
      session: request.appSession,
      classId: request.body?.classId ?? null,
      classless: request.body?.classless,
      seeds: request.body?.seeds,
      locale: request.query.locale ?? 'en',
    });
    if (!result.ok) {
      return sendServiceError(reply, request, result.error);
    }
    return result.value;
  }
);

// POST /draft/reroll/:section - Re-roll one section of a draft.
// Param route by design: one handler for all sections today; if a section
// ever needs custom behavior, register a static route for it ABOVE this one
// (Fastify prefers static segments) without touching the others.
fastify.post<{
  Params: { section: DraftSection };
  Body: { draft: CharacterDraft };
  Querystring: { locale?: string };
}>(
  '/draft/reroll/:section',
  {
    schema: {
      description: 'Re-roll a single section of a character draft',
      tags: ['characters'],
      params: RerollParamsSchema,
      querystring: LocaleQuerySchema,
      body: RerollBodySchema,
      response: {
        200: DraftResponseSchema,
        400: ErrorSchema,
        401: ErrorSchema,
        404: ErrorSchema,
        429: ErrorSchema,
        500: ErrorSchema,
      },
    },
  },
  async (request, reply) => {
    const result = await createCharacterDraftService(request.log).rerollSection({
      session: request.appSession,
      draft: request.body.draft,
      section: request.params.section,
      locale: request.query.locale ?? 'en',
    });
    if (!result.ok) {
      return sendServiceError(reply, request, result.error);
    }
    return result.value;
  }
);

// GET /classes - Localized class list for the creation gate.
fastify.get<{ Querystring: { locale?: string } }>(
  '/classes',
  {
    schema: {
      description: 'List character classes with localized names',
      tags: ['characters'],
      querystring: LocaleQuerySchema,
      response: {
        200: ClassListResponseSchema,
        500: ErrorSchema,
      },
    },
  },
  async (request, reply) => {
    const result = await createCharacterDraftService(request.log).listClasses({
      locale: request.query.locale ?? 'en',
    });
    if (!result.ok) {
      return sendServiceError(reply, request, result.error);
    }
    return result.value;
  }
);
```

And extend the existing `POST /new` handler's service call:

```ts
const result = await createCharacterService(request.log).generate({
  session: request.appSession,
  classId: request.body?.classId,
  draft: (request.body as { draft?: CharacterDraft })?.draft ?? null,
  locale: request.query.locale ?? 'en',
});
```

> Route conflict note: `GET /classes` is a static segment and wins over `GET /:id` in find-my-way — no ordering hazard. Draft endpoints intentionally have NO per-route rate-limit config; they inherit the global character-route bucket (30 req/min), which comfortably covers re-roll spamming. `/new` keeps its strict 5/min config — confirm-from-draft consumes from the same budget, which is fine (one confirm per flow).

- [ ] **Step 5: Run route tests**

Run: `node --import tsx --experimental-test-module-mocks --test characters-route.test.ts`
Expected: PASS.

- [ ] **Step 6: Full backend compile + unit suite**

Run (in `backend/`): `npm run build:ts` then (in `backend/tests/unit-be/`): `npm test`
Expected: clean compile, all green.

- [ ] **Step 7: Commit**

```bash
git add backend/src/schemas/draft.ts backend/src/schemas/character.ts backend/src/routes/characters/index.ts backend/tests/unit-be/characters-route.test.ts
git commit -m "feat(backend): draft, reroll, and class-list endpoints; draft confirm on /new"
```

---

### Task 10: Frontend API wrapper (`api/draft.ts`)

**Files:**
- Create: `frontend/src/api/draft.ts`

The generated `schema.ts` doesn't know the new paths yet (`npm run generate-api` needs a live backend). This module is the single place that calls them, going through the shared `client` so CSRF + auth middleware apply. When `schema.ts` is eventually regenerated these wrappers keep working.

- [ ] **Step 1: Implement**

```ts
// frontend/src/api/draft.ts
import { client } from '@/api';
import type { CharacterResponse } from '@/hooks/models';
import { toApiClientError } from '@/utils/errorUtils';

export const DRAFT_SECTIONS = [
  'name',
  'stats',
  'omens',
  'silver',
  'origin',
  'abilities',
  'gear',
  'personality',
] as const;

export type DraftSection = (typeof DRAFT_SECTIONS)[number];
export type SectionSeeds = Record<DraftSection, string>;

export type CharacterDraft = {
  classId: number | null;
  classless: boolean;
  seeds: SectionSeeds;
};

export type DraftResponse = {
  draft: CharacterDraft;
  preview: CharacterResponse;
};

export type ClassSummary = {
  id: number;
  name: string | null;
  description: string | null;
};

/* The draft endpoints aren't in the generated schema yet (regenerate with
 * `npm run generate-api` against a backend serving them); these typed
 * wrappers are the only call sites, so the cast is contained here. */
type LooseClient = {
  POST: (path: string, init: { body?: unknown; signal?: AbortSignal }) => Promise<{
    data?: unknown;
    error?: unknown;
    response?: Response;
  }>;
  GET: (path: string, init?: { signal?: AbortSignal }) => Promise<{
    data?: unknown;
    error?: unknown;
    response?: Response;
  }>;
};
const loose = client as unknown as LooseClient;

async function unwrap<T>(
  call: Promise<{ data?: unknown; error?: unknown; response?: Response }>,
  fallbackMessage: string,
  signal?: AbortSignal,
): Promise<T> {
  const { data, error, response } = await call;
  const responseOk = response?.ok ?? !error;
  if (error || !responseOk) {
    if (signal?.aborted) {
      throw new DOMException('The operation was aborted.', 'AbortError');
    }
    throw toApiClientError(error, response, fallbackMessage);
  }
  if (data === undefined) {
    throw new Error(fallbackMessage);
  }
  return data as T;
}

export function createDraft(
  input: { classId?: number; classless?: boolean; seeds?: SectionSeeds },
  locale: string,
  signal?: AbortSignal,
): Promise<DraftResponse> {
  return unwrap<DraftResponse>(
    loose.POST(`/api/characters/draft?locale=${encodeURIComponent(locale)}`, {
      body: input,
      signal,
    }),
    'Failed to roll a draft',
    signal,
  );
}

export function rerollDraftSection(
  draft: CharacterDraft,
  section: DraftSection,
  locale: string,
  signal?: AbortSignal,
): Promise<DraftResponse> {
  return unwrap<DraftResponse>(
    loose.POST(
      `/api/characters/draft/reroll/${section}?locale=${encodeURIComponent(locale)}`,
      { body: { draft }, signal },
    ),
    'Failed to re-roll',
    signal,
  );
}

export function confirmDraft(
  draft: CharacterDraft,
  locale: string,
  signal?: AbortSignal,
): Promise<CharacterResponse> {
  return unwrap<CharacterResponse>(
    loose.POST(`/api/characters/new?locale=${encodeURIComponent(locale)}`, {
      body: { draft },
      signal,
    }),
    'Failed to create character',
    signal,
  );
}

export function fetchClasses(
  locale: string,
  signal?: AbortSignal,
): Promise<ClassSummary[]> {
  return unwrap<ClassSummary[]>(
    loose.GET(`/api/characters/classes?locale=${encodeURIComponent(locale)}`, { signal }),
    'Failed to load classes',
    signal,
  );
}
```

> Check `frontend/src/utils/errorUtils.ts` for the exact `toApiClientError(error, response, fallback)` signature (it's what `useCharacterRepository.ts:61` uses). If `openapi-fetch`'s `GET/POST` reject unknown paths at the type level only, the runtime accepts arbitrary strings — that's what the `LooseClient` cast relies on. **Note:** query strings appended to the path are passed through by openapi-fetch; if it strips them, switch to `params: { query: { locale } }` in the init object instead — verify against one call in the browser/network tab or the unit test in Task 11.

- [ ] **Step 2: Compile check**

Run (in `frontend/`): `npx tsc --noEmit`
Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/api/draft.ts
git commit -m "feat(frontend): typed client wrappers for draft endpoints"
```

---

### Task 11: `useCharacterDraft` hook

**Files:**
- Create: `frontend/src/hooks/useCharacterDraft.ts`
- Test: `frontend/test/unit/hooks/useCharacterDraft.test.ts`

- [ ] **Step 1: Write the failing tests**

Follow the conventions of `frontend/test/unit/hooks/useCharacterEditor.test.ts` (renderHook from `@testing-library/react`, `vi.mock` of the api module). Key behaviors to pin:

```ts
// frontend/test/unit/hooks/useCharacterDraft.test.ts
import { renderHook, act, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useCharacterDraft, DRAFT_STORAGE_KEY } from '@/hooks/useCharacterDraft';
import * as draftApi from '@/api/draft';

vi.mock('@/api/draft', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/api/draft')>();
  return {
    ...original,
    createDraft: vi.fn(),
    rerollDraftSection: vi.fn(),
    confirmDraft: vi.fn(),
  };
});

const seeds = Object.fromEntries(
  ['name', 'stats', 'omens', 'silver', 'origin', 'abilities', 'gear', 'personality']
    .map((s) => [s, 'a'.repeat(64)])
) as draftApi.SectionSeeds;

const draft: draftApi.CharacterDraft = { classId: 1, classless: false, seeds };
const preview = { id: null, name: 'Brint', presence: 12 } as never;

describe('useCharacterDraft', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    vi.mocked(draftApi.createDraft).mockResolvedValue({ draft, preview });
    vi.mocked(draftApi.rerollDraftSection).mockResolvedValue({
      draft: { ...draft, seeds: { ...seeds, stats: 'b'.repeat(64) } },
      preview,
    });
    vi.mocked(draftApi.confirmDraft).mockResolvedValue({ id: 'char-9' } as never);
  });

  it('starts in the class-gate phase with no draft', () => {
    const { result } = renderHook(() => useCharacterDraft('en'));
    expect(result.current.phase).toBe('class-gate');
    expect(result.current.draft).toBeNull();
  });

  it('start() rolls a draft, moves to sheet phase, and persists to sessionStorage', async () => {
    const { result } = renderHook(() => useCharacterDraft('en'));
    await act(() => result.current.start({ classId: 1 }));

    expect(draftApi.createDraft).toHaveBeenCalledWith({ classId: 1 }, 'en', expect.anything());
    expect(result.current.phase).toBe('sheet');
    expect(result.current.preview).toEqual(preview);
    expect(JSON.parse(sessionStorage.getItem(DRAFT_STORAGE_KEY)!)).toEqual(draft);
  });

  it('rehydrates a stored draft on mount via createDraft with stored seeds', async () => {
    sessionStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
    const { result } = renderHook(() => useCharacterDraft('en'));

    await waitFor(() => expect(result.current.phase).toBe('sheet'));
    expect(draftApi.createDraft).toHaveBeenCalledWith(
      { classId: 1, classless: false, seeds },
      'en',
      expect.anything(),
    );
  });

  it('clears a corrupt stored draft and stays on the class gate', async () => {
    sessionStorage.setItem(DRAFT_STORAGE_KEY, '{not json');
    const { result } = renderHook(() => useCharacterDraft('en'));
    expect(result.current.phase).toBe('class-gate');
    expect(sessionStorage.getItem(DRAFT_STORAGE_KEY)).toBeNull();
  });

  it('reroll() marks only the affected section busy and updates the stored draft', async () => {
    const { result } = renderHook(() => useCharacterDraft('en'));
    await act(() => result.current.start({ classId: 1 }));

    let pending!: Promise<void>;
    act(() => { pending = result.current.reroll('stats'); });
    expect(result.current.rollingSection).toBe('stats');
    await act(() => pending);

    expect(result.current.rollingSection).toBeNull();
    expect(draftApi.rerollDraftSection).toHaveBeenCalledWith(draft, 'stats', 'en', expect.anything());
    expect(JSON.parse(sessionStorage.getItem(DRAFT_STORAGE_KEY)!).seeds.stats).toBe('b'.repeat(64));
  });

  it('ignores reroll() while another reroll is in flight', async () => {
    const { result } = renderHook(() => useCharacterDraft('en'));
    await act(() => result.current.start({ classId: 1 }));

    let resolveFirst!: (v: draftApi.DraftResponse) => void;
    vi.mocked(draftApi.rerollDraftSection).mockImplementationOnce(
      () => new Promise((r) => { resolveFirst = r; }),
    );

    let first!: Promise<void>;
    act(() => { first = result.current.reroll('gear'); });
    act(() => { void result.current.reroll('stats'); });
    expect(draftApi.rerollDraftSection).toHaveBeenCalledTimes(1);

    resolveFirst({ draft, preview });
    await act(() => first);
  });

  it('confirm() creates the character, clears storage, and reports the new id', async () => {
    const onCreated = vi.fn();
    const { result } = renderHook(() => useCharacterDraft('en', { onCreated }));
    await act(() => result.current.start({ classId: 1 }));
    await act(() => result.current.confirm());

    expect(draftApi.confirmDraft).toHaveBeenCalledWith(draft, 'en', expect.anything());
    expect(onCreated).toHaveBeenCalledWith('char-9');
    expect(sessionStorage.getItem(DRAFT_STORAGE_KEY)).toBeNull();
  });

  it('surfaces errors and keeps the last good preview', async () => {
    const { result } = renderHook(() => useCharacterDraft('en'));
    await act(() => result.current.start({ classId: 1 }));

    vi.mocked(draftApi.rerollDraftSection).mockRejectedValueOnce(new Error('boom'));
    await act(() => result.current.reroll('gear'));

    expect(result.current.error).toBeTruthy();
    expect(result.current.preview).toEqual(preview); // unchanged
    expect(result.current.phase).toBe('sheet');
  });

  it('restart() returns to the class gate and clears storage', async () => {
    const { result } = renderHook(() => useCharacterDraft('en'));
    await act(() => result.current.start({ classId: 1 }));
    act(() => result.current.restart());

    expect(result.current.phase).toBe('class-gate');
    expect(result.current.draft).toBeNull();
    expect(sessionStorage.getItem(DRAFT_STORAGE_KEY)).toBeNull();
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run (in `frontend/`): `npm run test:unit -- useCharacterDraft`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the hook**

```ts
// frontend/src/hooks/useCharacterDraft.ts
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  confirmDraft,
  createDraft,
  rerollDraftSection,
  type CharacterDraft,
  type DraftSection,
} from '@/api/draft';
import type { CharacterResponse } from '@/hooks/models';
import { getUserFacingApiErrorMessage } from '@/utils/errorUtils';

export const DRAFT_STORAGE_KEY = 'scvmrack.character-draft';

export type DraftPhase = 'class-gate' | 'sheet';

export type StartChoice = { classId?: number; classless?: boolean };

type Options = {
  onCreated?: (characterId: string) => void;
};

/**
 * State machine for the creation flow. The draft (class + seed bundle) is the
 * only state that matters — the preview is always derivable from it, so the
 * draft alone is persisted to sessionStorage and rehydrated on mount.
 *
 * Re-rolls are serialized: one in flight, extra clicks ignored (a re-roll is
 * cheap to click again; queuing would just roll past what the user saw).
 */
export function useCharacterDraft(locale: string, options: Options = {}) {
  const [phase, setPhase] = useState<DraftPhase>('class-gate');
  const [draft, setDraft] = useState<CharacterDraft | null>(null);
  const [preview, setPreview] = useState<CharacterResponse | null>(null);
  const [rollingSection, setRollingSection] = useState<DraftSection | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const busyRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);
  const onCreatedRef = useRef(options.onCreated);
  onCreatedRef.current = options.onCreated;

  const applyResponse = useCallback((response: { draft: CharacterDraft; preview: CharacterResponse }) => {
    setDraft(response.draft);
    setPreview(response.preview);
    setPhase('sheet');
    try {
      sessionStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(response.draft));
    } catch {
      // Storage full/unavailable: the flow still works, refresh just restarts it.
    }
  }, []);

  const clearStored = useCallback(() => {
    try {
      sessionStorage.removeItem(DRAFT_STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  const start = useCallback(
    async (choice: StartChoice, seeds?: CharacterDraft['seeds']) => {
      if (busyRef.current) return;
      busyRef.current = true;
      setIsStarting(true);
      setError(null);

      const controller = new AbortController();
      abortRef.current?.abort();
      abortRef.current = controller;
      try {
        const response = await createDraft(
          seeds ? { ...choice, seeds } : choice,
          locale,
          controller.signal,
        );
        applyResponse(response);
      } catch (e) {
        if (e instanceof DOMException && e.name === 'AbortError') return;
        // A stale stored draft (e.g. deleted class) must not trap the user:
        // drop it and stay on/return to the gate.
        clearStored();
        setPhase('class-gate');
        setError(getUserFacingApiErrorMessage(e, (k: string, f: string) => f, 'Failed to roll a draft'));
      } finally {
        busyRef.current = false;
        setIsStarting(false);
      }
    },
    [locale, applyResponse, clearStored],
  );

  const reroll = useCallback(
    async (section: DraftSection) => {
      if (busyRef.current || !draft) return;
      busyRef.current = true;
      setRollingSection(section);
      setError(null);

      const controller = new AbortController();
      abortRef.current = controller;
      try {
        const response = await rerollDraftSection(draft, section, locale, controller.signal);
        applyResponse(response);
      } catch (e) {
        if (e instanceof DOMException && e.name === 'AbortError') return;
        setError(getUserFacingApiErrorMessage(e, (k: string, f: string) => f, 'Failed to re-roll'));
      } finally {
        busyRef.current = false;
        setRollingSection(null);
      }
    },
    [draft, locale, applyResponse],
  );

  const confirm = useCallback(async () => {
    if (busyRef.current || !draft) return;
    busyRef.current = true;
    setIsConfirming(true);
    setError(null);

    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const character = await confirmDraft(draft, locale, controller.signal);
      clearStored();
      if (character?.id) {
        onCreatedRef.current?.(character.id);
      }
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return;
      setError(getUserFacingApiErrorMessage(e, (k: string, f: string) => f, 'Failed to create character'));
    } finally {
      busyRef.current = false;
      setIsConfirming(false);
    }
  }, [draft, locale, clearStored]);

  const restart = useCallback(() => {
    abortRef.current?.abort();
    busyRef.current = false;
    clearStored();
    setDraft(null);
    setPreview(null);
    setPhase('class-gate');
    setError(null);
  }, [clearStored]);

  // Rehydrate a stored draft on mount (survives refresh / re-auth).
  useEffect(() => {
    let stored: CharacterDraft | null = null;
    try {
      const raw = sessionStorage.getItem(DRAFT_STORAGE_KEY);
      if (raw) stored = JSON.parse(raw) as CharacterDraft;
    } catch {
      clearStored();
      return;
    }
    if (!stored || typeof stored !== 'object' || !stored.seeds) {
      if (stored !== null) clearStored();
      return;
    }
    void start(
      { classId: stored.classId ?? undefined, classless: stored.classless },
      stored.seeds,
    );
    // Mount-only rehydration by design.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Abort any in-flight request on unmount.
  useEffect(() => () => abortRef.current?.abort(), []);

  return {
    phase,
    draft,
    preview,
    rollingSection,
    isStarting,
    isConfirming,
    error,
    start,
    reroll,
    confirm,
    restart,
  };
}
```

> `getUserFacingApiErrorMessage(error, t, fallback)` — check its real signature in `frontend/src/utils/errorUtils.ts`; the page passes the real `t`. If it requires a translation function, accept a `t` in the hook options instead of the inline lambda — adjust tests accordingly. Keep the corrupt-storage test passing: JSON.parse throwing must `clearStored()` and remain on the gate WITHOUT calling `start`.

- [ ] **Step 4: Run tests**

Run (in `frontend/`): `npm run test:unit -- useCharacterDraft`
Expected: PASS (9 tests).

- [ ] **Step 5: Validation + commit**

Run: `npx tsc --noEmit && npm run lint`

```bash
git add frontend/src/hooks/useCharacterDraft.ts frontend/test/unit/hooks/useCharacterDraft.test.ts
git commit -m "feat(frontend): useCharacterDraft state machine with sessionStorage rehydration"
```

---

### Task 12: ClassGate organism

**Files:**
- Create: `frontend/src/components/organisms/character-create/ClassGate.tsx`
- Test: `frontend/test/browser/organisms/ClassGate.test.tsx`

- [ ] **Step 1: Write the failing browser test**

```tsx
// frontend/test/browser/organisms/ClassGate.test.tsx
import { render } from 'vitest-browser-react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import BrowserTestProvider from '../BrowserTestProvider';
import { ClassGate } from '@/components/organisms/character-create/ClassGate';
import { fetchClasses } from '@/api/draft';

vi.mock('@/api/draft', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/api/draft')>()),
  fetchClasses: vi.fn(),
}));

const classes = [
  { id: 1, name: 'Esoteric Hermit', description: 'A lonely mystic.' },
  { id: 2, name: 'Fanged Deserter', description: 'Bites first.' },
];

describe('ClassGate', () => {
  const onPick = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fetchClasses).mockResolvedValue(classes);
  });

  it('renders a card per class plus Classless and Random', async () => {
    render(
      <BrowserTestProvider>
        <ClassGate onPick={onPick} busy={false} />
      </BrowserTestProvider>
    );

    await expect.element(page.getByText('Esoteric Hermit')).toBeVisible();
    await expect.element(page.getByText('Fanged Deserter')).toBeVisible();
    await expect.element(page.getByTestId('class-gate-classless')).toBeVisible();
    await expect.element(page.getByTestId('class-gate-random')).toBeVisible();
  });

  it('dispatches the right choice per card', async () => {
    render(
      <BrowserTestProvider>
        <ClassGate onPick={onPick} busy={false} />
      </BrowserTestProvider>
    );

    await userEvent.click(page.getByText('Fanged Deserter'));
    expect(onPick).toHaveBeenCalledWith({ classId: 2 });

    await userEvent.click(page.getByTestId('class-gate-classless'));
    expect(onPick).toHaveBeenCalledWith({ classless: true });

    await userEvent.click(page.getByTestId('class-gate-random'));
    expect(onPick).toHaveBeenCalledWith({});
  });

  it('disables cards while busy', async () => {
    render(
      <BrowserTestProvider>
        <ClassGate onPick={onPick} busy={true} />
      </BrowserTestProvider>
    );

    await expect.element(page.getByTestId('class-gate-random')).toBeDisabled();
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run (in `frontend/`): `npm run test:browser -- ClassGate`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

```tsx
// frontend/src/components/organisms/character-create/ClassGate.tsx
import { useEffect, useState } from 'react';
import { Alert, Box, ButtonBase, CircularProgress, Typography } from '@mui/material';
import CasinoIcon from '@mui/icons-material/Casino';
import { useTranslation } from 'react-i18next';
import { fetchClasses, type ClassSummary } from '@/api/draft';
import type { StartChoice } from '@/hooks/useCharacterDraft';
import { morkBorgColors } from '@/theme/morkBorgTheme';

type ClassGateProps = {
  onPick: (choice: StartChoice) => void;
  busy: boolean;
};

const styles = {
  grid: {
    display: 'grid',
    gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr 1fr' },
    gap: 1.5,
    py: 2,
  },
  card: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'flex-start',
    textAlign: 'left' as const,
    gap: 0.5,
    p: 2,
    minHeight: 120,
    width: '100%',
    bgcolor: morkBorgColors.black,
    color: morkBorgColors.yellow,
    border: `2px solid ${morkBorgColors.yellow}`,
    borderRadius: 0,
    transition: 'background-color 120ms ease',
    '&:hover': { bgcolor: morkBorgColors.pink, color: morkBorgColors.black },
    '&.Mui-disabled': { opacity: 0.5 },
  },
  special: {
    bgcolor: morkBorgColors.yellow,
    color: morkBorgColors.black,
    border: `2px solid ${morkBorgColors.black}`,
  },
};

export function ClassGate({ onPick, busy }: ClassGateProps) {
  const { t } = useTranslation();
  const [classes, setClasses] = useState<ClassSummary[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetchClasses('en', controller.signal)
      .then(setClasses)
      .catch((e) => {
        if (e instanceof DOMException && e.name === 'AbortError') return;
        setLoadError(t('create.classLoadError', 'Failed to load classes'));
      });
    return () => controller.abort();
  }, [t]);

  return (
    <Box>
      <Typography variant="h4" component="h1" sx={{ pt: 2 }}>
        {t('create.chooseClass', 'Choose your misery')}
      </Typography>
      <Typography sx={{ opacity: 0.8 }}>
        {t('create.chooseClassHint', 'Pick a class, go classless, or let the dice decide.')}
      </Typography>

      {loadError && <Alert severity="error" sx={{ mt: 2 }}>{loadError}</Alert>}
      {!classes && !loadError && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {classes && (
        <Box sx={styles.grid}>
          {classes.map((cls) => (
            <ButtonBase
              key={cls.id}
              data-testid={`class-gate-class-${cls.id}`}
              disabled={busy}
              onClick={() => onPick({ classId: cls.id })}
              sx={styles.card}
            >
              <Typography variant="h6" component="span">{cls.name}</Typography>
              {cls.description && (
                <Typography variant="body2" component="span" sx={{ opacity: 0.8 }}>
                  {cls.description}
                </Typography>
              )}
            </ButtonBase>
          ))}
          <ButtonBase
            data-testid="class-gate-classless"
            disabled={busy}
            onClick={() => onPick({ classless: true })}
            sx={{ ...styles.card, ...styles.special }}
          >
            <Typography variant="h6" component="span">
              {t('create.classless', 'Classless Scvm')}
            </Typography>
            <Typography variant="body2" component="span" sx={{ opacity: 0.8 }}>
              {t('create.classlessHint', 'No class. No abilities. Just you and the dark.')}
            </Typography>
          </ButtonBase>
          <ButtonBase
            data-testid="class-gate-random"
            disabled={busy}
            onClick={() => onPick({})}
            sx={{ ...styles.card, ...styles.special }}
          >
            <CasinoIcon />
            <Typography variant="h6" component="span">
              {t('create.randomClass', 'Random')}
            </Typography>
          </ButtonBase>
        </Box>
      )}
    </Box>
  );
}
```

- [ ] **Step 4: Run the test**

Run: `npm run test:browser -- ClassGate`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/organisms/character-create/ClassGate.tsx frontend/test/browser/organisms/ClassGate.test.tsx
git commit -m "feat(frontend): class gate screen for character creation"
```

---

### Task 13: Draft section molecules

**Files:**
- Create: `frontend/src/components/molecules/character-create/DraftSection.tsx`
- Create: `frontend/src/components/molecules/character-create/DraftStatsSection.tsx`
- Create: `frontend/src/components/molecules/character-create/DraftAbilitiesSection.tsx`
- Create: `frontend/src/components/molecules/character-create/DraftGearSection.tsx`
- Create: `frontend/src/components/molecules/character-create/DraftNameSection.tsx`
- Create: `frontend/src/components/molecules/character-create/DraftFlavorSection.tsx`
- Create: `frontend/src/components/molecules/character-create/DraftVitalsSection.tsx`

These are presentational: they take the `preview` (a `CharacterResponse` — the hydrated shape the live sheet already consumes) and re-roll callbacks. No API calls inside. Quiet motion only: content gets a brief opacity fade while its section re-rolls — no slides, no bounces.

- [ ] **Step 1: Implement the generic frame**

```tsx
// frontend/src/components/molecules/character-create/DraftSection.tsx
import type { ReactNode } from 'react';
import { Box, IconButton, Tooltip, Typography } from '@mui/material';
import CasinoIcon from '@mui/icons-material/Casino';
import { morkBorgColors } from '@/theme/morkBorgTheme';

export type DraftSectionProps = {
  title: string;
  rolling: boolean;
  onReroll: () => void;
  rerollLabel: string;
  /** Disable the die while another section rolls. */
  disabled?: boolean;
  /** Extra re-roll controls (e.g. vitals hosts omens + silver dice). */
  extraActions?: ReactNode;
  children: ReactNode;
  testId: string;
};

const styles = {
  root: {
    border: `2px solid ${morkBorgColors.black}`,
    p: 1.5,
    mb: 1.5,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    mb: 1,
  },
  content: (rolling: boolean) => ({
    transition: 'opacity 160ms ease',
    opacity: rolling ? 0.35 : 1,
  }),
};

export function DraftSection({
  title,
  rolling,
  onReroll,
  rerollLabel,
  disabled = false,
  extraActions,
  children,
  testId,
}: DraftSectionProps) {
  return (
    <Box sx={styles.root} data-testid={testId}>
      <Box sx={styles.header}>
        <Typography variant="h6" component="h2">{title}</Typography>
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          {extraActions}
          <Tooltip title={rerollLabel}>
            <span>
              <IconButton
                data-testid={`${testId}-reroll`}
                aria-label={rerollLabel}
                onClick={onReroll}
                disabled={disabled || rolling}
                size="small"
              >
                <CasinoIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        </Box>
      </Box>
      <Box sx={styles.content(rolling)} aria-busy={rolling}>
        {children}
      </Box>
    </Box>
  );
}
```

- [ ] **Step 2: Implement the concrete sections**

All concrete sections share this props shape (define it once in `DraftSection.tsx` and import):

```ts
// add to DraftSection.tsx exports
import type { CharacterResponse } from '@/hooks/models';
import type { DraftSection as DraftSectionName } from '@/api/draft';

export type SectionProps = {
  preview: CharacterResponse;
  rollingSection: DraftSectionName | null;
  onReroll: (section: DraftSectionName) => void;
};
```

```tsx
// frontend/src/components/molecules/character-create/DraftNameSection.tsx
import { Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { DraftSection, type SectionProps } from './DraftSection';

export function DraftNameSection({ preview, rollingSection, onReroll }: SectionProps) {
  const { t } = useTranslation();
  return (
    <DraftSection
      title={t('create.sections.name', 'Name')}
      rolling={rollingSection === 'name'}
      disabled={rollingSection !== null}
      onReroll={() => onReroll('name')}
      rerollLabel={t('create.rerollName', 'Re-roll name')}
      testId="draft-name"
    >
      <Typography variant="h5" component="p">{preview.name}</Typography>
    </DraftSection>
  );
}
```

```tsx
// frontend/src/components/molecules/character-create/DraftStatsSection.tsx
import { Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { DraftSection, type SectionProps } from './DraftSection';

const STATS = ['strength', 'agility', 'presence', 'toughness'] as const;

function toModifierLabel(value: number): string {
  // MÖRK BORG modifier: standard from-stat derivation used across the app.
  const mod = value <= 4 ? -3 : value <= 6 ? -2 : value <= 8 ? -1 : value <= 12 ? 0 : value <= 14 ? 1 : value <= 16 ? 2 : 3;
  return mod >= 0 ? `+${mod}` : `${mod}`;
}

export function DraftStatsSection({ preview, rollingSection, onReroll }: SectionProps) {
  const { t } = useTranslation();
  return (
    <DraftSection
      title={t('create.sections.stats', 'Stats & HP')}
      rolling={rollingSection === 'stats'}
      disabled={rollingSection !== null}
      onReroll={() => onReroll('stats')}
      rerollLabel={t('create.rerollStats', 'Re-roll stats')}
      testId="draft-stats"
    >
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1, textAlign: 'center' }}>
        {STATS.map((stat) => (
          <Box key={stat}>
            <Typography variant="caption" sx={{ textTransform: 'uppercase' }}>
              {t(`stats.${stat}`, stat)}
            </Typography>
            <Typography variant="h6">
              {toModifierLabel(preview[stat] as number)}
              <Typography component="span" variant="caption" sx={{ ml: 0.5, opacity: 0.7 }}>
                ({preview[stat] as number})
              </Typography>
            </Typography>
          </Box>
        ))}
      </Box>
      <Typography sx={{ mt: 1 }}>
        {t('create.hp', 'HP')}: {preview.maxHp}
      </Typography>
    </DraftSection>
  );
}
```

> Before writing `toModifierLabel`, check whether the frontend already exports a roll→modifier helper (search `frontend/src` for `rollToModifier` or similar, e.g. in `@/utils`); if it exists, use it instead of redefining.

```tsx
// frontend/src/components/molecules/character-create/DraftAbilitiesSection.tsx
import { Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { DraftSection, type SectionProps } from './DraftSection';

export function DraftAbilitiesSection({ preview, rollingSection, onReroll }: SectionProps) {
  const { t } = useTranslation();
  const abilities = (preview.abilities ?? []) as Array<{ key?: string; name?: string; description?: string }>;

  if (preview.classId === null && abilities.length === 0) {
    return null; // classless scvm: no abilities section at all
  }

  return (
    <DraftSection
      title={t('create.sections.abilities', 'Abilities')}
      rolling={rollingSection === 'abilities'}
      disabled={rollingSection !== null}
      onReroll={() => onReroll('abilities')}
      rerollLabel={t('create.rerollAbilities', 'Re-roll abilities')}
      testId="draft-abilities"
    >
      {abilities.map((ability) => (
        <Box key={ability.key ?? ability.name} sx={{ mb: 1 }}>
          <Typography variant="subtitle2">{ability.name ?? ability.key}</Typography>
          {ability.description && (
            <Typography variant="body2" sx={{ opacity: 0.8 }}>{ability.description}</Typography>
          )}
        </Box>
      ))}
    </DraftSection>
  );
}
```

```tsx
// frontend/src/components/molecules/character-create/DraftGearSection.tsx
import { Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { DraftSection, type SectionProps } from './DraftSection';

type Named = { key?: string; name?: string; amount?: number };

function ItemLine({ item }: { item: Named }) {
  return (
    <Typography variant="body2" component="li">
      {item.name ?? item.key}
      {typeof item.amount === 'number' && item.amount > 1 ? ` ×${item.amount}` : ''}
    </Typography>
  );
}

export function DraftGearSection({ preview, rollingSection, onReroll }: SectionProps) {
  const { t } = useTranslation();
  const weapons = (preview.equippedWeapons ?? []) as Named[];
  const armor = preview.equippedArmor as Named | null;
  const equipment = (preview.equipment ?? []) as Named[];

  return (
    <DraftSection
      title={t('create.sections.gear', 'Gear')}
      rolling={rollingSection === 'gear'}
      disabled={rollingSection !== null}
      onReroll={() => onReroll('gear')}
      rerollLabel={t('create.rerollGear', 'Re-roll gear')}
      testId="draft-gear"
    >
      {weapons.length > 0 && (
        <Box sx={{ mb: 1 }}>
          <Typography variant="caption" sx={{ textTransform: 'uppercase' }}>
            {t('create.weapons', 'Weapons')}
          </Typography>
          <Box component="ul" sx={{ m: 0, pl: 2 }}>
            {weapons.map((w, i) => <ItemLine key={`${w.key}-${i}`} item={w} />)}
          </Box>
        </Box>
      )}
      {armor?.key && (
        <Typography variant="body2" sx={{ mb: 1 }}>
          {t('create.armor', 'Armor')}: {armor.name ?? armor.key}
        </Typography>
      )}
      <Typography variant="caption" sx={{ textTransform: 'uppercase' }}>
        {t('create.inventory', 'Inventory')}
      </Typography>
      <Box component="ul" sx={{ m: 0, pl: 2 }}>
        {equipment.map((item, i) => <ItemLine key={`${item.key}-${i}`} item={item} />)}
      </Box>
    </DraftSection>
  );
}
```

> The hydrated equipment list repeats stackable items (e.g. five torch entries). Check how the live sheet aggregates them (`frontend/src/utils/aggregateItems.ts`) and reuse `aggregateItems` here if its output shape fits a simple name×count list — prefer reuse over the raw repeated list.

```tsx
// frontend/src/components/molecules/character-create/DraftVitalsSection.tsx
import { IconButton, Tooltip, Typography } from '@mui/material';
import CasinoIcon from '@mui/icons-material/Casino';
import { useTranslation } from 'react-i18next';
import { DraftSection, type SectionProps } from './DraftSection';

/**
 * Grouped panel hosting TWO independent re-rolls (omens, silver) — the seed
 * model keeps them separate sections; this panel just co-locates them.
 * The frame's main die re-rolls omens; silver gets an extra die.
 */
export function DraftVitalsSection({ preview, rollingSection, onReroll }: SectionProps) {
  const { t } = useTranslation();
  return (
    <DraftSection
      title={t('create.sections.vitals', 'Omens & Silver')}
      rolling={rollingSection === 'omens' || rollingSection === 'silver'}
      disabled={rollingSection !== null}
      onReroll={() => onReroll('omens')}
      rerollLabel={t('create.rerollOmens', 'Re-roll omens')}
      testId="draft-vitals"
      extraActions={
        <Tooltip title={t('create.rerollSilver', 'Re-roll silver')}>
          <span>
            <IconButton
              data-testid="draft-vitals-reroll-silver"
              aria-label={t('create.rerollSilver', 'Re-roll silver')}
              onClick={() => onReroll('silver')}
              disabled={rollingSection !== null}
              size="small"
            >
              <CasinoIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
      }
    >
      <Typography>{t('create.omens', 'Omens')}: {preview.omens}</Typography>
      <Typography>{t('create.silver', 'Silver')}: {preview.silver}</Typography>
    </DraftSection>
  );
}
```

```tsx
// frontend/src/components/molecules/character-create/DraftFlavorSection.tsx
import { IconButton, Tooltip, Typography } from '@mui/material';
import CasinoIcon from '@mui/icons-material/Casino';
import { useTranslation } from 'react-i18next';
import { DraftSection, type SectionProps } from './DraftSection';

/** Grouped panel: personality (main die) + origin (extra die, class-only). */
export function DraftFlavorSection({ preview, rollingSection, onReroll }: SectionProps) {
  const { t } = useTranslation();
  const lines = [
    preview.bodyDescription,
    preview.habit,
    preview.tale,
    [preview.trait1, preview.trait2].filter(Boolean).join(', '),
  ].filter((line): line is string => Boolean(line && line.length));

  return (
    <DraftSection
      title={t('create.sections.flavor', 'Flavor')}
      rolling={rollingSection === 'personality' || rollingSection === 'origin'}
      disabled={rollingSection !== null}
      onReroll={() => onReroll('personality')}
      rerollLabel={t('create.rerollPersonality', 'Re-roll personality')}
      testId="draft-flavor"
      extraActions={
        preview.classId !== null ? (
          <Tooltip title={t('create.rerollOrigin', 'Re-roll origin')}>
            <span>
              <IconButton
                data-testid="draft-flavor-reroll-origin"
                aria-label={t('create.rerollOrigin', 'Re-roll origin')}
                onClick={() => onReroll('origin')}
                disabled={rollingSection !== null}
                size="small"
              >
                <CasinoIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        ) : undefined
      }
    >
      {preview.origin && (
        <Typography variant="body2" sx={{ mb: 0.5, fontStyle: 'italic' }}>{preview.origin}</Typography>
      )}
      {lines.map((line, i) => (
        <Typography key={i} variant="body2">{line}</Typography>
      ))}
    </DraftSection>
  );
}
```

> Field naming: the hydrated preview uses the same camelCase fields as the live character read (`bodyDescription`, `trait1`…). Confirm against `frontend/src/hooks/models.ts` `CharacterResponse` and adjust property access if the type differs.

- [ ] **Step 3: Validate**

Run (in `frontend/`): `npx tsc --noEmit && npm run lint`
Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/molecules/character-create/
git commit -m "feat(frontend): draft section components for the creation sheet"
```

---

### Task 14: Containers, page, route

**Files:**
- Create: `frontend/src/components/organisms/character-create/CreateSummaryBar.tsx`
- Create: `frontend/src/components/organisms/character-create/CreateSheetDesktop.tsx`
- Create: `frontend/src/components/organisms/character-create/CreateSheetMobile.tsx`
- Create: `frontend/src/pages/CharacterCreatePage.tsx`
- Modify: `frontend/src/router/index.tsx`
- Test: `frontend/test/browser/pages/CharacterCreatePage.test.tsx`

- [ ] **Step 1: Write the failing page test**

```tsx
// frontend/test/browser/pages/CharacterCreatePage.test.tsx
import { render } from 'vitest-browser-react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import BrowserTestProvider from '../BrowserTestProvider';
import { CharacterCreatePage } from '@/pages/CharacterCreatePage';
import { useCharacterDraft } from '@/hooks/useCharacterDraft';

vi.mock('@/seo/Seo', () => ({ Seo: () => null }));
vi.mock('@/hooks/useCharacterDraft', () => ({
  useCharacterDraft: vi.fn(),
}));
vi.mock('@/components/organisms/character-create/ClassGate', () => ({
  ClassGate: ({ onPick }: { onPick: (c: unknown) => void }) => (
    <button data-testid="mock-class-gate" onClick={() => onPick({ classId: 1 })}>gate</button>
  ),
}));

const preview = {
  id: null,
  name: 'Brint',
  classId: 1,
  className: 'Gutterborn Scvm',
  strength: 10, agility: 10, presence: 12, toughness: 8,
  maxHp: 5, currentHp: 5, omens: 2, silver: 60,
  habit: 'habit text', tale: 'tale text', bodyDescription: 'gnarled',
  trait1: 'bitter', trait2: 'hungry',
  abilities: [{ key: 'a.one', name: 'Pickpocket' }],
  equipment: [{ key: 'equipment.rope', name: 'Rope' }],
  equippedWeapons: [{ key: 'weapons.club', name: 'Femur Club' }],
  equippedArmor: null,
};

describe('CharacterCreatePage', () => {
  const start = vi.fn();
  const reroll = vi.fn();
  const confirm = vi.fn();
  const restart = vi.fn();

  const mockDraftState = (overrides: Record<string, unknown> = {}) => {
    vi.mocked(useCharacterDraft).mockReturnValue({
      phase: 'sheet',
      draft: { classId: 1, classless: false, seeds: {} },
      preview,
      rollingSection: null,
      isStarting: false,
      isConfirming: false,
      error: null,
      start, reroll, confirm, restart,
      ...overrides,
    } as unknown as ReturnType<typeof useCharacterDraft>);
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows the class gate in the class-gate phase', async () => {
    mockDraftState({ phase: 'class-gate', draft: null, preview: null });
    render(<BrowserTestProvider><CharacterCreatePage /></BrowserTestProvider>);

    await expect.element(page.getByTestId('mock-class-gate')).toBeVisible();
    await userEvent.click(page.getByTestId('mock-class-gate'));
    expect(start).toHaveBeenCalledWith({ classId: 1 });
  });

  it('shows all sections and the confirm bar in the sheet phase', async () => {
    mockDraftState();
    render(<BrowserTestProvider><CharacterCreatePage /></BrowserTestProvider>);

    await expect.element(page.getByTestId('draft-name')).toBeVisible();
    await expect.element(page.getByTestId('draft-stats')).toBeVisible();
    await expect.element(page.getByTestId('draft-gear')).toBeVisible();
    await expect.element(page.getByTestId('create-confirm-button')).toBeVisible();
  });

  it('re-rolls a section through its die button', async () => {
    mockDraftState();
    render(<BrowserTestProvider><CharacterCreatePage /></BrowserTestProvider>);

    await userEvent.click(page.getByTestId('draft-stats-reroll'));
    expect(reroll).toHaveBeenCalledWith('stats');
  });

  it('confirms through the summary bar', async () => {
    mockDraftState();
    render(<BrowserTestProvider><CharacterCreatePage /></BrowserTestProvider>);

    await userEvent.click(page.getByTestId('create-confirm-button'));
    expect(confirm).toHaveBeenCalled();
  });

  it('surfaces errors as an alert', async () => {
    mockDraftState({ error: 'Failed to re-roll' });
    render(<BrowserTestProvider><CharacterCreatePage /></BrowserTestProvider>);

    await expect.element(page.getByText(/failed to re-roll/i)).toBeVisible();
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npm run test:browser -- CharacterCreatePage`
Expected: FAIL — modules not found.

- [ ] **Step 3: Implement the summary bar and containers**

```tsx
// frontend/src/components/organisms/character-create/CreateSummaryBar.tsx
import { Box, Button, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { morkBorgColors } from '@/theme/morkBorgTheme';

type CreateSummaryBarProps = {
  className: string | null;
  onConfirm: () => void;
  onRestart: () => void;
  confirming: boolean;
  busy: boolean;
};

export function CreateSummaryBar({ className, onConfirm, onRestart, confirming, busy }: CreateSummaryBarProps) {
  const { t } = useTranslation();
  return (
    <Box
      sx={{
        position: 'sticky',
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 1,
        p: 1.5,
        bgcolor: morkBorgColors.black,
        color: morkBorgColors.yellow,
        zIndex: 2,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography variant="body2">
          {className ?? t('create.classlessLabel', 'Classless')}
        </Typography>
        <Button
          data-testid="create-restart-button"
          onClick={onRestart}
          disabled={busy}
          size="small"
          sx={{ color: morkBorgColors.yellow, textDecoration: 'underline' }}
        >
          {t('create.changeClass', 'Change class')}
        </Button>
      </Box>
      <Button
        data-testid="create-confirm-button"
        variant="contained"
        onClick={onConfirm}
        disabled={busy || confirming}
        sx={{
          bgcolor: morkBorgColors.pink,
          color: morkBorgColors.black,
          borderRadius: 0,
          '&:hover': { bgcolor: morkBorgColors.yellow },
        }}
      >
        {confirming
          ? t('create.confirming', 'Creating…')
          : t('create.confirm', 'Create this wretch')}
      </Button>
    </Box>
  );
}
```

```tsx
// frontend/src/components/organisms/character-create/CreateSheetDesktop.tsx
import { Box } from '@mui/material';
import type { SectionProps } from '@/components/molecules/character-create/DraftSection';
import { DraftNameSection } from '@/components/molecules/character-create/DraftNameSection';
import { DraftStatsSection } from '@/components/molecules/character-create/DraftStatsSection';
import { DraftAbilitiesSection } from '@/components/molecules/character-create/DraftAbilitiesSection';
import { DraftGearSection } from '@/components/molecules/character-create/DraftGearSection';
import { DraftVitalsSection } from '@/components/molecules/character-create/DraftVitalsSection';
import { DraftFlavorSection } from '@/components/molecules/character-create/DraftFlavorSection';

/** Thin one-pager container: two columns of the shared sections. */
export function CreateSheetDesktop(props: SectionProps) {
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5, py: 2 }} data-testid="create-sheet-desktop">
      <Box>
        <DraftNameSection {...props} />
        <DraftStatsSection {...props} />
        <DraftVitalsSection {...props} />
        <DraftFlavorSection {...props} />
      </Box>
      <Box>
        <DraftAbilitiesSection {...props} />
        <DraftGearSection {...props} />
      </Box>
    </Box>
  );
}
```

```tsx
// frontend/src/components/organisms/character-create/CreateSheetMobile.tsx
import { useState } from 'react';
import { Box, Button, MobileStepper, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import type { SectionProps } from '@/components/molecules/character-create/DraftSection';
import { DraftNameSection } from '@/components/molecules/character-create/DraftNameSection';
import { DraftStatsSection } from '@/components/molecules/character-create/DraftStatsSection';
import { DraftAbilitiesSection } from '@/components/molecules/character-create/DraftAbilitiesSection';
import { DraftGearSection } from '@/components/molecules/character-create/DraftGearSection';
import { DraftVitalsSection } from '@/components/molecules/character-create/DraftVitalsSection';
import { DraftFlavorSection } from '@/components/molecules/character-create/DraftFlavorSection';

/**
 * Thin wizard container: one shared section per step with a live one-line
 * summary on top. Steps don't gate each other — every section is already
 * rolled; the wizard is purely a small-screen presentation.
 */
export function CreateSheetMobile(props: SectionProps) {
  const { t } = useTranslation();
  const [step, setStep] = useState(0);

  const steps = [
    <DraftNameSection key="name" {...props} />,
    <DraftStatsSection key="stats" {...props} />,
    <DraftAbilitiesSection key="abilities" {...props} />,
    <DraftGearSection key="gear" {...props} />,
    <DraftVitalsSection key="vitals" {...props} />,
    <DraftFlavorSection key="flavor" {...props} />,
  ].filter((node) => node !== null);

  const { preview } = props;

  return (
    <Box data-testid="create-sheet-mobile" sx={{ py: 2 }}>
      <Typography variant="body2" sx={{ opacity: 0.8, mb: 1 }}>
        {preview.name} · HP {preview.maxHp} · {preview.silver}s
      </Typography>
      {steps[step]}
      <MobileStepper
        variant="dots"
        steps={steps.length}
        position="static"
        activeStep={step}
        nextButton={
          <Button
            size="small"
            data-testid="create-step-next"
            onClick={() => setStep((s) => Math.min(s + 1, steps.length - 1))}
            disabled={step === steps.length - 1}
          >
            {t('create.next', 'Next')}
          </Button>
        }
        backButton={
          <Button
            size="small"
            data-testid="create-step-back"
            onClick={() => setStep((s) => Math.max(s - 1, 0))}
            disabled={step === 0}
          >
            {t('create.back', 'Back')}
          </Button>
        }
      />
    </Box>
  );
}
```

> `DraftAbilitiesSection` returns `null` for classless characters — JSX `<DraftAbilitiesSection …/>` is never `null` as an element, so the `.filter` above won't drop it. Instead, build the steps array conditionally: `...(preview.classId !== null ? [<DraftAbilitiesSection key="abilities" {...props} />] : [])`. Apply that fix when implementing.

```tsx
// frontend/src/pages/CharacterCreatePage.tsx
import { Alert, Box, CircularProgress, useMediaQuery, useTheme } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Seo } from '@/seo/Seo';
import { useCharacterDraft } from '@/hooks/useCharacterDraft';
import { ClassGate } from '@/components/organisms/character-create/ClassGate';
import { CreateSheetDesktop } from '@/components/organisms/character-create/CreateSheetDesktop';
import { CreateSheetMobile } from '@/components/organisms/character-create/CreateSheetMobile';
import { CreateSummaryBar } from '@/components/organisms/character-create/CreateSummaryBar';
import { appHistory } from '@/router/history';

export function CharacterCreatePage() {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const locale = (i18n.language ?? 'en').split('-')[0];

  const {
    phase,
    preview,
    rollingSection,
    isStarting,
    isConfirming,
    error,
    start,
    reroll,
    confirm,
    restart,
  } = useCharacterDraft(locale, {
    onCreated: (characterId) => {
      void appHistory.push(`/character/${characterId}`);
      appHistory.flush();
    },
  });

  return (
    <>
      <Seo
        title={t('create.seoTitle', 'Forge a Scvm')}
        description="Pick a class, roll, re-roll, and create your MÖRK BORG character."
        path="/character/create"
        noIndex
      />

      {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}

      {phase === 'class-gate' && !isStarting && (
        <ClassGate onPick={(choice) => void start(choice)} busy={isStarting} />
      )}

      {isStarting && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      )}

      {phase === 'sheet' && preview && (
        <>
          {isMobile ? (
            <CreateSheetMobile preview={preview} rollingSection={rollingSection} onReroll={(s) => void reroll(s)} />
          ) : (
            <CreateSheetDesktop preview={preview} rollingSection={rollingSection} onReroll={(s) => void reroll(s)} />
          )}
          <CreateSummaryBar
            className={preview.className ?? null}
            onConfirm={() => void confirm()}
            onRestart={restart}
            confirming={isConfirming}
            busy={rollingSection !== null || isStarting}
          />
        </>
      )}
    </>
  );
}
```

- [ ] **Step 4: Register the route**

In `frontend/src/router/index.tsx`, add after `characterNewRoute` (the static `create` segment must be a sibling of `/character/$characterId`; TanStack Router ranks static over dynamic, mirroring how `/character/new` already coexists):

```tsx
const characterCreateRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/character/create',
    component: lazyRouteComponent(() => import('@/pages/CharacterCreatePage').then(m => ({ default: m.CharacterCreatePage }))),
});
```

and add `characterCreateRoute` to `rootRoute.addChildren([...])`.

Also add `'create'` to `RESERVED_CHARACTER_PATH_SEGMENTS` in `frontend/src/router/navigation.ts` (`new Set(['new', 'create'])`) so `getCurrentCharacterIdParam()` doesn't read "create" as a character id — there is a unit test file `frontend/test/unit/router/navigation.test.ts`; extend it:

```ts
// append to the navigation describe block, mirroring the existing 'new' case
it('does not treat /character/create as a character id', () => {
  appHistory.replace('/character/create');
  expect(getCurrentCharacterIdParam()).toBeNull();
});
```

*(Match the test file's actual setup helpers for manipulating appHistory — read it before editing.)*

- [ ] **Step 5: Run tests**

Run: `npm run test:browser -- CharacterCreatePage` and `npm run test:unit -- navigation`
Expected: PASS.

- [ ] **Step 6: Validate + commit**

Run: `npx tsc --noEmit && npm run lint && npm run doctor`

```bash
git add frontend/src/components/organisms/character-create/ frontend/src/pages/CharacterCreatePage.tsx frontend/src/router/index.tsx frontend/src/router/navigation.ts frontend/test/browser/pages/CharacterCreatePage.test.tsx frontend/test/unit/router/navigation.test.ts
git commit -m "feat(frontend): character create page with responsive containers and route"
```

---

### Task 15: Entry points + i18n keys

**Files:**
- Modify: `frontend/src/pages/CharactersListPage.tsx`
- Modify: `frontend/src/i18n/en.json`, `frontend/src/i18n/pl.json`
- Test: `frontend/test/browser/pages/CharactersListPage.test.tsx` (append)

- [ ] **Step 1: Append failing test**

```tsx
it('offers the creation flow next to quick generate', async () => {
  await renderCharactersList();

  const forgeLink = page.getByRole('link', { name: /forge a scvm/i });
  await expect.element(forgeLink).toBeVisible();
  await expect.element(forgeLink).toHaveAttribute('href', '/character/create');
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npm run test:browser -- CharactersListPage`
Expected: the new test FAILS.

- [ ] **Step 3: Implement**

In `CharactersListPage.tsx` header actions (next to the "Generate New" button), add:

```tsx
<Button
    component={Link}
    to="/character/create"
    variant="contained"
    sx={listStyles.newButton}
>
    {t('create.entry', 'Forge a Scvm')}
</Button>
```

And in the empty state, under the existing "Create Character" button, add a second link styled as the outlined variant:

```tsx
<Button component={Link} to="/character/create" variant="outlined" sx={{ ...listStyles.backButton, ml: 1 }}>
    {t('create.entry', 'Forge a Scvm')}
</Button>
```

Also audit the other "new character" affordances for the two-button treatment: search `frontend/src` for links/pushes to `/character/new` and `buildHomeCallbackUrl(null)` (e.g. the LandingPage CTA). Wherever a user-facing "create/generate a character" action exists outside the sheet bootstrap logic, add a sibling "Forge a Scvm" link to `/character/create` using the same `create.entry` key and the surrounding component's button styling. Do NOT touch `useAutoCreateCharacter` or other bootstrap internals — only visible buttons/links.

Add i18n keys to **both** `en.json` and `pl.json` (top-level `create` object; keep key order alphabetical within the object if the files do so — check):

```json
"create": {
  "entry": "Forge a Scvm",
  "seoTitle": "Forge a Scvm",
  "chooseClass": "Choose your misery",
  "chooseClassHint": "Pick a class, go classless, or let the dice decide.",
  "classless": "Classless Scvm",
  "classlessHint": "No class. No abilities. Just you and the dark.",
  "randomClass": "Random",
  "classLoadError": "Failed to load classes",
  "sections": {
    "name": "Name",
    "stats": "Stats & HP",
    "abilities": "Abilities",
    "gear": "Gear",
    "vitals": "Omens & Silver",
    "flavor": "Flavor"
  },
  "rerollName": "Re-roll name",
  "rerollStats": "Re-roll stats",
  "rerollAbilities": "Re-roll abilities",
  "rerollGear": "Re-roll gear",
  "rerollOmens": "Re-roll omens",
  "rerollSilver": "Re-roll silver",
  "rerollPersonality": "Re-roll personality",
  "rerollOrigin": "Re-roll origin",
  "hp": "HP",
  "omens": "Omens",
  "silver": "Silver",
  "weapons": "Weapons",
  "armor": "Armor",
  "inventory": "Inventory",
  "next": "Next",
  "back": "Back",
  "changeClass": "Change class",
  "classlessLabel": "Classless",
  "confirm": "Create this wretch",
  "confirming": "Creating…"
}
```

Polish (`pl.json`):

```json
"create": {
  "entry": "Wykuj Scvma",
  "seoTitle": "Wykuj Scvma",
  "chooseClass": "Wybierz swoją niedolę",
  "chooseClassHint": "Wybierz klasę, graj bez klasy albo pozwól zdecydować kościom.",
  "classless": "Scvm bez klasy",
  "classlessHint": "Bez klasy. Bez zdolności. Tylko ty i mrok.",
  "randomClass": "Losowo",
  "classLoadError": "Nie udało się wczytać klas",
  "sections": {
    "name": "Imię",
    "stats": "Cechy i PŻ",
    "abilities": "Zdolności",
    "gear": "Ekwipunek",
    "vitals": "Omeny i srebro",
    "flavor": "Charakter"
  },
  "rerollName": "Przerzuć imię",
  "rerollStats": "Przerzuć cechy",
  "rerollAbilities": "Przerzuć zdolności",
  "rerollGear": "Przerzuć ekwipunek",
  "rerollOmens": "Przerzuć omeny",
  "rerollSilver": "Przerzuć srebro",
  "rerollPersonality": "Przerzuć charakter",
  "rerollOrigin": "Przerzuć pochodzenie",
  "hp": "PŻ",
  "omens": "Omeny",
  "silver": "Srebro",
  "weapons": "Broń",
  "armor": "Pancerz",
  "inventory": "Inwentarz",
  "next": "Dalej",
  "back": "Wstecz",
  "changeClass": "Zmień klasę",
  "classlessLabel": "Bez klasy",
  "confirm": "Stwórz tego nędznika",
  "confirming": "Tworzenie…"
}
```

- [ ] **Step 4: Run tests + validate**

Run: `npm run test:browser -- CharactersListPage` then `npx tsc --noEmit && npm run lint`
Expected: PASS / clean.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/CharactersListPage.tsx frontend/src/i18n/en.json frontend/src/i18n/pl.json frontend/test/browser/pages/CharactersListPage.test.tsx
git commit -m "feat(frontend): creation flow entry points and i18n keys"
```

---

### Task 16: E2E happy path

**Files:**
- Create: `backend/tests/e2e/tests/authed/character-create.spec.ts`

- [ ] **Step 1: Read the existing authed spec for harness conventions**

Read `backend/tests/e2e/tests/authed/characters-list.spec.ts` — it shows how a session is established (anonymous Better Auth) and how pages navigate. Reuse its setup helpers verbatim.

- [ ] **Step 2: Write the spec**

```ts
// backend/tests/e2e/tests/authed/character-create.spec.ts
import { expect, test } from '@playwright/test';
// Reuse whatever auth/session bootstrap characters-list.spec.ts uses.

test.describe('character creation flow', () => {
  test('pick class, re-roll stats, confirm, land on the sheet', async ({ page }) => {
    await page.goto('/character/create');

    // Class gate: pick the first class card.
    const firstClass = page.getByTestId(/class-gate-class-/).first();
    await firstClass.click();

    // Sheet phase: stats section is visible with a name rolled.
    await expect(page.getByTestId('draft-stats')).toBeVisible();
    const nameBefore = await page.getByTestId('draft-name').innerText();

    // Re-roll stats: the section content changes or at least the request fires.
    const rerollResponse = page.waitForResponse((r) =>
      r.url().includes('/api/characters/draft/reroll/stats') && r.ok()
    );
    await page.getByTestId('draft-stats-reroll').click();
    await rerollResponse;

    // Name must be untouched by a stats re-roll (seed isolation).
    await expect(page.getByTestId('draft-name')).toContainText(nameBefore.replace(/\s+/g, ' ').trim().split('\n')[0] ?? '');

    // Confirm.
    const confirmResponse = page.waitForResponse((r) =>
      r.url().includes('/api/characters/new') && r.status() === 201
    );
    await page.getByTestId('create-confirm-button').click();
    await confirmResponse;

    // Lands on the real character sheet route.
    await expect(page).toHaveURL(/\/character\/[0-9a-f-]{36}/);
  });
});
```

*(Adjust selectors/bootstrap to the conventions found in step 1 — especially the privacy-consent acknowledgement, which gates backend writes for fresh sessions; the existing authed specs deal with it.)*

- [ ] **Step 3: Run the e2e suite**

Run (in `backend/`): `npm run test:e2e`
Expected: PASS including the new spec. This is dockerized and slow — run once here, not per-iteration.

- [ ] **Step 4: Commit**

```bash
git add backend/tests/e2e/tests/authed/character-create.spec.ts
git commit -m "test(e2e): character creation happy path"
```

---

### Task 17: Final validation sweep

- [ ] **Step 1: Full frontend validation checklist (per CLAUDE.md)**

```bash
cd frontend && npx tsc --noEmit && npm run lint && npm run doctor
cd ../backend && npm run build:ts
cd tests/unit-be && npm test
cd ../../../frontend && npm run test:browser
```

Expected: all green.

- [ ] **Step 2: Optional but recommended — regenerate the OpenAPI client**

With the dev stack running (`cd backend && npm run dev`), run `cd frontend && npm run generate-api`, eyeball the `schema.ts` diff (new draft paths appear), and confirm `npx tsc --noEmit` stays clean. Commit separately if done:

```bash
git add frontend/src/api/schema.ts
git commit -m "chore(frontend): regenerate API client with draft endpoints"
```

- [ ] **Step 3: Update changelog area files**

Append a short entry describing the creation flow to `changelog/frontend.md` and `changelog/backend.md` (these are "what the product does today" docs — match their tone). Do NOT create release notes or bump versions; that happens when a release is cut.

```bash
git add changelog/
git commit -m "docs: describe character creation flow in changelog areas"
```

---

### Task 18: Classless `4d6 drop-lowest` stat choices (2026-06-13 scope addition)

**Files:**
- Modified: `backend/src/lib/draft-seeds.ts`
- Modified: `backend/src/lib/generate-character.ts`
- Modified: `backend/src/services/character-draft-service.ts`
- Modified: `backend/src/services/character-service.ts`
- Modified: `backend/src/schemas/draft.ts`
- Modified: `backend/src/schemas/character.ts`
- Modified: `backend/src/routes/characters/index.ts`
- Modified: `frontend/src/api/draft.ts`
- Modified: `frontend/src/hooks/useCharacterDraft.ts`
- Modified: `frontend/src/pages/CharacterCreatePage.tsx`
- Modified: `frontend/src/components/molecules/character-create/DraftStatsSection.tsx`
- Modified: `frontend/src/components/molecules/character-create/DraftSection.tsx`
- Modified: `frontend/src/components/organisms/character-create/CreateSummaryBar.tsx`
- Modified: `frontend/src/i18n/en.json`
- Modified: `frontend/src/i18n/pl.json`

- [x] Backend draft model accepts normalized `dropLowestAbilities` for classless drafts only, capped at two valid abilities.
- [x] Classless stat generation rolls four d6 per ability, exposes dice plus LOW/MAX totals, applies MAX only to selected abilities, and persists only final ability totals.
- [x] Draft preview responses expose `classlessStatOptions`; classless confirmation rejects incomplete selections with `CLASSLESS_STATS_INCOMPLETE`.
- [x] Frontend draft state preserves stat choices across rerolls and rehydration, with stat-choice updates separated from section rolling to avoid reroll blink.
- [x] Stats UI shows all dice, LOW/MAX outcomes, selected MAX state, a `0/2` to `2/2` gate, and disables confirmation until two MAX abilities are selected.
- [x] Classless stat cards use a two-column grid at all responsive sizes so dice/outcome chips stay readable inside the desktop sheet column.
- [x] Added focused backend, frontend hook, and browser tests for classless stat choices and confirm gating.

---

## Out of scope (per spec non-goals)

- Hand-picking abilities/items, arbitrary stat editing beyond the classless two-MAX rule, cross-device drafts, changes to `/character/new` auto-create, version bump / release notes / ReleasePage card (done at release time).
