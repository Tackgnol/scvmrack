# OBR Review Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix every finding from the 2026-07-01 three-axis OBR review (spec regressions, standards violations, architecture cleanups) plus the two missing spec features (party↔room attach/detach, GM binding-management UI), under the agreed **hybrid trust model**.

**Architecture:** Backend keeps Repository → Service → Controller with `ServiceResult`. The hybrid trust model: OBR room id is a capability for the *enemy board, bindings listing and roster view*; the party **invite token and manage view are owner-only**; a signed-in GM can claim a system-owned room party. Frontend consolidates OBR logic in `frontend/src/obr/` as the single adapter module.

**Tech Stack:** Fastify 5 + Prisma + node:test (backend), React 18 + TanStack Query + vitest (frontend).

## Global Constraints

- Commit messages: conventional commits, **no co-author trailer, no "Generated with Claude Code" footer** (user rule).
- Backend layering: Prisma only in `src/repositories/`; services return `ServiceResult<T>`; routes thin, errors via `sendServiceError` (CLAUDE.md).
- JSON schemas live in `backend/src/schemas/` (CLAUDE.md).
- `frontend/src/i18n/en.json` and `pl.json` must stay key-synced (CLAUDE.md).
- Frontend components: atomic-design extraction — new UI pieces get their own files, not co-located inner components (user rule).
- Backend invariants live in the service layer, never re-implemented per frontend path (user rule).
- Run per-task: `cd backend && npm run test:unit` (backend tasks), `cd frontend && npx tsc --noEmit && npm run lint` (frontend tasks).

## Decisions locked with the user (2026-07-01)

1. **Hybrid trust model**: room-trust stays for enemy CRUD (anonymous OBR GMs keep working); `manageView`/`inviteToken` become owner-only; `promoteRoom` returns a token-less view to non-owners; signed-in GM can claim a `system:obr-room`-owned party.
2. **Bindings listing** (`GET /api/obr/rooms/:roomId/bindings`) stays session-less; it is documented as part of the same accepted room-trust residual (room ids are unguessable UUIDs shared only with the table).
3. **Scope**: everything, including portability-doc D2 attach/detach endpoints and room-bindings-plan Task 5 GM management UI. Staleness is computed **client-side** (backend cannot know OBR connectivity); the plan's "stale flags in bindings response" requirement is satisfied on the frontend — record this deviation in the docs task.

---

### Task 1: Shared backend session helpers (`services/session.ts`)

Kills the 5× duplicated `AppSession` type and its helper functions.

**Files:**
- Create: `backend/src/services/session.ts`
- Modify: `backend/src/services/party-service.ts` (delete lines 25-92 helpers, import instead)
- Modify: `backend/src/services/obr-room-character-access.ts` (delete lines 10-43, import instead)
- Modify: `backend/src/services/enemy-service.ts` (delete `AppSession` at lines 18-21 — fully removed by Task 3, here just re-point the export)
- Modify: `backend/src/services/character-service.ts` (delete local `AppSession`/`sessionUserId`/`sessionId`/`ownsCharacter` at lines ~36-80, import instead)
- Modify: `backend/src/services/obr-auth-handoff-service.ts` (same pattern, local `sessionUserId` ~line 20)
- Modify: `backend/src/services/character-draft-service.ts` (local `sessionUserId` ~line 38 — it imports `AppSession` from character-service today; re-point to `./session.js`)
- Test: `backend/tests/unit-be/session.test.ts`

**Interfaces:**
- Produces (exact exports later tasks use):
  ```ts
  export type AppSession = {
    session?: { id?: string | null } | null;
    user?: { id?: string | null; isAnonymous?: boolean | null } | null;
  } | null;
  export function sessionUserId(session: AppSession): string | null;
  export function sessionId(session: AppSession): string | null;
  export function isGm(session: AppSession): boolean;
  export function hasObrWriteSession(session: AppSession): boolean;
  export function ownsCharacter(session: AppSession, character: { userId: string | null; sessionId: string | null }): boolean;
  ```

- [ ] **Step 1: Write the failing test**

`backend/tests/unit-be/session.test.ts`:

```ts
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  hasObrWriteSession,
  isGm,
  ownsCharacter,
  sessionId,
  sessionUserId,
} from '../../src/services/session.js';

test('sessionUserId / sessionId read the raw shared-auth shape', () => {
  const session = { session: { id: 'sid' }, user: { id: 'uid' } };
  assert.equal(sessionUserId(session), 'uid');
  assert.equal(sessionId(session), 'sid');
  assert.equal(sessionUserId(null), null);
  assert.equal(sessionId(null), null);
});

test('isGm requires a present, non-anonymous account', () => {
  assert.equal(isGm({ user: { id: 'u', isAnonymous: false } }), true);
  assert.equal(isGm({ user: { id: 'u', isAnonymous: true } }), false);
  assert.equal(isGm({ user: { id: null } }), false);
  assert.equal(isGm(null), false);
});

test('hasObrWriteSession accepts account or anonymous session', () => {
  assert.equal(hasObrWriteSession({ user: { id: 'u' } }), true);
  assert.equal(hasObrWriteSession({ session: { id: 's' } }), true);
  assert.equal(hasObrWriteSession({}), false);
  assert.equal(hasObrWriteSession(null), false);
});

test('ownsCharacter matches account id OR anonymous session id', () => {
  const character = { userId: 'u1', sessionId: 's1' };
  assert.equal(ownsCharacter({ user: { id: 'u1' } }, character), true);
  assert.equal(ownsCharacter({ session: { id: 's1' } }, character), true);
  assert.equal(ownsCharacter({ user: { id: 'u2' }, session: { id: 's2' } }, character), false);
  assert.equal(ownsCharacter(null, character), false);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && node --import tsx --test tests/unit-be/session.test.ts`
Expected: FAIL (module not found).

- [ ] **Step 3: Create `backend/src/services/session.ts`**

Move the canonical implementations (copy from `party-service.ts:25-92` + `obr-room-character-access.ts:24-26`, doc comments included):

```ts
/**
 * Raw shared-auth session shape the service layer reasons about. A GM is an
 * authenticated, non-anonymous account; a character owner is matched on the
 * account id (`user.id`) OR the anonymous session id (`session.id`). Decoupled
 * from Fastify so services can be unit-tested with a plain object.
 */
export type AppSession = {
  session?: { id?: string | null } | null;
  user?: { id?: string | null; isAnonymous?: boolean | null } | null;
} | null;

export function sessionUserId(session: AppSession): string | null {
  return session?.user?.id ?? null;
}

export function sessionId(session: AppSession): string | null {
  return session?.session?.id ?? null;
}

/** A GM is a present, non-anonymous account. */
export function isGm(session: AppSession): boolean {
  return Boolean(sessionUserId(session)) && session?.user?.isAnonymous !== true;
}

/** Any session (account or anonymous) that may write OBR room bindings. */
export function hasObrWriteSession(session: AppSession): boolean {
  return Boolean(sessionUserId(session) || sessionId(session));
}

/**
 * A caller owns a character when the account id matches `userId` (account) OR
 * the anonymous session id matches `sessionId` (guest). Mirrors the app's
 * ownership-by-binding model.
 */
export function ownsCharacter(
  session: AppSession,
  character: { userId: string | null; sessionId: string | null }
): boolean {
  const userId = sessionUserId(session);
  if (userId && character.userId === userId) {
    return true;
  }
  const sid = sessionId(session);
  if (sid && character.sessionId === sid) {
    return true;
  }
  return false;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd backend && node --import tsx --test tests/unit-be/session.test.ts`
Expected: PASS.

- [ ] **Step 5: Re-point the five duplicate sites**

In each of `party-service.ts`, `obr-room-character-access.ts`, `character-service.ts`, `obr-auth-handoff-service.ts`, `character-draft-service.ts`, `enemy-service.ts`:
- Delete the local `AppSession` type and the duplicated `sessionUserId`/`sessionId`/`isGm`/`ownsCharacter`/`hasObrWriteSession` functions.
- Add `import { ... , type AppSession } from './session.js';` with exactly the names each file uses.
- **Keep re-exports for API stability** where other files import from the old location: `party-service.ts`, `enemy-service.ts`, `character-service.ts` and `obr-room-character-access.ts` each currently `export type AppSession`; replace with `export type { AppSession } from './session.js';` and (for `obr-room-character-access.ts`) `export { hasObrWriteSession } from './session.js';` so `obr-room-binding-service.ts` imports keep working unchanged.

- [ ] **Step 6: Full unit suite + commit**

Run: `cd backend && npm run test:unit`
Expected: PASS (no behavioral change).

