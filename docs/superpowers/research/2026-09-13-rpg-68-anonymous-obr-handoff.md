# Spike: Securely open anonymous Owlbear characters in SCVMRACK (RPG-68)

Linear: RPG-251 / T5, backlog RPG-68. Research only — no application code changed.

**Scope.** An anonymous Owlbear Rodeo (OBR) extension user clicks "Open in SCVMRACK" and
expects their *current* character to load in a **new browser tab** — a full top-level
`scvmrack.rpgtools.co` page, not another OBR popover. RPG-57's authenticated
`/character/:id` deep link is out of scope (it is, in fact, the landing point this
design hands off into once identity is resolved — see §5).

**Headline: GO**, via a narrowly-scoped extension of the already-shipped
`obr-exchange` session bridge (opt-in, anonymous-permitting variant), **not** via the
shared-auth `ClaimCode` issue/redeem flow. Details and rationale in §3–§7.

---

## 1. The anonymous-session/ownership boundary, as it exists today

**Two different cookie jars, one origin.**
- Inside the OBR iframe, requests are marked `x-embedded-session: 1`
  (`frontend/src/utils/embed.ts:6-25`), which makes shared-auth issue
  `SameSite=None; Secure; Partitioned` (CHIPS) cookies
  (`backend/node_modules/@tackgnol/rpgtools-shared-auth/dist/plugin.js:17-23,68-70,136-141`).
  `embeddedSessions: true` and `https://www.owlbear.rodeo` as a trusted origin are wired
  in `backend/src/plugins/rpgtools-auth.ts:23-27,14`.
- A plain new browser tab visiting `scvmrack.rpgtools.co` directly is **not** marked
  embedded, so it gets the ordinary unpartitioned `SameSite=Lax` cookie jar — a
  different storage bucket than the iframe's CHIPS-partitioned jar for the same
  top-level site, by browser design.
- The shared-auth package's own README says this in as many words: *"Partitioned means
  the embedded session is separate from the direct-visit session (per top-level site).
  Use the claim flow to move data between them."*
  (`backend/node_modules/@tackgnol/rpgtools-shared-auth/README.md:164,170-171`).

**Every new browsing context mints its own anonymous identity.** `useAuth()`'s
`anonymousBootstrapQuery` calls `signInAnonymous()` + `fetchSession()` whenever no
session is found, unconditionally (`frontend/src/hooks/useAuth.ts:105-127`); there is a
`bootstrapAnonymous` opt-out (`useAuth.ts:50-53,66`) but nothing today opts a page out
of it. Concretely: the OBR iframe's anonymous session has some `user_id = U_frame`; a
freshly opened tab, on load, will bootstrap its own distinct `user_id = U_tab` before
anything else happens — it has no way to discover `U_frame` on its own.

**Ownership is `characters.userId` (plus a same-scope `sessionId` fallback for guests).**
`ownsCharacter()` treats a caller as owner when either the account `user.id` matches
`character.userId`, *or* the caller's anonymous Better-Auth `session.id` matches
`character.sessionId` (`backend/src/services/session.ts:35-48`). Both are still the one
ownership model keyed off the Better-Auth identity graph — there is no separate ACL/grant
table. Two existing transfer paths both mutate `userId`:
1. `onLinkAccount` in `backend/src/plugins/rpgtools-auth.ts:47-52` (fires when an
   anonymous session links to a real Logto account).
2. The shared-auth `ClaimCode` issue/redeem routes (see §3).

**Already-struck decisions, and where they do/don't cover RPG-68.**
`docs/superpowers/plans/2026-06-26-owlbear-extension.md:20-21` strikes `obr_player_id`
(*"OBR player IDs are connection-scoped... they identify, never authenticate"*) and
*"Claim-code handoff for OBR"* in favor of *"Login-first"*
(`2026-06-26-owlbear-extension.md:18`). Both strikes are correct as written, but their
stated rationale is explicitly scoped to **in-iframe editing**: *"Editing stays in the
iframe — same partitioned session, zero handoff"* (`2026-06-26-owlbear-extension.md:17`)
and *"The cross-context cookie problem is a property of anonymous identity... Login-first
removes it"* (`2026-06-26-owlbear-extension.md:35`). Nowhere in that document, or in
`2026-06-27-owlbear-room-party.md`, is the "open in a brand-new top-level tab while still
anonymous" case addressed — that document's own "Open in Scvmrack" feature (T14,
`2026-06-26-owlbear-extension.md:154-162`) is an **inline OBR `embed` popover**
(`embed: { url: "/obr.html?character=<id>", height: 480 }`), confirmed by the live code
at `frontend/src/obr/contextMenu.ts:53-59,178-192` (`OBR.popover.open`, not
`window.open`) — it never leaves the iframe's own partition. **RPG-68 is a genuinely
different, previously-unaddressed case: the strike is accurate but incomplete, and this
spike exists precisely to close that gap**, not to contradict the earlier decision.

