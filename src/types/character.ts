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
    abilities: string[]; // Array of translation keys
    equipment: Array<{ key: string; tags?: string[] }>;
    equipped_weapons: Array<{ key: string }>;
    equipped_armor: { key: string } | null;
    created_at: string;
    updated_at: string;
}

export interface CharacterUpdate {
    name?: string;
    current_hp?: number;
    omens?: number;
    silver?: number;
    equipment?: any[];
    equipped_weapons?: any[];
    equipped_armor?: any | null;
    strength: number;
    agility: number;
    presence: number;
    toughness: number;
    abilities: Ability[]
}

export interface GenerateCharacterParams {
    class_id?: number | null;
}
