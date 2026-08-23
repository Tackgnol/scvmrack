import type {
  ComputedModifier,
  CustomModifier,
  Statistic,
} from '@/hooks/models';
import { getComputedModifierKey } from '@/utils/modifierKeys';

export type CombatContext = 'defence' | 'melee' | 'ranged';

export type DecoratedModifier = (ComputedModifier | CustomModifier) & {
  listKey: string;
};

export type CombatBreakdown = {
  applicable: DecoratedModifier[];
  modifierTotal: number;
};

export const decorateModifiers = (
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

export const buildCombatBreakdown = (
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
