export const ObrPlayerParamsSchema = {
  type: 'object',
  required: ['roomId', 'playerId'],
  additionalProperties: false,
  properties: {
    roomId: { type: 'string', minLength: 1, maxLength: 256 },
    playerId: { type: 'string', minLength: 1, maxLength: 256 },
  },
} as const;
