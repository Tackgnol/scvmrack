# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MÖRK BORG Character Sheet - A full-stack TTRPG character management application with a neo-brutalist punk aesthetic. The project consists of a Fastify backend API and a React frontend.

## Tech Stack

- **Backend**: Fastify 5.x with TypeScript, PostgreSQL, Prisma, `@tackgnol/rpgtools-shared-auth`
- **Frontend**: React 18, Vite, TanStack Query, TanStack Router, MUI with custom Mörk Borg theme
- **Database**: PostgreSQL with custom functions, views, and fuzzy search
- **i18n**: English (en) and Polish (pl)

## Common Commands

### Backend (`backend` directory)
```bash
npm run dev      # Start development with hot reload
npm run start    # Production build and start
npm run build:ts # Compile TypeScript
npm test         # Fast unit test loop
```

### Test Commands
| You want to... | Run |
|---|---|
| Fast backend/frontend unit loop | `cd backend && npm test` |
| Verify full backend wiring | `cd backend && npm run test:integration` |
| Verify frontend browser components | `cd frontend && npm run test:browser` |
| Verify the whole user flow | `cd backend && npm run test:e2e` |
| Reproduce CI before pushing to master | `cd backend && npm run test:all` |

### Frontend (`frontend` directory)
```bash
cd frontend
npm run dev          # Start Vite dev server
npm run build        # Production build
npm run test:unit    # Run JSDOM unit tests
npm run test:browser # Run browser component tests
npm run lint         # Run ESLint
npm run lint:fix     # Fix linting issues
npm run format       # Format code with Prettier
npm run doctor       # React health check (react-doctor) — run after touching hooks/components
```

### Validation checklist (run before committing frontend changes)
| Step | Command | When |
|---|---|---|
| TypeScript | `cd frontend && npx tsc --noEmit` | Always |
| Lint | `cd frontend && npm run lint` | Always |
| Unit tests | `cd backend && npm run test:unit` | Always |
| Browser tests | `cd frontend && npm run test:browser` | When touching components/hooks |
| React health | `cd frontend && npm run doctor` | When touching components/hooks |

## Architecture

### Backend Structure
```
src/
├── routes/          # Fastify route handlers (autoloaded) — THIN controllers only
│   ├── characters/  # Character CRUD
│   ├── equipment/   # Item search + lookup
│   └── feedback/    # Feedback / error forwarding
├── services/        # Business logic; returns a stable ServiceResult (see API Layering)
├── repositories/    # ALL Prisma / external data access lives here
├── plugins/         # Fastify plugins (autoloaded)
│   └── rpgtools-auth.ts # Shared auth, CSRF, helmet, rate limiting
├── lib/             # Prisma client, character generation/reads, integration helpers
├── schemas/         # JSON schema validation
└── types/           # TypeScript types
```

### Frontend Structure
```
frontend/src/
├── components/     # React components (UI)
├── hooks/          # Custom hooks (character editing, auth, search)
├── api/            # OpenAPI-generated client
├── pages/          # Route pages
├── router/         # TanStack Router config
├── i18n/           # Translations (en.json, pl.json)
└── theme/          # MUI Mörk Borg theme
```

### Database (`backend/init/`)
```
init/
├── 01-extensions/  # PostgreSQL extensions
├── 02-schema/      # Tables (characters, classes, equipment, etc.)
├── 03-functions/   # LIVE stored functions only (equipment search, inventory, dice utils)
├── 04-views/       # Database views
├── 05-seed/        # Game data (classes, items, translations)
└── _archive/       # Superseded PL/pgSQL (generate/get_full/update_character) — NOT re-applied by migrate.js
```

## Key Patterns

