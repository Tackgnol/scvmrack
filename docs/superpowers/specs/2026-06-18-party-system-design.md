# Party System — Design Spec

**Status:** Approved (brainstorming complete) · **Branch:** `feature/party-view` (or fresh branch off it)
**Date:** 2026-06-18 · **Supersedes:** the iteration-1/2 assumption that "party = a user's own saved characters"

---

## Progress Tracker

Update the boxes and the status column as work lands. Each phase is one (or a few) commits; every phase runs the full gate (tsc / lint / unit / browser / react-doctor) before its commit.

| Phase | Scope | Status |
|---|---|---|
| P1 | Party model + flows (backend, no realtime) | ✅ Done (`5db4b33`, `45afe4d`) — build + 42 unit tests green; review P0 (cap race) fixed; integration → e2e follow-up |
| P2 | SSE realtime | ✅ Implemented (`4a98344`) — bus/service/SSE/hook unit coverage green; visual pulse in PartySheetPill. Live e2e of the SSE frame still nice-to-have |
| P3 | Frontend — GM dashboard, join flow, player view, delete modal | ✅ Implemented + verified (`4a98344`); browser tests for the new pages (`2ea3247`); **e2e proves cross-account join** GM↔player (`a44884b`). i18n en/pl in sync. Optional `$impeccable` pass on `/gm` + main page still pending |
| P4 | Guild mock | ✅ Done — "Invite guild members" mock + coming-soon notice + "What are guilds?" → `rpgtools.co/guilds` on the GM manage view; i18n en/pl in sync; browser test. tsc/lint/browser green |

### Phase 1 — Party model + flows (backend)
- [x] **Migration mechanism settled (O1): Prisma-only.** Every env runs `prisma migrate deploy` (prod `deploy.yaml:197`, canary `deploy-dev.yaml:219`, dev `compose.dev.yaml`). The Prisma `init_full` migration already owns the full live schema (extensions, search indexes, `item_search` view). `scripts/migrate.js`, `backend/migrations/*.sql`, and `backend/init/` are invoked by nothing live — legacy.
- [ ] Prisma: `Party` model + `Character.partyId` / `joinedAt` + indexes; `prisma migrate dev --name add_party` (do NOT touch `init/` or `backend/migrations/`)
- [ ] **Earmark legacy** (per user): add a clear DEPRECATED note to `backend/init/README.md` + `backend/migrations/README.md` stating they are superseded by Prisma migrations and applied by no environment; verify each `init/` subfolder is truly off the live path before labeling (search infra now lives in the Prisma migration). Doc-only, low risk.
- [ ] `party-repository.ts` (Prisma only)
- [ ] `party-service.ts`: create / list / get / join / leave / kick / regenerate-link / disband
- [ ] Invariants in service: cap (`PARTY_MAX_MEMBERS`, default 10), ownership authz, GM-can't-join-own, token-invalid → 410, already-in-another-party → 409, idempotent rejoin, cap race in a transaction
- [ ] Routes `src/routes/parties/index.ts` (thin controllers) + JSON schemas
- [ ] `PARTY_MAX_MEMBERS` env wired + documented
- [ ] Unit tests (mocked repo) for every invariant; integration test for routes

### Phase 2 — SSE realtime
- [x] `partyBus` Fastify plugin — in-memory `Map<partyId, Set<handler>>` behind `PartyEventBus` interface
- [x] `GET /api/parties/:id/stream` — authz (GM or member), `text/event-stream`, heartbeat ~25s, unsubscribe on close
- [x] Emit in `character-service` PATCH success → `{type:'character.updated', characterId, fields}` from patch keys (only if `partyId`)
- [x] Emit in `party-service` → `character.joined` / `character.left` / `character.kicked` / `party.linkRotated` / `party.closed`
- [x] `usePartyStream(partyId, {enabled})` — native `EventSource`, refetch on events, full roster refetch on (re)connect
- [ ] P3 follow-up: field-pulse animation driven by `fields`; `prefers-reduced-motion` → update without pulse
- [x] Unit coverage: in-memory bus + client stream hook event handling
- [ ] Follow-up e2e coverage: authenticated subscribe → PATCH → assert frame in the e2e stack (not integration-be)

