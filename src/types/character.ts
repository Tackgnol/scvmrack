export type Ability = {
    name?: string;
    description?: string;
};

export interface CharacterFull {
    id: string;
    name: string;
    class_name: string;
    // Localized texts from the view/function
    origin_text: string | null;
    habit_text: string | null;
    tale_text: string | null;
    body_text: string | null;
    trait1_text: string | null;
    trait2_text: string | null;
    // Stats
    strength: number;
    agility: number;
    presence: number;
    toughness: number;
    max_hp: number;
    current_hp: number;
    silver: number;
    omens: number;
    // JSONB data
    abilities: Array<{ key: string; name: string; description: string }>;
    equipment: Array<{ key: string; name: string; description: string; tags: string[]; dice: string[]; uses?: number }>;
    storage: Array<{ key: string; name: string; description: string; tags: string[]; dice: string[] }>;
    equipped_weapons: Array<{ key: string; name: string; description: string; dice: string[]; tags: string[] }>;
    equipped_armor: { key: string; name: string; description: string; dice: string[]; max_tier: number; tags: string[] } | null;
    encumbrance?: number;
    max_encumbrance?: number;
    created_at: string;
    updated_at: string;
}

export interface CharacterUpdate {
    abilities?: Array<{ key?: string; name: string; description: string }>;
    name?: string;
    current_hp?: number;
    omens?: number;
    silver?: number;
    equipment?: Array<{ key?: string; name?: string; description?: string }>;
    storage?: Array<{ key?: string; name?: string; description?: string }>;  // NEW
    equipped_weapons?: Array<{ name?: string; description?: string; dice?: number[] }>;
    equipped_armor?: { name?: string; description?: string; max_tier?: number; dice?: number[] };
    agility?: number;
    strength?: number;
    presence?: number;
    toughness?: number;
    trait1?: string;
    trait2?: string;
    habit?: string;
    body_description?: string;
    origin?: string;
    notes?:string;
}

export interface GenerateCharacterParams {
    class_id?: number | null;
}
