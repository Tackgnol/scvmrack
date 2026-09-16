# Spike: connect Owlbear-only roll actions to the official Dice extension

- Wayfinder task: RPG-251 / T6 — https://linear.app/rpgtoolsco/issue/RPG-251
- Backlog issue: RPG-65 — https://linear.app/rpgtoolsco/issue/RPG-65/spike-connect-owlbear-only-roll-actions-to-the-official-dice-extension
- Date: 2026-09-13
- Note on doc location: `docs/superpowers/` only has `specs/` (design docs) and `plans/` (implementation plans) conventions today — no existing spike/research folder — so this spike lives in a new `docs/superpowers/research/` directory as the deliverable instructed.

## 1. Does the official Dice extension expose a supported cross-extension contract?

**No.** Confirmed by reading the extension's own source, not by guessing from the SDK docs.

- Repo: [`owlbear-rodeo/dice`](https://github.com/owlbear-rodeo/dice) (org-owned, contributors `mitchemmc` and `nthouliss`, not archived, last commit `2024-04-10`).
- `README.md` (fetched via `gh api repos/owlbear-rodeo/dice/contents/README.md`) states plainly under "Contributing": *"This project is provided as an example of how to use the Owlbear Rodeo SDK. As such it is unlikely that we will accept pull requests for new features. Instead we encourage you to fork this repository and build the dice roller of your dreams."* — the maintainers explicitly do not intend it as an integration point for other extensions.
- Its only two network-facing writes are:
  - `OBR.player.setMetadata({ [getPluginId("roll")]: ..., [getPluginId("rollThrows")]: ..., [getPluginId("rollValues")]: ..., [getPluginId("rollTransforms")]: ... })` in `src/plugin/DiceRollSync.tsx` — this is how the extension syncs **its own UI-triggered** roll state to other clients so everyone's browser can render the same deterministic Rapier physics animation. `getPluginId(path)` (`src/plugin/getPluginId.ts`) just returns `` `rodeo.owlbear.dice/${path}` ``. Nothing reads this key to *originate* a roll from outside the extension — it is only ever written by the extension's internal `useDiceRollStore`, never consumed as an input.
  - `window.BroadcastChannel` (the **native browser API**, not `OBR.broadcast`) in `src/plugin/PartyTrays.tsx` and `src/plugin/PopoverTrays.tsx`, channel name `getPluginId("focused-tray")`. This is purely internal same-origin coordination between the extension's own action-panel iframe and popover iframe (open a specific player's dice tray) — it never crosses extension boundaries and isn't part of the OBR SDK's cross-extension broadcast surface at all.
- Confirmed via GitHub code search (`gh api "search/code?q=repo:owlbear-rodeo/dice+..."`) that the repo contains **no** `OBR.room` usage, **no** `OBR.contextMenu` registration, and the only `OBR.broadcast`-adjacent thing is the unrelated internal `BroadcastChannel` above. There is no listened-for "roll request" channel, no documented metadata schema for other extensions to write to, and no versioned/stable contract of any kind.
- The `DiceRoll`/`Dice`/`Die` types it does use (`src/types/Dice.ts` etc.) are rich (nested dice groups, `combination: "HIGHEST"|"LOWEST"|"SUM"|"NONE"`, per-die style/id) but are **private implementation types**, not published on `docs.owlbear.rodeo`, not semver'd, and coupled to the Rapier physics simulation (each die needs a stable `id` so the deterministic physics can replay identically on every client). Forging this shape by hand (writing directly to `rodeo.owlbear.dice/roll` player metadata) is exactly the "undocumented internals" approach the ticket forbids, and it would break silently on any Dice extension update since there is no compatibility promise.

