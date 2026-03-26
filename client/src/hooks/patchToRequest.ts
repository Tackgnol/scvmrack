import {CharacterResponse, CharacterUpdateRequest, OptimisticPatch} from "@/hooks/models.ts";

/**
 * Convert a patch to a request body.
 * For move operations, we need the current character state to compute the new arrays.
 */
export function patchToRequest(
    patch: OptimisticPatch,
): Partial<CharacterUpdateRequest> {
    switch (patch.kind) {
        case 'simple':
            return {[patch.field]: patch.value};


        case 'armor':
            return {
                equippedArmor: {
                    [patch.field]: patch.value
                } as NonNullable<CharacterUpdateRequest['equippedArmor']>
            };

        case 'weapon':
            return {
                equippedWeapons: [{
                    index: patch.index,
                    field: patch.field,
                    value: patch.value
                }] as any
            };

        case 'equipment-item':
        case 'equipment-add':
        case 'equipment-remove':
        case 'equipment-move':
            return {
                equipment: patch.kind === 'equipment-item' || patch.kind === 'equipment-add'
                    ? [patch.kind === 'equipment-item' ? patch.item : patch.item]
                    : undefined
            };

        case 'abilities':
            return {
                abilities: patch.abilities.map(a => ({
                    key: a.key,
                    name: a.name,
                    description: a.description,
                    comment: a.comment
                }))
            };

        // Storage operations - send full arrays for move operations
        case 'storage-item':
        case 'storage-add':
        case 'storage-remove':
        case 'move-to-storage':
        case 'move-to-equipment':
        case 'swap-equipment-storage':
        case 'toggle-scroll-use': {
            // Move operations need both arrays - handled by flush with current state
            return {};
        }

        default:
            throw new Error('Unhandled patch kind');
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
            case 'weapon':
            case 'abilities':
                result = {...result, ...patchToRequest(patch)};
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

    return result;
}
