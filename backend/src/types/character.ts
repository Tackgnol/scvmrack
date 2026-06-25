import type { CharacterDraft } from '../lib/draft-seeds.js';

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
    uses?: boolean[];
    comments?: string;
    source?: string;
    category?: string;
    value?: number;
    maxTier?: number;
    currentTier?: number;
    amount?: number;
    ammoType?: string;
    modifiers?: Array<{
      value?: number;
      source?: string;
      statistic?: string;
      exclude?: string[];
    }>;
  }>;
  storage: Array<{
    key: string;
    name: string;
    description: string;
    tags: string[];
    dice: string[];
    uses?: boolean[];
    comments?: string;
    source?: string;
    category?: string;
    value?: number;
    maxTier?: number;
    currentTier?: number;
    amount?: number;
    ammoType?: string;
    modifiers?: Array<{
      value?: number;
      source?: string;
      statistic?: string;
      exclude?: string[];
    }>;
  }>;
  equippedWeapons: Array<{
    key: string;
    name: string;
    description: string;
    dice: string[];
    tags: string[];
    comments?: string;
    source?: string;
    category?: string;
    value?: number;
    ammoType?: string;
    modifiers?: Array<{
      value?: number;
      source?: string;
      statistic?: string;
      exclude?: string[];
    }>;
  }>;
  equippedArmor: {
    key: string;
    name: string;
    description: string;
    dice: string[];
    maxTier: number;
    currentTier?: number;
    tags: string[];
    comments?: string;
    source?: string;
    category?: string;
    value?: number;
    modifiers?: Array<{
      value?: number;
      source?: string;
      statistic?: string;
      exclude?: string[];
    }>;
  } | null;
  encumbrance?: number;
  maxEncumbrance?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CharacterUpdateModifier {
  id?: string;
  name?: string;
  value?: number;
  source?: string;
  statistic?: string;
  exclude?: string[];
  comment?: string;
}

export interface CharacterUpdateUseCountRule {
  mode?: 'fixed' | 'fixedPlusModifier';
  base?: number;
  statistic?: string;
}

export interface CharacterUpdateEquipmentItem {
  key?: string;
  name?: string;
  description?: string;
  comments?: string;
  source?: string;
  category?: string;
  value?: number;
  uses?: boolean[];
  dice?: number[];
  tags?: string[];
  maxTier?: number;
  currentTier?: number;
  amount?: number;
  ammoType?: string;
  useCountRule?: CharacterUpdateUseCountRule;
  modifiers?: CharacterUpdateModifier[];
}

export interface CharacterUpdate {
  abilities?: Array<{ key?: string; name: string; description: string }>;
  name?: string;
  currentHp?: number;
  omens?: number;
  silver?: number;
  equipment?: CharacterUpdateEquipmentItem[];
  storage?: CharacterUpdateEquipmentItem[];
  equippedWeapons?: Array<{
    key?: string;
    name?: string;
    description?: string;
    comments?: string;
    source?: string;
    category?: string;
    value?: number;
    dice?: number[];
    tags?: string[];
    ammoType?: string;
    modifiers?: CharacterUpdateModifier[];
  }>;
  equippedArmor?: {
    key?: string;
    name?: string;
    description?: string;
    comments?: string;
    source?: string;
    category?: string;
    value?: number;
    maxTier?: number;
    currentTier?: number;
    dice?: number[];
    tags?: string[];
    modifiers?: CharacterUpdateModifier[];
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
  draft?: CharacterDraft | null;
  replace?: boolean;
}