```bash
git add backend/src/services backend/tests/unit-be/session.test.ts
git commit -m "refactor(backend): extract shared session helpers into services/session"
```

---

### Task 2: `promoteRoom` hybrid gate — invite token owner-only (SEVERE security fix)

Anyone with a roomId currently receives the existing party's `manageView` including `inviteToken` (`party-service.ts:283-286`).

**Files:**
- Modify: `backend/src/services/party-service.ts:261-325` (`promoteRoom`)
- Modify: `backend/src/repositories/party-repository.ts` (add `setPartyOwner`)
- Test: `backend/tests/unit-be/party-service.test.ts`

**Interfaces:**
- Consumes: `isGm`, `sessionUserId` from Task 1's `./session.js`; existing `manageView`/`readView` helpers.
- Produces: `promoteRoom` returns `PartyManageViewPayload` (owner / claimer / fresh creation) or `PartyReadViewPayload` (non-owner, **no `inviteToken`/`invitePath`**). New repo method `setPartyOwner(id: string, ownerUserId: string): Promise<void>`.

- [ ] **Step 1: Write the failing tests**

Add to `backend/tests/unit-be/party-service.test.ts`, following the file's existing repository-mock pattern (a mocked `partyRepository.getPartyByObrRoomId` returning a `PartyWithMembers` fixture):

```ts
test('promoteRoom returns manage view (with invite token) to the owner', async () => {
  // fixture party: ownerUserId 'user-1'
  const result = await service.promoteRoom({
    session: { session: { id: 's1' }, user: { id: 'user-1', isAnonymous: false } },
    obrRoomId: 'room-1',
  });
  assert.equal(result.ok, true);
  assert.equal((result.value as { role: string }).role, 'gm');
  assert.ok((result.value as { inviteToken?: string }).inviteToken);
});

test('promoteRoom never leaks the invite token to a non-owner', async () => {
  // fixture party: ownerUserId 'user-1'; caller is user-2
  const result = await service.promoteRoom({
    session: { session: { id: 's2' }, user: { id: 'user-2', isAnonymous: false } },
    obrRoomId: 'room-1',
  });
  assert.equal(result.ok, true);
  const value = result.value as Record<string, unknown>;
  assert.equal(value.role, 'member');
  assert.equal('inviteToken' in value, false);
  assert.equal('invitePath' in value, false);
});

test('promoteRoom returns token-less view to anonymous callers of an owned room', async () => {
  const result = await service.promoteRoom({
    session: { session: { id: 's3' }, user: { id: 'anon-1', isAnonymous: true } },
    obrRoomId: 'room-1',
  });
  assert.equal(result.ok, true);
  assert.equal('inviteToken' in (result.value as Record<string, unknown>), false);
});

test('promoteRoom lets a signed-in GM claim a system-owned room party', async () => {
  // fixture party: ownerUserId 'system:obr-room'
  const result = await service.promoteRoom({
    session: { session: { id: 's2' }, user: { id: 'user-2', isAnonymous: false } },
    obrRoomId: 'room-sys',
  });
  assert.equal(result.ok, true);
  assert.equal((result.value as { role: string }).role, 'gm');
  // and setPartyOwner was called with (partyId, 'user-2')
  assert.deepEqual(state.setPartyOwnerCalls, [{ id: 'party-sys', ownerUserId: 'user-2' }]);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd backend && node --import tsx --test tests/unit-be/party-service.test.ts`
Expected: FAIL — non-owner currently gets `role: 'gm'` + `inviteToken`; `setPartyOwner` doesn't exist.

- [ ] **Step 3: Add `setPartyOwner` to the repository**

In `backend/src/repositories/party-repository.ts` (after `rotateInviteToken`):

```ts
  /** Transfer party ownership (used when a signed-in GM claims a system-owned room party). */
  async setPartyOwner(id: string, ownerUserId: string): Promise<void> {
    await prisma.party.update({ where: { id }, data: { ownerUserId } });
  },
```

- [ ] **Step 4: Implement the hybrid gate**

Replace the `existing` branch in `promoteRoom` (`party-service.ts:283-286`) with:

```ts
        const existing = await partyRepository.getPartyByObrRoomId(obrRoomId);
        if (existing) {
          const userId = sessionUserId(input.session);
          if (userId && existing.ownerUserId === userId) {
            return ok(manageView(existing, input.session));
          }
          // A signed-in GM adopts a party that was auto-created for the room
          // (system owner) so anonymous auto-setup has an upgrade path.
          if (isGm(input.session) && existing.ownerUserId === OBR_ROOM_SYSTEM_OWNER_ID) {
            await partyRepository.setPartyOwner(existing.id, userId as string);
            return ok(
              manageView({ ...existing, ownerUserId: userId as string }, input.session)
            );
          }
          // Room-trust callers can use the board but never see the invite token.
          return ok(readView(existing, input.session));
        }
```

