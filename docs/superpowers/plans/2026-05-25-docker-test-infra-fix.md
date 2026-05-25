# Docker Test Infra Fix (P0) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `npm run test:integration` and `npm run test:e2e` build and run on a clean local checkout. After this lands, failures from those commands must be honest test failures, not Docker build failures.

**Architecture:** Patch three files (`backend/Dockerfile.integration`, `backend/Dockerfile.integration.dockerignore`, `compose.e2e.yaml`) so that (a) the integration image can authenticate to GitHub Packages, (b) the E2E compose file builds against the current `frontend/` directory and a real backend Dockerfile, and (c) env-var sets match the post-Logto auth plugin. No test code is touched.

**Tech Stack:** Docker, Docker Compose v2, Node 22, `@tackgnol/rpgtools-shared-auth` (private package on GitHub Packages).

**Spec:** `docs/superpowers/specs/2026-05-25-docker-test-infra-fix-design.md`

---

## File map

- Modify: `backend/Dockerfile.integration` — add `.npmrc` copy, switch `npm install` → `npm ci`, remove the file after install.
- Modify: `backend/Dockerfile.integration.dockerignore` — drop stale `client` entry.
- Modify: `compose.e2e.yaml` — fix `api.build.dockerfile`, fix `web.build.context`+`dockerfile`, fix `AUTH_BASE_URL` path, add `APP_BASE_URL` + Logto env vars on `api`, add `VITE_LOGTO_ENDPOINT` + `VITE_ALLOWED_HOSTS` on `web`, drop four stale env vars.

No new files created. No test code touched.

---

## Pre-flight (read once before starting)

- Working directory for all commands: `C:/Users/<user>/WebstormProjects/scvmrack`.
- The user's `.npmrc` (at repo root and `backend/.npmrc`) contains a live GitHub Packages token. Don't print its contents, don't commit it, don't write it into logs. The Dockerfile is set up to delete it after `npm ci`.
- The user's memory says: **no `Co-Authored-By` trailer on commits**. Don't add one.
- Each commit ends without a `Co-Authored-By` line, per user preference.
- The user runs PowerShell on Windows but the Bash tool is available — Docker commands work the same way in either.

---

## Task 1: Fix `backend/Dockerfile.integration`

**Files:**
- Modify: `backend/Dockerfile.integration` (full file, 16 lines)

- [ ] **Step 1: Read the file to confirm current state**

Run:
```bash
cat backend/Dockerfile.integration
```

Expected current content:
```dockerfile
FROM node:22-alpine

WORKDIR /app
RUN chown node:node /app

COPY --chown=node:node package*.json ./

USER node

RUN npm install

COPY --chown=node:node tsconfig.json ./
COPY --chown=node:node tests/integration-be ./tests/integration-be

CMD ["npm", "--prefix", "tests/integration-be", "run", "test"]
```

If the content differs, stop and surface the divergence — the rest of this task assumes the above baseline.

- [ ] **Step 2: Apply the edit**

Use the Edit tool to change the `COPY package*.json` line and the `RUN npm install` line. The `.npmrc*` glob pattern keeps the build working even if `.npmrc` is absent (CI without secrets), and `rm -f .npmrc` removes the token in the same layer so it doesn't leak into the image.

Replace:
```dockerfile
COPY --chown=node:node package*.json ./

USER node

RUN npm install
```

With:
```dockerfile
COPY --chown=node:node package*.json .npmrc* ./

USER node

RUN npm ci && rm -f .npmrc
```

The two `COPY` lines below (`tsconfig.json` and `tests/integration-be`) stay unchanged. The `CMD` line stays unchanged.

- [ ] **Step 3: Verify the build succeeds**

Run:
```bash
docker build -f backend/Dockerfile.integration -t scvmrack-integration-be:smoke backend
```

Expected: the build runs `npm ci` against the host's `backend/.npmrc` and succeeds. `@tackgnol/rpgtools-shared-auth@1.1.0` should resolve from `npm.pkg.github.com` without a 401.

If it fails with `401 Unauthorized`: confirm `backend/.npmrc` exists and is non-empty (`ls -la backend/.npmrc`). The COPY pattern is `.npmrc*` — both root `.npmrc` and `backend/.npmrc` are NOT both in scope since the Docker build context is `./backend`. Only `backend/.npmrc` is visible to the build. If that file is empty or missing, the user needs to recreate it from their personal token.

If it fails with `npm ci can only install with an existing package-lock.json`: confirm `backend/package-lock.json` exists.

- [ ] **Step 4: Verify the token did not leak**

