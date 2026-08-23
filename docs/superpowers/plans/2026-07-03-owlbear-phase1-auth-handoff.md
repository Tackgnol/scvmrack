# Owlbear Extraction — Phase 1: OBR Auth Handoff Consolidation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the OBR popup sign-in handoff (mailbox endpoints + client popup flow) from scvmrack into `@tackgnol/rpgtools-shared-auth`, so the future `rpgtools-owlbear` package contains zero auth code and scvmrack deletes ~400 lines of security-sensitive duplication.

**Architecture:** The handoff mailbox becomes two new better-auth endpoints inside shared-auth's existing `obrExchange` plugin (`POST /api/auth/obr-handoff/publish`, `POST /api/auth/obr-handoff/take`), storing tokens in better-auth's **verification table** via `internalAdapter` — exactly how `obr-exchange` tokens are already stored, so **no new DB table or Prisma model is needed anywhere**. The client popup orchestration (`waitForObrExchangeToken`, `signInViaObrPopup`, `completeObrAuthHandoff`) moves into shared-auth's `/client` export as framework-free functions taking an `RpgToolsAuthClient`. scvmrack then upgrades, deletes its local handoff route/service/repo/schema + `ObrAuthHandoff` Prisma model, and rewrites `useObrSession` / `ObrAuthDonePage` as thin wrappers.

**Tech Stack:** shared-auth: TypeScript ESM, Fastify 5, better-auth, `node --test` + tsx (+ happy-dom via `src/tests/setupDom.ts` for DOM tests). scvmrack: Fastify 5 + Prisma backend, React 18 + Vite + TanStack Query frontend, Vitest.

**This is Plan 1 of 2.** Plan 2 (`rpgtools-owlbear` package: core + `/react-query` + `/rr7` outlets + `/server` Fastify plugin, scvmrack migration) will be written after this plan ships, against the real shared-auth 1.6.0 API.

## Global Constraints

- **Repos:** `C:\Users\<user>\WebstormProjects\rpgtools-shared-auth` (Tasks 1–4) and `C:\Users\<user>\WebstormProjects\scvmrack` (Tasks 5–8). Every step's paths are relative to the repo named in its task.
- **shared-auth version:** `1.5.0` → `1.6.0` (semver-minor; additive only — bsp/trench-rats must be able to upgrade without changes).
- **Wire compatibility:** `/api/auth/obr-exchange/issue` and `/api/auth/obr-exchange/redeem` are UNCHANGED. The handoff endpoints change shape (old: `PUT`/`GET /api/auth/obr-handoff/:handoffId`; new: `POST /api/auth/obr-handoff/publish` and `POST /api/auth/obr-handoff/take`) — allowed because scvmrack FE+BE ship together in one release.
- **Security invariants:** publish requires a non-anonymous session (mirrors `issueObrExchangeToken`); take is unauthenticated by design (one-shot, unguessable UUID id, 2-minute TTL); handoff endpoints stay under `/api/auth/*` (CSRF-exempt namespace) and must not act on the caller's session beyond these gates. Handoff identifiers are stored hashed (`sha256`), like exchange tokens.
- **Commits:** conventional messages (`feat:`, `refactor:`, `chore:`). Do NOT add a `Co-Authored-By` trailer.
- **scvmrack validation checklist** (from CLAUDE.md) applies to Tasks 5–8: `npx tsc --noEmit` + `npm run lint` (frontend), `npm run test:unit` (backend), `npm run test:browser` + `npm run doctor` when touching frontend components/hooks.
- **No new runtime dependencies** in either repo.

---

### Task 1: shared-auth — handoff endpoints in the `obrExchange` better-auth plugin

