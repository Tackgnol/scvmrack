# Owlbear: room-independent durability + Verified-extension readiness

Design agreed 2026-06-29 (grill-me session). Companion to `owlbear-integration-review.md`.

## Problem

A GM's warband, roster, and enemies are currently keyed to the ephemeral `OBR.room.id`.
Owlbear lets you run a whole campaign in one room, but rooms get recreated/lost — and today
that means **losing everything**. The core need is not "move to scvmrack"; it's **decoupling the
durable data from the room id so a GM can detach from a dead room and re-attach to a new one**.

Stretch goal driving the constraints: **Owlbear Verified extension** status.

## What's already durable (don't rebuild it)

- **Party membership is room-independent today.** Members are `character.partyId`; the room link is
  a *separate* `party.obrRoomId` (`@unique`). Invite-joined members already survive a room change.
- The real casualties on a room change are: **enemies** (OBR room metadata → lost), the
  **party↔room attachment** (`party.obrRoomId` points at a dead room, no re-point op), and per-scene
  token bindings (inherently ephemeral — re-bound in the new scene).

## Locked decisions

### D1 — Durability = signed-in GM; anonymous = ephemeral room trial
Durable party hangs off `user_id` (reuses the account-gated `promoteRoom`, party-service.ts). Anonymous
GMs get the room-scoped **roster trial** (works without their account) + an enemy *teaser*. "Try before
you buy" stays; permanence requires an account. Anonymous + secret data is a contradiction (no identity
to gate on), so we don't pretend otherwise.

### D2 — Party↔room is 1:1 and re-pointable
Keep `party.obrRoomId` as a single unique pointer. Add **attach-to-this-room** (set to new id, only if
unclaimed) and optional **detach** (set null). A GM whose room died opens the new room's panel, signs in,
picks their warband, hits "use this room" → pointer moves. Collision (room already claimed by another of
their parties) → 409, reusing `ROOM_ALREADY_PROMOTED` (party-service.ts:286). No multi-room-at-once.

### D3 — Attach restores the data layer only
Attach moves the pointer and makes members + enemies readable in the panel. It does **not** reconstruct
scene state — different map, no positions, scene maybe not ready. Tokens are re-bound per scene via the
existing one-tap flows (`ObrTokenBar`, enemy "Bind token"). "Member, not yet on map" is a first-class state.

### D4 — Enemies live in the backend, owned by the party; signed-in only
Delete the OBR room-metadata enemy storage entirely. One backend store, one player-safe projection,
secrets actually protected, durable, rides along on attach. This **resolves both review High findings by
removal** (no room-metadata leak, no 16 kB cap) and the read-modify-write race (health steps → atomic
`UPDATE`). Invariants live in the service layer. Anonymous GMs see a teaser, not the manager.

### D5 — Gating: backend steers, OBR reads via room/player combo
- **Full** enemy stat block → only the **authenticated party owner** (server-verified `ownerUserId`).
- **Safe** projection (name, type/habitat, health %, status, description) → caller presenting the recorded
  `(roomId, characterId)` pair, i.e. a player who bound a scvm to this room (`character.obrRoomId === roomId`).
  Same credential as `GET /api/characters/cards`. A lurker who only knows the room id gets nothing.
