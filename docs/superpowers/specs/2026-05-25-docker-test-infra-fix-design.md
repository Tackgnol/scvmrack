# Docker test infra fix (P0)

Date: 2026-05-25
Status: Approved
Owner: Adam (with Claude Code)

## Context

`npm run test:integration` and `npm run test:e2e` both fail before any test runs because the Docker build itself is broken.

- `npm run test:integration` aborts during the build of the `integration` service. `backend/Dockerfile.integration` does not copy `.npmrc`, so `npm install` returns `401 Unauthorized` when fetching the private package `@tackgnol/rpgtools-shared-auth` from GitHub Packages.
- `npm run test:e2e` aborts during the build of the `web` and `api` services in `compose.e2e.yaml`:
  - `web.build.context` is `./client` — the directory was renamed to `./frontend` in `767e473 chore: split repo into backend and frontend`.
  - `api.build` has `context: .` but no `dockerfile:` line; there is no root `Dockerfile` in the repo, so the build fails immediately.

Both suites have therefore been silently un-runnable locally since the backend/frontend split (~7 weeks). CI may patch around this with secrets, but a fresh local checkout cannot reproduce CI. The empty `BE unit` suite (one file, five tests on `utils.ts`) makes this worse — there is essentially nothing covering the API surface that can run on a developer's machine.

This spec scopes the minimum mechanical fixes to make both suites buildable and runnable from a clean checkout, without touching any test logic, spec layout, or coverage plumbing. Test-suite reorganisation, the four missing auth flows, the non-Docker runner, Istanbul coverage, BE unit growth, and the FE browser audit are all out of scope here — they live in separate specs (P1 through P4).

## Goal

Make `npm run test:integration` and `npm run test:e2e` build and run on a clean local checkout. Failures from this point on must be honest test failures, not infrastructure failures.

## Non-goals

- No change to any test file, fixture, helper, or Playwright project config.
- No restructure of the E2E spec layout.
- No fix for `npm run test:coverage:merge` (P4).
- No fix for the 5 failing FE unit tests in `frontend/test/unit/router/navigation.test.ts` (P4).
- No introduction of self-hosted Logto in `compose.e2e.yaml`. The current organized E2E specs do not exercise Logto flows; they use Better Auth via `@tackgnol/rpgtools-shared-auth` and Mailpit. Logto staging is a P1 question.
- No removal of `tests/e2e/global.setup.ts` (P4 hygiene).

## Changes

### 1. `backend/Dockerfile.integration`

Copy `.npmrc` before `npm install` so npm can authenticate to GitHub Packages. Switch `npm install` → `npm ci` to match `Dockerfile.dev` and enforce lockfile fidelity. Remove the `.npmrc` after install so the token does not leak into the image layer.

Before:
```dockerfile
COPY --chown=node:node package*.json ./

USER node

RUN npm install
```

After:
```dockerfile
COPY --chown=node:node package*.json .npmrc* ./

USER node

RUN npm ci && rm -f .npmrc
```

### 2. `backend/Dockerfile.integration.dockerignore`

Drop the dead `client` entry (directory was renamed to `frontend` in the split). Keep everything else.

### 3. `compose.e2e.yaml`

Three classes of fix:

**a. Build contexts**

- `web.build.context`: `./client` → `./frontend`, and add `dockerfile: Dockerfile.dev` to match `compose.dev.yaml`.
- `api.build`: keep `context: .`, add `dockerfile: backend/Dockerfile.dev` to match `compose.dev.yaml` and `compose.integration-be.yaml`.

**b. Env parity with `compose.dev.yaml`**

The app now uses Logto via `@tackgnol/rpgtools-shared-auth`. Even though current E2E specs don't traverse Logto flows, the backend boots its auth plugin at startup and requires the Logto env vars to be present.

Fix the `AUTH_BASE_URL` path while we are here. `compose.e2e.yaml` currently has `http://api:3000/auth`, which is missing the `/api/` prefix used everywhere else (dev, integration, prod, README, `.env.example`, and the default in `backend/src/plugins/rpgtools-auth.ts`). Change to `http://api:3000/api/auth`.

Add to `api`:

