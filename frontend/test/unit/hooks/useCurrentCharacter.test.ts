import { act, renderHook } from '@testing-library/react';
import { beforeEach, expect, test, vi } from 'vitest';
import { useCurrentCharacter } from '@/hooks/useCurrentCharacter.ts';
import { useCharacterId } from '@/hooks/useCharacterId.ts';
import { useAuth } from '@/hooks/useAuth.ts';
import { useCharacterRepository } from '@/hooks/useCharacterRepository.ts';
import { useCharacterEditor } from '@/hooks/useCharacterEditor.ts';
import { hasCurrentSearchParam } from '@/router/navigation';
import { appHistory } from '@/router/history';

vi.mock('../../../src/hooks/useCharacterId.ts', () => ({
  useCharacterId: vi.fn(),
}));

vi.mock('../../../src/hooks/useAuth.ts', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../../../src/hooks/useCharacterRepository.ts', () => ({
  useCharacterRepository: vi.fn(),
}));

vi.mock('../../../src/hooks/useCharacterEditor.ts', () => ({
  useCharacterEditor: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    i18n: { changeLanguage: vi.fn(), language: 'en' },
    t: (k: string) => k,
  }),
}));

vi.mock('../../../src/SnackbarContext/SnackbarProvider.tsx', () => ({
  useSnackbar: () => ({ showSuccess: vi.fn(), showError: vi.fn() }),
}));

vi.mock('@/router/history', () => ({
  appHistory: {
    subscribe: vi.fn(() => vi.fn()),
    location: { pathname: '/character', search: '', hash: '' },
  },
}));

vi.mock('@/router/navigation', () => ({
  hasCurrentSearchParam: vi.fn().mockReturnValue(false),
  LOGGED_OUT_QUERY_PARAM: 'logged-out',
  SESSION_EXPIRED_QUERY_PARAM: 'expired',
}));

