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
```

## Architecture

### Backend Structure
```
src/
├── routes/          # Fastify route handlers (autoloaded)
│   ├── characters/  # Character CRUD operations
│   ├── equipment/   # Equipment search
├── plugins/         # Fastify plugins (autoloaded)
│   └── rpgtools-auth.ts # Shared auth, CSRF, helmet, rate limiting
├── lib/             # Prisma client and integration helpers
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
├── 03-functions/   # Stored functions (character generation, search)
├── 04-views/       # Database views
└── 05-seed/        # Game data (classes, items, translations)
```

## Key Patterns

### Character Editing
The frontend uses optimistic updates with debouncing. When editing a character:
1. Changes are queued as "patches" in `useCharacterEditor`
2. UI updates immediately via `queryClient.setQueryData`
3. Changes flush to server after 1 second of inactivity
4. Failed updates retry up to 3 times with user notification

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

### Database Functions
- `generate_character(class_id)` - Creates random character
- `get_character_full(id, locale)` - Returns character with localized data
- Equipment search uses fuzzy matching with PostgreSQL trigram indexes

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
- Optional backend: `DATABASE_USER`, `DATABASE_HOST`, `DATABASE_NAME`, `DATABASE_PASSWORD`, `DATABASE_PORT`, `CLIENT_GATEWAY`, `LOGTO_RESOURCE`, `GLITCHTIP_DSN`
- Required frontend build: `VITE_BACKEND_URL`, `VITE_LOGTO_ENDPOINT`
- Optional frontend build: `VITE_SITE_URL`, `VITE_GLITCHTIP_DSN`, `VITE_ALLOWED_HOSTS`, `VITE_GA_MEASUREMENT_ID` (public GA4 ID; baked into the bundle at build time — GA stays dormant if unset)
- Production uses separate GlitchTip DSNs: `GLITCHTIP_DSN` for backend and `VITE_GLITCHTIP_DSN` for frontend.

## Recommended Skills

When working on this codebase, use these skills for best results:
- **`fastify-best-practices`** — for route handlers, plugins, hooks, schemas
- **`oauth`** — for Logto/OIDC/shared-auth changes
- **`shannon`** — to run pentests against staging before releases
- **`postgresql`** — for database schema, functions, or raw SQL query changes
