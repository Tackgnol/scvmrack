import type { QueryClient } from '@tanstack/react-query';
import { clearRememberedCharacterId } from '@/preferences/lastCharacter';

const observedUserIds = new WeakMap<QueryClient, string | null>();

export function synchronizeOwnershipScope(
  queryClient: QueryClient,
  userId: string | null,
): boolean {
  if (!observedUserIds.has(queryClient)) {
    observedUserIds.set(queryClient, userId);
    return false;
  }

  if (observedUserIds.get(queryClient) === userId) {
    return false;
  }

  observedUserIds.set(queryClient, userId);
  clearRememberedCharacterId();
  queryClient.removeQueries({
    predicate: (query) => query.queryKey[0] !== 'auth',
  });
  return true;
}
