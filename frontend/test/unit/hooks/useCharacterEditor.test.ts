import { act, renderHook } from '@testing-library/react';
import { beforeEach, expect, test, vi } from 'vitest';
import { useCharacterEditor } from '../../../src/hooks/useCharacterEditor.ts';
import { useQueryClient } from '@tanstack/react-query';
import { trackCharacterEdited } from '@/analytics/characterAnalytics';

const snackbarMocks = vi.hoisted(() => ({
  showError: vi.fn(),
}));
const errorFeedbackMocks = vi.hoisted(() => ({
  showUnexpectedError: vi.fn(() => true),
}));

vi.mock('@tanstack/react-query', () => ({
  useQueryClient: vi.fn(),
}));

vi.mock('../../../src/SnackbarContext/SnackbarProvider.tsx', () => ({
  useSnackbar: () => ({ showError: snackbarMocks.showError }),
}));

vi.mock('@/components/molecules/feedback/ErrorFeedbackProvider', () => ({
  useErrorFeedback: () => errorFeedbackMocks,
}));

// Stable, per-instance debounce stub: the debounced call is deferred (no-op) so
// queuing a patch does NOT auto-flush; `.flush()` runs the latest callback. The
// stable identity matters so the unmount-flush effect runs once (on unmount),
// not on every render.
vi.mock('use-debounce', async () => {
  const { useRef } = await import('react');
  return {
    useDebouncedCallback: (fn: (...args: any[]) => any) => {
      const ref = useRef<any>(null);
      if (!ref.current) {
        const handle: any = () => {};
        handle.cancel = () => {};
        handle.flush = () => handle._fn?.();
        ref.current = handle;
      }
      ref.current._fn = fn;
      return ref.current;
    },
  };
});

vi.mock('@/analytics/characterAnalytics', () => ({
  trackCharacterEdited: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string, values?: Record<string, unknown>) => {
      if (key === 'validation.fields.silver') return 'Silver';
      if (!fallback) return key;
      return fallback.replace(/\{\{(\w+)}}/g, (_match, token) =>
        String(values?.[token] ?? '')
      );
    },
  }),
}));

type Store = Record<string, unknown> | undefined;

function makeQueryClient(initial?: Store) {
  let store: Store = initial;
  return {
    getQueryData: vi.fn(() => store),
    setQueryData: vi.fn((_key: unknown, updater: unknown) => {
      store = typeof updater === 'function' ? (updater as any)(store) : (updater as Store);
      return store;
    }),
    invalidateQueries: vi.fn(),
    cancelQueries: vi.fn(),
    current: () => store,
  };
}

const noopMutation = () => ({ mutate: vi.fn(), isPending: false }) as any;

beforeEach(() => {
  vi.clearAllMocks();
  errorFeedbackMocks.showUnexpectedError.mockReturnValue(true);
});

test('queues patches and applies them optimistically to the cache', () => {
  const queryClient = makeQueryClient();
  (useQueryClient as any).mockReturnValue(queryClient);

  const { result } = renderHook(() =>
    useCharacterEditor('char-1', noopMutation(), (id) => ['char', id])
  );

  act(() => {
    result.current.updateField('name', 'New Name');
  });

  expect(queryClient.setQueryData).toHaveBeenCalledWith(
    ['char', 'char-1'],
    expect.any(Function)
  );
  const updater = (queryClient.setQueryData as any).mock.calls[0][1];
  expect(updater({ name: 'Old' })).toEqual({ name: 'New Name' });
});

test('flushes the queued patch to the server', () => {
  const queryClient = makeQueryClient({ id: 'char-1', name: 'Old' });
  (useQueryClient as any).mockReturnValue(queryClient);
  const mutation = noopMutation();

  const { result } = renderHook(() =>
    useCharacterEditor('char-1', mutation, (id) => ['char', id])
  );

  act(() => result.current.updateField('name', 'New Name'));
  act(() => result.current.flush());

  expect(mutation.mutate).toHaveBeenCalledWith(
    expect.objectContaining({ body: { name: 'New Name' } }),
    expect.any(Object)
  );
});

