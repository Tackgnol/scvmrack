import { expect, test } from 'vitest';
import { getComputedModifierKey } from '../../../src/utils/modifierKeys';
import { type ComputedModifier } from '../../../src/hooks/models';

test('getComputedModifierKey distinguishes same-origin computed effects', () => {
  const base: ComputedModifier = {
    value: 2,
    source: 'Stealthy',
    exclude: [],
    origin: 'system',
    originKey: 'class_ability.abilities.gutterborn_scum.stealthy',
    originName: 'Stealthy',
  };

  expect(
    getComputedModifierKey({ ...base, statistic: 'agility' }, 0)
  ).not.toBe(
    getComputedModifierKey({ ...base, statistic: 'presence' }, 1)
  );
});
