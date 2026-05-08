export const EquipmentItemSchema = {
  type: 'object',
  properties: {
    key: { type: 'string' },
    name: { type: 'string' },
    description: { type: 'string' },
    tags: { type: 'array', items: { type: 'string' } },
    relevance: { type: 'number' },
  },
};
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
};
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
};

export const ErrorSchema = {
  type: 'object',
  properties: {
    error: { type: 'string' },
  },
};
