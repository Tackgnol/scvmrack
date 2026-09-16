# Spike: reduce repeated character information across sections

- Wayfinder task: RPG-251 / T7 — https://linear.app/rpgtoolsco/issue/RPG-251
- Backlog issue: RPG-67 — https://linear.app/rpgtoolsco/issue/RPG-67/spike-reduce-repeated-character-information-across-sections
- Date: 2026-09-13
- Note on doc location: matches the `docs/superpowers/research/` convention established by the RPG-65 and RPG-68 spikes in this same session.

## 1. Duplication inventory

The ticket's own example (the Fanged Deserter's Ancient Gore-Hound, appearing in class abilities, inventory, and pets) is confirmed by reading the code, not assumed — and it generalizes to every "specialized" equipment kind, not just pets.

**Root cause:** `OnHandSection` renders every item in `character.equipment` unfiltered — `aggregated = aggregateItems(equipment)` (`frontend/src/hooks/useOnHandSection.ts:32`) — while three sibling sections separately re-render the *same* items, picked out by predicate, in their own dedicated (richer) UI:

| Concept | Canonical predicate | Dedicated section | Also rendered in `OnHandSection`? |
|---|---|---|---|
| Pets | `isPetItem` (`frontend/src/hooks/useEquipmentSections.ts:9-13`) | `PetSection` (`frontend/src/components/molecules/pets/PetSection.tsx`) | Yes — no filter excludes pets from `aggregated` |
| Scrolls | `isScrollItem` (`useEquipmentSections.ts:5-7`) | `PowersSection` (`frontend/src/components/molecules/PowersSection.tsx`) | Yes |
| Consumables with tracked uses | `isConsumableUseItem` (`useEquipmentSections.ts:20-29`, itself excludes pets/ammo/scrolls) | `ConsumableSection` (`frontend/src/components/molecules/consumables/ConsumableSection.tsx`) | Yes |

`CharacterSheet.tsx` mounts all four unconditionally/conditionally side by side: `OnHandSection` (line 107) always, then `PetSection`/`PowersSection`/`ConsumableSection` each behind a `hasX` accordion (lines 109-137) — so a character with a pet sees the same name + description rendered twice on screen at once: once as a plain clickable `InventoryItemSlot` (name + description, `frontend/src/components/molecules/InventoryItemSlot.tsx:61-74`) in "On Hand", and once as a full `TrackedUseRow` (name + description + action die + HP-use pips, `PetSection.tsx:29-46`) in "Pets".

**Contrast — `PrintPage.tsx` already solves this for print**, by explicitly excluding pets from its own on-hand list: `const pets = equipment.filter(isPetItem)` (line 347) then `!isPetItem(item)` in the general list's filter (line 352). The live character sheet never received the equivalent filter — this is a real, pre-existing gap, not a hypothetical one.

**A second, independent duplication — the class-ability layer:** for `gainPet`/`gainItem` abilities, the class's `random_abilities`/`fixed_abilities` JSON carries its own hand-authored `description` flavor text (`backend/init/05-seed/001_game_data.sql:24`, rendered verbatim by `DescriptorAbilityItem.tsx:69-76` via `ClassAbilitiesSection`), while the granted pet/item itself carries an *independently maintained* description sourced from the pets/equipment catalog (`backend/init/05-seed/001_game_data.sql:483`, translation `pets.gore-hound.description` at line 629). These are two separately-edited copies of the same flavor text describing the Gore-Hound, and they have already drifted once in practice: `006_align_equipment_catalog.sql` had to update *both* copies by hand in the same migration (lines 119 and 240) to keep them in sync — proving there is no mechanism preventing a future edit from touching only one. A third, seemingly-unused copy also exists (`abilities.fanged_deserter.hound` translation key, `001_game_data.sql:993`) that no frontend component appears to read (`DescriptorAbilityItem` reads `ability.description` directly from the JSON, not via a translation key) — likely dead data, worth a follow-up removal but out of scope for this spike.

### Canonical-section rule

For each duplicated concept, the **canonical section is the one offering interactive state** (the thing players actually touch during play), since that's "where it is used or managed" per the ticket's own investigation prompt:

