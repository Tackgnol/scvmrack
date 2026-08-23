# Owlbear Rodeo integration — review against the SDK docs

Reviewed: `feat/owlbear_enemies` (2026-06-29), against the OBR SDK docs at `C:\Users\<user>\Owlbear`.
Scope: the whole OBR surface (`frontend/src/obr/*`, `frontend/src/components/obr/*`, `obr-entry.tsx`,
`obr.html`, `static/manifest*.json`, backend card projection), not just the diff.

The committed integration (cards, roster, token binding, auth bridge) is well-disciplined and
SDK-correct. The headline issues are all in the **enemies** feature, which is still uncommitted WIP —
good timing to fix before it lands.

---

## 🔴 High — GM enemy secrets leak to players via room metadata

`frontend/src/obr/enemies.ts:248` (`writeObrEnemies`) stores the **entire** enemy stat block —
`morale`, `armorDie`, `attacks`, `specials`, `loot`, exact `maxHealth` — in `OBR.room.setMetadata`.

The docs (`apis/room`) are explicit: room metadata is **shared with every player**; `getMetadata`
and `onMetadataChange` return it to all connected clients. There is no per-role room metadata.

The player UI hides the secret fields — `ObrEnemyPlayerPanel` renders a reduced card with
`isDetailed=false` (`ObrEnemies.tsx:209`), and the context menu opens a smaller player popover
(`contextMenu.ts:104`). **That separation is cosmetic only.** Any player can open devtools and call
`OBR.room.getMetadata()` to read every enemy's loot, specials, exact HP, and morale. The
"Known threats" view gives a false sense of secrecy.

Contrast: `backend/src/lib/character-card.ts` is an exemplary player-safe **allowlist** projection,
gated server-side by the `(roomId, id)` pair. The character path does this right; enemies bypassed it
and dumped raw GM data into a shared store.

**Fix, cheapest first:**
- If enemy stats aren't actually secret → drop the GM/player popover split and own it.
- If they are secret → route enemies through the backend like cards: store room-scoped, GM-owned;
  serve a player-safe projection to players, full data to the GM. Room metadata holds at most a tiny
  version pointer. This also resolves the 16 kB issue below.

> **RESOLVED 2026-06-29** - enemies moved to the backend (`Enemy` table, party-owned) with server-side GM-full / player-safe projections. No enemy data in OBR room metadata. See `docs/superpowers/plans/2026-06-29-owlbear-enemies-backend.md`.

## 🔴 High — room metadata 16 kB cap, no guard

`apis/room`: *"In total the room metadata must be under 16 kB"* — a budget shared across the whole
extension's room metadata.

`writeObrEnemies` serializes the full array into one key with **no size check**. The zod schema
(`enemies.ts:95`) allows per enemy: 500-char description, 8 specials × 240-char descriptions,
8 attacks, 8 loot, 8 status bands — roughly 5–7 kB at max each. A handful of richly-statted enemies
silently blows the cap; `setMetadata` rejects and the GM sees only "Could not save enemy"
(`ObrEnemies.tsx:289`) with no actionable cause.

**Fix:** move enemies to the backend (removes the cap entirely), or cap enemy count + surface the
limit in the UI.

> **RESOLVED 2026-06-29** - enemies moved to the backend (`Enemy` table, party-owned) with server-side GM-full / player-safe projections. No enemy data in OBR room metadata. See `docs/superpowers/plans/2026-06-29-owlbear-enemies-backend.md`.

## 🟠 Medium — read-modify-write races on enemy mutations

`saveObrEnemy` / `setObrEnemyHealth` / `deleteObrEnemy` each do read-all → mutate → write-all
(`enemies.ts:169-205`). The GM "Damage 1 HP" / "Heal 1 HP" buttons (`ObrEnemies.tsx:430-441`) invite
rapid clicking, and `stepHealth` computes from the `enemy` captured in React state (possibly stale).
Two in-flight writes → last-write-wins, lost updates. Single-GM tables make this low-frequency, but the
step buttons are exactly the pattern that triggers it.

**Fix:** serialize writes, or let the backend own the mutation.

## 🟡 Low — redundant enemies broadcast

`useObrEnemies` subscribes to **both** `OBR.room.onMetadataChange` and `OBR_ENEMIES_CHANNEL`
(`useObrEnemies.ts:42-53`), and every write calls `broadcastEnemiesChanged`. Since all enemy data lives
in room metadata, `onMetadataChange` already notifies every client — the broadcast channel,
`isObrEnemiesBroadcast`, and `broadcastEnemiesChanged` are dead weight (double-refresh on remotes).

**Fix:** delete them. (The *roster* broadcast in `roster.ts` is legitimately needed — roster data lives
in scene-item metadata + backend, not room metadata.)

## 🟡 Low — `hasObrReference()` rides an undocumented param

`ObrCharacterRoute.tsx:60` gates the whole panel on a `?obrref` query param that appears **nowhere** in
the SDK docs and isn't injected by any repo code (only OBR adds it at runtime). It works today, but
`OBR.isAvailable` is the *documented* availability signal and is already checked on the same line — the
`&& hasObrReference()` is belt-and-suspenders on undocumented behavior that will silently show
"unavailable" if OBR ever renames it.