**Files:**
- Modify: `src/services/obrExchange.ts`
- Modify: `src/index.ts` (export new constants/types)
- Test: `src/tests/plugin.test.ts` (new `describe` block; reuse the file's existing helpers `createAuthMemoryDb`, `baseOptions`, `signInAnonymous`, `markUserAuthenticated`, `jsonHeaders`, `cookieHeaderFrom`)

**Interfaces:**
- Consumes: existing `obrExchange(options)` plugin, `ctx.context.internalAdapter` (createVerificationValue / findVerificationValue / deleteVerificationByIdentifier), existing `badRequest()` / `unauthorized()` helpers in the same file.
- Produces: `POST /api/auth/obr-handoff/publish` body `{ handoffId: uuid, token: string }` → `200 { ok: true }` | `400` | `401`; `POST /api/auth/obr-handoff/take` body `{ handoffId: uuid }` → `200 { token: string | null }` | `400`. Exported constants `OBR_HANDOFF_TTL_MS = 120_000`, `OBR_HANDOFF_MAX_TOKEN_LENGTH = 4096`. New option `ObrExchangeOptions.handoffTtlMs?: number`.

- [ ] **Step 1: Write the failing tests**

Append to `src/tests/plugin.test.ts` (after the `obr-exchange routes` describe block, mirroring its idioms):

```ts
describe('rpgtoolsSharedAuth obr-handoff routes', () => {
  const HANDOFF_ID = '4f9c2d6e-1b3a-4c5d-8e7f-9a0b1c2d3e4f';

  test('publish rejects requests without a non-anonymous session', async () => {
    const authDb = createAuthMemoryDb();
    const fastify = Fastify();
    await fastify.register(rpgtoolsSharedAuth, baseOptions(authDb));
    await fastify.ready();

    const noSession = await fastify.inject({
      method: 'POST',
      url: '/api/auth/obr-handoff/publish',
      headers: jsonHeaders(),
      payload: { handoffId: HANDOFF_ID, token: 'tok' },
    });
    assert.equal(noSession.statusCode, 401, noSession.body);

    const anonymous = await signInAnonymous(fastify);
    const anonymousPublish = await fastify.inject({
      method: 'POST',
      url: '/api/auth/obr-handoff/publish',
      headers: jsonHeaders({ cookie: cookieHeaderFrom(anonymous.setCookies) }),
      payload: { handoffId: HANDOFF_ID, token: 'tok' },
    });
    assert.equal(anonymousPublish.statusCode, 401, anonymousPublish.body);

    await fastify.close();
  });

  test('publish rejects malformed handoff ids and tokens', async () => {
    const authDb = createAuthMemoryDb();
    const fastify = Fastify();
    await fastify.register(rpgtoolsSharedAuth, baseOptions(authDb));
    await fastify.ready();

    const popup = await signInAnonymous(fastify);
    markUserAuthenticated(authDb, popup.userId);
    const cookie = cookieHeaderFrom(popup.setCookies);

    const badId = await fastify.inject({
      method: 'POST',
      url: '/api/auth/obr-handoff/publish',
      headers: jsonHeaders({ cookie }),
      payload: { handoffId: 'not-a-uuid', token: 'tok' },
    });
    assert.equal(badId.statusCode, 400, badId.body);

    const emptyToken = await fastify.inject({
      method: 'POST',
      url: '/api/auth/obr-handoff/publish',
      headers: jsonHeaders({ cookie }),
      payload: { handoffId: HANDOFF_ID, token: '' },
    });
    assert.equal(emptyToken.statusCode, 400, emptyToken.body);

    const hugeToken = await fastify.inject({
      method: 'POST',
      url: '/api/auth/obr-handoff/publish',
      headers: jsonHeaders({ cookie }),
      payload: { handoffId: HANDOFF_ID, token: 'A'.repeat(4097) },
    });
    assert.equal(hugeToken.statusCode, 400, hugeToken.body);

    await fastify.close();
  });

  test('publish then take returns the token exactly once', async () => {
    const authDb = createAuthMemoryDb();
    const fastify = Fastify();
    await fastify.register(rpgtoolsSharedAuth, baseOptions(authDb));
    await fastify.ready();

    const popup = await signInAnonymous(fastify);
    markUserAuthenticated(authDb, popup.userId);

    const publish = await fastify.inject({
      method: 'POST',
      url: '/api/auth/obr-handoff/publish',
      headers: jsonHeaders({ cookie: cookieHeaderFrom(popup.setCookies) }),
      payload: { handoffId: HANDOFF_ID, token: 'one-time-exchange-token' },
    });
    assert.equal(publish.statusCode, 200, publish.body);
    // Stored hashed, never raw.
    const stored = authDb.verification.find((row: { identifier: string }) =>
      row.identifier.startsWith('obr-handoff:'),
    );
    assert.ok(stored, 'expected a hashed obr-handoff verification row');
    assert.ok(!stored.identifier.includes(HANDOFF_ID));

    // Take is unauthenticated (the iframe polls before it has a session).
    const take = await fastify.inject({
      method: 'POST',
      url: '/api/auth/obr-handoff/take',
      headers: jsonHeaders(),
      payload: { handoffId: HANDOFF_ID },
    });
    assert.equal(take.statusCode, 200, take.body);
    assert.deepEqual(take.json(), { token: 'one-time-exchange-token' });

    const takeAgain = await fastify.inject({
      method: 'POST',
      url: '/api/auth/obr-handoff/take',
      headers: jsonHeaders(),
      payload: { handoffId: HANDOFF_ID },
    });
    assert.equal(takeAgain.statusCode, 200, takeAgain.body);
    assert.deepEqual(takeAgain.json(), { token: null });

    await fastify.close();
  });

  test('take returns null for expired and unknown handoffs', async () => {
    const authDb = createAuthMemoryDb();
    const fastify = Fastify();
    await fastify.register(rpgtoolsSharedAuth, baseOptions(authDb));
    await fastify.ready();

    const unknown = await fastify.inject({
      method: 'POST',
      url: '/api/auth/obr-handoff/take',
      headers: jsonHeaders(),
      payload: { handoffId: HANDOFF_ID },
    });
    assert.deepEqual(unknown.json(), { token: null });

    const popup = await signInAnonymous(fastify);
    markUserAuthenticated(authDb, popup.userId);
    await fastify.inject({
      method: 'POST',
      url: '/api/auth/obr-handoff/publish',
      headers: jsonHeaders({ cookie: cookieHeaderFrom(popup.setCookies) }),
      payload: { handoffId: HANDOFF_ID, token: 'stale' },
    });
    const row = authDb.verification.find((r: { identifier: string }) =>
      r.identifier.startsWith('obr-handoff:'),
    );
    row.expiresAt = new Date(Date.now() - 1_000);

    const expired = await fastify.inject({
      method: 'POST',
      url: '/api/auth/obr-handoff/take',
      headers: jsonHeaders(),
      payload: { handoffId: HANDOFF_ID },
    });
    assert.deepEqual(expired.json(), { token: null });

    const badId = await fastify.inject({
      method: 'POST',
      url: '/api/auth/obr-handoff/take',
      headers: jsonHeaders(),
      payload: { handoffId: 'not-a-uuid' },
    });
    assert.equal(badId.statusCode, 400, badId.body);

    await fastify.close();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run (in `rpgtools-shared-auth`): `npm test`
Expected: the four new tests FAIL (404 route-not-found responses where 200/400/401 are asserted); all pre-existing tests PASS.

- [ ] **Step 3: Implement the endpoints**

In `src/services/obrExchange.ts`:

Add after `OBR_EXCHANGE_TOKEN_TTL_MS`:

```ts
export const OBR_HANDOFF_TTL_MS = 2 * 60 * 1000;
export const OBR_HANDOFF_MAX_TOKEN_LENGTH = 4096;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
```

Extend the options interface:

```ts
export interface ObrExchangeOptions {
  onLinkAccount?: (data: ObrExchangeLinkAccountData) => Promise<void> | void;
  ttlMs?: number;
  /** TTL for the popup→iframe handoff mailbox. Default 2 minutes. */
  handoffTtlMs?: number;
}
```

Inside `obrExchange(options)`, add `const handoffTtlMs = options.handoffTtlMs ?? OBR_HANDOFF_TTL_MS;` next to the existing `ttlMs` line, and add two endpoints to the `endpoints` object after `redeemObrExchangeToken`:

```ts
      // Popup→iframe mailbox. The authenticated popup publishes the one-time
      // exchange token under an unguessable UUID; the partitioned iframe polls
      // take. Rows live in the better-auth verification table (like exchange
      // tokens), so no extra storage is required.
      publishObrHandoffToken: createAuthEndpoint('/obr-handoff/publish', {
        method: 'POST',
        requireHeaders: true,
      }, async (ctx) => {
        const session = await getSessionFromCtx(ctx, { disableCookieCache: true });
        if (!session?.user || session.user.isAnonymous) {
          throw unauthorized();
        }

        const { handoffId, token } = readHandoffPublishBody(ctx.body);
        const identifier = handoffIdentifier(handoffId);
        // Upsert semantics: replace any previous token under this id.
        await ctx.context.internalAdapter.deleteVerificationByIdentifier(identifier);
        await ctx.context.internalAdapter.createVerificationValue({
          identifier,
          value: token,
          expiresAt: new Date(Date.now() + handoffTtlMs),
        });

        return ctx.json({ ok: true });
      }),

      takeObrHandoffToken: createAuthEndpoint('/obr-handoff/take', {
        method: 'POST',
        requireHeaders: true,
      }, async (ctx) => {
        const handoffId = readHandoffTakeBody(ctx.body);
        const identifier = handoffIdentifier(handoffId);
        const stored = await ctx.context.internalAdapter.findVerificationValue(identifier);
        if (!stored) {
          return ctx.json({ token: null });
        }

        // One-shot: consume the row before deciding, so an expired row is
        // cleaned up and a valid one can never be read twice.
        // ponytail: non-atomic find+delete — a double-take race can return the
        // token twice, but the exchange token it carries is itself one-shot at
        // redeem, so the race gains nothing.
        await ctx.context.internalAdapter.deleteVerificationByIdentifier(identifier);
        if (stored.expiresAt < new Date()) {
          return ctx.json({ token: null });
        }

        return ctx.json({ token: stored.value });
      }),
```

Add the private helpers next to `tokenIdentifier`:

```ts
function handoffIdentifier(handoffId: string): string {
  const digest = crypto.createHash('sha256').update(handoffId).digest('base64url');
  return `obr-handoff:${digest}`;
}

function readHandoffPublishBody(body: unknown): { handoffId: string; token: string } {
  const handoffId = readHandoffId(body);
  const token = (body as { token?: unknown }).token;
  if (
    typeof token !== 'string' ||
    token.length === 0 ||
    token.length > OBR_HANDOFF_MAX_TOKEN_LENGTH
  ) {
    throw badRequest('Invalid handoff token');
  }

  return { handoffId, token };
}

function readHandoffTakeBody(body: unknown): string {
  return readHandoffId(body);
}

function readHandoffId(body: unknown): string {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw badRequest('Missing handoff id');
  }

  const handoffId = (body as { handoffId?: unknown }).handoffId;
  if (typeof handoffId !== 'string' || !UUID_RE.test(handoffId)) {
    throw badRequest('Invalid handoff id');
  }

  return handoffId;
}
```

In `src/index.ts`, extend the existing obrExchange export lines:

```ts
export {
  OBR_EXCHANGE_TOKEN_TTL_MS,
  OBR_HANDOFF_TTL_MS,
  OBR_HANDOFF_MAX_TOKEN_LENGTH,
} from './services/obrExchange.ts';
```

(keep the existing `export type { ObrExchangeLinkAccountData, ObrExchangeOptions }` line as is).

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test`
Expected: all tests PASS, including the four new `obr-handoff` tests.

