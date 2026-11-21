import {CharacterResponse, CharacterUpdateRequest, OptimisticPatch} from "@/hooks/models.ts";
import { sanitizeCharacterUpdateRequest } from '@/validation/characterUpdate';

/**
 * The request fields a patch sets by itself. Every other patch kind sends whole
 * collections taken from the character, which buildRequestFromPatches adds.
 */
export function patchToRequest(
    patch: Extract<OptimisticPatch, { kind: 'simple' | 'abilities' }>,
): Partial<CharacterUpdateRequest> {
    switch (patch.kind) {
        case 'simple':
            return {[patch.field]: patch.value};

        case 'abilities':
            return {
                abilities: patch.abilities.map(a => ({
                    key: a.key,
                    name: a.name,
                    description: a.description,
                    comment: a.comment
                }))
            };
    }
}

/**
 * Build the full request body from pending patches and current character state.
 * This handles move operations by computing the final arrays.
 */
export function buildRequestFromPatches(
    patches: OptimisticPatch[],
    currentCharacter: CharacterResponse
): Partial<CharacterUpdateRequest> {
    let result: Partial<CharacterUpdateRequest> = {};
    let needsEquipment = false;
    let needsStorage = false;
    let needsWeapons = false;
    let needsArmor = false;

    // First pass: collect simple patches and detect if we need full arrays
    for (const patch of patches) {
        switch (patch.kind) {
            case 'simple':
            case 'abilities':
                result = {...result, ...patchToRequest(patch)};
                break;

            case 'weapon':
                needsWeapons = true;
                break;

            case 'equipment-item':
            case 'equipment-add':
            case 'equipment-remove':
            case 'equipment-move':
                needsEquipment = true;
                break;

            case 'storage-item':
            case 'storage-add':
            case 'storage-remove':
                needsStorage = true;
                break;

            case 'move-to-storage':
            case 'move-to-equipment':
            case 'swap-equipment-storage':
                needsEquipment = true;
                needsStorage = true;
                break;
            case 'toggle-scroll-use':
            case 'ammo-use':
                needsEquipment = true;
                break;
            case 'equip-weapon':
            case 'unequip-weapon':
                needsEquipment = true;
                needsWeapons = true;
                break;
            case 'equip-armor':
            case 'armor':
                needsEquipment = true;
                needsArmor = true;
                break;
            case 'unequip-armor':
                needsEquipment = true;
                needsArmor = true;
                break;
            case 'modifier-add':
            case 'modifier-remove':
            case 'modifier-update':
                (result as any).modifiers = currentCharacter.modifiers;
                break;
        }
    }

    if (needsEquipment) {
        result.equipment = currentCharacter.equipment;
    }
    if (needsStorage) {
        result.storage = currentCharacter.storage;
    }
    if (needsWeapons) {
        result.equippedWeapons = currentCharacter.equippedWeapons;
    }
    if (needsArmor) {
        result.equippedArmor = currentCharacter.equippedArmor;
    }

    if (Object.keys(result).some((field) =>
        ['equipment', 'storage', 'equippedWeapons', 'equippedArmor', 'abilities', 'modifiers'].includes(field)
    )) {
        result.expectedUpdatedAt = currentCharacter.updatedAt;
    }

    return sanitizeCharacterUpdateRequest(result);
}
