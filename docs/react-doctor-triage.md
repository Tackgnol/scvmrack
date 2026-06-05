# React Doctor triage — 2026-06-05

Score: **68 / 100** (77 warnings, 0 errors). Full scan of `frontend/`.

This doc is the "needs your call" pile. The mechanical, behaviour-preserving fixes
are being applied directly to the working tree (see **Auto-fixed** at the bottom).
Everything else is grouped by how much judgement it needs.

Legend: ✅ safe auto-fix · 🟡 needs a quick decision · 🔴 architecture/product call · 👻 likely false positive

---

## 🔴 Architecture / product calls (won't touch without your say-so)

### 1. `AnimatedNumber.tsx` effect cluster (6 findings)
`no-derived-state`, `no-cascading-set-state`, `no-chain-state-updates`, `no-event-handler` ×3 — all in `src/components/atoms/AnimatedNumber.tsx`.

This component deliberately drives `displayValue` from a Framer `useMotionValueEvent`
plus two effects that `jump`/`set` the motion value on `value`/`cacheKey` changes.
React Doctor sees "state set inside effects" and flags it, but the effects are the
*correct* place to bridge the imperative motion-value world into React state.

- **My read:** mostly false positives, but the file is the single biggest score drag.
- **Question for you:** worth a rewrite around `useMotionValueEvent` only (drop the
  bridging `useState`, render off the motion value directly)? That would genuinely
  clear these *and* simplify the component — but it's a behaviour-sensitive animation
  change I don't want to make blind. Your "subtle motion" preference is relevant here.

> we have the local dev enviroment lets apply the fix and I will visually check 

### 2. `ResourceRow.tsx` death/pulse effect — `no-cascading-set-state` (`ResourceRow.tsx:52`)
The effect watches `currentHp` and fires the death modal + HP-pulse + timeout. This is
event-ish logic reacting to an *external* prop (the character editor pushes new HP), so
it can't simply move into an onClick — HP also changes from the +/- buttons *and* from
server patches. Refactor is real work.
- **Question:** leave as-is (it's correct), or extract a `useHpDeathWatch(currentHp)` hook
  to quiet the rule and isolate the logic?

> I am on board with adding the hook and tests for it

### 3. `no-giant-component` ×5
`CustomItemModal.tsx:137`, `ResourceRow.tsx:33`, `Header.tsx:95`, `CharactersListPage.tsx:190`, `CharacterPage.tsx:195`.
- Pure maintainability. Each is a real "split me into sub-components" task.
- **Question:** want these split now, or tracked as separate follow-up PRs? (The playbook
  recommends one PR per component so review stays sane.)

> Like I said dev env we can split them up using Impeccables Extract skill 

### 4. Data fetching in effects — `no-fetch-in-effect` (2)
`useCurrentCharacter.ts:234`, `LandingPage.tsx:365`.
- The codebase standard is TanStack Query (per CLAUDE.md), so these are legit smells.
- **But** these are core flows (current-character load, landing bootstrap). Migrating to
  `useQuery` touches data-loading semantics → I want your nod before changing.
- Paired `exhaustive-deps` findings live in the same two files (`:345`, `:424`) — likely
  the same effects. Best fixed together with the fetch migration, not piecemeal.

> So if fetching is done via not React-Query it needs to be fixed, the whole app hinges on it being properly used

---

## 🟡 Quick decisions

### 5. `no-react19-deprecated-apis` ×4
`CharacterContext.tsx:2`, `EquippedQuickCard.tsx:4`, `SnackbarProvider.tsx:1`, `ErrorFeedbackProvider.tsx:14`.
- React 19 lets you drop `forwardRef` (ref-as-prop) and use `use(Context)` over `useContext`.
- Mechanical, but touches context providers used everywhere. **Decision:** do it as one
  focused "React 19 API" batch? I'm happy to, just flagging it changes shared infra.

> Yeah lets do it, keep it modern

### 6. `array-index-as-key` ×10
`EquipmentSelectionMenu.tsx:63`, `ClassAbilitiesSection.tsx:30`, `SummaryEncumbranceBreakdown.tsx:102`,
`PrintPage.tsx:144/163/316`, `ReleasePage.tsx:128`, `FaqPage.tsx:40/57/165`.
- The FAQ/Print/Release ones are static, never-reordered content → 👻 low-risk false
  positives (index key is fine for a frozen list).
- `EquipmentSelectionMenu` / `ClassAbilitiesSection` / `SummaryEncumbranceBreakdown`
  render dynamic lists → 🟡 worth a stable key if the items carry an id/slug.
- **Decision:** fix only the dynamic three, leave the static ones? (my recommendation)

> The SSG ones, so we can just hash the contents and make that a key? The dynamic ones I think already have a key we can use (they are key based to even show translations?)

### 7. `prefer-html-dialog` ×2 — 👻
`test/browser/pages/CharacterPage.test.tsx:111`, `test/browser/organisms/CustomItemModal.test.tsx:24`.
- Both are in **test files**. False positive — no production impact. Suggest adding to
  `.react-doctor/false-positives.md`.

> Agreed or even if possible ad a ignore to react-doctor and simply regex all test files away 

### 8. `no-danger` (security) — 👻
`test/browser/BrowserTestProvider.tsx:28` — test harness injecting fixture HTML on purpose.
False positive; suppress.

> Agreed or even if possible ad a ignore to react-doctor and simply regex all test files away

### 9. `use-lazy-motion` ×3 (~30kb)
`CustomModifiersGrid.tsx:4`, `ComputedModifiersGrid.tsx:4`, `AnimatedNumber.tsx:1`.
- Real bundle win, but switching to `LazyMotion`+`m` is a global motion-setup change
  (needs a `LazyMotion` provider near the root with `domAnimation` features).
- **Decision:** want the bundle saving? It's a small but cross-cutting change.

> Always save on the bundle size ;), its one of those things we ignore but should not