- [ ] **Step 5: Commit**

```bash
git add src/services/obrExchange.ts src/index.ts src/tests/plugin.test.ts
git commit -m "feat: obr-handoff mailbox endpoints in the obr-exchange plugin"
```

---

### Task 2: shared-auth — client `baseHeaders` option + OBR exchange/handoff methods

**Files:**
- Modify: `src/client/index.ts`
- Test: `src/tests/client.test.ts` (append a new `describe`; follow the file's existing mocked-fetch idioms — if they differ from the code below, adapt the mock construction, keep the assertions)

**Interfaces:**
- Consumes: Task 1's endpoints; existing `requestJson`, `RpgToolsAuthClientOptions`.
- Produces (on `RpgToolsAuthClient`): `issueObrExchangeToken(): Promise<string>`, `redeemObrExchangeToken(token: string): Promise<void>`, `publishObrHandoffToken(handoffId: string, token: string): Promise<void>`, `takeObrHandoffToken(handoffId: string): Promise<string | null>`. New option `RpgToolsAuthClientOptions.baseHeaders?: () => Record<string, string>` applied to **every** request including `/csrf-token` (the embedded-session marker must reach cookie-issuing routes). Task 3 and Task 7 rely on these exact names.

- [ ] **Step 1: Write the failing tests**

Append to `src/tests/client.test.ts`:

```ts
describe('createRpgToolsAuthClient obr exchange/handoff', () => {
  const HANDOFF_ID = '4f9c2d6e-1b3a-4c5d-8e7f-9a0b1c2d3e4f';

  function jsonResponse(body: unknown, status = 200): Response {
    return new Response(JSON.stringify(body), {
      status,
      headers: { 'content-type': 'application/json' },
    });
  }

  function captureFetch(response: Response) {
    const calls: { url: string; init: RequestInit }[] = [];
    const fetchImpl = (async (url: string | URL, init?: RequestInit) => {
      calls.push({ url: String(url), init: init ?? {} });
      return response;
    }) as typeof fetch;
    return { calls, fetchImpl };
  }

  test('issueObrExchangeToken posts without csrf and returns the token', async () => {
    const { calls, fetchImpl } = captureFetch(jsonResponse({ token: 'tok-123' }));
    const client = createRpgToolsAuthClient({ apiBase: '/api', fetch: fetchImpl });

    const token = await client.issueObrExchangeToken();

    assert.equal(token, 'tok-123');
    assert.equal(calls.length, 1); // no /csrf-token preflight
    assert.equal(calls[0].url, '/api/auth/obr-exchange/issue');
    assert.equal(calls[0].init.method, 'POST');
  });

  test('issueObrExchangeToken throws when the response has no token', async () => {
    const { fetchImpl } = captureFetch(jsonResponse({}));
    const client = createRpgToolsAuthClient({ apiBase: '/api', fetch: fetchImpl });

    await assert.rejects(() => client.issueObrExchangeToken());
  });

  test('publish and redeem send JSON bodies to the auth namespace', async () => {
    const { calls, fetchImpl } = captureFetch(jsonResponse({ ok: true }));
    const client = createRpgToolsAuthClient({ apiBase: '/api', fetch: fetchImpl });

    await client.publishObrHandoffToken(HANDOFF_ID, 'tok-123');
    await client.redeemObrExchangeToken('tok-123');

    assert.equal(calls[0].url, '/api/auth/obr-handoff/publish');
    assert.deepEqual(JSON.parse(String(calls[0].init.body)), {
      handoffId: HANDOFF_ID,
      token: 'tok-123',
    });
    assert.equal(calls[1].url, '/api/auth/obr-exchange/redeem');
    assert.deepEqual(JSON.parse(String(calls[1].init.body)), { token: 'tok-123' });
  });

  test('takeObrHandoffToken returns the token or null', async () => {
    const ready = captureFetch(jsonResponse({ token: 'tok-123' }));
    const readyClient = createRpgToolsAuthClient({ apiBase: '/api', fetch: ready.fetchImpl });
    assert.equal(await readyClient.takeObrHandoffToken(HANDOFF_ID), 'tok-123');
    assert.equal(ready.calls[0].url, '/api/auth/obr-handoff/take');

    const pending = captureFetch(jsonResponse({ token: null }));
    const pendingClient = createRpgToolsAuthClient({ apiBase: '/api', fetch: pending.fetchImpl });
    assert.equal(await pendingClient.takeObrHandoffToken(HANDOFF_ID), null);
  });

  test('baseHeaders are sent on every request', async () => {
    const { calls, fetchImpl } = captureFetch(jsonResponse({ token: 'tok-123' }));
    const client = createRpgToolsAuthClient({
      apiBase: '/api',
      fetch: fetchImpl,
      baseHeaders: () => ({ 'x-embedded-session': '1' }),
    });

    await client.issueObrExchangeToken();

    const headers = new Headers(calls[0].init.headers);
    assert.equal(headers.get('x-embedded-session'), '1');
  });
});
```

Add any missing imports at the top of the file (`describe`, `test`, `assert`, `createRpgToolsAuthClient`) matching the file's existing import style.

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`
Expected: new tests FAIL with `client.issueObrExchangeToken is not a function`.

- [ ] **Step 3: Implement**

In `src/client/index.ts`:

Extend the options interface:

```ts
export interface RpgToolsAuthClientOptions {
  apiBase?: string;
  fetch?: typeof fetch;
  /**
   * Headers added to every request (including /csrf-token). Use for the
   * embedded-session marker inside partitioned iframes; request-specific
   * headers win on conflict.
   */
  baseHeaders?: () => Record<string, string>;
}
```

In `requestJson`, replace `const headers = new Headers(requestOptions.headers);` with:

```ts
    const headers = new Headers(options.baseHeaders?.());
    new Headers(requestOptions.headers).forEach((value, key) => headers.set(key, value));
```

In `getCsrfToken`, replace `headers: { accept: 'application/json' },` with:

```ts
      headers: { ...options.baseHeaders?.(), accept: 'application/json' },
```

Add to the returned client object (before `buildUrl: url,`):

```ts
    issueObrExchangeToken: async (): Promise<string> => {
      const body = await requestJson<{ token?: string }>('/auth/obr-exchange/issue', {
        method: 'POST',
        csrf: false,
      });
      if (!body?.token) {
        throw new Error('OBR exchange issue returned no token');
      }
      return body.token;
    },
    redeemObrExchangeToken: (token: string) =>
      requestJson<void>('/auth/obr-exchange/redeem', {
        method: 'POST',
        json: { token },
        csrf: false,
      }),
    publishObrHandoffToken: (handoffId: string, token: string) =>
      requestJson<void>('/auth/obr-handoff/publish', {
        method: 'POST',
        json: { handoffId, token },
        csrf: false,
      }),
    takeObrHandoffToken: async (handoffId: string): Promise<string | null> => {
      const body = await requestJson<{ token?: string | null }>('/auth/obr-handoff/take', {
        method: 'POST',
        json: { handoffId },
        csrf: false,
      });
      return body?.token || null;
    },
```

(`csrf: false` because `/api/auth/*` is CSRF-exempt — skipping the `/csrf-token` preflight matters in the popup, which closes itself milliseconds later.)

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test`
Expected: all PASS.

- [ ] **Step 5: Commit**

```bash
git add src/client/index.ts src/tests/client.test.ts
git commit -m "feat: obr exchange/handoff client methods and baseHeaders option"
```

---

### Task 3: shared-auth — popup orchestration module (`/client`)

**Files:**
- Create: `src/client/obrPopup.ts`
- Modify: `src/client/index.ts` (add `export * from './obrPopup.ts';` at the top, next to the existing `export * from './types.ts';`)
- Test: `src/tests/obrPopup.test.ts`

**Interfaces:**
- Consumes: Task 2's client methods (`issueObrExchangeToken`, `redeemObrExchangeToken`, `publishObrHandoffToken`, `takeObrHandoffToken`), `RpgToolsAuthClient` type, `client.getLoginUrl(returnTo)`.
- Produces (all exported from `@tackgnol/rpgtools-shared-auth/client`): constants `OBR_AUTH_DONE_PATH`, `OBR_EXCHANGE_CHANNEL`, `OBR_EXCHANGE_MESSAGE_TYPE`; type `ObrExchangeMessage`; functions `isObrExchangeMessage(data: unknown): data is ObrExchangeMessage`, `createObrAuthHandoffId(): string`, `obrAuthReturnTo(openerOrigin: string, handoffId: string, path?: string): string`, `waitForObrExchangeToken(client: RpgToolsAuthClient, popup: { closed: boolean }, handoffId: string, options?: WaitForObrExchangeTokenOptions): Promise<string>`, `signInViaObrPopup(client: RpgToolsAuthClient, options?: ObrPopupSignInOptions): Promise<void>`, `completeObrAuthHandoff(client: RpgToolsAuthClient, options?: { search?: string }): Promise<boolean>`. Task 7 (scvmrack frontend) consumes these exact names.

- [ ] **Step 1: Write the failing tests**

Create `src/tests/obrPopup.test.ts`. Mirror the first import line of `src/tests/react.test.tsx` to register happy-dom (it imports `./setupDom.ts`), then:

```ts
import './setupDom.ts';
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import {
  createObrAuthHandoffId,
  isObrExchangeMessage,
  obrAuthReturnTo,
  waitForObrExchangeToken,
  completeObrAuthHandoff,
  OBR_EXCHANGE_MESSAGE_TYPE,
} from '../client/obrPopup.ts';
import type { RpgToolsAuthClient } from '../client/index.ts';

function clientStub(overrides: Partial<RpgToolsAuthClient>): RpgToolsAuthClient {
  return overrides as RpgToolsAuthClient;
}

describe('obr popup helpers', () => {
  test('createObrAuthHandoffId returns a v4 uuid', () => {
    assert.match(
      createObrAuthHandoffId(),
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
  });

  test('obrAuthReturnTo builds the callback path with params', () => {
    const returnTo = obrAuthReturnTo('https://app.example', 'abc-123');
    assert.equal(
      returnTo,
      '/obr-auth-done?openerOrigin=https%3A%2F%2Fapp.example&handoffId=abc-123',
    );
  });

  test('isObrExchangeMessage accepts only well-formed messages', () => {
    assert.equal(
      isObrExchangeMessage({ type: OBR_EXCHANGE_MESSAGE_TYPE, token: 't' }),
      true,
    );
    assert.equal(isObrExchangeMessage({ type: 'other', token: 't' }), false);
    assert.equal(isObrExchangeMessage({ type: OBR_EXCHANGE_MESSAGE_TYPE, token: '' }), false);
    assert.equal(isObrExchangeMessage(null), false);
  });

  test('waitForObrExchangeToken resolves via the backend handoff poll', async () => {
    let polls = 0;
    const client = clientStub({
      takeObrHandoffToken: async () => (++polls >= 2 ? 'tok-123' : null),
    });

    const token = await waitForObrExchangeToken(
      client,
      { closed: false },
      'abc-123',
      { pollIntervalMs: 5, timeoutMs: 1_000 },
    );

    assert.equal(token, 'tok-123');
    assert.ok(polls >= 2);
  });

  test('waitForObrExchangeToken rejects after the popup closes', async () => {
    const client = clientStub({ takeObrHandoffToken: async () => null });

    await assert.rejects(
      waitForObrExchangeToken(
        client,
        { closed: true },
        'abc-123',
        { pollIntervalMs: 5, timeoutMs: 1_000, popupClosedGraceMs: 10 },
      ),
      /popup-closed/,
    );
  });

  test('completeObrAuthHandoff issues and publishes when a handoffId is present', async () => {
    const published: [string, string][] = [];
    const client = clientStub({
      issueObrExchangeToken: async () => 'tok-123',
      publishObrHandoffToken: async (handoffId: string, token: string) => {
        published.push([handoffId, token]);
      },
    });

    const handedOff = await completeObrAuthHandoff(client, {
      search: '?handoffId=abc-123&openerOrigin=https%3A%2F%2Fapp.example',
    });

    assert.equal(handedOff, true);
    assert.deepEqual(published, [['abc-123', 'tok-123']]);
  });

  test('completeObrAuthHandoff reports failure when issuing fails', async () => {
    const client = clientStub({
      issueObrExchangeToken: async () => {
        throw new Error('nope');
      },
    });

    const handedOff = await completeObrAuthHandoff(client, {
      search: '?handoffId=abc-123',
    });

    assert.equal(handedOff, false);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL — `Cannot find module '../client/obrPopup.ts'`.

- [ ] **Step 3: Implement `src/client/obrPopup.ts`**

Port of scvmrack's `frontend/src/obr/useObrSession.ts` (waitFor) + `frontend/src/pages/ObrAuthDonePage.tsx` (complete) + `frontend/src/auth/index.ts` (ids/paths), parameterized on the client:

```ts
// Owlbear Rodeo popup sign-in bridge. Top-level login redirects can't run in a
// framed context (Logto refuses to be framed), so the embedded panel opens a
// popup; the popup (first-party, authenticated) mints a one-time exchange
// token and hands it back; the iframe redeems it to adopt that identity into
// its partitioned cookie jar.
import type { RpgToolsAuthClient } from './index.ts';

export const OBR_AUTH_DONE_PATH = '/obr-auth-done';
export const OBR_EXCHANGE_CHANNEL = 'rpgtools-obr-auth';
export const OBR_EXCHANGE_MESSAGE_TYPE = 'obr-exchange-token';

const DEFAULT_POLL_INTERVAL_MS = 500;
const DEFAULT_TIMEOUT_MS = 60_000;
const DEFAULT_POPUP_CLOSED_GRACE_MS = 5_000;

export interface ObrExchangeMessage {
  type: typeof OBR_EXCHANGE_MESSAGE_TYPE;
  token: string;
}

export function isObrExchangeMessage(data: unknown): data is ObrExchangeMessage {
  return (
    typeof data === 'object' &&
    data !== null &&
    'type' in data &&
    'token' in data &&
    (data as { type: unknown }).type === OBR_EXCHANGE_MESSAGE_TYPE &&
    typeof (data as { token: unknown }).token === 'string' &&
    (data as { token: string }).token.length > 0
  );
}

export function createObrAuthHandoffId(): string {
  if (typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0'));
  return [
    hex.slice(0, 4).join(''),
    hex.slice(4, 6).join(''),
    hex.slice(6, 8).join(''),
    hex.slice(8, 10).join(''),
    hex.slice(10, 16).join(''),
  ].join('-');
}

export function obrAuthReturnTo(
  openerOrigin: string,
  handoffId: string,
  path: string = OBR_AUTH_DONE_PATH,
): string {
  const params = new URLSearchParams({ openerOrigin, handoffId });
  return `${path}?${params.toString()}`;
}

export interface WaitForObrExchangeTokenOptions {
  pollIntervalMs?: number;
  timeoutMs?: number;
  popupClosedGraceMs?: number;
}

/**
 * Waits (in the iframe) for the popup to hand back a one-time exchange token.
 * The popup normally posts to its opener; OAuth redirects can sever opener and
 * third-party partitioning can isolate BroadcastChannel, so the backend
 * handoff poll is the authoritative path.
 */
export function waitForObrExchangeToken(
  client: RpgToolsAuthClient,
  popup: { closed: boolean },
  handoffId: string,
  options: WaitForObrExchangeTokenOptions = {},
): Promise<string> {
  const pollIntervalMs = options.pollIntervalMs ?? DEFAULT_POLL_INTERVAL_MS;
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const popupClosedGraceMs = options.popupClosedGraceMs ?? DEFAULT_POPUP_CLOSED_GRACE_MS;

  return new Promise((resolve, reject) => {
    const expectedOrigin = window.location.origin;
    const channel = createExchangeChannel();
    const startedAt = Date.now();
    let popupClosedAt: number | null = null;
    let pollInFlight = false;
    let settled = false;
    const timer = window.setInterval(checkHandoff, pollIntervalMs);
    void checkHandoff();

    function onMessage(event: MessageEvent) {
      if (event.origin !== expectedOrigin) return;
      acceptToken(event.data);
    }

    function onChannelMessage(event: MessageEvent) {
      acceptToken(event.data);
    }

    function acceptToken(data: unknown) {
      if (settled) return;
      if (!isObrExchangeMessage(data)) return;
      cleanup();
      resolve(data.token);
    }

    async function checkHandoff() {
      if (settled) return;
      if (pollInFlight) return;
      pollInFlight = true;

      if (popup.closed && !popupClosedAt) {
        popupClosedAt = Date.now();
      }

      try {
        const token = await client.takeObrHandoffToken(handoffId);
        if (token) {
          cleanup();
          resolve(token);
          return;
        }
      } catch (error) {
        cleanup();
        reject(error instanceof Error ? error : new Error('handoff-failed'));
        return;
      } finally {
        pollInFlight = false;
      }

      const now = Date.now();
      if (now - startedAt > timeoutMs) {
        cleanup();
        reject(new Error('handoff-timeout'));
        return;
      }

      if (popupClosedAt && now - popupClosedAt > popupClosedGraceMs) {
        cleanup();
        reject(new Error('popup-closed'));
      }
    }

    function cleanup() {
      if (settled) return;
      settled = true;
      window.clearInterval(timer);
      window.removeEventListener('message', onMessage);
      if (channel) {
        channel.removeEventListener('message', onChannelMessage);
        channel.close();
      }
    }

    window.addEventListener('message', onMessage);
    if (channel) {
      channel.addEventListener('message', onChannelMessage);
    }
  });
}

export interface ObrPopupSignInOptions extends WaitForObrExchangeTokenOptions {
  windowName?: string;
  windowFeatures?: string;
  authDonePath?: string;
}

/**
 * Full iframe-side sign-in flow: open the login popup, wait for the exchange
 * token, redeem it into this partition. Throws Error('popup-blocked') when the
 * popup cannot open. Redeem LINKS an anonymous session to the account (fires
 * shared-auth onLinkAccount), so work done while anonymous carries over.
 */
export async function signInViaObrPopup(
  client: RpgToolsAuthClient,
  options: ObrPopupSignInOptions = {},
): Promise<void> {
  const handoffId = createObrAuthHandoffId();
  const returnTo = obrAuthReturnTo(
    window.location.origin,
    handoffId,
    options.authDonePath ?? OBR_AUTH_DONE_PATH,
  );
  const popup = window.open(
    client.getLoginUrl(returnTo),
    options.windowName ?? 'rpgtools-obr-login',
    options.windowFeatures ?? 'width=480,height=720',
  );
  if (!popup) {
    throw new Error('popup-blocked');
  }

  const token = await waitForObrExchangeToken(client, popup, handoffId, options);
  await client.redeemObrExchangeToken(token);
}

/**
 * Popup-side completion (the /obr-auth-done page). Running here means we are
 * first-party and authenticated: mint a one-time exchange token and hand it to
 * the opener iframe — backend handoff when a handoffId is present (the
 * authoritative path), else postMessage/BroadcastChannel best-effort.
 * Returns true when the token was handed off; the caller closes the window.
 */
export async function completeObrAuthHandoff(
  client: RpgToolsAuthClient,
  options: { search?: string } = {},
): Promise<boolean> {
  const search = options.search ?? window.location.search;
  const params = new URLSearchParams(search);
  const handoffId = params.get('handoffId');

  let token: string;
  try {
    token = await client.issueObrExchangeToken();
  } catch {
    return false;
  }

  const message: ObrExchangeMessage = { type: OBR_EXCHANGE_MESSAGE_TYPE, token };
  if (handoffId) {
    try {
      await client.publishObrHandoffToken(handoffId, token);
      return true;
    } catch {
      return false;
    }
  }

  const postedToOpener = postExchangeToOpener(message, params.get('openerOrigin'));
  const postedToChannel = postExchangeChannel(message);
  return postedToOpener || postedToChannel;
}

function createExchangeChannel(): BroadcastChannel | null {
  if (typeof BroadcastChannel === 'undefined') return null;
  return new BroadcastChannel(OBR_EXCHANGE_CHANNEL);
}

function postExchangeChannel(message: ObrExchangeMessage): boolean {
  const channel = createExchangeChannel();
  if (!channel) return false;

  channel.postMessage(message);
  channel.close();
  return true;
}

function postExchangeToOpener(message: ObrExchangeMessage, requestedOrigin: string | null): boolean {
  const opener = window.opener as Window | null;
  if (!opener || opener.closed) return false;

  opener.postMessage(message, getOpenerTargetOrigin(requestedOrigin));
  return true;
}

function getOpenerTargetOrigin(requested: string | null): string {
  const fallback = window.location.origin;
  if (!requested) return fallback;

  return isTrustedHandoffOrigin(requested) ? new URL(requested).origin : fallback;
}

function isTrustedHandoffOrigin(origin: string): boolean {
  try {
    const current = new URL(window.location.origin);
    const target = new URL(origin);

    if (target.origin === current.origin) return true;

    return (
      isLoopbackHost(current.hostname) &&
      isLoopbackHost(target.hostname) &&
      target.protocol === current.protocol &&
      target.port === current.port
    );
  } catch {
    return false;
  }
}

function isLoopbackHost(hostname: string): boolean {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]';
}
```

Then in `src/client/index.ts` add near the existing re-exports at the top:

```ts
export * from './obrPopup.ts';
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test`
Expected: all PASS. If happy-dom lacks `BroadcastChannel`, the `createExchangeChannel` guard returns null and the poll-path tests still pass — do not polyfill.

- [ ] **Step 5: Commit**

```bash
git add src/client/obrPopup.ts src/client/index.ts src/tests/obrPopup.test.ts
git commit -m "feat: obr popup sign-in orchestration in the client export"
```

---

### Task 4: shared-auth — release 1.6.0

**Files:**
- Modify: `package.json` (version `1.5.0` → `1.6.0`)
- Modify: `README.md` (document the new endpoints, client methods, and popup flow)

**Interfaces:**
- Produces: published `@tackgnol/rpgtools-shared-auth@1.6.0` on GitHub Packages. Tasks 5–7 depend on it.

- [ ] **Step 1: Bump the version**

In `package.json` set `"version": "1.6.0"`.

- [ ] **Step 2: Document in README.md**

Add a section (place it next to the existing obr-exchange documentation; adjust heading level to match the file):

```markdown
### OBR popup sign-in (obr-exchange + obr-handoff)

