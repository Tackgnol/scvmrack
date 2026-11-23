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
        hpMod: nullableInteger,
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
