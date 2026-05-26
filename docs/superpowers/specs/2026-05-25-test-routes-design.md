# E2E test-fixture routes (P1a.5)

Date: 2026-05-25
Status: Approved
Owner: Adam (with Claude Code)

## Context

P1a fixed the `/csrf-token` path bug in `backend/tests/e2e/fixtures.ts` so that authed E2E workers can complete CSRF setup. The next call in the fixture chain is `POST /test/users` (in `workerAuthState`), followed by `POST /test/characters` (in `seededCharacter`).

These two routes have never existed in the codebase. Investigation in P1a confirmed:

- `grep -rn "/test/users" backend/src` and the equivalent for `node_modules/@tackgnol/rpgtools-shared-auth/dist` return nothing.
- `git log --all -S "/test/users" -- 'backend/**.ts'` returns nothing.
- The integration test `backend/tests/integration-be/src/test-routes-disabled.integration.test.ts` asserts these endpoints return 404 when `ENABLE_TEST_ROUTES` is not set — which they always do because there is nothing to enable.

`compose.e2e.yaml` does set `ENABLE_TEST_ROUTES: "1"` on the `api` service, so the contract for the routes existed in the test config; the implementation was simply never written.

After P1a, every authed E2E spec errors at "Failed to create test user: 404". This spec adds the missing routes so authed specs can complete their fixture bootstrap and exercise the surviving UI.

## Goal

Add `POST /test/users` and `POST /test/characters` to the backend, gated by `process.env.ENABLE_TEST_ROUTES === '1'`. After this lands, the authed Playwright workers can bootstrap a real session and a seeded character, unblocking every authed spec from getting past fixture setup.

## Non-goals

- No `DELETE /test/data` (cleanup) — the worker fixture creates a fresh anonymous user per worker, so no inter-test pollution. Cleanup is a nice-to-have for a later cycle.
- No `GET /test/users` listing — fixtures never call it. The integration test that asserts `GET /test/users` is 404 keeps passing because we won't register a GET, only POSTs.
- No authentication for the routes — `ENABLE_TEST_ROUTES` is the gate. The compose files only enable it in the E2E stack.
- No actual Logto integration — Better Auth anonymous users are sufficient for "authed" E2E specs. The data ownership model is identical (`characters.user_id`) regardless of whether the user originated from Logto callback or anonymous sign-in.
- No matching update to `compose.integration-be.yaml` — that stack must continue to lack `ENABLE_TEST_ROUTES` so the existing `test-routes-disabled.integration.test.ts` assertions stay valid.

## Changes

### 1. New file: `backend/src/plugins/test-routes.ts`

A Fastify plugin that registers two POST routes at top level (no `/api` prefix), gated by `ENABLE_TEST_ROUTES`.

```ts
import fp from 'fastify-plugin';
import type { FastifyInstance } from 'fastify';
import prisma from '../lib/prisma.js';

interface CreateUserBody {
  name?: string;
  email?: string;
  password?: string;
}

interface CreateCharacterBody {
  userId: string;
}

export default fp(async function testRoutesPlugin(fastify: FastifyInstance) {
  if (process.env.ENABLE_TEST_ROUTES !== '1') return;

  fastify.log.warn('ENABLE_TEST_ROUTES=1 — registering /test/* fixture routes');

  fastify.post<{ Body: CreateUserBody }>('/test/users', async (request, reply) => {
    const { name, email } = request.body ?? {};

    const authBaseUrl = process.env.AUTH_BASE_URL ?? 'http://localhost:3000/api/auth';
    const response = await fastify.auth.handler(
      new Request(`${authBaseUrl}/sign-in/anonymous`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
      })
    );

    if (!response.ok) {
      const text = await response.text();
      return reply.status(502).send({ error: 'anonymous_sign_in_failed', detail: text });
    }

    const setCookies = response.headers.getSetCookie?.() ?? [];
    const sessionCookie = setCookies.join('; ');
    const payload = (await response.json()) as { user?: { id?: string } };
    const userId = payload?.user?.id;

    if (!userId || !sessionCookie) {
      return reply.status(502).send({ error: 'anonymous_sign_in_invalid_response' });
    }

    if (name || email) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          ...(name ? { name } : {}),
          ...(email ? { email } : {}),
          isAnonymous: false,
        },
      });
    }

    return reply.status(201).send({ userId, sessionCookie });
  });

  fastify.post<{ Body: CreateCharacterBody }>('/test/characters', async (request, reply) => {
    const { userId } = request.body ?? ({} as CreateCharacterBody);

    if (!userId) {
      return reply.status(400).send({ error: 'userId required' });
    }

    const [result] = await prisma.$queryRaw<{ generateCharacter: string }[]>`
      SELECT generate_character(NULL::integer) AS "generateCharacter"
    `;

    const characterId = result?.generateCharacter;
    if (!characterId) {
      return reply.status(500).send({ error: 'character_generation_failed' });
    }

    await prisma.character.update({
      where: { id: characterId },
      data: { userId },
    });

    return reply.status(201).send({ id: characterId });
  });
});
```

