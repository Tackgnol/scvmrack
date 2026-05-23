# `scvmrack` → Logto + shared-auth + FE/BE split — execution plan

## Ground rules for the executing agent

1. **Single user (just the maintainer).** Do not write any user-data migration code. The `user`, `session`, `account`, `verification` tables get **dropped and recreated**. Existing characters — keep if owned by anonymous user (re-claim via Logto sign-in flow); discard if it's easier.
2. **Local Postgres data is disposable.** `docker compose down -v` is fine.
3. **Work on a feature branch** off `master`. Do not push to `master` until Phase 11 verification passes.
4. **Each phase ends with a verification gate.** Do not start phase N+1 until the gate for phase N is green.
5. **Use Prisma everywhere it's a clean fit.** Drop `@pgtyped/*` entirely. Keep raw SQL only for stored-proc calls (`generate_character`, `get_character_full`) via `prisma.$queryRaw`.
6. **No more `better-auth` direct dep in scvmrack.** Mirror trench-rats: depend only on `@tackgnol/rpgtools-shared-auth`, which re-exports what's needed.
7. **No login/registration UI in the SPA.** A single profile/login button in the header. Logged-out → redirect to Logto. Logged-in → opens Logto user profile in a new tab. That's it.
8. **Single host via Caddy** (`scvmrack.rpgtools.co/api/*` → backend, `/*` → frontend). Cookies stay same-origin.

---

## Phase 0 — Preflight

### 0.1 Create branch + scratch notes
- [x] `git checkout -b feat/logto-migration`
- [x] Note current commit SHA in PR description for rollback reference.

### 0.2 Logto setup (manual, one-time)
Done in Logto Admin Console at `https://admin-auth.rpgtools.co`:
- [x] Create application: type **Traditional Web**, name `scvmrack`.
- [x] Add redirect URI: `https://scvmrack.rpgtools.co/api/auth/oauth2/callback/logto` (and `http://localhost:3000/api/auth/oauth2/callback/logto` for dev).
- [x] Add post-logout redirect: `https://scvmrack.rpgtools.co/`.
- [x] Capture `LOGTO_APP_ID`, `LOGTO_APP_SECRET`. Endpoint is `https://auth.rpgtools.co`.
- [x] In Logto: enable email passwordless + Google social (or whichever providers you want). All sign-up/sign-in lives there now.

