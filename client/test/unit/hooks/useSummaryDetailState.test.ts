import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { morkBorgColors, statColors } from '../../../src/theme/morkBorgTheme.ts';
import { useSummaryDetailState } from '../../../src/hooks/useSummaryDetailState.ts';

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

test('useSummaryDetailState opens hover detail and schedules close when unpinned', async () => {
  const anchor = document.createElement('button');
  const { result } = renderHook(() => useSummaryDetailState());

  act(() => {
    result.current.openHoverDetail('dodge', anchor);
  });

  expect(result.current.activeDetail).toBe('dodge');
  expect(result.current.anchorEl).toBe(anchor);
  expect(result.current.popperOpen).toBe(true);
  expect(result.current.popperAccent).toBe(statColors.agi);

  await act(async () => {
    result.current.scheduleClose();
    await vi.advanceTimersByTimeAsync(140);
  });

  expect(result.current.activeDetail).toBe(null);
  expect(result.current.anchorEl).toBe(null);
  expect(result.current.popperOpen).toBe(false);
  expect(result.current.popperAccent).toBe(morkBorgColors.yellow);
});

test('useSummaryDetailState keeps pinned detail open until explicit toggle closes it', () => {
  const anchor = document.createElement('button');
  const { result } = renderHook(() => useSummaryDetailState());

  act(() => {
    result.current.togglePinnedDetail('melee', anchor);
  });

  expect(result.current.activeDetail).toBe('melee');
  expect(result.current.popperOpen).toBe(true);
  expect(result.current.popperAccent).toBe(statColors.str);

  act(() => {
    result.current.scheduleClose();
  });

  expect(result.current.activeDetail).toBe('melee');

  act(() => {
    result.current.togglePinnedDetail('melee', anchor);
  });

  expect(result.current.activeDetail).toBe(null);
  expect(result.current.popperOpen).toBe(false);
});

test('useSummaryDetailState handles different accents and closing behaviors', () => {
  const anchor = document.createElement('button');
  const { result } = renderHook(() => useSummaryDetailState());

  act(() => {
    result.current.openHoverDetail('ranged', anchor);
  });
  expect(result.current.popperAccent).toBe(statColors.pre);

  act(() => {
    result.current.openHoverDetail('encumbrance', anchor);
  });
  expect(result.current.popperAccent).toBe(morkBorgColors.yellow);

  act(() => {
    result.current.closeNow();
  });
  expect(result.current.activeDetail).toBe(null);

  // Pinned cannot be overridden by hover if it's different
  act(() => {
    result.current.togglePinnedDetail('dodge', anchor);
  });
  act(() => {
    result.current.openHoverDetail('melee', anchor);
  });
  expect(result.current.activeDetail).toBe('dodge');
});
