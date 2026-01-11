import {CharacterResponse, OptimisticPatch} from "@/hooks/models.ts";

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
            if (!character.equipped_armor) return character;
            return {
                ...character,
                equipped_armor: {
                    ...character.equipped_armor,
                    [patch.field]: patch.value
                }
            };

        case 'weapon': {
            const weapons = character.equipped_weapons;
            if (!weapons || !weapons[patch.index]) return character;

            const next = [...weapons];
            next[patch.index] = {
                ...next[patch.index],
                [patch.field]: patch.value
            };

            return {...character, equipped_weapons: next};
        }

        case 'equipment-item': {
            const next = [...(character.equipment ?? [])];
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
            next.splice(patch.index, 1);
            return {...character, equipment: next};
        }

        case 'equipment-move': {
            const next = [...(character.equipment ?? [])];
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

            if (patch.equipmentPosition !== undefined && patch.equipmentPosition < equipment.length) {
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
            const weapons = [...(character.equipped_weapons ?? [])];

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

            return { ...character, equipment, equipped_weapons: weapons };
        }

        case 'unequip-weapon': {
            const weapons = [...(character.equipped_weapons ?? [])];
            const item = weapons[patch.slotIndex];

            // Guard: Only unequip if it's a real item
            if (!item || (!item.name && !item.key)) return character;

            // 1. Remove the item from the array (don't just null it)
            weapons.splice(patch.slotIndex, 1);

            // 2. Return clean state
            return {
                ...character,
                // Filter ensures no {} or nulls ever persist in the weapon list
                equipped_weapons: weapons.filter(w => w && (w.name || w.key)),
                equipment: [...(character.equipment ?? []), item]
            };
        }

        case 'equip-armor': {
            const equipment = [...(character.equipment ?? [])];
            const newItem = equipment[patch.equipmentIndex];
            if (!newItem) return character;

            equipment.splice(patch.equipmentIndex, 1);

            const oldArmor = character.equipped_armor;
            const nextEquipment = oldArmor ? [...equipment, oldArmor] : equipment;

            return { ...character, equipment: nextEquipment, equipped_armor: newItem };
        }

        case 'unequip-armor': {
            const item = character.equipped_armor;
            if (!item) return character;

            return {
                ...character,
                equipped_armor: null,
                equipment: [...(character.equipment ?? []), item]
            };
        }
    }
}
