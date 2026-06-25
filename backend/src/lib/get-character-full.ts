/**
 * TypeScript port of the get_character_full PL/pgSQL function.
 * Phase 4 of the Prisma migration — replaces the raw SQL call in character routes.
 *
 * Mirrors the SQL logic exactly:
 *   - resolve_character_inventory_items   → resolveInventoryItem (per item)
 *   - resolve_character_equipped_weapons  → resolveEquippedWeapon (per item)
 *   - resolve_character_equipped_armor    → resolveEquippedArmor
 *   - resolve_character_abilities         → resolveAbilities
 *   - calculate_character_encumbrance     → calculateEncumbrance
 *   - resolve_character_computed_modifiers → resolveComputedModifiers
 *   - calculate_character_dr              → calculateDR
 *
 * Output is camelCase — callers must NOT apply camelCaseJsonbFields.
 */
import { catalogRepository } from '../repositories/catalog-repository.js';
import { characterRepository } from '../repositories/character-repository.js';
import { snakeToCamel, rollToModifier } from '../utils.js';

// ── Internal types ─────────────────────────────────────────────────────────────

type Item = Record<string, unknown>;
type TranslationMap = Map<string, string>;

interface WeaponCatalog {
  key: string;
  dice: number[];
  tags: string[];
  value: number | null;
  ammoType: string | null;
  modifiers: unknown;
}

interface ArmorCatalog {
  key: string;
  dice: number[];
  tags: string[];
  value: number | null;
  maxTier: number | null;
  modifiers: unknown;
}

interface EquipCatalog {
  key: string;
  tags: string[];
  value: number | null;
  ammoType: string | null;
}

interface PetCatalog {
  key: string;
  tags: string[];
  actionDie: number[];
  buff: unknown;
}

interface ComputedModifier {
  value: number;
  source: string;
  statistic: string;
  exclude?: string[];
  origin: 'armor' | 'weapon' | 'pet' | 'system';
  originKey: string;
  originName: string;
}

// ── Low-level helpers ──────────────────────────────────────────────────────────

/** Shallow snake_case → camelCase key normalization for stored JSONB items. */
function normalizeItemKeys(item: unknown): Item {
  if (item === null || typeof item !== 'object' || Array.isArray(item)) return {};
  return Object.fromEntries(
    Object.entries(item as Record<string, unknown>).map(([k, v]) => [snakeToCamel(k), v])
  );
}

function asItems(json: unknown): Item[] {
  if (!Array.isArray(json)) return [];
  return json.map(normalizeItemKeys);
}

function asItem(json: unknown): Item | null {
  if (json === null || json === undefined) return null;
  if (typeof json !== 'object' || Array.isArray(json)) return null;
  return normalizeItemKeys(json as Record<string, unknown>);
}

function translate(translations: TranslationMap, key: string | null | undefined): string | null {
  return key ? (translations.get(key) ?? null) : null;
}

