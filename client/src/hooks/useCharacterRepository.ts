import { $api, characterKeys, client } from "@/api";
import { PathsCharactersIdGetParametersQueryLocale } from "@/api/schema.ts";

import { CharacterResponse, UpdateMutationContext } from "@/hooks/models.ts";
import { getApiLocale, getCharacterKey } from "@/hooks/utils.ts";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

export function useCharacterRepository(characterId: string | null, locale?: string) {
    const queryClient = useQueryClient();
    const trimmedLocale = getApiLocale<PathsCharactersIdGetParametersQueryLocale>(locale);

    // ---- Character Query ----
    const characterQuery = $api.useQuery(
        'get',
        '/characters/{id}',
        {
            params: {
                path: { id: characterId! },
                query: { locale: trimmedLocale }
            }
        },
        { enabled: !!characterId }
    );

    // ---- Create Character ----
    const createCharacter = useMutation({
        mutationFn: async (vars: {
            body: { class_id?: number };
            params: { query: { locale: string } };
            signal?: AbortSignal;
        }) => {
            const { signal, ...request } = vars;
            const { data, error } = await client.POST('/characters/new', {
                ...(request as any),
                signal,
            } as any);

            if (error) {
                if (signal?.aborted) {
                    throw new DOMException('The operation was aborted.', 'AbortError');
                }
                throw new Error((error as any)?.error || (error as any)?.message || 'Failed to create character');
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
    const updateCharacter = $api.useMutation('patch', '/characters/{id}', {
        onMutate: async (vars) => {
            const key = getCharacterKey(vars.params.path.id, locale);
            await queryClient.cancelQueries({ queryKey: key });

            const previous = queryClient.getQueryData<CharacterResponse>(key);
            return { previous, key };
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
    const deleteCharacter = $api.useMutation('delete', '/characters/{id}', {
        onSuccess: (_data, vars) => {
            const id = (vars as any).params.path.id;
            queryClient.removeQueries({ queryKey: getCharacterKey(id, locale) });
            queryClient.invalidateQueries({ queryKey: characterKeys.list() });
        },
    });

    // ---- Claim Character (guest -> authenticated) ----
    const claimCharacter = $api.useMutation('post', '/characters/{id}/claim' as any, {
        onSuccess: (_data, vars) => {
            // Invalidate to refetch with new ownership
            queryClient.invalidateQueries({
                queryKey: getCharacterKey((vars as any).params.path.id, locale)
            });
            queryClient.invalidateQueries({
                queryKey: characterKeys.list()
            });
        }
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
        character: characterQuery.data,
        isLoading: characterQuery.isLoading,
        error: characterQuery.error,

        createCharacter,
        updateCharacter,
        deleteCharacter,
        claimCharacter,
        refetchCharacter,
        getCharacterKey
    };
}