test('rejects invalid simple fields and keeps them out of the save queue', () => {
  const queryClient = makeQueryClient({ id: 'char-1', silver: 10 });
  (useQueryClient as any).mockReturnValue(queryClient);
  const mutation = noopMutation();

  const { result } = renderHook(() =>
    useCharacterEditor('char-1', mutation, (id) => ['char', id], 'en')
  );

  act(() => result.current.updateField('silver', 1000001));

  expect(snackbarMocks.showError).toHaveBeenCalledWith(
    'Silver must be between 0 and 1000000'
  );
  expect(queryClient.setQueryData).not.toHaveBeenCalled();

  act(() => result.current.flush());
  expect(mutation.mutate).not.toHaveBeenCalled();

  act(() => result.current.updateField('silver', 20));
  expect(queryClient.setQueryData).toHaveBeenCalled();
});

test('serializes flushes and builds each from the latest optimistic state', () => {
  const sword = { key: 'sword', name: 'Sword' };
  const torch = { key: 'torch', name: 'Torch' };
  const queryClient = makeQueryClient({
    id: 'char-1',
    equipment: [],
    storage: [],
    equippedWeapons: [],
    equippedArmor: null,
    modifiers: [],
  });
  (useQueryClient as any).mockReturnValue(queryClient);
  const mutation = noopMutation();

  const { result } = renderHook(() =>
    useCharacterEditor('char-1', mutation, (id) => ['char', id])
  );

  act(() => result.current.addEquipmentItem(sword as any));
  act(() => result.current.flush());

  // Settle the first save with the server's authoritative copy.
  const cb1 = (mutation.mutate as any).mock.calls[0][1];
  act(() => {
    cb1.onSuccess({ ...(queryClient.current() as object), equipment: [sword] });
    cb1.onSettled();
  });

  act(() => result.current.addEquipmentItem(torch as any));
  act(() => result.current.flush());

  expect(mutation.mutate).toHaveBeenNthCalledWith(
    1,
    expect.objectContaining({ body: expect.objectContaining({ equipment: [sword] }) }),
    expect.any(Object)
  );
  expect(mutation.mutate).toHaveBeenNthCalledWith(
    2,
    expect.objectContaining({
      body: expect.objectContaining({ equipment: [sword, torch] }),
    }),
    expect.any(Object)
  );
});

test('REGRESSION: does not lose an edit queued while a save is in flight', () => {
  const queryClient = makeQueryClient({ id: 'char-1', name: 'A0', silver: 0 });
  (useQueryClient as any).mockReturnValue(queryClient);
  const mutation = noopMutation();

  const { result } = renderHook(() =>
    useCharacterEditor('char-1', mutation, (id) => ['char', id])
  );

  // Edit #1 and start the flush.
  act(() => result.current.updateField('name', 'A'));
  act(() => result.current.flush());
  expect(mutation.mutate).toHaveBeenCalledTimes(1);

  // Edit #2 arrives while #1 is still in flight.
  act(() => result.current.updateField('silver', 20));

  // The first save settles with a server copy that predates edit #2.
  const cb1 = (mutation.mutate as any).mock.calls[0][1];
  act(() => {
    cb1.onSuccess({ id: 'char-1', name: 'A', silver: 0 });
    cb1.onSettled();
  });

  // Edit #2 must survive: still pending and preserved in the cache (NOT reverted
  // to the server's silver:0), and flushable.
  expect(result.current.isSaving).toBe(true);
  expect((queryClient.current() as any).silver).toBe(20);

  act(() => result.current.flush());
  expect(mutation.mutate).toHaveBeenNthCalledWith(
    2,
    expect.objectContaining({ body: expect.objectContaining({ silver: 20 }) }),
    expect.any(Object)
  );
});

test('REGRESSION: language switches before flush keep queued equipment visible and saveable', () => {
  const torch = { key: 'equipment.torch', name: 'Torch' };
  const stalePolishCharacter = {
    id: 'char-1',
    equipment: [],
    storage: [],
    equippedWeapons: [],
    equippedArmor: null,
    modifiers: [],
  };
  const queryClient = makeQueryClient(stalePolishCharacter);
  (useQueryClient as any).mockReturnValue(queryClient);
  const mutation = noopMutation();

  const { result, rerender } = renderHook(
    ({ locale }) =>
      useCharacterEditor(
        'char-1',
        mutation,
        (id, activeLocale) => ['char', id, activeLocale],
        locale
      ),
    { initialProps: { locale: 'en' } }
  );

  act(() => result.current.addEquipmentItem(torch as any));
  rerender({ locale: 'pl' });

  expect(
    result.current.getVisibleCharacter(stalePolishCharacter)?.equipment
  ).toEqual([torch]);

  act(() => result.current.flush());

  expect(mutation.mutate).toHaveBeenCalledWith(
    expect.objectContaining({
      params: expect.objectContaining({
        query: { locale: 'pl' },
      }),
      body: expect.objectContaining({ equipment: [torch] }),
    }),
    expect.any(Object)
  );
});