Run:
```bash
docker history scvmrack-integration-be:smoke --no-trunc
```

Expected: the `RUN npm ci && rm -f .npmrc` layer is present. Greppable for `npm ci` but no `_authToken` value appears in any layer's command. (Tokens live in the file copied in the prior layer, but since `.npmrc` is created and removed in the same `RUN` instruction, it does not persist as a file in any image layer.)

- [ ] **Step 5: Clean up the smoke image**

Run:
```bash
docker image rm scvmrack-integration-be:smoke
```

- [ ] **Step 6: Commit**

```bash
git add backend/Dockerfile.integration
git commit -m "[FIX] (integration): copy .npmrc and use npm ci in Dockerfile.integration

Without .npmrc, npm install hit 401 from GitHub Packages when fetching
@tackgnol/rpgtools-shared-auth. Removed in the same RUN layer so the
token does not persist in the image."
```

---

## Task 2: Fix `backend/Dockerfile.integration.dockerignore`

**Files:**
- Modify: `backend/Dockerfile.integration.dockerignore` (10 lines, drop one)

- [ ] **Step 1: Confirm current state**

Run:
```bash
cat backend/Dockerfile.integration.dockerignore
```

Expected:
```
node_modules
client
tests/unit-be
tests/e2e
.git
.env
.env.*
dist
*.md
.claude
```

- [ ] **Step 2: Drop the `client` line**

Use the Edit tool to remove the single line `client` (the directory was renamed to `frontend` in commit `767e473` and `frontend/` is at the repo root anyway, outside the `./backend` build context — the ignore entry was never effective). Result:

```
node_modules
tests/unit-be
tests/e2e
.git
.env
.env.*
dist
*.md
.claude
```

- [ ] **Step 3: Commit**

```bash
git add backend/Dockerfile.integration.dockerignore
git commit -m "[CHORE] (integration): drop dead 'client' entry from dockerignore

Directory was renamed to 'frontend' and lives outside the ./backend
build context; the ignore entry has been a no-op since the repo split."
```

---

## Task 3: Fix `compose.e2e.yaml` build contexts and env parity

**Files:**
- Modify: `compose.e2e.yaml` — `api` service (lines 28–71) and `web` service (lines 73–99).

This task is structural only. The stale-env-var pruning is Task 4 so it can be reverted independently if it breaks anything.

- [ ] **Step 1: Confirm current `api.build` and `web.build` blocks**

Run:
```bash
grep -n "build:\|context:\|dockerfile:" compose.e2e.yaml
```

Expected (paraphrased):
```
api.build.context: .             # no dockerfile line
web.build.context: ./client      # no dockerfile line, dir doesn't exist
```

- [ ] **Step 2: Add `dockerfile` to `api.build`**

Use the Edit tool. Replace:
```yaml
  api:
    image: scvmgrinder_be:e2e
    pull_policy: never
    build:
      context: .
    environment:
```

With:
```yaml
  api:
    image: scvmgrinder_be:e2e
    pull_policy: never
    build:
      context: .
      dockerfile: backend/Dockerfile.dev
    environment:
```

This matches `compose.dev.yaml` and `compose.integration-be.yaml`.

- [ ] **Step 3: Fix the `AUTH_BASE_URL` path on `api`**

The path is missing `/api/`. Replace:
```yaml
      AUTH_BASE_URL: http://api:3000/auth
```

With:
```yaml
      AUTH_BASE_URL: http://api:3000/api/auth
```

Every other compose file uses `/api/auth`; the default in `backend/src/plugins/rpgtools-auth.ts` is also `http://localhost:3000/api/auth`.

- [ ] **Step 4: Add `APP_BASE_URL` and Logto vars to `api`**

The backend's auth plugin reads `APP_BASE_URL` and the four `LOGTO_*` vars at boot. Replace:
```yaml
      AUTH_BASE_URL: http://api:3000/api/auth
      EMAIL_PEPPER: x8MdxZyAkFOxthKH2fwh9fVQ+cFVwO2Bm7wdtuyeERg=
```

With:
```yaml
      AUTH_BASE_URL: http://api:3000/api/auth
      APP_BASE_URL: http://web:5173
      LOGTO_ENDPOINT: ${LOGTO_ENDPOINT:-https://auth.rpgtools.co}
      LOGTO_APP_ID: ${LOGTO_APP_ID:-e2e-logto-app-id}
      LOGTO_APP_SECRET: ${LOGTO_APP_SECRET:-e2e-logto-app-secret}
      LOGTO_REDIRECT_URI: http://api:3000/api/auth/oauth2/callback/logto
      LOGTO_POST_LOGOUT_REDIRECT_URI: http://web:5173/
      EMAIL_PEPPER: x8MdxZyAkFOxthKH2fwh9fVQ+cFVwO2Bm7wdtuyeERg=
```

