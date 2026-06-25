# Party — Phase 1 Implementation Plan (backend model + flows, no realtime)

Spec: `docs/superpowers/specs/2026-06-18-party-system-design.md`. Scope: **backend only**, no SSE, no frontend. One commit (or a small few) on the chosen branch. Gate before commit: `cd backend && npm run build:ts && npm test && npm run test:integration`.

## House patterns to mirror (do not invent new ones)
- **Layering:** route (thin) → `*-service.ts` (logic, returns `ServiceResult<T>`) → `*-repository.ts` (only Prisma). See `character-service.ts`, `character-repository.ts`, `services/result.ts`, `errors.ts`.
- **Errors:** build domain failures with `badRequest/conflict/notFound/unauthorized/apiError`; wrap unexpected via `unexpected(log, e, CODE, msg)`. Controllers translate via `sendServiceError(reply, request, error)`; 5xx re-thrown by the helper.
- **Session/authz:** service takes `session: request.appSession` (`{ session, user }`). A caller **owns** a character if `character.userId === session.user.id` (account) **or** `character.sessionId === session.session.id` (anonymous) — mirror exactly how `character-service.ts` checks ownership (it already handles both). A **GM** = `session.user` present and `isAnonymous !== true`.
- **Repository singletons** exported like `characterRepository`.

## Tasks

### T1 — Prisma schema + migration
- Add `Party` model (per spec): `id uuid pk`, `name varchar(120) default 'Untitled Warband'`, `ownerUserId` → `User` (`onDelete: Cascade`), `inviteToken @unique`, timestamps, `@@index([ownerUserId])`, `@@map("parties")`.
- `User` gets `parties Party[]`. `Character` gets `partyId String? @db.Uuid` (FK → `Party`, `onDelete: SetNull`), `joinedAt DateTime?`, `party Party? @relation(...)`, `@@index([partyId])`.
- `npx prisma migrate dev --name add_party` (generates `prisma/migrations/<ts>_add_party/migration.sql`). **Do not** touch `backend/init/` or `backend/migrations/`.
- `npx prisma generate`.

### T2 — Earmark legacy (doc-only)
- Add `backend/init/README.md`: DEPRECATED — superseded by Prisma migrations; applied by no environment (prod/canary/dev all run `prisma migrate deploy`); kept for historical reference; the live search infra now lives in `prisma/migrations/20260603000000_init_full`. Verify each subfolder is off the live path before asserting it (it is — `scripts/migrate.js` is invoked nowhere live).
- Prepend a DEPRECATED banner to `backend/migrations/README.md` (custom runner retired).

### T3 — `party-repository.ts`
Prisma-only. Functions: `createParty({ownerUserId, name, inviteToken})`; `listPartiesByOwner(ownerUserId)`; `getPartyById(id)` (+ members, ordered by `joinedAt`); `getPartyByInviteToken(token)`; `getCharacterForJoin(characterId)` → `{id, userId, sessionId, partyId}`; `countMembers(partyId)`; `setCharacterParty(characterId, partyId|null)` (sets/clears `joinedAt` too); `rotateInviteToken(id, token)`; `renameParty(id, name)`; `deleteParty(id)`. Provide a transactional `joinInTransaction({characterId, partyId, cap})` that re-counts inside the tx and throws a sentinel when full (service maps to 409) so concurrent joins can't exceed cap.

### T4 — `party-service.ts` (all invariants here)
Token gen: `crypto.randomBytes(16).toString('base64url')`. `PARTY_MAX_MEMBERS` from env (default 10), read once.
- `createParty(session, {name})` → must be GM (account, non-anon) else `unauthorized`; create with fresh token; return `{party, invitePath: '/join/' + token}`.
- `listParties(session)` → GM's parties (each with member count); non-GM → `unauthorized`.
- `getParty(session, id)` → `notFound` if missing; if caller is owner → manage payload (members + token/invitePath); else if caller owns a member char in it → read payload (members, no token); else `notFound` (don't leak existence).
- `regenerateLink(session, id)` → owner only (else `notFound`/`forbidden`); rotate; return new invitePath.
- `renameParty(session, id, {name})` → owner only.
- `disbandParty(session, id)` → owner only; delete (members SetNull).
- `joinParty(session, {token, characterId})` → resolve by token, invalid → `apiError(410,...)`; caller owns `characterId` else `forbidden`; caller is party owner → `forbidden` (GM doesn't play); already in this party → idempotent `ok`; in another party → `conflict`; cap exceeded (in tx) → `conflict`; else bind, return `{partyId, redirect: '/party/'+id+'/character/'+characterId}`.
- `leaveParty(session, id, {characterId})` → caller owns char and it's in this party → unbind; else `forbidden`/`notFound`.
- `kick(session, id, {characterId})` → caller is owner and char is in this party → unbind; else `forbidden`/`notFound`.

### T5 — Routes `src/routes/parties/index.ts` + schemas
Thin controllers per the endpoint table in the spec; JSON schema for params/bodies; `session: request.appSession`; `sendServiceError` on `!result.ok`. Autoloaded like other route groups. No Prisma, no logic in the route.

### T6 — Tests
- **Unit** (`test/` mirroring existing service tests, mocked repository) — assert each invariant: create requires GM; join invalid-token→410, non-owner→403, GM-joins-own→403, already-in-this→idempotent, in-another→409, cap-full→409, happy path binds; leave/kick authz; regenerate owner-only + token changes. Cover anonymous-owner join (sessionId path).
- **Integration / e2e** — the GM party flows need the `/test/users` fixture, which **only exists where `ENABLE_TEST_ROUTES=1`**. That is the **e2e** env (`compose.e2e.yaml`), NOT `integration-be` (which is deliberately prod-like with test routes OFF and even has a security test asserting `/test/*` → 404). **Follow-up (separate task):** add party flow coverage — full lifecycle (create→join→owner/member views→kick→leave→regenerate→disband) plus the **cap concurrency proof** (burst of `cap+N` joins via real accounts → exactly `cap` bind, surplus 409, roster never exceeds cap) — as an **e2e Playwright spec** under `backend/tests/e2e/`. A node:test version was drafted in Phase 1 commit `5db4b33` (recoverable from history) but was misplaced in `integration-be` and removed. Until then, Phase 1 correctness rests on the 42 unit tests (all invariants, incl. the anon-owner path) + the advisory-lock cap guard (correct by construction: a per-party `pg_advisory_xact_lock` serializes joins).

## Out of scope (later phases)
SSE/emit (P2), any frontend (P3), guild mock (P4). Do **not** add emit calls yet, but leave service methods structured so P2 can drop `partyBus.publish(...)` in at the join/leave/kick/regenerate/disband points and after character PATCH.

## Open for confirmation
- **O2 — branch:** continue on `feature/party-view` or cut `feature/party-backend` off it.
