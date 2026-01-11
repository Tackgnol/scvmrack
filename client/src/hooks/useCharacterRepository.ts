import {$api} from "@/api";
import {CharacterResponse, UpdateMutationContext} from "@/hooks/models.ts";
import {getCharacterKey} from "@/hooks/utils.ts";
import {useQueryClient} from "@tanstack/react-query";
import {useCallback} from "react";

export function useCharacterRepository(characterId: string | null, locale: 'en' | 'pl' = 'en') {
    const queryClient = useQueryClient();

    const characterQuery = $api.useQuery(
        'get',
        '/characters/{id}',
        {
            params: {
                path: { id: characterId! },
                query: { locale }
            }
        },
        { enabled: !!characterId }
    );

    const createCharacter = $api.useMutation('post', '/characters/new', {
        onSuccess: (character) => {
            if (!character?.id) return;
            queryClient.setQueryData(
                getCharacterKey(character.id, locale),
                character
            );
        }
    });

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
        }
    });

    const refetchCharacter = useCallback(
        () => {
            if (!characterId) return;

            // Just invalidate with the same key - the query will refetch with the new locale from the hook parameter
            queryClient.invalidateQueries({
                queryKey: getCharacterKey(characterId, locale)
            });
        },
        [characterId, queryClient]
    );

    return {
        character: characterQuery.data,
        isLoading: characterQuery.isLoading,
        error: characterQuery.error,

        createCharacter,
        updateCharacter,
        refetchCharacter,
        getCharacterKey
    };
}
