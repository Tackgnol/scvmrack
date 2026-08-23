// Stricter schema definitions with validation limits
// Use these in your route schemas

import { MISERY_MAX, MISERY_MIN } from '../lib/character-limits.js';

export const CharacterIdParamsSchema = {
  type: 'object',
  required: ['id'],
  properties: {
    id: {
      type: 'string',
      format: 'uuid',
    },
  },
} as const;

export const LocaleQuerySchema = {
  type: 'object',
  properties: {
    locale: {
      type: 'string',
      enum: ['en', 'pl'],
      default: 'en',
    },
  },
} as const;

// Same as LocaleQuerySchema but WITHOUT a default. The character-list route
// falls back to the Accept-Language header when no explicit ?locale is given;
// a schema default would populate request.query.locale='en' and silently
// suppress that fallback (the locale would never be "absent").
export const LocaleQueryNoDefaultSchema = {
  type: 'object',
  properties: {
    locale: {
      type: 'string',
      enum: ['en', 'pl'],
    },
  },
} as const;

const EquipmentItemSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    key: { type: 'string', maxLength: 100 },
    name: { type: 'string', maxLength: 255 },
    description: { type: 'string', maxLength: 1000 },
    comments: { type: 'string', maxLength: 1000 },
    source: { type: 'string', maxLength: 50 },
    category: { type: 'string', maxLength: 50 },
    value: { type: 'integer', minimum: 0, maximum: 1000000 },
    uses: {
      type: 'array',
      items: { type: 'boolean' },
      maxItems: 50,
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
    maxTier: { type: 'integer', minimum: 0, maximum: 4 },
    currentTier: { type: 'integer', minimum: 0, maximum: 4 },
    amount: { type: 'integer', minimum: 0, maximum: 999 },
    ammoType: { type: 'string', maxLength: 50 },
    useCountRule: {
      type: 'object',
      additionalProperties: false,
      properties: {
        mode: { type: 'string', enum: ['fixed', 'fixedPlusModifier'] },
        base: { type: 'integer', minimum: 0, maximum: 50 },
        statistic: {
          type: 'string',
          enum: ['agility', 'strength', 'presence', 'toughness'],
        },
      },
    },
    modifiers: {
      type: 'array',
      maxItems: 10,
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          id: { type: 'string', maxLength: 36 },
          name: { type: 'string', maxLength: 255 },
          value: { type: 'number', minimum: -20, maximum: 20 },
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
          scope: {
            type: 'string',
            enum: ['all', 'combat', 'defence', 'melee', 'ranged', 'powers'],
          },
          comment: { type: 'string', maxLength: 500 },
        },
      },
    },
  },
} as const;

const AbilitySchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    key: { type: 'string', maxLength: 100 },
    name: { type: 'string', maxLength: 500 },
    description: { type: 'string', maxLength: 2000 },
    comment: { type: 'string', maxLength: 1000 },
  },
} as const;

const WeaponSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    key: { type: 'string', maxLength: 100 },
    name: { type: 'string', maxLength: 255 },
    description: { type: 'string', maxLength: 1000 },
    comments: { type: 'string', maxLength: 1000 },
    source: { type: 'string', maxLength: 50 },
    category: { type: 'string', maxLength: 50 },
    value: { type: 'integer', minimum: 0, maximum: 1000000 },
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
    ammoType: { type: 'string', maxLength: 50 },
    modifiers: EquipmentItemSchema.properties.modifiers,
  },
} as const;

const ArmorSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    key: { type: 'string', maxLength: 100 },
    name: { type: 'string', maxLength: 255 },
    description: { type: 'string', maxLength: 1000 },
    comments: { type: 'string', maxLength: 1000 },
    source: { type: 'string', maxLength: 50 },
    category: { type: 'string', maxLength: 50 },
    value: { type: 'integer', minimum: 0, maximum: 1000000 },
    dice: {
      type: 'array',
      items: { type: 'integer', minimum: 1, maximum: 20 },
      maxItems: 5,
    },
    maxTier: { type: 'integer', minimum: 0, maximum: 4 },
    currentTier: { type: 'integer', minimum: 0, maximum: 4 },
    tags: {
      type: 'array',
      items: { type: 'string', maxLength: 50 },
      maxItems: 10,
    },
    modifiers: EquipmentItemSchema.properties.modifiers,
  },
} as const;

// Custom modifier schema (player-created)
const ModifierSchemaDefs = {
  type: 'object',
  additionalProperties: false,
  properties: {
    id: { type: 'string', maxLength: 36 },
    name: { type: 'string', maxLength: 255 },
    value: { type: 'number', minimum: -20, maximum: 20 },
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
    scope: {
      type: 'string',
      enum: ['all', 'combat', 'defence', 'melee', 'ranged', 'powers'],
    },
    comment: { type: 'string', maxLength: 500 },
  },
} as const;

// Computed modifier schema (from equipped items)
const ComputedModifierSchemaDefs = {
  type: 'object',
  additionalProperties: false,
  properties: {
    value: { type: 'number', minimum: -20, maximum: 20 },
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
    originKey: { type: 'string', maxLength: 255 },
    originName: { type: 'string', maxLength: 255 },
  },
} as const;

// Aliases for backwards compatibility
const ModifierSchema = ModifierSchemaDefs;
const ComputedModifierSchema = ComputedModifierSchemaDefs;

