# AGENTS.md

This file guides coding agents (Codex, Claude Code, and others) working in this repository. It is the single source of agent instructions; `CLAUDE.md` imports it and adds only Claude-specific notes.

## Project Overview

MÖRK BORG Character Sheet is a full-stack TTRPG character management app with a neo-brutalist punk aesthetic. The repository is a two-app monorepo:

| Directory | Role | Stack |
|---|---|---|
| `backend/` | REST API | Fastify 5, TypeScript, PostgreSQL (custom functions, views, fuzzy search), Prisma, `@tackgnol/rpgtools-shared-auth` |
| `frontend/` | SPA | React 18, Vite, TanStack Query/Router, MUI with a custom Mörk Borg theme |

i18n: English (en) and Polish (pl).

## Common Commands

### Backend (`backend/`)

```bash
npm run dev              # Start the Docker dev stack (compose.dev.yaml) with watch
npm run start            # Production build and start
npm run build:ts         # Compile TypeScript
npm test                 # Fast unit loop: backend unit tests + frontend unit tests
npm run test:integration # Backend integration suite in Docker
npm run test:browser     # Frontend browser suite
npm run test:e2e         # Whole user flow
npm run test:all         # Reproduce CI before pushing to master
```

### Frontend (`frontend/`)

```bash
npm run dev          # Start Vite dev server
npm run build        # Production build
npm run test:unit    # JSDOM unit tests
npm run test:browser # Browser component tests
npm run lint         # ESLint
npm run lint:fix     # Fix linting issues
npm run format       # Format source files with Prettier
npm run doctor       # React health check (react-doctor) — run after touching hooks/components
```

### Docker

```bash
docker compose -f compose.dev.yaml up --build --watch
docker compose -f compose.integration-be.yaml config
docker compose -f compose.prod.yaml config
```

Do not read `.npmrc`; it is gitignored and contains registry credentials.

### Validation checklist (run before committing frontend changes)

| Step | Command | When |
|---|---|---|
| TypeScript | `cd frontend && npx tsc --noEmit` | Always |
| Lint | `cd frontend && npm run lint` | Always |
| Unit tests | `cd backend && npm run test:unit` | Always |
| Browser tests | `cd frontend && npm run test:browser` | When touching components/hooks |
| React health | `cd frontend && npm run doctor` | When touching components/hooks |