**A related but distinct finding, for completeness (not the official extension the ticket names):** a third-party, Patreon-gated extension called **Connected Dice** by community developer Seamus Finlayson ([`SeamusFinlayson/dice-extension`](https://github.com/SeamusFinlayson/dice-extension), manifest confirms `"name": "Connected Dice"`, `"author": "Seamus"`) *does* define and implement a genuine, documented cross-extension roll protocol in `src/types/diceProtocol.ts`:
  - Handshake: `general.diceRoller.hello` / `general.diceClient.hello` broadcast channels exchange a `DiceRollerConfig` (available die types, styles) so a client extension can detect Connected Dice is present and build its UI around what it supports.
  - Roll trigger: `rodeo.owlbear.rollRequest` / `rodeo.owlbear.powerRollRequest` broadcast channels accept a `RollRequest` (`{ id, replyChannel, gmOnly, styleId?, combination?, bonus?, dice: {id, type, styleId?}[] }`); the extension replies on the caller-supplied `replyChannel` with a `RollResult` (`{ id, gmOnly, result: {id, result}[] }`).
  - `src/App.tsx` genuinely wires this up (`OBR.broadcast.onMessage(DiceProtocol.ROLL_REQUEST_CHANNELS[0], ...)`, `startRoll(diceRoll)`, `OBR.action.open()`), so it isn't aspirational/dead code.
  - This is real evidence that the *pattern* the ticket wants (neutral roll request over `OBR.broadcast`, GM/private flag, reply channel per requester) is a proven, working design in this exact ecosystem — but it targets a **different, paid, non-official extension**, not the free "Dice by Owlbear Rodeo" the ticket and RPG-65 title specify. Building against it would swap "official Dice" for "Connected Dice" as a hard dependency, which is a product/scope decision, not a technical detail — flagged in §7.

## 2. OBR SDK mechanics actually in play

Sourced from the mirrored docs already checked into this repo (`docs/owlbear/Broadcast _ Owlbear Rodeo _ Documentation10.htm`, `docs/owlbear/Player _ Owlbear Rodeo _ Documentation16.htm`) and cross-checked live against `docs.owlbear.rodeo` (the live site returned HTTP 403 to automated fetches during this spike — Cloudflare bot protection — so the mirrored copy plus this repo's own working SDK usage are the citations below):

- `OBR.broadcast.sendMessage(channel: string, data: any, options?: BroadcastOptions)` — `data` must be JSON-serializable, capped at 16KB. `BroadcastOptions.destination` is `"REMOTE" | "LOCAL" | "ALL"` (default `"REMOTE"`). `OBR.broadcast.onMessage(channel, callback)` returns an unsubscribe function. Channels are just strings — there is no registry, no ownership, no reservation; namespacing (e.g. `co.rpgtools.scvmrack/...`, `rodeo.owlbear.dice/...`) is a **social convention** (reverse-DNS-style), not an enforced boundary. *(docs/owlbear/Broadcast..._10.htm)*
- `OBR.player.getMetadata()` / `setMetadata(update: Partial<Metadata>)` — a single shared metadata object per player, spread-merged on write. Any extension in the room can read and write any key on it; again, namespacing by prefix is the only isolation. `OBR.player.getRole()` returns `"GM" | "PLAYER"`. *(docs/owlbear/Player..._16.htm)*
- This repo already exercises exactly these primitives outside `frontend/src/obr/`-adjacent boundaries: `OBR.player.getRole()` at `frontend/src/obr/contextMenu.ts:96`, `OBR.broadcast.onMessage(rosterChannel(...), ...)` at `frontend/src/components/obr/ObrCharacterRoute.tsx:185-198`, `OBR.room.id` at `frontend/src/obr/useObrRoomId.ts:11`. `@owlbear-rodeo/sdk` is pinned at `^3.1.0` (`frontend/package.json:61`), and `@tackgnol/rpgtools-owlbear` at `^0.1.0` (`frontend/package.json:43`) wraps room/token bindings with SCVMRACK's own namespace `co.rpgtools.scvmrack` (`frontend/src/obr/extension.ts:7`).

Conclusion for §2: nothing here changes the §1 answer. The SDK gives generic pub/sub and shared metadata; the official Dice extension simply never wires either of those up to accept an external roll trigger.

## 3. Architecture sketch (respecting "no SDK imports in shared components")

The repo already has the exact split this needs, proven by the existing `CharacterSheet` composition:

- `frontend/src/components/organisms/CharacterSheet.tsx` is mounted unmodified from both surfaces:
  - Plain web: `frontend/src/pages/CharacterPage.tsx:218`
  - OBR: `frontend/src/components/obr/ObrCharacterRoute.tsx:261` (imports `@owlbear-rodeo/sdk` itself at line 25, wraps `CharacterSheet` with an OBR-only sibling, `ObrTokenBar`, at lines 253-259 — `CharacterSheet` itself never sees `OBR`).

This is the pattern to extend for dice:

```
frontend/src/hooks/useCharacterActions.ts        <- roll-eligible actions
frontend/src/components/**/*.tsx (weapon slot,   <- emit a RollRequest via a
  ability row, consumable row, EquippedQuickCard)   *neutral* capability hook —
                                                     no OBR import, ever
                        │
                        ▼  React context, default = no-op/undefined
frontend/src/roll/RollCapabilityContext.tsx (NEW)  <- shared-safe: defines
                                                       RollRequest type + the
                                                       context + a hook
                        │  (only OBR composition layer provides a real value)
                        ▼
frontend/src/obr/diceAdapter.ts (NEW)              <- the ONLY new file that
                                                       imports @owlbear-rodeo/sdk
                                                       for this feature; turns
                                                       RollRequest -> OBR.broadcast
                        │
frontend/src/components/obr/ObrCharacterRoute.tsx  <- wraps <CharacterSheet/>
                                                       in <RollCapabilityContext.
                                                       Provider value={diceAdapter}>
```

- `RollCapabilityContext` / `useRollCapability()` live in a new SDK-free module (`frontend/src/roll/` or alongside `frontend/src/hooks/`), default value `null`. Shared components call `useRollCapability()`; if it's `null` (plain web app, or OBR-but-Dice-absent), the roll-trigger UI (a "Roll" icon button next to the existing dice-formula text) simply doesn't render — **the plain web app is untouched, both visually and behaviorally**, because the context module never imports the SDK and the hook's default is inert.
- Only `frontend/src/obr/diceAdapter.ts` (new) imports `@owlbear-rodeo/sdk` / `@owlbear-rodeo/sdk`'s `OBR.broadcast`, matching the existing rule that SDK imports live in `frontend/src/obr/` (`extension.ts`, `obrApiClient.ts`, `contextMenu.ts`, `useObrRoomId.ts`, etc. all already do this).
- `ObrCharacterRoute.tsx` (already the composition root that knows about OBR readiness/role, see `useObrRole()` at line 46 and the `OBR.isAvailable` check at line 49) is the natural place to construct the adapter and provide it — it already gates on `role`/`OBR.isAvailable` before rendering `CharacterSheet`.

### The `RollRequest` shape

Derived from what the character model actually has (`frontend/src/hooks/models.ts`) and what the OBR side needs to identify the requester (`frontend/src/obr/obrCharacterAccess.ts:1-5`):

```ts
// frontend/src/roll/RollCapabilityContext.ts (SDK-free)
export type RollRequest = {
  id: string;                 // crypto.randomUUID(); correlates request -> result
  label: string;              // "Rustnight's Ambition — damage", "STR check"
  kind: 'weapon-damage' | 'ability-check' | 'class-ability' | 'consumable';
  dice: number[];             // die sizes, e.g. [6] or [4, 4]; from EquipmentItem.dice
                               // (frontend/src/hooks/models.ts:49)
  bonus?: number;             // ability score added straight (MÖRK BORG has no
                               // modifier table — strength/agility/presence/toughness
                               // ARE the bonus, see models.ts:98-101) or a
                               // ComputedModifier total (models.ts:81-89)
  requester: {
    characterId: string;
    characterName: string;
    playerId: string;         // from ObrCharacterAccessContext (obrCharacterAccess.ts:3)
  };
  visibility: 'public' | 'gm-only';
};

export type RollCapability = {
  requestRoll: (req: RollRequest) => Promise<RollOutcome>;
} | null;
```

`useRollCapability()` returns `null` on the plain web app and inside OBR whenever no adapter has registered (see §4).

## 4. Prototype evidence

Because §1 confirms there is **no supported mechanism to trigger the official Dice extension**, there is nothing to prototype against it — any snippet writing to `rodeo.owlbear.dice/roll` player metadata would be depending on undocumented internals, which the ticket explicitly rules out. There is no honest "it works" demo to show here for the official extension.

What *can* be prototyped honestly is the shape of the capability boundary itself (adapter-optional, SDK confined to `frontend/src/obr/`), and — as a documented reference for what a supported contract looks like when one exists — the request/response shape that *does* work against Connected Dice's public protocol (not shipped, not wired to any real extension in this repo; provided purely as evidence that the `RollRequest` → `OBR.broadcast` → awaited result pattern in §3 is technically sound end-to-end):

```ts
// frontend/src/obr/diceAdapter.ts (illustrative only — targets Connected Dice's
// documented DiceProtocol, github.com/SeamusFinlayson/dice-extension/blob/main/src/types/diceProtocol.ts,
// NOT the official Dice extension, which has no such channel — see §1)
import OBR from "@owlbear-rodeo/sdk";
import type { RollRequest, RollCapability } from "@/roll/RollCapabilityContext";

const ROLL_REQUEST_CHANNEL = "rodeo.owlbear.rollRequest"; // Connected Dice's public channel

export function createConnectedDiceAdapter(): RollCapability {
  return {
    requestRoll: (req: RollRequest) =>
      new Promise((resolve, reject) => {
        const replyChannel = `co.rpgtools.scvmrack/roll-result/${req.id}`;
        const timeout = setTimeout(() => {
          unsubscribe();
          reject(new Error("dice-extension-timeout"));
        }, 5000);

        const unsubscribe = OBR.broadcast.onMessage(replyChannel, (event) => {
          clearTimeout(timeout);
          unsubscribe();
          resolve(event.data as RollOutcome);
        });

        OBR.broadcast.sendMessage(
          ROLL_REQUEST_CHANNEL,
          {
            id: req.id,
            replyChannel,
            gmOnly: req.visibility === "gm-only",
            combination: req.dice.length > 1 ? "SUM" : undefined,
            bonus: req.bonus,
            dice: req.dice.map((size, i) => ({ id: `${req.id}-${i}`, type: `D${size}` })),
          },
          { destination: "ALL" },
        );
      }),
  };
}
```

This compiles conceptually against the types in `SeamusFinlayson/dice-extension`'s `diceProtocol.ts` and mirrors exactly how that extension's own `src/App.tsx` listens (`OBR.broadcast.onMessage(DiceProtocol.ROLL_REQUEST_CHANNELS[0], ...)`) and replies. It is included to prove the *pattern* is sound, not as something to ship — see §7 for why shipping it is a separate decision from this spike.

## 5. Dice not installed / not ready / refuses / ignores

Because the official extension has no listener at all, "not ready" is actually the **permanent, default state** for this integration, not an edge case — every design must treat "no adapter" as the common path, not a loading flicker.

Behavior to define regardless of which extension (if any) is eventually targeted:

1. **Not installed in the room / no listener at all**: `useRollCapability()` returns `null`. Shared components render their existing plain-text formula (e.g. the existing `drRollHint` string, `frontend/src/i18n/en.json:371`, "Roll d20 and meet or beat this number.") with **no** roll button — this is also exactly the current behavior on the web app today, so "capability absent" and "plain web app" become the same code path, which is good for keeping the two surfaces honestly identical outside OBR+Dice.
2. **Installed but not ready yet** (extension iframe hasn't loaded, no `hello` handshake observed): adapter should not be provided until a readiness signal is seen (for a protocol like Connected Dice's, that's the `general.diceClient.hello` message in §1); until then, same as (1) — no button, not a disabled/greyed button, to avoid promising a capability that might never arrive.
3. **Request sent, no reply within a timeout** (extension present but roll queue busy / extension crashed / reply channel typo): surface a transient inline error next to the roll control ("Dice didn't respond — try again") and leave the character sheet otherwise unaffected; no optimistic HP/inventory mutation should ever be gated on a roll completing, since character state changes already flow through `useCharacterEditor`'s independent patch queue (`CLAUDE.md` "Character Editing" — the roll capability must never be wired into that patch/flush loop).
4. **Reply arrives after the requester has navigated away / unmounted**: the promise from `requestRoll` should just be abandoned (no `setState` on an unmounted component); a per-request `AbortController` or a `mounted` ref guard, consistent with `useCharacterActions.ts`'s existing pattern of an `AbortController` ref for cancelling in-flight character generation (`frontend/src/hooks/useCharacterActions.ts:47`).
5. **Refusal is a valid outcome**, not exceptional (either extension's own "another roll is in progress" — see `SeamusFinlayson/dice-extension`'s `src/App.tsx`, which literally throws when `activeRollRequest !== null`, so a request sent while a previous roll is mid-flight would simply get no reply from that extension): treat identically to timeout (case 3), since there is no distinct "refused" reply channel in any observed protocol — only silence.

## 6. Public/private semantics and identity

- **Visibility**: MÖRK BORG rolls are normally public at the table but the app already treats "secret roll" as a real concept nowhere yet (there's a `gmOnly`-shaped need but no existing field). Connected Dice's protocol has exactly one boolean, `gmOnly`, which hides the physical roll animation from non-GM players. The neutral `RollRequest.visibility: 'public' | 'gm-only'` in §3 maps 1:1 onto that — `'gm-only'` → `gmOnly: true`. There is no partial-visibility concept (e.g. "visible to caster + GM only") in any of the mechanisms found in this spike; a "private to me" roll is not representable through any dice extension's broadcast surface today (Dice/Connected Dice only distinguish "everyone" vs "GM").
- **Identity in the payload**: the requester should carry `characterId` + `characterName` (for the on-table label — "Rustling Ambition rolls STR check") and `playerId` (SCVMRACK's own OBR identity, already tracked in `frontend/src/obr/obrCharacterAccess.ts:1-5`, populated alongside `roomId`/`connectionId` used for backend auth headers at lines 23-38) rather than the raw Owlbear connection/player id alone, because SCVMRACK characters can be GM-assigned to a player (`ObrCharacterRoute.tsx:130-145`, `claimAssignedObrCharacter`) — the *character* making the roll and the *browser session* triggering it are not always the same identity, and only the character carries the game-relevant name/stats. `OBR.player.getRole()` (used already at `contextMenu.ts:96`) should gate whether the *requesting* UI even offers `'gm-only'` as an option — a non-GM player rolling "gm-only" for themselves is a legitimate MÖRK BORG use case (rolling secretly against their own table), so this is a UX toggle, not a permission check; no backend authorization implications since nothing here touches the character record.
- **No PII beyond what's already public in the room**: character name and player id are already visible to every other extension/participant in the room via `OBR.party.getPlayers()`/room metadata; nothing new is exposed by putting them in a roll request payload.

## 7. Roll types, UX, error states, test plan, risks, effort

### Roll types in scope (from the character model, `frontend/src/hooks/models.ts`)
| Type | Data available today | Gap |
|---|---|---|
| Weapon damage | `EquipmentItem.dice: number[]` (`models.ts:49`), `+strength` for melee (convention, not enforced field) | none — structured today |
| Armor DR (defense, not attacker roll) | `EquipmentItem.dice` on armor, `drToMelee/drToRanged/drToDodge` (`models.ts:123-125`) | this is a target number, not something the defender rolls — out of scope as a "roll" |
| Ability check | `strength/agility/presence/toughness: number` (`models.ts:98-101`) added straight to d20 | none — structured today |
| Class ability | `Ability { key, name, description, comment }` (`models.ts:24-29`) — free text only | **no structured dice field** — "roll for this ability" would need either a backend schema addition or a client-side regex over `description` (e.g. parsing "1d6" out of prose), both out of scope for this spike |
| Consumable | `UseCountRule { mode, base, statistic }` (`models.ts:38-42`) governs *how many uses remain*, not a damage/effect die; consumable effects are free-text `description` like abilities | same gap as class abilities |

**Recommendation for scope**: ship weapon damage + ability checks first (the ticket's own suggested example is weapon damage, and it's the only type with zero data-model gaps); treat class-ability/consumable rolls as a follow-up that first needs a structured dice field on `Ability`/consumable items — trying to regex dice notation out of free-text descriptions is fragile and was never asked for.

### UX
- A small "Roll" icon button appears only where `useRollCapability()` is non-null, next to the existing weapon-dice chip (`ItemStatChips.tsx:51-58`) and the existing ability-score display — never replacing the existing plain-text formula, so the plain web app's DOM is unaffected when the hook returns `null` there.
- Clicking opens no new UI in SCVMRACK itself; it calls `requestRoll` and shows a lightweight inline pending/error state (spinner → result number, or the error copy from §5).
- A GM-only toggle (checkbox/switch) appears next to the button only when `OBR.player.getRole()` is `"PLAYER"` (i.e. rolling for yourself, secretly) — mirrors the existing GM/PLAYER branching already in `ObrCharacterRoute.tsx:63-67`.

### Error states
- No adapter available → no button (§5.1/5.2).
- Timeout → inline retry affordance, no character-state mutation (§5.3).
- Component unmount mid-request → silently abandoned (§5.4).
- Malformed/oversized payload (e.g. absurd dice array) should be validated client-side before `sendMessage`, since the 16KB broadcast cap is a hard SDK limit (docs/owlbear/Broadcast..._10.htm) — trivially safe for dice rolls but worth a guard/test.

### Test plan
- Unit: `RollCapabilityContext` default is `null`; a fake provider round-trips a `RollRequest` → `RollOutcome`; timeout path rejects after the configured window; unmount-then-resolve doesn't throw/setState.
- Unit: shared components (e.g. the weapon slot) render identically with `useRollCapability()` returning `null` vs a stub — snapshot/DOM assertion that no roll button exists in the `null` case, protecting the "web app unchanged" constraint.
- Browser/integration (`frontend/npm run test:browser`, per `CLAUDE.md`): mount `ObrCharacterRoute` with a mocked `OBR.broadcast` (already how `ObrCharacterRoute.tsx`'s existing roster-broadcast test doubles work, given `OBR.broadcast.onMessage` is already used at line 185) and assert the adapter sends the expected `RollRequest` shape and resolves/rejects correctly.
- No backend involvement — this is 100% frontend/OBR surface, so no `backend/npm run test:integration` changes.
- `npm run doctor` (react-doctor) after touching the new hook/context, per `CLAUDE.md`'s "Validation checklist."

### Risks
- **Ticket's literal target doesn't support this at all** (biggest risk, confirmed in §1) — any implementation against the official Dice extension is either impossible (no listener) or a fragile reverse-engineering of private metadata keys the ticket forbids.
- Targeting a different extension (Connected Dice) trades "official/free" for "paid/community-maintained" — a real product dependency risk (Patreon-gated access, single maintainer, protocol documented only in that repo's source comments, no semver guarantee either).
- `OBR.broadcast` channels are global, unnamespaced strings shared by every extension in the room — a collision or a malicious/unrelated extension listening on the same channel name is a (low-probability, low-impact for dice) theoretical risk; not worth defending against here since Connected Dice's own channel names are fixed by that extension, not by us.
- Data-model gap for class abilities/consumables (table above) risks scope creep if not explicitly deferred.

### Effort (rough)
- Capability boundary (`RollCapabilityContext`, hook, provider wiring in `ObrCharacterRoute.tsx`) + weapon-damage and ability-check roll buttons in shared components: **2-3 days**.
- Adapter against Connected Dice's protocol specifically (if approved) including timeout/error handling and browser tests: **1-2 days**.
- Class-ability/consumable structured-dice follow-up: not estimated here — needs its own data-model spec first.

## Go/No-Go

**No-go on the ticket as literally scoped.** The official "Dice by Owlbear Rodeo" extension (github.com/owlbear-rodeo/dice) exposes no documented, or even accidental, cross-extension contract for triggering a roll — confirmed by reading its full source, not inferring from silence — so there is nothing standards-compliant to connect SCVMRACK to. The capability-boundary architecture in §3 (neutral `RollRequest`, OBR-only adapter, no SDK imports in shared components) is sound and should be built regardless, since it's needed for *any* dice integration and costs nothing extra to build against a `null` capability today. The one real fork in the road for a follow-up decision: either (a) ship the boundary now with no adapter (roll buttons simply never appear yet, matching today's behavior) and revisit if Owlbear Rodeo ever documents a contract on the official extension, or (b) explicitly retarget a rewritten ticket at the third-party **Connected Dice** extension, whose documented `DiceProtocol` (`rodeo.owlbear.rollRequest`) is proven to work end-to-end in §4 — but that is a product decision (accepting a paid, single-maintainer dependency) that needs sign-off before any code lands, not something this spike should default into.
