# Research: Book Class parity checklist for Custom Classes

- Wayfinder ticket: `.scratch/custom-classes/issues/01-book-class-parity-audit.md`
- Date: 2026-09-26, branch `wayfinder/custom-classes`
- Sources: only the code and seed data in this repo (paths cited as `file:line`). One item (omen dice) also mentions the printed rules. It is labelled where it appears.

## Summary

- **The repo has six Book Classes, not nine.** `classes` has ids 1–6: Fanged Deserter, Gutterborn Scum, Esoteric Hermit, Wretched Royalty, Heretical Priest and Occult Herbmaster (`backend/init/05-seed/001_game_data.sql:23-28`, `classes_id_seq` = 6 at `:1394`). No seed row, translation or code path exists for any other class. **Classless** is a separate generation mode (`classId = null`). It is not a class row, and it is included below because a join flow can offer it.
- **Most of a Book Class is already data:** the columns on `classes` (stat modifiers, HP/weapon/armor dice, silver, random-ability count), the `abilities`, `origins` and `class_ability_modifiers` rows, the translations, and the global weapon/armor/equipment/pet catalog.
- **Four things are still hardcoded:**
  1. The stat-dice formula and the omen die are fixed in code for every class.
  2. `gainItem`/`gainPet` grants go through display-name maps and positional JSON in code.
  3. The Gutterborn Scum Getting Better rules are keyed on `GUTTERBORN_SCUM_CLASS_ID = 2`.
  4. The Occult Herbmaster decoction UI is keyed on `classId === 6`, and its decoction list is hardcoded.