Also change the method's return type from `Promise<ServiceResult<unknown>>` to `Promise<ServiceResult<PartyDetailPayload>>`.

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd backend && node --import tsx --test tests/unit-be/party-service.test.ts`
Expected: PASS.

- [ ] **Step 6: Full backend unit suite + commit**

Run: `cd backend && npm run test:unit`

```bash
git add backend/src/services/party-service.ts backend/src/repositories/party-repository.ts backend/tests/unit-be/party-service.test.ts
git commit -m "fix(party): promoteRoom returns token-less view to non-owners; GM can claim system room party"
```

---

### Task 3: Enemy routes — delete dead `session` params, move to own plugin file

Room-trust for enemies is **kept by decision**; the fix is honesty: signatures must stop implying auth, and the 752-line `routes/parties/index.ts` sheds the enemy routes.

**Files:**
- Modify: `backend/src/services/enemy-service.ts` (drop `session` from all 5 method inputs; delete local `AppSession`)
- Create: `backend/src/routes/parties/enemies.ts` (move lines 552-749 of `routes/parties/index.ts` verbatim, minus `session:` args)
- Modify: `backend/src/routes/parties/index.ts` (delete enemy routes + now-unused imports: enemy schemas, `createEnemyService`, `EnemyInput`)
- Test: `backend/tests/unit-be/enemy-service.test.ts`, `backend/tests/unit-be/enemies-route.test.ts`

**Interfaces:**
- Produces: `createEnemyService(log)` methods now take `{ roomId, ... }` with **no `session`**: `listForOwner({ roomId })`, `create({ roomId, body })`, `update({ roomId, enemyId, body })`, `setHealth({ roomId, enemyId, currentHealth })`, `remove({ roomId, enemyId })`. `listCardsForPlayer` is unchanged.
- @fastify/autoload registers every file in `routes/parties/` under the `/api/parties` prefix (directory-name prefixing; filenames add nothing), so the moved routes keep their paths. Verify in Step 5.

- [ ] **Step 1: Update tests to the new signatures**

In `enemy-service.test.ts` and `enemies-route.test.ts`, delete every `session: ...` property passed to `create/update/setHealth/remove/listForOwner` and any session fixtures used only for that. Add one new assertion to `enemy-service.test.ts`:

```ts
test('enemy mutations are gated by the room party only (room-trust by design)', async () => {
  // no session anywhere in the input
  const result = await service.create({ roomId: 'room-1', body: enemyBody });
  assert.equal(result.ok, true);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd backend && node --import tsx --test tests/unit-be/enemy-service.test.ts`
Expected: FAIL (TypeScript: `session` missing/unknown — signatures still require it).

- [ ] **Step 3: Strip `session` from `enemy-service.ts`**

- Delete lines 18-21 (`export type AppSession`) — replace with `export type { AppSession } from './session.js';` only if anything still imports it from here (check with grep; if nothing does, delete outright).
- Remove `session: AppSession;` from the input types of `listForOwner`, `create`, `update`, `setHealth`, `remove`.
- Extend the `ensureRoomParty` comment so the trust decision is explicit:

```ts
  // Gates every OBR-side enemy op by the promoted Owlbear room party. The OBR
  // room id is the table capability, so enemies work for anonymous OBR GMs too.
  // DECISION (2026-07-01, review follow-up): this is deliberate room-trust —
  // no session/ownership check. The invite token is still owner-only (see
  // party-service.promoteRoom). Documented in CLAUDE.md's security table.
```

- [ ] **Step 4: Create `backend/src/routes/parties/enemies.ts`**

Move the five enemy routes (`GET /by-room/:roomId/enemies`, `GET .../cards`, `POST`, `PATCH`, `PATCH .../health`, `DELETE`) from `routes/parties/index.ts:552-749` into the new file unchanged **except**: delete every `session: request.appSession,` line. File skeleton:

```ts
import { FastifyPluginAsync } from 'fastify';
import {
  EnemyBodySchema,
  EnemyCardListSchema,
  EnemyCardsQuerySchema,
  EnemyFullSchema,
  EnemyHealthBodySchema,
  EnemyListSchema,
  RoomEnemyParamsSchema,
  RoomParamsSchema,
} from '../../schemas/enemy.js';
import { ErrorSchema } from '../../schemas/party.js';
import { sendServiceError } from '../../errors.js';
import {
  createEnemyService,
  type EnemyInput,
} from '../../services/enemy-service.js';

// OBR room enemy board. Room-trust by design: the unguessable OBR room id is
// the capability (see enemy-service.ts). Autoloaded under /api/parties.
const partyEnemies: FastifyPluginAsync = async (fastify): Promise<void> => {
  const enemyService = (request: {
    log: Parameters<typeof createEnemyService>[0];
  }) => createEnemyService(request.log);

  // ... the six moved route registrations ...
};

export default partyEnemies;
```

Then delete those routes and the now-unused imports from `routes/parties/index.ts`.

- [ ] **Step 5: Run route tests + integration smoke**

Run: `cd backend && node --import tsx --test tests/unit-be/enemies-route.test.ts tests/unit-be/enemy-service.test.ts && npm run test:unit`
Expected: PASS. (Route unit tests register the plugin directly — update their import to `../../src/routes/parties/enemies.js`.)
Then: `cd backend && npm run test:integration` — the enemies integration test must still reach `/api/parties/by-room/...` (proves autoload prefixing).

- [ ] **Step 6: Commit**

```bash
git add backend/src/services/enemy-service.ts backend/src/routes/parties backend/tests/unit-be/enemy-service.test.ts backend/tests/unit-be/enemies-route.test.ts
git commit -m "refactor(enemies): drop dead session params, move room enemy routes to own plugin"
```

---

### Task 4: Idempotent binding unbinds (drift-repair fix)

`clearPlayerCharacter`/`clearTokenCharacter` 404 when the backend row is missing, so a drifted token (OBR metadata without a backend row) can never be cleaned up (frontend calls backend first).

**Files:**
- Modify: `backend/src/services/obr-room-binding-service.ts:214-227` and `:338-350`
- Test: `backend/tests/unit-be/obr-room-binding-service.test.ts`, `backend/tests/unit-be/obr-room-bindings-route.test.ts`

- [ ] **Step 1: Write the failing tests**

In `obr-room-binding-service.test.ts` (using the file's `state` mock):

```ts
test('clearTokenCharacter succeeds when no binding exists (idempotent unbind)', async () => {
  // state configured so getTokenCharacterBinding returns null
  const result = await service.clearTokenCharacter({
    roomId: 'room-1',
    tokenId: 'token-1',
    session: OWNER_SESSION,
  });
  assert.equal(result.ok, true);
  assert.equal(state.tokenClearCalls.length, 0); // nothing to delete
});

test('clearPlayerCharacter succeeds when no binding exists (idempotent unbind)', async () => {
  const result = await service.clearPlayerCharacter({
    roomId: 'room-1',
    playerId: 'player-1',
    session: OWNER_SESSION,
  });
  assert.equal(result.ok, true);
});
```

In `obr-room-bindings-route.test.ts`, change the "missing binding → 404" DELETE expectations to expect **204**.

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd backend && node --import tsx --test tests/unit-be/obr-room-binding-service.test.ts`
Expected: FAIL (`result.ok` is false, error 404).

- [ ] **Step 3: Make the clears idempotent**

In both `clearPlayerCharacter` and `clearTokenCharacter`, replace the not-found failure with success:

```ts
        if (!binding) {
          // Idempotent: nothing durable to clear. Lets the frontend repair
          // drifted OBR metadata that has no backend row ("unbind deletes both").
          return ok(undefined);
        }
```

(Remove the now-unused `notFound` import if nothing else in the file uses it.)

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd backend && node --import tsx --test tests/unit-be/obr-room-binding-service.test.ts tests/unit-be/obr-room-bindings-route.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/src/services/obr-room-binding-service.ts backend/tests/unit-be/obr-room-binding-service.test.ts backend/tests/unit-be/obr-room-bindings-route.test.ts
git commit -m "fix(obr): make binding unbinds idempotent so metadata drift is repairable"
```

---

### Task 5: Rate limits on OBR binding routes

The deleted `POST /api/characters/:id/obr-room` carried 60/min; its replacements carry none.

**Files:**
- Modify: `backend/src/routes/obr/index.ts` (5 routes)
- Test: covered by existing route tests (config-only change; assert via integration in Step 3)

- [ ] **Step 1: Add the config**

Add to `GET /rooms/:roomId/bindings`:

```ts
      config: {
        rateLimit: {
          max: process.env.NODE_ENV === 'test' ? 10000 : 30,
          timeWindow: '1 minute',
        },
      },
```

Add to all four binding writes (`PUT`/`DELETE` × players/tokens) the same block with `max: ... : 60`.

- [ ] **Step 2: Unit suite**

Run: `cd backend && npm run test:unit`
Expected: PASS (test env cap is 10000, so no test churn).

- [ ] **Step 3: Commit**

```bash
git add backend/src/routes/obr/index.ts
git commit -m "fix(obr): rate limit room binding routes (parity with the old bind route)"
```

---

### Task 6: Fold `obr-room-character-card-service` into the binding service

One-method factory + second per-request factory in the same route file; merge it.

**Files:**
- Modify: `backend/src/services/obr-room-binding-service.ts` (add `getCards`)
- Delete: `backend/src/services/obr-room-character-card-service.ts`
- Modify: `backend/src/routes/obr/index.ts` (single service factory)
- Modify: `backend/tests/unit-be/obr-room-binding-service.test.ts` (absorb card tests)
- Delete: `backend/tests/unit-be/obr-room-character-card-service.test.ts`

**Interfaces:**
- Produces: `createObrRoomBindingService(log).getCards({ ids: string[]; roomId: string; locale: string }): Promise<ServiceResult<unknown>>` — identical behavior to the old service.

- [ ] **Step 1: Move the tests**

Copy every test from `obr-room-character-card-service.test.ts` into `obr-room-binding-service.test.ts`, changing the factory under test to `createObrRoomBindingService` and merging the mock setups (the binding test file already mocks `obr-room-binding-repository`; add the card file's mocks for `get-character-full` and `character-card`). Delete the old test file.

- [ ] **Step 2: Run to verify failure**

Run: `cd backend && node --import tsx --test tests/unit-be/obr-room-binding-service.test.ts`
Expected: FAIL (`getCards is not a function`).

- [ ] **Step 3: Move the implementation**

Into `createObrRoomBindingService`'s returned object, add the `getCards` method verbatim from `obr-room-character-card-service.ts:21-61`, plus at module top:

```ts
import { getCharacterFull } from '../lib/get-character-full.js';
import { toCharacterCard } from '../lib/character-card.js';
import { filterCharacterIdsInObrRoom } from './obr-room-character-access.js';

const MAX_CARD_IDS = 50;
```

Delete `obr-room-character-card-service.ts`. In `routes/obr/index.ts`, delete the `roomCharacterCardService` factory (lines 45-47) and its import; the cards route calls `roomBindingService(request).getCards({...})`.

- [ ] **Step 4: Run tests to verify they pass + commit**

Run: `cd backend && npm run test:unit`

```bash
git add -A backend/src/services backend/src/routes/obr backend/tests/unit-be
git commit -m "refactor(obr): fold character card reads into the room binding service"
```

---

### Task 7: Auth-handoff schemas → `src/schemas/`, CSRF placement note

**Files:**
- Create: `backend/src/schemas/obr-auth-handoff.ts`
- Modify: `backend/src/routes/obr-auth-handoff.ts`
- Modify: `backend/src/services/obr-auth-handoff-service.ts` (constant moves; keep a re-export)
- Test: existing `backend/tests/unit-be/obr-auth-handoff-route.test.ts` (no behavior change)

- [ ] **Step 1: Create the schemas module**

`backend/src/schemas/obr-auth-handoff.ts` — move the three inline schemas from the route file (lines 17-46) plus the token length constant (move its definition here from the service; keep the exact current value):

```ts
export const OBR_AUTH_HANDOFF_MAX_TOKEN_LENGTH = /* move value from obr-auth-handoff-service.ts */;

export const HandoffParamsSchema = { /* verbatim from route file */ } as const;
export const HandoffBodySchema = { /* verbatim, uses the constant above */ } as const;
export const HandoffTokenSchema = { /* verbatim */ } as const;
```

In the service, replace the constant definition with `export { OBR_AUTH_HANDOFF_MAX_TOKEN_LENGTH } from '../schemas/obr-auth-handoff.js';` so existing imports keep working.

- [ ] **Step 2: Slim the route file + document the namespace**

Replace the inline schemas with imports, and add above the plugin:

```ts
// NOTE(security): these routes live under /api/auth/*, the namespace exempted
// from the shared-auth CSRF double-submit check. That is deliberate: PUT is a
// blind one-time-token drop (publishing your own token gains an attacker
// nothing) and GET is a one-shot take. Do not add state-changing app routes
// here that act on the caller's session.
```

- [ ] **Step 3: Verify + commit**

Run: `cd backend && node --import tsx --test tests/unit-be/obr-auth-handoff-route.test.ts && npm run test:unit`
Expected: PASS.

```bash
git add backend/src/schemas/obr-auth-handoff.ts backend/src/routes/obr-auth-handoff.ts backend/src/services/obr-auth-handoff-service.ts
git commit -m "refactor(obr): move auth-handoff schemas to src/schemas, document CSRF placement"
```

---

### Task 8: Party↔room attach/detach endpoints (portability D2)

**Files:**
- Modify: `backend/src/repositories/party-repository.ts` (add `setPartyObrRoom`)
- Modify: `backend/src/services/party-service.ts` (add `attachRoom`, `detachRoom`)
- Modify: `backend/src/schemas/party.ts` (add `AttachRoomBodySchema` mirroring `PromotePartyBodySchema`'s `obrRoomId` field)
- Modify: `backend/src/routes/parties/index.ts` (two routes)
- Test: `backend/tests/unit-be/party-service.test.ts`, `backend/tests/unit-be/parties-route.test.ts`

**Interfaces:**
- Produces:
  - `partyRepository.setPartyObrRoom(id: string, obrRoomId: string | null): Promise<void>`
  - `partyService.attachRoom({ session, id, obrRoomId }): ServiceResult<{ id: string; obrRoomId: string }>` — owner-only; 409 `ROOM_ALREADY_PROMOTED` when the room is claimed by a different party; idempotent when already attached to this party.
  - `partyService.detachRoom({ session, id }): ServiceResult<{ id: string; obrRoomId: null }>`
  - `POST /api/parties/:id/attach-room` (body `{ obrRoomId }`), `POST /api/parties/:id/detach-room`

- [ ] **Step 1: Write the failing service tests**

```ts
test('attachRoom re-points the party room pointer for the owner', async () => {
  const result = await service.attachRoom({
    session: ownerSession, id: PARTY_ID, obrRoomId: 'new-room',
  });
  assert.equal(result.ok, true);
  assert.deepEqual(state.setObrRoomCalls, [{ id: PARTY_ID, obrRoomId: 'new-room' }]);
});

test('attachRoom rejects a room already claimed by another party with 409 ROOM_ALREADY_PROMOTED', async () => {
  // state: getPartyByObrRoomId('taken-room') → a different party
  const result = await service.attachRoom({
    session: ownerSession, id: PARTY_ID, obrRoomId: 'taken-room',
  });
  assert.equal(result.ok, false);
  assert.equal(result.error.statusCode, 409);
  assert.equal(result.error.code, 'ROOM_ALREADY_PROMOTED');
});

test('attachRoom is idempotent when the room already points at this party', async () => {
  const result = await service.attachRoom({
    session: ownerSession, id: PARTY_ID, obrRoomId: 'my-room',
  });
  assert.equal(result.ok, true);
  assert.equal(state.setObrRoomCalls.length, 0);
});

test('attachRoom / detachRoom are owner-only (404 for non-owners)', async () => {
  const result = await service.attachRoom({
    session: strangerSession, id: PARTY_ID, obrRoomId: 'new-room',
  });
  assert.equal(result.ok, false);
  assert.equal(result.error.statusCode, 404);
});

test('detachRoom clears the pointer', async () => {
  const result = await service.detachRoom({ session: ownerSession, id: PARTY_ID });
  assert.equal(result.ok, true);
  assert.deepEqual(state.setObrRoomCalls, [{ id: PARTY_ID, obrRoomId: null }]);
});
```

- [ ] **Step 2: Run to verify failure**

Run: `cd backend && node --import tsx --test tests/unit-be/party-service.test.ts`
Expected: FAIL (methods don't exist).

- [ ] **Step 3: Repository + service implementation**

Repository (next to `setPartyOwner`):

```ts
  /** Re-point (or clear) the party's Owlbear room pointer (D2: 1:1, re-pointable). */
  async setPartyObrRoom(id: string, obrRoomId: string | null): Promise<void> {
    await prisma.party.update({ where: { id }, data: { obrRoomId } });
  },
```

Service (after `promoteRoom`; `ensureOwner` and `apiError` already exist in the file):

```ts
    async attachRoom(input: {
      session: AppSession;
      id: string;
      obrRoomId: string;
    }): Promise<ServiceResult<{ id: string; obrRoomId: string }>> {
      const denied = await ensureOwner(input.session, input.id);
      if (denied) {
        return fail(denied);
      }
      const obrRoomId =
        typeof input.obrRoomId === 'string' ? input.obrRoomId.trim() : '';
      if (obrRoomId.length === 0) {
        return fail(badRequest('INVALID_OBR_ROOM_ID', 'Owlbear room ID is required'));
      }

      try {
        const existing = await partyRepository.getPartyByObrRoomId(obrRoomId);
        if (existing && existing.id !== input.id) {
          return fail(
            apiError(
              409,
              'ROOM_ALREADY_PROMOTED',
              'This Owlbear room is already linked to another party'
            )
          );
        }
        if (!existing) {
          // Unique index on obrRoomId backstops concurrent attaches (P2002 → 409).
          await partyRepository.setPartyObrRoom(input.id, obrRoomId);
        }
        return ok({ id: input.id, obrRoomId });
      } catch (err) {
        return fail(
          unexpected(log, err, 'PARTY_ATTACH_FAILED', 'Failed to attach Owlbear room')
        );
      }
    },

    async detachRoom(input: {
      session: AppSession;
      id: string;
    }): Promise<ServiceResult<{ id: string; obrRoomId: null }>> {
      const denied = await ensureOwner(input.session, input.id);
      if (denied) {
        return fail(denied);
      }
      try {
        await partyRepository.setPartyObrRoom(input.id, null);
        return ok({ id: input.id, obrRoomId: null });
      } catch (err) {
        return fail(
          unexpected(log, err, 'PARTY_DETACH_FAILED', 'Failed to detach Owlbear room')
        );
      }
    },
```

- [ ] **Step 4: Schema + routes**

`backend/src/schemas/party.ts`:

```ts
export const AttachRoomBodySchema = {
  type: 'object',
  additionalProperties: false,
  required: ['obrRoomId'],
  properties: {
    obrRoomId: { type: 'string', minLength: 1, maxLength: 256 },
  },
} as const;
```

`backend/src/routes/parties/index.ts` (after the promote route; same thin shape as its neighbors):

```ts
  // POST /api/parties/:id/attach-room - re-point the party to a new OBR room (GM only)
  fastify.post<{ Params: { id: string }; Body: { obrRoomId: string } }>(
    '/:id/attach-room',
    {
      schema: {
        description: 'Attach this party to an Owlbear room (GM only)',
        tags: ['parties'],
        params: PartyIdParamsSchema,
        body: AttachRoomBodySchema,
        response: {
          200: { type: 'object', additionalProperties: true },
          400: ErrorSchema, 401: ErrorSchema, 404: ErrorSchema,
          409: ErrorSchema, 500: ErrorSchema,
        },
      },
    },
    async (request, reply) => {
      const result = await partyService(request).attachRoom({
        session: request.appSession,
        id: request.params.id,
        obrRoomId: request.body.obrRoomId,
      });
      if (!result.ok) {
        return sendServiceError(reply, request, result.error);
      }
      return result.value;
    }
  );

  // POST /api/parties/:id/detach-room - clear the party's OBR room pointer (GM only)
  fastify.post<{ Params: { id: string } }>(
    '/:id/detach-room',
    {
      schema: {
        description: 'Detach this party from its Owlbear room (GM only)',
        tags: ['parties'],
        params: PartyIdParamsSchema,
        response: {
          200: { type: 'object', additionalProperties: true },
          400: ErrorSchema, 401: ErrorSchema, 404: ErrorSchema, 500: ErrorSchema,
        },
      },
    },
    async (request, reply) => {
      const result = await partyService(request).detachRoom({
        session: request.appSession,
        id: request.params.id,
      });
      if (!result.ok) {
        return sendServiceError(reply, request, result.error);
      }
      return result.value;
    }
  );
```

Add route tests in `parties-route.test.ts` following its existing mock-service pattern (200 owner path, 409 collision, 404 non-owner).

- [ ] **Step 5: Run + commit**

Run: `cd backend && npm run test:unit`

```bash
git add backend/src backend/tests/unit-be
git commit -m "feat(party): attach/detach Owlbear room endpoints (portability D2)"
```

---

### Task 9: Frontend — promote response may be token-less

`ObrRoomPromotion.tsx` assumes `party.invitePath` always exists; after Task 2 non-owners get a `member`-role payload without it.

**Files:**
- Modify: `frontend/src/api/party.ts` (`PartyDetail` invite fields optional)
- Modify: `frontend/src/components/obr/ObrRoomPromotion.tsx`
- Modify: `frontend/src/i18n/en.json`, `frontend/src/i18n/pl.json`
- Test: `frontend/test/browser/ObrPartyRoster.test.tsx` (where ObrRoomPromotion is covered)

- [ ] **Step 1: Type change**

In `frontend/src/api/party.ts`:

```ts
export type PartyDetail = Omit<OwnedPartySummary, "inviteToken" | "invitePath"> & {
  role: PartyRole;
  members: PartyMemberSummary[];
  // Owner-only: absent when the backend returns the token-less room view.
  inviteToken?: string;
  invitePath?: string;
};
```

Run `cd frontend && npx tsc --noEmit` — fix every usage the compiler flags by guarding on `invitePath` (expected: `ObrRoomPromotion.tsx`, possibly party pages that always have the gm role — for those, narrow via `party.role === "gm" && party.invitePath`).

- [ ] **Step 2: Write the failing browser test**

In the ObrRoomPromotion coverage (`frontend/test/browser/ObrPartyRoster.test.tsx`), add a case where the promote/room query returns `{ role: "member", ... }` without `invitePath`:

```tsx
it("shows the room party without invite controls when the caller is not the owner", async () => {
  // seed partyKeys.obrRoom(roomId) with a member-role PartyDetail (no invitePath)
  render(<ObrRoomPromotion />, { wrapper: BrowserTestProvider });
  await expect.element(page.getByText("Room board active")).toBeVisible();
  expect(page.getByRole("button", { name: /copy invite link/i }).query()).toBeNull();
});
```

Run: `cd frontend && npm run test:browser -- ObrPartyRoster`
Expected: FAIL.

- [ ] **Step 3: Implement the branch**

In `ObrRoomPromotion.tsx`, replace the `if (party)` block body: keep the current links only when `party.invitePath` is present; otherwise render the token-less state:

```tsx
  if (party) {
    return (
      <PromotionPanel aria-label="Room promotion">
        {party.invitePath ? (
          <PromotionLinks aria-label="Saved party links">
            {/* existing PromotionCopyButton + PromotionLink, unchanged */}
          </PromotionLinks>
        ) : (
          <PromotionLinks aria-label="Saved party links">
            {t("obr.roster.roomBoardActive", "Room board active")}
            {" — "}
            {t("obr.roster.signInForInvite", "Sign in as the owner to manage invites")}
          </PromotionLinks>
        )}
      </PromotionPanel>
    );
  }
```

i18n keys (both `en.json` and `pl.json`, keep key-synced):
- `obr.roster.roomBoardActive`: "Room board active" / "Tablica pokoju aktywna"
- `obr.roster.signInForInvite`: "Sign in as the owner to manage invites" / "Zaloguj się jako właściciel, aby zarządzać zaproszeniami"

- [ ] **Step 4: Verify + commit**

Run: `cd frontend && npx tsc --noEmit && npm run lint && npm run test:browser -- ObrPartyRoster && npm run doctor`

```bash
git add frontend/src frontend/test
git commit -m "fix(obr): handle token-less room party view in promotion panel"
```

---

### Task 10: Frontend — "Use this room" attach UI

**Files:**
- Modify: `frontend/src/api/party.ts` (attach/detach calls + `partyKeys`)
- Modify: `frontend/src/hooks/usePartyRepository.ts` (`useAttachObrRoom`)
- Create: `frontend/src/components/obr/ObrRoomAttach.tsx`
- Modify: `frontend/src/components/obr/ObrRoomPromotion.tsx` (render it in the un-promoted branch)
- Modify: `frontend/src/i18n/en.json`, `pl.json`
- Test: `frontend/test/browser/ObrPartyRoster.test.tsx`

**Interfaces:**
- Consumes: `POST /api/parties/:id/attach-room` from Task 8; existing `listParties()` (`GET /api/parties`, 401 for anonymous) and `partyKeys.obrRoom(roomId)` cache seam used by `usePromoteObrRoom`.
- Produces: `attachPartyRoom(partyId: string, obrRoomId: string): Promise<{ id: string; obrRoomId: string }>`; `useAttachObrRoom()` mutation that, on success, refetches the party detail and seeds `partyKeys.obrRoom(obrRoomId)` the same way `usePromoteObrRoom.onSuccess` does.

- [ ] **Step 1: API + hook**

`frontend/src/api/party.ts`:

```ts
export async function attachPartyRoom(
  partyId: string,
  obrRoomId: string,
): Promise<{ id: string; obrRoomId: string }> {
  return unwrapApiResult(
    await partyClient.POST<{ id: string; obrRoomId: string }>(
      `/api/parties/${partyId}/attach-room`,
      { body: { obrRoomId } },
    ),
    "Failed to attach this Owlbear room",
  );
}
```

`frontend/src/hooks/usePartyRepository.ts`:

```ts
export function useAttachObrRoom() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { partyId: string; obrRoomId: string }) => {
      await attachPartyRoom(input.partyId, input.obrRoomId);
      return getParty(input.partyId);
    },
    onSuccess: (party, variables) => {
      queryClient.setQueryData(partyKeys.detail(party.id), party);
      queryClient.setQueryData(partyKeys.obrRoom(variables.obrRoomId), party);
      void queryClient.invalidateQueries({ queryKey: partyKeys.list() });
    },
  });
}
```

- [ ] **Step 2: Write the failing browser test**

```tsx
it("lets a signed-in GM attach an existing warband to this room", async () => {
  // mock GET /api/parties → [{ id: "p1", name: "Doomed Ones", ... }]
  // mock POST /api/parties/p1/attach-room → 200; GET /api/parties/p1 → gm detail
  render(<ObrRoomPromotion />, { wrapper: BrowserTestProvider });
  await page.getByRole("combobox", { name: /use an existing warband/i }).selectOptions("p1");
  await page.getByRole("button", { name: /use this room/i }).click();
  await expect.element(page.getByText(/invite/i)).toBeVisible();
});
```

Run: `cd frontend && npm run test:browser -- ObrPartyRoster` — Expected: FAIL.

- [ ] **Step 3: Create `ObrRoomAttach.tsx`**

```tsx
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useParties, useAttachObrRoom } from "@/hooks/usePartyRepository";
import {
  PromotionButton,
  PromotionError,
  PromotionLinks,
} from "./ObrPartyRoster.styles";