### API Layering (Repository → Service → Controller)
All backend route groups (`characters`, `equipment`, `feedback`) follow one layering. **Keep new endpoints in this shape — do not put Prisma calls or business logic in route files.**
- **Repository** (`src/repositories/*-repository.ts`) — the ONLY place that touches Prisma / external systems. No business logic.
- **Service** (`src/services/*-service.ts`) — all logic (ownership/validation/orchestration). Returns a stable `ServiceResult<T>` (`{ ok: true, value } | { ok: false, error: ApiHttpError }`) from `src/services/result.ts`; map unexpected errors via the shared `unexpected(log, ...)` helper.
- **Controller** (`src/routes/**/index.ts`) — thin HTTP↔service translation. One error convention via `sendServiceError(reply, request, error)`: domain failures (4xx) are sent to the client; server failures (5xx) are re-thrown so the central error handler renders them and reports to Sentry.
- Services take a `ServiceLogger` (Fastify's `request.log` satisfies it). Repository unit tests are intentionally skipped (they'd only exercise Prisma); test services with mocked repositories/lib.

### Character Editing
The frontend uses optimistic updates with debouncing. When editing a character:
1. Changes are queued as "patches" in `useCharacterEditor`
2. UI updates immediately via `queryClient.setQueryData`
3. Changes flush to the server after 1 second of inactivity; flushes are serialized (one PATCH in flight)
4. The PATCH response (already hydrated) is written back into the cache and still-pending patches are re-applied on top; transient 5xx/network failures auto-retry, then surface a manual retry
5. The queue is flushed on unmount so a last edit isn't dropped

**Caution:** the cache is reconciled from the PATCH *response*. Do NOT re-add a per-PATCH `invalidateQueries`/refetch on the character detail query (in `useCharacterRepository` or the editor) — that refetch races the optimistic queue and silently drops edits.

### Authentication Flow
- Auth is handled by `@tackgnol/rpgtools-shared-auth` in `backend/src/plugins/rpgtools-auth.ts`.
- Shared auth mounts Better Auth endpoints at `/api/auth/*`, CSRF at `/api/csrf-token`, and claim routes at `/api/claim/*`.
- Logto handles real-user sign-in/profile flows. The app still uses anonymous Better Auth sessions for first-run character ownership.
- `request.appSession` is the raw shared-auth session shape: `{ session, user } | null`.
- No roles/RBAC — authorization is ownership-based (`characters.user_id === request.appSession.user.id`).

### Character Ownership Model
Characters are bound to users via `user_id`. Three paths transfer ownership:
1. **`onLinkAccount`** in `rpgtools-auth.ts` transfers anonymous characters when the same browser session links to Logto.
2. **Shared claim routes** (`/api/claim/issue`, `/api/claim/redeem`) handle cross-device transfers through `@tackgnol/rpgtools-shared-auth`.

### Character Generation & Reads (TypeScript, NOT SQL)
- Character generation and full-character reads are **TypeScript** in `backend/src/lib/` (`generate-character.ts`, `get-character-full.ts`), driven by a seedable ChaCha20 roller (`@tackgnol/rpg-tools-roller`) — not Postgres `random()`. Generator parity with the old SQL is a non-goal.
- Character updates go through Prisma directly (via the repository/service), not a stored procedure.
- The legacy PL/pgSQL (`generate_character`, `get_character_full`, `update_character`) is **dead and archived** in `backend/init/_archive/`. Do not call, re-add, or "fix" it.
- Still live in the DB: equipment fuzzy search (PostgreSQL trigram indexes), inventory helpers, and dice utils in `backend/init/03-functions/`.

## Security Architecture

Pentested with Shannon AI (2026-03-23). All findings remediated or accepted.

### Validated Security Controls

