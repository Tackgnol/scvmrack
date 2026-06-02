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

vi.mock('use-debounce', () => ({
  useDebouncedCallback: (fn: any) => {
    const callback = (...args: any[]) => fn(...args);
    callback.cancel = vi.fn();
    return callback;
  },
}));

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

beforeEach(() => {
  vi.clearAllMocks();
  errorFeedbackMocks.showUnexpectedError.mockReturnValue(true);
});

test('useCharacterEditor queues patches and applies them optimistically', () => {
  const queryClient = {
    getQueryData: vi.fn(),
    setQueryData: vi.fn(),
  };
  (useQueryClient as any).mockReturnValue(queryClient);

  const mutate = vi.fn();
  const updateCharacter = { mutate, isPending: false } as any;
  const getCharacterKey = (id: string) => ['char', id];

  const { result } = renderHook(() =>
    useCharacterEditor('char-1', updateCharacter, getCharacterKey)
  );

  act(() => {
    result.current.updateField('name', 'New Name');
  });

  expect(queryClient.setQueryData).toHaveBeenCalledWith(
    ['char', 'char-1'],
    expect.any(Function)
  );

  // Verify optimistic update logic
  const updater = (queryClient.setQueryData as any).mock.calls[0][1];
  const oldChar = { name: 'Old' };
  expect(updater(oldChar)).toEqual({ name: 'New Name' });
});

test('useCharacterEditor flushes patches to server', () => {
  const character = { id: 'char-1', name: 'Old' };
  const queryClient = {
    getQueryData: vi.fn().mockReturnValue(character),
    setQueryData: vi.fn(),
  };
  (useQueryClient as any).mockReturnValue(queryClient);

  const mutate = vi.fn();
  const updateCharacter = { mutate, isPending: false } as any;
  const getCharacterKey = (id: string) => ['char', id];

  const { result } = renderHook(() =>
    useCharacterEditor('char-1', updateCharacter, getCharacterKey)
  );

  act(() => {
    result.current.updateField('name', 'New Name');
  });

  act(() => {
    result.current.flush();
  });

  expect(mutate).toHaveBeenCalledWith(
    expect.objectContaining({
      body: { name: 'New Name' },
    }),
    expect.any(Object)
  );
});

test('useCharacterEditor rejects invalid simple fields and keeps them out of the save queue', () => {
  const queryClient = {
    getQueryData: vi.fn().mockReturnValue({ id: 'char-1', silver: 10 }),
    setQueryData: vi.fn(),
  };
  (useQueryClient as any).mockReturnValue(queryClient);

  const mutate = vi.fn();
  const updateCharacter = { mutate, isPending: false } as any;
  const setValidationIssue = vi.fn();
  const clearValidationIssue = vi.fn();

  const { result } = renderHook(() =>
    useCharacterEditor('char-1', updateCharacter, (id) => ['char', id], 'en', {
      setValidationIssue,
      clearValidationIssue,
    })
  );

  act(() => {
    result.current.updateField('silver', 1000001);
  });

  expect(setValidationIssue).toHaveBeenCalledWith(
    'field:silver',
    'Silver must be between 0 and 1000000'
  );
  expect(snackbarMocks.showError).not.toHaveBeenCalled();
  expect(queryClient.setQueryData).not.toHaveBeenCalled();

  act(() => {
    result.current.flush();
  });

  expect(mutate).not.toHaveBeenCalled();

  act(() => {
    result.current.updateField('silver', 20);
  });

  expect(clearValidationIssue).toHaveBeenCalledWith('field:silver');
  expect(queryClient.setQueryData).toHaveBeenCalledWith(
    ['char', 'char-1'],
    expect.any(Function)
  );
});

test('useCharacterEditor builds later flushes from the latest optimistic character state', () => {
  const sword = { key: 'sword', name: 'Sword' };
  const torch = { key: 'torch', name: 'Torch' };
  let character = {
    id: 'char-1',
    equipment: [] as Array<{ key: string; name: string }>,
    storage: [],
    equippedWeapons: [],
    equippedArmor: null,
    modifiers: [],
  };

  const queryClient = {
    getQueryData: vi.fn(() => character),
    setQueryData: vi.fn((_key, updater) => {
      character = typeof updater === 'function' ? updater(character) : updater;
    }),
  };
  (useQueryClient as any).mockReturnValue(queryClient);

  const mutate = vi.fn();
  const updateCharacter = { mutate, isPending: false } as any;

  const { result } = renderHook(() =>
    useCharacterEditor('char-1', updateCharacter, (id) => ['char', id])
  );

  act(() => {
    result.current.addEquipmentItem(sword as any);
  });

  act(() => {
    result.current.flush();
  });

  act(() => {
    result.current.addEquipmentItem(torch as any);
  });

  act(() => {
    result.current.flush();
  });

  expect(mutate).toHaveBeenNthCalledWith(
    1,
    expect.objectContaining({
      body: expect.objectContaining({
        equipment: [sword],
      }),
    }),
    expect.any(Object)
  );
  expect(mutate).toHaveBeenNthCalledWith(
    2,
    expect.objectContaining({
      body: expect.objectContaining({
        equipment: [sword, torch],
      }),
    }),
    expect.any(Object)
  );
});

