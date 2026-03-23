# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Project Overview

MÖRK BORG Character Sheet - A full-stack TTRPG character management application with a neo-brutalist punk aesthetic. The project consists of a Fastify backend API and a React frontend.

## Tech Stack

- **Backend**: Fastify 5.x with TypeScript, PostgreSQL, better-auth
- **Frontend**: React 18, Vite, TanStack Query, TanStack Router, MUI with custom Mörk Borg theme
- **Database**: PostgreSQL with custom functions, views, and fuzzy search
- **i18n**: English (en) and Polish (pl)

## Common Commands

### Backend (root directory)
```bash
npm run dev      # Start development with hot reload
npm run start    # Production build and start
npm run build:ts # Compile TypeScript
npm run test     # Run tests
```

### Frontend (client directory)
```bash
cd client
npm run dev          # Start Vite dev server
npm run build        # Production build
npm run lint         # Run ESLint
npm run lint:fix     # Fix linting issues
npm run format       # Format code with Prettier
```

## Architecture

### Backend Structure
```
src/
├── routes/          # Fastify route handlers (autoloaded)
│   ├── auth/        # Authentication endpoints
│   ├── characters/  # Character CRUD operations
│   ├── equipment/   # Equipment search
│   └── session/     # Session management
├── plugins/         # Fastify plugins (autoloaded)
│   ├── cors.ts      # CORS configuration
│   ├── sessionResolver.ts # Session resolution (auth + anonymous)
│   └── security.ts  # Helmet, rate limiting
├── services/        # Business logic
│   ├── auth.ts      # better-auth setup
│   └── db.ts        # PostgreSQL query helpers
├── schemas/         # JSON schema validation
├── types/           # TypeScript types
└── emails/          # Email templates
```

### Frontend Structure
```
client/src/
├── components/     # React components (UI)
├── hooks/          # Custom hooks (character editing, auth, search)
├── api/            # OpenAPI-generated client
├── pages/          # Route pages
├── router/         # TanStack Router config
├── i18n/           # Translations (en.json, pl.json)
└── theme/          # MUI Mörk Borg theme
```

### Database (init/)
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
- **Better Auth v1.4.13** manages all sessions via `__Secure-better-auth.session_token` cookie (`HttpOnly`, `Secure`, `SameSite=Lax`)
- Three auth modes: email+password, magic link (passwordless), anonymous bootstrap (auto-created on page load)
- The `sessionResolver.ts` plugin resolves Better Auth sessions into `request.appSession` on every request (skips `/auth/*` routes)
- No roles/RBAC — authorization is purely ownership-based (`character.user_id === session.userId`)

### Email Encryption Scheme
- Emails are **never stored in plaintext** in the database
- A **blind index** (HMAC-SHA256 with `EMAIL_PEPPER`) is stored as `<hash>@bidx.local` for lookup
- The real email is encrypted with **AES-256-GCM** (`EMAIL_ENCRYPTION_KEY`) and stored in `encrypted_email`
- The auth route interceptor (`src/routes/auth/index.ts`) transforms plaintext emails before passing to Better Auth, conveying the real email via the internal `x-plain-email` header (stripped from external requests)

### Character Ownership Model
Characters are bound to users via `user_id`. Three paths transfer ownership:
1. **`onLinkAccount`** (auth.ts) — Better Auth callback when anonymous user links to email account (same browser session)
2. **Auto-claim via `/verify-email`** — cross-browser/device verification using HMAC-signed claim parameters (`claimSignature.ts`). Signature binds `userId + sourceUserId + characterId` with `timingSafeEqual`
3. **`POST /characters/:id/claim`** — manual endpoint, restricted to authenticated users claiming characters from anonymous users only

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
| CSRF | HMAC double-submit cookie on all POST/PATCH/DELETE/PUT outside `/auth/*` | Verified |
| Password hashing | bcrypt via Better Auth | Verified |
| Session invalidation | `deleteSession()` clears DB record + cookie on logout | Verified |
| SQL injection | Parameterized queries (`pg` library) throughout, no dynamic column names | Verified |
| Cache-control | `no-store, no-cache, must-revalidate, private` on all auth responses | Verified |
| Rate limiting | 10 req/min per IP on auth endpoints, 30 req/min on character/equipment | Verified |
| Turnstile CAPTCHA | Server-side Cloudflare verification on sign-in/sign-up/magic-link | Verified |
| Claim signatures | HMAC-SHA256 with `timingSafeEqual`, buffer length validation | Verified |
| Swagger/OpenAPI | Disabled in production (`NODE_ENV=production`) | Verified |
| Dockerfile | Runs as `node` user, not root | Verified |

### Security Considerations When Modifying
- **Never commit secrets** to version control (`.env` files are in `.gitignore`)
- **Never expose `x-plain-email`** — it is an internal header, stripped from external requests in the auth route
- **Sign-up error responses** are normalized to prevent user enumeration
- **Claim endpoint** only allows claiming from anonymous users — never modify to allow claiming from authenticated users
- **GCM decryption** validates IV (16 bytes) and auth tag (16 bytes) before decrypting

## Database Reapply Scripts

The project includes scripts to reapply database schema:
- `scripts/db-reapply.sh` (Unix) or `scripts/db-reapply.ps1` (Windows)
- Applies all init SQL files in order

## Environment Variables

- `.env` - Development configuration (never commit to git)
- Required: `DATABASE_USER`, `DATABASE_HOST`, `DATABASE_NAME`, `DATABASE_PASSWORD`, `DATABASE_PORT`
- Required: `BETTER_AUTH_SECRET`, `EMAIL_PEPPER` (min 32 chars), `EMAIL_ENCRYPTION_KEY` (64 hex chars)
- Optional: `AUTH_BASE_URL`, `CLIENT_ORIGIN`, `CLIENT_GATEWAY`, `TURNSTILE_SECRET_KEY`
