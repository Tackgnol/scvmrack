import {CharacterResponse, OptimisticPatch} from "@/hooks/models.ts";

function isValidIndex(index: number, length: number): boolean {
    return index >= 0 && index < length;
}

export function applyOptimisticPatch(
    character: CharacterResponse,
    patch: OptimisticPatch
): CharacterResponse {
    switch (patch.kind) {
        case 'simple':
            return {
                ...character,
                [patch.field]: patch.value
            };

        case 'armor':
            if (!character.equippedArmor) return character;
            return {
                ...character,
                equippedArmor: {
                    ...character.equippedArmor,
                    [patch.field]: patch.value
                }
            };

        case 'weapon': {
            const next = [...(character.equippedWeapons ?? [])];
            next[patch.index] = {
                ...(next[patch.index] ?? {}),
                [patch.field]: patch.value
            };

            return {...character, equippedWeapons: next};
        }

        case 'equipment-item': {
            const next = [...(character.equipment ?? [])];
            if (!isValidIndex(patch.index, next.length)) return character;
            next[patch.index] = patch.item;
            return {...character, equipment: next};
        }

        case 'equipment-add': {
            return {
                ...character,
                equipment: [...(character.equipment ?? []), patch.item]
            };
        }

        case 'equipment-remove': {
            const next = [...(character.equipment ?? [])];
            if (!isValidIndex(patch.index, next.length)) return character;
            next.splice(patch.index, 1);
            return {...character, equipment: next};
        }

        case 'equipment-move': {
            const next = [...(character.equipment ?? [])];
            if (!isValidIndex(patch.from, next.length) || patch.to < 0 || patch.to > next.length) {
                return character;
            }
            const [item] = next.splice(patch.from, 1);
            next.splice(patch.to, 0, item);
            return {...character, equipment: next};
        }

        case 'abilities':
            return {
                ...character,
                abilities: patch.abilities.map(a => ({...a}))
            };

        case 'storage-item': {
            const next = [...(character.storage ?? [])];
            if (!isValidIndex(patch.index, next.length)) return character;
            next[patch.index] = patch.item;
            return {...character, storage: next};
        }

        case 'storage-add': {
            return {
                ...character,
                storage: [...(character.storage ?? []), patch.item]
            };
        }

        case 'storage-remove': {
            const next = [...(character.storage ?? [])];
            if (!isValidIndex(patch.index, next.length)) return character;
            next.splice(patch.index, 1);
            return {...character, storage: next};
        }

        case 'move-to-storage': {
            const equipment = [...(character.equipment ?? [])];
            const storage = [...(character.storage ?? [])];

            if (patch.equipmentIndex < 0 || patch.equipmentIndex >= equipment.length) {
                return character;
            }

            const [item] = equipment.splice(patch.equipmentIndex, 1);
            storage.push(item);

            return {...character, equipment, storage};
        }

        case 'move-to-equipment': {
            const equipment = [...(character.equipment ?? [])];
            const storage = [...(character.storage ?? [])];

            if (patch.storageIndex < 0 || patch.storageIndex >= storage.length) {
                return character;
            }

            const [item] = storage.splice(patch.storageIndex, 1);

            if (
                patch.equipmentPosition !== undefined &&
                patch.equipmentPosition >= 0 &&
                patch.equipmentPosition < equipment.length
            ) {
                equipment.splice(patch.equipmentPosition, 0, item);
            } else {
                equipment.push(item);
            }

            return {...character, equipment, storage};
        }

        case 'swap-equipment-storage': {
            const equipment = [...(character.equipment ?? [])];
            const storage = [...(character.storage ?? [])];

            if (
                patch.equipmentIndex < 0 || patch.equipmentIndex >= equipment.length ||
                patch.storageIndex < 0 || patch.storageIndex >= storage.length
            ) {
                return character;
            }

            const equipmentItem = equipment[patch.equipmentIndex];
            equipment[patch.equipmentIndex] = storage[patch.storageIndex];
            storage[patch.storageIndex] = equipmentItem;

            return {...character, equipment, storage};
        }

        case 'toggle-scroll-use': {
            const equipment = [...(character.equipment ?? [])];
            const item = equipment[patch.equipmentIndex];

            if (!item) return character;

            // Initialize uses array if not present (default 4 uses for scrolls)
            const maxUses = 4;
            const currentUses = item.uses ?? Array(maxUses).fill(false);
            const newUses = [...currentUses];

            // Toggle the specific use
            if (patch.useIndex >= 0 && patch.useIndex < newUses.length) {
                newUses[patch.useIndex] = !newUses[patch.useIndex];
            }

            equipment[patch.equipmentIndex] = {...item, uses: newUses};

            return {...character, equipment};
        }

        case 'equip-weapon': {
            const equipment = [...(character.equipment ?? [])];
            const weapons = [...(character.equippedWeapons ?? [])];
            if (patch.slotIndex < 0) return character;

            // 1. Get the new weapon from inventory
            const newItem = equipment[patch.equipmentIndex];
            if (!newItem) return character;

            // 2. Remove it from inventory
            equipment.splice(patch.equipmentIndex, 1);

            // 3. If slot was occupied, move old weapon back to inventory
            const oldItem = weapons[patch.slotIndex];

            if (oldItem && (oldItem.name || oldItem.key)) {
                equipment.push(oldItem);
            }

            // 4. Update the slot
            weapons[patch.slotIndex] = newItem;

            return { ...character, equipment, equippedWeapons: weapons };
        }

        case 'unequip-weapon': {
            const weapons = [...(character.equippedWeapons ?? [])];
            const item = weapons[patch.slotIndex];

            // Guard: Only unequip if it's a real item
            if (!item || (!item.name && !item.key)) return character;

            // 1. Remove the item from the array (don't just null it)
            weapons.splice(patch.slotIndex, 1);

            // 2. Return clean state
            return {
                ...character,
                // Filter ensures no {} or nulls ever persist in the weapon list
                equippedWeapons: weapons.filter(w => w && (w.name || w.key)),
                equipment: [...(character.equipment ?? []), item]
            };
        }

        case 'equip-armor': {
            const equipment = [...(character.equipment ?? [])];
            const newItem = equipment[patch.equipmentIndex];
            if (!newItem) return character;

            equipment.splice(patch.equipmentIndex, 1);

            const oldArmor = character.equippedArmor;
            const nextEquipment = oldArmor ? [...equipment, oldArmor] : equipment;

            return { ...character, equipment: nextEquipment, equippedArmor: newItem };
        }

        case 'unequip-armor': {
            const item = character.equippedArmor;
            if (!item) return character;

            return {
                ...character,
                equippedArmor: null,
                equipment: [...(character.equipment ?? []), item]
            };
        }

        case 'modifier-add': {
            return {
                ...character,
                modifiers: [...(character.modifiers ?? []), patch.modifier]
            };
        }

        case 'modifier-remove': {
            const next = (character.modifiers ?? []).filter(m => m.id !== patch.modifierId);
            return {...character, modifiers: next};
        }

        case 'modifier-update': {
            const next = (character.modifiers ?? []).map(m =>
                m.id === patch.modifierId ? {...m, ...patch.modifier} : m
            );
            return {...character, modifiers: next};
        }

        case 'ammo-use': {
            const equipment = [...(character.equipment ?? [])];
            const item = equipment[patch.equipmentIndex];
            if (!item) return character;

            if ((item.amount ?? 1) > 1) {
                equipment[patch.equipmentIndex] = {
                    ...item,
                    amount: (item.amount ?? 1) - 1
                };
            } else {
                equipment.splice(patch.equipmentIndex, 1);
            }
            return { ...character, equipment };
        }
    }
}
