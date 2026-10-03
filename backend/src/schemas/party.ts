// JSON schema definitions for the party routes. Mirrors the shape used by the
// character schemas: shared params/bodies, an error schema reused per route.

export { ErrorSchema } from './character.js';

export const PartyIdParamsSchema = {
  type: 'object',
  required: ['id'],
  properties: {
    id: { type: 'string', format: 'uuid' },
  },
} as const;

export const InviteTokenParamsSchema = {
  type: 'object',
  required: ['token'],
  properties: {
    token: { type: 'string', minLength: 1, maxLength: 256 },
  },
} as const;

export const PartyLimitsSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    maxMembers: { type: 'integer' },
  },
} as const;

export const CreatePartyBodySchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    name: { type: 'string', minLength: 1, maxLength: 120 },
  },
} as const;

export const PromotePartyBodySchema = {
  type: 'object',
  additionalProperties: false,
  required: ['obrRoomId'],
  properties: {
    obrRoomId: { type: 'string', minLength: 1, maxLength: 256 },
    name: { type: 'string', minLength: 1, maxLength: 120 },
  },
} as const;

export const AttachRoomBodySchema = {
  type: 'object',
  additionalProperties: false,
  required: ['obrRoomId'],
  properties: {
    obrRoomId: { type: 'string', minLength: 1, maxLength: 256 },
  },
} as const;

export const RenamePartyBodySchema = {
  type: 'object',
  additionalProperties: false,
  required: ['name'],
  properties: {
    name: { type: 'string', minLength: 1, maxLength: 120 },
  },
} as const;

export const SetPartyMiseriesBodySchema = {
  type: 'object',
  additionalProperties: false,
  required: ['miseryCount'],
  properties: {
    miseryCount: { type: 'integer', minimum: 0, maximum: 7 },
  },
} as const;

export const PartyMiseriesResultSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['miseryCount', 'updatedCharacters'],
  properties: {
    miseryCount: { type: 'integer', minimum: 0, maximum: 7 },
    updatedCharacters: { type: 'integer', minimum: 0 },
  },
} as const;

export const JoinPartyBodySchema = {
  type: 'object',
  additionalProperties: false,
  required: ['token', 'characterId'],
  properties: {
    token: { type: 'string', minLength: 1, maxLength: 256 },
    characterId: { type: 'string', format: 'uuid' },
  },
} as const;

export const MemberBodySchema = {
  type: 'object',
  additionalProperties: false,
  required: ['characterId'],
  properties: {
    characterId: { type: 'string', format: 'uuid' },
  },
} as const;

export const ReplaceMemberBodySchema = {
  type: 'object',
  additionalProperties: false,
  required: ['oldCharacterId', 'newCharacterId'],
  properties: {
    oldCharacterId: { type: 'string', format: 'uuid' },
    newCharacterId: { type: 'string', format: 'uuid' },
  },
} as const;

export const ClassPoolLineageParamsSchema = {
  type: 'object',
  required: ['id', 'lineageId'],
  properties: {
    id: { type: 'string', format: 'uuid' },
    lineageId: { type: 'string', format: 'uuid' },
  },
} as const;

export const ClassPoolLocaleQuerySchema = {
  type: 'object',
  properties: {
    locale: { type: 'string', enum: ['en', 'pl'], default: 'en' },
  },
} as const;

export const SetPoolSwitchBodySchema = {
  type: 'object',
  additionalProperties: false,
  required: ['enabled'],
  properties: {
    enabled: { type: 'boolean' },
  },
} as const;

const PoolAttributionSchema = {
  anyOf: [
    {
      type: 'object',
      additionalProperties: false,
      required: ['kind', 'work', 'author', 'url'],
      properties: {
        kind: { const: 'credit' },
        work: { type: 'string' },
        author: { type: 'string' },
        url: { type: ['string', 'null'] },
      },
    },
    {
      type: 'object',
      additionalProperties: false,
      required: ['kind', 'name', 'private'],
      properties: {
        kind: { const: 'owner' },
        name: { type: ['string', 'null'] },
        private: { type: 'boolean' },
      },
    },
    { type: 'null' },
  ],
} as const;

export const ClassPoolViewSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['classlessEnabled', 'classes', 'removed'],
  properties: {
    classlessEnabled: { type: 'boolean' },
    classes: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: [
          'lineageId', 'classId', 'group', 'name', 'blurb', 'languages', 'attribution',
          'abilityCount', 'randomAbilityCount', 'classItemCount', 'gettingBetterRule',
          'version', 'playingHere', 'enabled',
        ],
        properties: {
          lineageId: { type: 'string' },
          classId: { type: 'integer' },
          group: { type: 'string', enum: ['book', 'zine', 'rack', 'mine', 'public'] },
          name: { type: 'string' },
          blurb: { type: ['string', 'null'] },
          languages: { type: 'array', items: { type: 'string' } },
          attribution: PoolAttributionSchema,
          abilityCount: { type: 'integer' },
          randomAbilityCount: { type: 'integer' },
          classItemCount: { type: 'integer' },
          gettingBetterRule: { type: 'string', enum: ['book', 'book_plus_ability', 'specialist'] },
          version: { type: 'integer' },
          playingHere: { type: 'integer' },
          enabled: { type: 'boolean' },
        },
      },
    },
    removed: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['lineageId', 'name', 'by', 'reason'],
        properties: {
          lineageId: { type: 'string' },
          name: { type: 'string' },
          by: { type: ['string', 'null'] },
          reason: { type: 'string', enum: ['archived', 'unpublished', 'taken_down'] },
        },
      },
    },
  },
} as const;
