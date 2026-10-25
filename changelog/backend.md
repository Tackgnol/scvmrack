# Backend — Feature Summary

- The app should no longer leave a newly joined scvm in an Owlbear party when the GM removes it from a stale roster. Room removal, normal kick and self-leave clear membership and active bindings together. (RPG-336)
- The app should no longer transfer an account when someone opens a crafted Owlbear sign-in link. Registered handoffs require explicit approval of the displayed account and can be redeemed only once by the initiating extension. (RPG-323)

`scvmgrinder_be` — Fastify 5 + TypeScript API for the MÖRK BORG character sheet.

- The app should no longer refuse cleanup of an existing Owlbear room binding when the room's signed-in GM removes a former party member. Recovery is limited to deleting bindings in that GM's attached room.
- Release smoke checks should no longer flag safe Logto sign-in as a failure when the legacy callbackURL parameter is ignored. Checks validate the trusted provider and callback; completed shared-auth callback tests cover local and external return targets.

- The app should no longer reject a first Logto sign-in when the account has a preferred username. New accounts can sign in and keep their profile name.
- The app should no longer turn an explicit Classless Owlbear roll into a random class when the room permits Classless. Quick rolls boost two random abilities, and rooms that disable Classless reject the request.

## Custom Classes (0.7.0)

- Owner-only Custom Class drafts, explicit saves, immutable versions for used classes, archive/restore, and configurable account/daily-public-class limits
- Party Class Pools drive the classes that a party and its Owlbear room can roll
- The app should no longer reject new token or player bindings when the signed-in GM owns the party attached to that Owlbear room. Creating bindings is limited to that party's members and does not grant access to unrelated characters or rooms.
- Public class discovery and read-only details, signed-out reports, rate limits and honeypot protection, human moderation, GM removal history, user-based creation bans, takedown disputes, admin restoration, and two-year reporter-detail anonymization
- Book Class omen rolls follow the printed book: Esoteric Hermit and Heretical Priest use d4; the other Book Classes use d2

## Stack

- **Runtime:** Fastify 5.x (ESM, TypeScript), autoloaded plugins & routes
- The backend should no longer reuse an outdated Node 22 base when dev images are rebuilt. Build, runtime and CI images pin Node 22.23.4.
- **Database:** PostgreSQL via Prisma 6 with the `@prisma/adapter-pg` driver adapter
- **Auth:** `@tackgnol/rpgtools-shared-auth` (Better Auth sessions + Logto OIDC)
- **Observability:** Sentry / GlitchTip (`@sentry/node`)
- **Docs:** `@fastify/swagger` + Swagger UI (disabled in production)

## API surface

All application routes are mounted under the `/api` prefix.

### Characters (`/api/characters`)

- `POST /new` — generate a new random character or confirm a seeded creation
  draft (TypeScript generator); with `?invite=` the draft is forged into that
  party in one transaction (a full party, rotated invite or class gone from the
  pool creates nothing)
- `GET /classes` — the classes a roll may use: the `?invite=` party's Party
  Class Pool, or Book Classes without one
- `POST /draft` — build or rehydrate a stateless draft preview without a DB write
  (scoped by `?invite=` like `/classes`; Random picks evenly, never Classless)
- `POST /draft/reroll/:section` — replace one draft section seed and rebuild the
  preview
- `GET /` — list characters owned by the current session user (optional `locale` query param; falls back to `Accept-Language`)
- `GET /count` — total character count
- `GET /:id` — fetch a localized character (`get_character_full(id, locale)`)
- `POST /:id/improvements/preview` — get or create an idempotent active
  Getting Better preview for the owner
- `POST /:id/improvements/:improvementId/reroll/:section` — reroll one Getting
  Better preview section or the full preview without applying character changes
- `POST /:id/improvements/:improvementId/apply` — validate a submitted Getting
  Better draft, reject stale snapshots, and atomically apply max HP, silver,
  ability, equipment, and class-ability changes (gained abilities bring their
  item and pet grants)
- `PATCH /:id` — update a character (plain-text sanitization, length limits, bounds clamping)
- `DELETE /:id` — delete a character (ownership-enforced)
- `POST /:id/improvements/preview` — roll a Getting Better preview (pure rule
  engine in `src/lib/getting-better.ts`); idempotent, backed by a
  `CharacterImprovement` row with a partial unique index enforcing at most one
  active preview per character