### Phase 3 — Frontend
- [ ] `/gm` dashboard: list owned parties + "Create party" (auth-gated)
- [ ] `/party/$partyId` route + guard (GM → manage view; member → redirect to own char URL; neither → 404)
- [ ] GM manage view: invite link + copy, members list with kick, "Generate new link", (guild mock slot)
- [ ] `/party/$partyId/character/$characterId` — reuse `CharacterSheet` (editable if owner, read-only otherwise) + party pill
- [ ] Party pill → read-only roster (reuse Vital Strip / card rendering, fed by real members) → navigate to any member
- [ ] `/join/$token` — carry token (stash + route), CTA → `POST /api/parties/join`, redirect to party-scoped char URL
- [ ] Redirect rule: character with `partyId` rewrites `/character/$id` → `/party/$partyId/character/$id`
- [ ] Party-aware delete/kill modal: (a) replacement rejoins party, (b) plain new char, (c) delete
- [ ] Main page: GM entry point (link/button to `/gm`)
- [ ] i18n en + pl in sync
- [ ] Browser tests (manage controls, join CTA, pill roster, read-only gating, redirect, delete modal); join-carry unit test
- [ ] (Optional) `$impeccable` pass on `/gm` + main page

### Phase 4 — Guild mock
- [x] "Invite guild members" mock button on the GM manage view (no real Logto-org call) — opens a coming-soon notice
- [x] "What are guilds?" → `rpgtools.co/guilds` (404 for now)
- [x] i18n en + pl; browser test

---

## Understanding Summary

A real, shared **Party** becomes a backend entity. A logged-in GM creates parties and shares an invite link; players (logged-in or anonymous) bind **one character** (not the user) to a party via that link. Party/GM views are read-only for *others'* characters; the owner still edits their own character (which now lives at a party-scoped URL). Per-character changes propagate live over SSE, pulsing the specific stat that moved. Guild invites are a non-functional mock for now.

**Why:** a GM can run a table and watch the warband's live state; players watch the shared party without editing from these surfaces.

**Who:** GMs (Logto accounts) who own parties; players (logged-in or anonymous) who bind a character.

**Non-goals (v1):** GM playing a character in their own party; membership history; multi-instance SSE fan-out; real Logto-org guild integration; per-player single-use invite codes.

---

## Assumptions

- **A2.** A party has a GM-set `name` (default "Untitled Warband").
- **A4.** Anonymous join uses the existing anonymous Better-Auth session bootstrap; session ownership of the character authorizes the bind. Membership rides on the character, so the existing `onLinkAccount` ownership transfer keeps a char in its party through an anon→account upgrade.
- **A6.** `inviteToken` = opaque ~128-bit random string, distinct from the party id.

---

## Decision Log