test('REGRESSION: stale localized refetches do not hide a newer saved character', () => {
  const torch = { key: 'equipment.torch', name: 'Torch' };
  const queryClient = makeQueryClient({
    id: 'char-1',
    equipment: [],
    storage: [],
    equippedWeapons: [],
    equippedArmor: null,
    modifiers: [],
    updatedAt: '2026-06-24T10:00:00.000Z',
  });
  (useQueryClient as any).mockReturnValue(queryClient);
  const mutation = noopMutation();

  const { result } = renderHook(() =>
    useCharacterEditor(
      'char-1',
      mutation,
      (id, locale) => ['char', id, locale],
      'en'
    )
  );

  act(() => result.current.addEquipmentItem(torch as any));
  act(() => result.current.flush());

  const cb = (mutation.mutate as any).mock.calls[0][1];
  const serverCopy = {
    id: 'char-1',
    equipment: [torch],
    storage: [],
    equippedWeapons: [],
    equippedArmor: null,
    modifiers: [],
    updatedAt: '2026-06-24T10:00:05.000Z',
  };

  act(() => cb.onSuccess(serverCopy));

  expect(
    result.current.getVisibleCharacter({
      id: 'char-1',
      equipment: [],
      updatedAt: '2026-06-24T10:00:01.000Z',
    } as any)?.equipment
  ).toEqual([torch]);
});

test('REGRESSION: auto-retries a transient 5xx instead of dropping the edit', () => {
  const queryClient = makeQueryClient({ id: 'char-1', name: 'A0' });
  (useQueryClient as any).mockReturnValue(queryClient);
  const mutation = noopMutation();

  const { result } = renderHook(() =>
    useCharacterEditor('char-1', mutation, (id) => ['char', id])
  );

  act(() => result.current.updateField('name', 'A'));
  act(() => result.current.flush());

  const cb1 = (mutation.mutate as any).mock.calls[0][1];
  act(() => {
    cb1.onError({ statusCode: 500 }, undefined, {});
    cb1.onSettled();
  });

  // First failure: no toast, edit retained for retry.
  expect(snackbarMocks.showError).not.toHaveBeenCalled();
  expect(errorFeedbackMocks.showUnexpectedError).not.toHaveBeenCalled();
  expect(result.current.isSaving).toBe(true);

  // The retry re-sends the same edit.
  act(() => result.current.flush());
  expect(mutation.mutate).toHaveBeenCalledTimes(2);
});

test('reports repeated 5xx saves after the retry tolerance and keeps a manual retry', () => {
  const queryClient = makeQueryClient({ id: 'char-1' });
  (useQueryClient as any).mockReturnValue(queryClient);
  const mutation = noopMutation();

  const { result } = renderHook(() =>
    useCharacterEditor('char-1', mutation, (id) => [id])
  );

  act(() => result.current.updateField('currentHp', 10));
  act(() => result.current.flush());

  const cb = (mutation.mutate as any).mock.calls[0][1];
  const serverError = {
    statusCode: 500,
    code: 'INTERNAL_ERROR',
    message: 'Unexpected error occurred.',
  };

  act(() => {
    cb.onError(serverError, undefined, {});
    cb.onError(serverError, undefined, {});
  });
  expect(errorFeedbackMocks.showUnexpectedError).not.toHaveBeenCalled();
  expect(snackbarMocks.showError).not.toHaveBeenCalled();

  act(() => cb.onError(serverError, undefined, {}));

  expect(errorFeedbackMocks.showUnexpectedError).toHaveBeenCalledWith(
    serverError,
    expect.objectContaining({
      source: 'character_save',
      operation: 'patch_character',
      characterId: 'char-1',
    })
  );
  expect(snackbarMocks.showError).toHaveBeenCalledWith(
    'Unexpected error occurred.',
    expect.objectContaining({ label: 'Retry', onClick: expect.any(Function) })
  );
});

