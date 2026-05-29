# Major Dependency Upgrade Plan (detailed)

Plan for the dependencies held back during the 0.2.0 in-range update (commit `b90375f`).
Each item lists the **breaking changes** (with sources), **where they hit this repo**
(file:line), the **migration**, and **verification**. Breaking-change research done
2026-05-29 against the linked upstream guides.

## Working rules

- One major per branch/commit. Apply → migrate → full suite green → commit. Never batch unrelated majors.
- Backend DB/runtime changes verify with **integration + e2e**, not just unit.
- Coupled packages move together (flagged per item).
- Baseline to restore each time: BE `tsc` 0 · BE unit 16 · FE `tsc` 0 · FE lint 0 · FE unit 266 · FE browser 253 · both `npm audit` 0.

## Prerequisite (do first)

Pin the Node minor and declare engines. ESLint 10 needs `^20.19 || ^22.13 || >=24`; Prisma 7 needs `^20.19 || ^22.12 || >=24`; fastify-cli 8 needs `>=20.6`. We run `node:22-alpine` (floats to latest 22.x, currently fine) but it's unpinned.
- **Where:** `backend/Dockerfile*`, `frontend/Dockerfile*`, `.woodpecker/dev-tests.yaml` (`node:22-alpine` → e.g. `node:22.13-alpine`); add `"engines": { "node": ">=22.13" }` to both `package.json`s.

---

## Tier 1 — Quick wins (one branch, low risk)

### 1.1 Vitest 4.1.2 → 4.1.7 (cluster)
- **Why blocked:** the six packages are *exact-cross-pinned* — `@vitest/browser` / `@vitest/browser-playwright` / `@vitest/coverage-*` each peer `vitest@"4.1.7"`. `npm update` can't move one without all.
- **Migration:** `npm i -D vitest@4.1.7 @vitest/browser@4.1.7 @vitest/browser-playwright@4.1.7 @vitest/coverage-istanbul@4.1.7 @vitest/coverage-v8@4.1.7 @vitest/ui@4.1.7`
- **Risk:** patch-level. **Verify:** FE unit + browser.

### 1.2 Backend dev majors: `@types/node@25`, `c8@11`, `concurrently@10`
- Dev/types only. **Verify:** `npm run build:ts`, unit-be, `test:coverage:backend`.

### 1.3 `eslint-plugin-react-refresh` 0.4 → 0.5
- **Verify:** `npm run lint` stays 0 errors.

---

## Tier 2 — Isolated majors (one branch each, medium risk)

