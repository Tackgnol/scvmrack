# Owlbear Rodeo Extension — Implementation Plan

Architecture review + UI mockups: `C:\Users\Adam\AppData\Local\Temp\architecture-review-owlbear-1719399600.html`
SDK reference (vendored): `docs/owlbear/` (saved API pages), `docs/owlbear-sdk-tutorials/` (official tutorials repo, `.git` stripped)
Branch: `feat/owlbear`
Room-party follow-up: `docs/superpowers/plans/2026-06-27-owlbear-room-party.md`
extends the table integration into a live OBR room roster, compact card peek,
and logged-in GM promotion flow.

## Decisions locked in

| Decision | Choice | Rationale |
|---|---|---|
| Entry strategy | Vite multi-entry (`obr.html` + `src/obr-entry.tsx`) | Hard bundle isolation — `@owlbear-rodeo/sdk` never reachable from the main bundle |
| OBR extension type | `action` (side panel) | `action` panels support `OBR.action.setWidth()` at runtime; popovers are fixed-size |
| Compact view | Read-only summary, 420 px (mockup View 1) | Session-critical at a glance; no editing friction during play |
| Expanded view | Real `CharacterSheet` inside `ObrLayout`, 860 px via `setWidth` (mockup View 1b) | **Editing stays in the iframe** — same partitioned session, zero handoff |
| Identity model | **Login-first (auth-to-save).** Anonymous can roll/view in the iframe; popup Logto sign-in to persist to an account | Account identity is a `user_id` row — global, server-side, no cookie partition. Deletes the entire cross-context handoff problem |
| OBR login mechanism | **Popup** OAuth to Logto + same-origin `returnTo` + postMessage→partitioned-session exchange | Logto refuses framing; popup is top-level so it renders. See "Identity across the OBR boundary" |
| ~~`obr_player_id`~~ | **Struck.** No player-ID-keyed sessions, no HMAC linking, no OBR session endpoint | OBR player IDs are connection-scoped (confirmed in SDK docs) — they identify, never authenticate. Keying sessions on them = account takeover |
| ~~Claim-code handoff for OBR~~ | **Struck** for v1 | Login-first makes characters account-owned and globally visible; no character transfer needed |
| Cross-origin iframe cookies | Reuse existing `embeddedSessions: true` + `x-embedded-session` → `SameSite=None; Secure; Partitioned` | Already shipped for itch.io; per-request, does not weaken the app's default `Lax` posture |
| Table integration | Token binding + context-menu embed + roll broadcast (Phase 6) | One metadata write, one menu entry, one broadcast channel — all reuse the compact view |
| Marketplace | Public OBR marketplace listing | Target audience is OBR tables |

## OBR is itch.io #2

OBR embeds `scvmrack.rpgtools.co` in a cross-origin iframe under `owlbear.rodeo` — the **same shape** as the itch.io embed, which is already built and pentested. Reuse its machinery:

- **Cross-origin cookies** → `embeddedSessions: true` (already in `rpgtools-auth.ts:24`); `isEmbedded()` already returns true inside OBR; `embeddedSessionHeaders()` already exists in `frontend/src/utils/embed.ts`.
- **Known limit, carried forward** → Safari and other third-party-cookie-blocking contexts: the partitioned session may not **persist** across visits (CHIPS unsupported). Rolling/viewing still works each session; login just won't stick. Same caveat itch documents.

## Identity across the OBR boundary

The cross-context cookie problem is a property of **anonymous** identity (cookie-bound, partition-keyed), not of scvmrack. Login-first removes it: an account is a `user_id` row, visible wherever you log in.

**Why a popup, not in-iframe login:**
1. Logto's login page sets `X-Frame-Options`/frame-ancestors — it refuses to render framed. A popup is top-level, so it renders fine.
2. After login the popup is *first-party* scvmrack → its session cookie is **unpartitioned**, invisible to the `owlbear.rodeo`-partitioned iframe. So a one-time token must carry identity back into the iframe's partition.

**Flow (no new Logto redirect URI — `returnTo` is same-origin, supported since shared-auth 1.3.0, see `rpgtools-auth.ts:70`):**
```
iframe:  "Sign in" → window.open("/api/auth/oauth2/login/logto?returnTo=/obr-auth-done")
popup:   Logto authorize (same rpgtools.co parent → likely silent SSO)
         → fixed callback /api/auth/oauth2/callback/logto  (sets first-party scvmrack session)
         → returnTo → /obr-auth-done   (same-origin scvmrack page, runs in popup)
popup:   POST /api/auth/obr-exchange/issue → { token }   (one-time, tied to the just-authed session)
         postMessage(token) → opener iframe, then window.close()
iframe:  POST /api/auth/obr-exchange/redeem  (with x-embedded-session header)
         → establishes an authenticated session in the iframe's partition
```

