# Modifier translations — DONE

The computed-modifier **effect source** strings were inline English in the seed
catalog (`modifiers` JSONB and `class_ability_modifiers.source`), so the modifier
UI showed them untranslated even under `pl`.

Now wired: `get-character-full.ts` translates each modifier `source` (and the
origin name where it mirrors it) via a `modifier.source.<slug>` key, with the
English source as the fallback. The stat chip maps the `statistic` enum to the
existing `gm.*` keys.

All 17 distinct sources are covered (4 you provided, the rest pulled from the
official MÖRK BORG: Skóra i Kości armor/weapon/ability translations):

| English source | Polish |
|---|---|
| Mail armor | Kolczuga |
| Plate armor | Zbroja płytowa |
| Scale armor | Zbroja łuskowa |
| Splint armor | Zbroja karacenowa |
| Barbarister's guidance | Pomoc Barbaristera |
| Hyphos snuff | Ożywcza Tabaka Hyphosa |
| Poltroon's annoyance | Wkurw Trzęsidupieca |
| The Blade of your Ancestors | Klinga Przodków Twych |
| The Brown Scimitar of Galgenbeck | Brunatny Bułat Galgenbecku |
| The Shoe of Death's Horse | Podkowa Chabety Śmierci |
| Abominable Gob Lobber | Wstrętny Miotacz Plwociny |
| Clumsy and Dull-witted | Niezdarny |
| Fernor's Philtre | Ekstrakt Fernora |
| Filthy Fingersmith | Paskudny Kieszonkowiec |
| Hyphos' Enervating Snuff | Ożywcza Tabaka Hyphosa |
| Stealthy | Szpicel |
| Stolen Mitre | Skradziona Mitra |

Statistic chip: `agility → Zwinność`, `presence → Opanowanie`, `strength → Siła`,
`toughness → Wytrzymałość` (via `gm.*`).

## Wiring (done)

- [x] `init/05-seed/011_modifier_source_translations.sql` (+ registered in `prisma/seed.ts`) — fresh DBs.
- [x] `prisma/migrations/20260622150000_modifier_source_translations/migration.sql` — existing DBs (idempotent `ON CONFLICT DO UPDATE`, guarded by catalog presence).
- [x] `resolveComputedModifiers` translates `source`/`originName` by `modifier.source.<slug>`.
- [x] Stat chip localizes `statistic` via `gm.*` in `ComputedModifierDetailsModal` + `ComputedModifierTag`.
