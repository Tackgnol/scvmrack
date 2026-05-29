export const FeedbackBodySchema = {
  type: 'object',
  required: ['kind', 'message', 'source'],
  additionalProperties: false,
  properties: {
    kind: { type: 'string', enum: ['error', 'feedback'] },
    message: { type: 'string', minLength: 1, maxLength: 2000 },
    source: { type: 'string', minLength: 1, maxLength: 100 },
    url: { type: 'string', maxLength: 2000 },
    context: { type: 'object', additionalProperties: true },
    tags: {
      type: 'object',
      additionalProperties: { type: 'string', maxLength: 500 },
    },
    error: {
      type: 'object',
      additionalProperties: false,
      properties: {
        name: { type: 'string', maxLength: 200 },
        message: { type: 'string', maxLength: 2000 },
        stack: { type: 'string', maxLength: 10000 },
      },
    },
  },
};

export const FeedbackResponseSchema = {
  type: 'object',
  required: ['eventId'],
  properties: {
    eventId: { type: 'string' },
  },
};
