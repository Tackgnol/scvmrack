# Modifiers System — Architecture

## Overview

Modifiers are stat adjustments on a character: "−4 AGI from Splint armor", "−1 STR because hungry", "+2 STR from Blade of Ancestors". Two sources:

- **Computed modifiers** — auto-derived from equipped armor, weapons, and pets. Read-only. Change your gear, they follow.
- **Custom modifiers** — player-created via the UI. Full CRUD through the existing optimistic patch system.

Both use the **same shape** already established in the DB (`armors.modifiers`, `weapons.modifiers`, `pets.buff`).

---

## Modifier Shape

### Existing DB shape (armors, weapons, pets)

```jsonc
{
  "value": -4,                    // numeric, negative = penalty
  "source": "Splint armor",       // display name
  "statistic": "agility",         // full word: agility|strength|presence|toughness
  "exclude": ["defence", "buff"]  // contexts where this does NOT apply
}
```

### Custom modifier shape (characters.modifiers)

Same base shape, plus identity and UX fields:

```jsonc
{
  "id": "uuid-string",            // client-generated for optimistic updates
  "name": "Hungry",               // player-given label
  "value": 0,                     // numeric
  "source": "Player",             // or item key link
  "statistic": "agility",         // same vocabulary as DB
  "exclude": [],                  // same vocabulary as DB
  "comment": "No rest healing"    // optional tooltip text
}
```

### Computed modifier shape (returned by get_character_full)

Same base shape, plus origin info added by the SQL function:

```jsonc
{
  "value": -4,
  "source": "Splint armor",
  "statistic": "agility",
  "exclude": ["defence", "buff"],
  "origin": "armor",              // armor | weapon | pet
  "origin_key": "armor.splint",   // item key for linking
  "origin_name": "Splint Armor"   // translated display name
}
```

---

## The `exclude` Vocabulary

Inverse-tag system from the existing DB. A modifier applies to **everything except** the listed contexts:

| Context    | Meaning                          | Example                                |
|------------|----------------------------------|----------------------------------------|
| `melee`    | Melee attack (STR DR12)          | Blade of Ancestors excludes this for AGI bonus |
| `ranged`   | Ranged attack (PRE DR12)         | —                                      |
| `defence`  | Defence rolls (AGI DR12)         | Splint AGI -4 excludes defence         |
| `cast`     | Scroll/Power casting (PRE DR12)  | —                                      |
| `ability`  | General non-combat ability tests | —                                      |
| `test`     | Generic DR tests                 | —                                      |
| `heal`     | Healing / rest context           | —                                      |
| `buff`     | Prevents stacking with buffs     | Most modifiers exclude this            |
| `item`     | Item usage context               | —                                      |

**Examples from production data:**

- Splint armor: `exclude: ["defence", "buff"]` → AGI -4 on everything except defence rolls
- Splint armor (2nd): `exclude: ["ability","test","melee","ranged","cast","heal","buff"]` → AGI -2 on defence only
- Blade of Ancestors: `exclude: ["defence","test","heal","cast","buff"]` → STR +2 on melee only
- Poltroon: `exclude: ["melee","ranged","cast","ability","test","heal","buff"]` → AGI +2 on defence only

---

## Sign Convention (from existing DB data)

**Negative = penalty, Positive = bonus** (consistent with "added to your roll"):

```
DR = 12 - ability - Σ(applicable modifier values)

Splint (value: -4):  12 - agi - (-4) = 12 - agi + 4  → harder ✓
Blade  (value: +2):  12 - str - (+2) = 12 - str - 2  → easier ✓
```

---

## DB Changes

### Migration structure

```
db/
├── 02-schema/
│   ├── 001_tables.sql          ← untouched, baseline
│   └── 002_modifiers.sql       ← NEW: ALTER TABLE ADD COLUMN
└── 03-functions/
    └── get_character_full.sql   ← MODIFIED: returns modifiers + computed_modifiers
```

- `001_tables.sql` stays as the baseline snapshot — never edited for incremental changes
- `002_modifiers.sql` adds the column via `ALTER TABLE ... IF NOT EXISTS` (idempotent)
- `get_character_full.sql` is replaced wholesale (functions are idempotent via DROP + CREATE)
- `00-init.sh` runs `02-schema/*.sql` alphabetically, so `002` runs after `001` automatically

### 002_modifiers.sql

```sql
ALTER TABLE characters
    ADD COLUMN IF NOT EXISTS modifiers JSONB NOT NULL DEFAULT '[]'::JSONB;
```

### get_character_full.sql changes

1. Added `modifiers jsonb` and `computed_modifiers jsonb` to `RETURNS TABLE`
2. Added `resolved_computed_modifiers jsonb` to `DECLARE`
3. New **section 7** before final return: computes modifiers from equipped gear
   - 7a: `armors.modifiers` for equipped armor
   - 7b: `weapons.modifiers` for equipped weapons
   - 7c: `pets.buff` for pets in equipment inventory
   - Each annotated with `origin`, `origin_key`, `origin_name` (translated)
