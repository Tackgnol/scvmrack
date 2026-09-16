# Getting Better Flow - Design Spec

**Date:** 2026-07-07
**Status:** Approved direction, ready for implementation planning
**Surface:** Character sheet, owner-only

## Summary

Getting Better is an owner-only character improvement workflow for the MORK BORG
sheet. Opening the workflow rolls a persistent preview once, lets the player
reroll individual sections or the whole preview, lets the player enter values
rolled at the table, then applies the edited preview as one explicit character
commit.

The preview is not a normal optimistic character edit. It is a typed command
draft: rolls can be reviewed and edited locally, but the character is unchanged
until the user clicks `Apply getting better`.

## Decisions

| Question | Decision |
|---|---|
| Ability storage | Keep raw ability scores, but extend modifier conversion above 18: 19 = +4, 20 = +5, 21+ = +6. |
| Ability rule model | Getting Better operates on displayed modifiers, then stores the canonical raw score for the resulting modifier. |
| High score cap | Clamp applied raw ability scores to 21, because 21 is +6 and anything higher is invisible. |
| Low score handling | Improvement results are modifier-authoritative and canonicalize to the resulting modifier's raw score. |
| Preview ownership | One active unapplied preview per character. Opening the panel uses `getOrCreateActivePreview`. |
| Opening behavior | Idempotent. Opening again returns the same active preview, never rerolls implicitly. |
| Reroll behavior | Per-section rerolls exist. `Reroll all` is available at the bottom and confirms if local edits are dirty. |
| Manual table values | Allowed. Manual edits live locally while the panel is open and are sent only on apply. |
| Autosave | No preview autosave. It makes undo and dirty state too hard to reason about. |
| Undo | `Undo edits` resets local working values back to the server-rolled preview. It does not revert an applied improvement. |
| Closing dirty preview | Warn before discarding local table-entered values. |
| Staleness | Apply is blocked if character fields touched by the preview changed since the preview snapshot. |
| HP increase | More HP only raises `maxHp`; it does not heal `currentHp`. |
| Debris scrolls | A scroll result rolls a concrete catalog scroll and adds it to on-hand equipment on apply. |
| Scum specialties | Model Gutterborn Scum specialties as structured slots; enforce distinct specialties. |
| History | Persist typed improvement history for applied rows and a typed active preview for unapplied work. |

## Ability Mapping

The existing raw scores stay in the database. Modifier calculation changes to:

| Raw score | Modifier |
|---:|---:|
| <= 4 | -3 |
| 5-6 | -2 |
| 7-8 | -1 |
| 9-12 | 0 |
| 13-14 | +1 |
| 15-16 | +2 |
| 17-18 | +3 |
| 19 | +4 |
| 20 | +5 |
| >= 21 | +6 |

When Getting Better changes an ability, the resulting modifier is converted back
to a deterministic canonical raw score:

| Modifier | Canonical raw score |
|---:|---:|
| -3 | 4 |
| -2 | 5 |
| -1 | 7 |
| 0 | 9 |
| +1 | 13 |
| +2 | 15 |
| +3 | 17 |
| +4 | 19 |
| +5 | 20 |
| +6 | 21 |

### Ability Improvement Algorithm

```ts
const currentModifier = scoreToModifier(currentRawScore);
const roll = d6();

let nextModifier: number;
if (currentModifier <= 1) {
  nextModifier = roll === 1
    ? Math.max(-3, currentModifier - 1)
    : Math.min(6, currentModifier + 1);
} else {
  nextModifier = roll >= currentModifier
    ? Math.min(6, currentModifier + 1)
    : Math.max(-3, currentModifier - 1);
}

const nextRawScore = modifierToCanonicalScore(nextModifier);
```

This deliberately avoids raw-score buffer points. Each visible modifier change
maps to one stored score.

## Domain Types

The database stores JSONB, but services must treat the JSON as typed domain data.
JSON Schema validation should live in `backend/src/schemas/character-improvement.ts`.

