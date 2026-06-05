import { toApiClientError } from '@/utils/errorUtils';

export type CharacterListEntry = { id: string };

// Shared React Query key for the "does this session already own characters?" list.
// Both the sheet bootstrap (useCurrentCharacter) and the landing pregen read it, so
// routing through one key lets React Query dedupe concurrent calls and cache the result.
export const charactersListQueryKey = ['characters', 'list'] as const;

// Raw fetch (not the generated $api client) is deliberate: it must NOT trip the
// auth-middleware redirect on 401 — the bootstrap flows handle an empty/forbidden
// list themselves. On a non-2xx response this throws an ApiClientError (carrying the
// status); on a network failure it rejects with the raw error, so callers can tell
// "server said no" (fall through to create) from "couldn't reach the server".
export async function fetchCharacterList(
  signal?: AbortSignal,
): Promise<CharacterListEntry[]> {
  const baseUrl = import.meta.env.VITE_BACKEND_URL || '';
  const res = await fetch(`${baseUrl}/api/characters`, {
    credentials: 'include',
    signal,
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => null);
    throw toApiClientError(errorBody, res, 'Failed to load characters');
  }

  return (await res.json()) as CharacterListEntry[];
}