### 10. `no-render-in-render` ×2
`FaqPage.tsx:99`, `FaqPage.tsx:179` — inline component defined/called during render.
Mechanical extract to named components. Low risk — fix unless you object.

> definetly fix

### 11. `only-export-components` — `Seo.tsx:90`
Non-component export living in a component file. Trivial: move it to a sibling module.

> agreed
---

## ✅ Safe perf/cleanup batch (will apply unless you stop me)

These are local, mechanical, behaviour-preserving. I'll do them next batch after you
glance at the above.

| Rule | Location | Fix |
|---|---|---|
| `js-set-map-lookups` | `useEquippedBar.ts:76`, `useAmmoForWeapon.ts:34` | Build a `Set`/`Map` once instead of repeated `.includes()` |
| `js-combine-iterations` ×8 | `formatActionDie.ts:6`, `useEquippedBar.ts:84/92`, `useEquipmentSearch.ts:64`, `useConsumableSection.ts:13`, `usePowersSection.ts:15`, `useOnHandSection.ts:88`, `usePetSection.ts:13` | Collapse `.map().filter()` chains to one pass |
| `js-flatmap-filter` | `vitest.browser.config.ts:12` | `.map().filter(Boolean)` → `.flatMap()` |
| `prefer-module-scope-pure-function` ×8 | Footer/useCustomItemForm/PrintPage/useSessionExpiredFlag/CharactersListPage ×2/ReleasePage/FaqPage | Hoist pure helpers above the component |

> ok cool

### 👻 `js-tosorted-immutable` — `characterAnalytics.ts:82` (false positive)
`[...new Set(...)].sort()` — the spread converts a `Set` to a fresh array, so the
in-place `.sort()` mutates nothing shared. `toSorted()` would just double-copy. Leave it.

> We could consider a proper refactor here, to preserve the logic and avoid the smelly casting

---

## 🗑️ Dead-code findings — verify before deleting

### `deslop/unused-file` ×8
- `public/assets/*.js` (6 files) → 👻 **build output**, not source. Ignore / git-clean, do
  not "fix". These shouldn't be scanned — consider a `.react-doctor` ignore for `public/`.
- `src/components/molecules/character-descriptors/CharacterDescriptors.styled.ts` → verify no import, then delete.
- `src/hooks/consts.ts` → verify no import, then delete.

> agree on all

### `deslop/unused-export` ×7
`customItems.ts:63`, `errorUtils.ts:27/79/147/214`, `characterUpdate.ts:363/456`.
- Drop the `export` keyword (keep the symbol) where it's only used in-file.
- ⚠️ `errorUtils`/`characterUpdate` may be intended shared utilities — confirm they're not
  part of a public surface before un-exporting.

> agreed 

### `deslop/unused-dev-dependency` — `package.json`
- React Doctor won't say which one. Run `npx depcheck` to confirm before removing.