vi.mock('@/analytics/googleAnalytics', () => ({
  trackEvent: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
  (hasCurrentSearchParam as any).mockReturnValue(false);
  appHistory.location.pathname = '/character';
  appHistory.location.search = '';
  appHistory.location.hash = '';
});

test('useCurrentCharacter aggregates repository, editor and auth state', () => {
  (useCharacterId as any).mockReturnValue({
    characterId: 'char-1',
    lastCharacterId: null,
    setCharacterId: vi.fn(),
  });
  (useAuth as any).mockReturnValue({
    isAuthenticated: true,
    isGuest: false,
    isLoading: false,
  });

  const repo = {
    character: { id: 'char-1', name: 'Test' },
    isLoading: false,
    error: null,
    updateCharacter: {},
    getCharacterKey: vi.fn(),
    createCharacter: { mutate: vi.fn() },
  };
  (useCharacterRepository as any).mockReturnValue(repo);

  const editor = {
    updateField: vi.fn(),
    flush: vi.fn(),
    isSaving: false,
  };
  (useCharacterEditor as any).mockReturnValue(editor);

  const { result } = renderHook(() => useCurrentCharacter());

  expect(result.current.characterId).toBe('char-1');
  expect(result.current.character?.name).toBe('Test');
  expect(result.current.isAuthenticated).toBe(true);
  expect(result.current.updateField).toBe(editor.updateField);
});

test('useCurrentCharacter handles generateNew', () => {
  const setCharacterId = vi.fn();
  (useCharacterId as any).mockReturnValue({
    characterId: 'char-1',
    setCharacterId,
  });
  (useAuth as any).mockReturnValue({
    isAuthenticated: true,
    isGuest: false,
    isLoading: false,
  });

  const mutate = vi.fn();
  const repo = {
    createCharacter: { mutate, data: null },
  };
  (useCharacterRepository as any).mockReturnValue(repo);
  (useCharacterEditor as any).mockReturnValue({ flush: vi.fn() });

  const { result } = renderHook(() => useCurrentCharacter());

  act(() => {
    result.current.generateNew(1);
  });

  expect(mutate).toHaveBeenCalledWith(
    expect.objectContaining({ body: { classId: 1 } }),
    expect.any(Object)
  );

  // Test onSuccess callback
  const callbacks = (mutate as any).mock.calls[0][1];
  callbacks.onSuccess({ id: 'new-char' });
  expect(setCharacterId).toHaveBeenCalledWith('new-char');
});

test('useCurrentCharacter clears validation issues when active character changes', async () => {
  let activeCharacterId = 'char-1';
  (useCharacterId as any).mockImplementation(() => ({
    characterId: activeCharacterId,
    lastCharacterId: null,
    setCharacterId: vi.fn(),
  }));
  (useAuth as any).mockReturnValue({
    isAuthenticated: true,
    isGuest: false,
    isLoading: false,
  });

  const repo = {
    character: { id: activeCharacterId, name: 'Test' },
    isLoading: false,
    error: null,
    updateCharacter: {},
    getCharacterKey: vi.fn(),
    createCharacter: { mutate: vi.fn(), data: null },
  };
  (useCharacterRepository as any).mockReturnValue(repo);
  (useCharacterEditor as any).mockReturnValue({
    flush: vi.fn(),
    isSaving: false,
  });

  const { result, rerender } = renderHook(() => useCurrentCharacter());

  act(() => {
    result.current.setValidationIssue('field:name', 'Name is too long');
  });

  expect(result.current.validationIssues).toEqual([
    { id: 'field:name', message: 'Name is too long' },
  ]);

  activeCharacterId = 'char-2';
  rerender();

  await vi.waitFor(() => {
    expect(result.current.validationIssues).toEqual([]);
  });
});

test('useCurrentCharacter handles killAndReplace', () => {
  const setCharacterId = vi.fn();
  (useCharacterId as any).mockReturnValue({
    characterId: 'char-1',
    setCharacterId,
  });
  (useAuth as any).mockReturnValue({
    isAuthenticated: true,
    isGuest: false,
    isLoading: false,
  });

  const deleteMutate = vi.fn();
  const createMutate = vi.fn();
  const repo = {
    deleteCharacter: { mutate: deleteMutate },
    createCharacter: { mutate: createMutate, data: null },
  };
  (useCharacterRepository as any).mockReturnValue(repo);
  (useCharacterEditor as any).mockReturnValue({ flush: vi.fn() });

  const { result } = renderHook(() => useCurrentCharacter());

  act(() => {
    result.current.killAndReplace();
  });

  // Generate-first: the replacement is created before the old one is deleted,
  // so a failed generation can't leave the app pointed at a deleted character.
  expect(createMutate).toHaveBeenCalled();
  expect(deleteMutate).not.toHaveBeenCalled();

  // Simulate successful generation -> deletes the previously active character.
  const createCallbacks = createMutate.mock.calls[0][1];
  act(() => {
    createCallbacks.onSuccess({ id: 'char-2' });
  });

  expect(deleteMutate).toHaveBeenCalled();
  expect(deleteMutate.mock.calls[0][0]).toMatchObject({
    params: { path: { id: 'char-1' } },
  });
});

test('useCurrentCharacter handles changeLocale', async () => {
  (useCharacterId as any).mockReturnValue({
    characterId: 'char-1',
    setCharacterId: vi.fn(),
  });
  (useAuth as any).mockReturnValue({
    isAuthenticated: true,
    isGuest: false,
    isLoading: false,
  });

  const repo = {
    createCharacter: { mutate: vi.fn(), data: null },
  };
  (useCharacterRepository as any).mockReturnValue(repo);
  (useCharacterEditor as any).mockReturnValue({ flush: vi.fn() });

  const { result } = renderHook(() => useCurrentCharacter());

  await act(async () => {
    await result.current.changeLocale('pl');
  });

  // Language changed is mocked in vi.mock('react-i18next')
});

test('useCurrentCharacter handles auto-create effect', async () => {
  const setCharacterId = vi.fn();
  (useCharacterId as any).mockReturnValue({
    characterId: null,
    lastCharacterId: null,
    setCharacterId,
  });
  (useAuth as any).mockReturnValue({
    isAuthenticated: false,
    isGuest: true,
    isLoading: false,
  });

  const createMutate = vi.fn();
  const repo = {
    createCharacter: { mutate: createMutate, data: null },
  };
  (useCharacterRepository as any).mockReturnValue(repo);
  (useCharacterEditor as any).mockReturnValue({ flush: vi.fn() });

  // Mock global fetch
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => [],
  });

  await act(async () => {
    renderHook(() => useCurrentCharacter());
  });

  // Wait for the async effect
  await vi.waitFor(() => {
    expect(createMutate).toHaveBeenCalled();
  });

  const createCallbacks = createMutate.mock.calls[0][1];
  createCallbacks.onSuccess({ id: 'auto-char' });
  expect(setCharacterId).toHaveBeenCalledWith('auto-char');
});

