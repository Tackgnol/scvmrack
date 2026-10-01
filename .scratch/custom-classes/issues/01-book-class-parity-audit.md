# What must a Custom Class be able to express to match every Book Class?

Type: research
Status: resolved

## Question

Audit all six seeded Book Classes (ids 1–6) plus classless end to end and list every capability the class creator must support for book parity: stat dice and modifiers, HP/weapon/armor dice, silver, fixed and random abilities (and random count), `gainItem`/`gainPet` grants and the catalog rows that exist only for one class (e.g. `weapons.brown-scimitar`, `pets.gore-hound`), `class_ability_modifiers` (incl. `exclude`), origins, uses/ammo/decoctions, and **every code path special-cased by class id or class name** (e.g. `GUTTERBORN_SCUM_CLASS_ID`, `GRANTED_ITEM_KEYS_BY_NAME`). Sources: `backend/init/05-seed/*.sql`, `backend/src/lib/generate-character.ts`, `backend/src/lib/get-character-full.ts`, `backend/src/lib/getting-better-*.ts`, `backend/src/services/character-improvement-*.ts`, frontend class/ability rendering.

Output: a capability checklist, each item citing file:line, flagged `data` (expressible as data today) or `code` (needs a hardcoded path generalised).

## Answer

- The repo has **six** Book Classes (ids 1–6) plus a classless mode, not nine. There is no data or code for any other class.
- Already data today: stat modifiers, HP/weapon/armor dice, silver, fixed and random abilities with a count, origins, `class_ability_modifiers` (with `exclude`), and Class Item fields for weapons, equipment and pets.
- Still hardcoded (`code`):
  - the stat dice (3d6) and the omen die (d2)
  - grant resolution through `GRANTED_ITEM_KEYS_BY_NAME`/`GRANTED_PET_KEYS_BY_NAME`/`GRANTED_ITEM_EXTRAS` and positional `random_abilities` JSON
  - `GUTTERBORN_SCUM_CLASS_ID` Getting Better specialties
  - the Herbmaster decoctions UI (`classId === 6`)
  - six-class id limits
  - global `UNIQUE` on class names and ability keys, and a global item search
- Defects found along the way: the Heretical Priest's Crook is never granted (apostrophe mismatch), `pets.poltroon` cannot be reached, and the two Herbmaster modifiers cannot be reached.
- Full checklist with `file:line` citations: [Book Class parity research](../../../docs/superpowers/research/2026-09-26-custom-classes-book-class-parity.md)
