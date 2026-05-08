import { act, renderHook } from '@testing-library/react';
import { expect, test } from 'vitest';
import { usePowersSection } from '../../../src/hooks/usePowersSection.ts';
import {
  createCharacterTestContext,
  createCharacterTestWrapper,
} from '../helpers/characterHookWrapper.ts';

test('usePowersSection returns only scroll entries and defaults missing uses', () => {
  const toggleCalls: Array<[number, number]> = [];
  const wrapperState = createCharacterTestWrapper({
    character: {
      equipment: [
        { key: 'scroll.fire', name: 'Fire Scroll', uses: [true, false] },
        { key: 'weapon.sword', name: 'Sword' },
        { key: 'scroll.bone', name: 'Bone Scroll' },
      ],
    },
    isSaving: true,
    toggleScrollUse: (equipmentIndex: number, useIndex: number) => {
      toggleCalls.push([equipmentIndex, useIndex]);
    },
  });

  const { result } = renderHook(() => usePowersSection(), {
    wrapper: wrapperState.wrapper,
  });

  expect(result.current.scrollsWithIndices).toHaveLength(2);
  expect(result.current.scrollsWithIndices[0].uses).toEqual([true, false]);
  expect(result.current.scrollsWithIndices[1].uses).toEqual([
    false,
    false,
    false,
    false,
  ]);

  act(() => {
    result.current.markPipPending(2, 3);
  });

  expect(result.current.hasPendingPipSave).toBe(true);
  expect(result.current.isPipPending(2, 3)).toBe(true);
  expect(toggleCalls).toEqual([[2, 3]]);
});

test('usePowersSection clears pending flag once saving turns off via context update', () => {
  const wrapperState = createCharacterTestWrapper({
    character: {
      equipment: [{ key: 'scroll.void', name: 'Void Scroll', uses: [true] }],
    },
    isSaving: true,
    toggleScrollUse: () => {},
  });

  const { result, rerender } = renderHook(() => usePowersSection(), {
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
