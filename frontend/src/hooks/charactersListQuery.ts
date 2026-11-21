import type { CharacterListItem } from '@/hooks/models';
import { toApiClientError } from '@/utils/errorUtils';
import { authHeaders } from '@/utils/tabSession';
import { embeddedSessionHeaders } from '@/utils/embed';

export type CharacterListEntry = CharacterListItem & { id: string };

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
    headers: { ...embeddedSessionHeaders(), ...authHeaders() },
    signal,
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => null);
    throw toApiClientError(errorBody, res, 'Failed to load characters');
  }

  return (await res.json()) as CharacterListEntry[];
}