| # | Decision | Alternatives considered | Why |
|---|----------|-------------------------|-----|
| 1 | Party owner = logged-in account only | anonymous owner; hybrid | Durable owner for kick/regenerate; guild/org invites only apply to accounts; GM screen already auth-gated |
| 2 | Membership = nullable `Character.partyId` FK (+ `joinedAt`); one party per character | join table; join table + service constraint | Leanest schema, matches "the character joins the party"; YAGNI on history |
| 3 | One rotating opaque `inviteToken` per party; `/join/<token>` | per-player single-use codes; token + auto-expiry | Matches "one link the GM sends"; "generate new link" = rotate |
| 4 | FE carries token; explicit `POST /parties/join {token, characterId}`, authz by char ownership | server-side pending-join; auto-bind | Stateless BE; nothing auto-binds behind the user's back |
| 5 | SSE = invalidation signal + `changedFields` hint + membership events | full payload; pure invalidation; JSON-patch | Decoupled + reuses existing hydration/cache, yet enables per-stat pulse animation |
| 6 | Stream/roster access = GM + current members only; member scoped by `characterId` | anyone with URL; + token-holder preview | Privacy; ownership-based authz consistent with the app |
| 7 | Many parties per GM (`ownerUserId` non-unique) | one party per GM | Supports multiple campaigns; `/gm` = list + create |
| 8 | Single instance → in-memory pub/sub behind a swappable interface; **future shard = Redis pub/sub** | Postgres LISTEN/NOTIFY; Redis now | YAGNI now; Redis is fire-and-forget (matches no-replay model), self-hosted RAM-only, avoids PgBouncer/LISTEN traps. Prisma can't `LISTEN` anyway |
| 9 | Reuse `CharacterSheet` at `/party/$id/character/$id` + party pill; characters in a party redirect plain `/character/$id` → party URL | new card component; separate read-only sheet | Reuses existing component; minimal new state |
| 10 | Owner edits own char on party URL; others/GM read-only; SSE propagates | fully read-only; read-only + Edit toggle | Reconciles "reuse CharacterSheet" + "always redirect" with the read-only requirement |
| 11 | `/gm` rows → `/party/$partyId` (GM-guarded manage); non-GM member redirected to own char URL | manage under `/gm/$id` | User preference; single party URL space with a guard |
| 12 | GM doesn't play in own party (v1) | GM may join via own link | Scope |
| 13 | Delete/kill modal is party-aware: replacement-rejoins-party / plain new char / delete | plain delete | The tricky interaction the user called out |
| 14 | Member cap = `PARTY_MAX_MEMBERS` env (default 10), enforced in service | unlimited; hardcoded | Backend invariant; configurable |
| 15 | Guild invite = non-functional mock; "What are guilds?" → `rpgtools.co/guilds` | build real Logto-org now | Defer integration |
| 16 | One branch, phased commits | one big PR; separate branches | Reviewable increments |

---

## Final Design

### Data model (Prisma)

```prisma
model Party {
  id          String   @id @default(uuid()) @db.Uuid
  name        String   @default("Untitled Warband") @db.VarChar(120)
  ownerUserId String   @map("owner_user_id")
  inviteToken String   @unique @map("invite_token")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt      @map("updated_at")
  owner       User        @relation(fields: [ownerUserId], references: [id], onDelete: Cascade)
  members     Character[]
  @@index([ownerUserId])
  @@map("parties")
}
```
`Character` gains: `partyId String? @db.Uuid` (FK → `Party`, `onDelete: SetNull`), `joinedAt DateTime?`, `@@index([partyId])`. Deleting a party → members unbind (SetNull). Deleting the GM account → cascade parties → members unbind.

### API surface (routes → service → repository)

| Method | Path | Who | Purpose |
|---|---|---|---|
| `POST` | `/api/parties` | GM | create (name) → party + invite URL |
| `GET` | `/api/parties` | GM | list parties I own |
| `GET` | `/api/parties/:id` | GM or member | party + roster (GM: manage data; member: read view) |
| `PATCH` | `/api/parties/:id` | GM | rename (optional in P1) |
| `POST` | `/api/parties/:id/regenerate-link` | GM | rotate `inviteToken` |
| `DELETE` | `/api/parties/:id` | GM | disband |
| `POST` | `/api/parties/join` | char owner | `{token, characterId}` → bind (cap-checked) |
| `POST` | `/api/parties/:id/leave` | char owner | `{characterId}` → unbind own char |
| `POST` | `/api/parties/:id/kick` | GM | `{characterId}` → unbind a member |
| `GET` | `/api/parties/:id/stream` | GM or member | SSE (P2) |

### Flows

**Join** (`POST /api/parties/join {token, characterId}`):
1. Resolve party by `inviteToken`; invalid/rotated → **410 Gone**.
2. Caller owns `characterId` (session or user) → else **403**.
3. Caller is the party's GM → **403** (GM doesn't play, v1).
4. Char already in *this* party → idempotent **200**. In *another* → **409** (FE offers leave+rejoin).
5. Member count `>= PARTY_MAX_MEMBERS` → **409** ("party is full"). Count+insert in a transaction (no overflow under concurrency).
6. Set `partyId` + `joinedAt`; emit `character.joined`; return redirect target `/party/:id/character/:characterId`.