> I am not sure about this one 
> 
> Unused devDependencies
> * @vitest/browser
>* @vitest/coverage-istanbul
>* @vitest/coverage-v8
>* react-doctor
> Missing dependencies
> * @eslint/js: .\eslint.config.js
> * globals: .\eslint.config.js
> * @sentry/browser: .\src\instrument.ts
> * @tanstack/history: .\src\router\history.ts
> * @components/molecules: .\src\router\layout.tsx
> * @mui/system: .\src\router\layout.tsx
> * @components/index: .\src\pages\CharactersListPage.tsx
> * @components/modifiers: .\src\inventory\customItems.ts
> * @components/abilities: .\src\hooks\useAbilityCard.ts
> * @components/uses: .\src\hooks\useConsumableSection.ts
> * @components/equipped: .\src\hooks\useEquippedBar.ts
> * @components/organisms: .\src\hooks\useInventoryItemEditor.ts
>* @components/modal: .\src\hooks\useMorkBorgModal.ts
>* @theme/morkBorgTheme.ts: .\src\components\organisms\Abilities.tsx
>* @theme/morkBorgTheme: .\src\components\organisms\Header.styled.ts
>* @components/atoms: .\src\components\organisms\Header.tsx
>* @components/inventory: .\src\components\organisms\OnHandSection.tsx
>* @components/pets: .\src\components\molecules\pets\PetSection.tsx>
>* @components/character-descriptors: .\src\components\molecules\character-descriptors\DescriptorAbilityItem.tsx

---

## Progress log (working tree, not committed)

**Done — score 68 → 72**
- `doctor.config.json` — ignore `**/*.test.{ts,tsx}`, `test/**`, `public/**` (kills the
  test-file `prefer-html-dialog`/`no-danger` FPs and the `public/assets` unused-file FPs).
- Deleted dead files: `CharacterDescriptors.styled.ts`, `hooks/consts.ts` (zero imports).
- `js-hoist-intl` — `DeadStamp.tsx`: hoisted `Intl.DateTimeFormat` to module scope.
- `prefer-module-scope-pure-function` — `Footer.tsx`: moved `handleOpenPrivacy` out.
- `no-render-in-render` ×2 + `array-index-as-key` ×3 — `FaqPage.tsx`: extracted
  `<AnswerSegments>`, keyed accordions by `faq.question`.
- `js-tosorted-immutable` — `characterAnalytics.ts`: `Array.from(new Set(...)).sort()`
  (drops the spread-cast smell).
- `errorUtils` un-export: **skipped on purpose** — verified it's a shared API (imported by
  3 hooks). Keeping the surface intact per the agreed ⚠️ check.

**Done — batches B (mostly) + D — issues 77 → 57**
- **D** React 19 ×4: `useContext`→`use` in `CharacterContext`/`SnackbarProvider`/`ErrorFeedbackProvider`;
  `forwardRef`→ref-prop in `EquippedQuickCard`. Rule fully eliminated.
- **B** `js-combine-iterations` ×8 → single-pass `flatMap` (useEquippedBar, formatActionDie,
  useEquipmentSearch, useConsumable/Powers/Pet/OnHandSection). Rule eliminated.
