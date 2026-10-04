import type {
  AbilityModifierDraft,
  ClassItemDraft,
  ClassItemType,
  Localized,
} from './class-draft.js';
import { blankClassItem } from './class-draft.js';

/** The catalog table each Class Item type lives in, and its key prefix. */
export const ITEM_TABLES = {
  weapon: { table: 'weapon', prefix: 'weapons.' },
  armor: { table: 'armor', prefix: 'armor.' },
  gear: { table: 'equipment', prefix: 'equipment.' },
  pet: { table: 'pet', prefix: 'pets.' },
} as const satisfies Record<ClassItemType, { table: string; prefix: string }>;

const KEY = /^(weapons|armor|equipment|pets)\.cc-(\d+)-(\d+)$/;
const TIER_DIE: Record<number, number> = { 1: 2, 2: 4, 3: 6 };
const TIER_TAG: Record<number, string> = {
  1: 'light-armor',
  2: 'medium-armor',
  3: 'heavy-armor',
};

/**
 * Keys for a class's items: an item keeps its saved key while its type (so its
 * table) is unchanged; a new or retyped one gets a number above every key the
 * class has used, since a dropped item's row stays for characters holding it.
 */
export function stableItemKeys(
  classId: number,
  items: Array<{ ref: string; type: ClassItemType }>,
  inUse: string[]
): string[] {
  const numberOf = (key: string) => {
    const match = KEY.exec(key);
    return match && Number(match[2]) === classId ? Number(match[3]) : 0;
  };
  let next =
    Math.max(0, ...inUse.map(numberOf), ...items.map((i) => numberOf(i.ref))) +
    1;
  const used = new Set<string>();
  return items.map((item) => {
    const prefix = ITEM_TABLES[item.type].prefix;
    const kept =
      numberOf(item.ref) > 0 &&
      item.ref.startsWith(prefix) &&
      !used.has(item.ref);
    const key = kept ? item.ref : `${prefix}cc-${classId}-${next++}`;
    used.add(key);
    return key;
  });
}

type CatalogModifier = {
  value: number;
  source: string;
  statistic: string;
  exclude: string[];
};

const toCatalog = (
  mods: AbilityModifierDraft[],
  source: string
): CatalogModifier[] =>
  mods.map((m) => ({
    value: m.value,
    source,
    statistic: m.statistic,
    exclude: m.exclude,
  }));

const fromCatalog = (raw: unknown): AbilityModifierDraft[] =>
  (Array.isArray(raw) ? raw : []).map((m: CatalogModifier) => ({
    statistic: m.statistic as AbilityModifierDraft['statistic'],
    value: m.value,
    exclude: Array.isArray(m.exclude) ? m.exclude : [],
  }));

/** The catalog row a Class Item is stored as. `source` labels its modifiers on the sheet. */
export function itemRow(item: ClassItemDraft, classId: number, source: string) {
  const common = { classId, value: item.value };
  switch (item.type) {
    case 'weapon': {
      const w = item.weapon;
      const ranged = w.reach === 'ranged';
      return {
        table: 'weapon' as const,
        data: {
          ...common,
          tags: ['weapon', w.reach, 'special'],
          dice: Array.from({ length: w.diceCount }, () => w.diceFaces),
          damageModifier: w.damageModifier,
          modifiers: toCatalog(w.modifiers, source),
          ammoType:
            !ranged || w.ammo === 'none'
              ? null
              : w.ammo === 'endless'
              ? 'Infinite'
              : w.ammoName.trim() || 'Ammo',
          defaultAmount:
            !ranged || w.ammo === 'none'
              ? null
              : w.ammo === 'endless'
              ? 999
              : w.ammoCount,
        },
      };
    }
    case 'armor':
      return {
        table: 'armor' as const,
        data: {
          ...common,
          tags: ['armor', TIER_TAG[item.armor.tier]],
          dice: [TIER_DIE[item.armor.tier]],
          maxTier: item.armor.tier,
          modifiers: toCatalog(item.armor.modifiers, source),
        },
      };
    case 'gear': {
      const g = item.gear;
      const effect =
        g.effect === 'damage'
          ? { damageDie: g.effectDie }
          : g.effect === 'die'
          ? { effectDie: g.effectDie }
          : {};
      return {
        table: 'equipment' as const,
        data: {
          ...common,
          tags: ['special', g.kind === 'carried' ? 'tool' : g.kind],
          defaultAmount: g.uses > 0 ? g.uses : null,
          useEffect: {
            type: g.uses > 1 ? 'MultiUse' : 'SingleUse',
            ...effect,
            statuses: toCatalog(g.statuses, source),
          },
        },
      };
    }
    case 'pet': {
      const p = item.pet;
      return {
        table: 'pet' as const,
        data: {
          ...common,
          tags: ['pet', 'special', ...(p.humanoid ? ['humanoid'] : [])],
          hp: p.hp,
          actionDie: [p.actionDie],
          actionType: p.action === 'buff' ? 'buff' : 'melee',
          buff: p.action === 'buff' ? toCatalog(p.buffs, source) : [],
        },
      };
    }
  }
}

