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

export const CreatePartyBodySchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    name: { type: 'string', minLength: 1, maxLength: 120 },
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