The Owlbear SDK itself confirms `obr_player_id`'s nature: *"id: string — The user ID for
this player. This will be shared if the same player joins a room multiple times"*
(https://docs.owlbear.rodeo/extensions/apis/player, confirmed 2026-09-13, also saved
locally at `docs/owlbear/Player _ Owlbear Rodeo _ Documentation16.htm`) — persistent
per-install, but never a credential. The `ContextMenuItem` type has no "open URL in a new
tab" primitive at all — only `id`, `icons`, `onClick`, `shortcut`, `embed`
(https://docs.owlbear.rodeo/extensions/apis/context-menu, saved at
`docs/owlbear/Context Menu _ Owlbear Rodeo _ Documentation11.htm`). Opening a real new
tab is therefore just an ordinary `window.open()` call made from the extension's own
`onClick` handler running inside the iframe — no OBR SDK involvement in the tab itself.

---

## 2. Is a seamless, zero-roundtrip handoff possible?

**No — not zero-roundtrip, but a single user click can still trigger it end-to-end.**
Because the new tab is a different storage partition with its own freshly-bootstrapped
anonymous identity (§1), there is no browser mechanism that lets it "just know" the
iframe's `user_id`. Something must carry a piece of identity-bearing information from the
iframe into the new tab across that boundary. The two realistic carriers are:
- **A URL** the iframe constructs and passes to `window.open(url)` — the only channel
  guaranteed to exist before the new tab's JS has even started running.
