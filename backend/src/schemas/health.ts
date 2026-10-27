export const HealthResponseSchema = {
  type: 'object',
  required: ['status', 'timestamp'],
  properties: {
    status: { type: 'string', enum: ['ok'] },
    timestamp: { type: 'string', format: 'date-time' },
  },
} as const;
