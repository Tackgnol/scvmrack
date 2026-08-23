export const EquipmentItemSchema = {
  type: 'object',
  properties: {
    key: { type: 'string' },
    name: { type: 'string' },
    description: { type: 'string' },
    tags: { type: 'array', items: { type: 'string' } },
    relevance: { type: 'number' },
  },
} as const;
export const SearchQuerySchema = {
  type: 'object',
  properties: {
    q: {
      type: 'string',
      minLength: 1,
      maxLength: 100,
      description: 'Search query',
    },
    locale: { type: 'string', enum: ['en', 'pl'], default: 'en' },
    limit: { type: 'integer', minimum: 1, maximum: 50, default: 20 },
    tags: {
      type: 'array',
      items: { type: 'string' },
      description: 'Filter by tags (e.g. weapon, armor, scroll)',
    },
  },
} as const;
export const ListQuerySchema = {
  type: 'object',
  properties: {
    locale: { type: 'string', enum: ['en', 'pl'], default: 'en' },
    limit: { type: 'integer', minimum: 1, maximum: 100, default: 100 },
    offset: { type: 'integer', minimum: 0, default: 0 },
    tags: {
      type: 'array',
      items: { type: 'string' },
      description: 'Filter by tags',
    },
  },
} as const;

export const ErrorSchema = {
  type: 'object',
  properties: {
    error: { type: 'string' },
    message: { type: 'string' },
    code: { type: 'string' },
    statusCode: { type: 'integer' },
    requestId: { type: 'string' },
    details: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          field: { type: 'string' },
          message: { type: 'string' },
          code: { type: 'string' },
        },
        required: ['message'],
      },
    },
  },
  required: ['error', 'message', 'code', 'statusCode', 'requestId'],
} as const;