// Computed-modifier effect sources are inline English in the catalog
// (`modifiers` JSONB / class_ability_modifiers.source). They're translated via a
// `modifier.source.<slug>` key; this slug MUST match the one used to generate the
// translation rows (see init/05-seed/011_modifier_source_translations.sql).
function modifierSourceSlug(source: string): string {
  return source
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function modifierSourceTranslationKey(source: string): string {
  return `modifier.source.${modifierSourceSlug(source)}`;
}

function safeInt(val: unknown): number | null {
  if (typeof val === 'number' && Number.isFinite(val)) return Math.floor(val);
  if (typeof val === 'string' && /^\d+$/.test(val)) return parseInt(val, 10);
  return null;
}

/**
 * Merge two arrays, deduplicate, and sort alphabetically.
 * Mirrors PostgreSQL's jsonb_agg(DISTINCT x) which produces sorted output.
 */
function mergeUniqueStrings(a: string[], b: string[]): string[] {
  return [...new Set([...a, ...b])].sort();
}

function mergeUniqueInts(a: number[], b: number[]): number[] {
  return [...new Set([...a, ...b])].sort((x, y) => x - y);
}

function safeIntArray(val: unknown): number[] {
  if (!Array.isArray(val)) return [];
  return val.filter((d): d is number => typeof d === 'number' && Number.isInteger(d));
}

// ── Item resolution (mirrors resolve_character_inventory_items) ───────────────

function resolveInventoryItem(
  item: Item,
  weaponMap: Map<string, WeaponCatalog>,
  armorMap: Map<string, ArmorCatalog>,
  equipMap: Map<string, EquipCatalog>,
  petMap: Map<string, PetCatalog>,
  translations: TranslationMap,
): Record<string, unknown> {
  const key = typeof item.key === 'string' && item.key ? item.key : null;
  const weapon = key ? weaponMap.get(key) ?? null : null;
  const armor  = key ? armorMap.get(key)  ?? null : null;
  const equip  = key ? equipMap.get(key)  ?? null : null;
  const pet    = key ? petMap.get(key)    ?? null : null;

  const name =
    (key ? translate(translations, key) : null) ??
    (typeof item.name === 'string' ? item.name : null) ??
    key ??
    null;

  const description =
    (key ? translate(translations, `${key}.description`) : null) ??
    (typeof item.description === 'string' ? item.description : null) ??
    '';

  // Value: stored numeric preferred; catalog fallback (pets excluded per SQL)
  const catalogValue = weapon?.value ?? armor?.value ?? equip?.value ?? null;
  const resolvedValue = safeInt(item.value) ?? catalogValue;

  // Tags: union of stored + all catalog tables (SQL UNION ALL + DISTINCT + sorted)
  const storedTags = Array.isArray(item.tags) ? (item.tags as string[]) : [];
  const resolvedTags = mergeUniqueStrings(storedTags, [
    ...(weapon?.tags ?? []),
    ...(armor?.tags ?? []),
    ...(equip?.tags ?? []),
    ...(pet?.tags ?? []),
  ]);

  // Dice: stored + weapon + armor + pet.action_die (SQL UNION ALL + DISTINCT + sorted; no equip.dice)
  const storedDice = safeIntArray(item.dice);
  const resolvedDice = mergeUniqueInts(storedDice, [
    ...(weapon?.dice ?? []),
    ...(armor?.dice ?? []),
    ...(pet?.actionDie ?? []),
  ]);

  // Uses: passthrough (hydration happens at write time)
  const uses = Array.isArray(item.uses) ? item.uses : [];

  // ammoType: catalog preferred, then stored
  const ammoType =
    weapon?.ammoType ??
    equip?.ammoType ??
    (typeof item.ammoType === 'string' ? item.ammoType : null);

  // amount: only emitted when item has ammo_type AND a stored integer amount
  const storedAmount = safeInt(item.amount);
  const amount = ammoType !== null && storedAmount !== null ? storedAmount : null;

  // useCountRule: passthrough if it's an object
  const useCountRule =
    typeof item.useCountRule === 'object' &&
    item.useCountRule !== null &&
    !Array.isArray(item.useCountRule)
      ? item.useCountRule
      : null;

  // modifiers: passthrough
  const modifiers = Array.isArray(item.modifiers) ? item.modifiers : [];

  // Armor tier: added when catalog match OR stored tags include 'armor'
  const isArmorItem = armor !== null || storedTags.includes('armor');

  const result: Record<string, unknown> = {
    ...(key !== null && { key }),
    ...(name !== null && { name }),
    description,
    ...(typeof item.comments === 'string' && { comments: item.comments }),
    ...(typeof item.source === 'string' && { source: item.source }),
    ...(typeof item.category === 'string' && { category: item.category }),
    ...(resolvedValue !== null && { value: resolvedValue }),
    tags: resolvedTags,
    dice: resolvedDice,
    uses,
    ...(ammoType !== null && { ammoType }),
    ...(amount !== null && { amount }),
    ...(useCountRule !== null && { useCountRule }),
    modifiers,
  };

  if (isArmorItem) {
    const catalogMaxTier = armor?.maxTier ?? 0;
    const storedMaxTier    = safeInt(item.maxTier);
    const storedCurrentTier = safeInt(item.currentTier);
    result.maxTier    = storedMaxTier    ?? catalogMaxTier;
    result.currentTier = storedCurrentTier ?? storedMaxTier ?? catalogMaxTier;
  }

  return result;
}

// ── Equipped weapon resolution (mirrors resolve_character_equipped_weapons) ───

function resolveEquippedWeapon(
  item: Item,
  weaponMap: Map<string, WeaponCatalog>,
  translations: TranslationMap,
): Record<string, unknown> {
  const key = typeof item.key === 'string' && item.key ? item.key : null;
  const weapon = key ? weaponMap.get(key) ?? null : null;

  const name =
    (key ? translate(translations, key) : null) ??
    (typeof item.name === 'string' ? item.name : null) ??
    key ?? null;

  const description =
    (key ? translate(translations, `${key}.description`) : null) ??
    (typeof item.description === 'string' ? item.description : null) ??
    '';

  const storedTags = Array.isArray(item.tags) ? (item.tags as string[]) : [];
  const resolvedTags = mergeUniqueStrings(storedTags, weapon?.tags ?? []);

  const storedDice = safeIntArray(item.dice);
  const resolvedDice = mergeUniqueInts(storedDice, weapon?.dice ?? []);

  const resolvedValue = safeInt(item.value) ?? weapon?.value ?? null;

  const ammoType =
    weapon?.ammoType ??
    (typeof item.ammoType === 'string' ? item.ammoType : null);

  const modifiers = Array.isArray(item.modifiers) ? item.modifiers : [];

  return {
    ...(key !== null && { key }),
    ...(name !== null && { name }),
    description,
    ...(typeof item.comments === 'string' && { comments: item.comments }),
    ...(typeof item.source === 'string' && { source: item.source }),
    ...(typeof item.category === 'string' && { category: item.category }),
    ...(resolvedValue !== null && { value: resolvedValue }),
    dice: resolvedDice,
    tags: resolvedTags,
    ...(ammoType !== null && { ammoType }),
    modifiers,
  };
}

// ── Equipped armor resolution (mirrors resolve_character_equipped_armor) ──────

function resolveEquippedArmor(
  item: Item,
  armorMap: Map<string, ArmorCatalog>,
  translations: TranslationMap,
): Record<string, unknown> {
  const key = typeof item.key === 'string' && item.key ? item.key : null;
  const armor = key ? armorMap.get(key) ?? null : null;

  const name =
    (key ? translate(translations, key) : null) ??
    (typeof item.name === 'string' ? item.name : null) ??
    key ?? null;

  const description =
    (key ? translate(translations, `${key}.description`) : null) ??
    (typeof item.description === 'string' ? item.description : null) ??
    '';

  const storedTags = Array.isArray(item.tags) ? (item.tags as string[]) : [];
  const resolvedTags = mergeUniqueStrings(storedTags, armor?.tags ?? []);

  const storedDice = safeIntArray(item.dice);
  const resolvedDice = mergeUniqueInts(storedDice, armor?.dice ?? []);

  const resolvedValue = safeInt(item.value) ?? armor?.value ?? null;

  const catalogMaxTier    = armor?.maxTier ?? 0;
  const storedMaxTier     = safeInt(item.maxTier);
  const storedCurrentTier = safeInt(item.currentTier);
  const resolvedMaxTier    = storedMaxTier ?? catalogMaxTier;
  const resolvedCurrentTier = storedCurrentTier ?? storedMaxTier ?? catalogMaxTier;

  const modifiers = Array.isArray(item.modifiers) ? item.modifiers : [];

  return {
    ...(key !== null && { key }),
    ...(name !== null && { name }),
    description,
    ...(typeof item.comments === 'string' && { comments: item.comments }),
    ...(typeof item.source === 'string' && { source: item.source }),
    ...(typeof item.category === 'string' && { category: item.category }),
    ...(resolvedValue !== null && { value: resolvedValue }),
    dice: resolvedDice,
    maxTier:    resolvedMaxTier,
    currentTier: resolvedCurrentTier,
    tags: resolvedTags,
    modifiers,
  };
}

// ── Ability resolution (mirrors resolve_character_abilities) ──────────────────

function resolveAbilities(abilities: Item[], translations: TranslationMap): Record<string, unknown>[] {
  return abilities.map(ab => {
    const key = typeof ab.key === 'string' ? ab.key : null;
    if (!key) return { ...ab };

    const name = translate(translations, key) ?? key;
    const description = translate(translations, `${key}.description`) ?? '';
    const result: Record<string, unknown> = { key, name, description };
    if (typeof ab.comment === 'string') result.comment = ab.comment;
    return result;
  });
}

// ── Encumbrance ──────────────────────────────────────────────────────────────
// Single source of truth for the encumbrance count, ported from the frontend's
// `isEncumbranceExemptItem` (useEquipmentSections.ts) so the over-capacity
// modifier and the displayed "X / Y" agree. The old tag-only exemption missed
// ammo-typed and arrows/bolts/pet items the UI already filtered out, which made
// the modifier appear (e.g. torches) when the sheet showed under capacity.
// Runs on the *resolved* items so catalog tags + ammoType are already merged in.

const AMMO_ITEM_KEYS = new Set(['equipment.arrows', 'equipment.bolts']);

function resolvedTags(item: Record<string, unknown>): string[] {
  return Array.isArray(item.tags) ? (item.tags as string[]) : [];
}

function resolvedKey(item: Record<string, unknown>): string {
  return typeof item.key === 'string' ? item.key : '';
}

function isCarriedResolvedItem(item: Record<string, unknown> | null): boolean {
  if (!item) return false;
  const name = typeof item.name === 'string' ? item.name : '';
  return Boolean(resolvedKey(item) || name);
}

function isAmmoResolvedItem(item: Record<string, unknown>): boolean {
  const tags = resolvedTags(item);
  const key = resolvedKey(item);
  return tags.includes('ammo') || Boolean(item.ammoType) || AMMO_ITEM_KEYS.has(key);
}

function isEncumbranceExemptResolvedItem(item: Record<string, unknown>): boolean {
  const tags = resolvedTags(item);
  const key = resolvedKey(item);
  return (
    isAmmoResolvedItem(item) ||
    tags.includes('carry') ||
    tags.includes('pet') ||
    key.startsWith('pet.') ||
    key.startsWith('pets.')
  );
}

function calculateEncumbrance(
  equipment: Record<string, unknown>[],
  equippedWeapons: Record<string, unknown>[],
  equippedArmor: Record<string, unknown> | null,
): number {
  let count = 0;

  for (const item of equipment) {
    if (isCarriedResolvedItem(item) && !isEncumbranceExemptResolvedItem(item)) count++;
  }

  for (const weapon of equippedWeapons) {
    if (isCarriedResolvedItem(weapon)) count++;
  }

  if (isCarriedResolvedItem(equippedArmor)) count++;

  return count;
}

// ── Computed modifiers (mirrors resolve_character_computed_modifiers) ─────────

function buildMod(
  mod: Record<string, unknown>,
  origin: ComputedModifier['origin'],
  originKey: string,
  originName: string,
): ComputedModifier | null {
  if (typeof mod !== 'object' || mod === null || Array.isArray(mod)) return null;
  const exclude = Array.isArray(mod.exclude) ? (mod.exclude as string[]) : undefined;
  return {
    value: typeof mod.value === 'number' ? mod.value : 0,
    source: typeof mod.source === 'string' ? mod.source : '',
    statistic: typeof mod.statistic === 'string' ? mod.statistic : '',
    ...(exclude !== undefined && { exclude }),
    origin,
    originKey,
    originName,
  };
}

async function resolveComputedModifiers(
  equippedArmor: Item | null,
  equippedWeapons: Item[],
  equipment: Item[],
  classId: number | null,
  abilities: Item[],
  locale: string,
  translations: TranslationMap,
  weaponMap: Map<string, WeaponCatalog>,
  armorMap: Map<string, ArmorCatalog>,
  petMap: Map<string, PetCatalog>,
  encumbrance: number,
  maxEncumbrance: number,
): Promise<ComputedModifier[]> {
  const result: ComputedModifier[] = [];

  // 1. Armor modifiers
  if (equippedArmor !== null) {
    const key = typeof equippedArmor.key === 'string' && equippedArmor.key ? equippedArmor.key : null;
    if (key) {
      const catalogArmor = armorMap.get(key) ?? null;
      const mods: unknown[] = catalogArmor
        ? (Array.isArray(catalogArmor.modifiers) ? catalogArmor.modifiers : [])
        : (Array.isArray(equippedArmor.modifiers) ? (equippedArmor.modifiers as unknown[]) : []);

      const armorName = catalogArmor
        ? (translate(translations, key) ?? key)
        : ((typeof equippedArmor.name === 'string' ? equippedArmor.name : null) ?? key ?? 'Custom armor');

      const originKey = catalogArmor ? `armor.${key}` : (key ?? 'custom.armor');
      for (const m of mods) {
        const built = buildMod(m as Record<string, unknown>, 'armor', originKey, armorName);
        if (built) result.push(built);
      }
    }
  }

  // 2. Weapon modifiers
  for (const ew of equippedWeapons) {
    const key = typeof ew.key === 'string' && ew.key ? ew.key : null;
    const catalogWeapon = key ? weaponMap.get(key) ?? null : null;
    const mods: unknown[] = catalogWeapon
      ? (Array.isArray(catalogWeapon.modifiers) ? catalogWeapon.modifiers : [])
      : (Array.isArray(ew.modifiers) ? (ew.modifiers as unknown[]) : []);

    const weaponName = catalogWeapon
      ? (translate(translations, key!) ?? key!)
      : ((typeof ew.name === 'string' ? ew.name : null) ?? key ?? 'Custom weapon');

    const originKey = catalogWeapon ? `weapon.${key!}` : (key ?? 'custom.weapon');
    for (const m of mods) {
      const built = buildMod(m as Record<string, unknown>, 'weapon', originKey, weaponName);
      if (built) result.push(built);
    }
  }

  // 3. Pet buffs
  for (const item of equipment) {
    const key = typeof item.key === 'string' ? item.key : '';
    if (!(key.startsWith('pet.') || key.startsWith('pets.'))) continue;
    const suppressPetBuff = item.suppressPetBuff === true;
    if (suppressPetBuff) continue;

    const pet = petMap.get(key);
    if (!pet) continue;

    const buffs = Array.isArray(pet.buff) ? (pet.buff as unknown[]) : [];
    const petName = translate(translations, key) ?? key;
    for (const b of buffs) {
      const built = buildMod(b as Record<string, unknown>, 'pet', `pet.${key}`, petName);
      if (built) result.push(built);
    }
  }

  // 4. Class ability modifiers
  if (classId !== null) {
    const abilityKeys = abilities
      .map(ab => typeof ab.key === 'string' ? ab.key : null)
      .filter((k): k is string => k !== null);

    if (abilityKeys.length > 0) {
      const cams = await catalogRepository.findClassAbilityModifiers(classId, abilityKeys);
      for (const cam of cams) {
        result.push({
          value: cam.value,
          source: cam.source,
          statistic: cam.statistic,
          exclude: Array.isArray(cam.exclude) ? (cam.exclude as string[]) : [],
          origin: 'system',
          originKey: `class_ability.${cam.abilityKey}`,
          originName: cam.source,
        });
      }
    }
  }

  // 5. Encumbrance modifiers
  const encLabel = locale === 'pl' ? 'Obciążenie' : 'Encumbrance';

  if (encumbrance > maxEncumbrance) {
    result.push({
      value: -2,
      source: locale === 'pl'
        ? 'Przeciążenie: -2 do wszystkich testów Zręczności'
        : 'Over capacity: -2 Agility to all tests',
      statistic: 'agility',
      exclude: [],
      origin: 'system',
      originKey: 'system.encumbrance.over_capacity',
      originName: encLabel,
    });
  }

  if (encumbrance > maxEncumbrance * 2) {
    const doubleSource = locale === 'pl'
      ? 'Nie da się nieść więcej niż dwa razy tyle, ile wynosi twój udźwig'
      : 'It is impossible to carry more than twice your capacity';
    result.push({
      value: 0,
      source: doubleSource,
      statistic: 'strength',
      exclude: [],
      origin: 'system',
      originKey: 'system.encumbrance.double_capacity',
      originName: doubleSource,
    });
  }

  // Localize the effect source label (and the origin name where it mirrors it, e.g.
  // class-ability modifiers). Encumbrance sources are already locale-branched above,
  // so their slugs won't match a key and they pass through unchanged.
  const sourceKeys = [
    ...new Set(
      result
        .map((m) => (m.source ? modifierSourceTranslationKey(m.source) : null))
        .filter((key): key is string => key !== null),
    ),
  ];
  const missingSourceKeys = sourceKeys.filter((key) => !translations.has(key));
  const sourceTranslations = await catalogRepository.findTranslations(locale, missingSourceKeys);
  const modifierTranslations: TranslationMap =
    sourceTranslations.length > 0
      ? new Map([
          ...translations,
          ...sourceTranslations.map((row) => [row.key, row.value] as const),
        ])
      : translations;

  for (const m of result) {
    if (!m.source) continue;
    const translated = translate(modifierTranslations, modifierSourceTranslationKey(m.source));
    if (!translated) continue;
    if (m.originName === m.source) m.originName = translated;
    m.source = translated;
  }

  // Strip malformed entries (mirrors SQL final filter: must be object with 'origin' key)
  return result.filter(m => m !== null && typeof m === 'object' && 'origin' in m);
}

// ── DR calculation (mirrors calculate_character_dr) ──────────────────────────

function calculateDR(
  ability: number,
  allModifiers: Array<Record<string, unknown>>,
  statistic: string,
  excludedContexts: string[],
): number {
  const sum = allModifiers
    .filter(m => {
      if (m.statistic !== statistic) return false;
      const excl = m.exclude as string[] | undefined;
      // Include modifier only when none of its exclude entries appear in excludedContexts
      return !(Array.isArray(excl) && excl.some(ctx => excludedContexts.includes(ctx)));
    })
    .reduce((acc, m) => acc + (typeof m.value === 'number' ? m.value : 0), 0);

  return 12 - rollToModifier(ability) - sum;
}

// ── Main export ───────────────────────────────────────────────────────────────

/**
 * Structural shape of a character row for hydration. A real Prisma row
 * satisfies it; so does an in-memory draft preview (id: null, fresh dates).
 */
export interface CharacterRowLike {
  id: string | null;
  name: string;
  classId: number | null;
  origin: string | null;
  strength: number;
  agility: number;
  presence: number;
  toughness: number;
  maxHp: number;
  currentHp: number;
  omens: number;
  maxOmens: number;
  silver: number;
  habit: string | null;
  tale: string | null;
  bodyDescription: string | null;
  trait1: string | null;
  trait2: string | null;
  notes?: string | null;
  abilities: unknown;
  equipment: unknown;
  storage?: unknown;
  equippedWeapons: unknown;
  equippedArmor: unknown;
  modifiers?: unknown;
  partyId?: string | null;
  joinedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Returns the full character with all resolved items and computed fields,
 * or null if the character does not exist.
 * Output is already in camelCase — do NOT apply camelCaseJsonbFields.
 */
export async function getCharacterFull(
  id: string,
  locale: string,
): Promise<Record<string, unknown> | null> {
  // 1. Fetch character row
  const row = await characterRepository.findFullRow(id);
  if (!row) return null;
  return hydrateCharacterRow(row as unknown as CharacterRowLike, locale);
}

/**
 * Resolve catalog/translation data and computed fields for a row-shaped
 * character. Pure with respect to the `characters` table — only reads
 * catalog/translation tables. Used for both real reads and draft previews.
 */
export async function hydrateCharacterRow(
  row: CharacterRowLike,
  locale: string,
): Promise<Record<string, unknown>> {
  // 2. Normalize stored JSONB (handles both SQL snake_case and PATCH camelCase)
  const equipment      = asItems(row.equipment);
  const storage        = asItems(row.storage);
  const equippedWeapons = asItems(row.equippedWeapons);
  const equippedArmor  = asItem(row.equippedArmor);
  const abilities      = asItems(row.abilities);
  const modifiers      = Array.isArray(row.modifiers)
    ? (row.modifiers as Record<string, unknown>[])
    : [];

  // 3. Collect all item keys for bulk catalog lookups
  const allItemParts: (Item | null)[] = [...equipment, ...storage, ...equippedWeapons, equippedArmor];
  const allItemKeys = [...new Set(
    allItemParts
      .filter((item): item is Item => item !== null)
      .map(item => typeof item.key === 'string' ? item.key : null)
      .filter((k): k is string => k !== null),
  )];

  const abilityKeys = abilities
    .map(ab => typeof ab.key === 'string' ? ab.key : null)
    .filter((k): k is string => k !== null);

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

  const weaponMap = new Map(weapons.map(w => [w.key, w as WeaponCatalog]));
  const armorMap  = new Map(armors.map(a => [a.key, a as ArmorCatalog]));
  const equipMap  = new Map(equips.map(e => [e.key, e as EquipCatalog]));
  const petMap    = new Map(pets.map(p => [p.key, p as PetCatalog]));

  // 5. Collect all translation keys for a single bulk fetch
  const transKeySet = new Set<string>();
  if (cls?.nameKey)        transKeySet.add(cls.nameKey);
  if (cls?.descriptionKey) transKeySet.add(cls.descriptionKey);
  if (row.origin)          transKeySet.add(row.origin);
  if (row.bodyDescription) transKeySet.add(row.bodyDescription);
  if (row.trait1)          transKeySet.add(row.trait1);
  if (row.trait2)          transKeySet.add(row.trait2);
  if (row.habit)           transKeySet.add(row.habit);
  if (row.tale)            transKeySet.add(row.tale);

  for (const key of allItemKeys) {
    transKeySet.add(key);
    transKeySet.add(`${key}.description`);
  }
  for (const key of abilityKeys) {
    transKeySet.add(key);
    transKeySet.add(`${key}.description`);
  }

  const transKeys = [...transKeySet];
  const translationRows = await catalogRepository.findTranslations(locale, transKeys);
  const translations: TranslationMap = new Map(translationRows.map(t => [t.key, t.value]));

  // 6. Resolve each inventory section
  const resolvedEquipment = equipment.map(item =>
    resolveInventoryItem(item, weaponMap, armorMap, equipMap, petMap, translations)
  );
  const resolvedStorage = storage.map(item =>
    resolveInventoryItem(item, weaponMap, armorMap, equipMap, petMap, translations)
  );
  const resolvedWeapons = equippedWeapons.map(item =>
    resolveEquippedWeapon(item, weaponMap, translations)
  );
  // JSON null and SQL null are both returned as null by Prisma; we always resolve
  // (with an empty item if null) to match the SQL function behavior for JSON null
  // values stored by generate_character.sql.
  const resolvedArmor = resolveEquippedArmor(equippedArmor ?? {}, armorMap, translations);
  const resolvedAbilities = resolveAbilities(abilities, translations);

  // 7. Encumbrance and derived values — counted from the resolved items so the
  // catalog-merged tags + ammoType drive the same exemptions the UI uses.
  const encumbrance    = calculateEncumbrance(
    resolvedEquipment,
    resolvedWeapons,
    isCarriedResolvedItem(resolvedArmor) ? resolvedArmor : null,
  );
  const strengthMod    = rollToModifier(row.strength);
  const maxEncumbrance = Math.max(0, 8 + strengthMod);

  // 8. Computed modifiers
  const computedModifiers = await resolveComputedModifiers(
    equippedArmor,
    equippedWeapons,
    equipment,
    row.classId,
    abilities,
    locale,
    translations,
    weaponMap,
    armorMap,
    petMap,
    encumbrance,
    maxEncumbrance,
  );

  // 9. DR calculations (raw modifiers + computed modifiers, mirroring SQL)
  const allMods: Record<string, unknown>[] = [
    ...modifiers,
    ...(computedModifiers as unknown as Record<string, unknown>[]),
  ];
  const drToDodge  = calculateDR(row.agility,   allMods, 'agility',   ['defence']);
  const drToMelee  = calculateDR(row.strength,   allMods, 'strength',  ['melee']);
  const drToRanged = calculateDR(row.presence,   allMods, 'presence',  ['ranged']);

  // 10. Class translations
  const className       = translate(translations, cls?.nameKey)       ?? cls?.name       ?? null;
  const classDescription = translate(translations, cls?.descriptionKey) ?? cls?.appendix  ?? null;

  return {
    id:               row.id,
    name:             row.name,
    classId:          row.classId,
    className,
    classDescription,
    origin:           translate(translations, row.origin)          ?? row.origin          ?? null,
    strength:         row.strength,
    agility:          row.agility,
    presence:         row.presence,
    toughness:        row.toughness,
    maxHp:            row.maxHp,
    currentHp:        row.currentHp,
    omens:            row.omens  ?? 0,
    maxOmens:         row.maxOmens ?? 0,
    silver:           row.silver  ?? 0,
    habit:            translate(translations, row.habit)            ?? row.habit           ?? null,
    tale:             translate(translations, row.tale)             ?? row.tale            ?? null,
    bodyDescription:  translate(translations, row.bodyDescription)  ?? row.bodyDescription ?? null,
    trait1:           translate(translations, row.trait1)           ?? row.trait1          ?? null,
    trait2:           translate(translations, row.trait2)           ?? row.trait2          ?? null,
    notes:            row.notes ?? '',
    abilities:        resolvedAbilities,
    equipment:        resolvedEquipment,
    storage:          resolvedStorage,
    equippedWeapons:  resolvedWeapons,
    equippedArmor:    resolvedArmor,
    modifiers,
    computedModifiers,
    encumbrance,
    maxEncumbrance,
    drToDodge,
    drToMelee,
    drToRanged,
    partyId:          row.partyId ?? null,
    joinedAt:         row.joinedAt?.toISOString() ?? null,
    createdAt:        row.createdAt.toISOString(),
    updatedAt:        row.updatedAt.toISOString(),
  };
}
