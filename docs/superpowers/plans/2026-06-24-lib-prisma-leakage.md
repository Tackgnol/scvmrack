# lib/ Prisma Leakage — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move all Prisma calls out of `backend/src/lib/` into `backend/src/repositories/`, restoring the documented invariant that repositories are the only layer that touches Prisma.

**Architecture:** Create a new `catalog-repository.ts` that owns every catalog read (weapons, armors, equipment, pets, classes, translations, classAbilityModifiers). The three leaking lib files (`inventory.ts`, `get-character-full.ts`, `item-search-service.ts`) keep their existing public API and async structure unchanged — their internal `prisma.*` calls are replaced with `catalogRepository.*` calls. Callers (character-service, character-draft-service, equipment-service) require **zero changes**.

**Tech Stack:** TypeScript, Prisma 5, Node.js built-in test runner (`node:test` + `mock.module`)

## Global Constraints

- Follow the Repository → Service → Controller layering documented in CLAUDE.md
- Repository files live in `backend/src/repositories/`; lib files live in `backend/src/lib/`
- No new npm dependencies
- No changes to any public function signatures (callers must compile unchanged)
- Repository unit tests are intentionally skipped per CLAUDE.md; test services/lib through their public API with mocked repositories
- All imports use `.js` extension (ESM project)
- Run `cd backend && npx tsc --noEmit` after every task to validate TypeScript

---

## File Map

| Status | Path | Responsibility |
|--------|------|----------------|
| **CREATE** | `backend/src/repositories/catalog-repository.ts` | All Prisma calls for catalog data (weapons, armors, equipment, pets, classes, translations, classAbilityModifiers). The single seam that isolates the DB from lib/ computation. |
| **MODIFY** | `backend/src/repositories/character-repository.ts` | Add `findFullRow(id)` — the character-table read that `getCharacterFull` currently does inline via Prisma. |
| **MODIFY** | `backend/src/lib/inventory.ts` | Replace two `prisma.*` calls with `catalogRepository.*`. Signature unchanged. |
| **MODIFY** | `backend/src/lib/get-character-full.ts` | Replace 7 `prisma.*` calls with `catalogRepository.*` + `characterRepository.findFullRow`. Signatures unchanged. |
| **MODIFY** | `backend/src/lib/item-search-service.ts` | Replace 5 `prisma.*` calls with `catalogRepository.*`. Signatures unchanged. |
| **MODIFY** | `backend/tests/unit-be/inventory.test.ts` | Swap Prisma mock → `catalogRepository` mock. |
| **MODIFY** | `backend/tests/unit-be/get-character-full.test.ts` | Swap Prisma mock → `catalogRepository` + `characterRepository` mocks. |
| **MODIFY** | `backend/tests/unit-be/item-search-service.test.ts` | Swap Prisma mock → `catalogRepository` mock. |

---

## Task 1: Create catalog-repository.ts

This establishes the seam. Every Prisma call that currently lives in `lib/` moves here. No caller changes yet — tasks 2-4 wire it in.

**Files:**
- Create: `backend/src/repositories/catalog-repository.ts`

**Interfaces:**
- Consumes: `../lib/prisma.js` (the singleton Prisma client)
- Produces (used by Tasks 2–4):
  ```typescript
  catalogRepository.findPetsByKeys(keys: string[]): Promise<PetCatalogRow[]>
  catalogRepository.findEquipmentByKeys(keys: string[]): Promise<EquipCatalogRow[]>
  catalogRepository.findWeaponsByKeys(keys: string[]): Promise<WeaponCatalogRow[]>
  catalogRepository.findArmorsByKeys(keys: string[]): Promise<ArmorCatalogRow[]>
  catalogRepository.findClassById(classId: number): Promise<ClassCatalogRow | null>
  catalogRepository.findTranslations(locale: string, keys: string[]): Promise<TranslationRow[]>
  catalogRepository.findTranslationsMultiLocale(keys: string[], locales: string[]): Promise<MultiLocaleTranslationRow[]>
  catalogRepository.findClassAbilityModifiers(classId: number, abilityKeys: string[]): Promise<ClassAbilityModifierRow[]>
  catalogRepository.findAllItemsForSearch(): Promise<SearchCatalogResult>
  ```