4. Final `RETURN QUERY` includes both `result.modifiers` and `resolved_computed_modifiers`

No changes needed to `generate_character` (uses explicit column lists, new column has a default).

---

## Backend Changes (TODO)

### character.ts — Schema

```typescript
const ModifierSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    id:        { type: 'string', maxLength: 36 },
    name:      { type: 'string', maxLength: 255 },
    value:     { type: 'number' },
    source:    { type: 'string', maxLength: 255 },
    statistic: { type: 'string', enum: ['agility','strength','presence','toughness'] },
    exclude:   { type: 'array', items: { type: 'string', maxLength: 50 }, maxItems: 15 },
    comment:   { type: 'string', maxLength: 500 },
  }
};

// Add to UpdateBodySchema.properties:
modifiers: { type: 'array', items: ModifierSchema, maxItems: 30 }

// Add to CharacterSchema.properties:
modifiers: { type: 'array', items: ModifierSchema }
computed_modifiers: { type: 'array' }  // read-only, not in UpdateBodySchema
```

---

## Frontend Changes (TODO)

### models.ts — Types

```typescript
interface BaseModifier {
  value: number;
  source: string;
  statistic: 'agility' | 'strength' | 'presence' | 'toughness';
  exclude: string[];
}

interface CustomModifier extends BaseModifier {
  id: string;
  name: string;
  comment?: string;
}

interface ComputedModifier extends BaseModifier {
  origin: 'armor' | 'weapon' | 'pet';
  origin_key: string;
  origin_name: string;
}
```

### OptimisticPatch — New kinds

```typescript
| { kind: 'modifier-add'; modifier: CustomModifier }
| { kind: 'modifier-remove'; modifierId: string }
| { kind: 'modifier-update'; modifierId: string; modifier: Partial<CustomModifier> }
```

### applyOptimisticPatch.ts

```typescript
case 'modifier-add':
  return { ...char, modifiers: [...(char.modifiers ?? []), patch.modifier] };
case 'modifier-remove':
  return { ...char, modifiers: (char.modifiers ?? []).filter(m => m.id !== patch.modifierId) };
case 'modifier-update':
  return { ...char, modifiers: (char.modifiers ?? []).map(m =>
    m.id === patch.modifierId ? { ...m, ...patch.modifier } : m
  )};
```

### patchToRequest.ts

Add `needsModifiers` flag alongside `needsEquipment`/`needsStorage`. When any modifier patch is pending, send `modifiers: currentCharacter.modifiers`.

### useCharacterEditor.ts

Expose `addModifier`, `removeModifier`, `updateModifier` — same pattern as equipment ops.

### SummaryBar — Stat computation

```typescript
function computeDR(
  baseDR: number,
  ability: number,
  allModifiers: BaseModifier[],  // computed + custom merged
  context: string                // 'defence' | 'melee' | 'ranged'
): number {
  const applicable = allModifiers.filter(m =>
    m.statistic === abilityForContext(context) &&
    !m.exclude.includes(context)
  );
  const total = applicable.reduce((sum, m) => sum + m.value, 0);
  return baseDR - ability - total;
}

const toDodge     = computeDR(12, character.agility,  allMods, 'defence');
const toHitMelee  = computeDR(12, character.strength, allMods, 'melee');
const toHitRanged = computeDR(12, character.presence, allMods, 'ranged');
```

---

## UI Design (TODO)

### ModifiersPanel — Two sections

**Auto section** (read-only, from equipment):
- Shows computed modifiers with lock icon
- Grouped by origin item
- "Change equipment to update these"

**Custom section** (editable):
- Active modifier chips with remove button
- Quick-add form: `[Name] [Stat ▾] [Value] [Scope ▾] [+]`
- Scope dropdown translates intent to `exclude` arrays:
  - "All tests" → `exclude: []`
  - "Combat only" → `exclude: ["ability","test","heal","buff","item"]`
  - "Defence only" → `exclude: [everything except "defence"]`
  - "Melee only" → `exclude: [everything except "melee"]`
  - "Ranged only" → `exclude: [everything except "ranged"]`
  - "Powers only" → `exclude: [everything except "cast"]`
- Advanced modal with full exclude checkboxes for edge cases

---

## Implementation Order

1. ~~DB migration~~ ✅ `002_modifiers.sql` + updated `get_character_full.sql`
2. Backend schema (`character.ts`) — add ModifierSchema to Update + Character schemas
3. Frontend types (`models.ts`) — Modifier types + new OptimisticPatch kinds
4. Optimistic patches (`applyOptimisticPatch.ts`, `patchToRequest.ts`)
5. Editor hook (`useCharacterEditor.ts`) — expose add/remove/update
6. Regenerate OpenAPI types (`schema.ts`)
7. SummaryBar — `computeDR()` with merged modifiers
8. ModifiersPanel — auto section + custom section + quick-add + advanced modal
9. i18n — modifier-related strings
