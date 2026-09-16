import {
  scopeIncludeOptions,
} from '@components/modifiers/config';
import {
  createModifierId,
  includesToExclude,
} from '@components/modifiers/utils';
import {
  type IncludeContext,
  type ScopeOption,
} from '@components/modifiers/types';
import {
  type Character,
  type CustomItemCategory,
  type CustomModifier,
  type EquipmentItem,
  type Statistic,
  type UseCountRule,
} from '@/hooks/models';
import { statToModifier } from '@/utils/stats';

export type CustomItemKind = CustomItemCategory;

export type ArmorPreset = 'light' | 'medium' | 'heavy';

export type CustomItemModifierInput = {
  enabled: boolean;
  value: number;
  statistic: Statistic;
  scope: ScopeOption;
};

export type CustomItemInput = {
  kind: CustomItemKind;
  name: string;
  description?: string;
  comments?: string;
  value?: number;
  quantity?: number;
  damageDie?: number;
  ammoType?: string;
  ammoAmount?: number;
  armorPreset?: ArmorPreset;
  armorDie?: number;
  armorTier?: number;
  useCountRule?: UseCountRule;
  modifier?: CustomItemModifierInput;
  id?: string;
};

type CharacterStats = Pick<
  Character,
  'agility' | 'strength' | 'presence' | 'toughness'
>;

type ArmorPresetConfig = {
  die: number;
  tier: number;
  tags: string[];
};

export const CUSTOM_DAMAGE_DICE = [2, 4, 6, 8, 10, 12] as const;
export const CUSTOM_ARMOR_DICE = [2, 4, 6] as const;
const DEFAULT_AMMO_TYPES = ['Arrow', 'Bolt'] as const;

export const ARMOR_PRESETS: Record<ArmorPreset, ArmorPresetConfig> = {
  light: { die: 2, tier: 1, tags: ['armor', 'light-armor'] },
  medium: { die: 4, tier: 2, tags: ['armor', 'medium-armor'] },
  heavy: { die: 6, tier: 3, tags: ['armor', 'heavy-armor'] },
};

const clampInteger = (value: number, min: number, max: number): number =>
  Math.max(
    min,
    Math.min(max, Math.floor(Number.isFinite(value) ? value : min)),
  );

export const buildCustomItemKey = (
  kind: CustomItemKind,
  id = createModifierId(),
): string => `custom.${kind}.${id}`;

const scopeToExclude = (scope: ScopeOption): string[] => {
  const includes =
    scopeIncludeOptions.find((option) => option.value === scope)?.include ??
    [];
  return includesToExclude(includes as IncludeContext[]);
};

export const createUsePips = (
  rule: UseCountRule | undefined,
  stats: CharacterStats,
): boolean[] => {
  if (!rule) return [];

  const base = clampInteger(rule.base ?? 0, 0, 50);
  const modifier =
    rule.mode === 'fixedPlusModifier'
      ? statToModifier(stats[rule.statistic ?? 'presence'])
      : 0;
  const count = clampInteger(base + modifier, 0, 50);

  return Array.from({ length: count }, () => false);
};

export const collectKnownAmmoTypes = (
  character?: Character | null,
): string[] => {
  const known = new Set<string>(DEFAULT_AMMO_TYPES);
  const items = [
    ...(character?.equipment ?? []),
    ...(character?.storage ?? []),
    ...(character?.equippedWeapons ?? []),
  ];

  items.forEach((item) => {
    const ammoType = item?.ammoType?.trim();
    if (ammoType) known.add(ammoType);
  });

  return Array.from(known).sort((a, b) => a.localeCompare(b));
};

const createOptionalModifier = (
  input: CustomItemModifierInput | undefined,
  itemName: string,
): CustomModifier[] => {
  if (!input?.enabled) return [];

  return [
    {
      id: createModifierId(),
      name: itemName,
      source: itemName,
      value: clampInteger(input.value, -20, 20),
      statistic: input.statistic,
      exclude: scopeToExclude(input.scope),
      // Persist the source-of-truth scope so the derived `exclude` can be
      // recomputed if the mapping table changes (or an outside lib takes
      // over modifier calculations).
      scope: input.scope,
    },
  ];
};

const createBaseItem = (
  input: CustomItemInput,
  kind: CustomItemKind,
): EquipmentItem => ({
  key: buildCustomItemKey(kind, input.id),
  source: 'custom',
  category: kind,
  name: input.name.trim(),
  description: input.description?.trim() || undefined,
  comments: input.comments?.trim() || undefined,
  value:
    input.value && input.value > 0
      ? clampInteger(input.value, 0, 1000000)
      : undefined,
  tags: ['custom'],
});

const createAmmoStack = (
  ammoType: string,
  amount: number,
  name?: string,
): EquipmentItem[] => {
  const normalizedAmmoType = ammoType.trim();
  if (!normalizedAmmoType) return [];

  const count = clampInteger(amount, 0, 999);
  if (count <= 0) return [];

  return [
    {
      key: buildCustomItemKey('ammo'),
      source: 'custom',
      category: 'ammo',
      name: name?.trim() || normalizedAmmoType,
      description: `${normalizedAmmoType} ammo`,
      tags: ['custom', 'ammo'],
      ammoType: normalizedAmmoType,
      amount: count,
    },
  ];
};

export const buildCustomItemBundle = (
  input: CustomItemInput,
  stats: CharacterStats,
): EquipmentItem[] => {
  const name = input.name.trim();
  if (!name) return [];

  const quantity = clampInteger(input.quantity ?? 1, 1, 50);
  const baseItem = createBaseItem(input, input.kind);

  if (input.kind === 'ammo') {
    return createAmmoStack(
      input.ammoType || name,
      input.ammoAmount ?? quantity,
      name,
    );
  }

  const item: EquipmentItem = { ...baseItem };

  if (input.kind === 'weapon') {
    item.tags = ['custom', 'weapon'];
    item.dice = [clampInteger(input.damageDie ?? 4, 1, 20)];
    item.modifiers = createOptionalModifier(input.modifier, name);
    if (input.ammoType?.trim()) {
      item.ammoType = input.ammoType.trim();
    }

    return [
      item,
      ...createAmmoStack(input.ammoType ?? '', input.ammoAmount ?? 0),
    ];
  }

  if (input.kind === 'armor') {
    const preset = ARMOR_PRESETS[input.armorPreset ?? 'light'];
    const tier = clampInteger(input.armorTier ?? preset.tier, 0, 4);
    item.tags = ['custom', ...preset.tags];
    item.dice = [clampInteger(input.armorDie ?? preset.die, 1, 20)];
    item.maxTier = tier;
    item.currentTier = tier;
    item.modifiers = createOptionalModifier(input.modifier, name);
    return [item];
  }

  if (input.kind === 'consumable') {
    item.tags = ['custom', 'consumable'];
    item.useCountRule = input.useCountRule;
    return Array.from({ length: quantity }, () => ({
      ...item,
      key: buildCustomItemKey('consumable'),
      uses: createUsePips(input.useCountRule, stats),
    }));
  }

  return Array.from({ length: quantity }, () => ({
    ...item,
    key: buildCustomItemKey('misc'),
    modifiers: createOptionalModifier(input.modifier, name),
  }));
};