- Nothing else survives the jump: no shared cookie, no `postMessage` (there's no
  `window.opener` reference the *new tab* needs — `window.open` from the iframe *does*
  set `window.opener` on the new tab, but a same-click short-lived token in the URL is
  simpler and doesn't depend on `noopener`/COOP headers holding).

So: one click → the iframe mints a short-lived, single-use identity token and opens
`/obr-open?token=...` → the new tab redeems it on load. From the end user's perspective
this **is** one click; under the hood it is a two-hop token issue/redeem, not a shared
cookie.

---

## 3. Should the existing `ClaimCode` issue/redeem flow be the handoff mechanism?

**Recommendation: no — use it as a fallback pattern reference only, not as RPG-68's
transport.** Full mechanics reviewed:
`backend/node_modules/@tackgnol/rpgtools-shared-auth/dist/fastify/claim.js:1-58` (issue:
lines 5-31; redeem: lines 32-57), signing in
`.../dist/services/claimSignature.js:1-23` (HMAC-SHA256,
`crypto.timingSafeEqual`), storage in `backend/prisma/schema.prisma:94-104`
(`ClaimCode` model), wiring in `backend/src/plugins/rpgtools-auth.ts:53-70` and gated
registration in `.../dist/plugin.js:196-199`.

**For:**
- Issue/redeem *do* already permit anonymous sessions (`claim.js:6-8,33-35` only checks
  `session.user` truthiness, unlike `obrExchange.js`'s explicit `isAnonymous` exclusion —
  see §1/§4). So an anonymous-to-anonymous transfer is not blocked by policy.
- It is a shipped, already-CSRF-protected (`.../dist/plugin.js:143-153` — `/api/claim/*`
  is **not** under the `/api/auth/*` CSRF exemption) HMAC-signed mechanism with a 15‑minute
  TTL (`claim.js:18`).

**Against (two independent, disqualifying problems):**
1. **Sequencing.** `issue` requires the caller to already know `targetUserId`
   (`claim.js:9-16`) — but the new tab's anonymous `user_id` doesn't exist until *after*
   it opens and bootstraps (§1). Making this flow work would require bolting on a full
   reverse handshake (new tab reports its fresh `user_id` back to the iframe first, *then*
   the iframe issues a code, *then* the tab redeems) — strictly more moving parts than
   the alternative in §5.
2. **It is a hard ownership TRANSFER, not identity adoption**
   (`claim.js:51-54`: `character.update({ data: { userId: session.user.id } })`). Handing
   the character to the new tab's `user_id` would silently detach it from the iframe's
   own anonymous session. The iframe panel would then either keep stale local state that
   404s/403s on the next server round trip, or (if it re-runs its own existing
   `claimAssignedPlayerCharacter` restore-on-load call,
   `frontend/src/components/obr/ObrCharacterRoute.tsx:131-149`) silently transfer
   ownership straight back — an ownership-flapping loop every time either tab reloads.
   This is a functional regression on top of being unnecessary complexity, given RPG-68's
   framing implies the player may still want to use the OBR panel afterward.

Both problems trace back to one root cause: **any mechanism that grants the new tab
*ownership* of the character (rather than the *same identity* as the iframe) will, by
definition of this app's single-owner model, detach the character from the iframe's
session.** That is the deciding factor for §5's design.

---

## 4. Threat model

| Risk | Analysis | Mitigation |
|---|---|---|
| **Token leakage** (URL in browser history, referrer, access logs) | The handoff artifact is an opaque, server-verified pointer (`createOpaqueToken()` = 32 random bytes, base64url, `.../dist/services/obrExchange.js:135-137`), stored **hashed** in the verification table (`tokenIdentifier()`, `obrExchange.js:138-141`) — it is not a session cookie/secret and carries no credentials itself, satisfying the "no raw session credentials to the client" constraint. | 60s TTL (`OBR_EXCHANGE_TOKEN_TTL_MS`, `obrExchange.js:4`); scrub from the address bar immediately after redeem via `history.replaceState` (new, cheap addition — no existing page does this today, e.g. `frontend/src/pages/ObrAuthDonePage.tsx` doesn't need to, since it never carries the token in its own URL). |
| **Replay** | `redeemObrExchangeToken` deletes the verification row it consumed (`obrExchange.js:80`); a second redeem attempt 404/410s (`obrExchange.js:37-39`). Already single-use by construction. | No change needed. |
| **Expiration** | Enforced server-side at redeem against `storedToken.expiresAt` (`obrExchange.js:40-43`), independent of client clock. | No change needed. |
| **Wrong-character claims** | The new tab still fetches the character by id through the normal ownership-checked `GET /api/characters/:id` path once its session is `U_frame`; the handoff only carries *identity*, not a character grant. No new wrong-character surface vs. what already exists for any authenticated visit. | N/A — falls out of the design in §5. |
| **Account-linking interactions** | `redeemObrExchangeToken` already fires `onLinkAccount` whenever the *redeeming* session is anonymous and differs from the target (`obrExchange.js:57-71`), merging the new tab's own (fresh, normally empty) anonymous characters into `U_frame` via the existing `character.updateMany` in `backend/src/plugins/rpgtools-auth.ts:47-51` — safe, reuses shipped logic, no new merge code. | One gap: cleanup only deletes the *redeeming* session's old anonymous user when `!targetUser.isAnonymous` (`obrExchange.js:72-74`) — for an anon→anon carry (this feature's normal case) that check is always false, so the discarded `U_tab` row is never garbage-collected. This is DB hygiene debt, not a security hole (anonymous rows carry no PII and already accumulate from abandoned guest tabs generally) — flag for the follow-up ticket, not a blocker. |
| **CSRF** | `obr-exchange` endpoints are Better-Auth plugin endpoints reached through the `/api/auth/*` wildcard (`.../dist/plugin.js:155`), which is explicitly exempted from CSRF (`plugin.js:143-153`, checking `request.url.startsWith('/api/auth/')`) — same posture as the already-shipped sign-in-direction usage. No new gap; also one less round trip than the `ClaimCode` routes, which *do* require CSRF. | N/A |
| **Anonymous impersonation via a widened trust boundary** | The proposed change *relaxes* a documented "security invariant" — `issueObrExchangeToken`/`publishObrHandoffToken` deliberately throw `unauthorized()` for anonymous sessions today (`obrExchange.js:19,97`), and `docs/superpowers/plans/2026-07-03-owlbear-phase1-auth-handoff.md` documents this as intentional, cross-app. Loosening it in the *shared* npm package (`@tackgnol/rpgtools-shared-auth`) would affect every consumer, not just scvmrack, unless scoped. | Do **not** remove the guard; add a new opt-in plugin option (default `false`) so every existing consumer (including scvmrack's own current sign-in-direction usage) is unaffected unless explicitly enabled. See §5/§6. |
| **Rate limiting** | `obr-exchange` endpoints ride the shared-auth global limiter, 100 req/min in production (`.../dist/plugin.js:115-119`). A single click generates at most 2 calls (issue, redeem). Not a concern at this volume. | N/A |

---

## 5. Recommended flow

Extend the shared-auth `obr-exchange` plugin with a new **opt-in** config flag that
relaxes the anonymous-session guard on `issueObrExchangeToken` only, and drive the
handoff **directly through issue → `window.open(url)` → redeem** — skipping the
popup/`postMessage`/mailbox machinery in
`.../dist/client/obrPopup.js` entirely, because that machinery exists to survive an
*OAuth redirect* severing `window.opener` (`obrPopup.js:37-42`); there is no such
redirect here, since the iframe itself opens the destination tab and can put the token
straight in its URL. This is a materially simpler flow than reusing the mailbox pattern
wholesale, and simpler again than reusing `ClaimCode` (§3).

```mermaid
sequenceDiagram
    participant User
    participant Iframe as OBR iframe (partitioned session, user U_frame)
    participant Backend as scvmrack backend (/api/auth/obr-exchange/*)
    participant Tab as New tab (/obr-open, direct-visit, unpartitioned)

    User->>Iframe: Click "Open in full site"
    Iframe->>Backend: POST /api/auth/obr-exchange/issue (anonymous-carry enabled)
    Backend-->>Iframe: { token }  (opaque, hashed at rest, 60s TTL, single-use)
    Iframe->>Tab: window.open("/obr-open?token=...&character=<id>")
    Note over Tab: useAuth({ bootstrapAnonymous: false }) — skip default anon bootstrap
    Tab->>Backend: POST /api/auth/obr-exchange/redeem { token }
    Backend->>Backend: verify not expired / not used; createSession(U_frame)
    Backend->>Backend: onLinkAccount merges any of the tab's own (empty) anon characters
    Backend-->>Tab: Set-Cookie (unpartitioned session = U_frame)
    Tab->>Tab: history.replaceState (scrub token from the address bar)
    Tab->>Backend: GET /api/characters/{id}
    Backend-->>Tab: character (ownsCharacter(U_frame) === true, unchanged owner)
    Tab->>User: Renders CharacterSheet at /character/{id}
```

Because `character.userId` never changes, the iframe's own session can keep editing the
same character afterward — no ownership flapping, no second ownership mechanism, and
`/character/:id` (RPG-57) is reused unmodified as the landing route once identity lines
up.

### Failure/retry behavior (user-visible)
- **Popup/tab blocked by the browser** — same class as today's `signInViaObrPopup`
  `popup-blocked` error (`obrPopup.js:135-137`); surface the existing fallback-link
  pattern already used for that case
  (`frontend/src/components/obr/ObrCharacterRoute.tsx:284-292`).
- **Token expired or already used** — `/obr-open` shows a short failure message and a
  "go back to Owlbear and try again" prompt, mirroring
  `frontend/src/pages/ObrAuthDonePage.tsx:28-36`'s existing `failed` state (which, like
  that page, needs no i18n keys — it already hardcodes English, consistent with this
  being a transient bridge page, not user-facing app chrome).
- **Redeem succeeds but the character fetch 404s** (e.g., character deleted meanwhile) —
  falls through to the normal `/character/:id` not-found handling; no new UI needed.

### Security constraints honored
- No raw session cookie/credential is ever put in a URL or response body — only the
  existing opaque, hashed-at-rest, single-use exchange token (§4).
- `characters.userId` remains the only ownership field touched; no parallel grant/ACL
  table introduced.
- The anonymous-session guard is relaxed via a new **opt-in** flag, not removed, so the
  documented cross-app security invariant
  (`docs/superpowers/plans/2026-07-03-owlbear-phase1-auth-handoff.md`) is preserved for
  every other consumer of `@tackgnol/rpgtools-shared-auth` by default.

---

## 6. Required changes, test plan, effort

**`@tackgnol/rpgtools-shared-auth` (shared npm package):**
- Add an opt-in option to the `obrExchange()` plugin factory (`obrExchange.js:8-10`)
  that relaxes the `session.user.isAnonymous` check at `obrExchange.js:19` (issue only —
  `publishObrHandoffToken`'s guard at line 97 is untouched since this design doesn't use
  the mailbox). Default `false`.
- Optionally also fix the `deleteUser` cleanup gap noted in §4 for anon→anon redeems
  (nice-to-have, not blocking).
- Version bump + changelog entry in that package's own release process.

**Backend (`scvmrack`):**
- `backend/src/plugins/rpgtools-auth.ts:23-27` area — pass the new opt-in flag when
  registering `rpgtoolsSharedAuth`. One line.
- No Prisma migrations, no new routes, no changes to `backend/src/routes/obr/*` or
  `obr-assignment-service.ts` (that endpoint solves a different, room/player-binding
  problem — see note below — and is not part of this design).

**Frontend (`scvmrack`):**
- `frontend/src/obr/contextMenu.ts` — add a second context-menu action alongside the
  existing inline-embed "Open in Scvmrack" (T14), whose `onClick` calls the
  anonymous-carry issue endpoint and does `window.open('/obr-open?token=...&character=<id>')`.
  Give it a distinct label (e.g. "Open in full site") to avoid duplicating T14's exact
  wording (`2026-06-26-owlbear-extension.md:158`).
- New page/route `/obr-open`, shaped like `frontend/src/pages/ObrAuthDonePage.tsx`:
  redeem → `history.replaceState` → `fetchSession()`/cache invalidate → navigate to
  `/character/:id`. Mount `useAuth({ bootstrapAnonymous: false })` (option already exists,
  `frontend/src/hooks/useAuth.ts:50-53,66`) so this page's own default anonymous
  bootstrap never races the redeem, and so a successful handoff never leaves behind an
  extra throwaway anonymous user on top of the one already discussed in §4.

**Not needed:** any `manifest.json` change (context-menu items are registered at runtime
via `OBR.contextMenu.create`, not declared in the manifest —
`frontend/static/manifest.json:1-13` has no context-menu declarations;
`frontend/src/obr/contextMenu.ts:26-28` does it in JS).

**Test plan:**
- Shared-auth unit: anonymous-carry flag off (today's behavior unchanged, existing tests
  still pass) vs. on (issue succeeds for anonymous, redeem still enforces TTL/single-use,
  `onLinkAccount` merge fires).
- Backend integration (`cd backend && npm run test:integration`): full issue→redeem round
  trip ending in a cookie bound to `U_frame` in an unpartitioned context, then a
  successful `GET /api/characters/:id`.
- Frontend unit (`npm run test:unit`): `/obr-open` happy path, expired/used-token failure
  path, and the `bootstrapAnonymous:false` wiring.
- Frontend browser test (`npm run test:browser`): popup/tab-blocked fallback link.
- E2E (`cd backend && npm run test:e2e`): iframe session clicks the action; a second,
  separate browser context opens `/obr-open?...`, loads and edits the character; then the
  *original* iframe session, on next load, is confirmed to still see and edit the same
  character (ownership never moved).
- Pre-release: run the `shannon` skill against the new `/obr-open` route and the
  anonymous-carry endpoint, per this repo's existing "Pentested with Shannon AI" practice
  (CLAUDE.md Security Architecture section).

**Rough effort:** shared-auth package change + its own tests ≈ 0.5–1 day; scvmrack
backend wiring ≈ <0.5 day; frontend (context-menu entry, `/obr-open` page, failure
states) ≈ 1–1.5 days; test coverage across the four levels above ≈ 1–1.5 days. **Total
≈ 3–4.5 engineering days**, plus one external checkpoint to publish/bump the shared-auth
package before scvmrack can consume the new flag.

---

## 7. Go/no-go and follow-up ticket sketch

**GO** — implement via the opt-in `obr-exchange` anonymous-carry extension described in
§5. It satisfies every stated constraint: no raw session credential newly exposed to the
client (the exchange token is the same opaque, hashed, single-use artifact already
shipped for the sign-in direction), no second character-ownership mechanism (character
ownership never moves — only session *identity* is carried into the new tab), and it
reuses proven, already-audited machinery rather than inventing new cryptography or
storage.

**NO-GO** on reusing the `ClaimCode` issue/redeem flow as the transport (§3) — it forces
a hard ownership transfer and an awkward sequencing handshake that the `obr-exchange`
route avoids entirely.

**Where this refines project memory:** the "already struck" `obr_player_id` /
"Claim-code handoff for OBR" decisions
(`docs/superpowers/plans/2026-06-26-owlbear-extension.md:20-21`) remain correct for what
they actually decided — in-iframe editing needs no handoff at all. They did not decide,
and were never scoped to decide, the new-tab case RPG-68 asks about. This spike's
recommendation does not reopen or reverse that strike; it adds a narrowly-scoped sibling
mechanism for a scenario those decisions didn't cover, and it explicitly avoids
reintroducing `obr_player_id`-as-credential or a `ClaimCode`-based handoff, honoring the
spirit of both strikes.

**Follow-up implementation ticket sketch** ("RPG-68: Anonymous OBR → new-tab character
handoff"):
1. Shared-auth: add opt-in anonymous-carry flag to `obrExchange()`; publish new package
   version.
2. Backend: bump `@tackgnol/rpgtools-shared-auth` dependency; enable the flag in
   `rpgtools-auth.ts`.
3. Frontend: new context-menu action + `/obr-open` bridge page + failure states.
4. Tests per §6's four levels; Shannon pass on the new surface before release.
5. Release-notes entry per `changelog/frontend.md` / `changelog/backend.md` and the
   versioned `release/<version>.md`, per this repo's release convention.
