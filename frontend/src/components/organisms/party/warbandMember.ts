import type {
  Character,
  ComputedModifier,
  CustomModifier,
  EquipmentItem,
  Statistic,
} from '@/hooks/models';
import { partyColors } from '@/theme/partyTokens';
import { aggregateItems } from '@/utils/aggregateItems';
import {
  buildCombatBreakdown,
  decorateModifiers,
  type DecoratedModifier,
} from '@/utils/combatBreakdown';
import { statToModifier } from '@/utils/stats';

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

export type CompactWarbandCard = {
  id?: string | null;
  name?: string | null;
  className?: string | null;
  currentHp?: number | null;
  maxHp?: number | null;
  strength?: number | null;
  agility?: number | null;
  presence?: number | null;
  toughness?: number | null;
  drToDodge?: number | null;
  drToMelee?: number | null;
  drToRanged?: number | null;
  omens?: number | null;
  maxOmens?: number | null;
  silver?: number | null;
  equippedWeapons?: Array<{
    name?: string | null;
    dice?: number[] | null;
  } | null> | null;
  equippedArmor?: {
    name?: string | null;
    dice?: number[] | null;
    currentTier?: number | null;
    maxTier?: number | null;
  } | null;
  computedModifiers?: unknown[] | null;
  equipment?: Array<{ name?: string | null; description?: string | null } | null> | null;
  bodyDescription?: string | null;
  habit?: string | null;
  origin?: string | null;
  trait1?: string | null;
  trait2?: string | null;
};

const BUFF_EDGE = partyColors.buff;
const DEBUFF_EDGE = partyColors.debuff;

const DASH = '—'; // em dash
const MINUS = '−'; // proper minus sign

type WeaponLabelSource = {
  name?: string | null;
  dice?: number[] | null;
};

type ArmorLabelSource = {
  name?: string | null;
  dice?: number[] | null;
  currentTier?: number | null;
  maxTier?: number | null;
};

type CompactWeaponCardInput = NonNullable<
  CompactWarbandCard['equippedWeapons']
>[number];
type CompactWeaponCard = NonNullable<CompactWeaponCardInput>;

const isCompactWeaponCard = (
  weapon: CompactWeaponCardInput,
): weapon is CompactWeaponCard => Boolean(weapon);

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

const weaponLabel = (
  weapon: WeaponLabelSource | null | undefined,
  unarmedLabel = 'Unarmed',
): string => {
  if (!weapon?.name) return `${unarmedLabel} (d2)`;
  const die = weapon.dice?.find((d) => typeof d === 'number' && d > 0);
  return die ? `${weapon.name} (d${die})` : weapon.name;
};

const armorLabel = (
  armor: ArmorLabelSource | null | undefined,
  noneLabel = 'None',
): string => {
  if (!armor?.name) return noneLabel;
  const die = armorDie(armor);
  return die ? `${armor.name} (${MINUS}d${die})` : armor.name;
};

// Damage reduction the armor soaks — the X in −dX. A quick GM-glance number, 0 bare.
const armorDie = (armor: ArmorLabelSource | null | undefined): number => {
  const die = armor?.dice?.find((value) => typeof value === 'number' && value > 0);
  if (die) return die;

  const tier = armor?.currentTier ?? armor?.maxTier;
  return tier ? tier * 2 : 0;
};

const armorDr = armorDie;

const modifierLabel = (modifier: DecoratedModifier): string => {
  const customName = 'name' in modifier ? modifier.name?.trim() : '';
  const computedName =
    'originName' in modifier ? modifier.originName?.trim() : '';
  const source = 'source' in modifier ? modifier.source?.trim() : '';
  return customName || computedName || source || 'Modifier';
};