- Some checks also assume exactly six classes: the random class pick in the frontend (`1..6`) and the generate schema (`classId` maximum 6).
- The audit also turned up four defects:
  - The Heretical Priest's Sacred Shepherd's Crook is never granted.
  - `pets.poltroon` cannot be reached.
  - The two Occult Herbmaster modifiers cannot be reached.
  - Several class columns and translations are never read.

  Details are in [Incidental defects](#incidental-defects-found-during-the-audit).

## Per-class table

Column order of a `classes` row: `(id, name, roll, appendix, hp_die, weapon_die, armor_die, silver_dice, silver_modifier, stat_modifiers, class_abilities, random_abilities, random_ability_count, name_key, description_key)` (`backend/init/02-schema/001_tables.sql:10-26`). Values come from `001_game_data.sql:23-28`. `random_abilities` JSON is current as of `006_align_equipment_catalog.sql:113-214`, and modifiers as of `009_sync_class_ability_modifiers.sql:18-42`.

| | Fanged Deserter (1) | Gutterborn Scum (2) | Esoteric Hermit (3) | Wretched Royalty (4) | Heretical Priest (5) | Occult Herbmaster (6) | Classless (null) |
|---|---|---|---|---|---|---|---|
| Stat modifiers | STR+2, AGI−1, PRE−1 | STR−2 | PRE+2, STR−2 | none | PRE+2, STR−2 | STR−2, TOU+2 | none (`generate-character.ts:99`) |
| Stat dice | 3d6 + mod (code) | 3d6 + mod | 3d6 + mod | 3d6 + mod | 3d6 + mod | 3d6 + mod | 4d6 per stat; up to 2 stats take best 3, the rest take lowest 3 (code) |
| HP | d10 + TOU mod, min 1 | d6 | d4 | d6 | d8 | d6 | d8 |
| Omens | d2 (code, all classes) | d2 | d2 | d2 | d2 | d2 | d2 |
| Weapon die | d10 | d6 | d4 | d8 | d8 | d6 | d10 |
| Armor die | d4 | d2 | d2 | d3 | d4 | d2 | d4 |
| Silver | 2d6×10 | 1d6×10 | 1d6×10 | 4d6×10 | 3d6×10 | 2d6×10 | 2d6×10 |
| Fixed abilities | Clumsy and Dull-witted; Bite Attack | Stealthy | none | none | none | Portable Laboratory (`decoctions`) | none |
| Random abilities (count / pool) | 1 / 6 | 1 / 6 | 1 / 6 | **2** / 6 | 1 / 6 | **0** / 8 (decoctions stored as `is_random` rows but never rolled) | none |
| `gainItem` | Crumpled Monster Mask, Brown Scimitar, Wizard Teeth, Old Sigürd's Sling, Shoe of Death's Horse | Lockpicks (shared catalog item) | — | Blade of your Ancestors, Snake-Skin Gift | Sacred Shepherd's Crook (**broken**, see defects) | — | — |
| `gainPet` | Ancient Gore-Hound | — | Hawk | Barbarister, Hamfund (Poltroon has **no** grant) | — | — | — |
| Catalog rows used only by this class | `equipment.crumpled-monster-mask`, `equipment.wizard-teeth` (`006:33-34`); `weapons.brown-scimitar`, `weapons.sigurd-sling`, `weapons.shoe-of-death` (`001:1338-1340`); `pets.gore-hound` (`001:483`) | none (`equipment.lockpicks` is also on the starting table, `generate-character.ts:351`) | `pets.hawk` (`001:482`) | `weapons.blade-of-ancestors`, `weapons.snake-skin-gift` (`001:1336-1337`); `pets.hamfund`, `pets.barbarister`, `pets.poltroon` (`001:484-486`) | `weapons.sacred-shepherds-crook` (`001:1341`) | 8 decoction equipment rows tagged `decoction` (`001:153-154,176-181`; `013:6-22`); red/black poison also appear on the starting table | — |
| `class_ability_modifiers` | clumsy AGI−2, exclude `[defence]` | stealthy AGI+2 and PRE+2; fingersmith AGI+4 (tests only); gob_lobber PRE+4 (tests only) | none (removed at `006:178-183`) | none (removed at `006:197-202`) | mitre AGI+2 (defence only) | philtre PRE+2, hyphos AGI−2 (**unreachable**) | — |
| Origins | 6 (`001:438-443`) | 6 (`:444-449`) | 6 (`:450-455`) | 6 (`:456-461`) | 6 (`:462-467`) | 6 (`:468-473`) | none |
| Uses / ammo | Wizard Teeth 4 uses (code extra); sling ammo `Infinite`/999; Gore-Hound 10 HP pips | — | Hawk 8 HP pips | Hamfund 1 and Barbarister 1 HP pips; Blade +1 damage, d6 effect table; Gift d4 effect table | Crook 2d4 | decoctions are single-use items (`use_effect`); red/black poison `default_amount` 3 (`007`) | — |
| Class-specific code | name→key grant maps | `GUTTERBORN_SCUM_CLASS_ID` Getting Better specialties | — | — | — | `classId === 6` decoctions button and modal | classless stat UI and rules |

## Capability checklist

`data` = can be expressed as rows or columns today, so a Custom Class only needs its own storage. `code` = a hardcoded path that must be generalised before a Custom Class can express it.

### A. Identity and text

1. **Name, localized.** `classes.name_key` → `translations`, with `classes.name` as fallback (`get-character-full.ts:792`; `character-repository.ts:146-170,194-227`). — `data`
2. **Globally unique class name.** `classes.name` is `UNIQUE` (`001_tables.sql:12`; `schema.prisma:250`), so two GMs cannot both have a class called "Witch". — `code` (schema)
3. **Description.** `description_key` → `translations`, falling back to `appendix` (`get-character-full.ts:793`). The `classes.*.appendix` translation rows (`001:1189-1206`; `010:95-112`) are never read. — `data`
4. **Class list for the creation gate.** `listClasses` returns every row in `classes` (`character-repository.ts:146-170`), and the gate renders whatever it gets (`ClassGate.tsx:121-126`). Filtering by Party Class Pool does not exist yet (ticket 05). — `code`

### B. Numbers

5. **Per-stat modifier** (`stat_modifiers` JSON, 4 keys). Applied at `generate-character.ts:749-752`. — `data`
6. **Stat dice formula.** Book Classes are hardwired to `3d6` (`roll3d6`, `generate-character.ts:108-110,749-752`). Classless is hardwired to 4d6, choosing up to 2 stats that keep the best 3 while the rest keep the lowest 3 (`generate-character.ts:112-145,738-747`; `draft.ts:13` `maxItems: 2`; `DraftStatsSection.tsx:10` `MAX_CLASSLESS_CHOICES = 2`). No column holds "N dice of X ± mod, drop lowest" per attribute. — `code`
7. **HP die** (`hp_die`). HP = die + Toughness modifier, minimum 1 (`generate-character.ts:723,754-755`). — `data`
8. **Omen die.** Always `1d2` (`generate-character.ts:758`); the `classes` table has no column for it. From the printed rules, not this repo: the book gives some classes other omen dice (e.g. d4). Decide whether parity means repo parity or book parity. — `code`
9. **Silver** (`silver_dice INTEGER[]` × `silver_modifier`) (`generate-character.ts:724-725,761-766`). — `data`
10. **Weapon die** (`weapon_die`). The rolled value looks up `weapons.roll` 1..10 (`generate-character.ts:435-436`). If the starting pool already holds a `scroll.*` item, the die is capped at d6 (`:486-487`). The cap is a generic rule, not a class rule. — `data`
11. **Armor die** (`armor_die`). 1 = no armor, 2 = tier 1, 3 = tier 2, 4+ = tier 3 (`generate-character.ts:457-461`). With a scroll, the die is capped at d2 (`:488`). — `data`
12. **Starting gear tables** (carry d6, table one d12, table two d12). Hardcoded and identical for every class (`generate-character.ts:298-427`). Book Classes do not vary here, so parity does not require an override. — `code` (shared; no per-class need)
13. **Random class weight.** Uniform over all rows. The `classes.roll` column (1–6) is never read (`generate-character.ts:628-631`; `character-draft-service.ts:111-116`). — `data` (unused column)

### C. Abilities

14. **Fixed abilities.** `abilities` rows with `is_random = false` for the class (`generate-character.ts:548-550`; `001:35-76`). — `data`
15. **Random ability pool and count.** `abilities.is_random` + `roll_value`, plus `classes.random_ability_count`. Selection is a uniform shuffle that takes the first *count* (`generate-character.ts:552-560`); `roll_value` is not rolled as a die. Counts in use are 0, 1 and 2. — `data`
16. **Ability text.** Displayed from `translations[ability.key]` as a single `"Name: text"` string. `description` is read from `${key}.description` (`get-character-full.ts:343-344`), but no such key is seeded, so it is always `''`. The name/description copies inside `classes.random_abilities` and `classes.class_abilities` JSON are **not** used for display. `class_abilities` has no reader at all. — `data`
17. **Per-character ability comment.** Passes through generically (`get-character-full.ts:346`). — `data`
18. **Ability keys are globally unique** (`abilities.key UNIQUE`, `001_tables.sql:31`; `004:9-25`). Custom Class abilities need namespaced keys or their own table. — `code` (schema)

### D. Grants (`gainItem` / `gainPet`)

19. **Where grants are declared.** A grant is declared inside the `classes.random_abilities` JSON. It is matched to an `abilities` row **by array position**: `random_abilities[roll_value - 1]` (`generate-character.ts:567-568`). The coupling is implicit. — `code`
20. **Item grant resolution.** If the value is already a catalog key, it passes straight through (`generate-character.ts:274`). Otherwise it goes through the display-name map `GRANTED_ITEM_KEYS_BY_NAME` (`:252-262`). Every Book Class grant uses a display name and so depends on the map (`006:115-192`). — `code`
21. **Pet grant resolution.** Same pattern through `GRANTED_PET_KEYS_BY_NAME` (`generate-character.ts:264-269,282-290`). — `code`
22. **One grant per ability.** An item wins; a pet is tried only when there is no item (`generate-character.ts:570-575`). — `code` (limit)
23. **Per-grant extras.** `GRANTED_ITEM_EXTRAS` gives Wizard Teeth 4 use pips (`generate-character.ts:245-247`). This could become data through `equipment.default_amount` + the `consumable` tag, which `hydrateInventoryUses` already honours (`inventory.ts:64-72`). — `code` (easy to move to data)
24. **Only rolled random abilities grant.** Fixed abilities never grant (`generate-character.ts:565-577`). No Book Class needs a fixed grant today. — `code` (limit)
25. **Granted items are not auto-equipped.** Only the rolled starting weapon and armor carry `autoEquip` (`generate-character.ts:446-449,466,509,525`). Granted weapons land in inventory. — `data` (current behaviour)
26. **Abilities gained through Getting Better never grant items.** Apply only rewrites ability keys (`character-improvement-apply.ts:27-32,53-63`). — `code` (gap)

### E. Class Items (catalog rows used by only one class)

27. **Weapon fields.** `dice[]` (e.g. `{4,4}` = 2d4), `damage_modifier`, `effect_die` + `effect` JSON (1-in-N outcome table), `modifiers` with `exclude`, `ammo_type`/`default_amount` (`Infinite`/999 for the sling), tags incl. `special` (`001_tables.sql:43-60`; `001:1336-1341`; `006:100-111`). — `data`
28. **Armor.** No Book Class has class-only armor, but the columns exist (`dice`, `max_tier`, `modifiers`) (`001_tables.sql:62-72`). — `data`
29. **Equipment fields.** Tags (`special`, `wearable`, `consumable`, `decoction`, `poison`); `use_effect` JSON (`SingleUse`/`MultiUse`, `effectDie`, `heal`, `statuses`); `default_amount` (`001_tables.sql:74-91`; `001:153-181`; `006:33-34`; `007`). — `data`
30. **Pet fields.** `hp` (becomes use pips, `inventory.ts:50-52`), `action_die`, `action_type` (`melee`/`buff`), `buff` modifiers, tags (`humanoid`) (`001_tables.sql:93-105`; `001:480-486`). — `data`
31. **Pet key prefix.** Pet buffs only apply to items whose key starts with `pet.`/`pets.` (`get-character-full.ts:493`), and encumbrance exemption also checks the prefix (`:381-391`). Class Item pet keys must keep the prefix, or this check must switch to tags. — `code`
32. **Item names and descriptions** come from `translations[key]` and `translations[key + ".description"]`, falling back to stored `name`/`description` (`get-character-full.ts:148-157`). — `data`
33. **Global catalog visibility.** Class-only items sit in the same global tables with globally `UNIQUE` keys, and item search returns every row (`catalog-repository.ts:135-143`; `item-search-service.ts:22`; `init/04-views/item_search.sql`). Book class items are searchable by everyone today; Class Items that should stay private to their class need scoping. — `code`

### F. Modifiers

34. **`class_ability_modifiers`.** Each row holds `class_id, ability_key, value, statistic ∈ {agility,strength,presence,toughness}, exclude JSONB, source, notes` (`02-schema/003_class_ability_modifiers.sql:4-14`; canonical set at `009:18-42`). Rows are resolved by the character's **current `classId`** plus its ability keys (`get-character-full.ts:509-528`; `catalog-repository.ts:128-133`). — `data`
35. **`exclude` vocabulary.** Seeded values: `defence, melee, ranged, test, cast, ability, heal, buff, item` (`001:98-99`, `009`). The custom-modifier UI exposes only `melee, ranged, defence, cast, ability` (`frontend/src/components/modifiers/config.ts:10-16`). DR math uses `defence`/`melee`/`ranged` (`get-character-full.ts:596-612,787-789`). — `data` (the creator needs the full vocabulary)
36. **Modifier source label.** Translated through `modifier.source.<slug of the English source>` (`get-character-full.ts:97-107,565-588`; `011:6-45`). The key is derived from English text, which does not fit a PL-only Custom Class well. — `data` (fragile)

### G. Origins

37. **Origins.** `origins (class_id, roll, key)` + translations, 6 per class. Picked uniformly from the list; `roll` is not read (`generate-character.ts:712-714,772`). Classless has none. — `data`

### H. Getting Better

38. **Generic HP, debris and ability rolls.** Class-agnostic (`character-improvement-preview.ts:136-151`; `getting-better-rolls.ts`). — `data`
39. **Gutterborn Scum specialties.** Enabled only when `classId === GUTTERBORN_SCUM_CLASS_ID` (`character-improvement-preview.ts:25,111-113,144,193`):
    - The first improvement adds a second distinct random ability from the class pool.
    - Later improvements can reroll the primary, the secondary or both (`getting-better-scum.ts:18-59,61-158`).
    - The pool is the class's `is_random` rows ordered by `roll_value` (`character-improvement-preview.ts:227-242`; `character-improvement-repository.ts:141-147`).
    - The preview carries `scumSpecialtyNames` (`:32,50-76`), and the UI has a dedicated Scum section (`GettingBetterPanelSections.tsx:148-160,374-430`).

    This is the only precedent for the planned Getting Better option "also gain a random class ability you don't have yet". — `code`

### I. Class-specific UI and hardcoded class sets

40. **Occult Herbmaster decoctions.**
    - The "view decoctions" button shows only when `character.classId === 6` **and** the ability key is `abilities.occult_herbmaster.decoctions` (`useCharacterDescriptors.ts:23`; `DescriptorAbilityItem.tsx:18-19,37,78-106`).
    - `DecoctionsModal` hardcodes 8 entries and the title "(d8)" (`DecoctionsModal.tsx:7-60,74-77`).
    - The daily "brew two random decoctions, d4 doses" mechanic is not automated anywhere.

    To express this as data, you need something like "an ability that shows a d-N reference table". — `code`
41. **Random class and valid ids.**
    - The frontend quick-generate picks `Math.floor(Math.random() * 6) + 1` (`useCharacterActions.ts:88`).
    - `GenerateBodySchema.classId` has maximum 6 (`backend/src/schemas/character.ts:360`); the draft schemas have maximum 100 (`backend/src/schemas/draft.ts:30,42`).
    - Backend random picks use every row (`generate-character.ts:628-631`; `character-draft-service.ts:111-116`).
    - — `code`
42. **Classless mode.** Separate rules and UI: `CLASSLESS_DEFAULTS` (`generate-character.ts:93-100`), drop-lowest stats, no abilities or origin (`:775-777`), and classless-specific draft UI (`DraftStatsSection.tsx`, `DraftAbilitiesSection.tsx:54`). — `code` (not a class; the pool decides whether it is offered, ticket 05)

### J. Abilities that are text only (no mechanics anywhere)

43. These abilities exist only as translated text; the creator just needs free text for them:
    - Coward's Jab, Escaping Fate, Dodging Death, Excretal Stealth
    - Book of Boiling Blood, Initiate of the Invisible College (scroll summoning), Bard of the Undying, Horn of the Schleswig Lords
    - Nechrubel Bible, Stones of Thel-Emas, Crucifix, List of Sins
    - Poltroon, the Hamfund/Eurekia 1-in-6, the Clumsy scroll ban, Bite Attack

    Their only mechanical traces are the `class_ability_modifiers` rows above. — `data`

## Incidental defects found during the audit

- **The Heretical Priest's Sacred Shepherd's Crook is never granted.** The seed `gainItem` uses a curly apostrophe (U+2019), `"Sacred Shepherd’s Crook"` (`006_align_equipment_catalog.sql:207`). The TypeScript map key uses a straight `'` (`generate-character.ts:261`). The archived SQL matched the curly form (`init/_archive/generate_character.sql:143`). Result: `buildGrantedClassItem` returns `null` and the Priest gets nothing. No test covers this grant.
- **`pets.poltroon` cannot be reached.** Poltroon's ability has no `gainPet` (`006:189`), and the pet map has no entry for it. The catalog row with buffs (`001:486`) is only reachable through manual item search. Its ability modifiers were also deleted (`006:197-202`, absent from `009`).
- **The Occult Herbmaster's `class_ability_modifiers` cannot be reached.** The philtre and hyphos rows (`009:39-42`) require those ability keys on the character. Generation never assigns decoction abilities, because `random_ability_count` is 0 (`001:28`; `004:68`).
- **Class data that is never read:**
  - `classes.class_abilities` JSON
  - `classes.roll`
  - the `classes.*.appendix` translation keys
  - the flavour `description` inside `random_abilities` (it duplicates the translation text; see also `2026-09-13-rpg-67-repeated-character-information.md`)

## Implications for the class creator

- The creator can store **as plain data**:
  - stat modifiers, HP/weapon/armor dice, silver dice × multiplier
  - fixed abilities, random abilities with a count (0 or more), and origins
  - per-ability numeric modifiers with the full `exclude` vocabulary
  - Class Items with the full weapon/equipment/pet field set
- **Before the creator can reach parity**, the generator must:
  - accept per-attribute stat dice and an omen die (items 6 and 8)
  - replace the name maps and positional JSON with an explicit grant reference (catalog key or Class Item id) on each ability row (items 19–23)
  - scope Class Items out of global search (item 33)
  - make the Scum specialty rule a class setting instead of `classId === 2` (item 39)
  - make the "reference table" feature (Herbmaster decoctions) data-driven (item 40)
  - drop the hardcoded six-class id assumptions (item 41)
  - relax the global `UNIQUE` on class names and ability keys (items 2 and 18)
