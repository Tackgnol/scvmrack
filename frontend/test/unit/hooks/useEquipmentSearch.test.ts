import { act, renderHook } from '@testing-library/react';
import { beforeEach, expect, test, vi } from 'vitest';

const debounceMocks = vi.hoisted(() => ({
  useDebounce: vi.fn((value: string) => [value]),
}));

const i18nMocks = vi.hoisted(() => ({
  useTranslation: vi.fn(() => ({
    i18n: {
      resolvedLanguage: 'pl-PL',
      language: 'pl-PL',
    },
  })),
}));

const queryMocks = vi.hoisted(() => ({
  useQuery: vi.fn(),
}));

vi.mock('use-debounce', () => ({
  useDebounce: debounceMocks.useDebounce,
}));

vi.mock('react-i18next', () => ({
  useTranslation: i18nMocks.useTranslation,
}));

vi.mock('@tanstack/react-query', () => ({
  useQuery: queryMocks.useQuery,
}));

import { useItem, useItemSearch } from '../../../src/hooks/useEquipmentSearch.ts';

beforeEach(() => {
  queryMocks.useQuery.mockReset();
});

test('useItemSearch returns empty results for blank input and exposes search actions', () => {
  queryMocks.useQuery.mockReturnValue({
    data: [{ id: 1, itemType: 'equipment', key: 'gear.rope', name: 'Rope', tags: [] }],
    isLoading: false,
    error: null,
  });

  const { result } = renderHook(() => useItemSearch());

  expect(result.current.results).toEqual([]);
  expect(result.current.error).toBe(null);
  expect(typeof result.current.search).toBe('function');
  expect(typeof result.current.clearResults).toBe('function');

  expect(queryMocks.useQuery).toHaveBeenCalledWith(
    expect.objectContaining({
      enabled: false,
      queryKey: ['item-search', '', 'pl', 20],
    }),
  );
});

test('useItemSearch trims input and returns query results', () => {
  queryMocks.useQuery.mockImplementation(
    ({ enabled }: { enabled: boolean }) => ({
      data: enabled
        ? [{ id: 2, itemType: 'weapon', key: 'weapon.axe', name: 'Axe', tags: ['weapon'] }]
        : [],
      isLoading: false,
      error: null,
    }),
  );

  const { result } = renderHook(() => useItemSearch({ debounceMs: 0, limit: 5 }));

  act(() => {
    result.current.search('  axe ');
  });

  expect(result.current.results).toEqual([
    { id: 2, itemType: 'weapon', key: 'weapon.axe', name: 'Axe', tags: ['weapon'] },
  ]);
  expect(queryMocks.useQuery).toHaveBeenCalledWith(
    expect.objectContaining({
      enabled: true,
      queryKey: ['item-search', 'axe', 'pl', 5],
    }),
  );

  act(() => {
    result.current.clearResults();
  });
  expect(result.current.results).toEqual([]);
});

test('useItemSearch maps query errors to message text', () => {
  queryMocks.useQuery.mockImplementation(
    ({ enabled }: { enabled: boolean }) => ({
      data: [],
      isLoading: false,
      error: enabled ? new Error('Search failed hard') : null,
    }),
  );

  const { result } = renderHook(() => useItemSearch({ debounceMs: 0 }));
  act(() => {
    result.current.search('dagger');
  });

  expect(result.current.error).toBe('Search failed hard');
});

test('useItem passes expected useQuery options', () => {
  queryMocks.useQuery.mockReturnValue({ data: null, isLoading: false, error: null });
  renderHook(() => useItem('weapon', 12));
  renderHook(() => useItem(undefined, 12));

  expect(queryMocks.useQuery).toHaveBeenNthCalledWith(
    1,
    expect.objectContaining({
      queryKey: ['item', 'weapon', 12],
      enabled: true,
    }),
  );
  expect(queryMocks.useQuery).toHaveBeenNthCalledWith(
    2,
    expect.objectContaining({
      queryKey: ['item', undefined, 12],
      enabled: false,
    }),
  );
});

test('useItemSearch fetchItemSearch logic', async () => {
    const mockHits = [
        { id: 1, key: 'test', name: 'Test', item_type: 'weapon' }
    ];
    global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockHits
    });

    let queryFn: any;
    queryMocks.useQuery.mockImplementation((options: any) => {
        if (options.queryKey[0] === 'item-search') {
            queryFn = options.queryFn;
        }
        return { data: [], isLoading: false, error: null };
    });

    renderHook(() => useItemSearch({ debounceMs: 0 }));

    const results = await queryFn();
    expect(results[0].itemType).toBe('weapon');
    expect(global.fetch).toHaveBeenCalled();
});

test('useItemSearch ignores malformed payload entries and normalizes missing fields', async () => {
    global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [
            null,
            { id: 'bad', key: 'broken', name: 'Broken' },
            { id: 2, key: 'rope', name: 'Rope', item_type: 'equipment' },
            { id: 3, key: 'torch', name: 'Torch', itemType: 'equipment', tags: null },
        ]
    });

    let queryFn: any;
    queryMocks.useQuery.mockImplementation((options: any) => {
        if (options.queryKey[0] === 'item-search') {
            queryFn = options.queryFn;
        }
        return { data: [], isLoading: false, error: null };
    });

    renderHook(() => useItemSearch({ debounceMs: 0 }));

    const results = await queryFn();
    expect(results).toEqual([
        { id: 2, key: 'rope', name: 'Rope', item_type: 'equipment', itemType: 'equipment', tags: [] },
        { id: 3, key: 'torch', name: 'Torch', itemType: 'equipment', tags: [] },
    ]);
});

test('useItemSearch returns an empty list for non-array JSON payloads', async () => {
    global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ unexpected: true })
    });

    let queryFn: any;
    queryMocks.useQuery.mockImplementation((options: any) => {
        if (options.queryKey[0] === 'item-search') {
            queryFn = options.queryFn;
        }
        return { data: [], isLoading: false, error: null };
    });

    renderHook(() => useItemSearch({ debounceMs: 0 }));

    await expect(queryFn()).resolves.toEqual([]);
});

test('useItem fetchFullItem logic', async () => {
    global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ id: 1, name: 'Full' })
    });

    let queryFn: any;
    queryMocks.useQuery.mockImplementation((options: any) => {
        if (options.queryKey[0] === 'item') {
            queryFn = options.queryFn;
        }
        return { data: [], isLoading: false, error: null };
    });

    renderHook(() => useItem('weapon', 1));

    const result = await queryFn();
    expect(result.name).toBe('Full');
    expect(global.fetch).toHaveBeenCalled();
});

test('useItem rejects when full item fetch fails', async () => {
    global.fetch = vi.fn().mockResolvedValue({
        ok: false,
    });

    let queryFn: any;
    queryMocks.useQuery.mockImplementation((options: any) => {
        if (options.queryKey[0] === 'item') {
            queryFn = options.queryFn;
        }
        return { data: [], isLoading: false, error: null };
    });

    renderHook(() => useItem('weapon', 99));

    await expect(queryFn()).rejects.toThrow('Failed to fetch item');
});
