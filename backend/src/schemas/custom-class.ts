import type { FromSchema } from 'json-schema-to-ts';
import { MODIFIER_CONTEXTS } from '../lib/ability-modifiers.js';
import {
  WEAPON_DICE,
  SILVER_DICE,
  PET_ACTION_DICE,
  OMEN_DICE,
  ARMOR_TIERS,
  ARMOR_DICE,
  CLASS_ITEM_TYPES,
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
import { SUPPORTED_LOCALES } from '../config/locales.js';
import { ABILITY_STATS } from '../lib/ability-modifiers.js';
import { CLASS_ITEM_KEY } from '../lib/class-items.js';
import {
  CLASS_STATUSES,
  CLASS_VISIBILITIES,
  customClassKeyPattern,
  GETTING_BETTER_RULES,
} from '../lib/class-model.js';
import { IdSchema, NullableIdSchema } from './character.js';
import { DraftPreviewSchema } from './draft.js';

export { ErrorSchema } from './character.js';

/** One string per class language, each at most `maxLength` long. */
const localized = <const N extends number>(maxLength: N) =>
  ({
    type: 'object',
    additionalProperties: false,
    required: SUPPORTED_LOCALES,
    properties: Object.fromEntries(
      SUPPORTED_LOCALES.map((language) => [language, { type: 'string', maxLength }])
    ) as Record<(typeof SUPPORTED_LOCALES)[number], { type: 'string'; maxLength: N }>,
  }) as const;

const LocalizedSchema = localized(LIMIT_TEXT);
const NameSchema = localized(LIMIT_NAME);

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
    rows: { type: 'array', minItems: 2, maxItems: Math.max(...TABLE_DICE), items: TableRowSchema },
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
        enum: ABILITY_STATS,
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
        tier: { type: 'integer', enum: ARMOR_TIERS },
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
        actionDie: { type: 'integer', enum: PET_ACTION_DICE },
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
      items: { type: 'string', enum: SUPPORTED_LOCALES },
    },
    name: NameSchema,
    description: LocalizedSchema,
    stats: {
      type: 'object',
      additionalProperties: false,
      required: ABILITY_STATS,
      properties: Object.fromEntries(ABILITY_STATS.map((stat) => [stat, StatDiceSchema])) as Record<
        (typeof ABILITY_STATS)[number],
        typeof StatDiceSchema
      >,
    },
    hpDie: { type: 'integer', enum: DIE_FACES },
    omenDie: { type: 'integer', enum: OMEN_DICE },
    weaponDie: { type: 'integer', enum: WEAPON_DICE },
    armorDie: { type: 'integer', enum: ARMOR_DICE },
    silver: {
      type: 'object',
      additionalProperties: false,
      required: ['count', 'faces', 'multiplier'],
      properties: {
        count: { type: 'integer', minimum: 1, maximum: 6 },
        faces: { type: 'integer', enum: SILVER_DICE },
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
  properties: {
    draft: ClassDraftSchema,
    /** The autosaved draft this save completes; the server discards it with the save. */
    draftId: IdSchema,
  },
} as const;

export const TestRollBodySchema = {
  type: 'object',
  additionalProperties: false,
  required: ['draft', 'language'],
  properties: {
    draft: ClassDraftSchema,
    language: { type: 'string', enum: SUPPORTED_LOCALES },
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
    classId: NullableIdSchema,
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
  required: ['id', 'classId', 'draft', 'revision', 'updatedAt', 'expiresAt'],
  properties: {
    id: { type: 'integer' },
    classId: { type: ['integer', 'null'] },
    draft: ClassDraftSchema,
    revision: { type: 'integer' },
    updatedAt: { type: 'string', format: 'date-time' },
    /** When the draft is deleted if left untouched. */
    expiresAt: { type: 'string', format: 'date-time' },
  },
} as const;

export const ClassDraftListSchema = {
  type: 'array',
  items: StoredClassDraftSchema,
} as const;
export const ClassLocaleQuerySchema = {
  type: 'object',
  properties: { locale: { type: 'string', enum: SUPPORTED_LOCALES, default: 'en' } },
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
  required: ['id', 'draft', 'version', 'playingCount', 'status', 'takenDownAt', 'takedownReason'],
  properties: {
    id: { type: 'integer' },
    draft: ClassDraftSchema,
    version: { type: 'integer', minimum: 1 },
    playingCount: { type: 'integer', minimum: 0 },
    status: { type: 'string', enum: CLASS_STATUSES },
    takenDownAt: { type: ['string', 'null'], format: 'date-time' },
    /** The moderator's statement of reasons while the class is taken down. */
    takedownReason: { type: ['string', 'null'] },
  },
} as const;


/** A saved class plus the saved key each `new:` Class Item ref became. */
export const SavedClassSchema = {
  ...ClassWithDraftSchema,
  required: [...ClassWithDraftSchema.required, 'savedRefs'],
  properties: {
    ...ClassWithDraftSchema.properties,
    savedRefs: { type: 'object', additionalProperties: { type: 'string' } },
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
      'everPublished',
    ],
    properties: {
      everPublished: { type: 'boolean' },
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

export type OwnClassSummary = FromSchema<typeof OwnClassListSchema>[number];
export type SavedClass = FromSchema<typeof ClassWithDraftSchema>;
export type SavedClassWithRefs = FromSchema<typeof SavedClassSchema>;
export type ClassDetail = FromSchema<typeof ClassDetailSchema>;

export const TestRollResponseSchema = DraftPreviewSchema;
