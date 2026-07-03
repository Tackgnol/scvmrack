import { z } from 'zod';
import { type CharacterUpdateRequest, type SimpleField } from '@/hooks/models';

export const MODIFIER_VALUE_MIN = -20;
export const MODIFIER_VALUE_MAX = 20;

export type ValidationTranslate = (
  key: string,
  fallback: string,
  values?: Record<string, string | number>
) => string;

type ValidationField = {
  key: string;
  fallback: string;
};

type ValidationMessage = {
  key: string;
  fallback: string;
};

export type FieldLimitIssue =
  | {
      kind: 'numberRange';
      min: number;
      max: number;
      field: ValidationField;
      message: ValidationMessage;
    }
  | {
      kind: 'textMax';
      max: number;
      field: ValidationField;
      message: ValidationMessage;
    };

const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value));

const simpleNumberLimits: Partial<
  Record<SimpleField, { min: number; max: number }>
> = {
  currentHp: { min: -100, max: 1000 },
  maxHp: { min: 1, max: 1000 },
  omens: { min: 0, max: 100 },
  silver: { min: 0, max: 1000000 },
  strength: { min: 1, max: 30 },
  agility: { min: 1, max: 30 },
  presence: { min: 1, max: 30 },
  toughness: { min: 1, max: 30 },
};

const simpleStringLimits: Partial<Record<SimpleField, number>> = {
  name: 255,
  trait1: 35,
  trait2: 35,
  habit: 200,
  tale: 1000,
  bodyDescription: 200,
  origin: 200,
  notes: 10000,
};

export const textFieldLimits = {
  name: 255,
  trait1: 35,
  trait2: 35,
  habit: 200,
  tale: 1000,
  bodyDescription: 200,
  origin: 200,
  notes: 10000,
  modifierName: 255,
  modifierComment: 500,
  abilityComment: 1000,
  itemName: 255,
  itemDescription: 1000,
  itemComments: 1000,
  equipmentSearch: 100,
} as const;

export type TextLimitField = keyof typeof textFieldLimits;

const simpleFieldLabels: Partial<Record<SimpleField, ValidationField>> = {
  name: { key: 'validation.fields.name', fallback: 'Name' },
  currentHp: { key: 'validation.fields.currentHp', fallback: 'HP' },
  maxHp: { key: 'validation.fields.maxHp', fallback: 'Max HP' },
  omens: { key: 'validation.fields.omens', fallback: 'Omens' },
  silver: { key: 'validation.fields.silver', fallback: 'Silver' },
  strength: { key: 'validation.fields.strength', fallback: 'Strength' },
  agility: { key: 'validation.fields.agility', fallback: 'Agility' },
  presence: { key: 'validation.fields.presence', fallback: 'Presence' },
  toughness: { key: 'validation.fields.toughness', fallback: 'Toughness' },
  trait1: { key: 'validation.fields.trait1', fallback: 'Trait 1' },
  trait2: { key: 'validation.fields.trait2', fallback: 'Trait 2' },
  habit: { key: 'validation.fields.habit', fallback: 'Habit' },
  tale: { key: 'validation.fields.tale', fallback: 'Tale' },
  bodyDescription: {
    key: 'validation.fields.bodyDescription',
    fallback: 'Body',
  },
  origin: { key: 'validation.fields.origin', fallback: 'Origin' },
  notes: { key: 'validation.fields.notes', fallback: 'Notes' },
};