- [ ] **Step 1: Create the file**

`backend/src/repositories/catalog-repository.ts`:

```typescript
import prisma from '../lib/prisma.js';

export type PetCatalogRow = {
  key: string;
  hp: number;
  tags: string[];
  actionDie: number[];
  buff: unknown;
};

export type EquipCatalogRow = {
  key: string;
  tags: string[];
  value: number | null;
  ammoType: string | null;
  defaultAmount: number | null;
};

export type WeaponCatalogRow = {
  key: string;
  dice: number[];
  tags: string[];
  value: number | null;
  ammoType: string | null;
  modifiers: unknown;
};

export type ArmorCatalogRow = {
  key: string;
  dice: number[];
  tags: string[];
  value: number | null;
  maxTier: number | null;
  modifiers: unknown;
};

export type ClassCatalogRow = {
  id: number;
  name: string;
  appendix: string | null;
  nameKey: string | null;
  descriptionKey: string | null;
};

export type TranslationRow = {
  key: string;
  value: string;
};

export type MultiLocaleTranslationRow = {
  locale: string;
  key: string;
  value: string;
};

export type ClassAbilityModifierRow = {
  classId: number;
  abilityKey: string;
  value: number;
  source: string;
  statistic: string;
  exclude: unknown;
};

export type SearchCatalogResult = {
  weapons: Array<{ id: number; key: string; tags: string[] }>;
  armors: Array<{ id: number; key: string; tags: string[] }>;
  equipment: Array<{ id: number; key: string; tags: string[] }>;
  pets: Array<{ id: number; key: string; tags: string[] }>;
};

export const catalogRepository = {
  findPetsByKeys(keys: string[]): Promise<PetCatalogRow[]> {
    if (keys.length === 0) return Promise.resolve([]);
    return prisma.pet.findMany({
      where: { key: { in: keys } },
      select: { key: true, hp: true, tags: true, actionDie: true, buff: true },
    }) as Promise<PetCatalogRow[]>;
  },

  findEquipmentByKeys(keys: string[]): Promise<EquipCatalogRow[]> {
    if (keys.length === 0) return Promise.resolve([]);
    return prisma.equipment.findMany({
      where: { key: { in: keys } },
      select: { key: true, tags: true, value: true, ammoType: true, defaultAmount: true },
    }) as Promise<EquipCatalogRow[]>;
  },

  findWeaponsByKeys(keys: string[]): Promise<WeaponCatalogRow[]> {
    if (keys.length === 0) return Promise.resolve([]);
    return prisma.weapon.findMany({
      where: { key: { in: keys } },
      select: { key: true, dice: true, tags: true, value: true, ammoType: true, modifiers: true },
    }) as Promise<WeaponCatalogRow[]>;
  },

  findArmorsByKeys(keys: string[]): Promise<ArmorCatalogRow[]> {
    if (keys.length === 0) return Promise.resolve([]);
    return prisma.armor.findMany({
      where: { key: { in: keys } },
      select: { key: true, dice: true, tags: true, value: true, maxTier: true, modifiers: true },
    }) as Promise<ArmorCatalogRow[]>;
  },

  findClassById(classId: number): Promise<ClassCatalogRow | null> {
    return prisma.class.findUnique({
      where: { id: classId },
      select: { id: true, name: true, appendix: true, nameKey: true, descriptionKey: true },
    }) as Promise<ClassCatalogRow | null>;
  },

  findTranslations(locale: string, keys: string[]): Promise<TranslationRow[]> {
    if (keys.length === 0) return Promise.resolve([]);
    return prisma.translation.findMany({
      where: { locale, key: { in: keys } },
      select: { key: true, value: true },
    });
  },

  findTranslationsMultiLocale(keys: string[], locales: string[]): Promise<MultiLocaleTranslationRow[]> {
    if (keys.length === 0) return Promise.resolve([]);
    return prisma.translation.findMany({
      where: { key: { in: keys }, locale: { in: locales } },
      select: { locale: true, key: true, value: true },
    });
  },

  findClassAbilityModifiers(classId: number, abilityKeys: string[]): Promise<ClassAbilityModifierRow[]> {
    if (abilityKeys.length === 0) return Promise.resolve([]);
    return prisma.classAbilityModifier.findMany({
      where: { classId, abilityKey: { in: abilityKeys } },
    }) as Promise<ClassAbilityModifierRow[]>;
  },

  async findAllItemsForSearch(): Promise<SearchCatalogResult> {
    const [weapons, armors, equipment, pets] = await Promise.all([
      prisma.weapon.findMany({ select: { id: true, key: true, tags: true } }),
      prisma.armor.findMany({ select: { id: true, key: true, tags: true } }),
      prisma.equipment.findMany({ select: { id: true, key: true, tags: true } }),
      prisma.pet.findMany({ select: { id: true, key: true, tags: true } }),
    ]);
    return { weapons, armors, equipment, pets };
  },
};
```

