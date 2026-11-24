// Stricter schema definitions with validation limits
// Use these in your route schemas

import type { FromSchema, JSONSchema } from 'json-schema-to-ts';
import {
  CHARACTER_INTEGER_BOUNDS,
  CHARACTER_TEXT_BOUNDS,
  type CharacterIntegerField,
  type CharacterTextField,
} from '../lib/character-limits.js';
import { ABILITY_STATS } from '../lib/ability-modifiers.js';
import { SUPPORTED_LOCALES } from '../config/locales.js';

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
      enum: SUPPORTED_LOCALES,
      default: 'en',
    },
  },
} as const;

/** Upper bound of a Postgres INTEGER id or counter. */
const MAX_DB_INT = 2147483647;

/** A positive Postgres INTEGER id. */
export const IdSchema = { type: 'integer', minimum: 1, maximum: MAX_DB_INT } as const;
export const NullableIdSchema = { ...IdSchema, type: ['integer', 'null'] } as const;

/** A null byte cannot be stored in Postgres text, so a token carrying one is refused up front (400) instead of failing in the query (500). */
export const NO_NULL_BYTE_PATTERN = '^[^\\u0000]+$';

/** Locale plus an optional party invite token: the party's Party Class Pool scopes the roll. */
export const InviteLocaleQuerySchema = {
  type: 'object',
  properties: {
    ...LocaleQuerySchema.properties,
    invite: { type: 'string', minLength: 1, maxLength: 200, pattern: NO_NULL_BYTE_PATTERN },
    obrRoom: { type: 'string', minLength: 1, maxLength: 256 },
    obrPlayer: { type: 'string', minLength: 1, maxLength: 256 },
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
      enum: SUPPORTED_LOCALES,
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

const AbilityResponseSchema = {
  ...AbilitySchema,
  properties: {
    ...AbilitySchema.properties,
    table: {
      type: 'object',
      additionalProperties: false,
      required: ['die', 'rows'],
      properties: {
        die: { type: 'integer' },
        rows: {
          type: 'array',
          items: {
            type: 'object',
            additionalProperties: false,
            required: ['roll', 'text', 'itemKey', 'itemName'],
            properties: {
              roll: { type: 'integer' },
              text: { type: 'string' },
              itemKey: { type: ['string', 'null'] },
              itemName: { type: ['string', 'null'] },
            },
          },
        },
      },
    },
  },
} as const;

const StatisticSchema = { type: 'string', enum: ABILITY_STATS } as const;

const TagsSchema = {
  type: 'array',
  items: { type: 'string', maxLength: 50 },
  maxItems: 10,
} as const;

const TierSchema = { type: 'integer', minimum: 0, maximum: 4 } as const;

/** Custom (player-created) modifier. */
const ModifierSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    id: { type: 'string', maxLength: 36 },
    name: { type: 'string', maxLength: 255 },
    value: { type: 'number', minimum: -20, maximum: 20 },
    source: { type: 'string', maxLength: 255 },
    statistic: StatisticSchema,
    exclude: {
      type: 'array',
      items: { type: 'string', maxLength: 50 },
      maxItems: 15,
    },
    scope: {
      type: 'string',
      enum: ['all', 'combat', 'defence', 'tests', 'melee', 'ranged', 'powers'],
    },
    comment: { type: 'string', maxLength: 500 },
  },
} as const;

/** Modifier computed from an equipped item. */
const ComputedModifierSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    value: ModifierSchema.properties.value,
    source: ModifierSchema.properties.source,
    statistic: StatisticSchema,
    exclude: ModifierSchema.properties.exclude,
    origin: { type: 'string', enum: ['armor', 'weapon', 'pet', 'system'] },
    originKey: { type: 'string', maxLength: 255 },
    originName: { type: 'string', maxLength: 255 },
  },
} as const;

/** Fields every stored item (equipment, weapon, armor) shares. */
const ItemBaseProperties = {
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
  tags: TagsSchema,
  modifiers: { type: 'array', maxItems: 10, items: ModifierSchema },
} as const;

const EquipmentItemSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    ...ItemBaseProperties,
    uses: {
      type: 'array',
      items: { type: 'boolean' },
      maxItems: 50,
    },
    maxTier: TierSchema,
    currentTier: TierSchema,
    amount: { type: 'integer', minimum: 0, maximum: 999 },
    ammoType: { type: 'string', maxLength: 50 },
    useCountRule: {
      type: 'object',
      additionalProperties: false,
      properties: {
        mode: { type: 'string', enum: ['fixed', 'fixedPlusModifier'] },
        base: { type: 'integer', minimum: 0, maximum: 50 },
        statistic: StatisticSchema,
      },
    },
  },
} as const;

const WeaponSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    ...ItemBaseProperties,
    ammoType: { type: 'string', maxLength: 50 },
  },
} as const;

const ArmorSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    ...ItemBaseProperties,
    maxTier: TierSchema,
    currentTier: TierSchema,
  },
} as const;


/** A character update's text field, bounded by {@link CHARACTER_TEXT_BOUNDS}. */
function textField<F extends CharacterTextField>(field: F) {
  return { type: 'string', maxLength: CHARACTER_TEXT_BOUNDS[field].maxLength } as const;
}

/** A character update's integer field, bounded by {@link CHARACTER_INTEGER_BOUNDS}. */
function integerField<F extends CharacterIntegerField>(field: F) {
  const { min, max } = CHARACTER_INTEGER_BOUNDS[field];
  return { type: 'integer', minimum: min, maximum: max } as const;
}

export const UpdateBodySchema = {
  type: 'object',
  additionalProperties: false, // Fastify's default Ajv strips unknown fields
  properties: {
    expectedUpdatedAt: { type: 'string', format: 'date-time' },
    saveId: { type: 'string', pattern: '^[A-Za-z0-9-]{1,64}$' },
    name: textField('name'),
    currentHp: integerField('currentHp'),
    maxHp: integerField('maxHp'),
    omens: integerField('omens'),
    maxOmens: integerField('maxOmens'),
    silver: integerField('silver'),
    strength: integerField('strength'),
    agility: integerField('agility'),
    presence: integerField('presence'),
    toughness: integerField('toughness'),
    trait1: textField('trait1'),
    trait2: textField('trait2'),
    habit: textField('habit'),
    tale: textField('tale'),
    bodyDescription: textField('bodyDescription'),
    origin: textField('origin'),
    notes: textField('notes'),
    miseryCount: integerField('miseryCount'),
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
    classAttribution: { type: ['string', 'null'] },
    classAuthoredLanguage: { type: ['string', 'null'], enum: ['en', 'pl', null] },
    classContentRemoved: { type: "boolean" },
    classReportable: { type: "boolean" },
    /** Whether the class is a Custom Class, which has a public detail page. */
    classCustom: { type: "boolean" },
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
    abilities: { type: 'array', items: AbilityResponseSchema },
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

/**
 * What a character response schema describes, with every key present except `viewerAccess`, which
 * only the reads that check access add. Type-level only: the response schemas keep every key optional.
 */
type ResponseSheetOf<S extends { properties: object }> = S & {
  additionalProperties: false;
  required: readonly Exclude<keyof S['properties'], 'viewerAccess'>[];
} extends infer Sheet extends JSONSchema
  ? FromSchema<Sheet>
  : never;

type ResponseSheet = ResponseSheetOf<typeof CharacterSchema>;

/**
 * An ability on a hydrated sheet. A rolled table ability also carries `tableResult`, its rolled row;
 * the response schema's ability does not list it, so it is never sent.
 */
export type SheetAbility = ResponseSheet['abilities'][number] & {
  tableResult?: { roll: number; text: string; itemKey: string | null };
};

/**
 * A hydrated sheet as response schema `S` describes it, derived from the schema so the two can't drift.
 * Only `abilities` is wider, by the unsent `tableResult`.
 */
export type SheetOf<S extends { properties: object }> = Omit<ResponseSheetOf<S>, 'abilities'> & {
  abilities: SheetAbility[];
};

/** The full character sheet `getCharacterFull` returns, as {@link CharacterSchema} describes it. */
export type CharacterSheet = SheetOf<typeof CharacterSchema>;

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
    classId: IdSchema,
    classless: { type: 'boolean' },
    // Opt-in for guests: replace the single scvm an anonymous session already
    // owns. Without it, creating a second one is a 409 (see character-service).
    replace: { type: 'boolean' },
    draft: {
      type: 'object',
      additionalProperties: false,
      required: ['classId', 'classless', 'seeds'],
      properties: {
        classId: NullableIdSchema,
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