### 2.1 TanStack Router 1.153 → 1.170
- **Breaking (confirmed empirically + [PR #4398](https://github.com/TanStack/router/pull/4398)):** `history.push()` no longer returns `{ type: 'PUSHED' | 'BLOCKED' }` — it returns `void`. Blocking moved to a global blocking-status model (subscribe / `proceed`/`reset`), not a push() return value.
- **Where it hits us:**
  - `frontend/src/pages/CharactersListPage.tsx:227` — `if (result.type === 'BLOCKED') window.location.assign(targetPath)` (this is the exact error that surfaced during the in-range attempt).
  - `frontend/test/browser/pages/CharactersListPage.test.tsx` — mock `appHistory.push` resolves `{ type: 'PUSHED' }`.
  - Other `appHistory.push` callers to re-check (return value unused there): `Header.tsx`, `PrintPage.tsx`, `useAuth.ts`, `useCurrentCharacter.ts`.
- **Migration:** We don't use navigation blocking (`useBlocker`), so drop the `result.type === 'BLOCKED'` fallback entirely (just `await appHistory.push(...)`). Update the test mock to resolve `undefined`.
- **Risk:** low-medium, isolated. **Verify:** FE tsc + unit + browser.

### 2.2 openapi-fetch 0.15 → 0.17 + openapi-react-query 0.5.1 → 0.5.4 (coupled)
- **Why coupled:** react-query 0.5.4 peer-requires `openapi-fetch ^0.17`.
- **Breaking ([changelog](https://github.com/openapi-ts/openapi-typescript/blob/main/packages/openapi-fetch/CHANGELOG.md)):** the notable historical breaks (object-style `Middleware`, `customFetch(input, init)`, no default `Content-Type` with a body) **already match our code** — `src/api/index.ts` uses object middleware (`onRequest({ request })` / `onResponse({ request, response })`) and `instrument.ts` uses `customFetch(url, init)`. So 0.15→0.17 is expected to be low-touch; confirm no further `Middleware`/`createClient` signature drift.
- **Where:** `frontend/src/api/index.ts` (`createClient<paths>`, `csrfMiddleware`, `authMiddleware`, `getCsrfToken`), `src/api/schema.ts` (regenerate).
- **Migration:** bump both; re-run `npm run generate-api` against a running backend (`openapi-typescript` already 7.13); fix any client/middleware type drift.
- **Risk:** medium (HTTP client core). **Verify:** FE tsc + unit + browser (the API/CSRF/feedback paths).

### 2.3 i18next 25 → 26 + react-i18next 16 → 17 (coupled)
- **Why coupled:** react-i18next 17 peer-requires `i18next >= 26.0.1`.
- **Breaking ([i18next migration](https://www.i18next.com/misc/migration-guide), [react-i18next changelog](https://github.com/i18next/react-i18next/blob/master/CHANGELOG.md)):** `returnNull` now defaults to `false`; `interpolation.format` removed → `i18next.services.formatter.add()`; remove `showSupportNotice`; `initImmediate` → `initAsync`; ordinal plural keys prefixed `_ordinal`.
- **Where it hits us:** `frontend/src/i18n/index.ts` `.init({...})` — **good news:** we only set `fallbackLng`, `resources`, `interpolation.escapeValue`, `detection`. We use **none** of the removed options (no `interpolation.format`, no `initImmediate`, no `showSupportNotice`). `i18n.types.ts` (type augmentation / `LeafPaths`) and `<Trans>` in `CharacterNameSummary.tsx`, `Footer.tsx` (×2) to re-verify against v17 types.
- **Migration:** bump both; re-typecheck the `t()`/`Trans`/type-augmentation surface; confirm `returnNull: false` doesn't change any `t()` consumers.
- **Risk:** low-medium. **Verify:** FE tsc + unit + browser (incl. `language_changed` + `<html lang>`).

### 2.4 fastify-cli 7 → 8 (backend)
- **Breaking ([releases](https://github.com/fastify/fastify-cli/releases)):** v8 auto-loads `.env` from cwd via Node's `process.loadEnvFile()` (Node ≥20.6). This can **double-load / conflict** with our existing `dotenv` usage.
- **Where:** `backend/package.json` scripts `start` (`fastify start -l info dist/app.js`) and `dev:api:start` (`fastify start -w ...`); `backend/src/app.ts` / `instrument.ts` already `import 'dotenv'`-style loading.
- **Migration:** bump; decide a single source of env truth (let fastify-cli load `.env`, or disable its loader); confirm prod (compose passes env directly, no `.env` in image) is unaffected.
- **Risk:** low-medium. **Verify:** `npm run start` boot + `npm run dev:api` + integration.

---

## Tier 3 — Toolchain majors (sequence as a set)

### 3.1 ESLint 9 → 10
- **Breaking ([migrate-to-10](https://eslint.org/docs/latest/use/migrate-to-10.0.0)):** legacy `.eslintrc` removed (**we already use flat config** ✓ — non-issue); `context.parserOptions` removed (we have no custom rules); stylish formatter color via Node `styleText` (cosmetic); **JSX references now tracked in scope analysis** (can shift `no-unused-vars` results); Node ≥20.19.
- **Where:** `frontend/eslint.config.js`. Plugin compatibility to verify/bump: `@typescript-eslint@8.60` already peers `eslint ^10` ✓; check `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`, `eslint-plugin-react-compiler` for ESLint-10 support.
- **Risk:** medium. **Verify:** `npm run lint` 0 errors (watch for new JSX-scope unused-var hits).

### 3.2 TypeScript 5.9 → 6.0 (both projects)
- **Breaking ([TS 6.0 notes](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-6-0.html)):** removed `module` amd/umd/system/none, `moduleResolution: classic`, `--outFile`; **`baseUrl` as a resolution root deprecated** (fold into `paths`); `target: es5` deprecated (we're ES2020/ES2022 ✓); several default changes (only bite if options are unset — ours are explicit). `@typescript-eslint@8.60` supports `typescript <6.1.0` ✓.
- **Where it hits us:** `frontend/tsconfig.json` uses `"baseUrl": "."` + `paths` → drop `baseUrl`, make paths self-relative (`"@/*": ["./src/*"]`). `backend/tsconfig.json` is clean (NodeNext, no baseUrl/outFile/downlevelIteration). Expect some new type errors from stricter checks. Escape hatch if needed: `"ignoreDeprecations": "6.0"`.
- **Do right after 3.1** so the eslint/typescript-eslint/TS trio is validated together.
- **Risk:** medium. **Verify:** both `tsc` + full suites + both builds.

### 3.3 Prisma 6 → 7 (backend) — highest backend risk
- **Breaking ([upgrade-to-prisma-7](https://www.prisma.io/docs/orm/more/upgrade-guides/upgrading-versions/upgrading-to-prisma-7)):**
  1. **ESM-only** (we're `"type":"module"` + NodeNext ✓).
  2. **Driver adapter required** (we already use `@prisma/adapter-pg` ✓).
  3. **Generator block** `prisma-client-js` → `prisma-client` **+ explicit `output`**.
  4. **`prisma.config.ts`** (we already have one ✓).
  5. **Env not auto-loaded** — must load explicitly for the Prisma CLI (dotenv).
  6. **Connection pool defaults change** — the `pg` driver has *no* connection timeout by default (was 5s); set pool options explicitly.
  7. Metrics preview removed (unused); stricter **SSL cert** validation (check `DATABASE_URL` sslmode); mapped-enum change (audit schema `@map` enums).
- **Where it hits us:** `backend/prisma/schema.prisma:1` (`generator client { provider = "prisma-client-js" }` → `prisma-client` + `output`); `backend/src/lib/prisma.ts` (`new PrismaClient({ adapter })` + pool config); `backend/prisma.config.ts` (env loading); generated-client import paths if `output` moves; query call sites (`character.findUnique/update/count/deleteMany`, `claimCode.*`, `user.update`) — query API is largely stable 6→7, so these should be unaffected.
- **Risk:** medium-high (DB layer + generation/config). **Verify:** `prisma generate` → `npm run build:ts` → unit-be → **`npm run test:integration` + `npm run test:e2e`** (dockerized).

---

## Tier 4 — MUI 7 → 9 (do last, dedicated branch)

**Important reframe:** Material UI has **no v8** — core jumped 7→9 to realign with MUI X, so this is a *single* major, and **Pigment CSS is opt-in** (v9 still defaults to the Emotion runtime). Staying on Emotion, our exposure is small.

- **Breaking ([upgrade-to-v9](https://mui.com/material-ui/migration/upgrade-to-v9/)):** deprecated props removed in favor of `slots`/`slotProps` (`components`→`slots`, `componentsProps`→`slotProps`, `TransitionComponent`→`slots.transition`, `PaperProps`→`slotProps.paper`); many deprecated CSS classes removed; **`GridLegacy` removed** + system spacing props removed (`mt={2}` → `sx`); 23 legacy `*Outline` icons removed (use `*Outlined`); `disableEscapeKeyDown` removed (use `reason` in `onClose`); Stepper/Backdrop semantics; browser-support floor raised (Chrome 117 / FF 121 / Safari 17).
- **Where it hits us (small — staying on Emotion):**
  - `PaperProps` → `slotProps.paper`: `EquipmentSelectionMenu.tsx:41`, `MorkBorgModalShell.tsx:46`
  - `TransitionComponent` → `slots.transition`: `MorkBorgModalShell.tsx:44`
  - `disableEscapeKeyDown`: `PrivacyNoticeDrawer.tsx:67`
  - Legacy icon: `PersonOutline` → `PersonOutlined`: `Header.tsx:15`
  - **No `<Grid>`/`GridLegacy`, no direct system spacing props (0 found), no Stepper** — the 506 `sx` props, 10 `styled()`, and 2,799-line theme keep working on Emotion unchanged.
  - (`Footer.tsx:60` `components={{…}}` is the **react-i18next `<Trans>`** prop, *not* MUI — leave it.)
- **Migration:** `npx @mui/codemod@latest deprecations/all <path>` to auto-convert most; manually fix the ~4 spots above + the icon rename; bump `@mui/material` + `@mui/icons-material` (+ `@emotion/*` already satisfy peers). **Do not adopt Pigment** (see below).
- **Risk:** medium (small code change, but broad visual surface). **Verify:** FE tsc + lint + unit + **browser** + build, plus **manual/Playwright visual QA** of the character sheet, print page, modals, and flags.

### What Pigment CSS would mean for us — and why to skip it

Pigment CSS ([migration guide](https://mui.com/material-ui/migration/migrating-to-pigment-css/)) is MUI's **build-time, zero-runtime** styling engine. It is **optional** in v9 (default is still the Emotion runtime). Adopting it would mean:

- **Build-time extraction, no runtime dynamic styles.** "Pigment CSS does not support dynamic styles that depend on runtime variables" — they must be rewritten as CSS variables. Our styling is *heavily* runtime-dynamic: ~**506 `sx`** props (many conditional), and `customStyles` **factory functions** like `customStyles.header.title(isMobile)`, `releasePage.typeChip(type, color)`, rotation/`translate` accents computed at render. Most would need refactoring into CSS-variable wrappers.
- **`styled()` import + API change** (`@mui/material-pigment-css`), theme `variants` instead of ownerState callbacks, layout components from the adapter package, a `@pigment-css/vite-plugin` + `styles.css` entry import.
- **Loss of runtime theme callables** (`theme.spacing()`/breakpoints in dynamic contexts) and limited `useTheme`.

For an interactive single-page character sheet, the runtime cost Pigment removes is negligible, while the migration cost (rewriting the 2,799-line dynamic theme + 506 `sx` usages into static/CSS-variable form) is enormous and risky. **Recommendation: upgrade to MUI 9 on Emotion; do not adopt Pigment CSS.** Revisit only if a future MUI major makes Pigment the default.

---

## Suggested order

1. Prereq (Node pin + engines)
2. Tier 1 (one branch)
3. 2.1 → 2.2 → 2.3 → 2.4 (separate branches)
4. 3.1 + 3.2 (pair) → 3.3 (Prisma, own branch)
5. Tier 4 (MUI on Emotion) — last

Re-run the relevant verification matrix and confirm `npm audit` stays 0 after each phase.

## Sources

- MUI v9 upgrade — https://mui.com/material-ui/migration/upgrade-to-v9/
- MUI Pigment CSS migration — https://mui.com/material-ui/migration/migrating-to-pigment-css/
- Prisma 7 upgrade — https://www.prisma.io/docs/orm/more/upgrade-guides/upgrading-versions/upgrading-to-prisma-7
- i18next migration — https://www.i18next.com/misc/migration-guide
- react-i18next changelog — https://github.com/i18next/react-i18next/blob/master/CHANGELOG.md
- ESLint v10 migration — https://eslint.org/docs/latest/use/migrate-to-10.0.0
- TypeScript 6.0 release notes — https://www.typescriptlang.org/docs/handbook/release-notes/typescript-6-0.html
- openapi-fetch changelog — https://github.com/openapi-ts/openapi-typescript/blob/main/packages/openapi-fetch/CHANGELOG.md
- TanStack Router (global blocking) PR #4398 — https://github.com/TanStack/router/pull/4398
- fastify-cli releases — https://github.com/fastify/fastify-cli/releases
