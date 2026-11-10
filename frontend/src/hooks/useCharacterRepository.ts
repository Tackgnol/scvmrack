import { $api, authKeys, client } from "@/api";
import {
    cancelCharacterFetches,
    characterDetailKey,
    dropCharacter,
    markCharacterListsStale,
    markCharacterStale,
    readCharacter,
    seedCreatedCharacter,
} from "@/api/characterCache";
import { ensureAnonymousSession, type AuthSession } from '@/auth';

import { CharacterResponse } from "@/hooks/models.ts";
import { getApiLocale } from "@/hooks/utils.ts";
import { isRetryableApiError, toApiClientError } from '@/utils/errorUtils';
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useCharacterRepository(
    characterId: string | null,
    locale?: string,
    options: { enabled?: boolean } = {}
) {
    const queryClient = useQueryClient();
    const trimmedLocale = getApiLocale(locale);
    const queryEnabled = options.enabled ?? true;

    // ---- Character Query ----
    const characterQuery = $api.useQuery(
        'get',
        '/api/characters/{id}',
        {
            params: {
                path: { id: characterId! },
                query: { locale: trimmedLocale }
            }
        },
        {
            enabled: queryEnabled && !!characterId,
            // The query key bakes in `locale` (see characterDetailKey), so switching
            // locale looks like a brand-new query. Without this, `.data` reverts
            // to undefined for the refetch, blanking the sheet and racing
            // useCharacterEditor's pending patch queue (RPG-56/RPG-64).
            placeholderData: (previous) => previous?.id === characterId ? previous : undefined,
            // Don't retry client errors (e.g. 404 for a just-deleted character,
            // 403 access denied) — retrying can't fix them and only spams 404s.
            retry: (failureCount, error) => failureCount < 2 && isRetryableApiError(error),
        }
    );

    // ---- Create Character ----
    const createCharacter = useMutation({
        mutationFn: async (vars: {
            body: { classId?: number; replace?: boolean; classless?: boolean };
            params: { query: { locale: string; obrRoom?: string; obrPlayer?: string } };
            signal?: AbortSignal;
        }) => {
            const { signal, ...request } = vars;
            const session = await ensureAnonymousSession(queryClient.getQueryData<AuthSession>(authKeys.session()));
            signal?.throwIfAborted();
            queryClient.setQueryData(authKeys.session(), session);
            const { data, error, response } = await client.POST('/api/characters/new', {
                ...(request as any),
                signal,
            } as any);

            const responseOk = response?.ok ?? !error;

            if (error || !responseOk) {
                if (signal?.aborted) {
                    throw new DOMException('The operation was aborted.', 'AbortError');
                }
                throw toApiClientError(error, response, 'Failed to create character');
            }

            if (!data) {
                throw new Error('Failed to create character');
            }

            return data;
        },
        onSuccess: (character) => {
            if (!character?.id) {
                return;
            }
            seedCreatedCharacter(queryClient, character.id, locale, character);
        }
    });

    // ---- Update Character ----
    // The character-detail cache is reconciled by useCharacterEditor straight
    // from the PATCH response (which is fully hydrated), so we deliberately do
    // NOT refetch it on every save — that refetch used to race the optimistic
    // queue and drop edits. We only keep the character LISTS (names/HP) fresh.
    const updateCharacter = $api.useMutation('patch', '/api/characters/{id}', {
        onMutate: async (vars) => {
            const id = vars.params.path.id;
            await cancelCharacterFetches(queryClient, id, locale);

            return {
                previousCharacter: readCharacter(queryClient, id, locale),
                queryKey: [...characterDetailKey(id, locale)],
            };
        },
        onSettled: () => {
            markCharacterListsStale(queryClient, 'on-next-read');
        }
    });

    // ---- Delete Character ----
    const deleteCharacter = $api.useMutation('delete', '/api/characters/{id}', {
        onSuccess: (_data, vars) => {
            const id = (vars as any).params.path.id;
            dropCharacter(queryClient, id, locale);
            markCharacterListsStale(queryClient);
        },
    });

    // ---- Refetch Character ----
    const refetchCharacter = () => {
        if (!characterId) {
            return;
        }
        markCharacterStale(queryClient, characterId, { locale });
    };

    return {
        character: characterQuery.data as CharacterResponse | undefined,
        isLoading: characterQuery.isLoading,
        error: characterQuery.error,

        createCharacter,
        updateCharacter,
        deleteCharacter,
        refetchCharacter,
    };
}
