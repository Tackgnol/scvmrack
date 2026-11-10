import { renderHook } from '@testing-library/react';
import { beforeEach, expect, test, vi } from 'vitest';
import { useCharacterRepository } from '../../../src/hooks/useCharacterRepository.ts';
import { QueryClient, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  characterDetailKey,
  characterRosterKey,
  ownedCharactersKey,
  readCharacter,
  writeCharacter,
} from '@/api/characterCache';

// Mock the API client
const apiMocks = vi.hoisted(() => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(),
}));

const clientMocks = vi.hoisted(() => ({
  POST: vi.fn(),
}));

vi.mock('@/api', () => ({
  authKeys: { session: () => ['auth', 'session'] },
  $api: apiMocks,
  client: clientMocks,
}));

vi.mock('@/auth', () => ({
  ensureAnonymousSession: vi.fn().mockResolvedValue({ session: {}, user: { id: 'guest', isAnonymous: true } }),
}));

vi.mock('@tanstack/react-query', async () => {
    const actual = await vi.importActual('@tanstack/react-query');
    return {
        ...actual,
        useQueryClient: vi.fn(),
        useMutation: vi.fn(),
    };
});

beforeEach(() => {
  vi.clearAllMocks();
});

const apiListKey = [...characterRosterKey(), { params: { query: { locale: 'en' } } }];

/** A real cache holding both character lists, returned by the mocked `useQueryClient`. */
function realCache() {
  const queryClient = new QueryClient();
  queryClient.setQueryData(ownedCharactersKey, []);
  queryClient.setQueryData(apiListKey, []);
  (useQueryClient as any).mockReturnValue(queryClient);
  return {
    queryClient,
    isStale: (key: readonly unknown[]) => queryClient.getQueryState(key)?.isInvalidated,
  };
}

/** The options the hook passed to `$api.useMutation` for one method of `/api/characters/{id}`. */
function captureMutationOptions(method: 'patch' | 'delete') {
  const captured: { options?: any } = {};
  apiMocks.useMutation.mockImplementation((calledMethod: string, _path: string, options: any) => {
    if (calledMethod === method) {
      captured.options = options;
    }
    return { mutate: vi.fn() };
  });
  return captured;
}

test('useCharacterRepository returns character data and loading state', () => {
  const queryClient = {
    setQueryData: vi.fn(),
    invalidateQueries: vi.fn(),
    cancelQueries: vi.fn(),
    getQueryData: vi.fn(),
    removeQueries: vi.fn(),
  };
  (useQueryClient as any).mockReturnValue(queryClient);

  apiMocks.useQuery.mockReturnValue({
    data: { id: 'char-123', name: 'Test' },
    isLoading: false,
    error: null,
  });

  apiMocks.useMutation.mockReturnValue({});
  (useMutation as any).mockReturnValue({});

  const { result } = renderHook(() => useCharacterRepository('char-123'));

  expect(result.current.character?.id).toBe('char-123');
  expect(apiMocks.useQuery).toHaveBeenCalledWith(
    'get',
    '/api/characters/{id}',
    expect.objectContaining({
        params: expect.objectContaining({
            path: { id: 'char-123' }
        })
    }),
    expect.any(Object)
  );
});

test('REGRESSION: keeps the previous locale data visible while a locale switch refetches (RPG-56/RPG-64)', () => {
  const queryClient = {
    setQueryData: vi.fn(),
    invalidateQueries: vi.fn(),
    cancelQueries: vi.fn(),
    getQueryData: vi.fn(),
    removeQueries: vi.fn(),
  };
  (useQueryClient as any).mockReturnValue(queryClient);

  apiMocks.useQuery.mockReturnValue({
    data: { id: 'char-123', name: 'Test' },
    isLoading: false,
    error: null,
  });
  apiMocks.useMutation.mockReturnValue({});
  (useMutation as any).mockReturnValue({});

  renderHook(() => useCharacterRepository('char-123', 'pl'));

  expect(apiMocks.useQuery).toHaveBeenCalledWith(
    'get',
    '/api/characters/{id}',
    expect.any(Object),
    expect.objectContaining({ placeholderData: expect.any(Function) })
  );
  const placeholder = apiMocks.useQuery.mock.calls[0][3].placeholderData;
  const sameScvm = { id: 'char-123', name: 'Previous locale' };
  expect(placeholder(sameScvm)).toBe(sameScvm);
  expect(placeholder({ id: 'other-scvm', name: 'Another character' })).toBeUndefined();
});