export const UpdateBodySchema = {
  type: 'object',
  additionalProperties: false, // Fastify's default Ajv strips unknown fields
  properties: {
    name: { type: 'string', maxLength: 255 },
    currentHp: { type: 'integer', minimum: -100, maximum: 1000 },
    maxHp: { type: 'integer', minimum: 1, maximum: 1000 },
    omens: { type: 'integer', minimum: 0, maximum: 100 },
    maxOmens: { type: 'integer', minimum: 0, maximum: 100 },
    silver: { type: 'integer', minimum: 0, maximum: 1000000 },
    strength: { type: 'integer', minimum: 1, maximum: 30 },
    agility: { type: 'integer', minimum: 1, maximum: 30 },
    presence: { type: 'integer', minimum: 1, maximum: 30 },
    toughness: { type: 'integer', minimum: 1, maximum: 30 },
    trait1: { type: 'string', maxLength: 255 },
    trait2: { type: 'string', maxLength: 255 },
    habit: { type: 'string', maxLength: 1000 },
    tale: { type: 'string', maxLength: 1000 },
    bodyDescription: { type: 'string', maxLength: 1000 },
    origin: { type: 'string', maxLength: 1000 },
    notes: { type: 'string', maxLength: 10000 },
    miseryCount: {
      type: 'integer',
      minimum: MISERY_MIN,
      maximum: MISERY_MAX,
    },
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
    equippedWeapons: {
      type: 'array',
      items: WeaponSchema,
      maxItems: 10,
    },
    equippedArmor: {
      oneOf: [ArmorSchema, { type: 'null' }],
    },
    modifiers: {
      type: 'array',
      items: ModifierSchema,
      maxItems: 30,
    },
  },
} as const;

export const CharacterSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    name: { type: 'string' },
    classId: { type: ['integer', 'null'] },
    className: { type: ['string', 'null'] },
    classDescription: { type: ['string', 'null'] },
    origin: { type: ['string', 'null'] },
    strength: { type: 'integer' },
    agility: { type: 'integer' },
    presence: { type: 'integer' },
    toughness: { type: 'integer' },
    maxHp: { type: 'integer' },
    currentHp: { type: 'integer' },
    omens: { type: 'integer' },
    maxOmens: { type: 'integer' },
    silver: { type: 'integer' },
    habit: { type: ['string', 'null'] },
    tale: { type: ['string', 'null'] },
    bodyDescription: { type: ['string', 'null'] },
    trait1: { type: ['string', 'null'] },
    trait2: { type: ['string', 'null'] },
    notes: { type: 'string' },
    miseryCount: { type: 'integer' },
    abilities: { type: 'array', items: AbilitySchema },
    equipment: { type: 'array', items: EquipmentItemSchema },
    storage: { type: 'array', items: EquipmentItemSchema },
    equippedWeapons: { type: 'array', items: WeaponSchema },
    equippedArmor: { oneOf: [ArmorSchema, { type: 'null' }] },
    modifiers: { type: 'array', items: ModifierSchema },
    computedModifiers: { type: 'array', items: ComputedModifierSchema },
    encumbrance: { type: 'integer' },
    maxEncumbrance: { type: 'integer' },
    drToDodge: { type: 'integer' },
    drToMelee: { type: 'integer' },
    drToRanged: { type: 'integer' },
    partyId: { type: ['string', 'null'], format: 'uuid' },
    joinedAt: { type: ['string', 'null'], format: 'date-time' },
    viewerAccess: { type: 'string', enum: ['owner', 'party'] },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
  },
} as const;

export const ErrorSchema = {
  type: 'object',
  properties: {
    error: { type: 'string' },
    message: { type: 'string' },
    code: { type: 'string' },
    statusCode: { type: 'integer' },
    requestId: { type: 'string' },
    details: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          field: { type: 'string' },
          message: { type: 'string' },
          code: { type: 'string' },
        },
        required: ['message'],
      },
    },
  },
  required: ['error', 'message', 'code', 'statusCode', 'requestId'],
} as const;

export const GenerateBodySchema = {
  type: 'object',
  properties: {
    classId: { type: 'integer', minimum: 1, maximum: 6 },
    // Opt-in for guests: replace the single scvm an anonymous session already
    // owns. Without it, creating a second one is a 409 (see character-service).
    replace: { type: 'boolean' },
    draft: {
      type: 'object',
      additionalProperties: false,
      required: ['classId', 'classless', 'seeds'],
      properties: {
        classId: { type: ['integer', 'null'], minimum: 1, maximum: 100 },
        classless: { type: 'boolean' },
        name: { type: 'string', maxLength: 255 },
        dropLowestAbilities: {
          type: 'array',
          items: {
            type: 'string',
            enum: ['strength', 'agility', 'presence', 'toughness'],
          },
          uniqueItems: true,
          maxItems: 2,
        },
        seeds: {
          type: 'object',
          additionalProperties: false,
          required: ['name', 'stats', 'omens', 'silver', 'origin', 'abilities', 'gear', 'personality'],
          properties: {
            name: { type: 'string', pattern: '^[0-9a-f]{64}$' },
            stats: { type: 'string', pattern: '^[0-9a-f]{64}$' },
            omens: { type: 'string', pattern: '^[0-9a-f]{64}$' },
            silver: { type: 'string', pattern: '^[0-9a-f]{64}$' },
            origin: { type: 'string', pattern: '^[0-9a-f]{64}$' },
            abilities: { type: 'string', pattern: '^[0-9a-f]{64}$' },
            gear: { type: 'string', pattern: '^[0-9a-f]{64}$' },
            personality: { type: 'string', pattern: '^[0-9a-f]{64}$' },
          },
        },
      },
    },
  },
} as const;