- [ ] **Step 2: Validate TypeScript**

Run: `cd backend && npx tsc --noEmit`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add backend/src/repositories/catalog-repository.ts
git commit -m "feat(repositories): add catalog-repository as seam for catalog Prisma reads"
```

---

## Task 2: Fix inventory.ts

Replace two direct Prisma calls with `catalogRepository`. Test mock flips from Prisma to repository.

**Files:**
- Modify: `backend/src/lib/inventory.ts`
- Modify: `backend/tests/unit-be/inventory.test.ts`

**Interfaces:**
- Consumes from Task 1: `catalogRepository.findPetsByKeys`, `catalogRepository.findEquipmentByKeys`
- Produces: `hydrateInventoryUses` signature unchanged — callers (character-service, generate-character) require no change

- [ ] **Step 1: Update inventory.ts**

Replace the `import prisma` line and the two `prisma.*` calls:

```typescript
/**
 * Inventory hydration — shared between the PATCH route (write time) and
 * the TypeScript character generator (Phase 5).
 *
 * Mirrors the PL/pgSQL hydrate_inventory_uses + resolve_item_default_uses
 * functions from inventory_management.sql.
 */
import { catalogRepository } from '../repositories/catalog-repository.js';
import { rollToModifier } from '../utils.js';
import type { Roller } from '@tackgnol/rpg-tools-roller';

type InventoryItem = Record<string, unknown>;

/**
 * Walk an inventory array and fill in a default `uses` array for items that
 * don't already have one.  Items with a non-empty `uses` array are left alone.
 */