const contrib = (
  govName: string,
  govValue: number | undefined,
  statistic: Statistic,
  applicableModifiers: DecoratedModifier[],
): WarbandContribRow[] => {
  const rows: WarbandContribRow[] = [
    { label: 'Base test', labelKey: 'gm.baseTest', val: 'DR12' },
    { label: govName, labelKey: `attributes.${statistic}`, val: signed(govValue) },
  ];
  applicableModifiers.forEach((modifier) => {
    rows.push({
      label: modifierLabel(modifier),
      val: signed(modifier.value),
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

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const isStatistic = (value: unknown): value is ComputedModifier['statistic'] =>
  value === 'agility' ||
  value === 'strength' ||
  value === 'presence' ||
  value === 'toughness';

const isModifierOrigin = (
  value: unknown,
): value is NonNullable<ComputedModifier['origin']> =>
  value === 'armor' ||
  value === 'weapon' ||
  value === 'pet' ||
  value === 'system';

const recordString = (
  record: Record<string, unknown>,
  key: string,
): string | undefined => {
  const value = record[key];
  return typeof value === 'string' ? value : undefined;
};

const recordNumber = (
  record: Record<string, unknown>,
  key: string,
): number | undefined => {
  const value = record[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
};

const recordStringArray = (
  record: Record<string, unknown>,
  key: string,
): string[] | undefined => {
  const value = record[key];
  return Array.isArray(value) && value.every((item) => typeof item === 'string')
    ? value
    : undefined;
};

const toCompactComputedModifier = (
  value: unknown,
): ComputedModifier | null => {
  if (!isRecord(value)) return null;

  const statistic = recordString(value, 'statistic');
  const origin = recordString(value, 'origin');

  return {
    value: recordNumber(value, 'value'),
    source: recordString(value, 'source'),
    statistic: isStatistic(statistic) ? statistic : undefined,
    exclude: recordStringArray(value, 'exclude'),
    origin: isModifierOrigin(origin) ? origin : undefined,
    originKey: recordString(value, 'originKey'),
    originName: recordString(value, 'originName'),
  };
};

const toCompactComputedModifiers = (
  modifiers: unknown[] | null | undefined,
): ComputedModifier[] =>
  (modifiers ?? [])
    .map(toCompactComputedModifier)
    .filter((modifier): modifier is ComputedModifier => modifier !== null);

export function toWarbandMember(
  character: Character,
  labels?: WarbandCardLabels,
): WarbandMember {
  const hp = character.currentHp ?? 0;
  const hpMax = Math.max(1, character.maxHp ?? 1);
  const dead = hp <= 0;
  const computed = character.computedModifiers ?? [];
  const custom = character.modifiers ?? [];
  const allModifiers = decorateModifiers(computed, custom);
  const dodgeBreakdown = buildCombatBreakdown(
    allModifiers,
    'agility',
    'defence',
  );
  const meleeBreakdown = buildCombatBreakdown(allModifiers, 'strength', 'melee');
  const rangedBreakdown = buildCombatBreakdown(
    allModifiers,
    'presence',
    'ranged',
  );

  // Abilities arrive as raw scores (e.g. 12), not MÖRK BORG modifiers. The card shows
  // the modifier (e.g. +0/+2), matching the sheet and the DR breakdown — so convert
  // here rather than printing the score. This also feeds the combat tooltip's
  // governing-ability row, which is the modifier the DR math actually uses.
  const agiMod = statToModifier(character.agility ?? 10);
  const preMod = statToModifier(character.presence ?? 10);
  const strMod = statToModifier(character.strength ?? 10);
  const touMod = statToModifier(character.toughness ?? 10);

  const computedModifierViews = computed
    .filter((m) => m.originName?.trim() || m.source?.trim())
    .map(toComputedModifierView);
  const customModifierViews = custom
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
    name: character.name?.trim() || labels?.unnamedScvm || 'Unnamed scvm',
    cls: character.className?.trim() || labels?.classless || 'Classless',
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
    dodgeC: contrib('Agility', agiMod, 'agility', dodgeBreakdown.applicable),
    meleeC: contrib('Strength', strMod, 'strength', meleeBreakdown.applicable),
    rangedC: contrib(
      'Presence',
      preMod,
      'presence',
      rangedBreakdown.applicable,
    ),

    weapon: weaponLabel(character.equippedWeapons?.[0], labels?.unarmed),
    armor: armorLabel(character.equippedArmor, labels?.armorNone),
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

// Localized fallbacks for projections used outside the main app shell. The OBR
// view re-enables the language switcher, so its callers pass these in to keep
// "no armor"/"unarmed" from leaking English into a Polish roster/peek.
export type WarbandCardLabels = {
  armorNone?: string;
  unarmed?: string;
  unnamedScvm?: string;
  classless?: string;
};

export function toWarbandMemberFromCard(
  card: CompactWarbandCard,
  labels?: WarbandCardLabels,
): WarbandMember {
  const equippedWeapons = (card.equippedWeapons ?? [])
    .filter(isCompactWeaponCard)
    .map((weapon) => ({
      name: weapon.name ?? undefined,
      dice: weapon.dice ?? undefined,
    }));
  const equippedArmor = card.equippedArmor
    ? {
        name: card.equippedArmor.name ?? undefined,
        dice: card.equippedArmor.dice ?? undefined,
        currentTier: card.equippedArmor.currentTier ?? undefined,
        maxTier: card.equippedArmor.maxTier ?? undefined,
      }
    : null;
  const equipment = (card.equipment ?? [])
    .filter(
      (item): item is { name: string; description?: string | null } =>
        Boolean(item && item.name),
    )
    .map((item) => ({
      name: item.name,
      description: item.description ?? '',
    }));
  const character: Character = {
    id: card.id ?? '',
    name: card.name ?? undefined,
    className: card.className ?? null,
    currentHp: card.currentHp ?? undefined,
    maxHp: card.maxHp ?? undefined,
    strength: card.strength ?? undefined,
    agility: card.agility ?? undefined,
    presence: card.presence ?? undefined,
    toughness: card.toughness ?? undefined,
    drToDodge: card.drToDodge ?? undefined,
    drToMelee: card.drToMelee ?? undefined,
    drToRanged: card.drToRanged ?? undefined,
    omens: card.omens ?? undefined,
    maxOmens: card.maxOmens ?? undefined,
    silver: card.silver ?? 0,
    equippedWeapons,
    equippedArmor,
    computedModifiers: toCompactComputedModifiers(card.computedModifiers),
    modifiers: [],
    equipment,
    bodyDescription: card.bodyDescription ?? null,
    habit: card.habit ?? null,
    origin: card.origin ?? null,
    trait1: card.trait1 ?? null,
    trait2: card.trait2 ?? null,
  };

  return toWarbandMember(character, labels);
}