React Doctor baseline: see STD-009 under **Known deviations** below.

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
│   ├── routes/          # Fastify route handlers, autoloaded under /api — THIN controllers only
│   ├── services/        # Business logic; return a stable ServiceResult (see API Layering)
│   ├── repositories/    # ALL Prisma / external data access lives here
│   ├── plugins/         # Fastify plugins (autoloaded); rpgtools-auth.ts = shared auth, CSRF, helmet, rate limiting
│   ├── lib/             # Prisma client, character generation/reads, integration helpers
│   ├── schemas/         # JSON schema validation
│   └── types/           # TypeScript types
├── prisma/              # Prisma schema and migrations
├── init/                # Raw SQL, applied in order by migrate.js
│   ├── 01-extensions/   # PostgreSQL extensions
│   ├── 02-schema/       # Tables (characters, classes, equipment, etc.)
│   ├── 03-functions/    # LIVE stored functions only (equipment search, inventory, dice utils)
│   ├── 04-views/        # Database views
│   ├── 05-seed/         # Game data (classes, items, translations)
│   └── _archive/        # Superseded PL/pgSQL (generate/get_full/update_character) — NOT re-applied
├── scripts/             # DB/test/deploy helper scripts
└── tests/               # Backend integration and unit projects
```

`scripts/db-reapply.sh` (Unix) or `scripts/db-reapply.ps1` (Windows) reapply all init SQL files in order.

### Frontend Structure

```text
frontend/src/
├── components/     # React components
├── hooks/          # Character editing, auth, search, and UI hooks
├── obr/            # Owlbear Rodeo extension adapter: SDK glue, room/token bindings, OBR hooks
├── api/            # OpenAPI-generated client
├── pages/          # Route pages
├── router/         # TanStack Router config
├── i18n/           # en/pl translations (en.json, pl.json)
└── theme/          # MUI Mörk Borg theme
```

### Runtime Routing

- Backend API routes live under `/api/*`.
- Shared auth mounts Better Auth at `/api/auth/*`, CSRF at `/api/csrf-token`, and claim routes at `/api/claim/*`.
- The backend keeps `/health` as a direct container health alias and `/api/health` for proxied checks.
- The frontend is a static SPA served by nginx in production.
- Caddy routes `/api/*` to the backend and everything else to the frontend.

## Key Patterns

### API Layering (Repository → Service → Controller)

All backend route groups follow one layering. **Keep new endpoints in this shape — never put Prisma calls or business logic in route files.**

- **Repository** (`src/repositories/*-repository.ts`) — the ONLY place that touches Prisma / external systems. No business logic.
- **Service** (`src/services/*-service.ts`) — all logic (ownership, validation, orchestration). Returns a stable `ServiceResult<T>` (`{ ok: true, value } | { ok: false, error: ApiHttpError }`) from `src/services/result.ts`; map unexpected errors with the shared `unexpected(log, ...)` helper.
- **Controller** (`src/routes/**/index.ts`) — thin HTTP↔service translation using `sendServiceError(reply, request, error)`: domain failures (4xx) are sent to the client; server failures (5xx) are re-thrown so the central error handler renders them and reports to Sentry.
- Services accept a `ServiceLogger` (`request.log` satisfies it). Unit-test services with mocked repositories/lib; repository tests are intentionally skipped (they'd only exercise Prisma).

### Character Editing

The frontend uses optimistic updates with debouncing:

1. Changes are queued as patches in `useCharacterEditor`.
2. UI updates immediately via `queryClient.setQueryData`.
3. Changes flush after 1 second of inactivity; flushes are serialized (one PATCH in flight).
4. The PATCH response (already hydrated) is written back into the cache and still-pending patches are re-applied on top; transient 5xx/network failures auto-retry, then surface a manual retry.
5. The queue is flushed on unmount so a last edit isn't dropped.

**Caution:** the cache is reconciled from the PATCH *response*. Do NOT re-add a per-PATCH `invalidateQueries`/refetch on the character detail query (in `useCharacterRepository` or the editor) — it races the optimistic queue and silently drops edits.

### Authentication Flow

- `@tackgnol/rpgtools-shared-auth` (wired in `backend/src/plugins/rpgtools-auth.ts`) owns Better Auth setup, Logto OAuth, CSRF, security headers, rate limiting, anonymous sessions, and claim routes.
- Logto handles real-user sign-in/profile flows. Anonymous Better Auth sessions are still used for first-run character ownership.
- `request.appSession` is the raw shared-auth session shape: `{ session, user } | null`.
- No roles/RBAC. Authorization is ownership-based: `characters.user_id === request.appSession.user.id`.

### Character Ownership

Characters are bound to users through `characters.user_id`. Ownership transfers by:

1. **`onLinkAccount`** in `rpgtools-auth.ts`, when the same browser session links an anonymous account to Logto.
2. **Shared claim routes** (`/api/claim/issue`, `/api/claim/redeem`) for cross-device transfers.

### Character Generation & Reads (TypeScript, NOT SQL)

- Character generation and full-character reads are **TypeScript** in `backend/src/lib/` (`generate-character.ts`, `get-character-full.ts`), driven by a seedable ChaCha20 roller (`@tackgnol/rpg-tools-roller`) — not Postgres `random()`. Generator parity with the old SQL is a non-goal.
- Character updates go through Prisma directly (via the repository/service), not a stored procedure.
- The legacy PL/pgSQL (`generate_character`, `get_character_full`, `update_character`) is **dead and archived** in `backend/init/_archive/`. Do not call, re-add, or "fix" it.
- Still live in the DB: equipment fuzzy search (PostgreSQL trigram indexes), inventory helpers, and dice utils in `backend/init/03-functions/`.
- Prisma owns auth/claim tables and models the character relation. Remaining game schema/seed data come from `backend/init/`.

## Security Architecture

Pentested with Shannon AI (2026-03-23). All findings remediated or accepted.

### Validated Security Controls

| Control | Implementation | Status |
|---|---|---|
| Session cookies | `HttpOnly`, `Secure`, `SameSite=Lax`, `__Secure-` prefix | Verified |
| HSTS | `max-age=31536000; includeSubDomains` via `@fastify/helmet` | Verified |
| CSRF | HMAC double-submit cookie on all POST/PATCH/DELETE/PUT outside `/api/auth/*`; skipped for cookie-less `Authorization: Bearer` requests (RPG-288) | Verified |
| Password/auth UX | Managed by Logto + Better Auth via shared-auth | Verified |
| SQL injection | Prisma parameterization and `$queryRaw` tagged templates | Verified |
| Cache-control | `no-store, no-cache, must-revalidate, private` on all auth responses | Verified |
| Rate limiting | Per visitor: shared-auth's default `keyGenerator` (`clientIp`, exported by `@tackgnol/rpgtools-shared-auth` >= 1.7.2) uses Cloudflare's `CF-Connecting-IP`, trusted only when the peer is a private address (Caddy), and also feeds Better Auth's own sign-in limiter. Behind Caddy `request.ip` is the Docker gateway for everyone, so never key limits on it. 300 req/min global per visitor (`rpgtools-auth.ts`), 20–50 req/min on character/equipment routes | Verified |
| Claim signatures | Shared-auth HMAC claim flow | Verified |
| Swagger/OpenAPI | Disabled in production (`NODE_ENV=production`) | Verified |
| Dockerfile | Runs as `node` user, not root | Verified |
| OBR room access | Room-scoped reads are gated by the **(roomId, characterId) binding tables** (`ObrPlayerCharacterBinding`/`ObrTokenCharacterBinding`): `GET /api/obr/rooms/:roomId/cards` returns table-visible cards only for bound ids; binding writes require a session and owner-or-already-in-room. **Accepted room-trust residual (2026-07-01):** the unguessable OBR room id is a capability — anyone holding it can list bindings/bound cards, manage that room's enemy board (`/api/parties/by-room/:roomId/*`), read the room party roster via `POST /api/parties/promote`, and read that party's Party Class Pool (the Roll popover's class picker). Changing the pool still needs the owning GM; an unclaimed `system:obr-room` party rolls the read-only default pool. The party **invite token stays owner-only** (non-owners get a token-less view); a signed-in GM can claim a system-owned room party; party attach/detach is owner-only. | Accepted |
| Custom Class content | Only the owning signed-in GM may create, edit, publish, or change visibility of a Custom Class; public classes are readable without a session. Takedown blocks saving and publishing and removes the lineage from party pools. The public report flow implements DSA notice-and-action handling: signed-out notices enter human review, serious categories are flagged, and authors receive a statement of reasons on takedown. Moderation decisions are appended to a log; resolved reports have reporter details anonymized after two years. Public reporting and moderation routes use per-visitor `clientIp` rate limits. | Implemented; SES delivery requires production configuration |

### Security Rules

- **Never commit secrets.** `.env`, `.env.*`, and `.npmrc` are ignored.
- Keep Logto credentials in env/secret storage, not source files or compose defaults.
- Do not bypass shared-auth CSRF for app state-changing routes.
- Do not reintroduce plaintext email storage, local password UI, magic-link UI, or Turnstile code in this app; those concerns moved out with the auth migration.

## Environment Variables

- Backend dev values live in `backend/.env`, based on `backend/.env.example`. Production deploy values can be documented locally in root `.env`, based on root `.env.example`. Never commit either.
- Required backend: `DATABASE_URL`, `BETTER_AUTH_SECRET`, `AUTH_BASE_URL`, `APP_BASE_URL`, `CLIENT_ORIGIN`, `LOGTO_ENDPOINT`, `LOGTO_APP_ID`, `LOGTO_APP_SECRET`, `LOGTO_REDIRECT_URI`, `LOGTO_POST_LOGOUT_REDIRECT_URI`
- Optional backend: `RATE_LIMIT_SCALE` (multiplies every per-visitor rate limit; default 1, the e2e/integration stacks set 1000), `DATABASE_USER`, `DATABASE_HOST`, `DATABASE_NAME`, `DATABASE_PASSWORD`, `DATABASE_PORT`, `CLIENT_GATEWAY`, `LOGTO_RESOURCE`, `GLITCHTIP_DSN`, `PARTY_MAX_MEMBERS` (party member cap; default 10), `CUSTOM_CLASS_MAX_PER_GM` (class cap; default 50), `CUSTOM_CLASS_DAILY_PUBLISH_LIMIT` (new public-class cap; default 5), `MODERATION_ADMIN_USER_IDS` (comma-separated signed-in account IDs allowed to moderate), `SES_REGION`, `SES_ACCESS_KEY_ID`, `SES_SECRET_ACCESS_KEY` (all three required for moderation email delivery)
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

For a significant Terms or Privacy change, add a dated entry to `frontend/src/legal/legalNotices.ts` with an effective date at least 14 days later, and update the matching legal copy date. For Terms changes, preview the public-class GM audience with `node --import tsx scripts/send-terms-notice.ts` from `backend/`; after checking SES and the count, send once with `--send`. A partial SES failure can duplicate earlier messages on retry, so review the send log before retrying. No notice is active for the initial 0.7.0 copy.

## Project Workflow

- **Issue tracker:** Linear (rpgtoolsco workspace, team `RPG`, `RPG-<n>`), not GitHub Issues. See `docs/agents/issue-tracker.md`.
- **Triage labels:** default five-role vocabulary (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.
- **Domain docs:** single-context: one root `CONTEXT.md` + `docs/adr/`, created lazily. See `docs/agents/domain.md`.

## Universal RPG-Tools Standard

Baseline rules shared by every RPG-Tools app, copied from `WebstormProjects/AGENTS.md` (the source of truth; re-sync from there rather than editing here). Where this repo deliberately differs, it is listed under **Known deviations** and that entry wins for this repo. Entry numbers (`STD-NNN`) are stable.

### Shared infrastructure (assumed by every entry)

Traffic path in production: **Cloudflare (certed) -> Caddy on the host (127.0.0.1 published ports) -> Docker container**. The app never talks to the internet directly. CI is Woodpecker (`ci.rpgtools.co`) and runs one pipeline at a time.

---

### STD-001: Rate limits are keyed on the real client IP, never `request.ip`

**Rule.** Any per-client limiter (`@fastify/rate-limit`, custom counters, ban lists) must key on the real client address taken from Cloudflare's `CF-Connecting-IP`, and only when the socket peer is a private or loopback address (our Caddy).

**Why.** Found 2026-09-19 in scvmrack. Behind Caddy the container sees the Docker bridge gateway (`172.x.0.1`) as the peer for every visitor, and Fastify runs without `trustProxy`, so `request.ip` is the same for everyone. The "per IP" limit was one bucket for the whole site: the global 100 req/min and every per-route limit (20-50/min) were shared by all visitors. Symptom in the wild: brand-new mobile visitors got **429 on the very first request of a page load**, which broke anonymous sign-in (GlitchTip `Failed to bootstrap anonymous session`). Nothing in the client's own traffic could have caused it.

**How to apply.**
- Reference implementation: scvmrack `backend/src/lib/client-ip.ts` (`clientIp`). It returns `CF-Connecting-IP` only if it is a valid IP (`net.isIP`) **and** the peer is in a private range (`net.BlockList`: 127/8, 10/8, 172.16/12, 192.168/16, ::1, fc00::/7, including IPv4-mapped IPv6), otherwise `request.ip`.
- Wire it as the limiter's `keyGenerator`. In scvmrack it is passed through shared-auth as `security.rateLimit.keyGenerator`. `@fastify/rate-limit` merges route-level `config.rateLimit` over the global params, so route limits inherit the global `keyGenerator`; you do not repeat it per route.
- Do not switch on Fastify `trustProxy` as the fix: with Caddy in the middle the `X-Forwarded-For` chain is Caddy's view (Cloudflare edge IP), and a wrong hop count lets clients spoof their IP.
- Limits in use: shared-auth's default global limit is 100 req/min; scvmrack sets **300 req/min per visitor** globally (test environments raise every cap with `RATE_LIMIT_SCALE`; source never checks for tests), with stricter per-route limits (20-50/min) on abuse-prone routes. With per-visitor keys, 300/min is still a real cap (5 req/s per person).
- Clients must **not retry a 429**: it spends more of the limit that tripped it. Retry network errors and 5xx only.

**Verify.**
- Unit: header honoured from a private peer, ignored from a public peer, malformed or missing header falls back, and two visitors behind the same proxy get different keys. Include one test against the real `@fastify/rate-limit` showing one visitor hitting the limit does not block another.
- Live: `curl -sI https://<app>/api/csrf-token | grep -i ratelimit` from two different networks. `x-ratelimit-remaining` must count down independently. If the second network continues from the first's count, the bucket is still shared.

**Caveats.**
- Mobile carriers put many users behind one IP (CGNAT), so occasional 429s for those users remain.
- The `CF-Connecting-IP` trust assumes the origin is only reachable through Cloudflare. A direct hit on the origin from a public address already ignores the header.
- **Applies to every app, no exceptions.** Every RPG-Tools app runs behind Cloudflare -> Caddy -> Docker, so every one must set the `keyGenerator`. `@tackgnol/rpgtools-shared-auth` registers `@fastify/rate-limit` without one, so an app built on it is shared-bucket-broken until it passes `security.rateLimit.keyGenerator`. New apps set it from day one and add the Verify checks above to their tests.

---

### STD-002: One component per file, no in-component rendering

**Rule.** One React component lives in exactly one file. A component's render output is never built up in variables or helper functions inside the component; every piece of JSX that deserves a name is its own component in its own file.

**Why.** Files stay small and named after what they contain, so a component is found by filename, not by scrolling. Splitting out named pieces keeps each one independently testable and keeps diffs local. Fragments assigned to local variables or returned from `renderX()` helpers hide structure from the component tree (React DevTools, tests, error boundaries) and grow into unreadable render bodies.

**How to apply.**
- File name matches the component name (`PlayerCard.tsx` holds `PlayerCard`). Hooks used only by that component may sit in the same file; its props and other types go in `Component.models.ts` (STD-004). A second component may not.
- No components declared inside another component or module-level in the same file, even small ones.
- No JSX held in variables, and no `renderFoo()` helpers inside a component:

```tsx
// wrong
const component = (<div>{foobar}</div>);
return (<div>{component}</div>);

// right: PlayerBadge.tsx
return (<div><PlayerBadge foobar={foobar} /></div>);
```

- JSX written directly in the `return` (including inline conditionals like `{cond && <Foo />}` and `.map(x => <Foo key={x.id} />)`) is fine; the ban is on naming a piece of JSX in a variable or helper instead of extracting it.

**Verify.**
- Lint, in every repo: `react/no-multi-comp` (with `ignoreStateless: false`), `react/no-unstable-nested-components`, and a `no-restricted-syntax` selector for JSX assigned to a variable (`VariableDeclarator[init.type=/^JSX(Element|Fragment)$/]`). Confirm the selector fires on the wrong example above before relying on it.
- `renderFoo()` helpers are not reliably lintable; catch them in review.

---

### STD-003: Atomic design on unstyled primitives, HeroIcons for icons

**Rule.** Every app's UI is organised by atomic design (atoms, molecules, organisms, templates, pages). Interactive primitives are built on an unstyled, accessible library, **React Aria** (React Aria Components) by default. Icons come from **HeroIcons** by default. Both defaults are a baseline, not a mandate: where they do not fit, the agent chooses what serves the app.

**Why.** Atomic levels give every component one obvious home and one obvious set of allowed dependencies, which keeps the UI consistent across apps and easy for agents to extend without inventing structure. An unstyled accessible library gives keyboard, focus and screen-reader behaviour for free while leaving each app's look fully ours. One icon set keeps stroke weight and visual language uniform.

**How to apply.**
- Levels and what belongs in them:
  - **Atoms:** smallest indivisible UI pieces (button, input, label, icon wrapper, badge). Wrap the underlying unstyled primitive here and style it once.
  - **Molecules:** a few atoms doing one job (labelled field, search box, stat pair).
  - **Organisms:** self-contained sections built from molecules and atoms (character sheet panel, nav bar, roll log).
  - **Templates:** page layout with slots and no real data.
  - **Pages:** templates filled with real data and wired to routes and state.
- Dependencies point one way: a level may use only levels below it (pages -> templates -> organisms -> molecules -> atoms). Nothing imports upward or sideways across organisms.
- Data fetching and app state live at organism level or above; atoms and molecules take props.
- Each component is still one file (STD-002); the level is a directory and each component gets its own folder inside it (`components/atoms/Button/Button.tsx`, see STD-004), not a naming convention.
- Unstyled primitives: use React Aria Components, or a similar unstyled library (Radix, Headless UI, Ark UI) where React Aria lacks the component or its model does not fit. Prefer one library per app; mix only when a specific component forces it. Do not fall back to a pre-styled kit (MUI, Chakra, etc.) as the baseline.
- Icons: HeroIcons (`@heroicons/react`), outline/solid variants chosen consistently within an app. If the app's style diverges from HeroIcons, use a better-matching set, but one set per app, wrapped in an atom so swapping stays a one-file change.
- Wiggle room is explicit: if React Aria or HeroIcons genuinely does not fit (missing component, style clash, bundle cost), pick the better option and note why in the app's `CLAUDE.md`. Do not contort the design to preserve the default.

**Verify.**
- Import direction is enforced by lint where practical (`no-restricted-imports` or `eslint-plugin-boundaries` with one rule per level). Confirm the rule fails on a deliberate upward import before relying on it.
- Review check: no raw `<button>`/`<input>`/`<dialog>` style-and-behaviour reimplementation outside atoms, and no second icon set without a note in `CLAUDE.md`.

---

### STD-004: Component folder layout

**Rule.** Every component has its own folder named after it, and the files inside are split by kind of content using fixed suffixes. Not every component has every file; a file exists only when there is something to put in it, and once there is, it goes in that file.

```
components/atoms/Button/
  Button.tsx          the component (STD-002: one per file)
  Button.styles.css   the component's own styles
  Button.utils.ts     logic extractable from the component
  Button.schemas.ts   Zod schemas
  Button.models.ts    Props and any other types/models
```

**Why.** A predictable shape means anyone (human or agent) knows where a thing lives without searching, and the component file stays about rendering only.

**How to apply.**
- `Component.tsx`: the component and hooks used only by it. Nothing else.
- `Component.styles.css`: any styling specific to this component. No component styles in other files.
- `Component.utils.ts`: pure helpers and logic that can be extracted from the component (formatting, calculations, mappers).
- `Component.schemas.ts`: Zod schemas. Derive types from them with `z.infer` and export those types from `models`, so schema and type do not drift.
- `Component.models.ts`: `Props` and every other type, interface or model the component owns.
- The folder name, the component name and the file prefix are identical (`Button/Button.tsx`). A component with only `Button.tsx` still gets its folder, so adding a file later moves nothing.

**Verify.** Review check plus a quick scan: `*.tsx` files contain no `z.object(` and no exported `type`/`interface`; no `.css` in a component folder other than `Component.styles.css`.

---

### STD-005: TypeScript always

**Rule.** All app code is TypeScript: `.ts` and `.tsx`, never `.js`/`.jsx` (config files a tool insists on excepted).

**Why.** Zod schemas, `Props` in models files and the atomic dependency rules all lean on types; untyped files break that chain.

**How to apply.** New files are `.ts`/`.tsx` from the start. `strict` stays on. No `any` without a comment saying why.

**Verify.** `tsc --noEmit` in CI; no `.js`/`.jsx` under `src/` (outside generated or tool-mandated config).

---

### STD-006: Lift shared code to the nearest common level

**Rule.** When something (component, util, schema, model, style) is used in more than one place, move it up to the nearest directory that contains all its users and export it from there. Consumers import from that one location; no copies, no reaching into another component's folder.

**Why.** Copies drift, and imports into a sibling's internals make that sibling impossible to change safely. One home per shared thing keeps ownership clear.

**How to apply.**
- Lift on the second real use, not speculatively. One user means it stays in the component's own folder.
- Shared **components** follow STD-003: two molecules that need the same piece means it is an atom, so it lifts to `atoms/`, not into one molecule's folder.
- Shared **utils / schemas / models** lift to the shared `utils`, `schemas` or `models` file of the nearest common ancestor (or to app-level shared folders once more than a feature needs them), and the originals import from there.
- After lifting, delete the old copy in the same change.

**Verify.** Review check: a duplicate of an existing helper, schema or type is a review failure; so is an import path that goes into another component's folder (`../OtherThing/OtherThing.utils`).

---

### STD-007: Baseline libraries

**Rule.** Every app starts from the libraries below. Reach for an alternative only when one of them cannot do the job, and say why in the app's `CLAUDE.md`. Do not add a second library for a job one of these already covers.

| Job | Library |
|---|---|
| Routing | React Router, latest major (8 at time of writing) |
| Validation | Zod |
| Forms | React Hook Form |
| Server state (SPAs) | TanStack React Query |
| Analytics | `analytics` |
| Error reporting | Sentry SDK, pointed at GlitchTip |
| Backend server | Fastify |
| Dice/rolls | `@tackgnol/rpg-tools-roller` |
| Auth | `@tackgnol/rpgtools-shared-auth` |

**Why.** Every app shares the same stack, so code, patterns and fixes move between them without relearning, and agents do not re-decide the basics on every project.

**How to apply.**
- **Routing mode is decided per app, at boot.** React Router has a framework mode and a library mode (the SPA-style alternative). When starting a new project for the first time, **ask the user which one** before scaffolding; do not pick silently. Record the answer in the app's `CLAUDE.md`.
- **Validation and forms.** Zod schemas live in `Component.schemas.ts` (STD-004) and are the single source of truth for types (`z.infer`). Forms use React Hook Form with the Zod schema wired in through `@hookform/resolvers/zod`. Backend request/response validation also uses Zod. Do not hand-write a second validator for the same shape.
- **React Query** is the server-state layer for SPAs: fetching, caching and mutations go through it, not ad-hoc `useEffect` + `fetch`.
- **Analytics** goes through the `analytics` package (plugins for the actual providers), never a vendor script or SDK called directly from components.
- **Error reporting** uses the Sentry SDKs (`@sentry/react` in the browser, `@sentry/node` on the backend) with the DSN pointing at our GlitchTip instance. GlitchTip is Sentry-compatible, so no separate client library.
- **Backend** is Fastify. Rolls come from `@tackgnol/rpg-tools-roller` and auth from `@tackgnol/rpgtools-shared-auth`; do not reimplement either in an app. Note the different spellings: `rpg-tools-roller` has a hyphen in `rpg-tools`, `rpgtools-shared-auth` does not. Rate limiting on top of shared-auth follows STD-001.

**Verify.** `package.json` review at project start and on dependency changes: every row above is present where the app needs that job, and no competing library (another form, validation, data-fetching or error-reporting lib) has been added beside it.

---

### STD-008: Comments explain the unusual, not the obvious

**Rule.** Comments are for two things only: (1) documenting what a function does, and (2) flagging something genuinely weird, such as a hack, a workaround, or code that will be redundant in a few months. Nothing else gets a comment.

**Why.** Comments that restate the code rot, add noise and bury the few that matter. Well-named code says how; a comment earns its place by saying what the code cannot: the contract, or why it looks wrong.

**How to apply.**
- **Function docs:** a short doc comment on what the function does (its purpose and contract), not how it does it. One or two lines. No walkthrough of the implementation.
- **Weirdness:** when something is a hack, works around a bug or quirk, or has a known expiry ("remove once X ships", "redundant after the Y migration"), say so in one or two lines with the reason and, if known, the exit condition.
- **No narration.** Do not comment what a line, block or type plainly does. Do not explain elementary logic in prose: a comment like `this function uses base arithmetic to perform an add operation between two integers` is exactly what not to write. Fix an unclear name instead of explaining it.
- No commented-out code (git remembers), no change-log comments, no decorative banners, no `// TODO` without a ticket or a real exit condition.

**Verify.** Review check: for every comment ask "does this document a function's purpose, or warn about something weird?" If neither, delete it.

---

### STD-009: React Doctor gate: 80 minimum, 90 preferred, never regress

**Rule.** Every React app is scanned with [React Doctor](https://github.com/millionco/react-doctor) (`react-doctor`). The score must be **80 or higher**; **90 or higher is preferred**. Any change, including adding a new thing, must leave the score **no lower than before it**. A regression is a failed change even if the score is still above 80.

**Why.** React Doctor catches correctness, performance, accessibility, bundle and architecture problems that agent-written React tends to accumulate. A floor keeps the app healthy, and the no-regress rule stops it eroding one small change at a time.

**How to apply.**
- Each frontend has `"doctor": "npx react-doctor@latest"` in `package.json` (scvmrack already does). Run `npm run doctor` after touching components or hooks, and before committing frontend changes.
- Record the score before starting a change, run again after, and compare. If it dropped, fix the findings you introduced before finishing. Do not merge a lower score.
- New components and features are held to the same bar as existing ones: they must not lower the score.
- If the app is below 80 today, the current score is its no-regress baseline and raising it to 80 is the priority; note the baseline in the app's `CLAUDE.md`.
- Do not silence rules, exclude files, or lower thresholds to hit the number. If a finding is a false positive, note it in `CLAUDE.md` with the reason.

**Verify.** CI runs React Doctor on every PR and on `main`, and fails the PR if the score is under 80 or below the score on `main`. scvmrack has a GitHub Actions workflow for this (`frontend/.github/workflows/react-doctor.yml`); CI here is Woodpecker, so wire the same check there. Confirm the exact CLI options for score output and failing on a threshold with `react-doctor --help` rather than assuming.

### Known deviations (scvmrack)

Current choices that differ from the baseline. They are legacy, not precedent: leave existing code alone unless a task is migrating it, and write new code to the baseline wherever it can be done without a rewrite of its surroundings.

- **STD-007 (routing):** the frontend uses TanStack Router (`frontend/src/router/`), not React Router.
- **STD-003 (UI primitives):** the UI is MUI with a custom Mörk Borg theme, not an unstyled library such as React Aria.
- **STD-003 / STD-004 (structure):** `frontend/src/components/` is flat and not organised by atomic level or per-component folders.
- **STD-007 (validation):** backend request/response validation uses Fastify JSON schemas (`backend/src/schemas/`), not Zod.
- **STD-009:** the measured React Doctor baseline is **62** (2026-10-14, after the PR #31 review fixes), using `npm run doctor -- --score --yes --no-parallel` in `frontend/`. Preserve or improve this score; the target remains 80 or higher.