Embedded Owlbear Rodeo panels run in a partitioned iframe where top-level
login redirects can't run. The full flow ships in this package:

- **Server** (automatic with the plugin): `POST /api/auth/obr-exchange/issue`
  (popup mints a one-time token; non-anonymous session required),
  `POST /api/auth/obr-handoff/publish` (popup drops the token under an
  unguessable UUID; non-anonymous session required),
  `POST /api/auth/obr-handoff/take` (iframe one-shot poll; unauthenticated),
  `POST /api/auth/obr-exchange/redeem` (iframe adopts the identity).
  Handoff rows live in the better-auth verification table (2-minute TTL,
  configurable via `obrExchange({ handoffTtlMs })`) — no extra schema.

- **Client** (`@tackgnol/rpgtools-shared-auth/client`):

  ```ts
  const client = createRpgToolsAuthClient({
    apiBase: `${backendUrl}/api`,
    baseHeaders: () => embeddedSessionHeaders(), // partitioned-iframe marker
  });

  // Iframe side (throws Error('popup-blocked') when the popup can't open):
  await signInViaObrPopup(client);

  // Popup side — your /obr-auth-done route:
  const handedOff = await completeObrAuthHandoff(client);
  if (handedOff) window.close();
  ```

  The app owns the `/obr-auth-done` route (`OBR_AUTH_DONE_PATH`); override the
  path via `signInViaObrPopup(client, { authDonePath })`.