const textFieldLabels: Record<TextLimitField, ValidationField> = {
  name: { key: 'validation.fields.name', fallback: 'Name' },
  trait1: { key: 'validation.fields.trait1', fallback: 'Trait 1' },
  trait2: { key: 'validation.fields.trait2', fallback: 'Trait 2' },
  habit: { key: 'validation.fields.habit', fallback: 'Habit' },
  tale: { key: 'validation.fields.tale', fallback: 'Tale' },
  bodyDescription: {
    key: 'validation.fields.bodyDescription',
    fallback: 'Body',
  },
  origin: { key: 'validation.fields.origin', fallback: 'Origin' },
  notes: { key: 'validation.fields.notes', fallback: 'Notes' },
  modifierName: {
    key: 'validation.fields.modifierName',
    fallback: 'Modifier name',
  },
  modifierComment: {
    key: 'validation.fields.modifierComment',
    fallback: 'Modifier comment',
  },
  abilityComment: {
    key: 'validation.fields.abilityComment',
    fallback: 'Ability comment',
  },
  itemName: { key: 'validation.fields.itemName', fallback: 'Item name' },
  itemDescription: {
    key: 'validation.fields.itemDescription',
    fallback: 'Item description',
  },
  itemComments: {
    key: 'validation.fields.itemComments',
    fallback: 'Item comments',
  },
  equipmentSearch: {
    key: 'validation.fields.equipmentSearch',
    fallback: 'Equipment search',
  },
};

const modifierValueField: ValidationField = {
  key: 'validation.fields.modifierValue',
  fallback: 'Modifier value',
};

const numberRangeMessage: ValidationMessage = {
  key: 'validation.numberRange',
  fallback: '{{field}} must be between {{min}} and {{max}}',
};

const textMaxMessage: ValidationMessage = {
  key: 'validation.textMax',
  fallback: '{{field}} must be {{max}} characters or fewer',
};

const limitedString = (maxLength: number) =>
  z
    .string()
    .catch('')
    .pipe(z.string().max(maxLength));

const limitedStringArray = (maxItems: number, maxLength: number) =>
  z.preprocess(
    (value) =>
      Array.isArray(value) ? value.filter((item) => item != null) : [],
    z
      .array(limitedString(maxLength))
      .transform((items) => items.slice(0, maxItems))
  );

const limitedObjectArray = <T extends z.ZodType>(schema: T, maxItems: number) =>
  z.preprocess(
    (value) =>
      Array.isArray(value) ? value.filter((item) => item != null) : [],
    z.array(schema).transform((items) => items.slice(0, maxItems))
  );

const boundedInteger = (min: number, max: number, fallback: number) =>
  z.coerce
    .number()
    .finite()
    .catch(fallback)
    .transform((value) => clamp(Math.floor(value), min, max));

const boundedNumber = (min: number, max: number, fallback: number) =>
  z.coerce
    .number()
    .finite()
    .catch(fallback)
    .transform((value) => clamp(value, min, max));

const modifierValueSchema = boundedNumber(
  MODIFIER_VALUE_MIN,
  MODIFIER_VALUE_MAX,
  0
);

const intermediateModifierValueInputs = new Set(['-', '+']);

const statisticSchema = z.enum([
  'agility',
  'strength',
  'presence',
  'toughness',
]);

const scopeOptionSchema = z.enum([
  'all',
  'combat',
  'defence',
  'melee',
  'ranged',
  'powers',
]);

const modifierSchema = z.object({
  id: limitedString(36).optional(),
  name: limitedString(255).optional(),
  value: modifierValueSchema.optional(),
  source: limitedString(255).optional(),
  statistic: statisticSchema.optional(),
  exclude: limitedStringArray(15, 50).optional(),
  scope: scopeOptionSchema.optional(),
  comment: limitedString(500).optional(),
});

const useCountRuleSchema = z.object({
  mode: z.enum(['fixed', 'fixedPlusModifier']).optional(),
  base: boundedInteger(0, 50, 0).optional(),
  statistic: statisticSchema.optional(),
});

