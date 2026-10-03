import { LIMIT_LIST, LIMIT_NAME, LIMIT_TEXT } from '../lib/class-draft.js';
import { DraftPreviewSchema } from './draft.js';

export { ErrorSchema } from './character.js';

const LocalizedSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['en', 'pl'],
  properties: {
    en: { type: 'string', maxLength: LIMIT_TEXT },
    pl: { type: 'string', maxLength: LIMIT_TEXT },
  },
} as const;

const NameSchema = {
  ...LocalizedSchema,
  properties: {
    en: { type: 'string', maxLength: LIMIT_NAME },
    pl: { type: 'string', maxLength: LIMIT_NAME },
  },
} as const;

const OriginSchema = {
  ...LocalizedSchema,
  properties: {
    ...LocalizedSchema.properties,
    key: { type: 'string', pattern: '^cc\\.[0-9]{1,9}\\.origin\\.[0-9]{1,9}$' },
  },
} as const;

const MODIFIER_CONTEXTS = ['melee', 'ranged', 'defence', 'cast', 'ability', 'test', 'heal', 'buff', 'item'] as const;

const AbilitySchema = {
  type: 'object',
  additionalProperties: false,
  required: ['random', 'name', 'text', 'modifiers'],
  properties: {
    key: { type: 'string', pattern: '^cc\\.[0-9]{1,9}\\.ability\\.[0-9]{1,9}$' },
    random: { type: 'boolean' },
    name: NameSchema,
    text: LocalizedSchema,
    modifiers: {
      type: 'array',
      maxItems: 6,
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['statistic', 'value', 'exclude'],
        properties: {
          statistic: { type: 'string', enum: ['strength', 'agility', 'presence', 'toughness'] },
          value: { type: 'integer', minimum: -10, maximum: 10 },
          exclude: {
            type: 'array',
            uniqueItems: true,
            maxItems: MODIFIER_CONTEXTS.length,
            items: { type: 'string', enum: [...MODIFIER_CONTEXTS] },
          },
        },
      },
    },
  },
} as const;

const StatDiceSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['count', 'faces', 'modifier', 'dropLowest'],
  properties: {
    count: { type: 'integer', minimum: 1, maximum: 6 },
    faces: { type: 'integer', enum: [4, 6, 8, 10, 12] },
    modifier: { type: 'integer', minimum: -6, maximum: 6 },
    dropLowest: { type: 'boolean' },
  },
} as const;

export const ClassDraftSchema = {
  type: 'object',
  additionalProperties: false,
  required: [
    'languages', 'name', 'description', 'stats', 'hpDie', 'omenDie', 'weaponDie', 'armorDie',
    'silver', 'origins', 'abilities', 'randomAbilityCount', 'gettingBetterRule', 'gettingBetterNote',
  ],
  properties: {
    languages: {
      type: 'array',
      minItems: 1,
      maxItems: 2,
      uniqueItems: true,
      items: { type: 'string', enum: ['en', 'pl'] },
    },
    name: NameSchema,
    description: LocalizedSchema,
    stats: {
      type: 'object',
      additionalProperties: false,
      required: ['strength', 'agility', 'presence', 'toughness'],
      properties: {
        strength: StatDiceSchema,
        agility: StatDiceSchema,
        presence: StatDiceSchema,
        toughness: StatDiceSchema,
      },
    },
    hpDie: { type: 'integer', enum: [2, 4, 6, 8, 10, 12] },
    omenDie: { type: 'integer', enum: [2, 4, 6] },
    weaponDie: { type: 'integer', enum: [4, 6, 8, 10] },
    armorDie: { type: 'integer', enum: [2, 3, 4] },
    silver: {
      type: 'object',
      additionalProperties: false,
      required: ['count', 'faces', 'multiplier'],
      properties: {
        count: { type: 'integer', minimum: 1, maximum: 6 },
        faces: { type: 'integer', enum: [4, 6] },
        multiplier: { type: 'integer', minimum: 1, maximum: 100 },
      },
    },
    origins: { type: 'array', maxItems: LIMIT_LIST, items: OriginSchema },
    abilities: { type: 'array', maxItems: LIMIT_LIST, items: AbilitySchema },
    randomAbilityCount: { type: 'integer', minimum: 0, maximum: LIMIT_LIST },
    gettingBetterRule: { type: 'string', enum: ['book', 'book_plus_ability', 'specialist'] },
    gettingBetterNote: LocalizedSchema,
  },
} as const;

export const ClassDraftBodySchema = {
  type: 'object',
  additionalProperties: false,
  required: ['draft'],
  properties: { draft: ClassDraftSchema },
} as const;

export const TestRollBodySchema = {
  type: 'object',
  additionalProperties: false,
  required: ['draft', 'language'],
  properties: {
    draft: ClassDraftSchema,
    language: { type: 'string', enum: ['en', 'pl'] },
  },
} as const;

export const ClassIdParamsSchema = {
  type: 'object',
  required: ['id'],
  properties: { id: { type: 'integer', minimum: 1, maximum: 2147483647 } },
} as const;

export const ClassLocaleQuerySchema = {
  type: 'object',
  properties: { locale: { type: 'string', enum: ['en', 'pl'], default: 'en' } },
} as const;

export const ClassWithDraftSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['id', 'draft'],
  properties: { id: { type: 'integer' }, draft: ClassDraftSchema },
} as const;

export const OwnClassListSchema = {
  type: 'array',
  items: {
    type: 'object',
    additionalProperties: false,
    required: ['id', 'lineageId', 'name', 'description', 'languages', 'visibility', 'status', 'originCount'],
    properties: {
      id: { type: 'integer' },
      lineageId: { type: 'string' },
      name: { type: 'string' },
      description: { type: ['string', 'null'] },
      languages: { type: 'array', items: { type: 'string' } },
      visibility: { type: 'string', enum: ['private', 'public'] },
      status: { type: 'string', enum: ['draft', 'active', 'archived'] },
      originCount: { type: 'integer' },
    },
  },
} as const;

export const TestRollResponseSchema = DraftPreviewSchema;
