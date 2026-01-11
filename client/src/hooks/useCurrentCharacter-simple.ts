import {CharacterResponse, CharacterUpdateRequest, UpdateMutationContext} from "@/hooks/models.ts";
import {getStoredCharacterId, setStoredCharacterId} from "@/hooks/utils.ts";
import { useEffect, useCallback, useRef, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useDebouncedCallback } from 'use-debounce';
import { $api } from '@/api';

// This is a very very simple one file implementation, it is easier to understand, but has missing features, and schema drift. It is easier to read and understand, harder to keep maintained ironically

const getCharacterKey = (id: string | null) =>
    ['get', '/characters/{id}', { params: { path: { id } } }];

// --- Hook ---
export function useCurrentCharacterSimple() {
    const queryClient = useQueryClient();
    const characterId = getStoredCharacterId();

    const queryKey = useMemo(() => getCharacterKey(characterId), [characterId]);

    const rollbackData = useRef<CharacterResponse | null>(null);
    const pendingUpdates = useRef<Partial<CharacterUpdateRequest>>({});

    // 1. Fetch Character
    const characterQuery = $api.useQuery(
        'get',
        '/characters/{id}',
        { params: { path: { id: characterId! } } },
        {
            enabled: !!characterId,
            staleTime: 1000 * 60 * 5
        }
    );

    const generateMutation = $api.useMutation('post', '/characters/new', {
        onSuccess: (newCharacter) => {
            if (newCharacter?.id) {
                setStoredCharacterId(newCharacter.id);
            }
        },
    });


    const updateMutation = $api.useMutation('patch', '/characters/{id}', {
        onMutate: async () => {
            // Cancel outgoing refetches so they don't overwrite our optimistic state
            await queryClient.cancelQueries({ queryKey });

            // Return the rollback data captured in queueUpdate
            return {
                previousCharacter: rollbackData.current ?? undefined,
                queryKey
            } as UpdateMutationContext;
        },
        onError: (_err, _vars, context) => {
            const ctx = context as UpdateMutationContext;
            if (ctx?.previousCharacter) {
                queryClient.setQueryData(ctx.queryKey, ctx.previousCharacter);
            }
        },
        onSettled: () => {
            // Clear rollback ref and sync with server
            rollbackData.current = null;
            queryClient.invalidateQueries({ queryKey });
        }
    });

    const sendUpdates = useDebouncedCallback(() => {
        if (!characterId || Object.keys(pendingUpdates.current).length === 0) return;

        const body = { ...pendingUpdates.current };
        pendingUpdates.current = {};

        updateMutation.mutate({
            params: { path: { id: characterId } },
            body: body as any,
        });
    }, 1000);

    const queueUpdate = useCallback((updates: Partial<CharacterUpdateRequest>) => {
        if (!characterId) return;

        if (Object.keys(pendingUpdates.current).length === 0) {
            rollbackData.current = queryClient.getQueryData<CharacterResponse>(queryKey) ?? null;
        }


        pendingUpdates.current = { ...pendingUpdates.current, ...updates };

        queryClient.setQueryData<CharacterResponse>(queryKey, (old) => {
            if (!old) return old;
            return { ...old, ...updates };
        });

        sendUpdates();
    }, [characterId, queryClient, queryKey]); // Removed sendUpdates from deps

    const flushUpdates = useCallback(() => sendUpdates.flush(), [sendUpdates]);

    useEffect(() => {
        if (!characterId && !generateMutation.isPending) {
            generateMutation.mutate({ body: {} });
        }

    }, [characterId]);

    useEffect(() => {
        return () => sendUpdates.cancel();
    }, [sendUpdates]);

    const updateField = useCallback(<K extends keyof CharacterResponse>(
        field: K,
        value: CharacterResponse[K]
    ) => {
        queueUpdate({ [field]: value } as Partial<CharacterUpdateRequest>);
    }, [queueUpdate]);

    const updateEquipmentItem = useCallback((index: number, value: string) => {
        const current = characterQuery.data?.equipment;
        if (!current) return;

        const newEquipment = [...current];
        newEquipment[index] = {
            ...newEquipment[index],
            name: value,
            key: newEquipment[index]?.key ?? `custom-${index}`,
            description: newEquipment[index]?.description ?? '',
        };
        queueUpdate({ equipment: newEquipment });
    }, [characterQuery.data?.equipment, queueUpdate]);

    const updateWeapon = useCallback((index: number, field: string, value: string) => {
        const current = characterQuery.data?.equipped_weapons;
        if (!current) return;

        const newWeapons = [...current];
        newWeapons[index] = { ...newWeapons[index], [field]: value };
        queueUpdate({ equipped_weapons: newWeapons });
    }, [characterQuery.data?.equipped_weapons, queueUpdate]);

    const updateArmor = useCallback((field: string, value: string) => {
        const current = characterQuery.data?.equipped_armor;
        if (!current) return;

        queueUpdate({
            equipped_armor: { ...current, [field]: value }
        });
    }, [characterQuery.data?.equipped_armor, queueUpdate]);

    const generateNew = useCallback((classId?: number) => {
        flushUpdates();
        generateMutation.mutate({ body: classId ? { class_id: classId } : {} });
    }, [generateMutation, flushUpdates]);

    return {
        character: characterQuery.data,
        isLoading: characterQuery.isLoading || generateMutation.isPending,
        isSaving: updateMutation.isPending || Object.keys(pendingUpdates.current).length > 0,
        error: characterQuery.error || generateMutation.error || updateMutation.error,
        characterId,

        updateField,
        updateArmor,
        updateWeapon,
        updateEquipmentItem,
        flushUpdates,
        generateNew,

        setCharacterId: (id: string) => {
            flushUpdates();
            setStoredCharacterId(id);
            queryClient.invalidateQueries({ queryKey: ['get', '/characters/{id}'] });
        },
    };
}