const equipmentItemSchema = z.object({
  key: limitedString(100).optional(),
  name: limitedString(255).optional(),
  description: limitedString(textFieldLimits.itemDescription).optional(),
  comments: limitedString(1000).optional(),
  source: limitedString(50).optional(),
  category: limitedString(50).optional(),
  value: boundedInteger(0, 1000000, 0).optional(),
  uses: z
    .array(z.boolean())
    .catch([])
    .transform((uses) => uses.slice(0, 50))
    .optional(),
  dice: z
    .array(boundedInteger(1, 20, 1))
    .catch([])
    .transform((dice) => dice.slice(0, 5))
    .optional(),
  tags: limitedStringArray(10, 50).optional(),
  maxTier: boundedInteger(0, 4, 0).optional(),
  currentTier: boundedInteger(0, 4, 0).optional(),
  amount: boundedInteger(0, 999, 0).optional(),
  ammoType: limitedString(50).optional(),
  useCountRule: useCountRuleSchema.optional(),
  modifiers: limitedObjectArray(modifierSchema, 10).optional(),
});

const weaponSchema = equipmentItemSchema.pick({
  key: true,
  name: true,
  description: true,
  comments: true,
  source: true,
  category: true,
  value: true,
  dice: true,
  tags: true,
  ammoType: true,
  modifiers: true,
});

const armorSchema = equipmentItemSchema.pick({
  key: true,
  name: true,
  description: true,
  comments: true,
  source: true,
  category: true,
  value: true,
  dice: true,
  tags: true,
  maxTier: true,
  currentTier: true,
  modifiers: true,
});

const abilitySchema = z.object({
  key: limitedString(100).optional(),
  name: limitedString(500).optional(),
  description: limitedString(2000).optional(),
  comment: limitedString(1000).optional(),
});

export const characterUpdateSchema = z.object({
  name: limitedString(255).optional(),
  currentHp: boundedInteger(-100, 1000, 0).optional(),
  maxHp: boundedInteger(1, 1000, 1).optional(),
  omens: boundedInteger(0, 100, 0).optional(),
  maxOmens: boundedInteger(0, 100, 0).optional(),
  silver: boundedInteger(0, 1000000, 0).optional(),
  strength: boundedInteger(1, 30, 10).optional(),
  agility: boundedInteger(1, 30, 10).optional(),
  presence: boundedInteger(1, 30, 10).optional(),
  toughness: boundedInteger(1, 30, 10).optional(),
  trait1: limitedString(35).optional(),
  trait2: limitedString(35).optional(),
  habit: limitedString(200).optional(),
  tale: limitedString(1000).optional(),
  bodyDescription: limitedString(200).optional(),
  origin: limitedString(200).optional(),
  notes: limitedString(10000).optional(),
  abilities: limitedObjectArray(abilitySchema, 20).optional(),
  equipment: limitedObjectArray(equipmentItemSchema, 50).optional(),
  storage: limitedObjectArray(equipmentItemSchema, 100).optional(),
  equippedWeapons: limitedObjectArray(weaponSchema, 10).optional(),
  equippedArmor: armorSchema.nullable().optional(),
  modifiers: limitedObjectArray(modifierSchema, 30).optional(),
});

const simpleFieldSchemas: Partial<Record<SimpleField, z.ZodType<unknown>>> = {
  name: characterUpdateSchema.shape.name,
  currentHp: characterUpdateSchema.shape.currentHp,
  maxHp: characterUpdateSchema.shape.maxHp,
  omens: characterUpdateSchema.shape.omens,
  silver: characterUpdateSchema.shape.silver,
  strength: characterUpdateSchema.shape.strength,
  agility: characterUpdateSchema.shape.agility,
  presence: characterUpdateSchema.shape.presence,
  toughness: characterUpdateSchema.shape.toughness,
  trait1: characterUpdateSchema.shape.trait1,
  trait2: characterUpdateSchema.shape.trait2,
  habit: characterUpdateSchema.shape.habit,
  tale: characterUpdateSchema.shape.tale,
  bodyDescription: characterUpdateSchema.shape.bodyDescription,
  origin: characterUpdateSchema.shape.origin,
  notes: characterUpdateSchema.shape.notes,
};