test('useCurrentCharacter pauses auto-create while session expired', async () => {
  (hasCurrentSearchParam as any).mockImplementation(
    (queryParam: string) => queryParam === 'expired'
  );
  const setCharacterId = vi.fn();
  (useCharacterId as any).mockReturnValue({
    characterId: null,
    lastCharacterId: null,
    setCharacterId,
  });
  (useAuth as any).mockReturnValue({
    isAuthenticated: false,
    isGuest: false,
    isLoading: false,
  });

  const createMutate = vi.fn();
  const repo = {
    createCharacter: { mutate: createMutate, data: null },
  };
  (useCharacterRepository as any).mockReturnValue(repo);
  (useCharacterEditor as any).mockReturnValue({ flush: vi.fn() });
  global.fetch = vi.fn();

  renderHook(() => useCurrentCharacter());

  expect(useCharacterRepository).toHaveBeenCalledWith(null, 'en', {
    enabled: false,
  });
  expect(global.fetch).not.toHaveBeenCalled();
  expect(createMutate).not.toHaveBeenCalled();
});

test('useCurrentCharacter selects an existing character before auto-create', async () => {
  const setCharacterId = vi.fn();
  (useCharacterId as any).mockReturnValue({
    characterId: null,
    lastCharacterId: null,
    setCharacterId,
  });
  (useAuth as any).mockReturnValue({
    isAuthenticated: true,
    isGuest: false,
    isLoading: false,
  });

  const createMutate = vi.fn();
  (useCharacterRepository as any).mockReturnValue({
    createCharacter: { mutate: createMutate, data: null },
  });
  (useCharacterEditor as any).mockReturnValue({ flush: vi.fn() });
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => [{ id: 'existing-char' }],
  });

  renderHook(() => useCurrentCharacter());

  await vi.waitFor(() => {
    expect(setCharacterId).toHaveBeenCalledWith('existing-char');
  });
  expect(createMutate).not.toHaveBeenCalled();
});

test('useCurrentCharacter does not manually generate while session is expired', () => {
  (hasCurrentSearchParam as any).mockImplementation(
    (queryParam: string) => queryParam === 'expired'
  );
  (useCharacterId as any).mockReturnValue({
    characterId: 'char-1',
    lastCharacterId: 'char-1',
    setCharacterId: vi.fn(),
  });
  (useAuth as any).mockReturnValue({
    isAuthenticated: false,
    isGuest: false,
    isLoading: false,
  });

  const createMutate = vi.fn();
  (useCharacterRepository as any).mockReturnValue({
    createCharacter: { mutate: createMutate, data: null },
  });
  (useCharacterEditor as any).mockReturnValue({ flush: vi.fn() });

  const { result } = renderHook(() => useCurrentCharacter());

  act(() => {
    result.current.generateNew(1);
  });

  expect(createMutate).not.toHaveBeenCalled();
});

test('useCurrentCharacter killAndReplace generates when there is no current character', () => {
  (useCharacterId as any).mockReturnValue({
    characterId: null,
    lastCharacterId: null,
    setCharacterId: vi.fn(),
  });
  (useAuth as any).mockReturnValue({
    isAuthenticated: true,
    isGuest: false,
    isLoading: false,
  });

  const createMutate = vi.fn();
  const deleteMutate = vi.fn();
  (useCharacterRepository as any).mockReturnValue({
    createCharacter: { mutate: createMutate, data: null },
    deleteCharacter: { mutate: deleteMutate },
  });
  (useCharacterEditor as any).mockReturnValue({ flush: vi.fn() });
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => [{ id: 'existing-char' }],
  });

  const { result } = renderHook(() => useCurrentCharacter());

  act(() => {
    result.current.killAndReplace();
  });

  expect(deleteMutate).not.toHaveBeenCalled();
  expect(createMutate).toHaveBeenCalled();
});
