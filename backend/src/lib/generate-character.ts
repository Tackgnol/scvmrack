/**
 * TypeScript port of the generate_character PL/pgSQL function (Phase 5).
 * Replaces the raw SQL call in the character creation route.
 *
 * All randomness goes through the supplied Roller instance so that tests can
 * use a seeded ChaCha20Engine for deterministic results.
 *
 * SQL function mapping:
 *   pick_random_name            → pickRandomName
 *   resolve_character_class_id  → resolveClassId
 *   roll_class_silver           → rollClassSilver
 *   pick_class_origin           → pickClassOrigin
 *   roll_character_stats        → rollCharacterStats
 *   roll_character_omens        → rollCharacterOmens
 *   build_character_item_pool   → buildItemPool
 *   auto_equip_character_items  → autoEquipItems
 *   build_character_ability_bundle → buildAbilityBundle
 *   pick_character_personality  → pickPersonality
 *   hydrate_inventory_uses      → hydrateInventoryUses (from lib/inventory)
 */
import prisma from './prisma.js';
import { Prisma } from '@prisma/client';
import type { Roller } from '@tackgnol/rpg-tools-roller';
import { rollToModifier } from '../utils.js';
import { hydrateInventoryUses } from './inventory.js';

// ── Internal types ─────────────────────────────────────────────────────────────

interface PoolItem {
  key: string;
  tags: string[];
  uses?: unknown[];
  autoEquip?: boolean;
  startingAmmoAmount?: number | null;
}

interface AbilityEntry {
  key: string;
}

interface EquipBundle {
  equipment: PoolItem[];
  equippedWeapons: Array<{ key: string }>;
  equippedArmor: { key: string } | null;
}

// ── Roller helpers ─────────────────────────────────────────────────────────────

async function rollDie(faces: number, roller: Roller): Promise<number> {
  return (await roller.roll(`1d${faces}`)).total;
}

async function roll3d6(roller: Roller): Promise<number> {
  return (await roller.roll('3d6')).total;
}

async function pickRandom<T>(arr: T[], roller: Roller): Promise<T | null> {
  if (arr.length === 0) return null;
  const idx = await rollDie(arr.length, roller) - 1;
  return arr[Math.max(0, idx)];
}

