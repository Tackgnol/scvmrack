import { act, renderHook } from '@testing-library/react';
import { expect, test } from 'vitest';
import { useCustomItemForm } from '../../../src/hooks/useCustomItemForm.ts';
import { type Character } from '../../../src/hooks/models.ts';

const characterStats = {
  agility: 10,
  strength: 10,
  presence: 10,
  toughness: 10,
} as Character;

test('useCustomItemForm keeps preview and save parsing aligned for zero values', () => {
  const { result } = renderHook(() => useCustomItemForm(true, characterStats));

  act(() => {
    result.current.handleKindChange('consumable');
    result.current.update('name', 'Ash vial');
    result.current.update('consumeBase', '0');
  });

  expect(result.current.previewItems[0]?.uses).toEqual([]);
  expect(result.current.buildBundle()[0]?.uses).toEqual([]);
});
