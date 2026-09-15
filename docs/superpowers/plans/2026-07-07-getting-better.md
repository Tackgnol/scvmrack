# Getting Better Implementation Plan

> **For agentic workers:** implement in small commits. Keep route files thin.
> Business rules belong in services and pure lib functions; Prisma and catalog
> access belong in repositories. Update checkboxes as phases land.

**Goal:** Add a typed, idempotent Getting Better preview and apply workflow to
the character sheet.

**Spec:** `docs/superpowers/specs/2026-07-07-getting-better-design.md`

**Recommended branch:** `codex/getting-better`

## Codebase Facts

- Character APIs live under `/api/characters` in `backend/src/routes/characters/index.ts`.
- Backend layering is repository -> service -> controller. Do not put Prisma or
  rule logic in route files.
- Character updates currently return hydrated characters via `getCharacterFull`.
  The improvement apply path should do the same.
- Character sheet edits are optimistic PATCHes. Getting Better is different:
  preview is a command draft; apply is the only character mutation.
- Generated OpenAPI typing may lag. If needed, add a focused typed frontend API
  wrapper using the shared `client` so CSRF/auth middleware still apply.
- New i18n keys go into both `frontend/src/i18n/en.json` and `pl.json`.

## File Map

Likely files to create:

```text
backend/src/lib/getting-better.ts
backend/src/repositories/character-improvement-repository.ts
backend/src/services/character-improvement-service.ts
backend/src/schemas/character-improvement.ts
backend/tests/unit-be/getting-better.test.ts
backend/tests/unit-be/character-improvement-service.test.ts

frontend/src/api/characterImprovement.ts
frontend/src/hooks/useGettingBetterPreview.ts
frontend/src/components/organisms/getting-better/GettingBetterPanel.tsx
frontend/src/components/organisms/getting-better/GettingBetterPanel.styles.ts
frontend/src/components/molecules/getting-better/GettingBetterHpSection.tsx
frontend/src/components/molecules/getting-better/GettingBetterDebrisSection.tsx
frontend/src/components/molecules/getting-better/GettingBetterAbilitiesSection.tsx
frontend/src/components/molecules/getting-better/GettingBetterScumSection.tsx
```

Likely files to modify:

```text
backend/prisma/schema.prisma
backend/src/routes/characters/index.ts
backend/src/services/character-service.ts
backend/src/repositories/character-repository.ts
backend/src/utils.ts
backend/src/lib/get-character-full.ts
frontend/src/utils/stats.ts
frontend/src/inventory/customItems.ts
frontend/src/components/molecules/Footer.tsx
frontend/src/components/organisms/CharacterSheet.tsx
frontend/src/CharacterContext/CharacterContext.tsx
frontend/src/hooks/useCurrentCharacter.ts
frontend/src/i18n/en.json
frontend/src/i18n/pl.json
```

## Phase 1: Extended Ability Modifier Mapping

- [x] Add shared backend tests for the extended modifier table:
  - `<=4 -> -3`
  - `17-18 -> +3`
  - `19 -> +4`
  - `20 -> +5`
  - `21+ -> +6`
- [x] Update backend `rollToModifier` in `backend/src/utils.ts`.
- [x] Update frontend `statToModifier` in `frontend/src/utils/stats.ts`.
- [x] Update frontend `rollToModifier` in `frontend/src/inventory/customItems.ts`.
- [x] Add or update frontend unit coverage for the mapping.
- [x] Search for assumptions that modifiers max at +3 and adjust labels/UI if needed.

Validation:

```bash
cd backend && npm run build:ts
cd ../frontend && npm run test:unit && npm run lint
```

## Phase 2: Pure Getting Better Rule Engine

- [x] Create `backend/src/lib/getting-better.ts`.
- [x] Implement `scoreToModifierExtended` and `modifierToCanonicalScore`.
- [x] Implement HP preview:
  - roll 6d10.
  - success if total >= current `maxHp`.
  - on success roll d6 and raise `maxHp`.
  - do not change `currentHp`.
- [x] Implement debris preview:
  - d6 1-3 nothing.
  - 4 means 3d10 silver.
  - 5 means concrete unclean scroll.
  - 6 means concrete sacred scroll.
- [x] Implement ability preview using modifier-authoritative rules.
- [x] Implement Scum specialty draft building:
  - non-Scum returns `{ kind: 'notScum' }`.
  - first applied improvement adds one distinct specialty.
  - later improvements expose two distinct slots and reroll mode.
- [x] Implement normalization for submitted working drafts. Recompute derived
  outcomes from submitted roll values and the snapshot.
- [x] Unit-test all rule branches before wiring the service.

Validation:

```bash
cd backend/tests/unit-be
npm test -- getting-better
```

## Phase 3: Persistence

- [x] Add `CharacterImprovement` to `backend/prisma/schema.prisma`.
- [x] Create a Prisma migration.
- [x] Add migration SQL for the partial unique active-preview index:

```sql
CREATE UNIQUE INDEX character_improvements_one_active
  ON character_improvements (character_id)
  WHERE applied_at IS NULL;
```

- [x] Run Prisma generate.
- [x] Create `character-improvement-repository.ts` with:
  - `findActive(characterId)`.
  - `createActive(characterId, sequence, rolledDraft, snapshotHash)`.
  - `updateRolledDraft(improvementId, rolledDraft, snapshotHash)`.
  - `countApplied(characterId)`.
  - `applyInTransaction(...)`.
  - Scum random ability lookup helpers.
- [x] Add focused repository-adjacent tests only where they exercise behavior not
  already covered by Prisma.

