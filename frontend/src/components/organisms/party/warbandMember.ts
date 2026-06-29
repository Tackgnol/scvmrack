import type {
  Character,
  ComputedModifier,
  CustomModifier,
  EquipmentItem,
  WeaponItem,
} from '@/hooks/models';
import { partyColors } from '@/theme/partyTokens';
import { rollToModifier } from '@/inventory/customItems';
import { aggregateItems } from '@/utils/aggregateItems';

// Read-only view-model for a single scvm shown in the party "warband" takeover.
// Mirrors the shape the Party Trigger design renders per card. Built from the
// full character so every tooltip (abilities, contributing DR, modifiers, kit)
// has real data — this is a derived projection, never a second source of truth.

export type WarbandContribRow = {
  label: string;
  labelKey?: string;
  val: string;
};

export type WarbandModifierView = {
  label: string;
  /** Signed value, e.g. "+2" / "−1". */
  value: string;
  /** i18n key for the affected stat/scope label (translated by the renderer). */
  statKey: string;
  /** English stat/scope label, used as the i18n fallback. */
  statFallback: string;
  /** English "value STAT" string (kept for snapshots/tests; UI uses value+statKey). */
  effect: string;
  kind: 'buff' | 'debuff';
  edge: string;
  /** i18n key for built-in computed modifier descriptions. */
  descKey?: string;
  /** English description fallback or user-authored/custom source text. */
  desc: string;
};

export type WarbandEquipView = { name: string; desc: string };

export type WarbandMember = {
  id: string;
  name: string;
  cls: string;
  dead: boolean;

  hpText: string;
  hpPct: number;

  agi: string;
  pre: string;
  str: string;
  tou: string;

  dodge: number;
  melee: number;
  ranged: number;
  /** Armor damage reduction (the X in −dX); 0 when unarmored. */
  dr: number;
  dodgeC: WarbandContribRow[];
  meleeC: WarbandContribRow[];
  rangedC: WarbandContribRow[];

  weapon: string;
  armor: string;
  omenText: string;
  silver: number;

  modifiers: WarbandModifierView[];
  hasMods: boolean;
  modCount: number;

  trait1: string;
  trait2: string;
  habit: string;
  bodyDesc: string;
  origin: string;

  equipment: WarbandEquipView[];
  equipCount: number;
};

const BUFF_EDGE = partyColors.buff;
const DEBUFF_EDGE = partyColors.debuff;

const DASH = '—'; // em dash
const MINUS = '−'; // proper minus sign

const signed = (value: number | undefined): string => {
  const n = value ?? 0;
  return n >= 0 ? `+${n}` : `${MINUS}${Math.abs(n)}`;
};

const statLabel = (
  statistic: string | undefined,
  scope: string | undefined,
): string => {
  switch (statistic) {
    case 'agility':
      return 'AGILITY';
    case 'strength':
      return 'STRENGTH';
    case 'presence':
      return 'PRESENCE';
    case 'toughness':
      return 'TOUGHNESS';
    default:
      return (scope ?? 'all').toUpperCase();
  }
};

const STAT_KEYS: Record<string, string> = {
  agility: 'attributes.agility',
  strength: 'attributes.strength',
  presence: 'attributes.presence',
  toughness: 'attributes.toughness',
};

// The affected-stat label for a modifier: a translatable key plus the English
// fallback. Renderers do `t(statKey, statFallback)` so the stat localizes while
// the projection stays free of i18n.
const statMeta = (
  statistic: string | undefined,
  scope: string | undefined,
): { key: string; fallback: string } => {
  const fallback = statLabel(statistic, scope);
  if (statistic && STAT_KEYS[statistic]) {
    return { key: STAT_KEYS[statistic], fallback };
  }
  return { key: `modifiers.scopes.${scope ?? 'all'}`, fallback };
};

const originDescription = (
  origin: ComputedModifier['origin'],
): { key?: string; fallback: string } => {
  switch (origin) {
    case 'armor':
      return {
        key: 'modifiers.computed.originDescriptions.armor',
        fallback: 'From equipped armor.',
      };
    case 'weapon':
      return {
        key: 'modifiers.computed.originDescriptions.weapon',
        fallback: 'From equipped weapon.',
      };
    case 'pet':
      return {
        key: 'modifiers.computed.originDescriptions.pet',
        fallback: 'From carried creature.',
      };
    case 'system':
      return {
        key: 'modifiers.computed.originDescriptions.system',
        fallback: 'From class, encumbrance, or rules state.',
      };
    default:
      return { fallback: '' };
  }
};

const weaponLabel = (weapon: WeaponItem | null | undefined): string => {
  if (!weapon?.name) return `Unarmed (d2)`;
  const die = weapon.dice?.find((d) => typeof d === 'number' && d > 0);
  return die ? `${weapon.name} (d${die})` : weapon.name;
};

const armorLabel = (armor: EquipmentItem | null | undefined): string => {
  if (!armor?.name) return 'None';
  const tier = armor.currentTier ?? armor.maxTier;
  return tier ? `${armor.name} (${MINUS}d${tier * 2})` : armor.name;
};

// Damage reduction the armor soaks — the X in −dX. A quick GM-glance number, 0 bare.
const armorDr = (armor: EquipmentItem | null | undefined): number => {
  const tier = armor?.currentTier ?? armor?.maxTier;
  return tier ? tier * 2 : 0;
};

