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

const nullableInteger = { type: ['integer', 'null'] } as const;
const nullableString = { type: ['string', 'null'] } as const;
const integerArray = { type: 'array', items: { type: 'integer' } } as const;
const catalogProperties = {
  id: { type: 'integer' },
  key: { type: 'string' },
  tags: { type: 'array', items: { type: 'string' } },
  value: nullableInteger,
  exp: { type: ['boolean', 'null'] },
  classId: nullableInteger,
  position: nullableInteger,
} as const;
const catalogRequired = ['id', 'key', 'tags', 'value', 'exp', 'classId', 'position'];

/** Raw catalog rows; JSON rule fields retain their item-specific structure. */
export const CatalogItemResponseSchema = {
  anyOf: [
    {
      type: 'object',
      required: [...catalogRequired, 'amountMin', 'amountMax', 'mod', 'dice', 'roll', 'effectDie', 'effect', 'damageModifier', 'modifiers', 'ammoType', 'defaultAmount'],
      properties: {
        ...catalogProperties,
        amountMin: nullableInteger,
        amountMax: nullableInteger,
        mod: nullableString,
        dice: integerArray,
        roll: nullableInteger,
        effectDie: nullableInteger,
        effect: {},
        damageModifier: nullableInteger,
        modifiers: {},
        ammoType: nullableString,
        defaultAmount: nullableInteger,
      },
    },
    {
      type: 'object',
      required: [...catalogRequired, 'dice', 'roll', 'maxTier', 'modifiers'],
      properties: {
        ...catalogProperties,
        dice: integerArray,
        roll: nullableInteger,
        maxTier: nullableInteger,
        modifiers: {},
      },
    },
    {
      type: 'object',
      required: [...catalogRequired, 'amountMin', 'amountMax', 'mod', 'hpMin', 'hpMax', 'hpMod', 'roll', 'multiple', 'ammoType', 'defaultAmount', 'useEffect'],
      properties: {
        ...catalogProperties,
        amountMin: nullableInteger,
        amountMax: nullableInteger,
        mod: nullableString,
        hpMin: nullableInteger,
        hpMax: nullableInteger,
        hpMod: nullableString,
        roll: nullableInteger,
        multiple: nullableInteger,
        ammoType: nullableString,
        defaultAmount: nullableInteger,
        useEffect: {},
      },
    },
    {
      type: 'object',
      required: [...catalogRequired, 'hp', 'actionDie', 'actionType', 'amount', 'amountDie', 'buff'],
      properties: {
        ...catalogProperties,
        hp: { type: 'integer' },
        actionDie: integerArray,
        actionType: nullableString,
        amount: nullableInteger,
        amountDie: nullableInteger,
        buff: {},
      },
    },
  ],
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
