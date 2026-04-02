import { act, renderHook } from '@testing-library/react';
import { beforeEach, expect, test, vi } from 'vitest';

const historyMocks = vi.hoisted(() => ({
  listener: null as null | (() => void),
  subscribe: vi.fn((listener: () => void) => {
    historyMocks.listener = listener;
    return () => {};
  }),
  location: {
    pathname: '/',
    search: '',
    hash: '',
  },
}));

const navigationMocks = vi.hoisted(() => ({
  currentCharacterId: null as string | null,
  getCurrentCharacterIdParam: vi.fn(() => navigationMocks.currentCharacterId),
  setCurrentCharacterIdParam: vi.fn(async (_id: string | null) => {}),
}));

vi.mock('@/router/history', () => ({
  appHistory: {
    subscribe: historyMocks.subscribe,
    location: historyMocks.location,
  },
}));

vi.mock('@/router/navigation', () => ({
  getCurrentCharacterIdParam: navigationMocks.getCurrentCharacterIdParam,
  setCurrentCharacterIdParam: navigationMocks.setCurrentCharacterIdParam,
}));

import { useCharacterId } from '../../../src/hooks/useCharacterId.ts';

const LAST_CHARACTER_ID_STORAGE_KEY = 'last-character-id';

beforeEach(() => {
  localStorage.clear();
  navigationMocks.currentCharacterId = null;
  navigationMocks.getCurrentCharacterIdParam.mockClear();
  navigationMocks.setCurrentCharacterIdParam.mockClear();
  historyMocks.subscribe.mockClear();
  historyMocks.listener = null;
});

test('useCharacterId initializes from query param', () => {
  navigationMocks.currentCharacterId = 'char-123';

  const { result } = renderHook(() => useCharacterId());

  expect(result.current.characterId).toBe('char-123');
  expect(result.current.lastCharacterId).toBe('char-123');
});

test('useCharacterId initializes lastCharacterId from localStorage when query param is absent', () => {
  localStorage.setItem(LAST_CHARACTER_ID_STORAGE_KEY, 'saved-id');
  navigationMocks.currentCharacterId = null;

  const { result } = renderHook(() => useCharacterId());

  expect(result.current.characterId).toBe(null);
  expect(result.current.lastCharacterId).toBe('saved-id');
});

test('setCharacterId updates state, localStorage and router param', async () => {
  const { result } = renderHook(() => useCharacterId());

  await act(async () => {
    await result.current.setCharacterId('next-id');
  });

  expect(result.current.characterId).toBe('next-id');
  expect(result.current.lastCharacterId).toBe('next-id');
  expect(localStorage.getItem(LAST_CHARACTER_ID_STORAGE_KEY)).toBe('next-id');
  expect(navigationMocks.setCurrentCharacterIdParam).toHaveBeenCalledWith('next-id');
});

test('setCharacterId is a no-op when the value does not change', async () => {
  navigationMocks.currentCharacterId = 'same-id';
  const { result } = renderHook(() => useCharacterId());

  await act(async () => {
    await result.current.setCharacterId('same-id');
  });

  expect(navigationMocks.setCurrentCharacterIdParam).not.toHaveBeenCalled();
});

test('history subscription refreshes state from query param and persists last id', () => {
  const { result } = renderHook(() => useCharacterId());
  expect(historyMocks.subscribe).toHaveBeenCalledTimes(1);

  navigationMocks.currentCharacterId = 'from-history';

  act(() => {
    historyMocks.listener?.();
  });

  expect(result.current.characterId).toBe('from-history');
  expect(result.current.lastCharacterId).toBe('from-history');
  expect(localStorage.getItem(LAST_CHARACTER_ID_STORAGE_KEY)).toBe('from-history');
});