The auto-loader in `backend/src/app.ts` picks up this file from `src/plugins/` without any URL prefix, so the routes register at `/test/users` and `/test/characters` exactly as the fixture expects.

The `isAnonymous: false` update on user record fakes a "claimed" user so any code paths that check `isAnonymous` treat the worker session as a real user. This matters for the FE's "logged in" UI state — without it, the navigation bar would still show "guest" treatment.

### 2. No change to `compose.e2e.yaml`

It already sets `ENABLE_TEST_ROUTES: "1"`. The plugin reads that and registers the routes at boot.

### 3. No change to `compose.integration-be.yaml`

It does not set `ENABLE_TEST_ROUTES`. The existing integration assertions (`test-routes-disabled.integration.test.ts`) continue to pass because the plugin's early `return` means no routes are registered.

### 4. Smoke verification

After the changes:

```
cd backend
npm run test:integration  # expect: 'returns 404 when disabled' assertions still pass
npm run test:e2e          # expect: authed workers complete fixture setup, specs actually run
```

The E2E suite may still have failures from locator drift in guest specs (that's P1b), but the **mode of failure** should shift again: from "Failed to create test user: 404" to whatever the next real assertion or locator surfaces.

## Risks

- **Anonymous Better Auth call returns unexpected shape.** Mitigation: log the response text on failure and surface 502 with detail; the implementer can inspect once and fix.
- **The `fastify.auth` decorator might not be available at the moment `/test/*` plugins register.** `rpgtools-shared-auth` adds it; auto-loader order matters. If the test-routes plugin registers before shared-auth, `fastify.auth` is undefined at boot time but available at request time. Plugin code uses `fastify.auth.handler` inside the route handler — that runs only when a request comes in, by which time all plugins have finished registering. Safe.
- **Mailpit + email side effects** — anonymous sign-in does not trigger emails (it's anonymous), so no Mailpit interaction.
- **`isAnonymous: false` update** — `user.isAnonymous` is in the Better Auth schema (verified in `backend/prisma/migrations/20260508160000_init/migration.sql:8`). Forcing `false` is a deliberate spoof for UI behavior, not a security control. The session cookie carries the anonymous flag in its own payload; this is a database-only update for FE state.

## Acceptance

- `backend/src/plugins/test-routes.ts` exists and is autoloaded.
- `npm run test:integration` continues to pass the existing `test-routes-disabled` assertions when run against `compose.integration-be.yaml` (which lacks `ENABLE_TEST_ROUTES`).
- `npm run test:e2e` shows authed workers no longer failing at `POST /test/users` — they get past fixture setup.
- Authed E2E specs progress to their first real assertion. Whether those then pass or fail (locator drift) is **not P1a.5's acceptance bar** — P1b handles locator updates.

## What lands next

After P1a.5, the surviving P1 sub-streams are unchanged:

- **P1b** — per-domain `authed` split + page-object helpers, plus locator-drift fixes uncovered by P1a/P1a.5.
- **P1c** — non-Docker local E2E runner.
- **P1d** — Istanbul coverage from Playwright merged into the unified report.
- **P1e** — Logto OIDC mock + anonymous→callback→claim spec.

P1a.5 is the last piece needed to unblock the existing authed specs from making any progress. Everything beyond is structural improvement, not break-fix.
