import { MODIFIER_CONTEXTS } from '../lib/ability-modifiers.js';
import {
  CLASS_ITEM_TYPES,
  CLASS_LANGUAGES,
  CLASS_STATS,
  DIE_FACES,
  GEAR_EFFECTS,
  GEAR_KINDS,
  LIMIT_LIST,
  LIMIT_NAME,
  LIMIT_TEXT,
  PET_ACTIONS,
  STAT_DIE_FACES,
  TABLE_DICE,
  WEAPON_AMMO,
  WEAPON_REACHES,
} from '../lib/class-draft.js';
import { CLASS_ITEM_KEY } from '../lib/class-items.js';
import {
  CLASS_STATUSES,
  CLASS_VISIBILITIES,
  customClassKeyPattern,
  GETTING_BETTER_RULES,
} from '../lib/class-model.js';
import { MAX_DB_INT } from './character.js';
import { DraftPreviewSchema } from './draft.js';

export { ErrorSchema } from './character.js';

/** One string per class language, each at most `maxLength` long. */
const localized = <const N extends number>(maxLength: N) =>
  ({
    type: 'object',
    additionalProperties: false,
    required: CLASS_LANGUAGES,
    properties: Object.fromEntries(
      CLASS_LANGUAGES.map((language) => [language, { type: 'string', maxLength }])
    ) as Record<(typeof CLASS_LANGUAGES)[number], { type: 'string'; maxLength: N }>,
  }) as const;

const LocalizedSchema = localized(LIMIT_TEXT);
const NameSchema = localized(LIMIT_NAME);
const IdSchema = { type: 'integer', minimum: 1, maximum: MAX_DB_INT } as const;

const OriginSchema = {
  ...LocalizedSchema,
  properties: {
    ...LocalizedSchema.properties,
    key: { type: 'string', pattern: customClassKeyPattern('origin') },
  },
} as const;

const ITEM_REF = `^(new:[A-Za-z0-9-]{1,64}|${CLASS_ITEM_KEY})$`;
const GrantSchema = { type: ['string', 'null'], pattern: ITEM_REF } as const;
const TableRowSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['text', 'itemRef'],
  properties: { text: LocalizedSchema, itemRef: GrantSchema },
} as const;

const AbilityTableSchema = {
  type: ['object', 'null'],
  additionalProperties: false,
  required: ['die', 'rows'],
  properties: {
    die: { type: 'integer', enum: TABLE_DICE },
    rows: { type: 'array', minItems: 2, maxItems: 12, items: TableRowSchema },
  },
} as const;

const ModifiersSchema = {
  type: 'array',
  maxItems: 6,
  items: {
    type: 'object',
    additionalProperties: false,
    required: ['statistic', 'value', 'exclude'],
    properties: {
      statistic: {
        type: 'string',
        enum: CLASS_STATS,
      },
      value: { type: 'integer', minimum: -10, maximum: 10 },
      exclude: {
        type: 'array',
        uniqueItems: true,
        maxItems: 9,
        items: { type: 'string', enum: MODIFIER_CONTEXTS },
      },
    },
  },
} as const;

const ClassItemSchema = {
  type: 'object',
  additionalProperties: false,
  required: [
    'ref',
    'type',
    'name',
    'description',
    'value',
    'weapon',
    'armor',
    'gear',
    'pet',
  ],
  properties: {
    ref: { type: 'string', pattern: ITEM_REF },
    type: { type: 'string', enum: CLASS_ITEM_TYPES },
    name: NameSchema,
    description: LocalizedSchema,
    value: { type: 'integer', minimum: 0, maximum: 9999 },
    weapon: {
      type: 'object',
      additionalProperties: false,
      required: [
        'diceCount',
        'diceFaces',
        'damageModifier',
        'reach',
        'ammo',
        'ammoCount',
        'ammoName',
        'modifiers',
      ],
      properties: {
        diceCount: { type: 'integer', minimum: 1, maximum: 6 },
        diceFaces: { type: 'integer', enum: DIE_FACES },
        damageModifier: { type: 'integer', minimum: -6, maximum: 6 },
        reach: { type: 'string', enum: WEAPON_REACHES },
        ammo: { type: 'string', enum: WEAPON_AMMO },
        ammoCount: { type: 'integer', minimum: 1, maximum: 99 },
        ammoName: { type: 'string', maxLength: 50 },
        modifiers: ModifiersSchema,
      },
    },
    armor: {
      type: 'object',
      additionalProperties: false,
      required: ['tier', 'modifiers'],
      properties: {
        tier: { type: 'integer', enum: [1, 2, 3] },
        modifiers: ModifiersSchema,
      },
    },
    gear: {
      type: 'object',
      additionalProperties: false,
      required: ['kind', 'uses', 'effect', 'effectDie', 'statuses'],
      properties: {
        kind: { type: 'string', enum: GEAR_KINDS },
        uses: { type: 'integer', minimum: 0, maximum: 99 },
        effect: { type: 'string', enum: GEAR_EFFECTS },
        effectDie: { type: 'integer', enum: DIE_FACES },
        statuses: ModifiersSchema,
      },
    },
    pet: {
      type: 'object',
      additionalProperties: false,
      required: ['hp', 'actionDie', 'action', 'humanoid', 'buffs'],
      properties: {
        hp: { type: 'integer', minimum: 1, maximum: 99 },
        actionDie: { type: 'integer', enum: [2, 4, 6, 8, 10] },
        action: { type: 'string', enum: PET_ACTIONS },
        humanoid: { type: 'boolean' },
        buffs: ModifiersSchema,
      },
    },
  },
} as const;

