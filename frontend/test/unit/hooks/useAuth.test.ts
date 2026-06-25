import { renderHook } from '@testing-library/react';
import { beforeEach, expect, test, vi } from 'vitest';
import { useAuth } from '@/hooks/useAuth.ts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { hasCurrentSearchParam } from '@/router/navigation';
import { fetchSession, signInAnonymous, signOut } from '@/auth';
import { appHistory } from '@/router/history';

vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(),
  useQueryClient: vi.fn(),
}));

vi.mock('@/auth', () => ({
  fetchSession: vi.fn(),
  signInAnonymous: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock('@/api', () => ({
  authKeys: {
    all: ['auth'],
    session: () => ['auth', 'session'],
    me: () => ['auth', 'me'],
  },
}));

vi.mock('@/router/navigation', () => ({
  hasCurrentSearchParam: vi.fn().mockReturnValue(false),
  navigateToLoggedOut: vi.fn(),
  SESSION_EXPIRED_QUERY_PARAM: 'expired',
}));

vi.mock('@/router/history', () => ({
  appHistory: {
    subscribe: vi.fn(() => vi.fn()),
    location: { pathname: '/' },
  },
}));

type MutationConfig = {
  mutationFn: (...args: any[]) => Promise<unknown>;
  onSuccess?: (...args: any[]) => unknown;
};

const mutationConfigs: MutationConfig[] = [];

function installMutationMocks() {
  mutationConfigs.length = 0;
  (useMutation as any).mockImplementation((options: MutationConfig) => {
    mutationConfigs.push(options);
    return {
      mutateAsync: options.mutationFn,
      mutate: options.mutationFn,
      isPending: false,
    };
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  window.history.pushState({}, '', '/');
  (appHistory as any).location = { pathname: '/' };
  (hasCurrentSearchParam as any).mockReturnValue(false);
  installMutationMocks();
});

test('useAuth returns real user and session data', () => {
  (useQuery as any).mockImplementation(({ queryKey }: any) => {
    if (queryKey.includes('session')) {
      return {
        data: { session: { id: 's1' }, user: { id: '1', email: 'a@b.com' } },
        isLoading: false,
      };
    }
    return { isLoading: false, isFetching: false };
  });
  (useQueryClient as any).mockReturnValue({
    invalidateQueries: vi.fn(),
    setQueryData: vi.fn(),
  });

  const { result } = renderHook(() => useAuth());

  expect(result.current.user?.id).toBe('1');
  expect(result.current.isAuthenticated).toBe(true);
  expect(result.current.isGuest).toBe(false);
});

test('useAuth treats expired session flag as logged out and skips anonymous bootstrap', () => {
  (useQuery as any).mockImplementation(({ queryKey, enabled }: any) => {
    if (queryKey.includes('session')) {
      return {
        data: { session: { id: 's1' }, user: { id: '1', email: 'a@b.com' } },
        isLoading: false,
      };
    }
    if (queryKey.includes('anonymous-bootstrap')) {
      expect(enabled).toBe(false);
      return { isFetching: false };
    }
    return { isLoading: false };
  });
  (useQueryClient as any).mockReturnValue({
    invalidateQueries: vi.fn(),
    setQueryData: vi.fn(),
  });

  (hasCurrentSearchParam as any).mockReturnValue(true);

  const { result } = renderHook(() => useAuth());

  expect(result.current.user).toBeNull();
  expect(result.current.session).toBeNull();
  expect(result.current.isAuthenticated).toBe(false);
  expect(result.current.isGuest).toBe(false);
});

test('useAuth bootstraps anonymous sessions when no session exists', async () => {
  const queryClient = { invalidateQueries: vi.fn(), setQueryData: vi.fn() };
  (useQueryClient as any).mockReturnValue(queryClient);

  let capturedQueryFn: (() => Promise<unknown>) | undefined;
  (useQuery as any).mockImplementation((options: any) => {
    const { queryKey } = options;
    if (queryKey.includes('session')) {
      return { data: null, isLoading: false };
    }
    if (queryKey.includes('anonymous-bootstrap')) {
      capturedQueryFn = options.queryFn;
      return { isFetching: false };
    }
    return { isLoading: false, data: null };
  });

  renderHook(() => useAuth());

  await capturedQueryFn?.();

  expect(signInAnonymous).toHaveBeenCalled();
  expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
    queryKey: ['auth', 'session'],
  });
});

test('useAuth reports loading while an anonymous bootstrap is pending but not yet fetching', () => {
  // SPA nav into a sheet route: the session query is already cached as null
  // (not loading) and the bootstrap query is enabled but hasn't flipped to
  // fetching yet. Without covering this window, first-run flows (auto-create,
  // party join) fire against a session that does not exist yet.
  (useQueryClient as any).mockReturnValue({
    invalidateQueries: vi.fn(),
    setQueryData: vi.fn(),
  });
  (useQuery as any).mockImplementation((options: any) => {
    const { queryKey } = options;
    if (queryKey.includes('session')) {
      return { data: null, isLoading: false };
    }
    if (queryKey.includes('anonymous-bootstrap')) {
      return { isFetching: false, isError: false, data: undefined };
    }
    return { isLoading: false, data: null };
  });

  const { result } = renderHook(() => useAuth());

  expect(result.current.isLoading).toBe(true);
});

test('useAuth can skip anonymous bootstrap when no session exists', () => {
  const queryClient = { invalidateQueries: vi.fn(), setQueryData: vi.fn() };
  (useQueryClient as any).mockReturnValue(queryClient);

  (useQuery as any).mockImplementation((options: any) => {
    const { queryKey } = options;
    if (queryKey.includes('session')) {
      return { data: null, isLoading: false };
    }
    if (queryKey.includes('anonymous-bootstrap')) {
      expect(options.enabled).toBe(false);
      return { isFetching: false };
    }
    return { isLoading: false, data: null };
  });

  renderHook(() => useAuth({ bootstrapAnonymous: false }));

  expect(signInAnonymous).not.toHaveBeenCalled();
});

test('useAuth skips anonymous bootstrap on invite routes by default', () => {
  const queryClient = { invalidateQueries: vi.fn(), setQueryData: vi.fn() };
  (useQueryClient as any).mockReturnValue(queryClient);
  (appHistory as any).location = { pathname: '/join/tok123' };

  (useQuery as any).mockImplementation((options: any) => {
    const { queryKey } = options;
    if (queryKey.includes('session')) {
      return { data: null, isLoading: false };
    }
    if (queryKey.includes('anonymous-bootstrap')) {
      expect(options.enabled).toBe(false);
      return { isFetching: false };
    }
    return { isLoading: false, data: null };
  });

  renderHook(() => useAuth());

  expect(signInAnonymous).not.toHaveBeenCalled();
});

test('useAuth can skip session fetch entirely', () => {
  const queryClient = { invalidateQueries: vi.fn(), setQueryData: vi.fn() };
  (useQueryClient as any).mockReturnValue(queryClient);

  (useQuery as any).mockImplementation((options: any) => {
    const { queryKey } = options;
    if (queryKey.includes('session')) {
      expect(options.enabled).toBe(false);
      return { data: undefined, isLoading: false };
    }
    if (queryKey.includes('anonymous-bootstrap')) {
      expect(options.enabled).toBe(false);
      return { isFetching: false };
    }
    return { isLoading: false, data: null };
  });

  renderHook(() => useAuth({ fetchSession: false }));

  expect(fetchSession).not.toHaveBeenCalled();
  expect(signInAnonymous).not.toHaveBeenCalled();
});

test('useAuth handles signOut', async () => {
  (useQuery as any).mockReturnValue({ isLoading: false, isFetching: false, data: null });
  const queryClient = { invalidateQueries: vi.fn(), setQueryData: vi.fn() };
  (useQueryClient as any).mockReturnValue(queryClient);

  const { result } = renderHook(() => useAuth());

  await result.current.signOut.mutateAsync();
  expect(signOut).toHaveBeenCalled();

  mutationConfigs[0].onSuccess?.();
  expect(queryClient.setQueryData).toHaveBeenCalledWith(['auth', 'session'], null);
});

test('useAuth wires fetchSession as the session query function', () => {
  (useQuery as any).mockImplementation(({ queryKey, queryFn }: any) => {
    if (queryKey.includes('session')) {
      expect(queryFn).toBe(fetchSession);
    }
    return { data: null, isLoading: false, isFetching: false };
  });
  (useQueryClient as any).mockReturnValue({
    invalidateQueries: vi.fn(),
    setQueryData: vi.fn(),
  });

  renderHook(() => useAuth());
});