- `APP_BASE_URL: http://web:5173`
- `LOGTO_ENDPOINT: ${LOGTO_ENDPOINT:-https://auth.rpgtools.co}` (default to live; tests don't traverse it)
- `LOGTO_APP_ID: ${LOGTO_APP_ID:-e2e-logto-app-id}`
- `LOGTO_APP_SECRET: ${LOGTO_APP_SECRET:-e2e-logto-app-secret}`
- `LOGTO_REDIRECT_URI: http://api:3000/api/auth/oauth2/callback/logto`
- `LOGTO_POST_LOGOUT_REDIRECT_URI: http://web:5173/`

Add to `web`:

- `VITE_LOGTO_ENDPOINT: ${LOGTO_ENDPOINT:-https://auth.rpgtools.co}`
- `VITE_ALLOWED_HOSTS: localhost,127.0.0.1,web` (matches dev)

**c. Drop stale env vars**

The following are set in `compose.e2e.yaml` but not referenced by `backend/src/**`. Most are leftovers from a pre-shared-auth email flow. Remove them from the `api` service:

- `EMAIL_PEPPER`
- `EMAIL_ENCRYPTION_KEY`
- `TURNSTILE_SECRET_KEY`
- `BETTER_AUTH_URL` (replaced by `APP_BASE_URL` / `AUTH_BASE_URL` in the new auth plugin)

Keep these — they are consumed by `@tackgnol/rpgtools-shared-auth` for the registration / verification / magic-link / claim flows and for the `/test/users` and `/test/characters` test routes that `tests/e2e/fixtures.ts` relies on:

- `MAIL_HOST`, `MAIL_PORT`, `MAIL_SECURE`, `MAIL_USER`, `MAIL_PASS`
- `ENABLE_TEST_ROUTES`
- `BETTER_AUTH_SECRET`
- `AUTH_BASE_URL`

If removing one of these turns out to break a flow that does still run (`regression/email-verification.spec.ts`), restore it and document. The conservative path: ship the dockerfile + context fixes first, then prune env vars in a second pass once the suite builds.

### 4. Smoke verification

After the changes, run from a clean state:

```
cd backend
npm run test:integration   # expect: build succeeds, suite runs to a verdict
npm run test:e2e           # expect: full stack builds, organized E2E suite runs to a verdict
```

A pass/fail verdict is the success criterion — not "all tests green". If tests fail for reasons unrelated to the infra fix, that is a P1/P4 concern and gets recorded for follow-up.

## Risks

- **Lockfile drift.** `npm ci` fails if `backend/package-lock.json` is out of sync with `package.json`. If that happens the error is loud and the fix is `npm install` + commit the updated lockfile. Surfacing the drift is a feature, not a bug.
- **Logto live endpoint leakage.** Defaulting `LOGTO_ENDPOINT` to `https://auth.rpgtools.co` means a misbehaving E2E test could hit production Logto. Low risk in practice: the app handles all user identity via Logto by redirecting out to it, and the E2E browser never follows that redirect — the live `guest/*` and `authed/*` specs never visit Logto. Placeholder `LOGTO_APP_ID` / `LOGTO_APP_SECRET` mean any accidental call fails closed.
- **Env-var pruning regressions.** If a `MAIL_*` or `BETTER_AUTH_SECRET` is consumed by the shared-auth package at a path not visible from this repo, removing it would break. Mitigation: only drop the four explicitly checked above (`EMAIL_PEPPER`, `EMAIL_ENCRYPTION_KEY`, `TURNSTILE_SECRET_KEY`, `BETTER_AUTH_URL`). Leave the `MAIL_*` family intact.
- **`npm ci` slower than `npm install`.** True but irrelevant for an integration build that is already on the order of 30s+ from base image pull.

## Acceptance

- `cd backend && npm run test:integration` builds and runs to a verdict (no Docker build errors).
- `cd backend && npm run test:e2e` builds and runs to a verdict (no Docker build errors).
- The fix is self-contained: no test files are modified, no Playwright config changes, no new packages added.
- Token does not appear in the final integration image (`docker history` shows it was removed in the same layer it was used).

## What lands next

This spec is P0 of a five-stream test-suite overhaul. Once P0 lands and the suites are runnable again:

- **P1** — E2E restructure: delete the 9 dead flat specs and the dead `regression/email-verification.spec.ts` (all target the removed Better-Auth tabbed modal — user identity is now 100% Logto-redirect; Better Auth only handles anonymous sessions and post-Logto callbacks). Introduce per-domain `authed` split + page-object helpers, add a non-Docker local runner, instrument Istanbul coverage from Playwright into the merged report, decide whether to cover the anonymous → Logto-callback → claim flow (the one remaining auth surface) via a stub or skip it.
- **P2** — FE browser test audit: classify the 198 browser-suite files into "needs real browser" vs "JSDOM is enough", move the latter to the unit suite, shrink browser runtime.
- **P3** — BE unit suite growth: cover schemas, validation branches, plugin wiring; today the suite has 1 file.
- **P4** — Misc cleanup: fix the 5 FE nav unit failures, make `test:coverage:merge` resilient to per-suite failure, drop the redundant `tests/e2e/global.setup.ts`.

Each gets its own spec → implementation plan → PR.