- `POST /:id/improvements/:improvementId/reroll/:section` — reroll one section
  of an active preview
- `POST /:id/improvements/:improvementId/apply` — apply an active preview to
  the character

### Equipment (`/api/equipment`)

- `GET /search` — fuzzy, locale-aware item search (PostgreSQL trigram indexes)
- `GET /:itemType/:id` — fetch a full item by type and id
- The app should no longer hide Torch or Lantern use controls when an existing
  database retains outdated ammo labels. Deployments repair the catalog and
  affected inventory/storage entries while preserving their uses and quantities.

### OBR (`/api/obr`)

Room-scoped Owlbear Rodeo bindings, backed by the `ObrPlayerCharacterBinding`/
`ObrTokenCharacterBinding` tables — the durable replacement for the old
`Character.obrRoomId` pointer.

- `GET /rooms/:roomId/cards` — compact, table-visible character cards for the
  roster and card peek; includes combat targets, armor DR data, equipped
  weapons, narrowed carried equipment, traits, and computed modifiers, while
  private notes, storage, and full inventory are not returned. Pair-gated: a
  card is only returned when the requested `roomId` has a durable binding to
  that character id
- `GET /rooms/:roomId/bindings` — list a room's player and token character
  bindings. Room-trust: the unguessable room id is the capability, no session
  required
- `PUT`/`DELETE /rooms/:roomId/players/:playerId/character` — bind/clear an
  Owlbear player's active scvm; session required, caller must own the
  character or the character must already be bound in this room. Deletes are
  idempotent (clearing an already-cleared binding succeeds)
- `PUT`/`DELETE /rooms/:roomId/tokens/:tokenId/character` — bind/clear a scene
  token's scvm under the same session + owner-or-in-room gate, idempotent
  deletes
- Binding writes are rate-limited
- The shared-auth `obr-exchange` bridge is opted into anonymous token issue
  (`obrExchange: { allowAnonymousIssue: true }`), so an anonymous OBR session
  can hand its identity to a new top-level tab via `/api/auth/obr-exchange/issue`
  + `/api/auth/obr-exchange/redeem`. Redeeming carries session identity only;
  character ownership never transfers

### Parties (`/api/parties`)

- `POST /` — GM creates a party; `GET /` — list parties the GM owns
- `POST /promote` — promotes an Owlbear Rodeo room into a durable scvmrack
  party, idempotently keyed by `obrRoomId`, with hybrid trust semantics: the
  owning GM gets the manage view (invite token included), any other caller
  gets a token-less read view, and a signed-in GM can claim a room party that
  was auto-created under the system owner (`system:obr-room`) by an earlier
  anonymous session
- `POST /:id/attach-room` — re-point an owned party at a new Owlbear room
  (owner-only, 409 if the room is already linked to another party)
- `POST /:id/detach-room` — clear an owned party's Owlbear room pointer (owner-only)
- `GET /:id` — party detail (role, members); `PATCH /:id` — rename; `DELETE /:id` — disband
- `POST /join` — bind a character to a party via an invite token
- `POST /:id/regenerate-link` — rotate the invite token
- `POST /:id/replace-member` / `/leave` (character owner) and `/kick` (GM)
- `GET /:id/stream` — Server-Sent-Events feed of member/HP/presence changes,
  served over the shared-auth credentialed fetch path
- `/by-room/:roomId/enemies*` — the room-trust enemy board (list/create/update/
  health-step/delete plus a safe player-card projection). Gated purely by the
  OBR room id resolving to a promoted party — no session required, so
  anonymous OBR GMs can run enemies

### Feedback (`/api/feedback`)

- `POST /` — forward a user feedback **or** unexpected-error report to GlitchTip
  server-side. Error reports capture the exception first and associate it with the
  feedback event. Rate-limited (20/min), CSRF-protected, schema-validated with
  length caps; degrades gracefully to a no-op when no Sentry DSN is configured.

### Platform

- `GET /health` — liveness probe (`{ status, timestamp }`)
- OAuth redirect tunnel route
- `/api/tunnel` relays browser GlitchTip envelopes (ad blockers block direct reports); only allowlisted project ids are forwarded
- Equipment item ids are validated to the INT4 range (400, not a database error)
- Shared-auth endpoints: `/api/auth/*`, `/api/csrf-token`, `/api/claim/*`
- `/test/*` fixture routes (enabled only outside production)

## Error handling

