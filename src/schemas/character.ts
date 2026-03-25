// Stricter schema definitions with validation limits
// Use these in your route schemas

import { Json } from "../queries/equipment.queries.js";

export type CharacterPatch = {
  name?: string;
  current_hp?: number;
  omens?: number;
  silver?: number;
  agility?: number;
  strength?: number;
  presence?: number;
  toughness?: number;
  habit?: string;
  body_description?: string;
  origin?: string;
  notes?: string;
  trait1?: string;
  trait2?: string;

  abilities?: Json;
  equipment?: Json;
  storage?: Json;
  equipped_weapons?: Json;
  equipped_armor?: Json;
  modifiers?: Json;
};

export const CharacterIdParamsSchema = {
  type: 'object',
  required: ['id'],
  properties: {
    id: {
      type: 'string',
      format: 'uuid',
    },
  },
};

export const LocaleQuerySchema = {
  type: 'object',
  properties: {
    locale: {
      type: 'string',
      enum: ['en', 'pl'],
      default: 'en',
    },
  },
};

const EquipmentItemSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    key: { type: 'string', maxLength: 100 },
    name: { type: 'string', maxLength: 255 },
    description: { type: 'string', maxLength: 1000 },
    uses: {
      type: 'array',
      items: { type: 'boolean' },
      maxItems: 10,
    },
    dice: {
      type: 'array',
      items: { type: 'integer', minimum: 1, maximum: 20 },
      maxItems: 5,
    },
    tags: {
      type: 'array',
      items: { type: 'string', maxLength: 50 },
      maxItems: 10,
    },
    max_tier: { type: 'integer', minimum: 0, maximum: 4 },
    current_tier: { type: 'integer', minimum: 0, maximum: 4 },
  },
};

const AbilitySchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    key: { type: 'string', maxLength: 100 },
    name: { type: 'string', maxLength: 500 },
    description: { type: 'string', maxLength: 2000 },
    comment: { type: 'string', maxLength: 1000 },
  },
};

const WeaponSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    key: { type: 'string', maxLength: 100 },
    name: { type: 'string', maxLength: 255 },
    description: { type: 'string', maxLength: 1000 },
    dice: {
      type: 'array',
      items: { type: 'integer', minimum: 1, maximum: 20 },
      maxItems: 5,
    },
    tags: {
      type: 'array',
      items: { type: 'string', maxLength: 50 },
      maxItems: 10,
    },
  },
};

const ArmorSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    key: { type: 'string', maxLength: 100 },
    name: { type: 'string', maxLength: 255 },
    description: { type: 'string', maxLength: 1000 },
    dice: {
      type: 'array',
      items: { type: 'integer', minimum: 1, maximum: 20 },
      maxItems: 5,
    },
    max_tier: { type: 'integer', minimum: 0, maximum: 4 },
    current_tier: { type: 'integer', minimum: 0, maximum: 4 },
    tags: {
      type: 'array',
      items: { type: 'string', maxLength: 50 },
      maxItems: 10,
    },
  },
};

// Custom modifier schema (player-created)
const ModifierSchemaDefs = {
  type: 'object',
  additionalProperties: false,
  properties: {
    id: { type: 'string', maxLength: 36 },
    name: { type: 'string', maxLength: 255 },
    value: { type: 'number' },
    source: { type: 'string', maxLength: 255 },
    statistic: {
      type: 'string',
      enum: ['agility', 'strength', 'presence', 'toughness'],
    },
    exclude: {
      type: 'array',
      items: { type: 'string', maxLength: 50 },
      maxItems: 15,
    },
    comment: { type: 'string', maxLength: 500 },
  },
};

// Computed modifier schema (from equipped items)
const ComputedModifierSchemaDefs = {
  type: 'object',
  additionalProperties: false,
  properties: {
    value: { type: 'number' },
    source: { type: 'string', maxLength: 255 },
    statistic: {
      type: 'string',
      enum: ['agility', 'strength', 'presence', 'toughness'],
    },
    exclude: {
      type: 'array',
      items: { type: 'string', maxLength: 50 },
      maxItems: 15,
    },
    origin: { type: 'string', enum: ['armor', 'weapon', 'pet', 'system'] },
    origin_key: { type: 'string', maxLength: 255 },
    origin_name: { type: 'string', maxLength: 255 },
  },
};

