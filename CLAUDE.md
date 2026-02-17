# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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
│   ├── guestSession.ts # Anonymous session handling
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
- Guest users get anonymous sessions stored in `guest_sessions` table
- Authenticated users have characters linked via `user_id`
- Characters can be "claimed" to bind guest characters to authenticated users

### Database Functions
- `generate_character(class_id)` - Creates random character
- `get_character_full(id, locale)` - Returns character with localized data
- Equipment search uses fuzzy matching with PostgreSQL trigram indexes

## Database Reapply Scripts

The project includes scripts to reapply database schema:
- `scripts/db-reapply.sh` (Unix) or `scripts/db-reapply.ps1` (Windows)
- Applies all init SQL files in order

## Environment Variables

- `.env` - Development configuration
- `.env.mydevil` - Production server configuration
- Required: DATABASE_URL, SESSION_SECRET, BETTER_AUTH_SECRET