| Control | Implementation | Status |
|---|---|---|
| Session cookies | `HttpOnly`, `Secure`, `SameSite=Lax`, `__Secure-` prefix | Verified |
| HSTS | `max-age=31536000; includeSubDomains` via `@fastify/helmet` | Verified |
| CSRF | HMAC double-submit cookie on all POST/PATCH/DELETE/PUT outside `/api/auth/*` | Verified |
| Password/auth UX | Managed by Logto + Better Auth via shared-auth | Verified |
| SQL injection | Prisma parameterization and `$queryRaw` tagged templates | Verified |
| Cache-control | `no-store, no-cache, must-revalidate, private` on all auth responses | Verified |
| Rate limiting | 10 req/min per IP on auth endpoints, 30 req/min on character/equipment | Verified |
| Claim signatures | Shared-auth HMAC claim flow | Verified |
| Swagger/OpenAPI | Disabled in production (`NODE_ENV=production`) | Verified |
| Dockerfile | Runs as `node` user, not root | Verified |

### Security Considerations When Modifying
- **Never commit secrets** to version control (`.env` files are in `.gitignore`)
- Keep Logto credentials in env/secret storage, not compose files.
- Do not bypass shared-auth CSRF for app state-changing routes.

## Database Reapply Scripts

The project includes scripts to reapply database schema:
- `scripts/db-reapply.sh` (Unix) or `scripts/db-reapply.ps1` (Windows)
- Applies all init SQL files in order

## Environment Variables

- `.env` - Development configuration (never commit to git)
- Required backend: `DATABASE_URL`, `BETTER_AUTH_SECRET`, `AUTH_BASE_URL`, `APP_BASE_URL`, `CLIENT_ORIGIN`, `LOGTO_ENDPOINT`, `LOGTO_APP_ID`, `LOGTO_APP_SECRET`, `LOGTO_REDIRECT_URI`, `LOGTO_POST_LOGOUT_REDIRECT_URI`
- Optional backend: `DATABASE_USER`, `DATABASE_HOST`, `DATABASE_NAME`, `DATABASE_PASSWORD`, `DATABASE_PORT`, `CLIENT_GATEWAY`, `LOGTO_RESOURCE`, `GLITCHTIP_DSN`, `PARTY_MAX_MEMBERS` (party member cap; default 10, read once at startup by `party-service.ts`)
- Required frontend build: `VITE_BACKEND_URL`, `VITE_LOGTO_ENDPOINT`
- Optional frontend build: `VITE_SITE_URL`, `VITE_GLITCHTIP_DSN`, `VITE_ALLOWED_HOSTS`, `VITE_GA_MEASUREMENT_ID` (public GA4 ID; baked into the bundle at build time — GA stays dormant if unset)
- Production uses separate GlitchTip DSNs: `GLITCHTIP_DSN` for backend and `VITE_GLITCHTIP_DSN` for frontend.

## Release Notes

User-facing release notes are the single source of truth — **do not create or reintroduce a root `CHANGELOG.md`** (the `release/` + `changelog/` folders replace it).

- `changelog/` — per-area "what the product does today" summaries (`backend.md`, `frontend.md`).
- `release/` — versioned, user-facing notes: one `release/<version>.md` per version plus the index table in `release/README.md`, derived from `changelog/`.
- `frontend/src/pages/ReleasePage.tsx` — the in-app **Updates** page (`/release`) that mirrors `release/` using `release.*` i18n keys.

When cutting a release (any version bump), update **all** of these in the same change:
1. Bump `version` in both `backend/package.json` and `frontend/package.json`.
2. Add `release/<version>.md` and a newest-first row in `release/README.md`.
3. Add a card to `ReleasePage.tsx` with `release.v<xyz>.*` keys, and add those keys to **both** `frontend/src/i18n/en.json` and `pl.json` (keep en/pl in sync).
4. Tag the release commit `v<version>`.

## Recommended Skills

When working on this codebase, use these skills for best results:
- **`fastify-best-practices`** — for route handlers, plugins, hooks, schemas
- **`oauth`** — for Logto/OIDC/shared-auth changes
- **`shannon`** — to run pentests against staging before releases
- **`postgresql`** — for database schema, functions, or raw SQL query changes