- **Pets → `PetSection`** (tracks HP-use pips).
- **Scrolls → `PowersSection`** (tracks scroll uses / misfire state).
- **Consumables → `ConsumableSection`** (tracks remaining uses).
- Plain carried items with no tracked-use state have no sibling section and stay exactly as they are today in `OnHandSection` — nothing to change there.

`OnHandSection` becomes the **secondary** location for these three kinds: it should show a compact cross-reference instead of the full name+description+editor-modal treatment it gives everything else today.

## 2. Interaction sketch: "see X" cross-reference

No code was written for this (a spike deliverable, not a build) — the design fits entirely within existing pieces already in the repo:

- Where `OnHandSection` currently renders a full `InventoryItemSlot` for a pet/scroll/consumable, render a slim reference row instead: quantity badge (existing `ItemQuantityBadge`) + item name + a small "→ see Pets/Powers/Consumables" affix, reusing `RosterBindingTag`-style small pill styling already established elsewhere (`frontend/src/components/obr/ObrPartyRoster.styles.ts:206-224`) rather than inventing new chrome. No description text repeats here — that's the entire point.
- Activating the reference (click, or Enter/Space per existing `InventoryItemSlot`'s `ButtonBase` keyboard behavior) scrolls the canonical section into view (`element.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'center' })`) and briefly highlights the matching `TrackedUseRow` in `PetSection`/`PowersSection`/`ConsumableSection`.
- **Reuse `useValuePulse.ts` for the highlight**, per the ticket's "define scroll, focus, highlight" ask: `useValuePulse` already exists to turn a *value change* into a timed boolean animation flag (`frontend/src/hooks/useValuePulse.ts`, used today by `ResourceRow`/`SummaryBar`/modifier tags for numeric-change feedback). A "jump to X" click can drive the same hook by incrementing a per-item `nonce` counter on activation and passing it as `useValuePulse(nonce)`'s tracked value — the hook's existing value-changed → pulse-for-`durationMs` → auto-clear behavior is exactly "briefly highlight" with zero new state-machine code. This is a genuine reuse, not a coincidental one: the mechanism (compare-old-value, flip a boolean, auto-clear on a timeout) is identical regardless of whether the *trigger* is a numeric change or a navigation click.
- Focus moves to the canonical row's existing interactive element (e.g. the first HP pip in `TrackedUseRow`) so keyboard users landing via the reference aren't stranded with only a visual highlight.

## 3. Accessibility and responsive behavior

- The reference control must be a real `<button>` (as `InventoryItemSlot`'s `ButtonBase` already is), not a bare clickable `<div>`, so it's keyboard-reachable and has a default accessible name from its text content — no new ARIA plumbing needed beyond what the pattern below adds.
- `aria-label` on the reference should name the destination explicitly (e.g. "Ancient Gore-Hound — see Pets section") since the visual "→ see Pets" affix alone may not read naturally with a screen reader depending on markup order.
- Respect `prefers-reduced-motion` for both the scroll (`behavior: 'auto'` instead of `'smooth'`) and the highlight pulse — `CharacterSheet.tsx` already reads this media query today (`prefersReducedMotion` at line 68) for its own impact animation, so the same check is a drop-in reuse, not a new pattern.
- Responsive: the compact reference row is strictly smaller than the `InventoryItemSlot` it replaces, so it can't regress any existing narrow-viewport layout; no new breakpoint logic needed.

## 4. Fallback when the canonical destination isn't rendered

Per the ticket's own "define fallback behavior" ask: `hasPets`/`hasScrolls`/`hasConsumables` (`CharacterSheet.tsx:71-73`) already gate whether the dedicated section mounts at all. If a future embedded surface reuses `OnHandSection` without also mounting the matching dedicated section (the ticket explicitly calls out "reused embedded surfaces where the destination exists" as a case to handle), the reference row must fall back to the **current full presentation** (name + description, no "see X" affix, no scroll/focus wiring) rather than linking to nothing. This is a local decision inside `OnHandSection`/`InventoryItemSlot ` (pass down whether the destination section is present, mirroring the `hasPets`-style booleans `CharacterSheet.tsx` already computes) — no new data model needed.

## 5. Recommended implementation slices

Matches and reconfirms the slice order already agreed for this ticket in the Wayfinder map:

1. **Pets only**: filter `isPetItem` out of `OnHandSection`'s aggregated list (mirroring `PrintPage.tsx:352`'s existing filter) and render the compact reference row in its place, only when `PetSection` will actually be mounted (§4).
2. **Scroll/focus/highlight utility**: a small hook (e.g. `useScrollToHighlight`) wrapping `scrollIntoView` + `useValuePulse`-driven highlight + `prefers-reduced-motion` handling, built generically enough for step 1 to consume and step 3 to reuse.
3. **Fallback path**: wire the "destination not rendered" branch from §4 and cover it with a test before extending further, since it's the one path unexercised by the common case.
4. **Extend to scrolls and consumables**: same filter-and-reference treatment via `isScrollItem`/`isConsumableUseItem`, now that steps 1-3 have proven the pattern.
5. **Class-ability text duplication** (the harder, lower-value case from §1's second finding): once (1)-(4) are proven, evaluate collapsing the class-ability's own flavor text into a "→ see Pets" reference too, or — a cheaper alternative worth flagging — simply deleting the duplicate flavor text from the ability JSON and always sourcing it from the pet/item catalog at generation time, which would remove the sync-drift risk at the data layer instead of the UI layer. This needs its own follow-up decision (data migration, not just a component change) and is deliberately not bundled into this spike's slice plan.

## 6. Regression-test plan

- Unit/browser test that a character with a pet no longer shows the pet's full name+description inside `OnHandSection`'s rendered list, only the compact reference (protects the dedup itself).
- Browser test that activating the reference scrolls `PetSection`'s matching row into view and that the row gets the pulse highlight class/flag within the expected window, then clears it (mirrors the existing `EquippedQuickCard.test.tsx` pattern of asserting `getComputedStyle(...).transform` under `userEvent.hover`, from RPG-58 in this same session — same technique applies to asserting a click-driven highlight).
- Browser test for the `prefers-reduced-motion` branch (already precedented via `useMediaQuery('(prefers-reduced-motion: reduce)')` mocking elsewhere in this codebase for `CharacterSheet`'s own impact animation).
- Browser test for the fallback path (§4): render `OnHandSection` standalone (destination section absent) and assert the full name+description presentation is still shown, not a dangling reference.
- Keyboard test: Tab to the reference row, activate with Enter/Space, assert focus lands on the canonical row's first interactive control.
- No backend test changes — this is a pure frontend rendering/interaction change; nothing here touches `character.equipment`'s shape or the generation logic.

## 7. Confirmation: no data model or synchronization change required (for slices 1-4)

Confirmed: `isPetItem`/`isScrollItem`/`isConsumableUseItem` already exist and already correctly classify every item in `character.equipment` (`useEquipmentSections.ts`); `PrintPage.tsx` already proves the same data supports "show once, categorized" rendering. Slices 1-4 are pure frontend-rendering changes — filtering what `OnHandSection` shows and adding a client-only scroll/focus/highlight interaction. No `EquipmentItem` field, API shape, or backend generation logic needs to change.

The one place this confirmation does **not** extend is slice 5 (class-ability text duplication, §1's second finding) — collapsing or deduplicating that would touch either the seed data (`backend/init/05-seed/*.sql`) or the character-generation code (`backend/src/lib/generate-character.ts`), which is a data-layer change, not a rendering one. This is called out explicitly rather than folded into the "no data model change" confirmation, since it would otherwise overstate what this spike verified.

## Go/No-Go

**Go**, scoped to slices 1-4 (pets → scrolls → consumables, all pure frontend). The mechanism, canonical-section rule, and reuse of `useValuePulse` are all backed by code already in this repo, not speculative. Slice 5 (class-ability flavor-text dedup) is a **separate, smaller follow-up decision** involving seed data, and should not block or be bundled with shipping 1-4.
