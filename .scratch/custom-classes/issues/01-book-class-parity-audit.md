# What must a Custom Class be able to express to match every Book Class?

Type: research
Status: open

## Question

Audit all nine Book Classes end to end and list every capability the class creator must support for book parity: stat dice and modifiers, HP/weapon/armor dice, silver, fixed and random abilities (and random count), `gainItem`/`gainPet` grants and the catalog rows that exist only for one class (e.g. `weapons.brown-scimitar`, `pets.gore-hound`), `class_ability_modifiers` (incl. `exclude`), origins, uses/ammo/decoctions, and **every code path special-cased by class id or class name** (e.g. `GUTTERBORN_SCUM_CLASS_ID`, `GRANTED_ITEM_KEYS_BY_NAME`). Sources: `backend/init/05-seed/*.sql`, `backend/src/lib/generate-character.ts`, `backend/src/lib/get-character-full.ts`, `backend/src/lib/getting-better-*.ts`, `backend/src/services/character-improvement-*.ts`, frontend class/ability rendering.

Output: a capability checklist, each item citing file:line, flagged `data` (expressible as data today) or `code` (needs a hardcoded path generalised).
