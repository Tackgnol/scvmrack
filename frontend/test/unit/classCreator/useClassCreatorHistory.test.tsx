import { act, renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

vi.mock('@/components/organisms/class-creator/ClassCreator/useDraftAutosave', () => ({
  useDraftAutosave: () => ({ complete: vi.fn(), discard: vi.fn(), persist: vi.fn() }),
}));

import { useClassCreator } from '@/components/organisms/class-creator/ClassCreator/useClassCreator';
import { blankDraft } from '@/components/organisms/class-creator/creatorShared.utils';

const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={new QueryClient()}>{children}</QueryClientProvider>
);
const rename = (en: string) => (d: ReturnType<typeof blankDraft>) => ({ ...d, name: { ...d.name, en } });

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

it('undoes a burst of edits to one control as one step and separate edits one at a time', () => {
  const input = document.createElement('input');
  input.id = 'class-name';
  document.body.append(input);
  input.focus();
  const { result } = renderHook(() => useClassCreator(null, blankDraft()), { wrapper });

  act(() => result.current.update(rename('B')));
  act(() => result.current.update(rename('Bo')));
  act(() => result.current.update(rename('Bog')));
  act(() => vi.advanceTimersByTime(2_000));
  act(() => result.current.update(rename('Bog Witch')));

  act(() => result.current.undo());
  expect(result.current.draft.name.en).toBe('Bog');
  act(() => result.current.undo());
  expect(result.current.draft.name.en).toBe('');
  expect(result.current.canUndo).toBe(false);

  act(() => result.current.redo());
  expect(result.current.draft.name.en).toBe('Bog');
  input.remove();
});

it('keeps quick edits to different controls as separate undo steps', () => {
  const name = document.createElement('input');
  name.id = 'class-name';
  const other = document.createElement('input');
  other.id = 'class-description';
  document.body.append(name, other);
  const { result } = renderHook(() => useClassCreator(null, blankDraft()), { wrapper });

  name.focus();
  act(() => result.current.update(rename('Bog')));
  other.focus();
  act(() => result.current.update((d) => ({ ...d, description: { ...d.description, en: 'Mire' } })));

  act(() => result.current.undo());
  expect(result.current.draft.name.en).toBe('Bog');
  expect(result.current.draft.description.en).toBe('');
  name.remove();
  other.remove();
});
