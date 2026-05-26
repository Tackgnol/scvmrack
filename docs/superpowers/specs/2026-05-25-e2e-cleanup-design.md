# E2E cleanup (P1a)

Date: 2026-05-25
Status: Approved
Owner: Adam (with Claude Code)

## Context

The P0 spec untangled the Docker test infrastructure so `npm run test:e2e` builds from a clean checkout. The smoke run that followed exposed two truths:

- The `backend/tests/e2e/tests/` directory contains **two parallel sets of specs**: an organized `{guest,authed,regression}/` layout (10 live specs across `guest` + `authed`, 1 spec in `regression`) and **9 flat `*.e2e.spec.ts` files at the root**. The flat files are silently never executed — they sit outside any of the three Playwright projects' `testDir` scopes. They were superseded by the organized layout in April 2026 and abandoned.
- Both the 9 flat specs and `regression/email-verification.spec.ts` exercise the **removed Better-Auth tabbed sign-in modal**. The frontend handles user identity through Logto now (`backend/src/plugins/rpgtools-auth.ts`); the only Better-Auth surface remaining in the UI is the implicit anonymous session for guests. Specs that look for `tab-signup`, `signup-name-input`, `signup-password-input`, etc. are testing UI that does not exist.
- One last cleanup item: `backend/tests/e2e/global.setup.ts` was superseded by the per-worker `workerAuthState` fixture in `backend/tests/e2e/fixtures.ts` and is now unreferenced in `playwright.config.ts`.

A separate bug discovered during the P0 E2E smoke: `backend/tests/e2e/fixtures.ts:62` calls `${apiBaseURL}/csrf-token`, but the backend mounts all routes under `/api` so the real endpoint is `/api/csrf-token`. Every authed spec returns `Failed to get CSRF token: 404` on its first fixture call. Same class of bug as the `/health` healthcheck error fixed in P0.

This spec scopes the minimum cleanup to (a) remove the dead code and dead UI dependencies, and (b) fix the one-line fixture bug that makes the surviving specs unable to authenticate. Restructure of the surviving `authed/*` specs, page-object helpers, the non-Docker local runner, Istanbul coverage, and the Logto OIDC mock are all out of scope — they live in separate specs (P1b–P1e).

## Goal

Delete every E2E spec that targets removed UI. Fix the one-line `/csrf-token` path bug. Drop unused machinery (`regression` project + flag, `global.setup.ts`). Leave the surviving suite in a state where `npm run test:e2e` exercises only specs that touch UI that still exists.

## Non-goals

- No restructure of `authed/*` into per-domain sub-folders (P1b).
- No introduction of page-object helpers (P1b).
- No non-Docker local runner script (P1c).
- No Istanbul coverage instrumentation (P1d).
- No Logto OIDC mock or anonymous→claim spec (P1e).
- No fixes to BE-side `/api`-prefix drift (the `/health`, `/test/*` paths in `backend/tests/integration-be/`) — that's P3 or P4.
- No locator updates inside the surviving guest specs. The P0 smoke showed the guest tests fail on locator drift (`element not found` before any CSRF call); chasing those is P1b's job, not this spec's.

## Changes

### 1. Delete the 9 flat dead specs

Remove these files entirely:

- `backend/tests/e2e/tests/account-lockout.e2e.spec.ts`
- `backend/tests/e2e/tests/app.e2e.spec.ts`
- `backend/tests/e2e/tests/auth.e2e.spec.ts`
- `backend/tests/e2e/tests/existing-character-load.e2e.spec.ts`
- `backend/tests/e2e/tests/guest-editing.e2e.spec.ts`
- `backend/tests/e2e/tests/lockout-reset.e2e.spec.ts`
- `backend/tests/e2e/tests/logged-in-editing.e2e.spec.ts`
- `backend/tests/e2e/tests/login.e2e.spec.ts`
- `backend/tests/e2e/tests/password-reset.e2e.spec.ts`

Total: ~688 lines of dead code. None are referenced from anywhere — they live outside the three Playwright projects' `testDir` scopes.

### 2. Delete the regression spec and its directory

- Remove `backend/tests/e2e/tests/regression/email-verification.spec.ts` (targets removed sign-up modal — same dead UI as the flat specs).
- Remove the now-empty `backend/tests/e2e/tests/regression/` directory.

### 3. Drop the `regression` Playwright project

In `backend/tests/e2e/playwright.config.ts`:

- Remove the `includeRegression` variable (line ~6) and the per-worker conditional at line 15 (`workers: configuredWorkers ?? (includeRegression ? 1 : 2)`). New value: `workers: configuredWorkers ?? 2`.
- Remove the conditional `regression` project block (lines 46–56). Only `guest` and `authed` projects remain.

### 4. Drop the `--include-regression` plumbing

Two files reference it; both lose their regression flag.