export async function hydrateInventoryUses(
  items: unknown[],
  presence: number,
  scrollDefault: boolean,
  roller: Roller,
): Promise<unknown[]> {
  const keys = items
    .filter((item): item is InventoryItem => item !== null && typeof item === 'object')
    .map((item) => item['key'])
    .filter((key): key is string => typeof key === 'string' && key.length > 0);

  const uniqueKeys = [...new Set(keys)];

  const [petRows, equipmentRows] = await Promise.all([
    catalogRepository.findPetsByKeys(uniqueKeys),
    catalogRepository.findEquipmentByKeys(uniqueKeys),
  ]);

  const petMap = new Map(petRows.map((p) => [p.key, p]));
  const equipMap = new Map(equipmentRows.map((e) => [e.key, e]));

  return Promise.all(
    items.map(async (item) => {
      if (item === null || typeof item !== 'object') return item;
      const obj = item as InventoryItem;
      const key = typeof obj['key'] === 'string' ? obj['key'] : null;

      const existingUses = obj['uses'];
      if (Array.isArray(existingUses) && existingUses.length > 0) return item;

      if (!key) return item;

      const pet = petMap.get(key);
      if (pet && pet.hp > 0) {
        return { ...obj, uses: Array(Math.min(pet.hp, 50)).fill(true) };
      }

      if (scrollDefault && key.startsWith('scroll.')) {
        return { ...obj, uses: [false, false, false, false] };
      }

      if (key === 'equipment.violet-poison') {
        const roll = (await roller.roll('1d4')).total;
        return { ...obj, uses: Array(roll + 1).fill(false) };
      }

      const equip = equipMap.get(key);
      if (equip && equip.tags.includes('consumable') && (equip.defaultAmount ?? 0) > 0) {
        const base = equip.defaultAmount!;
        const modifier =
          key === 'equipment.lantern-oil' || key === 'equipment.medicine-chest'
            ? rollToModifier(presence)
            : 0;
        const count = Math.max(0, base + modifier);
        return { ...obj, uses: Array(count).fill(false) };
      }

      return item;
    }),
  );
}
```

- [ ] **Step 2: Update inventory.test.ts**

Replace the `prismaMock` and its `mock.module` call. The rest of the test (assertions, fixtures) is unchanged.

Find this block in `backend/tests/unit-be/inventory.test.ts`:

```typescript
const prismaMock = {
  pet: {
    findMany: async (args: { where?: { key?: { in?: string[] } } }) =>
      filterByKeys(petRows, args),
  },
  equipment: {
    findMany: async (args: { where?: { key?: { in?: string[] } } }) =>
      filterByKeys(equipmentRows, args),
  },
};

mock.module('../../src/lib/prisma.js', {
  defaultExport: prismaMock,
});

const { hydrateInventoryUses } = await import('../../src/lib/inventory.js');
```

Replace it with:

```typescript
const catalogRepositoryMock = {
  findPetsByKeys: async (keys: string[]) => filterByKeys(petRows, { where: { key: { in: keys } } }),
  findEquipmentByKeys: async (keys: string[]) => filterByKeys(equipmentRows, { where: { key: { in: keys } } }),
};

mock.module('../../src/repositories/catalog-repository.js', {
  namedExports: { catalogRepository: catalogRepositoryMock },
});

const { hydrateInventoryUses } = await import('../../src/lib/inventory.js');
```

- [ ] **Step 3: Run unit tests**

Run: `cd backend && npm test`
Expected: all unit tests pass, including the two `hydrateInventoryUses` tests

- [ ] **Step 4: Validate TypeScript**

Run: `cd backend && npx tsc --noEmit`
Expected: no errors

- [ ] **Step 5: Commit**

```bash
git add backend/src/lib/inventory.ts backend/tests/unit-be/inventory.test.ts
git commit -m "refactor(lib): inventory.ts reads catalog via repository, not Prisma directly"
```

---

## Task 3: Fix get-character-full.ts

Replace all 7 Prisma calls (5 catalog + 1 character + 1 class ability modifier + 1 modifier source translation). The character-table read (`prisma.character.findUnique`) moves to `character-repository.ts` as `findFullRow`.

**Files:**
- Modify: `backend/src/repositories/character-repository.ts`
- Modify: `backend/src/lib/get-character-full.ts`
- Modify: `backend/tests/unit-be/get-character-full.test.ts`

**Interfaces:**
- Consumes from Task 1: all `catalogRepository.*` methods
- Produces: `getCharacterFull(id, locale)` and `hydrateCharacterRow(row, locale)` signatures unchanged

- [ ] **Step 1: Add findFullRow to character-repository.ts**

Open `backend/src/repositories/character-repository.ts`. Find the end of the `characterRepository` object (before the closing `};`). Add this method:

```typescript
  findFullRow(id: string) {
    return prisma.character.findUnique({ where: { id } });
  },
