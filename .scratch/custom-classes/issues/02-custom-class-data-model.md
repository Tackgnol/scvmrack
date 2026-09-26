# Where do Custom Classes, their abilities, origins and Class Items live, and how does a character point at one?

Type: grilling
Status: resolved
Blocked by: 01

## Question

Decide the storage model: extend `classes`/`abilities`/`origins` with an owner, or separate tables; how `Character.classId` (Int) references a Custom Class; how per-class live lookups (`class_ability_modifiers` by `classId`, translation keys) work for GM-authored content; where Class Items live so they never appear in the shared catalog; how single- vs dual-language text is stored and validated. Must respect the charting decisions: locked once used, archive instead of delete.

## Answer

- **One `classes` table** for every class, with an explicit `source` enum: `main_book` (Book Class), `zine` (Zine Class), `the_rack` (Rack Class), `user` (Custom Class). Built-in Classes (`main_book`/`zine`/`the_rack`) have no owner and are seeded via SQL; `Character.classId` (Int) is unchanged and the generator keeps one code path.
- **Credit** columns `credit_work`, `credit_author`, optional `credit_url`, rendered "from {work} by {author}" for Zine (and Rack) Classes. Custom Classes show "created by {owner name}" from `owner_user_id`.
- **Lifecycle columns**: `owner_user_id`, `languages` (`{en}`/`{pl}`/`{en,pl}`), `visibility` (private/public), `status` (draft/active/archived), `locked_at`, `taken_down_at` + reason. What counts as "used" is ticket 10's call. Built-in Classes are reportable/hideable via the same takedown flow but are never lock-on-use (edited via migrations).
- **Name uniqueness**: unique per owner instead of global.
- **Text** lives in `translations` under namespaced keys (e.g. `cc.<classId>.ability.<n>`), so every reader works unchanged; reads fall back to the class's authored language when the reader's locale has no row (single-language classes).
- **Abilities and origins** stay in `abilities`/`origins` with namespaced keys. Grants move onto the ability row as explicit `grant_item_key`/`grant_pet_key`, and Book Classes migrate onto them in the same change (retiring the positional `random_abilities` JSON and name->key maps). Grant count per ability: ticket 03.
- **Class Items** live in `weapons`/`armors`/`equipment`/`pets` with a `custom_class_id` scope column and namespaced keys that keep their type prefix (`pets.cc-<classId>-...`); item search excludes scoped rows. Existing Book class items stay searchable.
- **Parity columns**: per-stat dice spec `{count, faces, modifier, dropLowest}` replacing `stat_modifiers` (Book Classes migrate to `{3, 6, mod}`), and `omen_die`. Correcting the Book Classes' omen dice to the printed book is **required for this feature to be done**.
- **Party Class Pool defaults**: Book Classes only; Zine and Rack Classes start off.
