// ═══════════════════════════════════════════
// CHARACTER TYPES
// ═══════════════════════════════════════════

export type AbilityName = 'agility' | 'presence' | 'strength' | 'toughness';

export type StatType = 
  | 'all' 
  | 'agi' 
  | 'pre' 
  | 'str' 
  | 'tou' 
  | 'def' 
  | 'hp' 
  | 'atk' 
  | 'dmg';

export interface Abilities {
  agility: number;
  presence: number;
  strength: number;
  toughness: number;
}

export interface HitPoints {
  current: number;
  max: number;
}

export interface EquippedItem {
  name: string;
  damage?: string;
  detail?: string;
  protection?: string;
  effect?: string;
}

export interface EquippedGear {
  weapon: EquippedItem;
  offhand: EquippedItem;
  armor: EquippedItem;
  other: EquippedItem;
}

export type EquipmentSlot = keyof EquippedGear;
export type EquipmentField = 'name' | 'damage' | 'detail' | 'protection' | 'effect';

export interface Power {
  name: string;
  uses: [boolean, boolean, boolean];
}

export interface Modifier {
  id: number;
  name: string;
  stat: StatType;
  value: string;
  comment: string;
}

export interface ModifierInput {
  name: string;
  stat: StatType;
  value: string;
  comment?: string;
}

export interface Character {
  name: string;
  className: string;
  traits: string;
  classAbilities: string;
  abilities: Abilities;
  hp: HitPoints;
  omens: number;
  silver: number;
  armorTier: string;
  equipped: EquippedGear;
  onHand: string[];
  backpack: string[];
  powers: Power[];
  modifiers: Modifier[];
  notes: string;
}

// ═══════════════════════════════════════════
// STORE TYPES
// ═══════════════════════════════════════════

export interface CharacterActions {
  // Basic setters
  setName: (name: string) => void;
  setClassName: (className: string) => void;
  setTraits: (traits: string) => void;
  setClassAbilities: (classAbilities: string) => void;
  setNotes: (notes: string) => void;

  // Abilities
  setAbility: (ability: AbilityName, value: number) => void;
  adjustAbility: (ability: AbilityName, delta: number) => void;

  // Vitals
  setHp: (current: number | null, max: number | null) => void;
  adjustHp: (delta: number) => void;
  setOmens: (omens: number) => void;
  setSilver: (silver: number) => void;
  setArmorTier: (armorTier: string) => void;

  // Equipment
  setEquipped: (slot: EquipmentSlot, field: EquipmentField, value: string) => void;

  // Inventory
  setOnHandItem: (index: number, value: string) => void;
  setBackpackItem: (index: number, value: string) => void;

  // Powers
  setPowerName: (index: number, name: string) => void;
  togglePowerUse: (powerIndex: number, useIndex: number) => void;

  // Modifiers
  addModifier: (modifier: ModifierInput) => void;
  removeModifier: (id: number) => void;
  getModifierTotal: (stat: StatType) => number;

  // Computed
  getDefense: () => number;

  // Reset
  resetCharacter: () => void;
}

export type CharacterStore = Character & CharacterActions;

// ═══════════════════════════════════════════
// COMPONENT PROPS
// ═══════════════════════════════════════════

export interface AbilityCardProps {
  ability: AbilityName;
  rotate?: number;
}

export interface ModifierTagProps {
  modifier: Modifier;
  onRemove: () => void;
}

export interface ModalButtonProps {
  variant?: 'primary' | 'secondary' | 'danger';
  children: React.ReactNode;
  onClick?: () => void;
}

export interface MorkBorgModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

export interface GearSlotProps {
  label: string;
  name: string;
  detail?: string;
  onNameChange: (value: string) => void;
  onDetailChange?: (value: string) => void;
  detailPlaceholder?: string;
}

export interface ItemSlotProps {
  number: number;
  value: string;
  onChange: (value: string) => void;
  variant?: 'default' | 'onhand';
}

export interface PowerRowProps {
  number: number;
  power: Power;
  onNameChange: (name: string) => void;
  onToggleUse: (useIndex: number) => void;
}

// ═══════════════════════════════════════════
// THEME TYPES
// ═══════════════════════════════════════════

export interface MorkBorgColors {
  yellow: string;
  pink: string;
  black: string;
  white: string;
  grey: string;
  darkGrey: string;
}

export type StatColorMap = Record<StatType, string>;
