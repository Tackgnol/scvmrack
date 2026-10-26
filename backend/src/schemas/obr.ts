export const ObrPlayerParamsSchema = {
  type: 'object',
  required: ['roomId', 'playerId'],
  additionalProperties: false,
  properties: {
    roomId: { type: 'string', minLength: 1, maxLength: 256 },
    playerId: { type: 'string', minLength: 1, maxLength: 256 },
  },
} as const;

export const RoomParamsSchema = {
  type: 'object',
  required: ['roomId'],
  additionalProperties: false,
  properties: { roomId: { type: 'string', minLength: 1, maxLength: 256 } },
} as const;
export const RoomBindingParamsSchema = {
  ...RoomParamsSchema,
  required: ['roomId', 'bindingId'],
  properties: {
    ...RoomParamsSchema.properties,
    bindingId: { type: 'string', minLength: 1, maxLength: 256 },
  },
} as const;
export const RoomBindingBodySchema = {
  type: 'object',
  required: ['characterId'],
  additionalProperties: false,
  properties: {
    characterId: { type: 'string', format: 'uuid' },
    connectionId: { type: 'string', minLength: 1, maxLength: 256 },
    playerId: { type: 'string', minLength: 1, maxLength: 256 },
  },
} as const;

export const RoomCardsQuerySchema = {
  type: 'object',
  properties: {
    ids: { type: 'string', maxLength: 2000 },
    locale: { type: 'string', enum: ['en', 'pl'] },
  },
} as const;

export const RoomRemovalBodySchema = {
  type: 'object',
  required: ['characterId', 'operationId'],
  additionalProperties: false,
  properties: {
    characterId: { type: 'string', format: 'uuid' },
    operationId: { type: 'string', format: 'uuid' },
  },
} as const;

export const RoomCleanupParamsSchema = {
  ...RoomParamsSchema,
  required: ['roomId', 'id'],
  properties: {
    ...RoomParamsSchema.properties,
    id: { type: 'string', format: 'uuid' },
  },
} as const;

export const RoomParticipationSchema = {
  type: 'object',
  required: [
    'partyId',
    'memberIds',
    'canManage',
    'players',
    'tokens',
    'cleanup',
  ],
  properties: {
    partyId: { type: ['string', 'null'], format: 'uuid' },
    memberIds: { type: 'array', items: { type: 'string', format: 'uuid' } },
    canManage: { type: 'boolean' },
    players: {
      type: 'array',
      items: {
        type: 'object',
        required: [
          'playerId',
          'connectionId',
          'characterId',
          'assignedByPlayerId',
        ],
        properties: {
          playerId: { type: 'string' },
          connectionId: { type: ['string', 'null'] },
          characterId: { type: 'string', format: 'uuid' },
          assignedByPlayerId: { type: 'string' },
        },
      },
    },
    tokens: {
      type: 'array',
      items: {
        type: 'object',
        required: ['tokenId', 'playerId', 'characterId', 'generation'],
        properties: {
          tokenId: { type: 'string' },
          playerId: { type: ['string', 'null'] },
          characterId: { type: 'string', format: 'uuid' },
          generation: { type: 'string', format: 'uuid' },
        },
      },
    },
    cleanup: {
      type: 'array',
      items: {
        type: 'object',
        required: [
          'id',
          'roomId',
          'operationId',
          'characterId',
          'tokenId',
          'generation',
        ],
        properties: {
          id: { type: 'string', format: 'uuid' },
          roomId: { type: 'string' },
          operationId: { type: 'string', format: 'uuid' },
          characterId: { type: 'string', format: 'uuid' },
          tokenId: { type: 'string' },
          generation: { type: 'string', format: 'uuid' },
        },
      },
    },
  },
} as const;