const contrib = (
  govName: string,
  govValue: number | undefined,
  statistic: string,
  computed: ComputedModifier[],
): WarbandContribRow[] => {
  const rows: WarbandContribRow[] = [
    { label: 'Base test', labelKey: 'gm.baseTest', val: 'DR12' },
    { label: govName, labelKey: `attributes.${statistic}`, val: signed(govValue) },
  ];
  computed
    .filter((m) => m.statistic === statistic && (m.value ?? 0) !== 0)
    .forEach((m) => {
      rows.push({
        label: m.originName ?? m.source ?? 'Modifier',
        val: signed(m.value),
      });
    });
  return rows;
};

const toModifierView = (modifier: CustomModifier): WarbandModifierView => {
  const value = modifier.value ?? 0;
  const buff = value >= 0;
  const meta = statMeta(modifier.statistic, modifier.scope);
  return {
    label: modifier.name ?? 'Modifier',
    value: signed(value),
    statKey: meta.key,
    statFallback: meta.fallback,
    effect: `${signed(value)} ${meta.fallback}`,
    kind: buff ? 'buff' : 'debuff',
    edge: buff ? BUFF_EDGE : DEBUFF_EDGE,
    desc: modifier.comment ?? '',
  };
};

const toComputedModifierView = (
  modifier: ComputedModifier,
): WarbandModifierView => {
  const value = modifier.value ?? 0;
  const buff = value >= 0;
  const label =
    modifier.originName?.trim() || modifier.source?.trim() || 'Modifier';
  const source = modifier.source?.trim();
  const meta = statMeta(modifier.statistic, undefined);
  const sourceDescription =
    source && source !== label ? { fallback: source } : originDescription(modifier.origin);
  return {
    label,
    value: signed(value),
    statKey: meta.key,
    statFallback: meta.fallback,
    effect: `${signed(value)} ${meta.fallback}`,
    kind: buff ? 'buff' : 'debuff',
    edge: buff ? BUFF_EDGE : DEBUFF_EDGE,
    descKey: sourceDescription.key,
    desc: sourceDescription.fallback,
  };
};

const equipmentLabel = (name: string, quantity: number): string =>
  quantity > 1 ? `${name} x${quantity}` : name;

export function toWarbandMember(character: Character): WarbandMember {
  const hp = character.currentHp ?? 0;
  const hpMax = Math.max(1, character.maxHp ?? 1);
  const dead = hp <= 0;
  const computed = character.computedModifiers ?? [];

  // Abilities arrive as raw scores (e.g. 12), not MÖRK BORG modifiers. The card shows
  // the modifier (e.g. +0/+2), matching the sheet and the DR breakdown — so convert
  // here rather than printing the score. This also feeds the combat tooltip's
  // governing-ability row, which is the modifier the DR math actually uses.
  const agiMod = rollToModifier(character.agility);
  const preMod = rollToModifier(character.presence);
  const strMod = rollToModifier(character.strength);
  const touMod = rollToModifier(character.toughness);

  const computedModifierViews = computed
    .filter((m) => m.originName?.trim() || m.source?.trim())
    .map(toComputedModifierView);
  const customModifierViews = (character.modifiers ?? [])
    .filter((m) => m.name)
    .map(toModifierView);
  const modifiers = [...computedModifierViews, ...customModifierViews];

  const carriedEquipment = (character.equipment ?? []).filter(
    (item): item is EquipmentItem => Boolean(item.name),
  );
  const equipment: WarbandEquipView[] = aggregateItems(carriedEquipment).map(
    ({ item, quantity }) => ({
      name: equipmentLabel(item.name ?? '', quantity),
      desc: item.description ?? '',
    }),
  );

  return {
    id: character.id ?? '',
    name: character.name?.trim() || 'Unnamed scvm',
    cls: character.className?.trim() || 'Classless',
    dead,

    hpText: `${hp}/${character.maxHp ?? 0}`,
    hpPct: Math.max(0, Math.min(100, Math.round((hp / hpMax) * 100))),

    agi: signed(agiMod),
    pre: signed(preMod),
    str: signed(strMod),
    tou: signed(touMod),

    dodge: character.drToDodge ?? 12,
    melee: character.drToMelee ?? 12,
    ranged: character.drToRanged ?? 12,
    dr: armorDr(character.equippedArmor),
    dodgeC: contrib('Agility', agiMod, 'agility', computed),
    meleeC: contrib('Strength', strMod, 'strength', computed),
    rangedC: contrib('Presence', preMod, 'presence', computed),

    weapon: weaponLabel(character.equippedWeapons?.[0]),
    armor: armorLabel(character.equippedArmor),
    omenText: `${character.omens ?? 0}/${character.maxOmens ?? 0}`,
    silver: character.silver ?? 0,

    modifiers,
    hasMods: modifiers.length > 0,
    modCount: modifiers.length,

    trait1: character.trait1?.trim() || `${DASH}`,
    trait2: character.trait2?.trim() || `${DASH}`,
    habit: character.habit?.trim() || `${DASH}`,
    bodyDesc: character.bodyDescription?.trim() || `${DASH}`,
    origin: character.origin?.trim() || `${DASH}`,

    equipment,
    equipCount: carriedEquipment.length,
  };
}
