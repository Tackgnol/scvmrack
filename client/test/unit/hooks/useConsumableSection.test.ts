import { act, renderHook } from '@testing-library/react';
import { expect, test } from 'vitest';
import { useConsumableSection } from '../../../src/hooks/useConsumableSection.ts';
import {
  createCharacterTestContext,
  createCharacterTestWrapper,
} from '../helpers/characterHookWrapper.ts';

test('useConsumableSection returns only tracked consumables with uses', () => {
  const toggleCalls: Array<[number, number]> = [];
  const wrapperState = createCharacterTestWrapper({
    character: {
      equipment: [
        {
          key: 'equipment.medicine-chest',
          name: 'Medicine Chest',
          tags: ['consumable', 'healing'],
          uses: [false, false, true],
        },
        { key: 'equipment.torch', name: 'Torch', tags: ['consumable'] },
        { key: 'scroll.fire', name: 'Fire Scroll', uses: [false] },
        { key: 'pet.wolf', name: 'Wolf', tags: ['pet'], uses: [false] },
        {
          key: 'equipment.lantern',
          name: 'Lantern',
          tags: ['lighting', 'consumable'],
          uses: [false, false, false],
        },
      ],
    },
    isSaving: true,
    toggleScrollUse: (equipmentIndex: number, useIndex: number) => {
      toggleCalls.push([equipmentIndex, useIndex]);
    },
  });

  const { result } = renderHook(() => useConsumableSection(), {
    wrapper: wrapperState.wrapper,
  });

  expect(result.current.consumablesWithIndices).toHaveLength(2);
  expect(result.current.consumablesWithIndices[0].uses).toEqual([
    false,
    false,
    true,
  ]);
  expect(result.current.consumablesWithIndices[1].uses).toEqual([
    false,
    false,
    false,
  ]);

  act(() => {
    result.current.markPipPending(4, 1);
  });

  expect(result.current.hasPendingPipSave).toBe(true);
  expect(result.current.isPipPending(4, 1)).toBe(true);
  expect(toggleCalls).toEqual([[4, 1]]);
});

test('useConsumableSection clears pending flag once saving turns off via context update', () => {
  const wrapperState = createCharacterTestWrapper({
    character: {
      equipment: [
        {
          key: 'equipment.life-elixir',
          name: 'Life Elixir',
          tags: ['consumable', 'healing'],
          uses: [true],
        },
      ],
    },
    isSaving: true,
    toggleScrollUse: () => {},
  });

  const { result, rerender } = renderHook(() => useConsumableSection(), {
    wrapper: wrapperState.wrapper,
  });

  act(() => {
    result.current.markPipPending(0, 0);
  });
  expect(result.current.isPipPending(0, 0)).toBe(true);

  wrapperState.setContext(
    createCharacterTestContext({
      ...wrapperState.getContext(),
      isSaving: false,
    }),
  );
  rerender();

  expect(result.current.hasPendingPipSave).toBe(false);
  expect(result.current.isPipPending(0, 0)).toBe(false);
});
