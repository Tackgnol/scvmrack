import { act, renderHook } from '@testing-library/react';
import { expect, test } from 'vitest';
import { useTrackedUsePips } from '../../../src/hooks/useTrackedUsePips.ts';

test('useTrackedUsePips marks pending pips and reports pending state while saving', () => {
  const toggleCalls: Array<[number, number]> = [];
  const { result } = renderHook(
    ({ isSaving }) =>
      useTrackedUsePips({
        isSaving,
        onToggle: (equipmentIndex, useIndex) => {
          toggleCalls.push([equipmentIndex, useIndex]);
        },
      }),
    { initialProps: { isSaving: true } },
  );

  act(() => {
    result.current.markPipPending(2, 1);
  });

  expect(result.current.hasPendingPipSave).toBe(true);
  expect(result.current.isPipPending(2, 1)).toBe(true);
  expect(toggleCalls).toEqual([[2, 1]]);
});

test('useTrackedUsePips clears pending state when saving finishes', () => {
  const { result, rerender } = renderHook(
    ({ isSaving }) =>
      useTrackedUsePips({
        isSaving,
        onToggle: () => {},
      }),
    { initialProps: { isSaving: true } },
  );

  act(() => {
    result.current.markPipPending(0, 0);
  });

  expect(result.current.hasPendingPipSave).toBe(true);
  expect(result.current.isPipPending(0, 0)).toBe(true);

  rerender({ isSaving: false });

  expect(result.current.hasPendingPipSave).toBe(false);
  expect(result.current.isPipPending(0, 0)).toBe(false);
});
