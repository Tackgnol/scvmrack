import {paths} from "@/api";

export type Ability = {
    name?: string;
    description?: string;
};

export type SimpleField =
    | 'abilities'
    | 'silver'
    | 'strength'
    | 'agility'
    | 'presence'
    | 'toughness'
    | 'omens'
    | 'current_hp'
    | 'max_hp'
    | 'name'
    | 'habit'
    | 'tale'
    | 'trait1'
    | 'trait2'
    | 'body_description'
    | 'origin'

export type CharacterResponse = NonNullable<paths['/characters/{id}']['get']['responses']['200']['content']['application/json']>;
export type CharacterUpdateRequest = NonNullable<paths['/characters/{id}']['patch']['requestBody']>['content']['application/json'];

export type OptimisticPatch =
    | { kind: 'simple'; field: SimpleField; value: number | string }
    | { kind: 'armor'; field: string; value: string }
    | { kind: 'weapon'; index: number; field: string; value: string }
    | { kind: 'equipment'; index: number; name: string }
    | { kind: 'abilities'; abilities: Ability[] };


export type UpdateMutationContext = {
    previousCharacter: CharacterResponse | undefined;
    queryKey: any[];
};