## 🟡 Low — token name clobber

`bindCharacterToSelection` (`tokenBinding.ts:45`) overwrites `item.name` with the character name,
destroying whatever the player named the token, with no undo hint. Intended, but worth a one-line note
in the bind notification.

---

## No token-hover interaction in the SDK (answer to "is hover available?")

**No.** The SDK exposes no hover/mouseover event for map tokens. Searched all of
`extensions/apis/*` and `extensions/reference/*`; the only "tooltip" references are the `label` on the
extension's own context-menu/tool icons — not map tokens.

Token-level interaction is limited to three surfaces:

| Surface | Trigger | Notes |
|---|---|---|
| `OBR.contextMenu` | Click a **selected** item | What scvmrack already uses (`contextMenu.ts`). |
| `OBR.tool.createMode` | `onToolClick` / drag events | Requires the player to activate a custom tool first. |
| `OBR.interaction` | High-frequency updates during drag | Local interpolation, **not** a pointer-hover hook. |

Extensions run in iframes (`getting-started`) and never receive raw pointer events over the canvas, so a
"hover a token → show its card" UX is **not possible**. Click-to-context-menu is the intended substitute,
which is the pattern already in use.

---

## ✅ Correct against the docs

- SDK kept out of the main bundle via a separate `obr.html` entry + rollup input
  (`obr-entry.tsx:2`, `vite.config.ts:48`).
- Context-menu `KeyFilter` existence checks (`operator "!="`, `value: undefined`) and role filters match
  the documented pattern (`contextMenu.ts:39-48`).
- Popover anchor/origin usage matches `apis/popover` exactly.
- Roster stores only character **id**+name in scene-item metadata and fetches card data from the backend
  gate — secrets never touch OBR shared state. **This is the model enemies should copy.**
- `OBR.player.getRole()` used for UI only, with backend ownership as the real authority
  (`useObrRole.ts`).
- Manifest matches `reference/manifest` (name ≤45, action with popover/width/height).
  Minor: consider adding the optional `description` (≤128), `author`, `homepage_url` before submitting to
  the OBR store.

---

## Suggested order of work

1. Decide whether enemy stats are secret. If yes → backend-backed enemies (fixes leak **and** 16 kB).
2. Cheap wins regardless: drop the redundant enemies broadcast; add a metadata size guard (if staying in
   room metadata); serialize health-step writes.
3. Optional: simplify `hasObrReference()` to `OBR.isAvailable`; add token-name note; fill manifest store
   fields.

---

## 💡 Suggested additions (unused APIs that fit existing features)

Ranked by value-to-effort. Each ties to an API scvmrack isn't using yet and to a feature already present.

### 1. On-token HP / status pips via `OBR.scene.local` — also fixes the secrecy leak

`apis/scene/local`: local items are **per-user and never synced or persisted** — only the current user
sees them. So the GM can attach a health ring / "death's-door" pip directly onto enemy tokens that
**players cannot read**, which closes the High secrecy finding above *and* surfaces enemy state on the map
at a glance.

- You already build attached labels (`tokenBinding.ts:124`) — same `buildLabel`/builder pattern, just via
  `OBR.scene.local.addItems` instead of `OBR.scene.items.addItems`.
- The enemies feature already computes `healthPercent`, status bands, and tone
  (`ObrEnemies.tsx` `resolveEnemyStatus` / `getHealthTone`) — feed those straight into the pip.
- Mirrors the `colored-rings` example applied to data you already hold.

**Highest value: a feature win that also removes a leak.**

### 2. `OBR.viewport.animateToBounds` + `OBR.player.select` — "focus token" from the roster

GM clicks a roster row → camera pans/zooms to that scvm's token and selects it. The roster already knows
the bound character ids (`roster.ts`); map id → token id and call `animateToBounds(bounds)` (docs show this
exact context-menu pattern), then `OBR.player.select([tokenId])` to highlight. Big GM QoL, small diff.

### 3. `OBR.action.setBadgeText` — ambient toolbar badge

Show bound-scvm count (GM) or enemy count on the extension's toolbar icon without opening the panel; could
also flag "sign in" for players. Cheap — both counts are already tracked.

### 4. `OBR.theme` — don't clash in light mode

The panel forces the Mörk Borg theme; a user running OBR in light mode gets a jarring popover. Reading
`theme.mode` (with `onChange`) to at least flip the background is low effort.
**Caveat:** the brutalist look is deliberate — this is optional polish, not a fix, and may be intentionally
ignored.

### 5. `OBR.modal` for the enemy editor

The GM enemy form packs many fields into a 420 px panel (`manifest.json:10`). A full-screen modal
(`apis/modal`) gives it room to breathe. Only worth it if the form feels cramped in testing.

### Bigger swing (feature, not a quick win)

A lightweight MÖRK BORG **initiative / turn order** built on item metadata + context menu — the SDK ships a
full `tutorial-initiative-tracker` for exactly this pattern. Slots naturally into the enemies/roster work.