/** A stored catalog row of any type, as far as reading a Class Item back needs. */
export type ItemRowRead = {
  key: string;
  tags: string[];
  value: number | null;
  dice?: number[];
  damageModifier?: number | null;
  modifiers?: unknown;
  ammoType?: string | null;
  defaultAmount?: number | null;
  maxTier?: number | null;
  useEffect?: unknown;
  hp?: number;
  actionDie?: number[];
  actionType?: string | null;
  buff?: unknown;
};

/** A stored Class Item back as the creator edits it. */
export function itemFromRow(
  type: ClassItemType,
  row: ItemRowRead,
  name: Localized,
  description: Localized
): ClassItemDraft {
  const item: ClassItemDraft = {
    ...blankClassItem(type),
    ref: row.key,
    name,
    description,
    value: row.value ?? 0,
  };
  if (type === 'weapon') {
    const ammo =
      row.ammoType === 'Infinite'
        ? 'endless'
        : row.ammoType
        ? 'counted'
        : 'none';
    item.weapon = {
      diceCount: row.dice?.length || 1,
      diceFaces: row.dice?.[0] ?? 6,
      damageModifier: row.damageModifier ?? 0,
      reach: row.tags.includes('ranged') ? 'ranged' : 'melee',
      ammo,
      ammoCount: ammo === 'counted' ? row.defaultAmount ?? 10 : 10,
      ammoName:
        ammo === 'counted' && row.ammoType !== 'Ammo' ? row.ammoType ?? '' : '',
      modifiers: fromCatalog(row.modifiers),
    };
  } else if (type === 'armor') {
    item.armor = {
      tier: row.maxTier ?? 1,
      modifiers: fromCatalog(row.modifiers),
    };
  } else if (type === 'gear') {
    const effect = (row.useEffect ?? {}) as {
      damageDie?: number;
      effectDie?: number;
      statuses?: unknown;
    };
    item.gear = {
      kind: row.tags.includes('consumable')
        ? 'consumable'
        : row.tags.includes('wearable')
        ? 'wearable'
        : 'carried',
      uses: row.defaultAmount ?? 0,
      effect: effect.damageDie ? 'damage' : effect.effectDie ? 'die' : 'text',
      effectDie: effect.damageDie ?? effect.effectDie ?? 6,
      statuses: fromCatalog(effect.statuses),
    };
  } else {
    item.pet = {
      hp: row.hp ?? 4,
      actionDie: row.actionDie?.[0] ?? 4,
      action: row.actionType === 'buff' ? 'buff' : 'attack',
      humanoid: row.tags.includes('humanoid'),
      buffs: fromCatalog(row.buff),
    };
  }
  return item;
}

/** The type a stored Class Item key belongs to. */
export function itemTypeOf(key: string): ClassItemType | null {
  const prefix = KEY.exec(key)?.[1];
  return prefix === 'weapons'
    ? 'weapon'
    : prefix === 'armor'
    ? 'armor'
    : prefix === 'equipment'
    ? 'gear'
    : prefix === 'pets'
    ? 'pet'
    : null;
}