test('rolls back and drops the batch on a terminal client (4xx) error', () => {
  const previous = { id: 'char-1', name: 'A0' };
  const queryClient = makeQueryClient({ id: 'char-1', name: 'A' });
  (useQueryClient as any).mockReturnValue(queryClient);
  const mutation = noopMutation();

  const { result } = renderHook(() =>
    useCharacterEditor('char-1', mutation, (id) => ['char', id])
  );

  act(() => result.current.updateField('name', 'A'));
  act(() => result.current.flush());

  const cb = (mutation.mutate as any).mock.calls[0][1];
  act(() => {
    cb.onError({ statusCode: 400, message: 'Bad' }, undefined, {
      previousCharacter: previous,
    });
    cb.onSettled();
  });

  // Cache rolled back to the pre-edit snapshot, batch dropped (not saving).
  expect((queryClient.current() as any).name).toBe('A0');
  expect(result.current.isSaving).toBe(false);
  expect(snackbarMocks.showError).toHaveBeenCalled();
});

test('writes the server response into the cache on success (no extra refetch)', () => {
  const queryClient = makeQueryClient({ id: 'char-1', equipment: [] });
  (useQueryClient as any).mockReturnValue(queryClient);
  const mutation = noopMutation();

  const { result } = renderHook(() =>
    useCharacterEditor(
      'char-1',
      mutation,
      (id, locale) => ['char', id, locale],
      'pl'
    )
  );

  act(() => result.current.addEquipmentItem({ key: 'torch', name: 'Torch' } as any));
  act(() => result.current.flush());

  const cb = (mutation.mutate as any).mock.calls[0][1];
  const serverCopy = {
    id: 'char-1',
    equipment: [{ key: 'torch', name: 'Torch', uses: [true, true] }],
  };
  act(() => cb.onSuccess(serverCopy));

  expect(trackCharacterEdited).toHaveBeenCalledWith(
    [expect.objectContaining({ kind: 'equipment-add' })],
    'pl'
  );
  // Cache now holds the hydrated server copy; we do NOT invalidate/refetch it.
  expect(queryClient.current()).toEqual(serverCopy);
  expect(queryClient.invalidateQueries).not.toHaveBeenCalled();
});

test('surfaces rate limits without a retry action and keeps the edit queued', () => {
  const queryClient = makeQueryClient({ id: 'char-1', name: 'A0' });
  (useQueryClient as any).mockReturnValue(queryClient);
  const mutation = noopMutation();

  const { result } = renderHook(() =>
    useCharacterEditor('char-1', mutation, (id) => [id])
  );

  act(() => result.current.updateField('name', 'A'));
  act(() => result.current.flush());

  const cb = (mutation.mutate as any).mock.calls[0][1];
  act(() => cb.onError({ status: 429 }, undefined, {}));

  expect(snackbarMocks.showError).toHaveBeenCalledWith(
    'Too many requests. Please try again later.'
  );
  // Edit is retained (not lost) so it can be resent later.
  expect(result.current.isSaving).toBe(true);
});

test('REGRESSION: flushes a pending edit on unmount instead of dropping it', () => {
  const queryClient = makeQueryClient({ id: 'char-1', name: 'A0' });
  (useQueryClient as any).mockReturnValue(queryClient);
  const mutation = noopMutation();

  const { result, unmount } = renderHook(() =>
    useCharacterEditor('char-1', mutation, (id) => ['char', id])
  );

  // Queue an edit but never call flush() explicitly (debounce is deferred).
  act(() => result.current.updateField('name', 'A'));
  expect(mutation.mutate).not.toHaveBeenCalled();

  unmount();

  expect(mutation.mutate).toHaveBeenCalledWith(
    expect.objectContaining({ body: { name: 'A' } }),
    expect.any(Object)
  );
});

test('supports equipment, storage, and modifier operations end to end', () => {
  const queryClient = makeQueryClient({
    id: 'char-1',
    equipment: [],
    storage: [],
    modifiers: [],
  });
  (useQueryClient as any).mockReturnValue(queryClient);
  const mutation = noopMutation();

  const { result } = renderHook(() =>
    useCharacterEditor('char-1', mutation, (id) => [id])
  );

  act(() => {
    result.current.addEquipmentItem({ key: 'sword', name: 'Sword' } as any);
    result.current.addStorageItem({ key: 'potion', name: 'Potion' } as any);
    result.current.addModifier({
      id: 'mod-1',
      name: 'Bonus',
      type: 'stat',
      stat: 'strength',
      value: 1,
    } as any);
    result.current.updateModifier('mod-1', { value: 2 });
  });

  act(() => result.current.flush());
  expect(mutation.mutate).toHaveBeenCalled();
});
