import { $api, characterKeys, client } from "@/api";
import { PathsApiCharactersIdGetParametersQueryLocale } from "@/api/schema.ts";

import { CharacterResponse, UpdateMutationContext } from "@/hooks/models.ts";
import { getApiLocale, getCharacterKey } from "@/hooks/utils.ts";
import { getApiErrorStatus, toApiClientError } from '@/utils/errorUtils';
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

export function useCharacterRepository(
    characterId: string | null,
    locale?: string,
    options: { enabled?: boolean } = {}
) {
    const queryClient = useQueryClient();
    const trimmedLocale = getApiLocale<PathsApiCharactersIdGetParametersQueryLocale>(locale);
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
            // Don't retry client errors (e.g. 404 for a just-deleted character,
            // 403 access denied) — retrying can't fix them and only spams 404s.
            retry: (failureCount, error) => {
                const status = getApiErrorStatus(error);
                if (status !== undefined && status >= 400 && status < 500) {
                    return false;
                }
                return failureCount < 2;
            },
        }
    );

    // ---- Create Character ----
    const createCharacter = useMutation({
        mutationFn: async (vars: {
            body: { classId?: number };
            params: { query: { locale: string } };
            signal?: AbortSignal;
        }) => {
            const { signal, ...request } = vars;
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
            if (!character?.id) return;
            queryClient.setQueryData(
                getCharacterKey(character.id, locale),
                character
            );
            queryClient.invalidateQueries({
                queryKey: characterKeys.list()
            });
        }
    });

    // ---- Update Character (with rollback support) ----
    const updateCharacter = $api.useMutation('patch', '/api/characters/{id}', {
        onMutate: async (vars) => {
            const key = getCharacterKey(vars.params.path.id, locale);
            await queryClient.cancelQueries({ queryKey: key });

            const previous = queryClient.getQueryData<CharacterResponse>(key);
            return { previousCharacter: previous, queryKey: [...key] };
        },
        onError: (_e, _v, context) => {
            const ctx = context as UpdateMutationContext;
            if (ctx?.previousCharacter) {
                queryClient.setQueryData(ctx.queryKey, ctx.previousCharacter);
            }
        },
        onSettled: (_d, _e, vars) => {
            queryClient.invalidateQueries({
                queryKey: getCharacterKey(vars.params.path.id, locale)
            });
            queryClient.invalidateQueries({
                queryKey: characterKeys.list()
            });
        }
    });

    // ---- Delete Character ----
    const deleteCharacter = $api.useMutation('delete', '/api/characters/{id}', {
        onSuccess: (_data, vars) => {
            const id = (vars as any).params.path.id;
            queryClient.removeQueries({ queryKey: getCharacterKey(id, locale) });
            queryClient.invalidateQueries({ queryKey: characterKeys.list() });
        },
    });

    // ---- Refetch Character ----
    const refetchCharacter = useCallback(
        () => {
            if (!characterId) return;
            queryClient.invalidateQueries({
                queryKey: getCharacterKey(characterId, locale)
            });
        },
        [characterId, queryClient, locale]
    );

    return {
        character: characterQuery.data as CharacterResponse | undefined,
        isLoading: characterQuery.isLoading,
        error: characterQuery.error,

        createCharacter,
        updateCharacter,
        deleteCharacter,
        refetchCharacter,
        getCharacterKey
    };
}