Live `LOGTO_ENDPOINT` is safe because E2E browsers never follow the redirect out; placeholder app id and secret make any accidental call fail closed.

- [ ] **Step 5: Fix `web.build` and add Logto env vars**

Replace:
```yaml
  web:
    image: scvmgrinder_fe:e2e
    pull_policy: never
    build:
      context: ./client
    environment:
      VITE_BACKEND_URL: ""
      VITE_SITE_URL: http://web:5173
      API_PROXY_TARGET: http://api:3000
      VITE_GA_MEASUREMENT_ID: ""
      VITE_TURNSTILE_SITE_KEY: ""
      VITE_GLITCHTIP_DSN: ""
```

With:
```yaml
  web:
    image: scvmgrinder_fe:e2e
    pull_policy: never
    build:
      context: ./frontend
      dockerfile: Dockerfile.dev
    environment:
      VITE_BACKEND_URL: ""
      VITE_SITE_URL: http://web:5173
      VITE_LOGTO_ENDPOINT: ${LOGTO_ENDPOINT:-https://auth.rpgtools.co}
      VITE_ALLOWED_HOSTS: localhost,127.0.0.1,web
      API_PROXY_TARGET: http://api:3000
      VITE_GA_MEASUREMENT_ID: ""
      VITE_TURNSTILE_SITE_KEY: ""
      VITE_GLITCHTIP_DSN: ""
```

- [ ] **Step 6: Verify the compose file parses**

Run:
```bash
docker compose -f compose.e2e.yaml config --quiet
```

Expected: no output, exit code 0. (`config --quiet` validates without printing.) If it prints errors, fix indentation before continuing.

- [ ] **Step 7: Verify all services build**

Run:
```bash
docker compose -f compose.e2e.yaml build
```

Expected: `db`, `api`, `web`, and `e2e` all build successfully. `mailpit` is pulled from registry (no build step).

If `web` build fails because Vite complains about a missing env var: the production-style frontend Dockerfile may differ from `Dockerfile.dev`. Confirm `frontend/Dockerfile.dev` exists and `frontend/package.json` is present in `./frontend`.

If `api` build fails with the 401 error from Task 1: `backend/Dockerfile.dev` already copies `.npmrc*` (lines 6–7), so this should not happen. If it does, `backend/.npmrc` may be empty.

- [ ] **Step 8: Commit**

```bash
git add compose.e2e.yaml
git commit -m "[FIX] (e2e): repair build contexts and env parity in compose.e2e.yaml

- api.build: add explicit backend/Dockerfile.dev (was missing, no
  root Dockerfile exists since the repo split)
- web.build: ./client -> ./frontend (renamed in the repo split)
- AUTH_BASE_URL: add missing /api/ prefix to match every other
  compose file and the default in rpgtools-auth.ts
- api: add APP_BASE_URL and LOGTO_* env vars now required by the
  shared-auth plugin at boot
- web: add VITE_LOGTO_ENDPOINT and VITE_ALLOWED_HOSTS to mirror
  compose.dev.yaml"
```

---

## Task 4: Prune stale env vars from `compose.e2e.yaml`

Separate commit so it can be reverted independently if it turns out one of these vars is consumed by `@tackgnol/rpgtools-shared-auth` at a path not visible from this repo.

**Files:**
- Modify: `compose.e2e.yaml` — `api.environment` block.

- [ ] **Step 1: Remove four vars**

Use the Edit tool. Remove these four lines from the `api.environment` block:

```yaml
      BETTER_AUTH_URL: http://web:5173
```

```yaml
      EMAIL_PEPPER: x8MdxZyAkFOxthKH2fwh9fVQ+cFVwO2Bm7wdtuyeERg=
```

```yaml
      EMAIL_ENCRYPTION_KEY: c80e44590e908ad4059e67cfdf246a8b21b8f7d726c850064006283fc8b8290a
```

```yaml
      TURNSTILE_SECRET_KEY: ""
```

Keep all `MAIL_*` vars (used by shared-auth for email-sending against Mailpit), `BETTER_AUTH_SECRET`, `ENABLE_TEST_ROUTES`, and `AUTH_BASE_URL`.

- [ ] **Step 2: Verify the compose file still parses and builds**

Run:
```bash
docker compose -f compose.e2e.yaml config --quiet && docker compose -f compose.e2e.yaml build api
```