**Leave** (`POST /:id/leave {characterId}`): caller owns char, char in this party → null `partyId`/`joinedAt`; emit `character.left`.
**Kick** (`POST /:id/kick {characterId}`): caller is GM → null member's `partyId`; emit `character.kicked`.
**Regenerate** (`POST /:id/regenerate-link`): GM → new `inviteToken`; emit `party.linkRotated`. Members unaffected; only un-redeemed links die.

### SSE

`PartyEventBus` interface (`publish(partyId, event)`, `subscribe(partyId, handler) → unsubscribe`). P1-of-P2 impl: in-memory `Map<partyId, Set<handler>>`, synchronous fan-out; SSE connections subscribe and unsubscribe on close; heartbeat comment ~25s. Future shard = Redis pub/sub adapter (same interface). Prisma is untouched by the bus (Prisma cannot `LISTEN`).

`GET /api/parties/:id/stream`: authz GM-or-member; `text/event-stream`, `Cache-Control: no-store`, `X-Accel-Buffering: no`. Same-origin session cookie carries auth (EventSource can't set headers); GET so no CSRF.

Events: `character.updated {characterId, fields}` (fields = PATCH top-level keys), `character.joined|left|kicked {characterId}`, `party.linkRotated`, `party.closed`.

Client `usePartyStream(partyId, {enabled})`: native `EventSource`; on `character.updated` invalidate that char's query + stash `fields` to pulse the matching stat (reduced-motion → no pulse); on membership/link/closed → invalidate roster / refresh link / exit; on (re)connect → full roster refetch.

### Frontend routing

- `/gm` → GM dashboard (owned parties + create), auth-gated.
- `/party/$partyId` → guard: GM → manage view; member → redirect to `/party/$partyId/character/$theirCharId`; neither → 404.
- `/party/$partyId/character/$characterId` → reuse `CharacterSheet` (editable if owner, else read-only) + party pill (pill → read-only roster → navigate to any member).
- `/join/$token` → carry token; logged-in → `/characters` pick/create; anonymous → main page make/roll; "Join party" CTA → `POST /parties/join` → redirect.
- Redirect rule: a character with `partyId` rewrites `/character/$id` → `/party/$partyId/character/$id`.

### Party-aware delete/kill modal

When the character being deleted is in a party, offer: (a) **roll a replacement that rejoins the same party** (chains delete → generate → join behind one confirm), (b) plain new character, (c) just delete.

### Error handling & edge cases

- Invalid/rotated token → 410; cap reached → 409; non-owner / GM-joins-own → 403.
- Char deleted while in party → SetNull unbinds + delete service emits `character.left`.
- Party disbanded / GM account deleted → SetNull/cascade unbinds + `party.closed` so member views exit gracefully.
- Anon→account upgrade → membership persists (rides the character).

### Testing strategy

Per-phase, as in the Progress Tracker. Core backend invariants are unit-tested with a mocked repository; routes get an integration test; SSE gets a subscribe→PATCH→frame integration test; frontend gets browser tests for the manage controls, join CTA, pill roster, read-only gating, redirect rule, and the party-aware delete modal.

---

## Open Items (resolve at implementation)

- **O1. RESOLVED — Prisma-only.** Every env runs `prisma migrate deploy` (prod/canary CI + dev compose). Prisma's `init_full` migration owns the full live schema (extensions, fuzzy indexes, `item_search` view). `scripts/migrate.js`, `backend/migrations/*.sql`, and `backend/init/` are invoked by nothing live = legacy. `Party` ships as `prisma/schema.prisma` model + `prisma migrate dev --name add_party`; do not touch `init/` or `backend/migrations/`. Phase 1 also earmarks those legacy dirs as DEPRECATED.
- **O2.** Branch: continue on `feature/party-view` or cut a fresh branch off it.
- **O3.** Exact pill visual treatment (reuses Vital Strip/cards) — settle during P3, optionally via `$impeccable`.
