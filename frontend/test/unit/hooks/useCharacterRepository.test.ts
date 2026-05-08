import { renderHook } from '@testing-library/react';
import { beforeEach, expect, test, vi } from 'vitest';
import { useCharacterRepository } from '../../../src/hooks/useCharacterRepository.ts';
import { useMutation, useQueryClient } from '@tanstack/react-query';

// Mock the API client
const apiMocks = vi.hoisted(() => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(),
}));

const clientMocks = vi.hoisted(() => ({
  POST: vi.fn(),
}));

vi.mock('@/api', () => ({
  $api: apiMocks,
  client: clientMocks,
  characterKeys: {
    list: () => ['characters', 'list'],
  },
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

test('useCharacterRepository creates a character and refreshes the cached list', async () => {
    const queryClient = {
        setQueryData: vi.fn(),
        invalidateQueries: vi.fn(),
    };
    (useQueryClient as any).mockReturnValue(queryClient);

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

    const { result } = renderHook(() => useCharacterRepository(null, 'en'));

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
    expect(queryClient.setQueryData).toHaveBeenCalled();
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
        queryKey: ['characters', 'list']
    });
});

test('useCharacterRepository surfaces createCharacter API failures', async () => {
    (useQueryClient as any).mockReturnValue({
        setQueryData: vi.fn(),
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
        message: 'The operation was aborted.',
    });
});

test('useCharacterRepository handles deleteCharacter onSuccess', () => {
    const queryClient = {
        removeQueries: vi.fn(),
        invalidateQueries: vi.fn(),
    };
    (useQueryClient as any).mockReturnValue(queryClient);

    let onSuccess: any;
    apiMocks.useMutation.mockImplementation((method: string, path: string, options: any) => {
        if (path === '/api/characters/{id}' && method === 'delete') {
            onSuccess = options.onSuccess;
            return { mutate: vi.fn() };
        }
        return {};
    });

    renderHook(() => useCharacterRepository('char-1'));

    onSuccess({}, { params: { path: { id: 'char-1' } } });
    expect(queryClient.removeQueries).toHaveBeenCalled();
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: ['characters', 'list'] });
});

test('useCharacterRepository handles refetchCharacter', () => {
    const queryClient = {
        invalidateQueries: vi.fn(),
    };
    (useQueryClient as any).mockReturnValue(queryClient);

    const { result } = renderHook(() => useCharacterRepository('char-1'));

    result.current.refetchCharacter();
    expect(queryClient.invalidateQueries).toHaveBeenCalled();
});