// Aliases for backwards compatibility
const ModifierSchema = ModifierSchemaDefs;
const ComputedModifierSchema = ComputedModifierSchemaDefs;

export const UpdateBodySchema = {
  type: 'object',
  additionalProperties: false, // Reject unknown fields
  properties: {
    name: { type: 'string', maxLength: 255 },
    current_hp: { type: 'integer', minimum: -100, maximum: 1000 },
    max_hp: { type: 'integer', minimum: 1, maximum: 1000 },
    omens: { type: 'integer', minimum: 0, maximum: 100 },
    max_omens: { type: 'integer', minimum: 0, maximum: 100 },
    silver: { type: 'integer', minimum: 0, maximum: 1000000 },
    strength: { type: 'integer', minimum: 1, maximum: 30 },
    agility: { type: 'integer', minimum: 1, maximum: 30 },
    presence: { type: 'integer', minimum: 1, maximum: 30 },
    toughness: { type: 'integer', minimum: 1, maximum: 30 },
    trait1: { type: 'string', maxLength: 255 },
    trait2: { type: 'string', maxLength: 255 },
    habit: { type: 'string', maxLength: 1000 },
    tale: { type: 'string', maxLength: 1000 },
    body_description: { type: 'string', maxLength: 1000 },
    origin: { type: 'string', maxLength: 1000 },
    notes: { type: 'string', maxLength: 10000 },
    abilities: {
      type: 'array',
      items: AbilitySchema,
      maxItems: 20,
    },
    equipment: {
      type: 'array',
      items: EquipmentItemSchema,
      maxItems: 50,
    },
    storage: {
      type: 'array',
      items: EquipmentItemSchema,
      maxItems: 100,
    },
    equipped_weapons: {
      type: 'array',
      items: WeaponSchema,
      maxItems: 10,
    },
    equipped_armor: {
      oneOf: [ArmorSchema, { type: 'null' }],
    },
    modifiers: {
      type: 'array',
      items: ModifierSchema,
      maxItems: 30,
    },
  },
};

export const CharacterSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    name: { type: 'string' },
    class_id: { type: 'integer' },
    class_name: { type: 'string' },
    class_description: { type: 'string' },
    origin: { type: 'string' },
    strength: { type: 'integer' },
    agility: { type: 'integer' },
    presence: { type: 'integer' },
    toughness: { type: 'integer' },
    max_hp: { type: 'integer' },
    current_hp: { type: 'integer' },
    omens: { type: 'integer' },
    max_omens: { type: 'integer' },
    silver: { type: 'integer' },
    habit: { type: 'string' },
    tale: { type: 'string' },
    body_description: { type: 'string' },
    trait1: { type: 'string' },
    trait2: { type: 'string' },
    notes: { type: 'string' },
    abilities: { type: 'array', items: AbilitySchema },
    equipment: { type: 'array', items: EquipmentItemSchema },
    storage: { type: 'array', items: EquipmentItemSchema },
    equipped_weapons: { type: 'array', items: WeaponSchema },
    equipped_armor: { oneOf: [ArmorSchema, { type: 'null' }] },
    modifiers: { type: 'array', items: ModifierSchema },
    computed_modifiers: { type: 'array', items: ComputedModifierSchema },
    encumbrance: { type: 'integer' },
    max_encumbrance: { type: 'integer' },
    dr_to_dodge: { type: 'integer' },
    dr_to_melee: { type: 'integer' },
    dr_to_ranged: { type: 'integer' },
    created_at: { type: 'string', format: 'date-time' },
    updated_at: { type: 'string', format: 'date-time' },
  },
};

export const ErrorSchema = {
  type: 'object',
  properties: {
    error: { type: 'string' },
  },
};

export const GenerateBodySchema = {
  type: 'object',
  properties: {
    class_id: { type: 'integer', minimum: 1, maximum: 6 },
  },
} as const;
