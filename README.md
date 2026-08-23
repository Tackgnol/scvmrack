# MÖRK BORG Character Sheet

A full-stack TTRPG character management application with a neo-brutalist punk aesthetic.

## Architecture

This is a two-app monorepo:

| Directory | Role | Stack |
|---|---|---|
| `backend/` | REST API | Fastify 5, TypeScript, PostgreSQL, Prisma |
| `frontend/` | SPA | React 18, Vite, TanStack Query/Router, MUI |

Authentication is handled by `@tackgnol/rpgtools-shared-auth` (Logto OIDC + anonymous Better Auth sessions for first-run character ownership).

## Development

### Prerequisites

- Docker Desktop
- Logto app credentials (endpoint, app ID, app secret) - see `backend/.env.example`

### Start the dev stack

```bash
docker compose -f compose.dev.yaml up --build --watch
```

Services:

| Service | URL |
|---|---|
| Frontend (Vite HMR) | http://localhost:5173 |
| Backend API | http://localhost:3000 |
| PostgreSQL | localhost:5433 |

`--watch` syncs `backend/src`, `frontend/src`, and static frontend entry files into the containers without rebuilding on every save.

### Backend commands (`backend/`)

```bash
npm test                  # Fast unit tests
npm run test:integration  # Full wiring test in Docker
npm run build:ts          # Compile TypeScript
```

### Frontend commands (`frontend/`)

```bash
npm run test:unit         # JSDOM unit tests
npm run test:browser      # Vitest Browser Mode (Chromium, Firefox, Webkit)
npm run lint              # ESLint
npm run build             # Production build
```

## Production

```bash
docker compose -f compose.prod.yaml up --build
```

- Backend on port **3031**, frontend on port **3030**.
- Reverse-proxied by Caddy (see `Caddyfile.example`).
- Secrets must be provided as environment variables; use root `.env.example` as a checklist.

## Environment variables

For local backend work, copy `backend/.env.example` to `backend/.env` and fill in the values. For production compose/deploy wiring, use root `.env.example` as a placeholder-only checklist.

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | yes | PostgreSQL connection string |
| `BETTER_AUTH_SECRET` | yes | At least 32 random characters, used by shared-auth for anonymous sessions |
| `APP_BASE_URL` | yes | Public frontend URL, e.g. `http://localhost:5173` |
| `AUTH_BASE_URL` | yes | Public auth API base, e.g. `http://localhost:3000/api/auth` |
| `LOGTO_ENDPOINT` | yes | Logto tenant URL |
| `LOGTO_APP_ID` | yes | Logto application ID |
| `LOGTO_APP_SECRET` | yes | Logto application secret |
| `LOGTO_REDIRECT_URI` | yes | OAuth callback, e.g. `http://localhost:3000/api/auth/oauth2/callback/logto` |
| `LOGTO_POST_LOGOUT_REDIRECT_URI` | yes | Frontend URL to return to after logout |
| `LOGTO_RESOURCE` | optional | Logto API resource indicator |
| `CLIENT_ORIGIN` | yes | Frontend origin for CORS, e.g. `http://localhost:5173` |
| `VITE_BACKEND_URL` | yes for frontend build | Backend origin used by the SPA |
| `VITE_LOGTO_ENDPOINT` | yes for frontend build | Logto tenant URL exposed to the SPA for profile links |
| `GLITCHTIP_DSN` | optional | Backend error monitoring |
| `VITE_GLITCHTIP_DSN` | optional | Frontend error monitoring |
| `SENTRY_RELEASE` | optional | Exact deployed release, defaults to `scvmrack@<package version>` |
| `SENTRY_ENVIRONMENT` | optional | Shared frontend/backend environment name |
| `SENTRY_AUTH_TOKEN` | required when frontend monitoring is enabled | Build-only source-map upload token |
| `SENTRY_ORG` / `SENTRY_FRONTEND_PROJECT` | required when frontend monitoring is enabled | GlitchTip source-map upload target |

## Error Monitoring (GlitchTip)

Set `GLITCHTIP_DSN` for backend and `VITE_GLITCHTIP_DSN` for frontend reporting to separate GlitchTip projects. See [the monitoring deployment guide](docs/monitoring.md) for releases, source maps, and the production artifact check.

## Learn More

To learn Fastify, check out the [Fastify documentation](https://fastify.dev/docs/latest/).
