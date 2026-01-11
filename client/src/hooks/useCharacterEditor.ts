import {$api} from "@/api";
import {applyOptimisticPatch} from "@/hooks/applyOptimisticPatch.ts";
import {CharacterResponse, OptimisticPatch, SimpleField} from "@/hooks/models.ts";
import {patchToRequest} from "@/hooks/patchToRequest.ts";
import {useQueryClient} from "@tanstack/react-query";
import {useCallback, useState} from "react";
import {useDebouncedCallback} from "use-debounce";

export function useCharacterEditor(
    characterId: string | null,
    updateCharacter: ReturnType<typeof $api.useMutation>,
    getCharacterKey: (id: string, locale: 'en' | 'pl') => readonly unknown[],
    locale: 'en' | 'pl' = "en"
) {
    const queryClient = useQueryClient();
    const [pending, setPending] = useState<OptimisticPatch[]>([]);

    const flush = useCallback(() => {
        if (!characterId || pending.length === 0) return;

        const body = pending.reduce(
            (acc, patch) => ({...acc, ...patchToRequest(patch)}),
            {}
        );

        updateCharacter.mutate({
            params: {path: {id: characterId}},
            body: body as any
        });

        setPending([]);
    }, [characterId, pending, updateCharacter]);

    const debouncedFlush = useDebouncedCallback(flush, 1000);

    const queuePatch = useCallback((patch: OptimisticPatch) => {
        if (!characterId) return;

        setPending(prev => [...prev, patch]);

        queryClient.setQueryData(
            getCharacterKey(characterId, locale),
            (old: CharacterResponse | undefined) =>
                old ? applyOptimisticPatch(old, patch) : old
        );

        debouncedFlush();
    }, [characterId, queryClient, getCharacterKey, debouncedFlush]);

    const updateField = useCallback(
        (field: SimpleField, value: number | string) => {
            queuePatch({ kind: 'simple', field, value });
        },
        [queuePatch]
    );

    const updateArmorField = useCallback(
        (field: string, value: string) => {
            queuePatch({ kind: 'armor', field, value });
        },
        [queuePatch]
    );

    const updateWeaponField = useCallback(
        (index: number, field: string, value: string) => {
            queuePatch({ kind: 'weapon', index, field, value });
        },
        [queuePatch]
    );

    const updateEquipmentName = useCallback(
        (index: number, name: string) => {
            queuePatch({ kind: 'equipment', index, name });
        },
        [queuePatch]
    );

    const updateAbilities = useCallback(
        (abilities: { name?: string; description?: string }[]) => {
            queuePatch({ kind: 'abilities', abilities });
        },
        [queuePatch]
    );

    return {
        queuePatch,
        flush,
        updateField,
        updateArmorField,
        updateWeaponField,
        updateEquipmentName,
        updateAbilities,
        isSaving: pending.length > 0 || updateCharacter.isPending
    };
}