export function sanitizeCharacterUpdateRequest(
  request: Partial<CharacterUpdateRequest>
): Partial<CharacterUpdateRequest> {
  return characterUpdateSchema.parse(
    request
  ) as Partial<CharacterUpdateRequest>;
}

export function sanitizeSimpleFieldValue(
  field: SimpleField,
  value: number | string
): number | string {
  const schema = simpleFieldSchemas[field];
  if (!schema) return value;
  return schema.parse(value) as number | string;
}

function getSimpleFieldLimitIssue(
  field: SimpleField,
  value: number | string
): FieldLimitIssue | null {
  const fieldLabel = simpleFieldLabels[field];
  if (!fieldLabel) return null;

  const numberLimit = simpleNumberLimits[field];
  if (numberLimit) {
    if (value === '' || value === '-' || value === '+') return null;

    const parsed = Number(value);
    if (
      !Number.isFinite(parsed) ||
      parsed < numberLimit.min ||
      parsed > numberLimit.max
    ) {
      return {
        kind: 'numberRange',
        min: numberLimit.min,
        max: numberLimit.max,
        field: fieldLabel,
        message: numberRangeMessage,
      };
    }

    return null;
  }

  const stringLimit = simpleStringLimits[field];
  if (stringLimit && String(value).length > stringLimit) {
    return {
      kind: 'textMax',
      max: stringLimit,
      field: fieldLabel,
      message: textMaxMessage,
    };
  }

  return null;
}

export function getTextLimitIssue(
  field: TextLimitField,
  value: unknown
): FieldLimitIssue | null {
  const stringValue = String(value ?? '');
  const max = textFieldLimits[field];

  if (stringValue.length <= max) return null;

  return {
    kind: 'textMax',
    max,
    field: textFieldLabels[field],
    message: textMaxMessage,
  };
}

export function sanitizeModifierValue(value: unknown): number {
  return modifierValueSchema.parse(value);
}

export function isCompleteFiniteModifierValueInput(value: string): boolean {
  const trimmedValue = value.trim();
  if (intermediateModifierValueInputs.has(trimmedValue)) return false;
  return Number.isFinite(Number(trimmedValue));
}

export function getModifierValueLimitIssue(
  value: string
): FieldLimitIssue | null {
  const trimmedValue = value.trim();
  if (intermediateModifierValueInputs.has(trimmedValue)) return null;

  const parsed = Number(trimmedValue);
  if (
    !Number.isFinite(parsed) ||
    parsed < MODIFIER_VALUE_MIN ||
    parsed > MODIFIER_VALUE_MAX
  ) {
    return {
      kind: 'numberRange',
      min: MODIFIER_VALUE_MIN,
      max: MODIFIER_VALUE_MAX,
      field: modifierValueField,
      message: numberRangeMessage,
    };
  }

  return null;
}

function translateFieldLimitIssue(
  t: ValidationTranslate,
  issue: FieldLimitIssue
): string {
  const field = t(issue.field.key, issue.field.fallback);

  if (issue.kind === 'numberRange') {
    return t(issue.message.key, issue.message.fallback, {
      field,
      min: issue.min,
      max: issue.max,
    });
  }

  return t(issue.message.key, issue.message.fallback, {
    field,
    max: issue.max,
  });
}

export function getSimpleFieldLimitMessage(
  t: ValidationTranslate,
  field: SimpleField,
  value: number | string
): string | null {
  const issue = getSimpleFieldLimitIssue(field, value);
  return issue ? translateFieldLimitIssue(t, issue) : null;
}

export function getModifierValueLimitMessage(
  t: ValidationTranslate,
  value: string
): string | null {
  const issue = getModifierValueLimitIssue(value);
  return issue ? translateFieldLimitIssue(t, issue) : null;
}

export function getTextLimitMessage(
  t: ValidationTranslate,
  field: TextLimitField,
  value: unknown
): string | null {
  const issue = getTextLimitIssue(field, value);
  return issue ? translateFieldLimitIssue(t, issue) : null;
}