```

- [ ] **Step 3: Full check and publish**

```bash
npm test && npm run build
npm publish
```

Expected: tests pass, `dist/` builds, publish succeeds to `https://npm.pkg.github.com/`. If the repo's release flow is CI-driven (check `.woodpecker/` or `.github/workflows/` for a publish pipeline), push a version tag instead of publishing locally, and wait for CI.

- [ ] **Step 4: Commit and tag**

```bash
git add package.json README.md
git commit -m "chore: release 1.6.0 (obr handoff + popup sign-in)"
git tag v1.6.0
git push && git push --tags
```

---

### Task 5: scvmrack backend — consume 1.6.0, delete the local handoff stack

**Files (repo: scvmrack):**
- Modify: `backend/package.json` (`@tackgnol/rpgtools-shared-auth` → `^1.6.0`)
- Delete: `backend/src/routes/obr-auth-handoff.ts`
- Delete: `backend/src/services/obr-auth-handoff-service.ts`
- Delete: `backend/src/repositories/obr-auth-handoff-repository.ts`
- Delete: `backend/src/schemas/obr-auth-handoff.ts`

**Interfaces:**
- Consumes: `@tackgnol/rpgtools-shared-auth@1.6.0` — the handoff endpoints register automatically via the existing `rpgtools-auth.ts` plugin; no registration change needed.
- Produces: a backend whose only handoff surface is the shared-auth one. Task 7's frontend calls hit these endpoints.