### 0.3 Confirm decisions in writing (commit a `MIGRATION.md`)
- [x] Drop email/password, magic link, Turnstile, blind-index encryption, login lockout, all `nodemailer` + email templates. (Logto handles all of these.)
- [x] Drop `verification` table and the `guest_sessions` table (Better Auth's `anonymous` plugin uses `user`+`session` for this).
- [x] No data migration script. Single-user assumption.

**Gate 0:** Logto app created, secrets captured, branch exists.

---

## Phase 1 — Repo restructure (FE/BE split)

The goal of this phase is **moves only**, no behavior change. The app should still build and run as a monolith via the old Dockerfile after this phase.

### 1.1 Create new directory layout
Mirror trench-rats:
```
scvmrack/
├── backend/          (NEW — content from current root + src/ + scripts/ + migrations/ + init/)
│   ├── src/
│   ├── prisma/        (added in Phase 2)
│   ├── scripts/
│   ├── migrations/
│   ├── init/
│   ├── tests/
│   ├── package.json
│   ├── tsconfig.json
│   ├── Dockerfile     (rewritten in Phase 7)
│   └── .env.example
├── frontend/         (RENAMED from client/)
│   ├── src/
│   ├── public/
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── Dockerfile     (NEW — Phase 7)
├── compose.yaml
├── compose.dev.yaml
├── compose.prod.yaml
├── Caddyfile.example
├── .woodpecker/
├── .env.example
├── README.md
├── CLAUDE.md
├── AGENTS.md
└── MIGRATION.md
```

### 1.2 Concrete moves (use `git mv` so history follows)
- [x] `git mv client frontend`
- [x] `mkdir backend`
- [x] Move into `backend/`: `src/`, `scripts/`, `migrations/`, `init/`, `tests/`, `app.js`, `package.json`, `package-lock.json`, `tsconfig.json`, `pgtyped.json`, `.env*`, `DATABASE.md`, `Dockerfile*`, `.dockerignore`, `.prettierrc`.
- [x] Leave at root: `compose*.yaml`, `.woodpecker/`, `README.md`, `CLAUDE.md`, `AGENTS.md`, `docs/`, `materials/`, `.gitignore`.
- [x] Delete dev-only / artifacts (regeneratable): `coverage*/`, `dist/`, `e2e-report/`, `node_modules/`, `test-results/`, `reports/`, `e2e.log`, `localhost.har`, `replacements.txt`.

### 1.3 Update path references
- [x] In `backend/scripts/*.ts/.js`: any `path.join(process.cwd(), 'client', …)` → `path.join(process.cwd(), '..', 'frontend', …)`. Search `backend/scripts` for the string `'client'`.
- [x] In `backend/src/routes/root.ts`: SPA fallback `spaIndexCandidates` paths — irrelevant after Phase 7 (this whole file is deleted), but for now point to `../frontend/dist/index.html` so the temporary monolith still works.
- [ ] In `backend/package.json` scripts: replace `npm --prefix client` / `cd client` → `npm --prefix ../frontend` / `cd ../frontend`.
- [ ] In `backend/Dockerfile` (temporary, will be replaced Phase 7): adjust the `COPY client/package*.json` etc. to `COPY frontend/package*.json` and `COPY frontend/ ./frontend/`. Build context from compose stays repo root.
- [ ] In root `compose*.yaml`: build contexts and Dockerfile paths.

### 1.4 Verification
- [ ] `cd backend && npm install` succeeds.
- [ ] `cd ../frontend && npm install` succeeds.
- [ ] `docker compose -f compose.yaml up --build` starts. Hit `http://localhost:5173` (web) and `http://localhost:3000/health` — both 200.
- [ ] One unit test set runs: `cd backend && npm test`.

**Gate 1:** Old behavior preserved, just relocated. Commit: `chore: split repo into backend/ and frontend/`.

---

## Phase 2 — Prisma introduction (auth tables only first)

### 2.1 Install Prisma
```bash
cd backend
npm i -D prisma
npm i @prisma/client @prisma/adapter-pg
```

### 2.2 Create `backend/prisma/schema.prisma`

Mirror trench-rats's auth models + add `Character` and `ClaimCode`. **Names match what shared-auth + Better Auth expect.**

```prisma
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["driverAdapters"]
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id            String   @id
  name          String
  email         String   @unique
  emailVerified Boolean  @default(false)
  image         String?
  isAnonymous   Boolean? @default(false)
  logto_sub     String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  sessions   Session[]
  accounts   Account[]
  characters Character[]

  @@map("user")
}

model Session {
  id        String   @id
  expiresAt DateTime
  token     String   @unique
  ipAddress String?
  userAgent String?
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("session")
}

model Account {
  id                    String    @id
  accountId             String
  providerId            String
  userId                String
  accessToken           String?
  refreshToken          String?
  idToken               String?
  accessTokenExpiresAt  DateTime?
  refreshTokenExpiresAt DateTime?
  scope                 String?
  password              String?
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt
  user                  User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("account")
}

model Verification {
  id         String   @id
  identifier String
  value      String
  expiresAt  DateTime
  createdAt  DateTime @default(now())
  updatedAt  DateTime @default(now())

  @@map("verification")
}

model ClaimCode {
  code                   String   @id
  payload_user_id        String
  payload_source_user_id String
  payload_character_id   String
  payload_signature      String
  payload_issued_at      DateTime
  expires_at             DateTime

  @@map("claim_code")
}

model Character {
  id        String   @id @default(uuid())
  userId    String?
  user      User?    @relation(fields: [userId], references: [id], onDelete: SetNull)
  // … (mirror remaining columns from init/02-schema/001_tables.sql:80-185)

  @@map("characters")
}
```

> The executing agent must inspect `backend/init/02-schema/001_tables.sql` from line ~80 to ~185 (the `characters` table) and add the remaining scalar columns to the `Character` model so Prisma matches the existing schema. **Do not add Prisma models for game-data tables** (equipment, weapons, armors, classes, translations, etc.) — those are read-only with stored-proc / fuzzy-search semantics; they stay in raw SQL.

### 2.3 Update SQL init for clean rebuild

Single user, disposable DB → simplify:
- [ ] In `backend/init/02-schema/001_tables.sql`: **delete** the `user`, `session`, `account`, `verification`, `guest_sessions` table definitions (Prisma will own these).
- [ ] **Delete** `email_bidx`, `encrypted_email` references everywhere they appear in the file.
- [ ] Keep the rest (game tables, characters table without the auth columns).
- [ ] Add `claim_code` migration is not needed in init — Prisma manages it.

### 2.4 Generate Prisma client and migrate
- [ ] `npx prisma generate`
- [ ] Add to `backend/package.json` scripts:
  ```json
  "prisma:generate": "prisma generate",
  "prisma:push": "prisma db push",
  "prisma:migrate": "prisma migrate deploy"
  ```
- [ ] Set `DATABASE_URL=postgresql://p1002_scmgrinder:p1002_scmgrinder@localhost:5433/p1002_scmgrinder` in `backend/.env` (matches `compose.yaml` mapping).
- [ ] `docker compose down -v && docker compose up -d db` (fresh DB, init SQL runs).
- [ ] `npx prisma db push` (Prisma applies its tables on top).
- [ ] `npx prisma migrate dev --name init` to materialize the migration (commit it).

### 2.5 Add `backend/src/lib/prisma.ts`
```ts
import { PrismaClient } from '@prisma/client';
export const prisma = new PrismaClient();
export default prisma;
```

### 2.6 Verification
- [ ] `psql` into the DB, confirm `\dt` shows `user`, `session`, `account`, `claim_code`, `characters`, all game tables.
- [ ] `node -e "import('./dist/lib/prisma.js').then(m => m.default.character.count().then(console.log))"` returns `0` without error.

**Gate 2:** Prisma owns auth tables; schema lives in `prisma/schema.prisma`. Commit: `feat(backend): introduce prisma for auth + character`.

---

## Phase 3 — Wire `@tackgnol/rpgtools-shared-auth`

### 3.1 Install
- [ ] Create `backend/.npmrc` with:
  ```
  @tackgnol:registry=https://npm.pkg.github.com/
  //npm.pkg.github.com/:_authToken=${NPMRC_AUTH_TOKEN}
  ```
- [ ] Add `.npmrc` to `backend/.gitignore` (it'll be regenerated from secret in CI).
- [ ] `cd backend && npm i @tackgnol/rpgtools-shared-auth`
- [ ] `npm uninstall better-auth @fastify/cookie @fastify/cors @fastify/csrf-protection @fastify/helmet @fastify/rate-limit nodemailer @types/nodemailer validator @types/validator @pgtyped/runtime @pgtyped/cli` — shared-auth provides cookie/cors/csrf/helmet/rate-limit transitively, the rest is dead code after Phase 5.

### 3.2 Create `backend/src/plugins/rpgtools-auth.ts`

```ts
import fp from 'fastify-plugin';
import type { FastifyInstance } from 'fastify';
import { rpgtoolsSharedAuth } from '@tackgnol/rpgtools-shared-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import prisma from '../lib/prisma.js';

export default fp(async function rpgtoolsAuthPlugin(fastify: FastifyInstance) {
  await fastify.register(rpgtoolsSharedAuth, {
    baseURL: process.env.AUTH_BASE_URL || 'http://localhost:3000/api/auth',
    database: prismaAdapter(prisma, { provider: 'postgresql' }),
    db: {
      character: prisma.character as any,
      claimCode: prisma.claimCode as any,
    },
    trustedOrigins: [
      'http://localhost:3000',
      'http://localhost:5173',
      'https://scvmrack.rpgtools.co',
    ],
    onLinkAccount: async ({ anonymousUser, newUser }) => {
      await prisma.character.updateMany({
        where: { userId: anonymousUser.user.id },
        data:  { userId: newUser.user.id },
      });
    },
  });
  fastify.log.info('rpgtools-shared-auth registered');
});
```

> Note: this requires `better-auth/adapters/prisma` to be reachable at runtime. Since we removed `better-auth` as a top-level dep, it's still present transitively via shared-auth. If the import fails after `npm install`, see Phase 10 for the fix in shared-auth (re-export `prismaAdapter`).

### 3.3 Strip the old auth wiring from `backend/src/app.ts`
- [ ] Delete the `await fastify.register(fastifyCookie)` line — shared-auth registers it.
- [ ] Delete the `Sentry.getIsolationScope().setUser(...)` block referencing `request.appSession.isGuest` — replace `isGuest` with `(session?.user as any).isAnonymous` once the new shape is confirmed.

### 3.4 Delete the manual `/auth/*` routes
- [ ] `rm -rf backend/src/routes/auth`
- [ ] Update `backend/src/plugins/sessionResolver.ts`: replace anything that resolves the legacy `appSession` shape — shared-auth's `preHandler` already attaches `request.appSession`. Likely **delete this plugin entirely** and update consumers to read `request.appSession` directly.

### 3.5 Delete now-redundant plugins
- [ ] `backend/src/plugins/cors.ts` — shared-auth/helmet covers; delete.
- [ ] `backend/src/plugins/security.ts` — shared-auth supplies helmet + csrf + rate-limit; delete.
- [ ] Inspect remaining files in `backend/src/plugins/`: keep `swagger.ts` (dev only), delete the rest unless they have non-auth duties.

### 3.6 Env variables to set in `backend/.env` (and `.env.example`)
```
DATABASE_URL=postgresql://p1002_scmgrinder:p1002_scmgrinder@localhost:5433/p1002_scmgrinder
AUTH_BASE_URL=http://localhost:3000/api/auth
BETTER_AUTH_SECRET=<32+ random chars; reuse old one>
LOGTO_ENDPOINT=https://auth.rpgtools.co
LOGTO_APP_ID=<from Logto>
LOGTO_APP_SECRET=<from Logto>
LOGTO_REDIRECT_URI=http://localhost:3000/api/auth/oauth2/callback/logto
LOGTO_POST_LOGOUT_REDIRECT_URI=http://localhost:3000/
CLIENT_ORIGIN=http://localhost:5173
```

### 3.7 Verification
- [ ] `cd backend && npm run dev`; backend starts without error.
- [ ] `curl http://localhost:3000/api/csrf-token` returns `{"token":"..."}`.
- [ ] `curl -i http://localhost:3000/api/auth/oauth2/login/logto` returns a 302 with `Location:` pointing to `auth.rpgtools.co/oidc/auth?...`.
- [ ] Visit the URL in a browser → Logto login → after auth, lands on `localhost:3000/api/auth/oauth2/callback/logto` and ultimately redirects to root with a `__Secure-better-auth.session_token` cookie.
- [ ] `curl --cookie "__Secure-better-auth.session_token=…" http://localhost:3000/api/auth/get-session` returns the session JSON.

**Gate 3:** End-to-end Logto sign-in works against the dev backend with no FE involvement.

---

## Phase 4 — Port character + equipment routes from pgtyped to Prisma

### 4.1 Convert `backend/src/queries/characters.queries.ts` consumers
For each route in `backend/src/routes/characters/`:
- Calls to typed queries that are simple CRUD → replace with `prisma.character.findUnique/update/delete/create/findMany`.
- Calls that wrap stored procs (`generate_character`, `get_character_full`) → replace with:
  ```ts
  const [row] = await prisma.$queryRaw<...>`SELECT * FROM get_character_full(${id}::uuid, ${locale})`;
  ```
- The signed claim flow — **delete it**. shared-auth's `claimRoutes` already mounts `/api/auth/claim/*`. Update FE to call those endpoints in Phase 6.

### 4.2 Convert `backend/src/queries/equipment.queries.ts` consumers
Trigram fuzzy search uses operators Prisma can't express → use `prisma.$queryRaw`. Pattern:
```ts
const rows = await prisma.$queryRaw<EquipmentRow[]>`
  SELECT key, value, similarity(value, ${q}) AS score
  FROM   translations
  WHERE  value % ${q}
  ORDER  BY score DESC
  LIMIT  ${limit}
`;
```

### 4.3 Delete pgtyped artifacts
- [ ] `rm backend/pgtyped.json`
- [ ] `rm backend/src/queries/*.ts backend/src/queries/*.sql`
- [ ] Delete `npm run pgtyped` script in `backend/package.json`.
- [ ] `rm backend/scripts/run-pgtyped.ts` if exists.

### 4.4 Verification
- [ ] `cd backend && npm run build:ts` clean.
- [ ] `npm run test:unit` green (rewrite specs as needed; mocks of pgtyped objects → mocks of Prisma client; the existing test names should still describe valid behavior).
- [ ] `npm run test:integration` green.
- [ ] Manual: hit a few character endpoints with curl, observe expected JSON.

**Gate 4:** No pgtyped left in the repo. `grep -r pgtyped backend/` returns nothing.

---

## Phase 5 — Strip dead auth code

Delete files (the executing agent should `git rm` these and verify the build still passes):

- [ ] `backend/src/services/auth.ts`
- [ ] `backend/src/services/crypto.ts`
- [ ] `backend/src/services/loginLockout.ts`
- [ ] `backend/src/services/turnstile.ts`
- [ ] `backend/src/services/nodemailer.ts`
- [ ] `backend/src/services/claimSignature.ts`  *(shared-auth exports the canonical version)*
- [ ] `backend/src/services/url.ts` if only used by the email flows
- [ ] `backend/src/emails/` (entire directory)
- [ ] `backend/src/routes/root.ts` (SPA-fallback static serving — frontend has its own container now)
- [ ] `backend/src/routes/session/` if only used by the legacy guest-session flow

Update `backend/src/app.ts`:
- [ ] Remove the `routes/root.ts` autoload effect (not needed; autoload handles).
- [ ] Add a tiny `GET /api/health` route (replacing the old `/health` from `routes/root.ts`).

Update `backend/CLAUDE.md`:
- [ ] Remove the "Email Encryption Scheme" section.
- [ ] Remove the "Authentication Flow" sub-bullets about email+password and magic link.
- [ ] Remove Turnstile from the security controls table.
- [ ] Update the "Recommended Skills" list.
- [ ] Add a section: "Auth is handled by `@tackgnol/rpgtools-shared-auth` (Logto + anonymous + claim). See `src/plugins/rpgtools-auth.ts`."

### Verification
- [ ] `cd backend && npm run build:ts && npm test` green.
- [ ] `grep -r "EMAIL_PEPPER\|EMAIL_ENCRYPTION_KEY\|TURNSTILE\|magicLink\|encrypted_email\|email_bidx" backend/src/` returns nothing.

**Gate 5:** Backend is auth-clean. Single auth path: Logto via shared-auth.

---

## Phase 6 — Frontend rewrite

### 6.1 Drop auth-form components
- [ ] `git rm` the sign-in form, sign-up form, magic-link form, password-reset form, Turnstile widget, anything verification-callback related, in `frontend/src/`.
- [ ] Remove `better-auth` from `frontend/package.json` if present, plus any Turnstile site-key handling. (`VITE_TURNSTILE_SITE_KEY` goes.)
- [ ] Remove from `frontend/src/i18n/{en,pl}.json` all keys under sign-in/sign-up/reset/verify trees.

### 6.2 Add a small `auth` module (`frontend/src/auth/index.ts`)
```ts
const API = import.meta.env.VITE_BACKEND_URL || '';

export type Session = {
  user: { id: string; name: string; email?: string; isAnonymous?: boolean } | null;
};

export async function fetchSession(): Promise<Session> {
  const r = await fetch(`${API}/api/auth/get-session`, { credentials: 'include' });
  if (!r.ok) return { user: null };
  const data = await r.json();
  return { user: data?.user ?? null };
}

export function loginUrl()  { return `${API}/api/auth/oauth2/login/logto`; }
export function logoutUrl() { return `${API}/api/auth/sign-out`; }
export function profileUrl() {
  const endpoint = import.meta.env.VITE_LOGTO_ENDPOINT;
  return `${endpoint}/profile`;
}

export async function signInAnonymous() {
  const csrf = await fetch(`${API}/api/csrf-token`, { credentials: 'include' }).then(r => r.json());
  await fetch(`${API}/api/auth/sign-in/anonymous`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'content-type': 'application/json', 'x-csrf-token': csrf.token },
  });
}
```

### 6.3 Replace the header user widget
The single "person" icon in the header becomes:
```tsx
function UserButton() {
  const { data } = useQuery({ queryKey: ['session'], queryFn: fetchSession });
  const user = data?.user;
  const isReal = user && !user.isAnonymous;

  if (!isReal) {
    return <a href={loginUrl()} aria-label="Sign in"><PersonIcon /></a>;
  }
  return (
    <a href={profileUrl()} target="_blank" rel="noopener noreferrer" aria-label="Profile">
      <PersonIcon />
    </a>
  );
}
```
(Plus a separate small "Sign out" link/button next to it if you want — POSTs to `logoutUrl()` with the CSRF token.)

### 6.4 Anonymous bootstrap
On initial app load (root layout / router context), if `fetchSession()` returns `user: null`, call `signInAnonymous()` once and refetch the session. Same UX as today.

### 6.5 Update fetch wrapper / openapi-fetch
- [ ] Set `credentials: 'include'` globally.
- [ ] Add a CSRF interceptor that fetches `/api/csrf-token` once per session and attaches `x-csrf-token` to non-GET requests.

### 6.6 Update routes that reference legacy claim endpoints
- [ ] Replace any FE call to old `/auth/claim*` etc. with the shared-auth equivalents (see `rpgtools-shared-auth/src/fastify/claim.ts` for the surface).

### 6.7 Verification
- [ ] `cd frontend && npm run build` clean (no TS errors after the deletes).
- [ ] `npm run test:unit` and `npm run test:browser` green (rewrite specs that asserted on the old forms; delete the rest).
- [ ] `npm run dev`; in a clean browser:
  1. Land on `localhost:5173` → anonymous session created, can roll a character.
  2. Click person icon → Logto login page → finish login → back to app, anonymous user is linked to real user, character ownership transferred.
  3. Click person icon again → opens Logto profile in a new tab.

**Gate 6:** Full UX verified manually in a fresh browser.

---

## Phase 7 — Dockerfiles + compose

### 7.1 New `backend/Dockerfile`
Mirror `trench-rats/backend/Dockerfile`:
```dockerfile
FROM node:22-alpine AS builder
WORKDIR /app/backend
COPY backend/package*.json backend/.npmrc* ./
RUN npm install
RUN rm -f .npmrc
COPY backend/ .
RUN npx prisma generate
RUN npm run build:ts

FROM node:22-alpine
WORKDIR /app
COPY --from=builder /app/backend/package*.json ./
COPY --from=builder /app/backend/node_modules ./node_modules
COPY --from=builder /app/backend/dist ./dist
COPY --from=builder /app/backend/prisma ./prisma
COPY --from=builder /app/backend/migrations ./migrations
COPY --from=builder /app/backend/init ./init
COPY --from=builder /app/backend/scripts ./scripts
ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000
USER node
CMD ["npm", "start"]
```

### 7.2 New `frontend/Dockerfile`
SPA → static. Multistage with `nginx:alpine`:
```dockerfile
FROM node:22-alpine AS builder
WORKDIR /app
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ .
ARG VITE_BACKEND_URL
ARG VITE_LOGTO_ENDPOINT
ARG VITE_GLITCHTIP_DSN
ENV VITE_BACKEND_URL=$VITE_BACKEND_URL
ENV VITE_LOGTO_ENDPOINT=$VITE_LOGTO_ENDPOINT
ENV VITE_GLITCHTIP_DSN=$VITE_GLITCHTIP_DSN
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```
Add `frontend/nginx.conf`:
```nginx
server {
  listen 80;
  root /usr/share/nginx/html;
  index index.html;
  location / {
    try_files $uri $uri/ /index.html;
  }
  location ~* \.(?:js|css|woff2?|ttf|svg|png|jpg|jpeg|gif|ico)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
  }
}
```

### 7.3 Replace `compose.yaml` (dev)
Two services + db + mailpit-removed (Logto sends mail). Use Docker Compose `develop.watch` for both.

### 7.4 Replace `compose.prod.yaml`
Mirror trench-rats's. Three services: `db`, `backend`, `frontend`. Backend on port 3031, frontend on 3030 (matching the existing Caddyfile naming convention). Drop `migrate` deploy stack — Prisma migrations run in a one-shot `migrate` service like trench-rats.

### 7.5 Verification
- [ ] `docker compose build`
- [ ] `docker compose up` — DB, backend, frontend all start. Hit `localhost:3030` (frontend) and `localhost:3031/api/health` (backend).

**Gate 7:** Two-image deploy works locally.

---

## Phase 8 — Reverse proxy

Update the host's `Caddyfile` (server-side, manual change in your infra repo):
```
scvmrack.rpgtools.co {
  import cloudflare_tls
  @asset_routes path /assets/*
  handle @asset_routes {
    reverse_proxy 127.0.0.1:3030
  }
  @api_routes path /api/*
  handle @api_routes {
    reverse_proxy 127.0.0.1:3031
  }
  handle {
    reverse_proxy 127.0.0.1:3030
  }
}
```
- [ ] Update `Caddyfile.example` in scvmrack repo to match.
- [ ] Update Logto redirect URIs to `https://scvmrack.rpgtools.co/api/auth/oauth2/callback/logto`.

**Gate 8:** Caddy config staged; not yet deployed. Test plan documented for cutover.

---

## Phase 9 — Woodpecker ✅

### 9.1 Update `.woodpecker/deploy.yaml`
- [x] Add secret `npmrc_content` (matches trench-rats' setup).
- [x] Drop secrets: `email_pepper`, `email_encryption_key`, `mail_user`, `mail_pass`, `turnstile_secret_key`, `vite_turnstile_site_key`, `vite_site_url`.
- [x] Add secrets: `logto_endpoint`, `logto_app_id`, `logto_app_secret`, `logto_redirect_uri`, `logto_post_logout_redirect_uri`, `vite_logto_endpoint`, `database_url`.
- [x] Replace the migration shell-out with a one-shot service running `npx prisma migrate deploy`.
- [x] `docker compose -f compose.prod.yaml build && docker stack deploy …` — same shape, two services to `start-first` instead of one.

### 9.2 Update `.woodpecker/branch-tests.yaml` and `dev-tests.yaml`
- [x] Run `npm install` in both `backend/` and `frontend/`.
- [x] Inject `.npmrc` from `npmrc_content` secret before backend install.
- [x] Run unit + integration tests for backend; unit + browser for frontend.

**Gate 9:** Woodpecker pipelines pass on a feature branch (no deploy yet — gate it on `branch == master`).

---

## Phase 10 — `rpgtools-shared-auth` improvements (optional but worth it)

The user's intent: scvmrack consumes shared-auth and nothing else. Right now there are three rough edges that will bite a downstream consumer. **Open these as PRs against `rpgtools-shared-auth`.**

### 10.1 Re-export Better Auth's prisma adapter
Today consumers must `import { prismaAdapter } from 'better-auth/adapters/prisma'`. Cleaner:
```ts
// rpgtools-shared-auth/src/index.ts
export { prismaAdapter } from 'better-auth/adapters/prisma';
```
Then in scvmrack:
```ts
import { rpgtoolsSharedAuth, prismaAdapter } from '@tackgnol/rpgtools-shared-auth';
```

### 10.2 Default `onLinkAccount` for the common case
Most consumers will have a `Character` model with `userId`. Provide a helper:
```ts
// rpgtools-shared-auth/src/helpers.ts
export const transferCharactersOnLink =
  (db: { character: { updateMany: Function } }) =>
  async ({ anonymousUser, newUser }) => {
    await db.character.updateMany({
      where: { userId: anonymousUser.user.id },
      data:  { userId: newUser.user.id },
    });
  };
```
scvmrack then becomes a 5-line plugin.

### 10.3 Bump CSP defaults to allow Logto endpoint
`src/plugin.ts` currently has `connectSrc: ["'self'"]`. Add:
```ts
connectSrc: ["'self'", options.logto?.endpoint ?? ''].filter(Boolean),
```
Otherwise every consumer needs to override CSP.

### 10.4 Version bump + publish
- [ ] Cut `@tackgnol/rpgtools-shared-auth@1.1.0` (breaking? minor — these are additive).
- [ ] Update scvmrack `backend/package.json` to that version.
- [ ] Update trench-rats too in a separate PR.

**Gate 10:** New shared-auth version published; scvmrack consumes it.

---

## Phase 11 — End-to-end verification & merge

### 11.1 Local full smoke
- [ ] Fresh checkout, fresh DB, `docker compose up --build`.
- [ ] Anonymous flow: roll character → persists.
- [ ] Sign-in flow: Logto → returns logged in → character now owned by real user (`SELECT user_id FROM characters` shows the new id).
- [ ] Sign-out: `POST /api/auth/sign-out` clears cookie, anonymous session re-bootstraps on next load.
- [ ] Profile button: opens new tab to Logto profile.
- [ ] Cross-device claim: roll a character anonymously in Browser A, sign-in via Logto in Browser B, copy the claim code from A, paste in B, ownership transfers. (Wire whatever shared-auth's claim UI surface needs — see lib `fastify/claim.ts`.)

### 11.2 Prod smoke (after merge + deploy)
- [ ] Update Caddyfile on the host.
- [ ] Trigger Woodpecker deploy.
- [ ] Same six smoke steps, against `https://scvmrack.rpgtools.co`.
- [ ] Glitchtip shows no new errors after 24h.

### 11.3 Final cleanup
- [ ] Delete `MIGRATION.md`.
- [ ] Update `README.md` to describe the two-app layout (mirror trench-rats's README).
- [ ] Update top-level `CLAUDE.md` and `AGENTS.md`.
- [ ] Confirm no `.env` file is committed; `.env.example` is up to date.

**Gate 11:** Merge to `master`. Tag release.

---

## Files reference (cheat sheet for the agent)

| Need to look at trench-rats? | Path |
|---|---|
| Backend auth plugin (your template) | `trench-rats/backend/src/plugins/rpgtools-auth.ts` |
| Backend Dockerfile | `trench-rats/backend/Dockerfile` |
| Frontend Dockerfile (note: SSR — yours is static, simpler) | `trench-rats/frontend/Dockerfile` |
| Compose | `trench-rats/compose.yaml` |
| Caddy fronting | `trench-rats/Caddyfile.example:64-86` |
| Prisma schema (auth model patterns) | `trench-rats/backend/prisma/schema.prisma` (read it) |

| Need to read in `rpgtools-shared-auth`? | Path |
|---|---|
| `createRpgAuth` config shape | `src/index.ts` |
| Fastify plugin (CSP/CSRF/RL/auth handler) | `src/plugin.ts` |
| Claim adapter interface | `src/types.ts:11-21` |
| Claim routes mounted | `src/fastify/claim.ts` |

---

## Out of scope (don't get sidetracked)

- Migrating game-data tables to Prisma (equipment, weapons, classes, translations) — not worth it; raw SQL + stored procs are appropriate.
- Rewriting the e2e suite from Playwright. Keep, just update auth-related steps.
- SSR for the SPA. The frontend stays a static Vite build.
- Removing PostgreSQL extensions / functions. They're load-bearing.

---

## Total effort, single-user assumption

- Phases 1–2: 0.5 day
- Phase 3: 0.5 day
- Phase 4: 1.5 days (the longest — pgtyped → Prisma is mechanical but covers many call sites)
- Phase 5: 0.5 day
- Phase 6: 1 day
- Phase 7: 0.5 day
- Phase 8: 0.25 day (config only)
- Phase 9: 0.5 day
- Phase 10 (lib improvements): 0.5 day
- Phase 11: 0.25 day

**~5.5 days of focused work.** Plus a buffer of ~1 day for surprises (Logto CSP, cookie domain quirks, prisma-on-existing-tables friction).
