# What does a GM fill in to author an ability and each kind of Class Item?

Type: grilling
Status: resolved
Blocked by: 01

## Question

For an ability: fixed vs random, roll value, name/description (per language), what it grants (Class Item, catalog item, pet), its modifiers (stat, value, exclusions). For each Class Item type (weapon, armor, equipment, pet): which fields from the catalog models are exposed (damage die, effects, uses, ammo, armor tiers, pet stats, value). Driven by the parity checklist.

## Answer

- **Ability**: name + description in each of the class's languages; **fixed** (everyone gets it) or **random** (in the pool). The class sets how many random abilities to roll (0..pool size); selection stays a uniform pick without duplicates, so the creator shows "roll N of these M" rather than a numbered dice table.
- **Grants**: up to one item **and** one pet per ability (`grant_item_key` + `grant_pet_key`), on fixed or random abilities. Good enough for now; revisit if multi-item grants are requested.
- **Grant targets**: the class's own Class Items, or any unscoped catalog item (incl. Book class items like the Brown Scimitar). Never another Custom Class's Class Items.
- **Modifiers**: same rules as adding a modifier on the sheet, reusing the existing modifier component (`frontend/src/components/modifiers/`). That component's vocabulary is extended with `test` (plus `heal`/`buff`/`item`, behind a "more" toggle or presets) and a "Tests" preset, so "tests only" modifiers (e.g. Fingersmith) reach parity; players get the extended options on their own sheet modifiers too. Source label is the ability's own name.
- **Class Item fields** (full Book parity; tags derived, never shown):
  - Weapon: damage dice (NdX) + damage modifier, melee/ranged, ammo type + starting amount or infinite, optional dN effect table (text per result), modifiers, value.
  - Armor: tier 1–3, modifiers, value.
  - Equipment: wearable/consumable, uses, use effect (single/multi use; optional damage, effect die, temporary statuses), value.
  - Pet: HP, action die + type (attack/buff), buff modifiers, humanoid.
- **Reference tables**: an ability can carry a dN reference table (entries optionally linked to Class Items) that the player opens from the sheet. The Occult Herbmaster's decoctions migrate onto it, retiring the `classId === 6` code.
- **Limits**: at most 20 abilities, 20 Class Items and 20 origins per class; 1500 characters per text field.
