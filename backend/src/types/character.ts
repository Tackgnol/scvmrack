export type Ability = {
  name?: string;
  description?: string;
};

export interface CharacterFull {
  id: string;
  name: string;
  className: string;
  classDescription: string | null;
  // Localized texts from the view/function
  origin: string | null;
  // Stats
  strength: number;
  agility: number;
  presence: number;
  toughness: number;
  maxHp: number;
  currentHp: number;
  silver: number;
  omens: number;
  maxOmens: number;
  // JSONB data
  abilities: Array<{ key: string; name: string; description: string }>;
  equipment: Array<{
    key: string;
    name: string;
    description: string;
    tags: string[];
    dice: string[];
    uses?: number;
  }>;
  storage: Array<{
    key: string;
    name: string;
    description: string;
    tags: string[];
    dice: string[];
  }>;
  equippedWeapons: Array<{
    key: string;
    name: string;
    description: string;
    dice: string[];
    tags: string[];
  }>;
  equippedArmor: {
    key: string;
    name: string;
    description: string;
    dice: string[];
    maxTier: number;
    tags: string[];
  } | null;
  encumbrance?: number;
  maxEncumbrance?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CharacterUpdate {
  abilities?: Array<{ key?: string; name: string; description: string }>;
  name?: string;
  currentHp?: number;
  omens?: number;
  silver?: number;
  equipment?: Array<{ key?: string; name?: string; description?: string }>;
  storage?: Array<{ key?: string; name?: string; description?: string }>;
  equippedWeapons?: Array<{
    name?: string;
    description?: string;
    dice?: number[];
  }>;
  equippedArmor?: {
    name?: string;
    description?: string;
    maxTier?: number;
    dice?: number[];
  };
  agility?: number;
  strength?: number;
  presence?: number;
  toughness?: number;
  trait1?: string;
  trait2?: string;
  habit?: string;
  bodyDescription?: string;
  origin?: string;
  notes?: string;
}

export interface GenerateCharacterParams {
  classId?: number | null;
}
