import { beforeEach, describe, expect, it } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
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
});
