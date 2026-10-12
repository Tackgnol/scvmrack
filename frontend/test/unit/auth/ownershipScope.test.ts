import { beforeEach, describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryObserver } from '@tanstack/react-query';
import { synchronizeOwnershipScope } from '@/auth/ownershipScope';

describe('synchronizeOwnershipScope', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('keeps caches for the same user and clears ownership state on identity change', async () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(['auth', 'session'], { user: { id: 'user-a' } });
    queryClient.setQueryData(['get', '/api/characters'], [{ id: 'char-a' }]);
    localStorage.setItem('last-character-id', 'char-a');

    expect(synchronizeOwnershipScope(queryClient, 'user-a')).toBe(false);
    expect(synchronizeOwnershipScope(queryClient, 'user-a')).toBe(false);
    expect(queryClient.getQueryData(['get', '/api/characters'])).toEqual([
      { id: 'char-a' },
    ]);

    expect(synchronizeOwnershipScope(queryClient, 'user-b')).toBe(true);

    await Promise.resolve();
    expect(queryClient.getQueryData(['get', '/api/characters'])).toBeUndefined();
    expect(queryClient.getQueryData(['auth', 'session'])).toEqual({
      user: { id: 'user-a' },
    });
    expect(localStorage.getItem('last-character-id')).toBeNull();
  });

  it('clears stale ownership data when a null session becomes anonymous', async () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(['get', '/api/characters', 'detail'], {
      id: 'stale-char',
    });

    expect(synchronizeOwnershipScope(queryClient, null)).toBe(false);
    expect(synchronizeOwnershipScope(queryClient, 'anonymous-user')).toBe(true);

    await Promise.resolve();
    expect(
      queryClient.getQueryData(['get', '/api/characters', 'detail'])
    ).toBeUndefined();
  });

  it('treats a still-loading session as no baseline', () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(['classes', 'detail', 7], { id: 7 });

    expect(synchronizeOwnershipScope(queryClient, undefined)).toBe(false);
    expect(synchronizeOwnershipScope(queryClient, 'user-a')).toBe(false);
    expect(queryClient.getQueryData(['classes', 'detail', 7])).toEqual({ id: 7 });
  });

  it('refetches a mounted query on identity change instead of orphaning it', async () => {
    const queryClient = new QueryClient();
    const results: Array<{ id: number; as: string }> = [];
    let user = 'user-a';
    const observer = new QueryObserver(queryClient, {
      queryKey: ['classes', 'detail', 7],
      queryFn: async () => ({ id: 7, as: user }),
    });
    const unsubscribe = observer.subscribe((result) => {
      if (result.data) results.push(result.data);
    });
    await vi.waitFor(() => expect(results).toHaveLength(1));

    synchronizeOwnershipScope(queryClient, 'user-a');
    user = 'user-b';
    synchronizeOwnershipScope(queryClient, 'user-b');

    await vi.waitFor(() => expect(observer.getCurrentResult().data).toEqual({ id: 7, as: 'user-b' }));
    expect(observer.getCurrentResult().fetchStatus).toBe('idle');
    unsubscribe();
  });
});