```

- [ ] **Step 2: Update get-character-full.ts imports**

Replace the top import lines:

```typescript
import prisma from './prisma.js';
import { snakeToCamel, rollToModifier } from '../utils.js';
```

With:

```typescript
import { catalogRepository } from '../repositories/catalog-repository.js';
import { characterRepository } from '../repositories/character-repository.js';
import { snakeToCamel, rollToModifier } from '../utils.js';
```

- [ ] **Step 3: Update getCharacterFull to use characterRepository**

Find this function near the bottom of `get-character-full.ts`:

```typescript
export async function getCharacterFull(
  id: string,
  locale: string,
): Promise<Record<string, unknown> | null> {
  // 1. Fetch character row
  const row = await prisma.character.findUnique({ where: { id } });
  if (!row) return null;
  return hydrateCharacterRow(row as unknown as CharacterRowLike, locale);
}
```

Replace with:

```typescript
export async function getCharacterFull(
  id: string,
  locale: string,
): Promise<Record<string, unknown> | null> {
  // 1. Fetch character row
  const row = await characterRepository.findFullRow(id);
  if (!row) return null;
  return hydrateCharacterRow(row as unknown as CharacterRowLike, locale);
}
```

- [ ] **Step 4: Replace the 5-parallel catalog fetch in hydrateCharacterRow**

Inside `hydrateCharacterRow`, find the comment `// 4. Bulk fetch catalog entries + class in parallel` and the `Promise.all` block:

```typescript
  // 4. Bulk fetch catalog entries + class in parallel
  const [weapons, armors, equips, pets, cls] = await Promise.all([
    allItemKeys.length > 0
      ? prisma.weapon.findMany({ where: { key: { in: allItemKeys } } })
      : Promise.resolve([]),
    allItemKeys.length > 0
      ? prisma.armor.findMany({ where: { key: { in: allItemKeys } } })
      : Promise.resolve([]),
    allItemKeys.length > 0
      ? prisma.equipment.findMany({ where: { key: { in: allItemKeys } } })
      : Promise.resolve([]),
    allItemKeys.length > 0
      ? prisma.pet.findMany({ where: { key: { in: allItemKeys } } })
      : Promise.resolve([]),
    row.classId !== null
      ? prisma.class.findUnique({ where: { id: row.classId } })
      : Promise.resolve(null),
  ]);
```

Replace with:

```typescript
  // 4. Bulk fetch catalog entries + class in parallel
  const [weapons, armors, equips, pets, cls] = await Promise.all([
    catalogRepository.findWeaponsByKeys(allItemKeys),
    catalogRepository.findArmorsByKeys(allItemKeys),
    catalogRepository.findEquipmentByKeys(allItemKeys),
    catalogRepository.findPetsByKeys(allItemKeys),
    row.classId !== null
      ? catalogRepository.findClassById(row.classId)
      : Promise.resolve(null),
  ]);
```

- [ ] **Step 5: Replace the translation bulk fetch in hydrateCharacterRow**

Find the comment `// 5. Collect all translation keys for a single bulk fetch` and the `prisma.translation.findMany` call:

```typescript
  const translationRows = transKeys.length > 0
    ? await prisma.translation.findMany({
        where: { locale, key: { in: transKeys } },
        select: { key: true, value: true },
      })
    : [];
```

Replace with:

```typescript
  const translationRows = await catalogRepository.findTranslations(locale, transKeys);
```

- [ ] **Step 6: Replace the two Prisma calls inside resolveComputedModifiers**

Find the two `prisma.*` calls inside `resolveComputedModifiers` (around lines 513 and 575 of the original file):

**Call 1** — class ability modifiers (inside `if (classId !== null)`):

```typescript
      const cams = await prisma.classAbilityModifier.findMany({
        where: { classId, abilityKey: { in: abilityKeys } },
      });
```

Replace with:

```typescript
      const cams = await catalogRepository.findClassAbilityModifiers(classId, abilityKeys);
```