// Portability D2: a GM whose room died picks a warband and re-points it here.
export function ObrRoomAttach({ roomId }: { roomId: string }) {
  const { t } = useTranslation();
  const parties = useParties();
  const attach = useAttachObrRoom();
  const [partyId, setPartyId] = useState("");

  // Anonymous callers get a 401 from GET /api/parties — hide the section.
  if (!parties.data || parties.data.length === 0) {
    return null;
  }

  return (
    <PromotionLinks aria-label="Attach existing warband">
      <select
        aria-label={t("obr.roster.attachSelect", "Use an existing warband")}
        value={partyId}
        onChange={(event) => setPartyId(event.target.value)}
      >
        <option value="">
          {t("obr.roster.attachSelect", "Use an existing warband")}
        </option>
        {parties.data.map((party) => (
          <option key={party.id} value={party.id}>
            {party.name}
          </option>
        ))}
      </select>
      <PromotionButton
        type="button"
        disabled={!partyId || attach.isPending}
        onClick={() => attach.mutate({ partyId, obrRoomId: roomId })}
      >
        {attach.isPending
          ? t("obr.roster.attaching", "Attaching")
          : t("obr.roster.useThisRoom", "Use this room")}
      </PromotionButton>
      {attach.isError && (
        <PromotionError role="alert">
          {attach.error instanceof Error && attach.error.message
            ? attach.error.message
            : t("obr.roster.attachError", "Could not attach this room")}
        </PromotionError>
      )}
    </PromotionLinks>
  );
}
```

If `useParties` doesn't exist in `usePartyRepository.ts` under that name, use the existing list-parties hook there (grep `listParties`); add one only if truly absent:

```ts
export function useParties() {
  return useQuery({
    queryKey: partyKeys.list(),
    queryFn: listParties,
    retry: false,
  });
}
```

Render `<ObrRoomAttach roomId={roomId} />` inside `ObrRoomPromotion`'s un-promoted branch, below the promote button. Style the `select` inline with the punk theme only if lint/design complains — reuse an existing styled select from `ObrPartyRoster.styles` if one exists.

i18n keys (en/pl): `obr.roster.attachSelect` ("Use an existing warband"/"Użyj istniejącej bandy"), `obr.roster.useThisRoom` ("Use this room"/"Użyj tego pokoju"), `obr.roster.attaching` ("Attaching"/"Podpinanie"), `obr.roster.attachError` ("Could not attach this room"/"Nie udało się podpiąć pokoju").

- [ ] **Step 4: Verify + commit**

Run: `cd frontend && npx tsc --noEmit && npm run lint && npm run test:browser -- ObrPartyRoster && npm run doctor`

```bash
git add frontend/src frontend/test
git commit -m "feat(obr): attach an existing warband to the current room (D2 re-point)"
```

---

### Task 11: GM management UI — stale bindings, assign/clear controls (room-bindings Task 5)

The hook layer (`assignPlayer`/`unassignPlayer`/`bindSelectedToken`/`unbindToken` in `useObrRosterCards`) already exists; what's missing is staleness computation and per-row GM controls.

**Files:**
- Create: `frontend/src/obr/rosterStale.ts` (pure functions)
- Modify: `frontend/src/components/obr/useObrRosterCards.ts` (scene token ids + stale rows)
- Create: `frontend/src/components/obr/ObrBindingControls.tsx`
- Modify: `frontend/src/components/obr/ObrPartyRosterRow.tsx` (accept row + GM controls)
- Modify: `frontend/src/components/obr/ObrPartyRoster.tsx` (pass the new props at the `ObrPartyRosterRow` call site — grep `ObrPartyRosterRow` to find it)
- Modify: `frontend/src/i18n/en.json`, `pl.json`
- Test: `frontend/test/unit/obr/rosterStale.test.ts`, `frontend/test/browser/ObrPartyRoster.test.tsx`

**Interfaces:**
- Produces:
  ```ts
  // rosterStale.ts
  export type StalePlayerBinding = ObrPlayerCharacterBinding & { stale: boolean };
  export type StaleTokenBinding = ObrTokenCharacterBinding & { stale: boolean };
  export function markPlayerBindings(players: ObrPlayerCharacterBinding[], connectedPlayerIds: ReadonlySet<string>): StalePlayerBinding[];
  export function markTokenBindings(tokens: ObrTokenCharacterBinding[], sceneTokenIds: ReadonlySet<string> | null): StaleTokenBinding[];
  ```
  `sceneTokenIds === null` means "scene not ready / unknown" → nothing is marked stale.
- `ObrPartyRosterBindingRow.players/tokens` become the `Stale*` variants; `ObrRosterState` gains `sceneReady: boolean`.

- [ ] **Step 1: Write the failing unit test**

`frontend/test/unit/obr/rosterStale.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { markPlayerBindings, markTokenBindings } from "@/obr/rosterStale";

