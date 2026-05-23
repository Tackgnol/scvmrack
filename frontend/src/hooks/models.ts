export type SimpleField =
    | 'abilities'
    | 'silver'
    | 'strength'
    | 'agility'
    | 'presence'
    | 'toughness'
    | 'omens'
    | 'currentHp'
    | 'maxHp'
    | 'name'
    | 'habit'
    | 'tale'
    | 'trait1'
    | 'trait2'
    | 'bodyDescription'
    | 'origin'
    | 'notes'
    | 'modifiers'

export type Statistic = 'agility' | 'strength' | 'presence' | 'toughness';

export type Ability = {
    key?: string;
    name?: string;
    description?: string;
    comment?: string;
};

export type CustomItemCategory =
    | 'misc'
    | 'weapon'
    | 'armor'
    | 'ammo'
    | 'consumable';

export type UseCountRule = {
    mode?: 'fixed' | 'fixedPlusModifier';
    base?: number;
    statistic?: Statistic;
};

export type EquipmentItem = {
    key?: string;
    name?: string;
    description?: string;
    uses?: boolean[];
    dice?: number[];
    tags?: string[];
    comments?: string;
    source?: 'custom' | 'catalog' | string;
    category?: CustomItemCategory | string;
    value?: number;
    maxTier?: number;
    currentTier?: number;
    amount?: number;
    ammoType?: string;
    useCountRule?: UseCountRule;
    modifiers?: CustomModifier[];
};

export type WeaponItem = EquipmentItem;

export type ArmorItem = EquipmentItem | null;

export type CustomModifier = {
    id?: string;
    name?: string;
    value?: number;
    source?: string;
    statistic?: Statistic;
    exclude?: string[];
    // Source-of-truth scope tag for modifiers authored via the custom-item form.
    // `exclude` is the derived form used at calculation time; `scope` lets us
    // recover the original intent if the scope→exclude mapping ever changes.
    scope?: 'all' | 'combat' | 'defence' | 'melee' | 'ranged' | 'powers';
    comment?: string;
};

export type ComputedModifier = {
    value?: number;
    source?: string;
    statistic?: Statistic;
    exclude?: string[];
    origin?: 'armor' | 'weapon' | 'pet' | 'system';
    originKey?: string;
    originName?: string;
};

export type Character = {
    id?: string;
    name?: string;
    classId?: number;
    className?: string;
    classDescription?: string;
    origin?: string;
    strength?: number;
    agility?: number;
    presence?: number;
    toughness?: number;
    maxHp?: number;
    currentHp?: number;
    omens?: number;
    maxOmens?: number;
    silver?: number;
    habit?: string;
    tale?: string;
    bodyDescription?: string;
    trait1?: string;
    trait2?: string;
    notes?: string;
    abilities?: Ability[];
    equipment?: EquipmentItem[];
    storage?: EquipmentItem[];
    equippedWeapons?: WeaponItem[];
    equippedArmor?: ArmorItem;
    modifiers?: CustomModifier[];
    computedModifiers?: ComputedModifier[];
    encumbrance?: number;
    maxEncumbrance?: number;
    drToDodge?: number;
    drToMelee?: number;
    drToRanged?: number;
    createdAt?: string;
    updatedAt?: string;
};

export type CharacterResponse = Character;

export type CharacterUpdateRequest = Partial<{
    name: string;
    currentHp: number;
    maxHp: number;
    omens: number;
    maxOmens: number;
    silver: number;
    strength: number;
    agility: number;
    presence: number;
    toughness: number;
    trait1: string;
    trait2: string;
    habit: string;
    tale: string;
    bodyDescription: string;
    origin: string;
    notes: string;
    abilities: Ability[];
    equipment: EquipmentItem[];
    storage: EquipmentItem[];
    equippedWeapons: WeaponItem[];
    equippedArmor: ArmorItem;
    modifiers: CustomModifier[];
}>;

export type CharacterListItem = {
    id?: string;
    name?: string;
    classId?: number;
    className?: string;
    currentHp?: number;
    maxHp?: number;
    createdAt?: string;
    updatedAt?: string;
};

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
    | { kind: 'ammo-use'; equipmentIndex: number }


export type UpdateMutationContext = {
    previousCharacter: CharacterResponse | undefined;
    queryKey: any[];
};

/** Base modifier shape for DR computation - use primitives for flexibility */
export type BaseModifier = {
    value?: number;
    source?: string;
    statistic?: Statistic;
    exclude?: string[];
};

/** API Error response */
export type ApiError = {
    error?: string;
};