**Call 2** — modifier source translations (inside `resolveComputedModifiers`, after `const missingSourceKeys`):

```typescript
  const sourceTranslations =
    missingSourceKeys.length > 0
      ? await prisma.translation.findMany({
          where: { locale, key: { in: missingSourceKeys } },
          select: { key: true, value: true },
        })
      : [];
```

Replace with:

```typescript
  const sourceTranslations = await catalogRepository.findTranslations(locale, missingSourceKeys);
```

- [ ] **Step 7: Update get-character-full.test.ts**

The test currently mocks `../../src/lib/prisma.js` with a `prismaMock` that covers 7 models. Replace the mock block entirely.

Find:

```typescript
const prismaMock = {
  character: {
    findUnique: async ({ where }: { where: { id: string } }) =>
      fixture.characters.find((row) => row.id === where.id) ?? null,
  },
  weapon: {
    findMany: async (args: { where?: { key?: { in?: string[] } } } = {}) =>
      filterByKey(fixture.weapons, args),
  },
  armor: {
    findMany: async (args: { where?: { key?: { in?: string[] } } } = {}) =>
      filterByKey(fixture.armors, args),
  },
  equipment: {
    findMany: async (args: { where?: { key?: { in?: string[] } } } = {}) =>
      filterByKey(fixture.equipment, args),
  },
  pet: {
    findMany: async (args: { where?: { key?: { in?: string[] } } } = {}) =>
      filterByKey(fixture.pets, args),
  },
  class: {
    findUnique: async ({ where }: { where: { id: number } }) =>
      fixture.classes.find((row) => row.id === where.id) ?? null,
  },
  translation: {
    findMany: async ({ where }: { where: { locale: string; key: { in: string[] } } }) =>
      fixture.translations.filter((row) =>
        row.locale === where.locale && where.key.in.includes(row.key)
      ),
  },
  classAbilityModifier: {
    findMany: async ({
      where,
    }: {
      where: { classId: number; abilityKey: { in: string[] } };
    }) =>
      fixture.classAbilityModifiers.filter((row) =>
        row.classId === where.classId && where.abilityKey.in.includes(row.abilityKey)
      ),
  },
};

mock.module('../../src/lib/prisma.js', {
  defaultExport: prismaMock,
});

const { getCharacterFull } = await import('../../src/lib/get-character-full.js');
```

Replace with:

```typescript
const characterRepositoryMock = {
  findFullRow: async (id: string) =>
    fixture.characters.find((row) => row.id === id) ?? null,
};

const catalogRepositoryMock = {
  findWeaponsByKeys: async (keys: string[]) => filterByKey(fixture.weapons, { where: { key: { in: keys } } }),
  findArmorsByKeys: async (keys: string[]) => filterByKey(fixture.armors, { where: { key: { in: keys } } }),
  findEquipmentByKeys: async (keys: string[]) => filterByKey(fixture.equipment, { where: { key: { in: keys } } }),
  findPetsByKeys: async (keys: string[]) => filterByKey(fixture.pets, { where: { key: { in: keys } } }),
  findClassById: async (id: number) =>
    fixture.classes.find((row) => row.id === id) ?? null,
  findTranslations: async (locale: string, keys: string[]) =>
    fixture.translations.filter((row) => row.locale === locale && keys.includes(row.key)),
  findClassAbilityModifiers: async (classId: number, abilityKeys: string[]) =>
    fixture.classAbilityModifiers.filter(
      (row) => row.classId === classId && abilityKeys.includes(row.abilityKey)
    ),
};

mock.module('../../src/repositories/character-repository.js', {
  namedExports: { characterRepository: characterRepositoryMock },
});

mock.module('../../src/repositories/catalog-repository.js', {
  namedExports: { catalogRepository: catalogRepositoryMock },
});

const { getCharacterFull } = await import('../../src/lib/get-character-full.js');
```