Centralized, structured error pipeline (`src/errors.ts` + `plugins/error-handler.ts`):

- Single `ApiHttpError` type and `ApiErrorPayload` shape:
  `{ error, message, code, statusCode, requestId, details? }`
- Fastify validation errors → `400 VALIDATION_ERROR` with per-field `details`
- Prisma / PostgreSQL error codes mapped to stable API codes
  (e.g. `P2002`/`23505` → `409 RESOURCE_CONFLICT`, `P2034`/`40001` → `412` retry)
- 5xx responses return a generic message (no internal leakage) and are reported
  to Sentry; 4xx responses are logged at info level
- Custom 404 handler returns the same structured payload
- The app should no longer miss error reports when a Logto callback fails inside Better Auth. Unexpected failures reach GlitchTip once with an error code and request ID, without OAuth tokens or profile data; normal sign-in rejections stay quiet.

## Security controls

- Session cookies: `HttpOnly`, `Secure`, `SameSite=Lax`, `__Secure-` prefix
- HSTS via `@fastify/helmet` (`max-age=31536000; includeSubDomains`)
- HMAC double-submit CSRF on all state-changing routes outside `/api/auth/*`
- Rate limiting is per visitor, keyed on Cloudflare's `CF-Connecting-IP` (trusted only from the
  private Caddy hop): 300 req/min global, 20-50/min on character/equipment routes, 20/min on feedback
- `Cache-Control: no-store` on `/api/auth/*` and `/api/csrf-token`
- SQL injection guarded by Prisma parameterization / tagged `$queryRaw`
- Input sanitization helpers (`sanitizeString`, `sanitizeJsonb`, `sanitizeCharacterUpdate`);
  text remains plain API data and HTML escaping is left to render boundaries
- Swagger/OpenAPI disabled in production; container runs as non-root `node`
- Pentested with Shannon AI (2026-03-23); findings remediated or accepted

## Architecture

- **Repository-only Prisma access.** All direct Prisma calls have been removed from `src/lib/`. A new `catalog-repository.ts` centralises catalog reads (weapons, armors, equipment, pets, classes, translations, class ability modifiers). Library files (`inventory.ts`, `get-character-full.ts`, `item-search-service.ts`) now call the repository layer, restoring the Repository → Service → Controller invariant.
- **Getting Better command drafts.** Character improvements are stored as typed
  active/applied `CharacterImprovement` rows with one active preview per
  character. Pure rule functions compute HP, debris, ability, and class-ability
  outcomes from each class's Getting Better rule (book, book plus a new
  ability, or Specialist with per-specialty Keep/Reroll); the service
  normalizes submitted table values before writing through the repository
  transaction. Previews saved in the old two-slot Scum shape upgrade on load.
- **Class rules are data.** Each class row carries its source, Credit, owner,
  lifecycle and Class Version lineage; per-stat dice (`count`d`faces` ±
  modifier, optional drop-lowest) and an omen die; and abilities name the item
  and pet they grant. Generation and Getting Better read these instead of
  hardcoded 3d6, d2 omens and name-to-key grant maps. Abilities keep an
  explicit order and may carry a dN reference table (rows with text and an
  optional item link), returned with the character; the Occult Herbmaster's
  decoctions are one.
- **Transactional email.** `mail-repository` is the only code that calls
  Amazon SES (v2 API, as in roster); `mail-service` renders the moderation
  emails (reporter receipt, decision, statement of reasons, dispute copy) in
  English or Polish, from `scvmrack@rpgtools.co` with Reply-To
  `contact@rpgtools.co`. Without `SES_REGION`, `SES_ACCESS_KEY_ID` and
  `SES_SECRET_ACCESS_KEY` nothing is sent and callers get "not sent".
- **Structured error logging.** The `unexpected()` helper in `src/services/result.ts` logs unexpected errors via `{ err: error }` so Pino's error serializer captures the full stack trace.
- **SSE half-open socket fix.** The party stream route (`GET /api/parties/:id/stream`) calls `reply.raw.end()` in its cleanup path to close the socket when a write error fires before the client disconnects.

## Testing

- **Unit** (`tests/unit-be`): `node:test` + `tsx` — error normalization, feedback
  forwarding, sanitization, validators
- **Integration** (`tests/integration-be`): dockerized API + Postgres wiring checks
- **E2E** (`tests/e2e`): Playwright flows incl. authenticated character management,
  print, kill/replace, custom-item header, and error paths