const AbilitySchema = {
  type: 'object',
  additionalProperties: false,
  required: [
    'random',
    'name',
    'text',
    'modifiers',
    'grantItem',
    'grantPet',
    'table',
  ],
  properties: {
    key: { type: 'string', pattern: customClassKeyPattern('ability') },
    random: { type: 'boolean' },
    name: NameSchema,
    text: LocalizedSchema,
    modifiers: ModifiersSchema,
    grantItem: GrantSchema,
    grantPet: GrantSchema,
    table: AbilityTableSchema,
  },
} as const;

const StatDiceSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['count', 'faces', 'modifier', 'dropLowest'],
  properties: {
    count: { type: 'integer', minimum: 1, maximum: 6 },
    faces: { type: 'integer', enum: STAT_DIE_FACES },
    modifier: { type: 'integer', minimum: -6, maximum: 6 },
    dropLowest: { type: 'boolean' },
  },
} as const;

export const ClassDraftSchema = {
  type: 'object',
  additionalProperties: false,
  required: [
    'languages',
    'name',
    'description',
    'stats',
    'hpDie',
    'omenDie',
    'weaponDie',
    'armorDie',
    'silver',
    'origins',
    'abilities',
    'randomAbilityCount',
    'items',
    'gettingBetterRule',
    'gettingBetterNote',
  ],
  properties: {
    languages: {
      type: 'array',
      minItems: 1,
      maxItems: 2,
      uniqueItems: true,
      items: { type: 'string', enum: CLASS_LANGUAGES },
    },
    name: NameSchema,
    description: LocalizedSchema,
    stats: {
      type: 'object',
      additionalProperties: false,
      required: CLASS_STATS,
      properties: Object.fromEntries(CLASS_STATS.map((stat) => [stat, StatDiceSchema])) as Record<
        (typeof CLASS_STATS)[number],
        typeof StatDiceSchema
      >,
    },
    hpDie: { type: 'integer', enum: DIE_FACES },
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
    items: { type: 'array', maxItems: LIMIT_LIST, items: ClassItemSchema },
    gettingBetterRule: {
      type: 'string',
      enum: GETTING_BETTER_RULES,
    },
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
    language: { type: 'string', enum: CLASS_LANGUAGES },
  },
} as const;

export const ClassIdParamsSchema = {
  type: 'object',
  required: ['id'],
  properties: { id: IdSchema },
} as const;
export const DraftIdParamsSchema = {
  type: 'object',
  required: ['draftId'],
  properties: { draftId: IdSchema },
} as const;

export const DraftCreateBodySchema = {
  type: 'object',
  additionalProperties: false,
  required: ['draft'],
  properties: {
    classId: { ...IdSchema, type: ['integer', 'null'] },
    draft: ClassDraftSchema,
  },
} as const;

export const DraftUpdateBodySchema = {
  type: 'object',
  additionalProperties: false,
  required: ['draft', 'revision'],
  properties: {
    draft: ClassDraftSchema,
    revision: IdSchema,
    force: { type: 'boolean' },
  },
} as const;

export const StoredClassDraftSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['id', 'classId', 'draft', 'revision', 'updatedAt'],
  properties: {
    id: { type: 'integer' },
    classId: { type: ['integer', 'null'] },
    draft: ClassDraftSchema,
    revision: { type: 'integer' },
    updatedAt: { type: 'string', format: 'date-time' },
  },
} as const;

export const ClassDraftListSchema = {
  type: 'array',
  items: StoredClassDraftSchema,
} as const;
export const ClassLocaleQuerySchema = {
  type: 'object',
  properties: { locale: { type: 'string', enum: CLASS_LANGUAGES, default: 'en' } },
} as const;

export const PublishClassBodySchema = {
  type: 'object',
  additionalProperties: false,
  required: ['confirmed'],
  properties: { confirmed: { const: true } },
} as const;

export const ClassVisibilityResponseSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['visibility'],
  properties: { visibility: { type: 'string', enum: CLASS_VISIBILITIES } },
} as const;
export const ClassWithDraftSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['id', 'draft', 'version', 'playingCount', 'status'],
  properties: {
    id: { type: 'integer' },
    draft: ClassDraftSchema,
    version: { type: 'integer', minimum: 1 },
    playingCount: { type: 'integer', minimum: 0 },
    status: { type: 'string', enum: CLASS_STATUSES },
  },
} as const;


export const ClassDetailSchema = {
  ...ClassWithDraftSchema,
  required: [...ClassWithDraftSchema.required, 'attribution', 'reportable'],
  properties: {
    ...ClassWithDraftSchema.properties,
    attribution: { type: 'string' },
    reportable: { type: 'boolean' },
  },
} as const;
export const OwnClassListSchema = {
  type: 'array',
  items: {
    type: 'object',
    additionalProperties: false,
    required: [
      'id',
      'lineageId',
      'name',
      'description',
      'languages',
      'visibility',
      'status',
      'originCount',
      'takenDownAt',
      'takedownReason',
    ],
    properties: {
      id: { type: 'integer' },
      lineageId: { type: 'string' },
      name: { type: 'string' },
      description: { type: ['string', 'null'] },
      languages: { type: 'array', items: { type: 'string' } },
      visibility: { type: 'string', enum: CLASS_VISIBILITIES },
      status: { type: 'string', enum: CLASS_STATUSES },
      originCount: { type: 'integer' },
      takenDownAt: { type: ['string', 'null'], format: 'date-time' },
      takedownReason: { type: ['string', 'null'] },
    },
  },
} as const;

export const TestRollResponseSchema = DraftPreviewSchema;