const player = (playerId: string) => ({
  playerId, connectionId: null, characterId: "c1",
});
const token = (tokenId: string) => ({ tokenId, playerId: null, characterId: "c1" });

describe("rosterStale", () => {
  it("marks player bindings whose player is not connected", () => {
    const rows = markPlayerBindings(
      [player("here"), player("gone")],
      new Set(["here"]),
    );
    expect(rows.map((row) => row.stale)).toEqual([false, true]);
  });

  it("marks token bindings whose token left the scene", () => {
    const rows = markTokenBindings(
      [token("on-map"), token("deleted")],
      new Set(["on-map"]),
    );
    expect(rows.map((row) => row.stale)).toEqual([false, true]);
  });

  it("marks nothing when the scene is unknown", () => {
    const rows = markTokenBindings([token("a")], null);
    expect(rows.map((row) => row.stale)).toEqual([false]);
  });
});
```

Run: `cd frontend && npm run test:unit -- rosterStale` — Expected: FAIL.

- [ ] **Step 2: Implement `frontend/src/obr/rosterStale.ts`**

```ts
import type {
  ObrPlayerCharacterBinding,
  ObrTokenCharacterBinding,
} from "@/api/obr";

export type StalePlayerBinding = ObrPlayerCharacterBinding & { stale: boolean };
export type StaleTokenBinding = ObrTokenCharacterBinding & { stale: boolean };

