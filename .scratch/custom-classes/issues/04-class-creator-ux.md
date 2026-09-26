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

- **Seven steps in a rail**: Identity, Stats & dice, Abilities, Class Items, Origins, Getting Better, Test roll & save. Each step shows `OK` or its count of problems; the rail is a sticky column on desktop and a horizontal strip on phones that keeps the current step in view. Back/Next buttons name the next step.
- **One language at a time**: a "Writing in English / Polish" switch, each language showing how many of its fields are missing on the current step. The class's languages are picked on Identity as English only / Polish only / Both.
- **Validation lives on the field**: a missing translation marks the field `aria-invalid` with inline "Polish text missing" text. The final step lists every problem with a **Fix** button that jumps to the right step, switches language and focuses the field. Save stays available but explains exactly what blocks it.
- **Test roll on the final step**: rolls a scvm from the draft as it stands (stats with modifiers, HP, omens, silver, weapon/armor dice, fixed + rolled abilities, what it starts with, origin) and keeps nothing.
- **Empty states and limits**: empty abilities / Class Items / origins explain what to add; add buttons disable at the 20-item caps; counters read "5 of 20 abilities".
- **Number controls use the sheet's own vocabulary** (impeccable `bolder`): every number is a − [value] + stepper whose value is a yellow resource stamp (typeable, arrow keys work, buttons disable at min/max); every die choice is a row of die buttons (d4…d12, the chosen one stamped yellow and tilted), keyboard-navigable as a radio group. Each stat is one line: stat block, dice / sides / modifier / lowest-die kept-or-dropped, and the result stamped large in book notation (`3d6 −1`, `best 3 of 4d6`) with its score and modifier range (`score 3–18`, `mod −3 to +3`).
- **Design-system fixes the build should keep**: black focus rings on the yellow page (yellow disappears there), one pink interrupt per area (warnings only), 44px touch targets on touch devices, themed selection/caret/scrollbar, square SVG arrows and die icon instead of Unicode glyphs.