- **B** `js-flatmap-filter` → `vitest.browser.config.ts`. Rule eliminated.
- **B** `prefer-module-scope-pure-function`: `useSessionExpiredFlag` done. **Remaining** (need each
  file's import anchor — trivial follow-up): `PrintPage.handlePrint`, `ReleasePage.getTypeColor`,
  `CharactersListPage.formatDate`/`handleOpenCharacter`, `useCustomItemForm.isOutOfRange`.
- **B** `js-set-map-lookups` ×2 (`useEquippedBar:76`, `useAmmoForWeapon:34`): **judged FP** — each is
  `item.tags.includes(const)` over an item's *own* small array, not a repeated scan of one big list.
  A per-item Set would be slower. Left as-is.

**Done — batches B-tail + C — issues 38 → 26, score → 75**
- **Config fix**: switched test-file handling from a blanket `ignore.files` to a scoped
  `ignore.overrides` (only `prefer-html-dialog` + `no-danger` suppressed in tests). This keeps
  test files in dead-code analysis, so test imports count as usage — `unused-export` went from a
  misleading ×26 back to the true 7. `public/**` stays fully ignored.
- **B-tail** `prefer-module-scope-pure-function`: moved `PrintPage.handlePrint`,
  `ReleasePage.getTypeColor`, `CharactersListPage.formatDate` + `handleOpenCharacter`,
  `useCustomItemForm.isOutOfRange`. Rule eliminated.
- **C** unused-export: un-exported `ApiClientError`, `getApiErrorPayload`, `getApiErrorMessage`
  (errorUtils), `getSimpleFieldLimitIssue`, `translateFieldLimitIssue` (characterUpdate),
  `DEFAULT_AMMO_TYPES` (customItems) — all verified zero external imports, internal callers intact.
- **C** deleted dead `isApiPreconditionFailed` (errorUtils) — no internal *or* external caller
  (un-exporting would've made it an unused-var error). **Flag:** its 412-predicate siblings stay.
- **C** `Seo.getSiteUrl` → new `src/seo/siteUrl.ts` (with its private `stripTrailingSlashes` +
  `DEFAULT_SITE_URL` + `getRuntimeOrigin`); updated `Seo.tsx` + `Seo.test.tsx` imports.
  Clears `only-export-components`.

**Done — array-key win + F — issues 26 → 23, score → 77**
- `array-index-as-key`: `EquipmentSelectionMenu` → `key={item.key}` (the old `index` was a data
  field, aggregated items are unique). `ClassAbilitiesSection` → `key={ability.key ?? ability.name
  ?? \`ability-${index}\`}`. `SummaryEncumbranceBreakdown` **left as-is** — its `index` is a real
  collision-breaker for genuinely duplicate items in a static breakdown (justified FP).
- **F** Extracted `src/hooks/useHpDeathWatch.ts` (pure `hpDeathWatchReducer` + hook) and rewired
  ResourceRow. Single `dispatch` per effect → clears `no-cascading-set-state`. 10 reducer unit
  tests in `test/unit/hooks/useHpDeathWatch.test.ts` (all transitions: pulse, reduced-motion,
  death-at-0, loaded-at-0, no-reopen-after-close, character-switch reset).
  **Behaviour nuance:** pulse now lasts 220ms from the *first* change in a rapid burst rather than
  resetting on each change (was: reset-on-each). Imperceptible + aligns with subtle-motion. Death
  modal logic preserved exactly (covered by tests). Worth a quick visual once-over in dev.

**Done — H React Query migration — issues 23 → 22, score → 79**
- New `src/hooks/charactersListQuery.ts`: shared `fetchCharacterList(signal)` + `charactersListQueryKey`.
  Keeps the deliberate raw-fetch auth-middleware bypass; throws `ApiClientError` (with status) on
  non-2xx, rejects raw on network failure.
- `useCurrentCharacter` + `LandingPage`: the in-effect raw `fetch` is gone — both now call
  `queryClient.fetchQuery({ queryKey, queryFn: () => fetchCharacterList(signal) })`, so the list GET
  is cached/deduped through React Query (the two flows even share one cache key). `no-fetch-in-effect`
  eliminated. The conditional create + setCharacterId orchestration legitimately stays in the effect.
- Behaviour preserved exactly, including the subtle bit the tests guard: a *server* non-2xx still
  falls through to create, but an *unreachable* server does not (LandingPage uses a discriminated
  `.then/.catch` result — no `throw`, which keeps React Compiler happy).
- Tests: added `useQueryClient` passthrough mocks to `useCurrentCharacter.test.ts` (unit) and
  `LandingPage.test.tsx` (browser) since both mock the repository (no real provider). Verified:
  useCurrentCharacter 10/10, LandingPage 9/9, CharacterPage 8/8, full unit suite 284/284, tsc clean.
- **Left:** `exhaustive-deps` ×2 — the run-once bootstrap effects keep their intentional
  `eslint-disable`; honest deps would re-run them. Not worth destabilising a verified auth flow.

**Done — G+E AnimatedNumber rewrite + LazyMotion — issues 22 → 17, score → 80**
- **AnimatedNumber**: renders the spring straight off a `MotionValue` via `useTransform`
  (`<m.span>{display}</m.span>`) instead of bridging into a `displayValue` `useState`. Eliminates
  `no-derived-state`, `no-cascading-set-state`, `no-chain-state-updates` (6 findings → 3). The
  remaining 3 (`Event logic in effect` at the `useMotionValueEvent` + the two `jump/set` drivers)
  are a justified FP — imperative MotionValue control from props, no setState, no real event.
- **LazyMotion**: all 3 motion-rendering files now use `m` (`m.span`, `m.div`); added one
  `<LazyMotion features={domMax}>` at the app root (`main.tsx`) — `domMax` because the grids animate
  `layout`. `use-lazy-motion` ×3 eliminated (bundle trim). `useModifiersPanel` only uses the
  `useReducedMotion` hook, so it needed no change.
- Added `LazyMotion` to `BrowserTestProvider` so `m.*` components get features in tests.
- Verified: ComputedModifiersGrid, CustomModifiersGrid, ResourceRow, CharacterPage,
  CharactersListPage, SummaryBar browser tests — 37/37 pass; tsc + lint clean.
  **Visual check still recommended in dev** (tests disable animation via CSS; they prove render
  correctness, not the spring feel).

**In progress — I (giant-component splits) — 1 of 5 done, issues 17 → 16**
- **Convention: atomic design.** Extracted parts go in their own files in the right layer
  (atoms/molecules/organisms), grouped in a feature subfolder — NOT as inner components in one file.
- **ResourceRow** done: extracted `molecules/resources/HpControl.tsx`, `OmensModal.tsx`,
  `DeathModal.tsx`. ResourceRow is now a thin composition; markup/behaviour/test-ids identical.
  Verified: tsc + lint clean, ResourceRow browser test 8/8, no longer flagged giant.
- **Header** done: split into `molecules/header/` — `Header.styled.ts` (moved out of organisms),
  `BoneIcon`, `NavLink`, `HeaderStatusChip`, `HeaderValidationChip`, `HeaderDesktopBar`,
  `HeaderMobileDrawer` → `HeaderDrawerNav` + `HeaderDrawerActions`. Saving-indicator timing pulled
  into a testable `hooks/useSavingIndicator.ts`. Header is now a thin orchestrator.
  - Extracting the drawer first re-flagged it giant, so it was split again (nav + actions).
  - Avoided a new `too-many-boolean-props` smell: `isLandingRoute`/`isSheetRoute` are mutually
    exclusive, so `!isLandingRoute && isSheetRoute` collapsed to `isSheetRoute` (one fewer bool prop).
  - Verified: tsc + lint clean, Header browser test 8/8, all `data-testid`s preserved.
- **CharactersListPage** done: data/mutations → testable `hooks/useCharactersList.ts`; table markup →
  `molecules/characters-list/CharacterTable.tsx` + `CharacterRow.tsx` (each owns its styles).
  Page is now presentational. Verified: tsc + lint clean, browser test 10/10, `data-testid`s preserved.
- **CharacterPage** done: lifecycle/stamp/kill logic → testable `hooks/useScvmDeathFlow.ts`; sheet
  body → self-sufficient `organisms/CharacterSheet.tsx` (derives section flags from `useCharacter`);
  `molecules/character/` gained `SectionAccordion`, `DeathStampOverlay`, `KillConfirmModal`, and
  `CharacterLoadErrorModals` (the 3 mutually-exclusive load modals deduped into one parameterized
  modal driven by a `loadIssue` enum — avoids both duplication and boolean-prop sprawl). Page is now
  a thin orchestrator. Verified: tsc + lint clean, browser test 8/8, `data-testid`s preserved.
- **CustomItemModal** done: 6 form panels → `organisms/customItem/` (`IdentityPanel`, `WeaponPanel`,
  `AmmoPanel`, `ArmorPanel`, `ConsumablePanel`, `CustomItemModifierPanel`) + shared `BoundedTextField`,
  `panelStyles`, `panelProps` (props derived from the `UseCustomItemForm` type). Modal is now a thin
  shell over the form hook. Verified: tsc + lint clean, browser test 2/2.
- **`no-giant-component` rule fully eliminated** (5/5). Score 82.

**Remaining batches (the focused ones)**
- **G+E** `AnimatedNumber` rewrite + `LazyMotion` (all 4 `motion/react` files → `m` + `domMax`
  root provider). Visual check in dev.
- **H** React Query migration: `useCurrentCharacter` + `LandingPage` fetch-in-effect (+ paired exhaustive-deps).
- **I** Giant-component splits ×5 via Impeccable Extract (one per component).
- **FP left as-is**: `js-set-map-lookups` ×2 (per-item own-array `.includes`), `no-danger`/`prefer-html-dialog` (tests).

### depcheck note (`unused-dev-dependency`)
The `npx depcheck` output is **all false positives**, don't remove anything:
- "Unused" `@vitest/browser`, `@vitest/coverage-istanbul`, `@vitest/coverage-v8`, `react-doctor`
  are loaded by vitest browser mode / `--coverage` / the `doctor` npm script, not by `import`.
- "Missing" `@components/*`, `@theme/*` etc. are tsconfig/vite **path aliases**, not packages.