- [ ] **Step 1: Upgrade the dependency**

```bash
cd backend && npm install @tackgnol/rpgtools-shared-auth@^1.6.0
```

- [ ] **Step 2: Delete the four files**

```bash
git rm backend/src/routes/obr-auth-handoff.ts backend/src/services/obr-auth-handoff-service.ts backend/src/repositories/obr-auth-handoff-repository.ts backend/src/schemas/obr-auth-handoff.ts
```

- [ ] **Step 3: Verify nothing references the deleted modules**

Run: `grep -rn "obr-auth-handoff" backend/src backend/test`
Expected: no matches. If a test file references the deleted service, delete that test file too (its behavior is now covered by shared-auth's own suite).

- [ ] **Step 4: Build and test**

```bash
cd backend && npm run build:ts && npm test
```

Expected: compiles, unit tests PASS.

- [ ] **Step 5: Commit**

```bash
git add -A backend
git commit -m "refactor: consume shared-auth 1.6.0 obr handoff, drop local handoff stack"
```

---

### Task 6: scvmrack — drop the `ObrAuthHandoff` Prisma model

**Files (repo: scvmrack):**
- Modify: `backend/prisma/schema.prisma` (remove the `ObrAuthHandoff` model, lines ~106–114)
- Create: `backend/prisma/migrations/<timestamp>_drop_obr_auth_handoff/migration.sql`

**Interfaces:**
- Consumes: Task 5 (no code touches `prisma.obrAuthHandoff` anymore).
- Produces: schema without the mailbox table. Handoff rows are 2-minute-TTL ephemera, so dropping alongside the same release is safe.

- [ ] **Step 1: Remove the model**

Delete from `backend/prisma/schema.prisma`:

```prisma
model ObrAuthHandoff {
  id        String   @id @db.Uuid
  token     String
  expiresAt DateTime @map("expires_at")
  createdAt DateTime @default(now()) @map("created_at")

  @@index([expiresAt])
  @@map("obr_auth_handoffs")
}
```

- [ ] **Step 2: Create the migration**

With the dev database running (see `compose.dev.yaml`):

```bash
cd backend && npx prisma migrate dev --name drop_obr_auth_handoff
```

Expected: a new migration containing `DROP TABLE "obr_auth_handoffs";` and a regenerated client. If the dev DB isn't available, write the migration by hand following the shape of `backend/prisma/migrations/20260701120000_drop_character_obr_room/migration.sql` and run `npx prisma generate`.

- [ ] **Step 3: Build and test**

```bash
cd backend && npm run build:ts && npm test
```

Expected: PASS (Task 5 already removed every `prisma.obrAuthHandoff` call; a compile error here means a reference survived — fix by deleting it).

- [ ] **Step 4: Commit**

```bash
git add backend/prisma
git commit -m "refactor: drop ObrAuthHandoff table (mailbox now lives in shared-auth verification store)"
```

---

### Task 7: scvmrack frontend — consume the shared-auth client

**Files (repo: scvmrack):**
- Modify: `frontend/package.json` (add `"@tackgnol/rpgtools-shared-auth": "^1.6.0"` to `dependencies` — the repo-root `.npmrc` already routes the `@tackgnol` scope to GitHub Packages)
- Create: `frontend/src/auth/obrAuthClient.ts`
- Modify: `frontend/src/auth/index.ts` (remove moved code)
- Modify: `frontend/src/obr/useObrSession.ts` (rewrite)
- Modify: `frontend/src/pages/ObrAuthDonePage.tsx` (rewrite)
- Modify: `frontend/src/router/index.tsx` (re-point the `OBR_AUTH_DONE_PATH` import)
- Test: `frontend/test/unit/auth/index.test.ts` (remove tests for moved helpers)
- Test: `frontend/test/browser/ObrCharacterRoute.test.tsx`, `frontend/test/browser/ObrEnemies.test.tsx` (fix handoff URL stubs)

**Interfaces:**
- Consumes (from `@tackgnol/rpgtools-shared-auth/client`): `createRpgToolsAuthClient`, `signInViaObrPopup`, `completeObrAuthHandoff`, `OBR_AUTH_DONE_PATH`.
- Produces: `obrAuthClient` (app-configured `RpgToolsAuthClient` singleton in `frontend/src/auth/obrAuthClient.ts`); `useObrSession` keeps its existing return shape (`{ ...auth, signIn }`) so no OBR component changes.

- [ ] **Step 1: Add the dependency**

```bash
cd frontend && npm install @tackgnol/rpgtools-shared-auth@^1.6.0
```

- [ ] **Step 2: Create the app-configured client**

Create `frontend/src/auth/obrAuthClient.ts`:

```ts
import { createRpgToolsAuthClient } from '@tackgnol/rpgtools-shared-auth/client';
import { embeddedSessionHeaders } from '@/utils/embed';

// One instance serves both browsing contexts: embeddedSessionHeaders() is
// context-aware (marker inside the partitioned OBR iframe, {} in the
// first-party popup), so the right cookies are issued on both sides.
export const obrAuthClient = createRpgToolsAuthClient({
  apiBase: `${import.meta.env.VITE_BACKEND_URL || ''}/api`,
  baseHeaders: embeddedSessionHeaders,
});
```

- [ ] **Step 3: Prune `frontend/src/auth/index.ts`**

Delete these exports (they now live in shared-auth): `OBR_AUTH_DONE_PATH`, `OBR_EXCHANGE_CHANNEL`, `OBR_EXCHANGE_MESSAGE_TYPE`, `ObrExchangeMessage`, `createObrAuthHandoffId`, `obrAuthReturnTo`, `issueObrExchangeToken`, `publishObrExchangeHandoffToken`, `takeObrExchangeHandoffToken`, `redeemObrExchangeToken`. Keep everything else (`fetchSession`, `signInAnonymous`, `ensureAnonymousSession`, `signOut`, `loginUrl`, `profileUrl`, the `AuthSession*` types) untouched — migrating general auth to the shared client is out of scope.

- [ ] **Step 4: Rewrite `frontend/src/obr/useObrSession.ts`**

Replace the whole file with:

```ts
import { authKeys } from '@/api';
import { obrAuthClient } from '@/auth/obrAuthClient';
import { useAuth } from '@/hooks/useAuth';
import { signInViaObrPopup } from '@tackgnol/rpgtools-shared-auth/client';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

// Session for the Owlbear Rodeo panel. `useAuth` already bootstraps an
// anonymous session and reports auth state; the popup handoff dance lives in
// shared-auth (signInViaObrPopup). Throws Error('popup-blocked') when the
// popup can't open — callers surface a click-to-open fallback.
export function useObrSession() {
    const auth = useAuth();
    const queryClient = useQueryClient();

    const signIn = useCallback(async (): Promise<void> => {
        await signInViaObrPopup(obrAuthClient, { windowName: 'scvmrack-obr-login' });
        await queryClient.invalidateQueries({ queryKey: authKeys.session() });
    }, [queryClient]);

    return { ...auth, signIn };
}
```

- [ ] **Step 5: Rewrite `frontend/src/pages/ObrAuthDonePage.tsx`**

Replace the whole file with (keep the existing `ObrAuthDonePage.styles` import and copy):

```tsx
import { obrAuthClient } from '@/auth/obrAuthClient';
import { completeObrAuthHandoff } from '@tackgnol/rpgtools-shared-auth/client';
import { useEffect, useState } from 'react';
import { Message, Wrapper } from './ObrAuthDonePage.styles';

// Popup callback after Logto sign-in. Running here means we are first-party
// and authenticated; shared-auth mints the one-time exchange token and hands
// it to the opener iframe (backend handoff, with postMessage/BroadcastChannel
// fallbacks), then we close.
export function ObrAuthDonePage() {
    const [failed, setFailed] = useState(false);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            const handedOff = await completeObrAuthHandoff(obrAuthClient);
            if (handedOff) {
                window.setTimeout(() => window.close(), 50);
                return;
            }
            if (!cancelled) setFailed(true);
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    return (
        <Wrapper>
            <Message>
                {failed
                    ? 'Sign-in could not be handed back. You can close this window and try again.'
                    : 'Finishing sign-in…'}
            </Message>
        </Wrapper>
    );
}
```

- [ ] **Step 6: Re-point remaining imports**

In `frontend/src/router/index.tsx`, change the `OBR_AUTH_DONE_PATH` import from `'@/auth'` to `'@tackgnol/rpgtools-shared-auth/client'`. Then sweep for stragglers:

Run: `grep -rn "issueObrExchangeToken\|publishObrExchangeHandoffToken\|takeObrExchangeHandoffToken\|redeemObrExchangeToken\|createObrAuthHandoffId\|obrAuthReturnTo\|OBR_EXCHANGE_" frontend/src`
Expected: no matches outside `node_modules`. Fix any hit by importing from `@tackgnol/rpgtools-shared-auth/client` or deleting dead code.

- [ ] **Step 7: Update tests**

In `frontend/test/unit/auth/index.test.ts`: delete the tests for the moved helpers — "builds the OBR auth callback return path…", "creates OBR auth handoff ids", "issues OBR exchange tokens…", "throws when OBR exchange issue fails", "publishes OBR exchange tokens…", "returns null when an OBR exchange handoff is not ready", "takes OBR exchange tokens…", "redeems OBR exchange tokens…". Keep the session/sign-out/URL tests.

In the two browser tests, update any fetch stubs for the old handoff endpoints; the mapping is mechanical:
- `PUT /api/auth/obr-handoff/:handoffId` → `POST /api/auth/obr-handoff/publish` (body `{ handoffId, token }`)
- `GET /api/auth/obr-handoff/:handoffId` → `POST /api/auth/obr-handoff/take` (body `{ handoffId }`, response `{ token: string | null }`)

`/api/auth/obr-exchange/*` stubs are unchanged.

- [ ] **Step 8: Run the frontend validation checklist**

```bash
cd frontend && npx tsc --noEmit && npm run lint && npm run test:unit && npm run test:browser && npm run doctor
```

Expected: all green.

- [ ] **Step 9: Commit**

```bash
git add frontend
git commit -m "refactor: obr popup sign-in via shared-auth client"
```

---

### Task 8: scvmrack — release 0.5.5 and end-to-end verification

**Files (repo: scvmrack):**
- Modify: `backend/package.json`, `frontend/package.json` (version → `0.5.5`)
- Create: `release/0.5.5.md`
- Modify: `release/README.md` (newest-first row)
- Modify: `frontend/src/pages/ReleasePage.tsx`, `frontend/src/i18n/en.json`, `frontend/src/i18n/pl.json` (`release.v055.*` keys, en + pl in sync)

**Interfaces:**
- Consumes: Tasks 5–7 complete.
- Produces: tagged `v0.5.5` following the CLAUDE.md release checklist.

- [ ] **Step 1: Full test sweep**

```bash
cd backend && npm run test:all
```

Expected: unit, integration, and e2e suites PASS (this reproduces CI). If integration/e2e need the dev compose stack, start it per `compose.integration-be-local.yaml` first.

- [ ] **Step 2: Manual smoke of the popup flow**

Start the dev stack (`compose.dev.yaml` / `cd frontend && npm run dev` + backend `npm run dev`). In a browser: open the app, then simulate the popup side by visiting `/obr-auth-done?handoffId=<any-uuid>` while signed in with a Logto account — the page should display "Finishing sign-in…" and close itself (token published). Verify via devtools that `POST /api/auth/obr-handoff/publish` returned 200. Then confirm `POST /api/auth/obr-handoff/take` with the same `handoffId` (e.g. via the browser console `fetch`) returns the token once and `{ token: null }` the second time. Full in-Owlbear verification happens on staging after deploy.

- [ ] **Step 3: Release chores**

Set `"version": "0.5.5"` in both `backend/package.json` and `frontend/package.json`. Write `release/0.5.5.md`:

```markdown
# 0.5.5 — Steadier Owlbear sign-in

The popup sign-in used by the Owlbear Rodeo panel now runs on the shared
RPGTools auth stack. Nothing changes in how you sign in — the plumbing under
it is now the same audited flow across all RPGTools apps, and a leftover
internal table was removed.
```

Add the newest-first row to `release/README.md`, add the matching card to `frontend/src/pages/ReleasePage.tsx` using `release.v055.*` keys, and add those keys to **both** `frontend/src/i18n/en.json` and `frontend/src/i18n/pl.json`.

- [ ] **Step 4: Validate, commit, tag**

```bash
cd frontend && npx tsc --noEmit && npm run lint
git add -A
git commit -m "chore: release 0.5.5"
git tag v0.5.5
```

---

## Out of scope (Plan 2)

The `rpgtools-owlbear` package itself: framework-free core (bindings, roster, cards, context menu, stale detection, enemies mechanism), `/react-query` and `/rr7` outlets (isomorphic reads, home-agnostic writes, per-request `ObrApiClient`), `/server` Fastify plugin with adapter callbacks and pasted Prisma models, mechanism-test moves, and scvmrack's migration onto it. Written after this plan ships.
