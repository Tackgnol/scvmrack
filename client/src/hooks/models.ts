import {paths} from "@/api";

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
    | 'notes'
    | 'modifiers'

export type Character = NonNullable<
    paths['/characters/{id}']['get']['responses']['200']['content']['application/json']
>;
export type CharacterResponse = NonNullable<paths['/characters/{id}']['get']['responses']['200']['content']['application/json']>;

type PatchRequestBody = NonNullable<paths['/characters/{id}']['patch']['requestBody']>['content']['application/json'];
export type CharacterUpdateRequest = PatchRequestBody;

export type OptimisticPatch =
    | { kind: 'simple'; field: SimpleField; value: number | string }
    | { kind: 'armor'; field: string; value: string | number }
    | { kind: 'weapon'; index: number; field: string; value: string }
    | { kind: 'equipment-item'; index: number; item: EquipmentItem }
    | { kind: 'equipment-add'; item: EquipmentItem }
    | { kind: 'equipment-remove'; index: number }
    | { kind: 'equipment-move'; from: number; to: number }
    | { kind: 'abilities'; abilities: Ability[] }
    | { kind: 'storage-item'; index: number; item: EquipmentItem }
    | { kind: 'storage-add'; item: EquipmentItem }
    | { kind: 'storage-remove'; index: number }
    | { kind: 'move-to-storage'; equipmentIndex: number }
    | { kind: 'move-to-equipment'; storageIndex: number; equipmentPosition?: number }
    | { kind: 'swap-equipment-storage'; equipmentIndex: number; storageIndex: number }
    | { kind: 'toggle-scroll-use'; equipmentIndex: number; useIndex: number }
    | { kind: 'equip-weapon'; equipmentIndex: number; slotIndex: number }
    | { kind: 'unequip-weapon'; slotIndex: number }
    | { kind: 'equip-armor'; equipmentIndex: number }
    | { kind: 'unequip-armor' }
    | { kind: 'modifier-add'; modifier: CustomModifier }
    | { kind: 'modifier-remove'; modifierId: string }
    | { kind: 'modifier-update'; modifierId: string; modifier: Partial<CustomModifier> }


export type UpdateMutationContext = {
    previousCharacter: CharacterResponse | undefined;
    queryKey: any[];
};


/** Equipment item */
export type EquipmentItem = NonNullable<Character['equipment']>[number];

/** Weapon item */
export type WeaponItem = NonNullable<Character['equipped_weapons']>[number];

/** Armor item */
export type ArmorItem = NonNullable<Character['equipped_armor']>;

/** Ability */
export type Ability = NonNullable<Character['abilities']>[number];

/** Custom modifier (player-created) */
export type CustomModifier = NonNullable<Character['modifiers']>[number];

/** Computed modifier (from equipped items) */
export type ComputedModifier = NonNullable<Character['computed_modifiers']>[number];

/** Base modifier shape for DR computation - use primitives for flexibility */
export type BaseModifier = {
    value?: number;
    source?: string;
    statistic?: 'agility' | 'strength' | 'presence' | 'toughness';
    exclude?: string[];
};

/** API Error response */
export type ApiError = {
    error?: string;
};
