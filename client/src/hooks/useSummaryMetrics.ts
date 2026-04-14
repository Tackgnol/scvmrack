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

export type SummaryDetailKey = 'dodge' | 'melee' | 'ranged' | 'encumbrance';
export type CombatContext = 'defence' | 'melee' | 'ranged';

export type DecoratedModifier = (ComputedModifier | CustomModifier) & {
  listKey: string;
};

export type CombatBreakdown = {
  applicable: DecoratedModifier[];
  modifierTotal: number;
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
    listKey: `computed-${modifier.originKey ?? index}`,
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

    const encumbranceItems = [
      ...(character?.equipment ?? []).filter((item) => !isEncumbranceExemptItem(item)),
      ...(character?.equippedWeapons ?? []).filter(isCarriedItem),
      ...(character?.equippedArmor ? [character.equippedArmor] : []).filter(
        isCarriedItem,
      ),
    ];
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
