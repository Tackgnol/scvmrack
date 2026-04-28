import { renderHook } from '@testing-library/react';
import { beforeEach, expect, test, vi } from 'vitest';
import { useAuth, authClient } from '@/hooks/useAuth.ts';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { hasCurrentSearchParam } from '@/router/navigation';

vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(),
  useQueryClient: vi.fn(),
}));

vi.mock('better-auth/react', () => ({
    createAuthClient: () => ({
        getSession: vi.fn(),
        signIn: {
            email: vi.fn(),
            magicLink: vi.fn(),
        },
        signUp: {
            email: vi.fn(),
        },
        signOut: vi.fn(),
    }),
}));

vi.mock('better-auth/client/plugins', () => ({
    magicLinkClient: vi.fn(),
    anonymousClient: vi.fn(),
}));

vi.mock('@/api', () => ({
    authKeys: {
        all: ['auth'],
        session: () => ['auth', 'session'],
        me: () => ['auth', 'me'],
    }
}));

vi.mock('@/analytics/googleAnalytics', () => ({
    trackEvent: vi.fn(),
}));

vi.mock('@/router/navigation', () => ({
    hasCurrentSearchParam: vi.fn().mockReturnValue(false),
    navigateToLoggedOut: vi.fn(),
    SESSION_EXPIRED_QUERY_PARAM: 'expired',
}));

vi.mock('@/router/history', () => ({
    appHistory: {
        subscribe: vi.fn(() => vi.fn()),
    },
}));

global.fetch = vi.fn();

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
  (hasCurrentSearchParam as any).mockReturnValue(false);
  mutationConfigs.length = 0;
  installMutationMocks();
});

test('useAuth returns user and session data', () => {
    (useQuery as any).mockImplementation(({ queryKey }: any) => {
        if (queryKey.includes('session')) {
            return { data: { user: { id: '1', email: 'a@b.com' } }, isLoading: false };
        }
        if (queryKey.includes('me')) {
            return { data: { user: { id: '1', email: 'a@b.com' } }, isLoading: false };
        }
        return { isLoading: false };
    });
    (useQueryClient as any).mockReturnValue({
      invalidateQueries: vi.fn(),
      setQueryData: vi.fn(),
    });

    const { result } = renderHook(() => useAuth());

    expect(result.current.user?.id).toBe('1');
    expect(result.current.isAuthenticated).toBe(true);
});

test('useAuth treats expired session flag as logged out and skips anonymous bootstrap', () => {
    (useQuery as any).mockImplementation(({ queryKey, enabled }: any) => {
        if (queryKey.includes('session')) {
            return { data: { user: { id: '1', email: 'a@b.com' } }, isLoading: false };
        }
        if (queryKey.includes('me')) {
            expect(enabled).toBe(false);
            return { data: { user: { id: '1', email: 'a@b.com' } }, isLoading: false };
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

test('useAuth handles signIn mutation', async () => {
    (useQuery as any).mockReturnValue({ isLoading: false, data: null });
    const queryClient = { invalidateQueries: vi.fn(), setQueryData: vi.fn() };
    (useQueryClient as any).mockReturnValue(queryClient);

    const { result } = renderHook(() => useAuth());

    (authClient.signIn.email as any).mockResolvedValue({ data: { user: { id: '1' } }, error: null });

    const signInResult = await result.current.signIn.mutateAsync({
      email: 'a@b.com',
      password: 'password',
    });
    expect(signInResult.user.id).toBe('1');
    expect(authClient.signIn.email).toHaveBeenCalledWith({
      email: 'a@b.com',
      password: 'password',
      rememberMe: true,
    });

    mutationConfigs[0].onSuccess?.({}, { locale: 'en' });
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: ['auth'] });
});

test('useAuth handles signOut', async () => {
    (useQuery as any).mockReturnValue({ isLoading: false, data: null });
    const queryClient = { invalidateQueries: vi.fn(), setQueryData: vi.fn() };
    (useQueryClient as any).mockReturnValue(queryClient);

    const { result } = renderHook(() => useAuth());

    (authClient.signOut as any).mockResolvedValue({ error: null });

    await result.current.signOut.mutateAsync();
    expect(authClient.signOut).toHaveBeenCalled();

    mutationConfigs[2].onSuccess?.();
    expect(queryClient.setQueryData).toHaveBeenCalledWith(['auth', 'session'], null);
    expect(queryClient.setQueryData).toHaveBeenCalledWith(['auth', 'me'], null);
});

test('useAuth handles signUp mutation', async () => {
    (useQuery as any).mockReturnValue({ isLoading: false, data: null });
    const queryClient = { invalidateQueries: vi.fn(), setQueryData: vi.fn() };
    (useQueryClient as any).mockReturnValue(queryClient);

    const { result } = renderHook(() => useAuth());

    (authClient.signUp.email as any).mockResolvedValue({ data: { user: { id: '2' } }, error: null });

    const signUpResult = await result.current.signUp.mutateAsync({
      email: 'new@b.com',
      password: 'password',
      name: 'New',
    });
    expect(signUpResult.user.id).toBe('2');
    expect(authClient.signUp.email).toHaveBeenCalledWith({
      email: 'new@b.com',
      password: 'password',
      name: 'New',
    });

    mutationConfigs[1].onSuccess?.({}, { locale: 'en' });
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: ['auth'] });
});

test('useAuth handles forgotPassword and resetPassword', async () => {
    (useQuery as any).mockReturnValue({ isLoading: false, data: null });
    (useQueryClient as any).mockReturnValue({
      invalidateQueries: vi.fn(),
      setQueryData: vi.fn(),
    });

    const { result } = renderHook(() => useAuth());

    (global.fetch as any).mockResolvedValueOnce({ ok: true });
    await result.current.forgotPassword.mutateAsync({ email: 'a@b.com' });
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('request-password-reset'),
      expect.objectContaining({ method: 'POST' })
    );

    (global.fetch as any).mockResolvedValueOnce({ ok: true });
    await result.current.resetPassword.mutateAsync({ newPassword: 'new', token: 'tok' });
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('reset-password'),
      expect.objectContaining({ method: 'POST' })
    );
});

test('useAuth handles anonymous bootstrap', async () => {
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
            return { isFetching: false, queryFn: capturedQueryFn };
        }
        return { isLoading: false, data: null };
    });

    renderHook(() => useAuth());

    (global.fetch as any).mockResolvedValueOnce({ ok: true });
    await capturedQueryFn?.();

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('sign-in/anonymous'),
      expect.objectContaining({ method: 'POST' })
    );
    expect(queryClient.invalidateQueries).toHaveBeenCalled();
});