Expected: build succeeds. The `api` image build does not need these vars, so this is a fast verify.

- [ ] **Step 3: Commit**

```bash
git add compose.e2e.yaml
git commit -m "[CHORE] (e2e): drop stale env vars from compose.e2e.yaml

EMAIL_PEPPER, EMAIL_ENCRYPTION_KEY, TURNSTILE_SECRET_KEY, and
BETTER_AUTH_URL are not referenced by backend/src/**. They are
leftovers from the pre-shared-auth email/captcha setup. Kept
MAIL_*, BETTER_AUTH_SECRET, ENABLE_TEST_ROUTES, and AUTH_BASE_URL
which are still consumed via the shared-auth package."
```

---

## Task 5: Smoke the integration suite

Verification only — no code change, no commit.

- [ ] **Step 1: Tear down any stale state**

Run:
```bash
docker compose -f compose.integration-be.yaml down --volumes --remove-orphans
```

- [ ] **Step 2: Run integration**

Run:
```bash
cd backend && npm run test:integration
```

Expected: Docker builds finish without 401. The integration suite (api.integration, custom-items.integration, test-routes-disabled.integration) executes and produces a pass/fail verdict.

- [ ] **Step 3: Record the verdict**

If all green: note in the task log "P0 integration smoke: PASS".

If anything fails: note which test(s) failed and the failure summary. Test logic failures are P1/P4 concerns, not P0 — the spec's acceptance criterion is "runs to a verdict", not "all green". Do not attempt to fix test failures in this plan.

If Docker still fails to build: P0 is incomplete. Surface the error and stop.

- [ ] **Step 4: Tear down**

Run:
```bash
docker compose -f compose.integration-be.yaml down --volumes --remove-orphans
```

---

## Task 6: Smoke the E2E suite

Verification only — no code change, no commit.

- [ ] **Step 1: Tear down any stale state**

Run:
```bash
docker compose -f compose.e2e.yaml down --volumes --remove-orphans
```

- [ ] **Step 2: Run E2E**

Run:
```bash
cd backend && npm run test:e2e
```

Expected: full stack (db, mailpit, api, web, e2e) builds and comes up healthy. Playwright runs the organized E2E suite (`guest/*`, `authed/*`, optionally `regression/*`) and produces a pass/fail verdict.

This will take several minutes on a cold cache. Default workers is 2 (config sets `workers: includeRegression ? 1 : 2`).

- [ ] **Step 3: Record the verdict**

If all green: note "P0 E2E smoke: PASS".

Expected failures that are NOT P0 problems (record but do not fix):
- The `regression/email-verification.spec.ts` test targets the removed Better-Auth tabbed modal (`tab-signup`, `signup-*-input`); it will fail. P1 will delete it.
- Any spec asserting on `/?...` URLs while the app redirects to `/character?...` — same root cause as the P4 FE unit failures.

Other failures should be noted with their summary. Don't attempt to fix in this plan.

- [ ] **Step 4: Tear down**

Run:
```bash
docker compose -f compose.e2e.yaml down --volumes --remove-orphans
```

---

## Task 7: Final report

Verification only — no commit.

- [ ] **Step 1: Compile a one-paragraph completion note**

Include: commits added (4 expected: Task 1, 2, 3, 4), integration smoke verdict, E2E smoke verdict, any test failures noted but deferred. Hand back to the user.

- [ ] **Step 2: Update memory**

If anything notable surfaced (e.g., `MAIL_*` actually wasn't used either and the keep-list was over-cautious; or `backend/.npmrc` was empty on the host and had to be recreated), save a short feedback memory under `C:/Users/<user>/.claude/projects/C--Users-Adam-WebstormProjects-scvmrack/memory/` per the auto-memory rules. If nothing notable: skip.

---

## Acceptance recap (from the spec)

- `cd backend && npm run test:integration` builds and runs to a verdict. ✅ if Task 5 PASS.
- `cd backend && npm run test:e2e` builds and runs to a verdict. ✅ if Task 6 PASS.
- No test files modified. ✅ by construction — this plan only touches the three infra files.
- Token does not appear in the final integration image. ✅ if Task 1 Step 4 PASS.

## Self-review check

- Spec coverage: Section "Changes 1" → Task 1. Section "Changes 2" → Task 2. Section "Changes 3a + 3b" → Task 3. Section "Changes 3c" → Task 4. Section "Smoke verification" → Tasks 5 + 6. Acceptance criteria → Task 7 report. No gaps.
- Placeholder scan: no TBDs, no "implement later", every step has an actual command or edit.
- No new types or methods introduced; nothing to cross-check.
