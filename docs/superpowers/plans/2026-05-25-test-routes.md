# E2E Test-Fixture Routes (P1a.5) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `POST /test/users` and `POST /test/characters` to the backend so authed Playwright workers can bootstrap real sessions and seeded characters.

**Architecture:** Single new Fastify plugin at `backend/src/plugins/test-routes.ts`, autoloaded with no URL prefix. Early-returns if `ENABLE_TEST_ROUTES !== '1'`, so production / dev / integration stay unaffected. `compose.e2e.yaml` already sets `ENABLE_TEST_ROUTES=1` on the api service.

**Tech Stack:** Fastify 5, `fastify-plugin`, Better Auth (anonymous sign-in via `fastify.auth.handler`), Prisma.

**Spec:** `docs/superpowers/specs/2026-05-25-test-routes-design.md`

---

## File map

- Create: `backend/src/plugins/test-routes.ts` (single new file, ~80 lines).

No changes to: `compose.e2e.yaml`, `compose.integration-be.yaml`, `compose.dev.yaml`, `app.ts`, prisma schema, route configuration.

---

## Pre-flight

- Working directory: `C:/Users/Adam/WebstormProjects/scvmrack`.
- Branch: master, commit directly.
- **No `Co-Authored-By` trailer on commits.**

---

## Task 1: Create the test-routes plugin

- [ ] **Step 1: Write the file**

Create `backend/src/plugins/test-routes.ts` with content from the spec. Use the exact code from `docs/superpowers/specs/2026-05-25-test-routes-design.md` § "1. New file" — it's complete.

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd backend && npx tsc --noEmit
```

Expected: no errors. If `fastify.auth` is reported as unknown, check that `@tackgnol/rpgtools-shared-auth/dist/plugin.d.ts` is declared correctly (it adds the decorator via module augmentation).

- [ ] **Step 3: Commit**

```bash
git add backend/src/plugins/test-routes.ts
git commit -m "[FEAT] (test-routes): add /test/users and /test/characters fixture routes

New plugin at src/plugins/test-routes.ts gated by ENABLE_TEST_ROUTES=1.
POST /test/users calls Better Auth's anonymous sign-in via
fastify.auth.handler and returns { userId, sessionCookie }, optionally
overwriting the user record's name/email/isAnonymous so the FE treats
the worker as logged-in. POST /test/characters generates a character
via the existing generate_character SQL function and binds it to the
provided userId.

Unblocks authed Playwright workers — fixtures.ts has been calling
these routes since the suite was introduced but they never existed."
```

---

## Task 2: Verify integration-be assertions still hold

- [ ] **Step 1: Confirm `compose.integration-be.yaml` does NOT set `ENABLE_TEST_ROUTES`**

```bash
grep -n "ENABLE_TEST_ROUTES" compose.integration-be.yaml
```

Expected: no output (the variable is not set, so the plugin's early-return path runs and no routes register).

- [ ] **Step 2: Run integration to confirm test-routes-disabled assertions still pass**

```bash
docker compose -f compose.integration-be.yaml down --volumes --remove-orphans
cd backend && npm run test:integration
```

Use `run_in_background: true` and wait for the harness notification.

Expected:
- Build succeeds (P0 fixes intact).
- `test-routes-disabled.integration.test.ts` assertions for `GET /test/users`, `POST /test/users`, `POST /test/characters`, `DELETE /test/data` all return 404 → pass.
- Other integration tests may still fail (P3 territory) — that's fine, we're only verifying the disabled-routes contract.

- [ ] **Step 3: Teardown**

```bash
docker compose -f compose.integration-be.yaml down --volumes --remove-orphans
```

---

## Task 3: E2E smoke

- [ ] **Step 1: Teardown stale state**

```bash
docker compose -f compose.e2e.yaml down --volumes --remove-orphans
```

- [ ] **Step 2: Run E2E**

```bash
cd backend && npm run test:e2e
```

Use `run_in_background: true` and wait for notification.

Expected — authed workers no longer fail at `Failed to create test user: 404`. The 7 authed specs now reach their first assertion. Possible outcomes:

- **Best case:** all 7 authed specs pass → 8/10 total green, 2/10 still failing on guest locator drift (P1b).
- **Realistic case:** authed specs make progress but fail later on UI assertions or path drift; the failure messages should be different from before. That's still P1a.5 success — the routes work.
- **Surprise case:** anonymous sign-in returns an unexpected shape, plugin returns 502, and authed workers still fail at `/test/users` (with 502 not 404 now). Capture the body in the api logs and surface — implementer can iterate.

- [ ] **Step 3: Compare verdict against P1a baseline**

P1a baseline: 10 tests / 1 pass / 9 fail (7 authed on `/test/users`, 2 guest on locator drift).

After P1a.5, the 7 authed failures should resolve into either passes or different failure modes. If any of those 7 still report "Failed to create test user", surface immediately — the plugin didn't take effect.

- [ ] **Step 4: Teardown**

```bash
docker compose -f compose.e2e.yaml down --volumes --remove-orphans
```

---

## Acceptance recap

- `backend/src/plugins/test-routes.ts` exists. ✅ Task 1.
- TypeScript compiles. ✅ Task 1 Step 2.
- Integration test `test-routes-disabled.integration.test.ts` 404 assertions still pass (no ENABLE_TEST_ROUTES in integration compose). ✅ Task 2.
- E2E authed workers no longer 404 at `/test/users`. ✅ Task 3.

## Self-review

- Spec coverage: § "1. New file" → Task 1. § "2. No change to compose.e2e.yaml" + "3. No change to integration-be" → verified in Tasks 2-3. § "4. Smoke verification" → Tasks 2 + 3. No gaps.
- Placeholders: none.
- Type consistency: `userId: string` in both routes; `fastify.auth.handler` matches the type from `@tackgnol/rpgtools-shared-auth/dist/plugin.d.ts`.