// Staleness is a frontend concept: the backend cannot see OBR connectivity, so
// "stale" = durable binding whose OBR counterpart is gone right now.
export function markPlayerBindings(
  players: ObrPlayerCharacterBinding[],
  connectedPlayerIds: ReadonlySet<string>,
): StalePlayerBinding[] {
  return players.map((binding) => ({
    ...binding,
    stale: !connectedPlayerIds.has(binding.playerId),
  }));
}

export function markTokenBindings(
  tokens: ObrTokenCharacterBinding[],
  sceneTokenIds: ReadonlySet<string> | null,
): StaleTokenBinding[] {
  return tokens.map((binding) => ({
    ...binding,
    stale: sceneTokenIds !== null && !sceneTokenIds.has(binding.tokenId),
  }));
}
```

Run the unit test → PASS.

- [ ] **Step 3: Track scene token ids in `useObrRosterCards`**

Add state + subscription inside the existing `OBR.onReady` effect (next to the current `unsubscribeSceneReady` wiring):

```ts
const [sceneTokenIds, setSceneTokenIds] = useState<ReadonlySet<string> | null>(null);
```

```ts
      unsubscribeItems = OBR.scene.items.onChange((items) => {
        setSceneTokenIds(new Set(items.map((item) => item.id)));
      });
      void OBR.scene.isReady().then(async (ready) => {
        if (!ready || !active) return;
        const items = await OBR.scene.items.getItems().catch(() => null);
        if (active && items) setSceneTokenIds(new Set(items.map((item) => item.id)));
      });
```

In the scene `onReadyChange` handler, add `if (!ready) setSceneTokenIds(null);`. Add `unsubscribeItems` to the cleanup. Then thread staleness through `toRosterRows` — pass `connectedPlayerIds: new Set(connectedPlayers.map((p) => p.id))` and `sceneTokenIds`, and inside it wrap the pushes:

```ts
  for (const binding of markPlayerBindings(input.players, input.connectedPlayerIds)) {
    const row = ensureRow(rows, binding.characterId, cardsById);
    row.players.push(binding);
  }
  for (const binding of markTokenBindings(input.tokens, input.sceneTokenIds)) {
    const row = ensureRow(rows, binding.characterId, cardsById);
    row.tokens.push(binding);
  }
```

Update `ObrPartyRosterBindingRow` types to `StalePlayerBinding[]`/`StaleTokenBinding[]`, add the new params to the `useMemo` deps, and return `sceneReady: sceneTokenIds !== null` from the hook.

- [ ] **Step 4: Create `ObrBindingControls.tsx`**

Compact punk control rows (per the plan: "not modal-heavy forms"):

```tsx
import { useTranslation } from "react-i18next";
import type {
  ObrConnectedPlayer,
  ObrPartyRosterBindingRow,
} from "./useObrRosterCards";

type Props = {
  row: ObrPartyRosterBindingRow;
  connectedPlayers: ObrConnectedPlayer[];
  pending: boolean;
  onAssignPlayer: (input: { characterId: string; playerId: string }) => void;
  onUnassignPlayer: (playerId: string) => void;
  onUnbindToken: (tokenId: string) => void;
};

