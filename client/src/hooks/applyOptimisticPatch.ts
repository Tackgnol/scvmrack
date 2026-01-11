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

        case 'equipment': {
            const eq = character.equipment;
            if (!eq || !eq[patch.index]) return character;

            const next = [...eq];
            next[patch.index] = {
                ...next[patch.index],
                name: patch.name
            };

            return {...character, equipment: next};
        }
        case 'abilities':
            return {
                ...character,
                abilities: patch.abilities.map(a => ({...a}))
            };

    }
}
