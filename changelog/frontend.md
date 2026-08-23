# Frontend — Feature Summary

`mork-borg-character-sheet` — React 19 SPA with a neo-brutalist MÖRK BORG aesthetic.

## Stack

- **UI:** React 19 + React Compiler, MUI 7 with a custom Mörk Borg theme
- **Data:** TanStack Query + `openapi-fetch` / `openapi-react-query` (typed client)
- **Routing:** TanStack Router
- **Build/test:** Vite 8, Vitest 4 (JSDOM unit + Playwright browser), ESLint 9 (flat config)
- **i18n:** `i18next` / `react-i18next` — English + Polish, switched from a header language toggle; locale is detector-driven (localStorage → navigator), the Polish bundle loads lazily, and an optional `/{lang}/` URL prefix seeds the language
- **Observability:** Sentry / GlitchTip (`@sentry/react`), Google Analytics (consent-gated)

## Pages

- **Landing** — entry / call to action
- **Characters list** — all characters for the current user
- **Character creation** — opt-in `/character/create` flow for choosing a class,
  previewing a fully rolled scvm, re-rolling individual sections, and confirming
  the final character; class catalog loading has a bounded timeout, reports
  actionable diagnostics, and can be retried without refreshing the page
- **Character sheet** — the core editor (stats, equipment, abilities, powers, pets, notes);
  sheet navigation uses canonical `/character/<id>` URLs without stale `character`
  query parameters
- **Party** — GM party control (`/party/<id>`) with invite link, live warband
  vital strip, and member kick; player party view binds a scvm via an invite link
  (`/join/<token>`, with `/forge` and `/roll` sub-routes) and shows a live,
  read-only warband
- **Owlbear Rodeo extension** — `/obr.html` embeds the in-room scvmrack
  experience: players see their own editable sheet, GMs see a live roster built
  from bound scene tokens, bound tokens expose a compact read-only card peek from
  the context menu, selected tokens can be bound/re-bound with the scvm name
  shown in the token indicator, the top OBR controls stay reachable while the
  embedded sheet scrolls, and GMs can move the room into a durable scvmrack
  party with invite/manage links and manage room-scoped enemy cards from inside
  Owlbear; the enemy tab prepares its room board automatically when needed, and
  player-facing enemy cards open as token popovers instead of inline sheet
  panels. The OBR manifest and extension entry files are CORS-enabled and
  non-cacheable for Owlbear installs. OBR and the main party view share the same
  warband projection for combat modifier filtering and armor DR display.
- **GM overview** — `/gm` dashboard to create and open parties; party creation
  keeps the yellow name input legible with black text and validates names at 100
  characters before submit
- **Print** — printer-friendly character layout
- **FAQ** — help content
- **Release notes** — in-app changelog at `/release`
- **404 / Not found** — includes malformed sheet paths such as `/character/`

## Character editing

- Optimistic updates with debounced autosave (`useCharacterEditor`):
  changes queue as patches → instant UI update via `queryClient.setQueryData`
  → flush after ~1s idle → retry up to 3× with user notification
- Stat tracking and modifiers (computed + custom), ability cards, scroll/power uses
- Inventory with equipped bar, on-hand vs. storage sections, ammo tracking,
  consumables, pets, and custom-item creation
- Equipment lookup/add-item flow keeps the add controls stable while search and
  add calls are pending, reducing layout jumps when items enter the sheet
- Kill & Replace flow (death modal at 0 HP)
- Character bootstrap and route synchronization avoid render-phase state writes
  and coalesce duplicate character-id navigation, preventing recovery loops and
  stack overflows during rapid route changes

## Feedback & error reporting

- `ErrorFeedbackProvider` automatically surfaces a dialog on unexpected API errors,
  enriched with HTTP status, API code, and request id
- Frontend and backend GlitchTip reports carry the same release/environment while
  using separate projects; production browser traces upload private source maps,
  group API failures by stable code and operation, and discard narrowly identified
  expected HTTP, navigation, crawler, and Cloudflare beacon noise
- Missing or forbidden character and print routes recover through a clean character
  selection reset without deleting anything or navigating back to the invalid id;
  expected client errors and navigation aborts stay out of GlitchTip
- Manual feedback dialog for general user feedback
- Reports POST to `/api/feedback` (CSRF token attached) and are forwarded to
  GlitchTip server-side; client errors are serialized (name/message/stack)

## Auth & sessions

- Logto sign-in/profile flows plus anonymous guest sessions for first-run ownership
- Anonymous bootstrap completes only after the new cookie resolves to a readable
  session; user-id transitions clear ownership-scoped query caches and the
  remembered character before protected character flows resume
- Character claim flow to transfer guest characters after sign-in
- Session-expiry detection and handling

## Cross-cutting

- The header identifies Scvmrack as Beta
- Localized (en/pl) throughout, including release notes and feedback copy
- SEO metadata per page; privacy-notice drawer gates analytics consent
- Custom Mörk Borg theme tokens and styles

## Testing

- **Unit** (`test/unit`): Vitest + JSDOM — hooks, utils, routing, auth, error utils
- **Browser** (`test/browser`): Vitest browser mode (Chromium/Firefox/WebKit) —
  component rendering and interaction