/** Fisher-Yates shuffle using the roller. */
async function shuffle<T>(arr: T[], roller: Roller): Promise<T[]> {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = (await rollDie(i + 1, roller)) - 1;
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// ── Catalog maps (pre-loaded per call) ────────────────────────────────────────

interface WeaponRow {
  id: number;
  key: string;
  tags: string[];
  roll: number | null;
  ammoType: string | null;
  defaultAmount: number | null;
}

interface ArmorRow {
  id: number;
  key: string;
  tags: string[];
  maxTier: number | null;
}

interface EquipRow {
  id: number;
  key: string;
  tags: string[];
}

interface PetRow {
  key: string;
  tags: string[];
}

interface CatalogCache {
  weaponMap: Map<string, WeaponRow>;
  weaponsByRoll: Map<number, WeaponRow>;
  armorMap: Map<string, ArmorRow>;
  armorsByMaxTier: Map<number, ArmorRow[]>;
  equipMap: Map<string, EquipRow>;
  petMap: Map<string, PetRow>;
}

function buildCatalogCache(
  weapons: WeaponRow[],
  armors: ArmorRow[],
  equips: EquipRow[],
  pets: PetRow[],
): CatalogCache {
  const weaponMap = new Map(weapons.map(w => [w.key, w]));
  const weaponsByRoll = new Map<number, WeaponRow>();
  // `weapons` is queried with a stable `orderBy: { id: 'asc' }`, so when two
  // weapons share a roll value the lowest-id one wins deterministically.
  for (const w of weapons) {
    if (w.roll !== null && !weaponsByRoll.has(w.roll)) weaponsByRoll.set(w.roll, w);
  }
  const armorMap = new Map(armors.map(a => [a.key, a]));
  const armorsByMaxTier = new Map<number, ArmorRow[]>();
  for (const a of armors) {
    if (a.maxTier !== null) {
      const existing = armorsByMaxTier.get(a.maxTier) ?? [];
      armorsByMaxTier.set(a.maxTier, [...existing, a]);
    }
  }
  const equipMap = new Map(equips.map(e => [e.key, e]));
  const petMap = new Map(pets.map(p => [p.key, p]));
  return { weaponMap, weaponsByRoll, armorMap, armorsByMaxTier, equipMap, petMap };
}

// ── build_pool_item ────────────────────────────────────────────────────────────

function buildPoolItem(
  key: string,
  catalog: CatalogCache,
  extra: Partial<PoolItem> = {},
): PoolItem {
  const w = catalog.weaponMap.get(key);
  const a = catalog.armorMap.get(key);
  const e = catalog.equipMap.get(key);
  const p = catalog.petMap.get(key);
  const tags = w?.tags ?? a?.tags ?? e?.tags ?? p?.tags ?? [];
  return { key, tags, ...extra };
}

// ── Granted items from random abilities ───────────────────────────────────────

// Per-item extras (e.g. tracked uses) keyed by catalog key.
const GRANTED_ITEM_EXTRAS: Record<string, Partial<PoolItem>> = {
  'equipment.wizard-teeth': { uses: [false, false, false, false] },
};

// Legacy display-name → catalog-key map. New seed entries should put the catalog
// key directly in `gainItem`/`gainPet` (resolved by the key-passthrough above) so
// granting no longer breaks silently when an item is renamed/translated.
const GRANTED_ITEM_KEYS_BY_NAME: Record<string, string> = {
  'Crumpled Monster Mask': 'equipment.crumpled-monster-mask',
  'Wizard Teeth': 'equipment.wizard-teeth',
  'Lockpicks': 'equipment.lockpicks',
  'The Brown Scimitar of Galgenbeck': 'weapons.brown-scimitar',
  "Old Sigürd's Sling": 'weapons.sigurd-sling',
  "The Shoe of Death's Horse": 'weapons.shoe-of-death',
  'The Blade of your Ancestors': 'weapons.blade-of-ancestors',
  'The Snake-Skin Gift': 'weapons.snake-skin-gift',
  "Sacred Shepherd's Crook": 'weapons.sacred-shepherds-crook',
};

const GRANTED_PET_KEYS_BY_NAME: Record<string, string> = {
  'Hawk': 'pets.hawk',
  'Ancient Gore-Hound': 'pets.gore-hound',
  'Hamfund the Squire': 'pets.hamfund',
  'Barbarister the Incredible Horse': 'pets.barbarister',
};

function buildGrantedClassItem(value: string | undefined, catalog: CatalogCache): PoolItem | null {
  if (!value) return null;
  // Prefer a stable catalog key if the seed already provides one.
  if (catalog.weaponMap.has(value) || catalog.equipMap.has(value) || catalog.armorMap.has(value)) {
    return buildPoolItem(value, catalog, GRANTED_ITEM_EXTRAS[value]);
  }
  const key = GRANTED_ITEM_KEYS_BY_NAME[value];
  if (!key) return null;
  return buildPoolItem(key, catalog, GRANTED_ITEM_EXTRAS[key]);
}

function buildGrantedClassPet(value: string | undefined, catalog: CatalogCache): PoolItem | null {
  if (!value) return null;
  if (catalog.petMap.has(value)) {
    return buildPoolItem(value, catalog);
  }
  const key = GRANTED_PET_KEYS_BY_NAME[value];
  if (!key) return null;
  return buildPoolItem(key, catalog);
}

// ── Starting item tables ───────────────────────────────────────────────────────

function buildBooleanUses(count: number): boolean[] {
  return count <= 0 ? [] : Array(count).fill(false);
}

async function rollStartingCarryItem(roller: Roller, catalog: CatalogCache): Promise<PoolItem[]> {
  const roll = await rollDie(6, roller);
  const keys: Partial<Record<number, string>> = {
    3: 'equipment.backpack',
    4: 'equipment.sack',
    5: 'equipment.small-wagon',
    6: 'equipment.donkey',
  };
  const key = keys[roll];
  return key ? [buildPoolItem(key, catalog)] : [];
}

async function rollStartingItemTableOne(
  presence: number,
  roller: Roller,
  catalog: CatalogCache,
  equips: EquipRow[],
): Promise<PoolItem[]> {
  const roll = await rollDie(12, roller);
  const mod = rollToModifier(presence);

  switch (roll) {
    case 1:
      return [buildPoolItem('equipment.rope', catalog)];

    case 2: {
      const count = Math.max(0, mod + 4);
      return Array.from({ length: count }, () => buildPoolItem('equipment.torches', catalog));
    }

    case 3: {
      const uses = buildBooleanUses(Math.max(0, mod + 6));
      return [buildPoolItem('equipment.lantern', catalog, { uses })];
    }

    case 4:
      return [buildPoolItem('equipment.magnesium-strip', catalog)];

    case 5: {
      const unclean = equips.filter(e => e.tags.includes('unclean'));
      const picked = await pickRandom(unclean, roller);
      return picked ? [buildPoolItem(picked.key, catalog)] : [];
    }

    case 6:
      return [buildPoolItem('equipment.sharp-needle', catalog)];

    case 7: {
      const uses = buildBooleanUses(Math.max(0, mod + 4));
      return [buildPoolItem('equipment.medicine-chest', catalog, { uses })];
    }

    case 8:
      return [buildPoolItem('equipment.lockpicks', catalog)];

    case 9:
      return [buildPoolItem('equipment.bear-trap', catalog)];

    case 10:
      return [buildPoolItem('equipment.bomb', catalog)];

    case 11: {
      const count = await rollDie(4, roller);
      const uses = buildBooleanUses(count);
      return [buildPoolItem('equipment.red-poison', catalog, { uses })];
    }

    case 12:
      return [buildPoolItem('equipment.silver-crucifix', catalog)];

    default:
      return [];
  }
}

async function rollStartingItemTableTwo(
  roller: Roller,
  catalog: CatalogCache,
  equips: EquipRow[],
): Promise<PoolItem[]> {
  const roll = await rollDie(12, roller);

  switch (roll) {
    case 1: {
      const count = await rollDie(4, roller);
      return [buildPoolItem('equipment.life-elixir', catalog, { uses: buildBooleanUses(count) })];
    }

    case 2: {
      const sacred = equips.filter(e => e.tags.includes('sacred'));
      const picked = await pickRandom(sacred, roller);
      return picked ? [buildPoolItem(picked.key, catalog)] : [];
    }

    case 3:
      return [buildPoolItem('pets.small-dog', catalog)];

    case 4: {
      const count = await rollDie(4, roller);
      return Array.from({ length: count }, () => buildPoolItem('pets.monkey', catalog));
    }

    case 5:
      return [buildPoolItem('equipment.exquisite-perfume', catalog)];

    case 6:
      return [buildPoolItem('equipment.toolbox', catalog)];

    case 7:
      return [buildPoolItem('equipment.heavy-chain', catalog)];

    case 8:
      return [buildPoolItem('equipment.grappling-hook', catalog)];

    case 9:
      return [buildPoolItem('weapons.shield', catalog)];

    case 10:
      return [buildPoolItem('weapons.crowbar', catalog)];

    case 11:
      return [buildPoolItem('equipment.lard', catalog, { uses: buildBooleanUses(5) })];

    case 12:
      return [buildPoolItem('equipment.tent', catalog)];

    default:
      return [];
  }
}

async function rollStartingWeapon(
  weaponDie: number,
  presence: number,
  roller: Roller,
  catalog: CatalogCache,
): Promise<PoolItem[]> {
  const roll = await rollDie(weaponDie, roller);
  const weapon = catalog.weaponsByRoll.get(roll);
  if (!weapon) return [];

  let ammoAmount: number | null = null;
  if (weapon.ammoType === 'Arrow' || weapon.ammoType === 'Bolt') {
    ammoAmount = Math.max(0, rollToModifier(presence) + (weapon.defaultAmount ?? 0));
  } else if (weapon.defaultAmount !== null) {
    ammoAmount = Math.max(0, weapon.defaultAmount);
  }

  return [buildPoolItem(weapon.key, catalog, {
    autoEquip: true,
    ...(ammoAmount !== null && { startingAmmoAmount: ammoAmount }),
  })];
}

async function rollStartingArmor(
  armorDie: number,
  roller: Roller,
  catalog: CatalogCache,
): Promise<PoolItem[]> {
  const roll = await rollDie(armorDie, roller);
  if (roll === 1) return [];

  const tierMap: Record<number, number> = { 2: 1, 3: 2 };
  const tier = tierMap[roll] ?? 3;
  const armorOptions = catalog.armorsByMaxTier.get(tier) ?? [];
  const chosen = await pickRandom(armorOptions, roller);
  if (!chosen) return [];

  return [buildPoolItem(chosen.key, catalog, { autoEquip: true })];
}

// ── build_character_item_pool ─────────────────────────────────────────────────

async function buildItemPool(
  weaponDie: number,
  armorDie: number,
  presence: number,
  roller: Roller,
  catalog: CatalogCache,
  equips: EquipRow[],
  grantedItems: PoolItem[],
): Promise<PoolItem[]> {
  const carry = await rollStartingCarryItem(roller, catalog);
  const tableOne = await rollStartingItemTableOne(presence, roller, catalog, equips);
  const tableTwo = await rollStartingItemTableTwo(roller, catalog, equips);

  const basePool = [...carry, ...tableOne, ...tableTwo];

  const hasScroll = basePool.some(item => item.key.startsWith('scroll.'));
  const effectiveWeaponDie = hasScroll ? Math.min(weaponDie, 6) : weaponDie;
  const effectiveArmorDie  = hasScroll ? Math.min(armorDie, 2)  : armorDie;

  const weapon = await rollStartingWeapon(effectiveWeaponDie, presence, roller, catalog);
  const armor  = await rollStartingArmor(effectiveArmorDie, roller, catalog);

  return [...basePool, ...weapon, ...armor, ...grantedItems];
}

// ── auto_equip_character_items ────────────────────────────────────────────────

function autoEquipItems(pool: PoolItem[], catalog: CatalogCache): EquipBundle {
  const equipment: PoolItem[] = [];
  const equippedWeapons: Array<{ key: string }> = [];
  let equippedArmor: { key: string } | null = null;

  const AMMO_MAP: Record<string, string> = {
    Arrow: 'equipment.arrows',
    Bolt:  'equipment.bolts',
  };

  for (const item of pool) {
    if (item.autoEquip && item.tags.includes('weapon') && equippedWeapons.length < 2) {
      equippedWeapons.push({ key: item.key });

      const weapon = catalog.weaponMap.get(item.key);
      if (weapon?.ammoType) {
        const ammoKey = AMMO_MAP[weapon.ammoType];
        const ammoAmount =
          item.startingAmmoAmount ??
          weapon.defaultAmount ??
          0;
        if (ammoKey && ammoAmount > 0) {
          for (let i = 0; i < ammoAmount; i++) {
            equipment.push(buildPoolItem(ammoKey, catalog));
          }
        }
      }
    } else if (item.autoEquip && item.tags.includes('armor') && equippedArmor === null) {
      equippedArmor = { key: item.key };
    } else {
      const { autoEquip: _a, startingAmmoAmount: _s, ...rest } = item;
      equipment.push(rest);
    }
  }

  return { equipment, equippedWeapons, equippedArmor };
}

// ── build_character_ability_bundle ────────────────────────────────────────────

async function buildAbilityBundle(
  classId: number,
  roller: Roller,
  catalog: CatalogCache,
): Promise<{ abilities: AbilityEntry[]; grantedItems: PoolItem[] }> {
  const [classRow, allAbilities] = await Promise.all([
    prisma.class.findUnique({ where: { id: classId } }),
    prisma.ability.findMany({ where: { classId } }),
  ]);

  const fixedAbilities = allAbilities
    .filter(a => !a.isRandom)
    .map(a => ({ key: a.key }));

  const randomAbilityCount = classRow?.randomAbilityCount ?? 0;
  const classRandomAbilities = (classRow?.randomAbilities ?? []) as Array<{
    gainItem?: string;
    gainPet?: string;
  }>;

  const randomCandidates = allAbilities.filter(a => a.isRandom);
  const shuffled = await shuffle(randomCandidates, roller);
  const picked = shuffled.slice(0, randomAbilityCount);

  const randomAbilities: AbilityEntry[] = [];
  const grantedItems: PoolItem[] = [];

  for (const ability of picked) {
    randomAbilities.push({ key: ability.key });
    const rollIdx = (ability.rollValue ?? 1) - 1;
    const config = classRandomAbilities[rollIdx];
    if (config) {
      const item = buildGrantedClassItem(config.gainItem, catalog);
      if (item) grantedItems.push(item);
      else {
        const pet = buildGrantedClassPet(config.gainPet, catalog);
        if (pet) grantedItems.push(pet);
      }
    }
  }

  return { abilities: [...fixedAbilities, ...randomAbilities], grantedItems };
}

// ── pick_character_personality ────────────────────────────────────────────────

async function pickPersonality(roller: Roller) {
  const [habits, tales, bodies, traits] = await Promise.all([
    prisma.habit.findMany({ select: { key: true } }),
    prisma.tale.findMany({ select: { key: true } }),
    prisma.bodyDescription.findMany({ select: { key: true } }),
    prisma.trait.findMany({ select: { key: true } }),
  ]);

  const habit = await pickRandom(habits, roller);
  const tale  = await pickRandom(tales,  roller);
  const body  = await pickRandom(bodies, roller);
  const trait1 = await pickRandom(traits, roller);
  const remaining = traits.filter(t => t.key !== trait1?.key);
  const trait2 = await pickRandom(remaining, roller);

  return {
    habit:           habit?.key  ?? null,
    tale:            tale?.key   ?? null,
    bodyDescription: body?.key   ?? null,
    trait1:          trait1?.key ?? null,
    trait2:          trait2?.key ?? null,
  };
}

// ── Main export ───────────────────────────────────────────────────────────────

/**
 * Generate a new character and insert it into the database.
 * Returns the new character's UUID.
 *
 * Uses the supplied Roller for all random decisions so tests can inject a
 * seeded engine for deterministic results.
 */
export async function generateCharacter(
  classId: number | null,
  roller: Roller,
  userId?: string,
): Promise<string> {
  // 1. Resolve class (random if not supplied)
  let resolvedClassId: number;
  if (classId !== null) {
    resolvedClassId = classId;
  } else {
    const classes = await prisma.class.findMany({ select: { id: true } });
    const picked = await pickRandom(classes, roller);
    if (!picked) throw new Error('No classes found in database');
    resolvedClassId = picked.id;
  }

  const cls = await prisma.class.findUniqueOrThrow({ where: { id: resolvedClassId } });

  // 2. Pre-load all catalog data in parallel
  const [names, origins, weapons, armors, equips, pets] = await Promise.all([
    prisma.name.findMany({ select: { name: true } }),
    prisma.origin.findMany({ where: { classId: resolvedClassId }, select: { key: true } }),
    prisma.weapon.findMany({ orderBy: { id: 'asc' } }),
    prisma.armor.findMany(),
    prisma.equipment.findMany(),
    prisma.pet.findMany({ select: { key: true, tags: true } }),
  ]);

  const catalog = buildCatalogCache(weapons, armors, equips, pets);

  // 3. Roll stats
  const statModifiers = (cls.statModifiers ?? {}) as Record<string, number>;
  const strength  = (await roll3d6(roller)) + (statModifiers.strength  ?? 0);
  const agility   = (await roll3d6(roller)) + (statModifiers.agility   ?? 0);
  const presence  = (await roll3d6(roller)) + (statModifiers.presence  ?? 0);
  const toughness = (await roll3d6(roller)) + (statModifiers.toughness ?? 0);

  const hpDie = cls.hpDie ?? 8;
  const hpRoll = await rollDie(hpDie, roller);
  const maxHp = Math.max(1, hpRoll + rollToModifier(toughness));

  // 4. Roll omens (d2)
  const omens = await rollDie(2, roller);

  // 5. Silver
  let silver = 0;
  for (const die of cls.silverDice) {
    silver += await rollDie(die, roller);
  }
  silver *= (cls.silverModifier ?? 10);

  // 6. Name, origin
  const name = (await pickRandom(names, roller))?.name ?? 'Unknown';
  const origin = (await pickRandom(origins, roller))?.key ?? null;

  // 7. Abilities + granted items
  const { abilities, grantedItems } = await buildAbilityBundle(resolvedClassId, roller, catalog);

  // 8. Item pool
  const pool = await buildItemPool(
    cls.weaponDie ?? 10,
    cls.armorDie  ?? 4,
    presence,
    roller,
    catalog,
    equips,
    grantedItems,
  );

  // 9. Auto-equip
  const bundle = autoEquipItems(pool, catalog);

  // 10. Hydrate uses (scrolls, pets, consumables)
  const hydratedEquipment = await hydrateInventoryUses(
    bundle.equipment,
    presence,
    true,
    roller,
  ) as unknown[];

  // 11. Personality
  const personality = await pickPersonality(roller);

  // 12. Insert and return id
  const character = await prisma.character.create({
    data: {
      ...(userId ? { userId } : {}),
      name,
      classId: resolvedClassId,
      origin,
      strength,
      agility,
      presence,
      toughness,
      maxHp,
      currentHp: maxHp,
      omens,
      maxOmens: omens,
      silver,
      habit:           personality.habit,
      tale:            personality.tale,
      bodyDescription: personality.bodyDescription,
      trait1:          personality.trait1,
      trait2:          personality.trait2,
      abilities:       abilities as object[],
      equipment:       hydratedEquipment as object[],
      equippedWeapons: bundle.equippedWeapons as object[],
      equippedArmor:   bundle.equippedArmor ?? Prisma.DbNull,
    },
    select: { id: true },
  });

  return character.id;
}
