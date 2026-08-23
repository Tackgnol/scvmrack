import { ABILITY_STATS, DRAFT_SECTIONS } from '../lib/draft-seeds.js';
import { CharacterSchema } from './character.js';

const SeedSchema = { type: 'string', pattern: '^[0-9a-f]{64}$' } as const;
const AbilityStatSchema = {
  type: 'string',
  enum: [...ABILITY_STATS],
} as const;
const DropLowestAbilitiesSchema = {
  type: 'array',
  items: AbilityStatSchema,
  uniqueItems: true,
  maxItems: 2,
} as const;

export const SectionSeedsSchema = {
  type: 'object',
  additionalProperties: false,
  required: [...DRAFT_SECTIONS],
  properties: Object.fromEntries(
    DRAFT_SECTIONS.map((section) => [section, SeedSchema])
  ) as Record<(typeof DRAFT_SECTIONS)[number], typeof SeedSchema>,
} as const;

export const DraftSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['classId', 'classless', 'seeds'],
  properties: {
    classId: { type: ['integer', 'null'], minimum: 1, maximum: 100 },
    classless: { type: 'boolean' },
    name: { type: 'string', maxLength: 255 },
    dropLowestAbilities: DropLowestAbilitiesSchema,
    seeds: SectionSeedsSchema,
  },
} as const;

export const DraftBodySchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    classId: { type: ['integer', 'null'], minimum: 1, maximum: 100 },
    classless: { type: 'boolean' },
    name: { type: 'string', maxLength: 255 },
    dropLowestAbilities: DropLowestAbilitiesSchema,
    seeds: SectionSeedsSchema,
  },
} as const;

export const RerollBodySchema = {
  type: 'object',
  additionalProperties: false,
  required: ['draft'],
  properties: {
    draft: DraftSchema,
  },
} as const;

export const RerollParamsSchema = {
  type: 'object',
  required: ['section'],
  properties: {
    section: { type: 'string', enum: [...DRAFT_SECTIONS] },
  },
} as const;

const DraftPreviewSchema = {
  ...CharacterSchema,
  properties: {
    ...CharacterSchema.properties,
    id: { type: ['string', 'null'], format: 'uuid' },
  },
} as const;

const ClasslessStatOptionSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    ability: AbilityStatSchema,
    dice: {
      type: 'array',
      items: { type: 'integer', minimum: 1, maximum: 6 },
      minItems: 4,
      maxItems: 4,
    },
    minTotal: { type: 'integer', minimum: 3, maximum: 18 },
    maxTotal: { type: 'integer', minimum: 3, maximum: 18 },
    selected: { type: 'boolean' },
  },
  required: ['ability', 'dice', 'minTotal', 'maxTotal', 'selected'],
} as const;

export const DraftResponseSchema = {
  type: 'object',
  properties: {
    draft: DraftSchema,
    preview: DraftPreviewSchema,
    classlessStatOptions: {
      type: 'array',
      items: ClasslessStatOptionSchema,
      minItems: 4,
      maxItems: 4,
    },
  },
  required: ['draft', 'preview'],
} as const;

export const ClassListResponseSchema = {
  type: 'array',
  items: {
    type: 'object',
    properties: {
      id: { type: 'integer' },
      name: { type: ['string', 'null'] },
      description: { type: ['string', 'null'] },
    },
    required: ['id'],
  },
} as const;
