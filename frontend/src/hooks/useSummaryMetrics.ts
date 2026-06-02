import { useMemo } from 'react';
import {
  type CharacterResponse,
  type ComputedModifier,
  type CustomModifier,
  type EquipmentItem,
  type Statistic,
} from '@/hooks/models';
import { isEncumbranceExemptItem } from '@/hooks/useEquipmentSections';
import { statToModifier } from '@/utils/stats';
import { getComputedModifierKey } from '@/utils/modifierKeys';

export type SummaryDetailKey = 'dodge' | 'melee' | 'ranged' | 'encumbrance';
export type CombatContext = 'defence' | 'melee' | 'ranged';

export type DecoratedModifier = (ComputedModifier | CustomModifier) & {
  listKey: string;
};

export type CombatBreakdown = {
  applicable: DecoratedModifier[];
  modifierTotal: number;
};

export type EncumbranceGroup = {
  key: 'equipment' | 'weapons' | 'armor';
  label: string;
  items: EquipmentItem[];
};

export type SummaryMetrics = {
  characterKey: string;
  agilityModifier: number;
  strengthModifier: number;
  presenceModifier: number;
  dodgeBreakdown: CombatBreakdown;
  meleeBreakdown: CombatBreakdown;
  rangedBreakdown: CombatBreakdown;
  encumbranceItems: EquipmentItem[];
  encumbranceGroups: EncumbranceGroup[];
  encumbrance: number;
  maxEncumbrance: number;
  toDodge: number;
  toHitMelee: number;
  toHitRanged: number;
};

const decorateModifiers = (
  computedModifiers: ComputedModifier[],
  customModifiers: CustomModifier[],
): DecoratedModifier[] => [
  ...computedModifiers.map((modifier, index) => ({
    ...modifier,
    listKey: `computed-${getComputedModifierKey(modifier, index)}`,
  })),
  ...customModifiers.map((modifier, index) => ({
    ...modifier,
    listKey: `custom-${modifier.id ?? index}`,
  })),
];

const buildCombatBreakdown = (
  allModifiers: DecoratedModifier[],
  stat: Statistic,
  context: CombatContext,
): CombatBreakdown => {
  const applicable = allModifiers.filter((modifier) => {
    if ((modifier.value ?? 0) === 0) return false;
    if (modifier.statistic !== stat) return false;
    return !(modifier.exclude ?? []).includes(context);
  });

  const modifierTotal = applicable.reduce(
    (sum, modifier) => sum + (modifier.value ?? 0),
    0,
  );

  return { applicable, modifierTotal };
};

const isCarriedItem = (
  item: EquipmentItem | null | undefined,
): item is EquipmentItem => Boolean(item?.key || item?.name);

export function useSummaryMetrics(
  character: CharacterResponse | undefined,
): SummaryMetrics {
  return useMemo(() => {
    const char = character as CharacterResponse | undefined;

    const allModifiers = decorateModifiers(
      character?.computedModifiers ?? [],
      character?.modifiers ?? [],
    );

    const agilityModifier = statToModifier(character?.agility ?? 10);
    const strengthModifier = statToModifier(character?.strength ?? 10);
    const presenceModifier = statToModifier(character?.presence ?? 10);

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

    const carriedEquipment = (character?.equipment ?? []).filter(
      (item) => !isEncumbranceExemptItem(item),
    );
    const carriedWeapons = (character?.equippedWeapons ?? []).filter(isCarriedItem);
    const carriedArmor = (
      character?.equippedArmor ? [character.equippedArmor] : []
    ).filter(isCarriedItem);
    const encumbranceItems = [
      ...carriedEquipment,
      ...carriedWeapons,
      ...carriedArmor,
    ];
    const encumbranceGroups: EncumbranceGroup[] = [
      { key: 'equipment', label: 'equipment.onHand', items: carriedEquipment },
      { key: 'weapons', label: 'equipment.equippedWeapons', items: carriedWeapons },
      { key: 'armor', label: 'equipment.equippedArmor', items: carriedArmor },
    ].filter((group) => group.items.length > 0) as EncumbranceGroup[];
    const encumbrance = encumbranceItems.length;
    const maxEncumbrance = Math.max(0, 8 + strengthModifier);

    return {
      characterKey: character?.id ?? 'unknown',
      agilityModifier,
      strengthModifier,
      presenceModifier,
      dodgeBreakdown,
      meleeBreakdown,
      rangedBreakdown,
      encumbranceItems,
      encumbranceGroups,
      encumbrance,
      maxEncumbrance,
      toDodge: char?.drToDodge ?? 12 - agilityModifier - dodgeBreakdown.modifierTotal,
      toHitMelee:
        char?.drToMelee ?? 12 - strengthModifier - meleeBreakdown.modifierTotal,
      toHitRanged:
        char?.drToRanged ?? 12 - presenceModifier - rangedBreakdown.modifierTotal,
    };
  }, [character]);
}