```ts
type AbilityStat = 'strength' | 'agility' | 'presence' | 'toughness';

type RollSource = 'server' | 'table';

type RollValue = {
  source: RollSource;
  dice?: number[];
  total: number;
};

type ImprovementCharacterSnapshot = {
  characterUpdatedAt: string;
  maxHp: number;
  silver: number;
  abilities: Record<AbilityStat, number>;
  abilityKeys: string[];
  equipmentFingerprint: string;
  snapshotHash: string;
};

type ImprovementHpRoll = {
  check: RollValue;          // 6d10 total
  fromMaxHp: number;
  succeeds: boolean;
  increase: RollValue | null; // d6 when succeeds
  toMaxHp: number;
};

type ImprovementDebrisRoll =
  | { roll: RollValue; kind: 'nothing' }
  | { roll: RollValue; kind: 'silver'; silver: RollValue; amount: number }
  | { roll: RollValue; kind: 'uncleanScroll'; scroll: RollValue; itemKey: string }
  | { roll: RollValue; kind: 'sacredScroll'; scroll: RollValue; itemKey: string };

type ImprovementAbilityRoll = {
  roll: RollValue;
  fromScore: number;
  fromModifier: number;
  toModifier: number;
  toScore: number;
  outcome: 'increase' | 'decrease' | 'same';
};

type SpecialtySlot = {
  key: string;
  rollValue: number;
};

type SpecialtyRoll = SpecialtySlot & {
  roll: RollValue;
};

type ScumSpecialtyDraft =
  | { kind: 'notScum' }
  | { kind: 'firstImprovement'; existing: SpecialtySlot; added: SpecialtyRoll }
  | {
      kind: 'laterImprovement';
      primary: SpecialtySlot;
      secondary: SpecialtySlot;
      rerollMode: 'none' | 'primary' | 'secondary' | 'both';
    };

type ImprovementDraft = {
  sequence: number;
  snapshot: ImprovementCharacterSnapshot;
  hp: ImprovementHpRoll;
  debris: ImprovementDebrisRoll;
  abilities: Record<AbilityStat, ImprovementAbilityRoll>;
  scumSpecialties: ScumSpecialtyDraft;
};

type AppliedImprovement = {
  draftId: string;
  sequence: number;
  appliedAt: string;
  draft: ImprovementDraft;
  changes: {
    maxHp?: { from: number; to: number };
    silver?: { from: number; to: number };
    equipmentAdded?: Array<{ itemKey: string }>;
    abilities: Partial<Record<AbilityStat, { fromScore: number; toScore: number }>>;
    abilityKeys?: { from: string[]; to: string[] };
  };
};
```

The apply endpoint receives a full `ImprovementDraft` because table values can
differ from the persisted server roll. The backend must recompute derived fields
from the submitted roll values and the stored snapshot before writing changes.
It must not trust client-supplied `toScore`, `toModifier`, `toMaxHp`, or changes.

## Persistence

Add a Prisma model and a migration-owned partial unique index so a character has
at most one active preview.

```prisma
model CharacterImprovement {
  id           String    @id @default(uuid()) @db.Uuid
  characterId  String    @map("character_id") @db.Uuid
  sequence     Int
  rolledDraft  Json      @map("rolled_draft")
  applied      Json?
  snapshotHash String    @map("snapshot_hash") @db.VarChar(128)
  createdAt    DateTime  @default(now()) @map("created_at")
  updatedAt    DateTime  @updatedAt @map("updated_at")
  appliedAt    DateTime? @map("applied_at")

  character Character @relation(fields: [characterId], references: [id], onDelete: Cascade)

  @@unique([characterId, sequence])
  @@index([characterId, appliedAt])
  @@map("character_improvements")
}
```

Migration SQL should also create:

```sql
CREATE UNIQUE INDEX character_improvements_one_active
  ON character_improvements (character_id)
  WHERE applied_at IS NULL;
```

Applied rows are immutable. Active preview rows are mutable only through explicit
reroll actions. Manual table edits are not persisted until apply.

## Backend Architecture

Follow the existing repository -> service -> controller layering.

### Repository

`backend/src/repositories/character-improvement-repository.ts`

- find active preview for a character.
- create active preview with next sequence.
- update active `rolledDraft` on reroll.
- apply improvement in a transaction.
- count applied improvements for sequence and Scum first/later rules.
- fetch class random ability metadata needed for Gutterborn Scum specialty slots.

### Service

`backend/src/services/character-improvement-service.ts`

- Enforces ownership.
- Calls `getOrCreateActivePreview`.
- Rolls preview data.
- Rerolls a section.
- Validates submitted working drafts.
- Checks staleness.
- Applies changes atomically.
- Publishes party update events when a party-bound character changes.

### Rule Engine

Put pure functions in `backend/src/lib/getting-better.ts`:

- `scoreToModifierExtended(score)`.
- `modifierToCanonicalScore(modifier)`.
- `rollHpImprovement(character, roller)`.
- `rollDebris(roller, catalog)`.
- `rollAbilityImprovement(stat, rawScore, roller)`.
- `rollScumSpecialties(character, appliedCount, roller, catalog)`.
- `normalizeSubmittedImprovementDraft(draft, snapshot, catalog)`.
- `buildAppliedImprovement(draft, character)`.

Pure functions should have focused unit tests. Service tests should mock the
repository and roller where possible.

## API Surface

Routes live in `backend/src/routes/characters/index.ts` under `/api/characters`.
They remain thin controllers.

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/api/characters/:id/improvements/preview` | Get or create the active preview. Idempotent open. |
| `POST` | `/api/characters/:id/improvements/:improvementId/reroll/:section` | Reroll one section or all sections. |
| `POST` | `/api/characters/:id/improvements/:improvementId/apply` | Validate submitted working draft and commit character changes. |

`section` enum:

```ts
type ImprovementRerollSection =
  | 'hp'
  | 'debris'
  | 'abilities'
  | 'scumSpecialties'
  | 'all';
