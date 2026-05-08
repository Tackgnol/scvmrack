# AGENTS.md

This file provides guidance to Codex when working with code in this repository.

## Project Overview

MÖRK BORG Character Sheet is a full-stack TTRPG character management app with a neo-brutalist punk aesthetic.

The repository is a two-app monorepo:

| Directory | Role | Stack |
|---|---|---|
| `backend/` | REST API | Fastify 5, TypeScript, PostgreSQL, Prisma |
| `frontend/` | SPA | React, Vite, TanStack Query/Router, MUI |

Authentication is handled by `@tackgnol/rpgtools-shared-auth` in `backend/src/plugins/rpgtools-auth.ts`.

## Common Commands

### Backend (`backend/`)

```bash
npm run dev              # Start the Docker dev stack from backend/
npm run build:ts         # Compile TypeScript
npm test                 # Backend unit tests + frontend unit tests
npm run test:integration # Backend integration suite in Docker
npm run test:browser     # Frontend browser suite
npm run test:all         # Broad pre-merge verification
```

### Frontend (`frontend/`)

```bash
npm run dev          # Start Vite dev server
npm run build        # Production build
npm run test:unit    # JSDOM unit tests
npm run test:browser # Browser component tests
npm run lint         # ESLint
npm run lint:fix     # Fix linting issues
npm run format       # Format source files
```

### Docker

```bash
docker compose -f compose.dev.yaml up --build --watch
docker compose -f compose.integration-be.yaml config
docker compose -f compose.prod.yaml config
```

Do not read `.npmrc`; it is gitignored and contains registry credentials.

## Testing Standards

### Choosing Unit vs Browser Tests

- Unit tests (`frontend/test/unit/`, JSDOM): pure logic, hooks, transforms, and utilities that do not require layout or real browser events.
- Browser tests (`frontend/test/browser/`, Vitest Browser Mode): component rendering, real interactions, visual correctness, and CSS-dependent behavior.

### Browser Test Rules

- Import `render` from `vitest-browser-react`, not `/pure`.
- Do not call `unmount()` and do not add `afterEach(cleanup)`.
- Use one render per `it()`.
- Prefer locators in this order: role, visible text, test id.
- Always use `await expect.element(locator).toBeVisible()`.
- Use `await userEvent.click(locator)` and `await userEvent.fill(input, value)`.
- Use `await expect.poll(() => mockFn).toHaveBeenCalledWith(...)` for callbacks.
- Avoid raw sleeps. Do not mix fake timers with `userEvent`.
- Wrap browser component tests in `<BrowserTestProvider>`.

## Architecture

### Backend Structure

```text
backend/
├── src/
│   ├── routes/          # Fastify route handlers, autoloaded under /api
│   ├── plugins/         # Swagger and shared auth plugin
│   ├── lib/             # Prisma client and integration helpers
│   ├── schemas/         # JSON schema validation
│   └── types/           # TypeScript types
├── prisma/              # Prisma schema and migrations
├── init/                # PostgreSQL extensions, schema, functions, views, seed data
├── scripts/             # DB/test/deploy helper scripts
└── tests/               # Backend integration and unit projects
```

### Frontend Structure

```text
frontend/src/
├── components/     # React components
├── hooks/          # Character editing, auth, search, and UI hooks
├── api/            # OpenAPI-generated client
├── pages/          # Route pages
├── router/         # TanStack Router config
├── i18n/           # en/pl translations
└── theme/          # MUI Mörk Borg theme
```

### Runtime Routing

- Backend API routes live under `/api/*`.
- Shared auth routes live under `/api/auth/*`.
- Shared claim routes live under `/api/claim/*`.
- The backend keeps `/health` as a direct container health alias and `/api/health` for proxied checks.
- The frontend is a static SPA served by nginx in production.
- Caddy routes `/api/*` to the backend and everything else to the frontend.

## Key Patterns

### Character Editing

The frontend uses optimistic updates with debouncing:

1. Changes are queued as patches in `useCharacterEditor`.
2. UI updates immediately through TanStack Query cache writes.
3. Changes flush to the server after a short idle period.
4. Failed updates retry and surface a user notification.

### Authentication Flow

- `@tackgnol/rpgtools-shared-auth` owns Better Auth setup, Logto OAuth, CSRF, security headers, rate limiting, anonymous sessions, and claim routes.
- Logto handles real-user sign-in/profile flows.
- Anonymous Better Auth sessions are still used for first-run character ownership.
- `request.appSession` is the raw shared-auth session shape: `{ session, user } | null`.
- No roles/RBAC. Authorization is ownership-based: `characters.user_id === request.appSession.user.id`.

### Character Ownership

Characters are bound to users through `characters.user_id`.

- `onLinkAccount` in `backend/src/plugins/rpgtools-auth.ts` transfers anonymous characters when the same browser session links to Logto.
- `/api/claim/issue` and `/api/claim/redeem` from shared-auth handle cross-device transfers.

### Database

- `generate_character(class_id)` creates random characters.
- `get_character_full(id, locale)` returns localized character data.
- Equipment search uses PostgreSQL trigram indexes.
- Prisma owns auth/claim tables and models the character relation.
- Existing game schema/functions/seed data still come from `backend/init/`.

## Security Architecture

Pentested with Shannon AI on 2026-03-23. All findings were remediated or accepted.

| Control | Implementation | Status |
|---|---|---|
| Session cookies | `HttpOnly`, `Secure`, `SameSite=Lax`, `__Secure-` prefix | Verified |
| HSTS | Shared-auth/Fastify helmet setup | Verified |
| CSRF | HMAC double-submit cookie on state-changing routes outside `/api/auth/*` | Verified |
| Password/auth UX | Managed by Logto + Better Auth through shared-auth | Verified |
| SQL injection | Prisma parameterization and tagged `$queryRaw` calls | Verified |
| Cache-control | No-store auth responses | Verified |
| Rate limiting | Shared-auth route limits plus app API limits | Verified |
| Claim flow | Shared-auth HMAC claim flow | Verified |
| Swagger/OpenAPI | Disabled in production | Verified |
| Dockerfile | Backend production image runs as `node`, not root | Verified |

### Security Rules

- Never commit secrets. `.env`, `.env.*`, and `.npmrc` are ignored.
- Keep Logto credentials in env/secret storage, not source files or compose defaults.
- Do not bypass shared-auth CSRF for app state-changing routes.
- Do not reintroduce plaintext email storage, local password UI, magic-link UI, or Turnstile code in this app; those concerns moved out with the auth migration.

## Environment

- Backend dev values live in `backend/.env`, based on `backend/.env.example`.
- Production deploy values can be documented locally in root `.env`, based on root `.env.example`.
- Required auth env: `BETTER_AUTH_SECRET`, `AUTH_BASE_URL`, `APP_BASE_URL`, `CLIENT_ORIGIN`, `LOGTO_ENDPOINT`, `LOGTO_APP_ID`, `LOGTO_APP_SECRET`, `LOGTO_REDIRECT_URI`, `LOGTO_POST_LOGOUT_REDIRECT_URI`.
- Frontend build env: `VITE_BACKEND_URL`, `VITE_LOGTO_ENDPOINT`, optional `VITE_SITE_URL`, optional `VITE_GLITCHTIP_DSN`.
