import { act, renderHook } from '@testing-library/react';
import { expect, test } from 'vitest';
import { usePetSection } from '../../../src/hooks/usePetSection.ts';
import { createCharacterTestWrapper } from '../helpers/characterHookWrapper.ts';

test('usePetSection includes tag/key based pet entries and preserves pet uses', () => {
  const toggleCalls: Array<[number, number]> = [];
  const wrapperState = createCharacterTestWrapper({
    character: {
      equipment: [
        { key: 'pet.wolf', name: 'Wolf', uses: [true, true, false] },
        { key: 'animal.goat', name: 'Goat', tags: ['pet'] },
        { key: 'scroll.fire', name: 'Fire Scroll' },
        { key: 'pets.raven', name: 'Raven' },
      ],
    },
    isSaving: true,
    toggleScrollUse: (equipmentIndex: number, useIndex: number) => {
      toggleCalls.push([equipmentIndex, useIndex]);
    },
  });

  const { result } = renderHook(() => usePetSection(), {
    wrapper: wrapperState.wrapper,
  });

  expect(result.current.petsWithIndices).toHaveLength(3);
  expect(result.current.petsWithIndices[0].uses).toEqual([true, true, false]);
  expect(result.current.petsWithIndices[1].uses).toEqual([]);

  act(() => {
    result.current.markPipPending(3, 0);
  });

  expect(result.current.hasPendingPipSave).toBe(true);
  expect(result.current.isPipPending(3, 0)).toBe(true);
  expect(toggleCalls).toEqual([[3, 0]]);
});