```

If a future UI needs per-ability rerolls, add an optional body field:

```ts
type RerollBody = {
  ability?: AbilityStat;
  scumSlot?: 'primary' | 'secondary' | 'both';
};
```

### Error Codes

| Code | Status | Meaning |
|---|---:|---|
| `CHARACTER_NOT_FOUND` | 404 | Character does not exist. |
| `FORBIDDEN_CHARACTER` | 403 | Viewer does not own the character. |
| `IMPROVEMENT_NOT_FOUND` | 404 | Preview id is not active for the character. |
| `STALE_IMPROVEMENT_PREVIEW` | 409 | Character changed after preview snapshot. |
| `INVALID_IMPROVEMENT_DRAFT` | 400 | Submitted working draft fails schema or derivation checks. |
| `INVALID_IMPROVEMENT_REROLL_SECTION` | 400 | Unknown reroll section. |

## Scum Specialty Rules

Gutterborn Scum has one fixed ability plus random specialties. Getting Better
cares about the random specialty slots, not the fixed class ability.

Rules:

1. On the first applied improvement, roll one additional distinct specialty.
2. From the second applied improvement onward, the user may reroll one, both, or
   neither of the two specialty slots.
3. Distinct specialties are enforced. If a server reroll hits the other slot,
   reroll until distinct.
4. Manual table values must also be distinct.
5. Apply updates the character `abilities` array from structured slots while
   preserving non-Scum abilities and the fixed Scum ability.

If the current character has an ambiguous Scum ability state, the service should
return a validation error with a message the UI can surface instead of guessing.

## Frontend UI

### Placement

Add a compact footer action, `Get better`, visible only for editable owners. It
opens a full-width inline panel above the footer. The panel is not shown in print.

This is episodic table upkeep, not always-on sheet data, so it should not become
a permanent section near abilities.

### Panel Layout

Use the existing MORK BORG product system:

- black stamped panel on the yellow page.
- yellow section stamp heading.
- hard borders and hard-offset shadows.
- no rounded corners.
- no nested cards.
- no generic dashboard treatment.

Desktop:

- two columns.
- left column: rolled facts and dice.
- right column: editable final values and section actions.

Mobile:

- one vertical work surface.
- sticky bottom actions only if they do not cover inputs.

### Controls

Panel actions:

- `Roll preview` when no preview exists.
- `Undo edits`, resets local working draft to `rolledDraft`.
- per-section reroll buttons.
- `Reroll all` at the bottom, confirms when dirty.
- `Apply getting better`.
- `Close`, confirms when dirty.

Section controls:

- HP: show 6d10 total against current max HP, show d6 increase only if success.
- Debris: show d6 result and concrete silver/scroll result. Scroll result uses a
  select/autocomplete constrained to the relevant scroll family.
- Abilities: four rows showing current modifier, d6 roll, outcome, and resulting
  modifier/raw score. Manual editing is by roll value and resulting modifier, not
  freeform raw score.
- Scum specialties: hidden for non-Scum. For Scum, show current slots and allowed
  reroll choices for first or later improvements.

Dirty behavior:

- Any manual table value or local reroll merge makes the local draft dirty.
- Closing dirty panel asks `Discard table values?`.
- Section reroll asks only if that section has local edits.
- `Reroll all` asks if anything is dirty.

## Staleness

The preview snapshot includes the character fields this feature may touch:

- `updatedAt`.
- `maxHp`.
- `silver`.
- raw ability scores.
- ability keys.
- equipment fingerprint.

On apply, compare the current character to the snapshot. If any touched field
changed, return `409 STALE_IMPROVEMENT_PREVIEW`. The UI offers `Reroll from current sheet`.

## Testing

Backend:

- pure modifier mapping and canonical mapping tests.
- HP improvement success/failure tests.
- debris table tests, including concrete scroll item keys.
- ability improvement tests for low modifiers, high modifiers, +6 cap, and
  canonical raw score mapping.
- Scum first/later improvement tests with distinct specialties.
- service tests for idempotent open, reroll section, reroll all, stale apply,
  ownership, and applied history.
- route tests for schemas and error mapping.

Frontend:

- hook tests for local working draft, undo, dirty close guard, and section reroll
  merge behavior.
- browser tests for opening preview, rerolling a section, entering table values,
  undoing, dirty close confirm, stale conflict message, and applying.

## Non-goals

- Reverting an already-applied improvement.
- Autosaving manual table edits.
- Cross-device live editing of an active preview.
- Changing normal character editing into modifier-first storage.
- Adding release notes or version bumps in this slice.