test('useCharacterEditor handles failed save and retries', () => {
  const character = { id: 'char-1' };
  const queryClient = {
    getQueryData: vi.fn().mockReturnValue(character),
    setQueryData: vi.fn(),
  };
  (useQueryClient as any).mockReturnValue(queryClient);

  const mutate = vi.fn();
  const updateCharacter = { mutate, isPending: false } as any;

  const { result } = renderHook(() =>
    useCharacterEditor('char-1', updateCharacter, (id) => [id])
  );

  act(() => {
    result.current.updateField('hp', 10);
  });

  act(() => {
    result.current.flush();
  });

  expect(mutate).toHaveBeenCalled();
  const options = mutate.mock.calls[0][1];
  expect(options.onError).toBeInstanceOf(Function);

  const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
  act(() => {
    options.onError(new Error('Fail 1'));
  });
  expect(spy).toHaveBeenCalled();
  spy.mockRestore();
  // This increments internal retryCountRef.
});

test('useCharacterEditor reports repeated 5xx saves after retry tolerance and keeps retry action', () => {
  const character = { id: 'char-1' };
  const queryClient = {
    getQueryData: vi.fn().mockReturnValue(character),
    setQueryData: vi.fn(),
  };
  (useQueryClient as any).mockReturnValue(queryClient);

  const mutate = vi.fn();
  const updateCharacter = { mutate, isPending: false } as any;

  const { result } = renderHook(() =>
    useCharacterEditor('char-1', updateCharacter, (id) => [id])
  );

  act(() => {
    result.current.updateField('hp', 10);
  });
  act(() => {
    result.current.flush();
  });

  const callbacks = mutate.mock.calls[0][1];
  const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
  const serverError = {
    statusCode: 500,
    code: 'INTERNAL_ERROR',
    message: 'Unexpected error occurred.',
  };

  act(() => {
    callbacks.onError(serverError);
    callbacks.onError(serverError);
  });

  expect(errorFeedbackMocks.showUnexpectedError).not.toHaveBeenCalled();
  expect(snackbarMocks.showError).not.toHaveBeenCalled();

  act(() => {
    callbacks.onError(serverError);
  });

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
    expect.objectContaining({
      label: 'Retry',
      onClick: expect.any(Function),
    })
  );
  spy.mockRestore();
});

test('useCharacterEditor supports equipment and storage operations', () => {
  const character = { id: 'char-1', equipment: [], storage: [] };
  const queryClient = {
    getQueryData: vi.fn().mockReturnValue(character),
    setQueryData: vi.fn(),
  };
  (useQueryClient as any).mockReturnValue(queryClient);

  const mutate = vi.fn();
  const updateCharacter = { mutate, isPending: false } as any;

  const { result } = renderHook(() =>
    useCharacterEditor('char-1', updateCharacter, (id) => [id])
  );

  act(() => {
    result.current.addEquipmentItem({ key: 'sword', name: 'Sword' } as any);
    result.current.addStorageItem({ key: 'potion', name: 'Potion' } as any);
    result.current.moveToStorage(0);
    result.current.moveToEquipment(0);
  });

  act(() => {
    result.current.flush();
  });

  expect(mutate).toHaveBeenCalled();
});

test('useCharacterEditor supports modifier operations', () => {
  const character = { id: 'char-1', customModifiers: [] };
  const queryClient = {
    getQueryData: vi.fn().mockReturnValue(character),
    setQueryData: vi.fn(),
  };
  (useQueryClient as any).mockReturnValue(queryClient);

  const mutate = vi.fn();
  const updateCharacter = { mutate, isPending: false } as any;

  const { result } = renderHook(() =>
    useCharacterEditor('char-1', updateCharacter, (id) => [id])
  );

  act(() => {
    result.current.addModifier({
      id: 'mod-1',
      name: 'Bonus',
      type: 'stat',
      stat: 'strength',
      value: 1,
    });
    result.current.updateModifier('mod-1', { value: 2 });
    result.current.removeModifier('mod-1');
  });

  act(() => {
    result.current.flush();
  });

  expect(mutate).toHaveBeenCalled();
});

test('useCharacterEditor tracks successful equipment saves and invalidates hydrated character data', () => {
  const character = { id: 'char-1', equipment: [] };
  const queryClient = {
    getQueryData: vi.fn().mockReturnValue(character),
    setQueryData: vi.fn(),
    invalidateQueries: vi.fn(),
  };
  (useQueryClient as any).mockReturnValue(queryClient);

  const mutate = vi.fn();
  const updateCharacter = { mutate, isPending: false } as any;

  const { result } = renderHook(() =>
    useCharacterEditor('char-1', updateCharacter, (id, locale) => [
      'char',
      id,
      locale,
    ], 'pl')
  );

  act(() => {
    result.current.addEquipmentItem({ key: 'torch', name: 'Torch' } as any);
  });

  act(() => {
    result.current.flush();
  });

  const callbacks = mutate.mock.calls[0][1];
  act(() => {
    callbacks.onSuccess();
  });

  expect(trackCharacterEdited).toHaveBeenCalledWith(
    [expect.objectContaining({ kind: 'equipment-add' })],
    'pl'
  );
  expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
    queryKey: ['char', 'char-1', 'pl'],
  });
});

test('useCharacterEditor surfaces rate limits without retry actions', () => {
  const character = { id: 'char-1' };
  const queryClient = {
    getQueryData: vi.fn().mockReturnValue(character),
    setQueryData: vi.fn(),
  };
  (useQueryClient as any).mockReturnValue(queryClient);

  const mutate = vi.fn();
  const updateCharacter = { mutate, isPending: false } as any;

  const { result } = renderHook(() =>
    useCharacterEditor('char-1', updateCharacter, (id) => [id])
  );

  act(() => {
    result.current.updateField('hp', 10);
  });
  act(() => {
    result.current.flush();
  });

  const callbacks = mutate.mock.calls[0][1];
  const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
  act(() => {
    callbacks.onError({ status: 429 });
  });

  expect(snackbarMocks.showError).toHaveBeenCalledWith(
    'Too many requests. Please try again later.'
  );
  spy.mockRestore();
});