- [ ] **Step 8: Run unit tests**

Run: `cd backend && npm test`
Expected: all tests pass including all `getCharacterFull` tests

- [ ] **Step 9: Validate TypeScript**

Run: `cd backend && npx tsc --noEmit`
Expected: no errors

- [ ] **Step 10: Commit**

```bash
git add backend/src/repositories/character-repository.ts \
        backend/src/lib/get-character-full.ts \
        backend/tests/unit-be/get-character-full.test.ts
git commit -m "refactor(lib): get-character-full reads catalog and character via repositories"
```

---

## Task 4: Fix item-search-service.ts

Replace 5 Prisma calls with two catalog-repository methods (`findAllItemsForSearch` + `findTranslationsMultiLocale`).

**Files:**
- Modify: `backend/src/lib/item-search-service.ts`
- Modify: `backend/tests/unit-be/item-search-service.test.ts`

**Interfaces:**
- Consumes from Task 1: `catalogRepository.findAllItemsForSearch`, `catalogRepository.findTranslationsMultiLocale`
- Produces: `searchItems` and `clearItemSearchCache` signatures unchanged

- [ ] **Step 1: Update item-search-service.ts**

Replace the full file content. The only change is swapping the `import prisma` and the `loadItemSearchDocuments` function body:

```typescript
import { catalogRepository } from '../repositories/catalog-repository.js';
import {
  buildItemSearchDocuments,
  createItemSearchIndex,
  searchItemIndex,
  type ItemSearchCatalogRow,
  type ItemSearchDocument,
  type ItemSearchResult,
} from './item-search.js';

const SEARCH_INDEX_TTL_MS = 5 * 60 * 1000;

type ItemSearchCache = {
  index: ReturnType<typeof createItemSearchIndex>;
  expiresAt: number;
};

let cachedSearch: ItemSearchCache | null = null;
let pendingSearchBuild: Promise<ItemSearchCache> | null = null;

async function loadItemSearchDocuments(): Promise<ItemSearchDocument[]> {
  const { weapons, armors, equipment, pets } = await catalogRepository.findAllItemsForSearch();

  const catalogRows: ItemSearchCatalogRow[] = [
    ...weapons.map((item) => ({ itemType: 'weapon' as const, ...item })),
    ...armors.map((item) => ({ itemType: 'armor' as const, ...item })),
    ...equipment.map((item) => ({ itemType: 'equipment' as const, ...item })),
    ...pets.map((item) => ({ itemType: 'pet' as const, ...item })),
  ];

  const keys = catalogRows.map((item) => item.key);
  const translations = await catalogRepository.findTranslationsMultiLocale(keys, ['en', 'pl']);

  return buildItemSearchDocuments(catalogRows, translations);
}

async function buildItemSearchCache(): Promise<ItemSearchCache> {
  const documents = await loadItemSearchDocuments();

  return {
    index: createItemSearchIndex(documents),
    expiresAt: Date.now() + SEARCH_INDEX_TTL_MS,
  };
}

async function getItemSearchCache(): Promise<ItemSearchCache> {
  if (cachedSearch && cachedSearch.expiresAt > Date.now()) {
    return cachedSearch;
  }

  if (!pendingSearchBuild) {
    pendingSearchBuild = buildItemSearchCache()
      .then((nextCache) => {
        cachedSearch = nextCache;
        return nextCache;
      })
      .finally(() => {
        pendingSearchBuild = null;
      });
  }

  return pendingSearchBuild;
}

export async function searchItems(
  query: string,
  locale: unknown,
  limit: number,
): Promise<ItemSearchResult[]> {
  const cache = await getItemSearchCache();
  return searchItemIndex(cache.index, query, locale, limit);
}

export function clearItemSearchCache(): void {
  cachedSearch = null;
  pendingSearchBuild = null;
}
```

- [ ] **Step 2: Update item-search-service.test.ts**

Find the `prismaMock` block and `mock.module` call:

