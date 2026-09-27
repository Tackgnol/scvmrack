# How should the class creator look and flow?

Type: prototype
Status: resolved
Blocked by: 03

## Question

Rough prototype of the creator: sections (identity, stats dice, HP/weapon/armor/silver, abilities, Class Items, origins, Getting Better, language), how dual-language entry works, validation, and whether a GM can test-roll a scvm from the draft before saving. Field set, limits and the reused modifier component are fixed by ticket 03.

## Assets

- Prototype, all three variants (primary source, A/B/C switchable with ← →): [prototypes/class-creator-prototype.html](../prototypes/class-creator-prototype.html)
- Chosen variant B, polished with impeccable: [prototypes/class-creator-b-polished.html](../prototypes/class-creator-b-polished.html); live copy: https://claude.ai/artifact/NJJSRnu4YCx4pYNuD1DCZU

## Answer

**Variant B, "Forge steps", wins** over A (one long scroll with side-by-side languages) and C (editing on a mock character sheet). Refined with impeccable `polish` (its detector found no issues); the build must follow these:

- **Seven steps in a rail**: Identity, Stats & dice, **Class Items, Abilities** (items come first so abilities can grant them), Origins, Getting Better, Test roll & save. Each step shows `OK` or its count of problems; the rail is a sticky column on desktop and a horizontal strip on phones that keeps the current step in view. Back/Next buttons name the next step.
- **One language at a time**: a "Writing in English / Polish" switch, each language showing how many of its fields are missing on the current step. The class's languages are picked on Identity as English only / Polish only / Both.
- **Validation lives on the field**: a missing translation marks the field `aria-invalid` with inline "Polish text missing" text. The final step lists every problem with a **Fix** button that jumps to the right step, switches language and focuses the field. Save stays available but explains exactly what blocks it.
- **Test roll on the final step**: rolls a scvm from the draft as it stands (stats with modifiers, HP, omens, silver, weapon/armor dice, fixed + rolled abilities, what it starts with, origin) and keeps nothing.
- **Empty states and limits**: empty abilities / Class Items / origins explain what to add; add buttons disable at the 20-item caps; counters read "5 of 20 abilities".
- **Class Items ↔ Abilities** (impeccable `critique`, 22/40 before this pass; decisions by the product owner):
  - The Class Items step opens with the question "Does this class carry its own gear or beasts?" as its empty state. Yes → forge an item; No → one collapsed line with Change, rail chip `None`. The answer is derived from whether items exist, never stored separately.
  - **One granter per Class Item**: exactly one ability slot (item or pet) or one reference-table row. Grant menus show items taken by another ability as disabled "(granted by X)". Table-row links count as the grant (Herbmaster decoctions).
  - **Two-way links**: each item card shows "Granted by · Ability · every scvm / if rolled N of M" with Go to ability, or "Not granted yet" with Grant from a new ability. Abilities opens with a tray of Class Items waiting for an ability. An item nobody grants blocks saving.
  - **Create from the ability**: the grant menu has "+ New Class Item named after this ability", which creates and links it; the grant shows the item's type and stats with Edit stats. When an ability and its item share a name the header reads "Reliquary Flail → grants weapon" and the test roll shows one line.
  - **Safe removal**: removing a granted item or an ability that is an item's only granter asks inline and names the dependent ("Remove both / Keep the item, ungranted / Cancel"); every removal offers Undo (10 s snackbar). No dangling references.
  - **Keyboard**: focus stays on (or next to) the control after every change; grant and removal changes are announced in a polite live region.
- **Abilities collapse** (impeccable `distill`; the step went from 3,349px to 1,180px on desktop, 4,607px to 1,708px on mobile): each ability is a summary row (Fixed/Random tag, name, chips for what it carries such as `→ weapon`, `+2 PRE tests`, `d4 table`, a missing-text count, Edit). One ability is open at a time; an open card shows name + rules text, then only the extras it actually has, with the rest behind one "Extras" row (Add a grant · Add modifier · Add reference table). One Remove per screen, on the open card, next to Done. Fix jumps, Go to ability, Grant from a new ability and Add ability open the right card.
- **Class Items carry a free-text Description** instead of structured effect tables (see ticket 03).
- **One control grammar for every Class Item** (impeccable `polish`, matching the Stats step): numbers are steppers (damage dice count, modifier, HP, uses, value); dice are die buttons (damage sides d2–d12, pet action die, armor tier); choices are segmented buttons, never dropdowns (Reach Melee|Ranged, pet Action Attacks|Buffs allies, pet Kind Beast|Humanoid, gear Kind Consumable|Wearable|Gear). Damage is stored structured (`diceCount`, `diceFaces`, `dmgMod`), not as free text. Each item ends in a result stamp (`2d4 +1 · melee`, `3 HP · d4 attack · humanoid`, `armor tier 2`, `consumable · 3 uses`).
- **Number controls use the sheet's own vocabulary** (impeccable `bolder`): every number is a − [value] + stepper whose value is a yellow resource stamp (typeable, arrow keys work, buttons disable at min/max); every die choice is a row of die buttons (d4…d12, the chosen one stamped yellow and tilted), keyboard-navigable as a radio group. Each stat is one line: stat block, dice / sides / modifier / lowest-die kept-or-dropped, and the result stamped large in book notation (`3d6 −1`, `best 3 of 4d6`) with its score and modifier range (`score 3–18`, `mod −3 to +3`).
- **Four title levels on DESIGN.md's ramp** (impeccable `polish`): step title = headline 2rem; card titles (item/ability names, collapsed rows, tray items) = title 1.5rem, with their type/kind badges at 0.75rem; group headings inside cards (Modifiers, Extras, Reference table, Before you save, Class Items waiting…, Languages, Rule, Forge a) = subtitle 1.2rem Bebas in bone white; field labels = label 0.75rem pink Antonio; rail step names = gothic 1.2rem. Secondary names (the ability in "Granted by") stay at subtitle size so they never rival the card title.
- **Cards lift, fields sink** (impeccable `polish`, only DESIGN.md's own tonal layers): item cards, ability rows and stat lines are Carbon Grey `#1a1a1a` with a 2px Iron Grey `#2a2a2a` border on the Pitch Black paper; text fields and selects inside them drop to Pitch Black `#0a0a0a`; each card header (badge, name, Remove) sits above a 2px rule; 20px between cards.
- **Design-system fixes the build should keep**: black focus rings on the yellow page (yellow disappears there), one pink interrupt per area (warnings only), 44px touch targets on touch devices, themed selection/caret/scrollbar, square SVG arrows and die icon instead of Unicode glyphs.
