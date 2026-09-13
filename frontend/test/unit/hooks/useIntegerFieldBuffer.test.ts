import { act, renderHook } from '@testing-library/react';
import { expect, test, vi } from 'vitest';
import { useIntegerFieldBuffer } from '../../../src/hooks/useIntegerFieldBuffer.ts';
import type { ChangeEvent, KeyboardEvent } from 'react';

const change = (value: string) =>
  ({ target: { value } }) as ChangeEvent<HTMLInputElement>;

test('displays the committed value when there is no in-progress edit', () => {
  const { result } = renderHook(() => useIntegerFieldBuffer(7, vi.fn()));
  expect(result.current.value).toBe('7');
});

test('commits each valid keystroke as before', () => {
  const onCommit = vi.fn();
  const { result } = renderHook(() => useIntegerFieldBuffer(5, onCommit));

  act(() => result.current.onChange(change('12')));

  expect(onCommit).toHaveBeenCalledWith('12');
  expect(result.current.value).toBe('12');
});

test('clearing the field goes neutral: no commit, stays empty', () => {
  const onCommit = vi.fn();
  const { result } = renderHook(() => useIntegerFieldBuffer(5, onCommit));

  act(() => result.current.onChange(change('')));

  expect(onCommit).not.toHaveBeenCalled();
  expect(result.current.value).toBe('');
});

test('blurring while empty reverts the display to the last committed value without committing', () => {
  const onCommit = vi.fn();
  const { result, rerender } = renderHook(
    ({ committed }) => useIntegerFieldBuffer(committed, onCommit),
    { initialProps: { committed: 5 } },
  );

  act(() => result.current.onChange(change('')));
  expect(result.current.value).toBe('');

  act(() => result.current.onBlur());

  expect(onCommit).not.toHaveBeenCalled();
  rerender({ committed: 5 });
  expect(result.current.value).toBe('5');
});

test('rejects exponent notation: the disallowed character never reaches the buffer, and a no-op edit does not re-commit', () => {
  const onCommit = vi.fn();
  const { result } = renderHook(() => useIntegerFieldBuffer(15, onCommit));

  act(() => result.current.onChange(change('15e')));

  expect(result.current.value).toBe('15');
  expect(onCommit).not.toHaveBeenCalled();
});

test('leading zeroes stay as typed until blur, then normalize via the committed value', () => {
  const onCommit = vi.fn();
  const { result, rerender } = renderHook(
    ({ committed }) => useIntegerFieldBuffer(committed, onCommit),
    { initialProps: { committed: 0 } },
  );

  act(() => result.current.onChange(change('0')));
  expect(result.current.value).toBe('0');

  act(() => result.current.onChange(change('00')));
  expect(result.current.value).toBe('00');
  expect(onCommit).toHaveBeenLastCalledWith('00');

  act(() => result.current.onBlur());
  rerender({ committed: 0 });
  expect(result.current.value).toBe('0');
});

test('Enter blurs the input to trigger the same normalization boundary', () => {
  const { result } = renderHook(() => useIntegerFieldBuffer(5, vi.fn()));
  const blur = vi.fn();

  act(() =>
    result.current.onKeyDown({
      key: 'Enter',
      currentTarget: { blur },
    } as unknown as KeyboardEvent<HTMLInputElement>),
  );

  expect(blur).toHaveBeenCalledOnce();
});