- **Mutations** (create/edit/delete/health-step) → owner-only.
- `OBR.player.getRole()` is **UI-only, never an authorization input** (it's a forgeable client claim).
- **Live updates**: GM mutates via owner-gated API, then fires a tiny OBR **broadcast** "enemies changed"
  ping; players refetch the safe projection. (Once data leaves room metadata, this broadcast is correct
  and necessary — the review only called it redundant *because* data was in room metadata.)

### D6 — The party is the warband; scene binding is presence
Party membership is the source of truth. The GM panel lists party members annotated "on map / not bound."
A token bound to a non-member scvm shows as *unlinked* with a one-tap "add to warband" (server-side join).
`promoteRoom`/attach **seed membership from currently scene-bound scvm** so the GM isn't staring at an empty
roster. Inverts the old "Owlbear owns what the GM sees" jank — scvmrack owns the warband, OBR renders presence.

### D7 — Login: popup + exchange-token bridge, hardened for mobile; redirects retired
The popup + one-time `obr-exchange` token + `postMessage` is the *correct* pattern and the only one OBR's
host model allows (iframe can't navigate top; Logto refuses framing). "URL redirects instead of modals" is
**formally shelved** — the durability reframe removed its motivation and it can't beat the popup anyway.
Verified status requires mobile, so the handback must be iPad/Safari-hardened (was Q8 option B).

### D8 — Embedded session = header-carried bearer token, not a third-party cookie
Today the OBR session is a `SameSite=None; Partitioned` cookie (embed.ts) — blocked by Safari ITP and
absent with cookies disabled, colliding with *three* Verified items (mobile/iPad, Safari, private browsing).
Move it to a bearer token:
- `POST /api/auth/sign-in/anonymous` returns a **token** (not just Set-Cookie); iframe sends
  `x-embedded-session: <token>` as the real credential. Anonymous tier is cookie-free.
- **Logto stays 100% cookie-based and untouched.** Its cookies live only in the *first-party popup* on
  Logto's domain during the OAuth dance, where cookies work normally. The popup converts that login into a
  scvmrack session; `redeemObrExchangeToken` returns the **bearer token** (instead of setting a partitioned
  cookie). The conversion happens at the existing `obr-exchange` boundary — cookie→token, in the popup.
- The iframe is cookie-free end to end. With cookies fully disabled, *sign-in* is unavailable (popup OAuth
  needs first-party cookies) but the anon token tier still works — exactly the checklist's tiered allowance.
- Requires a shared-auth change (token issuance + accept the header as a credential). Shared-auth is ours
  (`@tackgnol/rpgtools-shared-auth`), so this is in scope.

### D9 — Token storage: in-memory floor + opportunistic localStorage
In-memory module variable is the source of truth → session exists as long as the iframe is mounted, needing
**zero persistent storage** (guarantees "functions" under fully-blocked storage / private browsing).
Mirror to `localStorage` in a try/catch for continuity across panel re-opens; a storage exception degrades
silently to in-memory-only. One guaranteed path, one optional nicety, nothing that can hard-fail.

## Verified-extension checklist mapping

| Requirement | Status after this design |
|---|---|
| Scene API only stores scene-lifecycle data (note 3) | ✅ Durable data → backend; scene metadata only holds per-scene token bindings. |
| No other extensions required / manifest on custom domain | ✅ Already true. |
| Functions with no scene open vs scene open (note 4) | 🟡 Audit `scene.isReady`/`onReadyChange` paths; binding degrades, panel must still render. |
| Legible in light & dark theme | 🟡 Panel paints own bg; verify + likely use `OBR.theme` / popover `hidePaper`. |
| Accessible colors & font sizes | 🟡 Audit the Mörk Borg palette/sizes against WCAG. |
| Fully functional on mobile (iPhone/Android/iPad) | 🟡→🟢 via **D8** (token session) + **D7** (hardened popup). |
| All major browsers incl. Safari | 🟡→🟢 via **D8** (no third-party cookie for Safari ITP to block). |
| Functions in private browsing / cookies disabled | 🟡→🟢 via **D8 + D9** (anon token, in-memory floor). |
| Proper use of OBR APIs | ✅ Reinforced by D4/D6. |
| No known bugs | 🟡 Clear the `owlbear-integration-review.md` findings. |
| Provides user support | 🟢 Add manifest `author`/`homepage_url` + a support channel. |

## Suggested phasing

0. **Shared-auth**: anon bootstrap returns a token; API accepts `x-embedded-session: <token>` as a
   credential; `redeem` returns a token. *(Prerequisite for D8/D9 and all mobile/Safari/private items.)*
1. **Enemies → backend** (party-owned): new tables + service + gated reads (D5) + broadcast signal; delete
   room-metadata enemy code. *(Closes both review High findings.)*
2. **Party↔room re-point** (D2): `attach`/`detach` endpoints + panel "your warbands / use this room" branch;
   seed membership from scene-bound scvm (D6).
3. **Session transport** (D8/D9): iframe bearer token in-memory + opportunistic localStorage; harden the
   popup handback for iPad/Safari (D7).
4. **Verification polish**: theme legibility, accessibility audit, scene-open/closed configs, manifest
   support metadata, clear remaining review findings.

## Retired ideas

- **URL-redirect / top-window navigation login.** OBR iframes can't navigate the top tab and Logto won't
  frame; redirecting the tab leaves Owlbear with no resume path. The popup+exchange-token bridge is the
  mechanism. (D7)
- **Enemies in OBR room/scene metadata.** Leaky (player-readable), capped (16 kB), and un-portable. (D4)

## Addendum — 2026-07-01 revision (review follow-up)

D1/D4/D5 are relaxed to the **hybrid trust model** shipped with the room-binding
module: the enemy board and binding listings are **room-trust** (the unguessable
room id is the capability, so anonymous OBR GMs keep working), while the party
invite token and manage/attach/detach operations remain owner-only. A signed-in
GM can claim a room party auto-created under the `system:obr-room` owner.
"Stale flags" from the bindings plan are computed client-side (the backend
cannot observe OBR connectivity). D2 attach/detach shipped as
`POST /api/parties/:id/attach-room` / `detach-room`.
