import { act, renderHook } from '@testing-library/react';
import { beforeEach, expect, test, vi } from 'vitest';
import { useCurrentCharacter } from '@/hooks/useCurrentCharacter.ts';
import { useCharacterId } from '@/hooks/useCharacterId.ts';
import { useAuth } from '@/hooks/useAuth.ts';
import { useCharacterRepository } from '@/hooks/useCharacterRepository.ts';
import { useCharacterEditor } from '@/hooks/useCharacterEditor.ts';
import { hasCurrentSearchParam } from '@/router/navigation';
import { appHistory } from '@/router/history';
import { replacePartyMember } from '@/api/party';

const { privacyState, queryClientMocks } = vi.hoisted(() => ({
  privacyState: { acknowledged: true },
  queryClientMocks: {
    fetchQuery: vi.fn(({ queryFn }: { queryFn: () => unknown }) => queryFn()),
    invalidateQueries: vi.fn().mockResolvedValue(undefined),
    setQueryData: vi.fn(),
  },
}));

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

// The repository hook is mocked, so there is no real QueryClientProvider here.
// Stub useQueryClient with a passthrough fetchQuery so the bootstrap effect still
// runs its queryFn (which calls the mocked global.fetch under test).
vi.mock('@tanstack/react-query', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@tanstack/react-query')>()),
  useQueryClient: () => queryClientMocks,
}));

vi.mock('@/api/party', () => ({
  partyKeys: {
    detail: (partyId: string) =>
      ['get', '/api/parties/{id}', { params: { path: { id: partyId } } }] as const,
    roster: () => ['get', '/api/characters'] as const,
  },
  replacePartyMember: vi.fn(),
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

vi.mock('@/privacy/privacyConsent', () => ({
  usePrivacyAcknowledged: () => privacyState.acknowledged,
}));

beforeEach(() => {
  vi.clearAllMocks();
  queryClientMocks.fetchQuery.mockImplementation(
    ({ queryFn }: { queryFn: () => unknown }) => queryFn()
  );
  queryClientMocks.invalidateQueries.mockResolvedValue(undefined);
  vi.mocked(replacePartyMember).mockResolvedValue({
    partyId: 'party-1',
    redirect: '/party/party-1/character/char-2',
  });
  privacyState.acknowledged = true;
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

test('useCurrentCharacter refreshes party membership before selecting a replacement', async () => {
  const setCharacterId = vi.fn().mockResolvedValue(undefined);
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
    character: { id: 'char-1', name: 'Old scvm', partyId: 'party-1' },
    isLoading: false,
    error: null,
    updateCharacter: {},
    getCharacterKey: vi.fn(),
    deleteCharacter: { mutate: deleteMutate },
    createCharacter: { mutate: createMutate, data: null },
  };
  (useCharacterRepository as any).mockReturnValue(repo);
  (useCharacterEditor as any).mockReturnValue({ flush: vi.fn() });

  const { result } = renderHook(() => useCurrentCharacter());

  act(() => {
    result.current.killAndReplace();
  });

  expect(createMutate).toHaveBeenCalledWith(
    expect.objectContaining({ body: expect.objectContaining({ replace: true }) }),
    expect.any(Object)
  );

  const createCallbacks = createMutate.mock.calls[0][1];
  act(() => {
    createCallbacks.onSuccess({ id: 'char-2' });
  });

  await vi.waitFor(() => {
    expect(replacePartyMember).toHaveBeenCalledWith({
      partyId: 'party-1',
      oldCharacterId: 'char-1',
      newCharacterId: 'char-2',
    });
    expect(setCharacterId).toHaveBeenCalledWith('char-2');
  });

  expect(queryClientMocks.invalidateQueries).toHaveBeenCalledWith({
    queryKey: ['get', '/api/parties/{id}', { params: { path: { id: 'party-1' } } }],
  });
  expect(queryClientMocks.invalidateQueries).toHaveBeenCalledWith({
    queryKey: ['get', '/api/characters'],
  });
  expect(deleteMutate).toHaveBeenCalledWith(
    { params: { path: { id: 'char-1' } } },
    expect.any(Object)
  );

  const detailRefreshIndex = queryClientMocks.invalidateQueries.mock.calls.findIndex(
    ([input]) =>
      (input as { queryKey?: readonly unknown[] }).queryKey?.[1] ===
      '/api/parties/{id}'
  );
  expect(detailRefreshIndex).toBeGreaterThanOrEqual(0);
  expect(
    queryClientMocks.invalidateQueries.mock.invocationCallOrder[detailRefreshIndex]
  ).toBeLessThan(setCharacterId.mock.invocationCallOrder[0]);
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

test('useCurrentCharacter handles auto-create effect on the new-character route', async () => {
  appHistory.location.pathname = '/character/new';
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
  (useCharacterRepository as any).mockReturnValue({
    createCharacter: { mutate: createMutate, data: null },
  });
  (useCharacterEditor as any).mockReturnValue({ flush: vi.fn() });
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => [],
  });

  await act(async () => {
    renderHook(() => useCurrentCharacter());
  });

  await vi.waitFor(() => {
    expect(createMutate).toHaveBeenCalled();
  });
});

test('useCurrentCharacter does not auto-create until privacy is acknowledged', async () => {
  privacyState.acknowledged = false;
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
  (useCharacterRepository as any).mockReturnValue({
    createCharacter: { mutate: createMutate, data: null },
  });
  (useCharacterEditor as any).mockReturnValue({ flush: vi.fn() });
  global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => [] });

  renderHook(() => useCurrentCharacter());

  expect(global.fetch).not.toHaveBeenCalled();
  expect(createMutate).not.toHaveBeenCalled();
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
