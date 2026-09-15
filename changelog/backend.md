# Backend — Feature Summary

`scvmgrinder_be` — Fastify 5 + TypeScript API for the MÖRK BORG character sheet.

## Stack

- **Runtime:** Fastify 5.x (ESM, TypeScript), autoloaded plugins & routes
- **Database:** PostgreSQL via Prisma 6 with the `@prisma/adapter-pg` driver adapter
- **Auth:** `@tackgnol/rpgtools-shared-auth` (Better Auth sessions + Logto OIDC)
- **Observability:** Sentry / GlitchTip (`@sentry/node`)
- **Docs:** `@fastify/swagger` + Swagger UI (disabled in production)

## API surface

All application routes are mounted under the `/api` prefix.

### Characters (`/api/characters`)

- `POST /new` — generate a new random character or confirm a seeded creation
  draft (TypeScript generator)
- `GET /classes` — localized class list for the creation gate
- `POST /draft` — build or rehydrate a stateless draft preview without a DB write
- `POST /draft/reroll/:section` — replace one draft section seed and rebuild the
  preview
- `GET /` — list characters owned by the current session user (optional `locale` query param; falls back to `Accept-Language`)
- `GET /count` — total character count
- `GET /:id` — fetch a localized character (`get_character_full(id, locale)`)
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

## Security controls

- Session cookies: `HttpOnly`, `Secure`, `SameSite=Lax`, `__Secure-` prefix
- HSTS via `@fastify/helmet` (`max-age=31536000; includeSubDomains`)
- HMAC double-submit CSRF on all state-changing routes outside `/api/auth/*`
- Rate limiting: 10 req/min on auth, 30 req/min on character/equipment, 20/min on feedback
- SQL injection guarded by Prisma parameterization / tagged `$queryRaw`
- Input sanitization helpers (`sanitizeString`, `sanitizeJsonb`, `sanitizeCharacterUpdate`);
  text remains plain API data and HTML escaping is left to render boundaries
- Swagger/OpenAPI disabled in production; container runs as non-root `node`
- Pentested with Shannon AI (2026-03-23); findings remediated or accepted

## Architecture

- **Repository-only Prisma access.** All direct Prisma calls have been removed from `src/lib/`. A new `catalog-repository.ts` centralises catalog reads (weapons, armors, equipment, pets, classes, translations, class ability modifiers). Library files (`inventory.ts`, `get-character-full.ts`, `item-search-service.ts`) now call the repository layer, restoring the Repository → Service → Controller invariant.
- **Structured error logging.** The `unexpected()` helper in `src/services/result.ts` logs unexpected errors via `{ err: error }` so Pino's error serializer captures the full stack trace.
- **SSE half-open socket fix.** The party stream route (`GET /api/parties/:id/stream`) calls `reply.raw.end()` in its cleanup path to close the socket when a write error fires before the client disconnects.

## Testing

- **Unit** (`tests/unit-be`): `node:test` + `tsx` — error normalization, feedback
  forwarding, sanitization, validators
- **Integration** (`tests/integration-be`): dockerized API + Postgres wiring checks
- **E2E** (`tests/e2e`): Playwright flows incl. authenticated character management,
  print, kill/replace, custom-item header, and error paths