```typescript
const prismaMock = {
  weapon: {
    findMany: catalogFindMany('weapon'),
  },
  armor: {
    findMany: catalogFindMany('armor'),
  },
  equipment: {
    findMany: catalogFindMany('equipment'),
  },
  pet: {
    findMany: catalogFindMany('pet'),
  },
  translation: {
    findMany: async ({
      where,
    }: {
      where: { key: { in: string[] }; locale: { in: string[] } };
    }) => {
      calls.translation++;
      return translations.filter((row) =>
        where.key.in.includes(row.key) && where.locale.in.includes(row.locale)
      );
    },
  },
};

mock.module('../../src/lib/prisma.js', {
  defaultExport: prismaMock,
});

const { clearItemSearchCache, searchItems } = await import('../../src/lib/item-search-service.js');
```

Replace with:

```typescript
const catalogRepositoryMock = {
  findAllItemsForSearch: async () => {
    calls.weapon++;
    calls.armor++;
    calls.equipment++;
    calls.pet++;
    return {
      weapons: catalogs.weapon,
      armors: catalogs.armor,
      equipment: catalogs.equipment,
      pets: catalogs.pet,
    };
  },
  findTranslationsMultiLocale: async (keys: string[], locales: string[]) => {
    calls.translation++;
    return translations.filter(
      (row) => keys.includes(row.key) && locales.includes(row.locale)
    );
  },
};

mock.module('../../src/repositories/catalog-repository.js', {
  namedExports: { catalogRepository: catalogRepositoryMock },
});

const { clearItemSearchCache, searchItems } = await import('../../src/lib/item-search-service.js');
```

- [ ] **Step 3: Run unit tests**

Run: `cd backend && npm test`
Expected: all tests pass including the `searchItems` cache tests

- [ ] **Step 4: Validate TypeScript**

Run: `cd backend && npx tsc --noEmit`
Expected: no errors

- [ ] **Step 5: Confirm no Prisma imports remain in lib/**

Run: `grep -r "from './prisma.js'" backend/src/lib/`
Expected: no output (only `lib/prisma.ts` should define the client, not import it for calls)

- [ ] **Step 6: Commit**

```bash
git add backend/src/lib/item-search-service.ts backend/tests/unit-be/item-search-service.test.ts
git commit -m "refactor(lib): item-search-service reads catalog via repository, not Prisma directly"
```

---

## Self-Review

**Spec coverage:**
- ✅ All Prisma calls in `lib/inventory.ts` moved to `catalogRepository` (Task 2)
- ✅ All Prisma calls in `lib/get-character-full.ts` moved to `catalogRepository` + `characterRepository.findFullRow` (Task 3)
- ✅ All Prisma calls in `lib/item-search-service.ts` moved to `catalogRepository` (Task 4)
- ✅ No public signatures changed — zero caller impact
- ✅ Tests updated to mock repository instead of Prisma

**Placeholder scan:** No placeholders. Every step has complete code.

**Type consistency:**
- `catalogRepository.findTranslations` used in Tasks 2–3 returns `TranslationRow[]` (defined in Task 1)
- `catalogRepository.findTranslationsMultiLocale` used in Task 4 returns `MultiLocaleTranslationRow[]` (defined in Task 1)
- `characterRepository.findFullRow` returns a `Prisma.Character | null` (satisfies `CharacterRowLike`)
- `catalogRepositoryMock` in tests matches the interface defined by Task 1

**Missed edge case — modifier source translation test coverage:** The `resolveComputedModifiers` function does a second `findTranslations` call for modifier source keys not in the primary translation map. The existing test fixture in `get-character-full.test.ts` includes modifier sources (`'Hawk eyes'`, `'Heavy mail'`, etc.) in `fixture.translations`, which means `missingSourceKeys` will often be empty and the second call skipped. The mock handles both empty and non-empty keys correctly since `findTranslations` accepts an empty array. No gap here.
