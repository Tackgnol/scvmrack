import { $api } from "@/api";
import { applyOptimisticPatch } from "@/hooks/applyOptimisticPatch.ts";
import {CharacterResponse, CustomModifier, EquipmentItem, OptimisticPatch, SimpleField} from "@/hooks/models.ts";
import { buildRequestFromPatches } from "@/hooks/patchToRequest.ts";
import {useSnackbar} from "@/SnackbarContext/SnackbarProvider.tsx";
import {MutationObserverErrorResult, useQueryClient} from "@tanstack/react-query";
import { useCallback, useRef, useState } from "react";
import { useDebouncedCallback } from "use-debounce";


export function useCharacterEditor(
    characterId: string | null,
    updateCharacter: ReturnType<typeof $api.useMutation>,
    getCharacterKey: (id: string, locale?: string) => readonly unknown[],
    locale?: string
) {
    const queryClient = useQueryClient();
    const [pending, setPending] = useState<OptimisticPatch[]>([]);
    const { showError } = useSnackbar();

    // Retry tracking
    const retryCountRef = useRef(0);
    const maxRetries = 3;

    const flush = useCallback(() => {
        if (!characterId || pending.length === 0) return;

        const currentCharacter = queryClient.getQueryData<CharacterResponse>(
            getCharacterKey(characterId, locale)
        );

        if (!currentCharacter) return;

        // Build request body from patches + current state
        const body = buildRequestFromPatches(pending, currentCharacter);

        updateCharacter.mutate(
            {
                params: { path: { id: characterId } },
                body: body as any
            },
            {
                onSuccess: () => {
                    retryCountRef.current = 0;
                },
                onError: (error: MutationObserverErrorResult) => {
                    console.error("Failed to save:", error);
                    retryCountRef.current++;

                    if (retryCountRef.current >= maxRetries) {
                        showError("Failed to save changes. Please try again.", {
                            label: "Retry",
                            onClick: () => {
                                retryCountRef.current = 0;
                                flush();
                            }
                        });
                    }
                }
            }
        );

        setPending([]);
    }, [characterId, pending, updateCharacter, queryClient, getCharacterKey, locale, showError]);

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
    }, [characterId, queryClient, getCharacterKey, locale, debouncedFlush]);

    // Simple field updates
    const updateField = useCallback(
        (field: SimpleField, value: number | string) => {
            queuePatch({ kind: 'simple', field, value });
        },
        [queuePatch]
    );

    // Armor updates
    const updateArmorField = useCallback(
        (field: string, value: string | number) => {
            queuePatch({ kind: 'armor', field, value });
        },
        [queuePatch]
    );

    // Weapon updates
    const updateWeaponField = useCallback(
        (index: number, field: string, value: string) => {
            queuePatch({ kind: 'weapon', index, field, value });
        },
        [queuePatch]
    );

    // Abilities updates
    const updateAbilities = useCallback(
        (abilities: { key?: string; name?: string; description?: string; comment?: string }[]) => {
            queuePatch({ kind: 'abilities', abilities });
        },
        [queuePatch]
    );

    // Equipment operations
    const updateEquipmentItem = useCallback(
        (index: number, item: EquipmentItem) => {
            queuePatch({ kind: 'equipment-item', index, item });
        },
        [queuePatch]
    );

    const addEquipmentItem = useCallback(
        (item: EquipmentItem) => {
            queuePatch({ kind: 'equipment-add', item });
        },
        [queuePatch]
    );

    const removeEquipmentItem = useCallback(
        (index: number) => {
            queuePatch({ kind: 'equipment-remove', index });
        },
        [queuePatch]
    );

    const moveEquipmentItem = useCallback(
        (from: number, to: number) => {
            queuePatch({ kind: 'equipment-move', from, to });
        },
        [queuePatch]
    );

    // Storage operations
    const updateStorageItem = useCallback(
        (index: number, item: EquipmentItem) => {
            queuePatch({ kind: 'storage-item', index, item });
        },
        [queuePatch]
    );

    const addStorageItem = useCallback(
        (item: EquipmentItem) => {
            queuePatch({ kind: 'storage-add', item });
        },
        [queuePatch]
    );

    const removeStorageItem = useCallback(
        (index: number) => {
            queuePatch({ kind: 'storage-remove', index });
        },
        [queuePatch]
    );

    // Cross-container operations
    const moveToStorage = useCallback(
        (equipmentIndex: number) => {
            queuePatch({ kind: 'move-to-storage', equipmentIndex });
        },
        [queuePatch]
    );

    const moveToEquipment = useCallback(
        (storageIndex: number, equipmentPosition?: number) => {
            queuePatch({ kind: 'move-to-equipment', storageIndex, equipmentPosition });
        },
        [queuePatch]
    );

    const swapEquipmentStorage = useCallback(
        (equipmentIndex: number, storageIndex: number) => {
            queuePatch({ kind: 'swap-equipment-storage', equipmentIndex, storageIndex });
        },
        [queuePatch]
    );

    const toggleScrollUse = useCallback(
        (equipmentIndex: number, useIndex: number) => {
            queuePatch({ kind: 'toggle-scroll-use', equipmentIndex, useIndex });
        },
        [queuePatch]
    );

    const equipWeapon = useCallback((equipmentIndex: number, slotIndex: number) => {
        queuePatch({ kind: 'equip-weapon', equipmentIndex, slotIndex });
    }, [queuePatch]);

    const unequipWeapon = useCallback((slotIndex: number) => {
        queuePatch({ kind: 'unequip-weapon', slotIndex });
    }, [queuePatch]);

    const equipArmor = useCallback((equipmentIndex: number) => {
        queuePatch({ kind: 'equip-armor', equipmentIndex });
    }, [queuePatch]);

    const unequipArmor = useCallback(() => {
        queuePatch({ kind: 'unequip-armor' });
    }, [queuePatch]);

    // Modifier operations
    const addModifier = useCallback((modifier: CustomModifier) => {
        queuePatch({ kind: 'modifier-add', modifier });
    }, [queuePatch]);

    const removeModifier = useCallback((modifierId: string) => {
        queuePatch({ kind: 'modifier-remove', modifierId });
    }, [queuePatch]);

    const updateModifier = useCallback((modifierId: string, modifier: Partial<CustomModifier>) => {
        queuePatch({ kind: 'modifier-update', modifierId, modifier });
    }, [queuePatch]);

    return {
        queuePatch,
        flush,

        toggleScrollUse,

        // Simple fields
        updateField,

        // Armor & Weapons
        updateArmorField,
        updateWeaponField,

        // Abilities
        updateAbilities,

        // Equipment
        updateEquipmentItem,
        addEquipmentItem,
        removeEquipmentItem,
        moveEquipmentItem,

        // Storage
        updateStorageItem,
        addStorageItem,
        removeStorageItem,

        // Cross-container moves
        moveToStorage,
        moveToEquipment,
        swapEquipmentStorage,

        equipWeapon,
        unequipWeapon,
        equipArmor,
        unequipArmor,

        // Modifiers
        addModifier,
        removeModifier,
        updateModifier,

        // Original isSaving logic preserved
        isSaving: pending.length > 0 || updateCharacter.isPending
    };
}
