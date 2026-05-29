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
- `POST /new` — generate a new random character (DB function `generate_character`)
- `GET /` — list characters owned by the current session user
- `GET /count` — total character count
- `GET /:id` — fetch a localized character (`get_character_full(id, locale)`)
- `PATCH /:id` — update a character (server-side sanitization + bounds clamping)
- `DELETE /:id` — delete a character (ownership-enforced)

### Equipment (`/api/equipment`)
- `GET /search` — fuzzy, locale-aware item search (PostgreSQL trigram indexes)
- `GET /:itemType/:id` — fetch a full item by type and id

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
- Input sanitization helpers (`sanitizeString`, `sanitizeJsonb`, `sanitizeCharacterUpdate`)
- Swagger/OpenAPI disabled in production; container runs as non-root `node`
- Pentested with Shannon AI (2026-03-23); findings remediated or accepted

## Testing

- **Unit** (`tests/unit-be`): `node:test` + `tsx` — error normalization, feedback
  forwarding, sanitization, validators
- **Integration** (`tests/integration-be`): dockerized API + Postgres wiring checks
- **E2E** (`tests/e2e`): Playwright flows incl. authenticated character management,
  print, kill/replace, custom-item header, and error paths