- `backend/scripts/run-e2e-docker.ts` — delete the four lines at the top that conditionally set `PLAYWRIGHT_INCLUDE_REGRESSION=1` when `--include-regression` is in `process.argv` (lines 7–9).
- `backend/package.json` — `test:all` currently chains `node --import tsx scripts/run-e2e-docker.ts --include-regression` at the end. Replace with `npm run test:e2e` so it matches the rest of the chain:

  Before:
  ```json
  "test:all": "npm run test:unit && npm run test:integration && npm run test:browser && node --import tsx scripts/run-e2e-docker.ts --include-regression",
  ```

  After:
  ```json
  "test:all": "npm run test:unit && npm run test:integration && npm run test:browser && npm run test:e2e",
  ```

### 5. Delete `global.setup.ts`

`backend/tests/e2e/global.setup.ts` exists but is not referenced from `playwright.config.ts` (no `globalSetup:` line) and is not imported by any spec or fixture. The per-worker `workerAuthState` fixture in `fixtures.ts` superseded it months ago. Delete the file.

### 6. Fix `/csrf-token` path in fixtures.ts

`backend/tests/e2e/fixtures.ts:62`:

Before:
```ts
const response = await fetch(`${apiBaseURL}/csrf-token`, {
```

After:
```ts
const response = await fetch(`${apiBaseURL}/api/csrf-token`, {
```

This is the only path-drift fix in P1a. The matching `/test/users` and `/test/characters` calls a few lines below (line 110, line 215 — used in the `workerAuthState` and `seededCharacter` fixtures) already work because those test routes are registered without the `/api` prefix when `ENABLE_TEST_ROUTES` is set. If P0's smoke showed `/test/*` calls returning 404 in the integration container, that's because integration's compose doesn't enable test routes — a separate concern, not E2E's problem.

### 7. Smoke verification

After the changes:

```
cd backend
npm run test:e2e
```

Expected outcome:
- Suite builds and runs (P0's job, still passing).
- Authed specs no longer error on the first CSRF call. They get past the fixture setup; whether they then pass or fail on locator drift is **not P1a's acceptance criterion** — that work is P1b.
- Guest specs are unchanged by P1a. Whether they pass or fail on locator drift is also P1b's problem.

A green result is welcome but not required. The acceptance bar is "ran the same specs P0 ran, plus the surviving specs no longer 404 on CSRF setup."

## Risks

- **Cross-spec dependency between deleted flat specs and surviving organized specs.** Unlikely — the flat specs were never run, so they couldn't have seeded state for the live ones. To rule out a stray import edge case, the implementation plan will grep for references to the deleted files before deletion. If any surviving spec imports from a deleted flat file, surface and stop.
- **`global.setup.ts` reference lurking somewhere.** Grep confirms it is not in `playwright.config.ts` or any spec. Still, the implementation plan will grep one more time before deletion.
- **Locator drift in surviving specs.** Already exposed by the P0 smoke (e.g., `element(s) not found` in `home page can generate...`). P1a does not fix these. The acceptance criterion above explicitly allows surviving-spec failures from this cause to remain.
- **`test:all` semantics change.** Previously `test:all` ran a different command path than `test:e2e` (the regression flag). After P1a, they are equivalent for the E2E portion. This is a small CI semantics shift — if CI relies on the flag, it would silently start passing more often (no regression skipping). I checked: `--include-regression` is not referenced in `.woodpecker/` or `.github/` workflows.

## Acceptance

- The 9 flat `*.e2e.spec.ts` files are gone.
- `tests/e2e/tests/regression/` is gone (file + directory).
- `playwright.config.ts` defines exactly two projects: `guest`, `authed`.
- `--include-regression` and `PLAYWRIGHT_INCLUDE_REGRESSION` appear nowhere in `backend/`.
- `global.setup.ts` is gone.
- `fixtures.ts` calls `/api/csrf-token`.
- `npm run test:e2e` builds and runs. Authed specs proceed past their fixture's CSRF setup.

## What lands next

This is P1a. Five further sub-streams round out the E2E story:

- **P1a.5** — Implement the missing `/test/*` test routes (`POST /test/users`, `POST /test/characters`, plus optional `DELETE /test/data`) gated by `ENABLE_TEST_ROUTES`. The fixtures call these to bootstrap authed workers; the routes have never existed in the codebase. After P1a fixes the CSRF path, authed specs will trip on `/test/users` 404 — so P1a.5 must follow immediately to make authed specs actually run end-to-end.
- **P1b** — per-domain `authed` split + page-object helpers. Will also pick up the locator-drift work left behind by P1a (`home` page, guest editing).
- **P1c** — non-Docker local E2E runner (`npm run e2e:local` against `compose.dev.yaml`).
- **P1d** — Istanbul coverage from Playwright merged into the unified coverage report.
- **P1e** — Logto OIDC mock service in `compose.e2e.yaml` + one anonymous→callback→claim spec exercising the auth surface that still exists.

Each gets its own spec → plan → PR.
