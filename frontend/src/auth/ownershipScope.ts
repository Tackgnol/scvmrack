import type { QueryClient } from '@tanstack/react-query';
import { clearRememberedCharacterId } from '@/preferences/lastCharacter';

const observedUserIds = new WeakMap<QueryClient, string | null>();

/**
 * Drops the previous user's cached data when the session user changes. Pass
 * `undefined` while the session is still loading so the first resolved user
 * becomes the baseline instead of counting as a change.
 */
export function synchronizeOwnershipScope(
  queryClient: QueryClient,
  userId: string | null | undefined,
): boolean {
  if (userId === undefined) return false;

  if (!observedUserIds.has(queryClient)) {
    observedUserIds.set(queryClient, userId);
    return false;
  }

  if (observedUserIds.get(queryClient) === userId) {
    return false;
  }

  observedUserIds.set(queryClient, userId);
  clearRememberedCharacterId();
  // reset (not remove): a mounted page keeps its observer and refetches as the new user
  void queryClient.resetQueries({
    predicate: (query) => query.queryKey[0] !== 'auth',
  });
  return true;
}