Validation:

```bash
cd backend && npm run prisma:generate && npm run build:ts
```

## Phase 4: Service and Schemas

- [x] Create `backend/src/schemas/character-improvement.ts`:
  - `ImprovementDraftSchema`.
  - `ImprovementPreviewResponseSchema`.
  - `RerollSectionParamsSchema`.
  - `ApplyImprovementBodySchema`.
  - reuse `ErrorSchema` from character schemas.
- [x] Create `backend/src/services/character-improvement-service.ts`.
- [x] Implement `getOrCreatePreview`:
  - ownership check.
  - return existing active preview if present.
  - otherwise roll and persist a new typed `rolledDraft`.
- [x] Implement `rerollSection`:
  - section reroll updates only the persisted rolled section.
  - `all` replaces the whole rolled draft.
  - no implicit reroll on open.
- [x] Implement `apply`:
  - validate submitted working draft.
  - compare snapshot to current touched fields.
  - return `409 STALE_IMPROVEMENT_PREVIEW` on conflict.
  - apply max HP, silver, ability scores, equipment, and Scum abilities in one transaction.
  - write typed `AppliedImprovement`.
  - hydrate and return the updated character.
  - publish party bus update if character belongs to a party.
- [x] Unit-test service invariants:
  - idempotent open.
  - one active preview.
  - reroll section only.
  - reroll all.
  - stale apply.
  - ownership failure.
  - Scum first and later improvement.
  - concrete scroll application.

Validation:

```bash
cd backend/tests/unit-be
npm test -- character-improvement-service
```

## Phase 5: Routes and API Wrapper

- [x] Add routes in `backend/src/routes/characters/index.ts`:
  - `POST /:id/improvements/preview`
  - `POST /:id/improvements/:improvementId/reroll/:section`
  - `POST /:id/improvements/:improvementId/apply`
- [x] Keep controllers thin: call the service, use `sendServiceError`.
- [x] Add route tests for schemas, auth/ownership, and error mapping.
- [x] If OpenAPI generation is not convenient, create
  `frontend/src/api/characterImprovement.ts` using the shared `client`.

Validation:

```bash
cd backend && npm run build:ts
cd tests/unit-be && npm test
```

## Phase 6: Frontend State Hook

- [x] Create `useGettingBetterPreview`.
- [x] Hook responsibilities:
  - open panel calls `getOrCreatePreview`.
  - initialize local `workingDraft` from `rolledDraft`.
  - track dirty state globally and per section.
  - `undoEdits` resets `workingDraft = rolledDraft`.
  - section reroll confirms only if that section is dirty, then merges the returned section.
  - `rerollAll` confirms if anything is dirty, then replaces the working draft.
  - close confirms with `Discard table values?` when dirty.
  - apply sends local `workingDraft`, updates character cache with hydrated response.
  - stale conflict shows `Reroll from current sheet`.
- [x] Unit-test hook transitions if the existing test harness supports it.

Validation:

```bash
cd frontend && npm run test:unit -- useGettingBetterPreview
```

## Phase 7: Frontend UI

- [x] Add a `Get better` footer action for editable owners only.
- [x] Add `GettingBetterPanel` above the footer inside `CharacterSheet`.
- [x] Build sections:
  - HP section.
  - Debris section.
  - Ability section.
  - Scum section.
- [x] Use the design system:
  - black panel on yellow page.
  - yellow stamp heading.
  - hard borders and solid offset shadows.
  - zero radius.
  - no nested cards.
- [x] Use conventional controls:
  - icon plus text for reroll actions.
  - numeric inputs for table totals/rolls.
  - select/autocomplete for scroll and specialty overrides.
  - clear action buttons for undo, reroll all, apply.
- [x] Add i18n keys to `en.json` and `pl.json`.
- [x] Add browser tests:
  - open preview.
  - reopen does not reroll.
  - edit table values and undo.
  - section reroll keeps other edited sections.
  - dirty close confirm.
  - apply updates visible sheet.
  - Scum section appears only for Gutterborn Scum.

Validation:

```bash
cd frontend
npm run test:browser -- GettingBetter
npm run lint
npm run typecheck
```

## Phase 8: Integration and Release Docs

- [x] Add backend integration or e2e coverage for a full improvement apply.
- [x] Add one frontend browser happy path.
- [x] Update `changelog/backend.md` and `changelog/frontend.md`.
- [x] Do not add release notes or bump versions unless this lands as a release.

Broad validation:

```bash
cd backend && npm run build:ts && npm test
cd ../frontend && npm run typecheck && npm run lint && npm run test:unit && npm run test:browser
```

## Acceptance Criteria

- Opening Getting Better twice returns the same active preview.
- Explicit section rerolls work without replacing unrelated local edits.
- `Reroll all` exists at the bottom and confirms when local edits are dirty.
- Manual table values can be applied without autosave.
- `Undo edits` resets local values to the server-rolled preview.
- Closing dirty panel warns before discarding.
- Apply is blocked on stale character state.
- HP max can increase; current HP is not healed.
- Debris scrolls apply concrete catalog items to on-hand equipment.
- Ability changes are modifier-authoritative and store canonical raw scores.
- Raw ability score results are capped at 21.
- Gutterborn Scum specialty behavior follows first/later improvement rules.
- Applied rows persist typed history.

## Out of Scope

- Reverting an applied improvement.
- Autosaving preview edits.
- Cross-device collaboration on active previews.
- Reworking all sheet editing to store modifiers instead of raw scores.
- Version bumps and release page updates.