test('useCharacterRepository creates a character and refreshes the cached list', async () => {
    const { queryClient, isStale } = realCache();

    (useMutation as any).mockImplementation(({ mutationFn, onSuccess }: any) => {
        return {
            mutateAsync: async (vars: any) => {
                const result = await mutationFn(vars);
                onSuccess?.(result, vars, undefined);
                return result;
            }
        };
    });

    apiMocks.useQuery.mockReturnValue({});
    apiMocks.useMutation.mockReturnValue({});

    clientMocks.POST.mockResolvedValue({ data: { id: 'new-char' }, error: null });

    const { result } = renderHook(() => useCharacterRepository(null, 'en-US'));

    await expect(
        result.current.createCharacter.mutateAsync({
            body: { classId: 1 },
            params: { query: { locale: 'en' } }
        })
    ).resolves.toEqual({ id: 'new-char' });

    expect(clientMocks.POST).toHaveBeenCalledWith('/api/characters/new', {
        body: { classId: 1 },
        params: { query: { locale: 'en' } },
        signal: undefined,
    });
    expect(readCharacter(queryClient, 'new-char', 'en')).toEqual({ id: 'new-char' });
    expect(isStale(ownedCharactersKey)).toBe(true);
    expect(isStale(apiListKey)).toBe(true);
});

test('useCharacterRepository surfaces createCharacter API failures', async () => {
    (useQueryClient as any).mockReturnValue({
        setQueryData: vi.fn(),
        getQueryData: vi.fn(),
        invalidateQueries: vi.fn(),
    });

    (useMutation as any).mockImplementation(({ mutationFn }: any) => ({
        mutateAsync: mutationFn,
    }));

    apiMocks.useQuery.mockReturnValue({});
    apiMocks.useMutation.mockReturnValue({});
    clientMocks.POST.mockResolvedValue({ data: null, error: { message: 'gateway exploded' } });

    const { result } = renderHook(() => useCharacterRepository(null));

    await expect(
        result.current.createCharacter.mutateAsync({
            body: {},
            params: { query: { locale: 'en' } }
        })
    ).rejects.toThrow('gateway exploded');
});

test('useCharacterRepository reports createCharacter aborts as AbortError', async () => {
    (useQueryClient as any).mockReturnValue({
        setQueryData: vi.fn(),
        getQueryData: vi.fn(),
        invalidateQueries: vi.fn(),
    });

    (useMutation as any).mockImplementation(({ mutationFn }: any) => ({
        mutateAsync: mutationFn,
    }));

    apiMocks.useQuery.mockReturnValue({});
    apiMocks.useMutation.mockReturnValue({});
    clientMocks.POST.mockResolvedValue({ data: null, error: { message: 'request cancelled' } });

    const controller = new AbortController();
    controller.abort();

    const { result } = renderHook(() => useCharacterRepository(null));

    await expect(
        result.current.createCharacter.mutateAsync({
            body: {},
            params: { query: { locale: 'en' } },
            signal: controller.signal,
        })
    ).rejects.toMatchObject({
        name: 'AbortError',
    });
});

test('useCharacterRepository handles deleteCharacter onSuccess', () => {
    const { queryClient, isStale } = realCache();
    writeCharacter(queryClient, 'char-1', 'pl', { id: 'char-1' });
    const deletion = captureMutationOptions('delete');

    renderHook(() => useCharacterRepository('char-1', 'pl-PL'));

    deletion.options.onSuccess({}, { params: { path: { id: 'char-1' } } });
    expect(readCharacter(queryClient, 'char-1', 'pl')).toBeUndefined();
    expect(isStale(ownedCharactersKey)).toBe(true);
    expect(isStale(apiListKey)).toBe(true);
});

test('useCharacterRepository snapshots the cached character before a save', async () => {
    const { queryClient } = realCache();
    const cached = { id: 'char-1', name: 'Before' };
    writeCharacter(queryClient, 'char-1', 'en', cached);
    const update = captureMutationOptions('patch');

    renderHook(() => useCharacterRepository('char-1', 'en-US'));

    await expect(
        update.options.onMutate({ params: { path: { id: 'char-1' } } })
    ).resolves.toMatchObject({ previousCharacter: cached });
});

test('REGRESSION: a settled save marks the lists stale but never the saved character', () => {
    const { queryClient, isStale } = realCache();
    writeCharacter(queryClient, 'char-1', 'en', { id: 'char-1' });
    writeCharacter(queryClient, 'char-1', 'pl', { id: 'char-1' });
    const update = captureMutationOptions('patch');

    renderHook(() => useCharacterRepository('char-1', 'en'));

    update.options.onSettled();
    expect(isStale(ownedCharactersKey)).toBe(true);
    expect(isStale(apiListKey)).toBe(true);
    expect(isStale(characterDetailKey('char-1', 'en'))).toBe(false);
    expect(isStale(characterDetailKey('char-1', 'pl'))).toBe(false);
});

test('useCharacterRepository handles refetchCharacter', () => {
    const { queryClient, isStale } = realCache();
    writeCharacter(queryClient, 'char-1', 'en', { id: 'char-1' });
    writeCharacter(queryClient, 'char-1', 'pl', { id: 'char-1' });

    const { result } = renderHook(() => useCharacterRepository('char-1', 'en-US'));

    result.current.refetchCharacter();
    expect(isStale(characterDetailKey('char-1', 'en'))).toBe(true);
    expect(isStale(characterDetailKey('char-1', 'pl'))).toBe(false);
    expect(isStale(apiListKey)).toBe(false);
});