**The single new dependency:** the `obr-exchange` issue/redeem pair that moves a session into the partition. This is a **shared-auth capability** (itch punted on in-frame login; this also fixes that). Everything else is config or app code.

**`redeem` must *link*, not swap.** It links the iframe's existing anonymous session to the account (firing the existing `onLinkAccount` in `rpgtools-auth.ts:44`), not cold-swap to a fresh account session. That way a scvm rolled while anonymous carries over to the account automatically.

## Empty state (auth-aware) — what the panel shows before a character is active

The iframe keys off **its own partitioned session**, never a silent peek at Logto (the partition wall forbids that). `useObrSession` (thin wrapper over `useAuth`, which already sends `embeddedSessionHeaders()`) yields three states:

- **bootstrapping** → spinner.
- **authenticated** (returning user — their partitioned session persisted via CHIPS) → character list (`$api get /api/characters`) to pick + "Roll new".
- **anonymous** (first load, or Safari where CHIPS doesn't persist) → **Roll a scvm** (`generateNew` from `CharacterContext`) **| Sign in** (popup).

Sign-in re-checks the session and flips to the list; any scvm rolled while anonymous follows via `onLinkAccount` (see redeem-links note above).

What the `rpgtools.co`-subdomain Logto setup buys: smooth/silent SSO in the popup, and **no per-environment redirect-URI config** (prod + canary Logto apps untouched). It does *not* bridge the partition — that boundary is `owlbear.rodeo`, outside `rpgtools.co`.

## UI surfaces

Rendered mockups in the HTML (§ "UI mockups"):

- **Compact (420 px)** — read-only: SummaryBar, ResourceRow, Name, Abilities, Equipment, Notes. Header has a "Sign in" affordance (anonymous) and an Expand button (`setWidth(860)`).
- **Expanded (860 px)** — the real `CharacterSheet` inside `ObrLayout`. Thin OBR chrome (Collapse only). No nav/header/footer. Editing happens here, in-iframe.
- **`/obr-auth-done`** — invisible same-origin popup callback page; postMessages the exchange token to the opener and closes.

## House patterns to mirror

- **Repository / Service / Controller** layering with `ServiceResult<T>` (see `character-service.ts`).
- `useAuth` already accepts a `fetchSession` seam — the OBR session adapter uses it. Don't touch `useAuth` internals.
- `embeddedSessionHeaders()` must ride every cookie-issuing request from the OBR entry (`/api/csrf-token`, `/api/auth/*`, `obr-exchange`).

---

## Phase 1 — Bundle isolation

### T1 — `vite.config.ts` second entry
Add `obr: resolve(__dirname, 'obr.html')` to `build.rollupOptions.input`. `@owlbear-rodeo/sdk` stays out of `optimizeDeps.include` and any shared chunk. **Verify via the build manifest / chunk graph that the SDK module isn't in any `index-*` chunk** (grepping minified chunks for `"owlbear"` is unreliable).

### T2 — `frontend/obr.html`
Minimal entry mirroring `index.html`'s head (viewport, fonts), script → `src/obr-entry.tsx`.

### T3 — `frontend/src/CoreProviders.tsx`
Extract the shared provider stack from `main.tsx` (`ErrorBoundary` → `SnackbarProvider` → `ErrorFeedbackProvider` → `QueryClientProvider` → `LazyMotion`). No router. `main.tsx` then wraps with `<CoreProviders>` — behaviour unchanged.

---

## Phase 2 — OBR runtime

### T4 — `frontend/src/ObrLayout.tsx`
~40 lines. Sync `OBR.theme` → MUI colorScheme; thin top bar (wordmark + Expand/Collapse calling `OBR.action.setWidth(860|420)`); no nav/footer/privacy/Seo.

### T5 — `frontend/src/hooks/useObrSession.ts`
Wrap `useAuth` with a `fetchSession` that bootstraps the embedded session: hit `/api/csrf-token` and the session check with `embeddedSessionHeaders()`. Anonymous by default. Exposes `signIn()` → opens the popup (Phase 3) and, on the postMessage token, calls `obr-exchange/redeem`.

### T6 — `frontend/src/obr-entry.tsx`
`import '@owlbear-rodeo/sdk'` (only import site) → `<CoreProviders><ObrLayout><ObrCharacterRoute/></ObrLayout></CoreProviders>`. `ObrCharacterRoute` uses `useObrSession` and renders the real `<CharacterSheet>`; `ObrLayout`'s expanded flag toggles compact↔full.

---

## Phase 3 — Popup login bridge (the one new dependency)

### T7 — shared-auth `obr-exchange` capability
In `@tackgnol/rpgtools-shared-auth`: add `POST /api/auth/obr-exchange/issue` (authenticated session → one-time, short-TTL token) and `POST /api/auth/obr-exchange/redeem` (token + `x-embedded-session` → establishes an authenticated **partitioned** session for the same user). Bump + publish. This is the only backend logic addition.

### T8 — `frontend/src/pages/ObrAuthDonePage.tsx` + route
Same-origin `/obr-auth-done`. On load (running in the popup, now authenticated): call `obr-exchange/issue`, `postMessage(token, targetOrigin)` to `window.opener`, `window.close()`. Public route, no guard.

### T9 — popup opener in `useObrSession.signIn()`
`window.open(loginUrl() + '?returnTo=/obr-auth-done')`; listen for the postMessage (verify origin); redeem; refresh session. Show a manual "open sign-in" fallback if the popup is blocked.

---

## Phase 4 — Origins / infra

### T10 — `trustedOrigins` + Caddy
Add `https://www.owlbear.rodeo` to `trustedOrigins` in `rpgtools-auth.ts` (or via `CLIENT_ORIGIN`/`CLIENT_GATEWAY` env). Add `owlbear.rodeo` / `*.owlbear.rodeo` to Caddy `frame-ancestors` (same line itch.io was added to; mirror in `Caddyfile.example`).

### T11 — `frontend/public/manifest.json` + `obr-icon.svg`
`action`-type manifest pointing at `/obr.html`, 420×600. Square icon (skull/scvmrack mark, legible at 64×64). **Verify exact manifest schema against `docs/owlbear/` before asserting it loads** (`permissions`/`action` shape written from the saved docs, not memory).

---

## Phase 5 — Marketplace

### T12 — Submission
Absolute prod URLs for `url`/`icon`, add a one-sentence `description`. Submit the manifest URL via the OBR Developer Portal. Async review; usable via direct-URL install meanwhile.

---

## Phase 6 — Table integration (functionality-first, low plumbing)

All three reuse the compact view and the SDK signatures confirmed from `docs/owlbear/`. Each ships independently.

### T13 — Token binding (the spine)
Bind a character to a selected token by writing namespaced metadata:
```js
OBR.scene.items.updateItems(items, items => {
  for (const it of items) it.metadata["co.rpgtools.scvmrack/characterId"] = id;
});
```
Scene items sync to all players for free.

### T14 — Context menu → open sheet (inline embed)
```js
OBR.contextMenu.create({
  id: "co.rpgtools.scvmrack/open",
  icons: [{ icon: "/obr-icon.svg", label: "Open in Scvmrack",
            filter: { some: [/* only tokens carrying our characterId */] } }],
  embed: { url: "/obr.html?character=<id>", height: 480 },  // mini-sheet in the popup — no panel routing
  onClick(context) { /* focus the panel on context.items[0] */ },
});
```
`embed` reuses the compact view; `filter` hides the entry on unbound tokens. Optional `roles: ["GM"]` for GM-only actions.

### T15 — Roll broadcast (ephemeral, standalone)
```js
OBR.broadcast.sendMessage("co.rpgtools.scvmrack.rolls", { who, roll }, { destination: "ALL" });
OBR.broadcast.onMessage("co.rpgtools.scvmrack.rolls", e => toast(e.data)); // returns unsubscribe
```
Surface the roller's DR checks / omen burns to the whole table. 16KB, JSON, no persistence.

### Deferred — drawn HP bars over tokens
Writing HP into metadata is cheap; **rendering a bar that tracks the token is real plumbing** (attached shape items synced on every move) and matching other extensions' metadata shapes is fragile. v1 shows HP in the embed/popover sheet, not a drawn bar.

---

## Validation checklist (before merging `feat/owlbear` → `dev`)

| Check | Command |
|---|---|
| TypeScript | `cd frontend && npx tsc --noEmit` |
| Lint | `cd frontend && npm run lint` |
| Unit | `cd backend && npm run test:unit` |
| Browser | `cd frontend && npm run test:browser` |
| React health | `cd frontend && npm run doctor` |
| Bundle isolation | SDK module absent from `index-*` chunks (check build manifest, not a string grep) |
| Local OBR | Paste `http://localhost:5173/manifest.json` into OBR → compact, expand, popup sign-in, token bind, context-menu embed, roll broadcast |

## Open risks

| Risk | Mitigation |
|---|---|
| `obr-exchange` is new shared-auth surface | Keep TTL short, one-time, bind to the issuing session; reuse claim-flow HMAC primitives. Also retires itch's "no in-frame login" gap |
| Safari / third-party-cookie blocking | Login works per-session but may not persist (CHIPS unsupported). Document as a known limit, same as itch |
| Popup blocked by browser | `signIn()` falls back to a user-click "open sign-in" link |
| OBR manifest schema drift | Validate against `docs/owlbear/` + a local install before marketplace submission |
