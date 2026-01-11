import {CharacterUpdateRequest, OptimisticPatch} from "@/hooks/models.ts";

export function patchToRequest(
    patch: OptimisticPatch
): Partial<CharacterUpdateRequest> {
    switch (patch.kind) {
        case 'simple':
            return { [patch.field]: patch.value };

        case 'armor':
            return {
                equipped_armor: {
                    [patch.field]: patch.value
                }
            };

        case 'weapon':
            return {
                equipped_weapons: [{
                    index: patch.index,
                    field: patch.field,
                    value: patch.value
                }] as any
            };

        case 'equipment':
            return {
                equipment: [{
                    index: patch.index,
                    name: patch.name
                }] as any
            };
        case 'abilities':
            return {
                abilities: patch.abilities.map(a => ({
                    name: a.name,
                    description: a.description
                }))
            };
    }
}