export function ObrBindingControls({
  row, connectedPlayers, pending,
  onAssignPlayer, onUnassignPlayer, onUnbindToken,
}: Props) {
  const { t } = useTranslation();
  const boundPlayerIds = new Set(row.players.map((binding) => binding.playerId));
  const assignable = connectedPlayers.filter((p) => !boundPlayerIds.has(p.id));

  return (
    <div aria-label={t("obr.gm.bindings", "Room bindings")}>
      {row.players.map((binding) => (
        <div key={binding.playerId}>
          <span>
            {t("obr.gm.playerBinding", "Player {{id}}", { id: binding.playerId })}
            {binding.stale && (
              <strong role="status">
                {" "}{t("obr.gm.stale", "STALE — not in room")}
              </strong>
            )}
          </span>
          <button
            type="button"
            disabled={pending}
            onClick={() => onUnassignPlayer(binding.playerId)}
          >
            {t("obr.gm.clearBinding", "Clear")}
          </button>
        </div>
      ))}
      {row.tokens.map((binding) => (
        <div key={binding.tokenId}>
          <span>
            {t("obr.gm.tokenBinding", "Token")}
            {binding.stale && (
              <strong role="status">
                {" "}{t("obr.gm.staleToken", "STALE — not in scene")}
              </strong>
            )}
          </span>
          <button
            type="button"
            disabled={pending}
            onClick={() => onUnbindToken(binding.tokenId)}
          >
            {t("obr.gm.unbindToken", "Unbind")}
          </button>
        </div>
      ))}
      {assignable.length > 0 && (
        <select
          aria-label={t("obr.gm.assignTo", "Assign to player")}
          disabled={pending}
          value=""
          onChange={(event) => {
            if (event.target.value) {
              onAssignPlayer({
                characterId: row.characterId,
                playerId: event.target.value,
              });
            }
          }}
        >
          <option value="">{t("obr.gm.assignTo", "Assign to player")}</option>
          {assignable.map((p) => (
            <option key={`${p.id}:${p.connectionId ?? ""}`} value={p.id}>
              {p.name ?? p.id}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
```

Style with a co-located `ObrBindingControls.styles.ts` reusing tokens from `ObrPartyRoster.styles.ts` (flat borders, no radii per DESIGN.md) — swap the bare `div`/`button`/`select` for styled components mirroring the existing roster row styles.

- [ ] **Step 5: Wire into the row and roster**

`ObrPartyRosterRow.tsx` — extend props, keep the card view unchanged:

```tsx
export function ObrPartyRosterRow({
  card,
  row,
  gmControls,
}: {
  card: ObrPartyRosterCard;
  row?: ObrPartyRosterBindingRow;
  gmControls?: React.ComponentProps<typeof ObrBindingControls> | null;
}) {
  // ...existing body...
  return (
    <>
      <WarbandStripRowView
        member={member}
        open={isModsOpen}
        onToggle={() => setIsModsOpen((open) => !open)}
      />
      {gmControls && <ObrBindingControls {...gmControls} />}
    </>
  );
}
```

In `ObrPartyRoster.tsx`, find the `<ObrPartyRosterRow` call site (grep). Where the roster is rendered in the GM view, pass `row` and `gmControls={{ row, connectedPlayers, pending: action.pending, onAssignPlayer: assignPlayer, onUnassignPlayer: unassignPlayer, onUnbindToken: unbindToken }}` from the `useObrRosterCards` state already consumed there; in the player view pass nothing (controls stay GM-only — role is a UI input, which is fine because the backend is room-trust anyway).

i18n keys (en/pl): `obr.gm.bindings`, `obr.gm.playerBinding`, `obr.gm.tokenBinding`, `obr.gm.stale` ("STALE — not in room"/"NIEAKTUALNE — brak w pokoju"), `obr.gm.staleToken` ("STALE — not in scene"/"NIEAKTUALNE — brak w scenie"), `obr.gm.clearBinding` ("Clear"/"Wyczyść"), `obr.gm.unbindToken` ("Unbind"/"Odepnij"), `obr.gm.assignTo` ("Assign to player"/"Przypisz graczowi").

- [ ] **Step 6: Browser test + commit**

Add to `ObrPartyRoster.test.tsx`: a GM-view case with one connected player and one binding for a disconnected player id → expect the STALE badge visible and "Clear" to fire the DELETE (mock). One render per `it`, `expect.element`, `BrowserTestProvider` (AGENTS.md rules).

Run: `cd frontend && npx tsc --noEmit && npm run lint && npm run test:unit && npm run test:browser -- ObrPartyRoster && npm run doctor`

```bash
git add frontend/src frontend/test
git commit -m "feat(obr): GM binding management — stale badges, assign and clear controls"
```

---

### Task 12: Frontend OBR module dedup

All confirmed dead or duplicated by grep; `toSelectionBindingState` and `getCurrentSelectionBindingState` have **zero external usages**.

**Files:**
- Modify: `frontend/src/obr/roomBinding.ts`
- Modify: `frontend/src/obr/tokenBinding.ts`
- Modify: `frontend/src/components/obr/useObrTokenBindingState.ts`
- Modify: `frontend/src/obr/contextMenu.ts`
- Modify: `frontend/src/components/obr/useObrRosterCards.ts`

- [ ] **Step 1: roomBinding.ts cuts**

- Delete `getCurrentSelectionBindingState` (lines 164-166) and `toSelectionBindingState` (lines 185-204) — dead exports.
- Reimplement `bindCurrentCharacterToSelection` as a delegate (delete its duplicated body):

```ts
export async function bindCurrentCharacterToSelection(input: {
  characterId: string;
  characterName: string;
}): Promise<{ count: number; tokenIds: string[]; metadataSynced: boolean }> {
  const actor = await getCurrentObrRoomActor();
  return bindRoomCharacterToSelection({
    roomId: actor.roomId,
    characterId: input.characterId,
    characterName: input.characterName,
    playerId: actor.playerId,
  });
}
```

- Drop the now-unused `CHARACTER_META_KEY` import and `SelectionBindingState`/`getSelectedTokenBindingState` imports if nothing else in the file uses them.

- [ ] **Step 2: single `EMPTY_SELECTION_STATE`**

In `tokenBinding.ts:17` change `const` to `export const`. In `useObrTokenBindingState.ts` delete the local copy and re-export for existing consumers (`ObrTokenBar.tsx` imports it from here):

```ts
export { EMPTY_SELECTION_STATE } from "@/obr/tokenBinding";
import { EMPTY_SELECTION_STATE, getSelectedTokenBindingState, type SelectionBindingState } from "@/obr/tokenBinding";
```

- [ ] **Step 3: contextMenu.ts**

Delete the local `getPlayerCharacterIdFromMetadata` (lines 127-137) and import the identical helper:

```ts
import { getCharacterIdFromMetadata } from "./roomBinding";
```

(`getCurrentPlayerCharacterId` calls it instead.)

- [ ] **Step 4: useObrRosterCards.ts de-cast**

- Replace the `roomId` state + `setRoomId(OBR.room.id)` with `const roomId = useObrRoomId();` (import from `@/hooks/useObrRoomId`).
- Delete the `PartyApiPlayer`/`ObrPartyApi`/`ObrPlayerApi`/`ObrSceneApi` types and every `(OBR as unknown as {...})` cast: use `OBR.party.onChange(...)`, `OBR.party.getPlayers()`, `OBR.scene.onReadyChange(...)` and the SDK `Player` type directly (`import OBR, { type Player } from "@owlbear-rodeo/sdk";`).
- Replace `getCurrentPlayer` (lines 402-428) with the existing adapter:

```ts
import { getCurrentObrRoomActor } from "@/obr/roomBinding";

async function getCurrentPlayer(): Promise<ObrConnectedPlayer | null> {
  const actor = await getCurrentObrRoomActor().catch(() => null);
  if (!actor || !actor.playerId.trim()) {
    return null;
  }
  return {
    id: actor.playerId,
    connectionId: actor.connectionId ?? null,
    name: actor.playerName ?? null,
    role: actor.role,
    connected: true,
  };
}
```

- `getConnectedPlayers(partyPlayers?: Player[])` keeps its merge logic but drops the API-existence guards (`partyApi?.getPlayers` etc. become direct calls with `.catch(() => [])`).

- [ ] **Step 5: Verify + commit**

Run: `cd frontend && npx tsc --noEmit && npm run lint && npm run test:unit && npm run test:browser && npm run doctor`
Expected: PASS — pure refactor, no behavior change.

```bash
git add frontend/src
git commit -m "refactor(obr): dedupe binding helpers, drop dead exports and SDK casts"
```

---

### Task 13: `useObrEnemies` → TanStack Query

Deletes the hand-rolled useState/refresh plumbing; broadcast becomes invalidate.

**Files:**
- Modify: `frontend/src/obr/useObrEnemies.ts` (rewrite; public API unchanged)
- Test: `frontend/test/browser/obr/useObrEnemies.test.tsx` (adapt to QueryClient)

**Interfaces:**
- Produces (unchanged, so no component edits): `useObrEnemies({ mode: "gm", roomId })` → `{ enemies, isReady, error, refresh, saveEnemy, deleteEnemy, updateEnemyHealth }`; `useObrEnemies({ mode: "player", roomId, characterId })` → `{ enemies, isReady, error, refresh }`.

- [ ] **Step 1: Rewrite the hook**

Replace the state/refresh core (keep `toEnemyInput`, `toError`, the overloads, and the mutation callbacks' broadcast behavior):

```ts
import { useQuery, useQueryClient } from "@tanstack/react-query";

const enemyKeys = {
  all: ["obr", "enemies"] as const,
  gm: (roomId: string) => ["obr", "enemies", "gm", roomId] as const,
  player: (roomId: string, characterId: string | null) =>
    ["obr", "enemies", "player", roomId, characterId] as const,
};
```

Inside the hook:

```ts
  const queryClient = useQueryClient();
  const [isReady, setIsReady] = useState(false);

  const queryKey =
    mode === "gm" ? enemyKeys.gm(roomId) : enemyKeys.player(roomId, characterId);

  const query = useQuery<ObrEnemyView[]>({
    queryKey,
    queryFn: () =>
      mode === "gm"
        ? fetchEnemiesFull(roomId)
        : characterId
          ? fetchEnemyCards(roomId, characterId)
          : Promise.resolve(EMPTY),
    enabled: isReady && roomId.length > 0 && (mode === "gm" || characterId !== null),
  });

  const refresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: enemyKeys.all });
  }, [queryClient]);

  useEffect(() => {
    let active = true;
    let unsubscribe: (() => void) | null = null;
    OBR.onReady(() => {
      if (!active) return;
      setIsReady(true);
      unsubscribe = OBR.broadcast.onMessage(OBR_ENEMIES_CHANNEL, (event) => {
        if (isObrEnemiesBroadcast(event.data)) {
          void queryClient.invalidateQueries({ queryKey: enemyKeys.all });
        }
      });
    });
    return () => {
      active = false;
      unsubscribe?.();
    };
  }, [queryClient]);
```

Mutations keep their shape but end with `await refresh(); await broadcastEnemiesChanged();`. Return `enemies: (query.data ?? EMPTY) as ...`, `error: query.error ? toError(query.error) : null`.

- [ ] **Step 2: Adapt the test**

`useObrEnemies.test.tsx`: wrap renders in the existing `BrowserTestProvider` (it provides a QueryClient; if it doesn't, wrap in a fresh `QueryClientProvider` with retries off). Behavior assertions (fetch on ready, refetch on broadcast, gm vs player payloads) stay the same.

Run: `cd frontend && npm run test:browser -- useObrEnemies`
Expected: PASS.

- [ ] **Step 3: Full frontend gate + commit**

Run: `cd frontend && npx tsc --noEmit && npm run lint && npm run test:browser && npm run doctor`

```bash
git add frontend/src/obr/useObrEnemies.ts frontend/test/browser/obr/useObrEnemies.test.tsx
git commit -m "refactor(obr): move enemy roster to TanStack Query"
```

---

### Task 14: One home for OBR hooks + typed bindings client

**Files:**
- Move: `frontend/src/components/obr/useObrRosterCards.ts` → `frontend/src/obr/useObrRosterCards.ts`
- Move: `frontend/src/components/obr/useObrTokenBindingState.ts` → `frontend/src/obr/useObrTokenBindingState.ts`
- Move: `frontend/src/hooks/useObrRoomId.ts` → `frontend/src/obr/useObrRoomId.ts`
- Move: `frontend/src/hooks/useObrSession.ts` → `frontend/src/obr/useObrSession.ts`
- Modify: `frontend/src/api/obr.ts`, `frontend/src/api/schema.ts` (regenerated)

- [ ] **Step 1: Move the four hooks**

`git mv` each file, then fix every import site (`Grep` for `hooks/useObrRoomId`, `hooks/useObrSession`, `components/obr/useObrRosterCards`, `components/obr/useObrTokenBindingState` → `@/obr/...`). `src/obr/` is now the single OBR adapter + hook home.

- [ ] **Step 2: Regenerate the OpenAPI client and type the bindings calls**

Requires the backend (with Tasks 2-8 merged) running locally: `cd backend && npm run dev`, then `cd frontend && npm run generate-api`.

In `frontend/src/api/obr.ts`:
- Replace `obrClient.GET<ObrRoomBindings>(...)`/`PUT`/`DELETE` template-string calls with typed `client.GET("/api/obr/rooms/{roomId}/bindings", { params: { path: { roomId } } })` etc.; delete the `UntypedApiClient` cast and the hand-written `ObrPlayerCharacterBinding`/`ObrTokenCharacterBinding`/`ObrRoomBindings` types in favor of `paths[...]`-derived aliases.
- Delete the unused `_locale` parameter of `fetchObrRoomBindings` and drop `locale` from `obrKeys.bindings` (bindings are locale-independent): `bindings: (roomId: string) => ["obr", "rooms", roomId, "bindings"] as const;` — update the two call sites in `useObrRosterCards.ts` (queryKey + `invalidateRosterQueries`).

- [ ] **Step 3: Verify + commit**

Run: `cd frontend && npx tsc --noEmit && npm run lint && npm run test:unit && npm run test:browser && npm run doctor`

```bash
git add -A frontend/src frontend/test
git commit -m "refactor(obr): consolidate OBR hooks under src/obr, type the bindings client"
```

---

### Task 15: Documentation sweep

All stale docs from the review, plus recording the decisions this plan implements.

**Files:**
- Modify: `CLAUDE.md` (security table + frontend structure)
- Modify: `AGENTS.md` (frontend structure listing)
- Modify: `changelog/backend.md`
- Modify: `docs/owlbear-room-portability-and-verification.md` (addendum)
- Modify: `docs/superpowers/plans/2026-06-30-owlbear-room-bindings.md` (tick delivered tasks)

- [ ] **Step 1: CLAUDE.md security table**

Replace the "OBR card reads" row with:

```markdown
| OBR room access | Room-scoped reads are gated by the **(roomId, characterId) binding tables** (`ObrPlayerCharacterBinding`/`ObrTokenCharacterBinding`): `GET /api/obr/rooms/:roomId/cards` returns table-visible cards only for bound ids; binding writes require a session and owner-or-already-in-room. **Accepted room-trust residual (2026-07-01):** the unguessable OBR room id is a capability — anyone holding it can list bindings/bound cards, manage that room's enemy board (`/api/parties/by-room/:roomId/*`), and read the room party roster via `POST /api/parties/promote`. The party **invite token stays owner-only** (non-owners get a token-less view); a signed-in GM can claim a system-owned (`system:obr-room`) room party; party attach/detach is owner-only. | Accepted |
```

- [ ] **Step 2: Frontend structure docs**

In both CLAUDE.md and AGENTS.md frontend-structure listings, add:

```
├── obr/            # Owlbear Rodeo extension adapter: SDK glue, room/token bindings, OBR hooks
```

- [ ] **Step 3: changelog/backend.md**

- Delete the `GET /cards` bullet (lines 25-31) and the `POST /:id/obr-room` bullet (lines 36-37) from the Characters section.
- Add an **OBR (`/api/obr`)** section documenting: `GET /rooms/:roomId/cards` (pair-gated safe cards), `GET /rooms/:roomId/bindings` (room-trust), `PUT`/`DELETE` player and token binding routes (session + owner-or-in-room, idempotent deletes, rate-limited).
- In the Parties section add: `POST /promote` hybrid semantics (owner → manage view, others → token-less view, GM claims system-owned), `POST /:id/attach-room`, `POST /:id/detach-room`, and the room-trust enemy board under `/by-room/:roomId/enemies*`.

- [ ] **Step 4: Portability doc addendum**

Append to `docs/owlbear-room-portability-and-verification.md`:

```markdown
## Addendum — 2026-07-01 revision (review follow-up)

D1/D4/D5 are relaxed to the **hybrid trust model** shipped with the room-binding
module: the enemy board and binding listings are **room-trust** (the unguessable
room id is the capability, so anonymous OBR GMs keep working), while the party
invite token and manage/attach/detach operations remain owner-only. A signed-in
GM can claim a room party auto-created under the `system:obr-room` owner.
"Stale flags" from the bindings plan are computed client-side (the backend
cannot observe OBR connectivity). D2 attach/detach shipped as
`POST /api/parties/:id/attach-room` / `detach-room`.
```

- [ ] **Step 5: Tick the room-bindings plan + commit**

Mark Tasks 1-8 checkboxes done in `2026-06-30-owlbear-room-bindings.md` (all are delivered once this plan lands).

```bash
git add CLAUDE.md AGENTS.md changelog/backend.md docs
git commit -m "docs: record hybrid OBR trust model, refresh backend changelog and structure docs"
```

---

## Final Validation Gate

- [ ] `cd backend && npm run test:unit`
- [ ] `cd backend && npm run test:integration`
- [ ] `cd frontend && npx tsc --noEmit && npm run lint`
- [ ] `cd frontend && npm run test:unit && npm run test:browser`
- [ ] `cd frontend && npm run doctor`
- [ ] Manual smoke in OBR (dev room): promote as anonymous → board works, no invite link; sign in → claim → invite link appears; bind/unbind token twice (second unbind must not error); enemy CRUD as anonymous GM.
