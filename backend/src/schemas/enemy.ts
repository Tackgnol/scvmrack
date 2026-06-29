// JSON schemas for the enemy routes. Same style as schemas/party.ts.

export { ErrorSchema } from './character.js';

export const RoomParamsSchema = {
  type: 'object',
  required: ['roomId'],
  properties: {
    roomId: { type: 'string', minLength: 1, maxLength: 256 },
  },
} as const;

export const RoomEnemyParamsSchema = {
  type: 'object',
  required: ['roomId', 'enemyId'],
  properties: {
    roomId: { type: 'string', minLength: 1, maxLength: 256 },
    enemyId: { type: 'string', format: 'uuid' },
  },
} as const;

export const EnemyCardsQuerySchema = {
  type: 'object',
  required: ['characterId'],
  properties: {
    characterId: { type: 'string', format: 'uuid' },
  },
} as const;

const attackItems = {
  type: 'array',
  maxItems: 8,
  items: {
    type: 'object',
    additionalProperties: false,
    required: ['id', 'name'],
    properties: {
      id: { type: 'string', minLength: 1 },
      name: { type: 'string', minLength: 1, maxLength: 80 },
      die: { type: 'string', maxLength: 24 },
    },
  },
} as const;

const specialItems = {
  type: 'array',
  maxItems: 8,
  items: {
    type: 'object',
    additionalProperties: false,
    required: ['id', 'name'],
    properties: {
      id: { type: 'string', minLength: 1 },
      name: { type: 'string', minLength: 1, maxLength: 80 },
      description: { type: 'string', maxLength: 240 },
    },
  },
} as const;

const lootItems = {
  type: 'array',
  maxItems: 8,
  items: {
    type: 'object',
    additionalProperties: false,
    required: ['id', 'label'],
    properties: {
      id: { type: 'string', minLength: 1 },
      label: { type: 'string', minLength: 1, maxLength: 60 },
      value: { type: 'string', maxLength: 60 },
    },
  },
} as const;

const statusItems = {
  type: 'array',
  minItems: 1,
  maxItems: 8,
  items: {
    type: 'object',
    additionalProperties: false,
    required: ['id', 'percent', 'label'],
    properties: {
      id: { type: 'string', minLength: 1 },
      percent: { type: 'integer', minimum: 1, maximum: 100 },
      label: { type: 'string', minLength: 1, maxLength: 48 },
    },
  },
} as const;

export const EnemyBodySchema = {
  type: 'object',
  additionalProperties: false,
  required: ['name', 'currentHealth', 'statuses'],
  properties: {
    name: { type: 'string', minLength: 1, maxLength: 80 },
    type: { type: 'string', maxLength: 80 },
    habitat: { type: 'string', maxLength: 120 },
    description: { type: 'string', maxLength: 500 },
    playerDescription: { type: 'string', maxLength: 500 },
    currentHealth: { type: 'integer', minimum: 0, maximum: 999 },
    maxHealth: { type: 'integer', minimum: 1, maximum: 999 },
    morale: { type: 'integer', minimum: 0, maximum: 99 },
    armorDie: { type: 'string', maxLength: 24 },
    armorDescription: { type: 'string', maxLength: 120 },
    attacks: attackItems,
    specials: specialItems,
    loot: lootItems,
    statuses: statusItems,
  },
} as const;

export const EnemyHealthBodySchema = {
  type: 'object',
  additionalProperties: false,
  required: ['currentHealth'],
  properties: {
    currentHealth: { type: 'integer', minimum: 0, maximum: 999 },
  },
} as const;

export const EnemyFullSchema = {
  type: 'object',
  additionalProperties: true,
} as const;

export const EnemyListSchema = {
  type: 'array',
  items: EnemyFullSchema,
} as const;

export const EnemyCardListSchema = {
  type: 'array',
  items: {
    type: 'object',
    additionalProperties: true,
  },
} as const;
