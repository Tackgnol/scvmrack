import { useQuery } from '@tanstack/react-query';
import {
  charactersListQueryKey,
  fetchCharacterList,
  type CharacterListEntry,
} from '@/hooks/charactersListQuery';

/**
 * The scvm a guest already owns, if any — used by the creation flow to warn that
 * forging a new one replaces it (the backend enforces one scvm per anonymous
 * session; this is purely the heads-up copy). Authenticated accounts keep their
 * full roster, so callers pass `enabled = isGuest` and get `null` otherwise.
 *
 * Shares `charactersListQueryKey` with the first-run bootstrap so the list call
 * is deduped/cached rather than re-fetched.
 */
export function useExistingGuestScvm(enabled: boolean): CharacterListEntry | null {
  const { data } = useQuery({
    queryKey: charactersListQueryKey,
    queryFn: ({ signal }) => fetchCharacterList(signal),
    enabled,
    staleTime: 1000 * 30,
    retry: false,
    refetchOnWindowFocus: false,
  });

  if (!enabled) return null;
  return data?.[0] ?? null;
}
