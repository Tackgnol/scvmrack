import {
  CharacterIdParamsSchema,
  CharacterSchema,
  ErrorSchema,
  LocaleQuerySchema,
} from './character.js';

const AbilityStatSchema = {
  type: 'string',
  enum: ['strength', 'agility', 'presence', 'toughness'],
};

const RollValueSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['source', 'total'],
  properties: {
    source: { type: 'string', enum: ['server', 'table'] },
    dice: {
      type: 'array',
      items: { type: 'integer', minimum: 1, maximum: 100 },
      maxItems: 12,
    },
    total: { type: 'integer', minimum: 0, maximum: 1000 },
  },
};

const SpecialtySlotSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['key', 'rollValue'],
  properties: {
    key: { type: 'string', maxLength: 255 },
    rollValue: { type: 'integer', minimum: 1, maximum: 100 },
  },
};

const SpecialtyRollSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['key', 'rollValue', 'roll'],
  properties: {
    key: { type: 'string', maxLength: 255 },
    rollValue: { type: 'integer', minimum: 1, maximum: 100 },
    roll: RollValueSchema,
  },
};

const ImprovementCharacterSnapshotSchema = {
  type: 'object',
  additionalProperties: false,
  required: [
    'characterUpdatedAt',
    'maxHp',
    'silver',
    'abilities',
    'abilityKeys',
    'equipmentFingerprint',
    'snapshotHash',
  ],
  properties: {
    characterUpdatedAt: { type: 'string', format: 'date-time' },
    maxHp: { type: 'integer' },
    silver: { type: 'integer' },
    abilities: {
      type: 'object',
      additionalProperties: false,
      required: ['strength', 'agility', 'presence', 'toughness'],
      properties: {
        strength: { type: 'integer' },
        agility: { type: 'integer' },
        presence: { type: 'integer' },
        toughness: { type: 'integer' },
      },
    },
    abilityKeys: {
      type: 'array',
      items: { type: 'string', maxLength: 255 },
      maxItems: 30,
    },
    equipmentFingerprint: { type: 'string', maxLength: 128 },
    snapshotHash: { type: 'string', maxLength: 128 },
  },
};

const ImprovementHpRollSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['check', 'fromMaxHp', 'succeeds', 'increase', 'toMaxHp'],
  properties: {
    check: RollValueSchema,
    fromMaxHp: { type: 'integer', minimum: 1, maximum: 1000 },
    succeeds: { type: 'boolean' },
    increase: { oneOf: [RollValueSchema, { type: 'null' }] },
    toMaxHp: { type: 'integer', minimum: 1, maximum: 1000 },
  },
};

const ImprovementDebrisRollSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['roll', 'kind'],
  properties: {
    roll: RollValueSchema,
    kind: {
      type: 'string',
      enum: ['nothing', 'silver', 'uncleanScroll', 'sacredScroll'],
    },
    silver: RollValueSchema,
    amount: { type: 'integer', minimum: 0, maximum: 1000 },
    scroll: RollValueSchema,
    itemKey: { type: 'string', maxLength: 255 },
  },
  oneOf: [
    {
      properties: {
        kind: { const: 'nothing' },
      },
      not: {
        anyOf: [
          { required: ['silver'] },
          { required: ['amount'] },
          { required: ['scroll'] },
          { required: ['itemKey'] },
        ],
      },
    },
    {
      required: ['silver', 'amount'],
      properties: {
        kind: { const: 'silver' },
      },
      not: {
        anyOf: [{ required: ['scroll'] }, { required: ['itemKey'] }],
      },
    },
    {
      required: ['scroll', 'itemKey'],
      properties: {
        kind: { const: 'uncleanScroll' },
      },
      not: {
        anyOf: [{ required: ['silver'] }, { required: ['amount'] }],
      },
    },
    {
      required: ['scroll', 'itemKey'],
      properties: {
        kind: { const: 'sacredScroll' },
      },
      not: {
        anyOf: [{ required: ['silver'] }, { required: ['amount'] }],
      },
    },
  ],
};

const ImprovementAbilityRollSchema = {
  type: 'object',
  additionalProperties: false,
  required: [
    'roll',
    'fromScore',
    'fromModifier',
    'toModifier',
    'toScore',
    'outcome',
  ],
  properties: {
    roll: RollValueSchema,
    fromScore: { type: 'integer', minimum: 1, maximum: 30 },
    fromModifier: { type: 'integer', minimum: -3, maximum: 6 },
    toModifier: { type: 'integer', minimum: -3, maximum: 6 },
    toScore: { type: 'integer', minimum: 1, maximum: 21 },
    outcome: { type: 'string', enum: ['increase', 'decrease', 'same'] },
  },
};

const ScumSpecialtyDraftSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['kind'],
  properties: {
    kind: {
      type: 'string',
      enum: ['notScum', 'firstImprovement', 'laterImprovement'],
    },
    existing: SpecialtySlotSchema,
    added: SpecialtyRollSchema,
    primary: SpecialtySlotSchema,
    secondary: SpecialtySlotSchema,
    rerollMode: {
      type: 'string',
      enum: ['none', 'primary', 'secondary', 'both'],
    },
  },
  oneOf: [
    {
      properties: {
        kind: { const: 'notScum' },
      },
      not: {
        anyOf: [
          { required: ['existing'] },
          { required: ['added'] },
          { required: ['primary'] },
          { required: ['secondary'] },
          { required: ['rerollMode'] },
        ],
      },
    },
    {
      required: ['existing', 'added'],
      properties: {
        kind: { const: 'firstImprovement' },
      },
      not: {
        anyOf: [
          { required: ['primary'] },
          { required: ['secondary'] },
          { required: ['rerollMode'] },
        ],
      },
    },
    {
      required: ['primary', 'secondary', 'rerollMode'],
      properties: {
        kind: { const: 'laterImprovement' },
      },
      not: {
        anyOf: [{ required: ['existing'] }, { required: ['added'] }],
      },
    },
  ],
};

export const ImprovementDraftSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['sequence', 'snapshot', 'hp', 'debris', 'abilities', 'scumSpecialties'],
  properties: {
    sequence: { type: 'integer', minimum: 1, maximum: 1000 },
    snapshot: ImprovementCharacterSnapshotSchema,
    hp: ImprovementHpRollSchema,
    debris: ImprovementDebrisRollSchema,
    abilities: {
      type: 'object',
      additionalProperties: false,
      required: ['strength', 'agility', 'presence', 'toughness'],
      properties: {
        strength: ImprovementAbilityRollSchema,
        agility: ImprovementAbilityRollSchema,
        presence: ImprovementAbilityRollSchema,
        toughness: ImprovementAbilityRollSchema,
      },
    },
    scumSpecialties: ScumSpecialtyDraftSchema,
  },
};

export const ImprovementPreviewResponseSchema = {
  type: 'object',
  additionalProperties: false,
  required: [
    'id',
    'characterId',
    'sequence',
    'rolledDraft',
    'scumSpecialtyNames',
    'scrollNames',
    'snapshotHash',
    'createdAt',
    'updatedAt',
  ],
  properties: {
    id: { type: 'string', format: 'uuid' },
    characterId: { type: 'string', format: 'uuid' },
    sequence: { type: 'integer' },
    rolledDraft: ImprovementDraftSchema,
    scumSpecialtyNames: {
      type: 'object',
      additionalProperties: { type: 'string' },
    },
    scrollNames: {
      type: 'object',
      additionalProperties: { type: 'string' },
    },
    snapshotHash: { type: 'string' },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
  },
};

export const RerollSectionParamsSchema = {
  type: 'object',
  required: ['id', 'improvementId', 'section'],
  properties: {
    id: { type: 'string', format: 'uuid' },
    improvementId: { type: 'string', format: 'uuid' },
    section: {
      type: 'string',
      enum: ['hp', 'debris', 'abilities', 'scumSpecialties', 'all'],
    },
  },
};

export const ApplyImprovementParamsSchema = {
  type: 'object',
  required: ['id', 'improvementId'],
  properties: {
    id: { type: 'string', format: 'uuid' },
    improvementId: { type: 'string', format: 'uuid' },
  },
};

export const ApplyImprovementBodySchema = {
  type: 'object',
  additionalProperties: false,
  required: ['draft'],
  properties: {
    draft: ImprovementDraftSchema,
  },
};

export const ImprovementPreviewRouteSchema = {
  description: 'Get or create an active Getting Better preview',
  tags: ['characters'],
  params: CharacterIdParamsSchema,
  querystring: LocaleQuerySchema,
  response: {
    200: ImprovementPreviewResponseSchema,
    400: ErrorSchema,
    401: ErrorSchema,
    403: ErrorSchema,
    404: ErrorSchema,
    409: ErrorSchema,
    500: ErrorSchema,
  },
};

export const ImprovementRerollRouteSchema = {
  description: 'Reroll one section of an active Getting Better preview',
  tags: ['characters'],
  params: RerollSectionParamsSchema,
  querystring: LocaleQuerySchema,
  response: {
    200: ImprovementPreviewResponseSchema,
    400: ErrorSchema,
    401: ErrorSchema,
    403: ErrorSchema,
    404: ErrorSchema,
    409: ErrorSchema,
    500: ErrorSchema,
  },
};

export const ImprovementApplyRouteSchema = {
  description: 'Apply a Getting Better draft to the character',
  tags: ['characters'],
  params: ApplyImprovementParamsSchema,
  querystring: LocaleQuerySchema,
  body: ApplyImprovementBodySchema,
  response: {
    200: CharacterSchema,
    400: ErrorSchema,
    401: ErrorSchema,
    403: ErrorSchema,
    404: ErrorSchema,
    409: ErrorSchema,
    500: ErrorSchema,
  },
};
