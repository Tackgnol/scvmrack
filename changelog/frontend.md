# Frontend — Feature Summary

`mork-borg-character-sheet` — React 19 SPA with a neo-brutalist MÖRK BORG aesthetic.

## Stack

- **UI:** React 19 + React Compiler, MUI 7 with a custom Mörk Borg theme
- **Data:** TanStack Query + `openapi-fetch` / `openapi-react-query` (typed client)
- **Routing:** TanStack Router
- **Build/test:** Vite 8, Vitest 4 (JSDOM unit + Playwright browser), ESLint 9 (flat config)
- **i18n:** `i18next` / `react-i18next` — English-only (locked to `en`); the Polish bundle and language-switch machinery are retained but disabled for a future re-enable
- **Observability:** Sentry / GlitchTip (`@sentry/react`), Google Analytics (consent-gated)

## Pages

- **Landing** — entry / call to action
- **Characters list** — all characters for the current user
- **Character sheet** — the core editor (stats, equipment, abilities, powers, pets, notes)
- **Print** — printer-friendly character layout
- **FAQ** — help content
- **Release notes** — in-app changelog at `/release`
- **404 / Not found**

## Character editing

- Optimistic updates with debounced autosave (`useCharacterEditor`):
  changes queue as patches → instant UI update via `queryClient.setQueryData`
  → flush after ~1s idle → retry up to 3× with user notification
- Stat tracking and modifiers (computed + custom), ability cards, scroll/power uses
- Inventory with equipped bar, on-hand vs. storage sections, ammo tracking,
  consumables, pets, and custom-item creation
- Kill & Replace flow (death modal at 0 HP)

## Feedback & error reporting

- `ErrorFeedbackProvider` automatically surfaces a dialog on unexpected API errors,
  enriched with HTTP status, API code, and request id
- Manual feedback dialog for general user feedback
- Reports POST to `/api/feedback` (CSRF token attached) and are forwarded to
  GlitchTip server-side; client errors are serialized (name/message/stack)

## Auth & sessions

- Logto sign-in/profile flows plus anonymous guest sessions for first-run ownership
- Character claim flow to transfer guest characters after sign-in
- Session-expiry detection and handling

## Cross-cutting

- Localized (en/pl) throughout, including release notes and feedback copy
- SEO metadata per page; privacy-notice drawer gates analytics consent
- Custom Mörk Borg theme tokens and styles

## Testing

- **Unit** (`test/unit`): Vitest + JSDOM — hooks, utils, routing, auth, error utils
- **Browser** (`test/browser`): Vitest browser mode (Chromium/Firefox/WebKit) —
  component rendering and interaction
