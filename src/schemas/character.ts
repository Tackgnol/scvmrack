// OpenAPI JSON Schema definitions - all inlined (no $refs)

export const EquipmentItemSchema = {
    type: 'object',
    properties: {
        key: { type: 'string' },
        name: { type: 'string' },
        description: { type: 'string' },
    },
} as const;

export const WeaponItemSchema = {
    type: 'object',
    properties: {
        key: { type: 'string' },
        name: { type: 'string' },
        description: { type: 'string' },
        dice: { type: 'array', items: { type: 'integer' } },
        tags: { type: 'array', items: { type: 'string' } },
    },
} as const;

export const ArmorItemSchema = {
    type: 'object',
    properties: {
        key: { type: 'string' },
        name: { type: 'string' },
        description: { type: 'string' },
        dice: { type: 'array', items: { type: 'integer' } },
        max_tier: { type: 'integer' },
        tags: { type: 'array', items: { type: 'string' } },
    },
} as const;

export const CharacterSchema = {
    type: 'object',
    properties: {
        id: { type: 'string', format: 'uuid' },
        name: { type: 'string' },
        class_id: { type: 'integer' },
        class_name: { type: 'string' },
        class_description: { type: 'string' },
        origin: { type: 'string' },
        strength: { type: 'integer' },
        agility: { type: 'integer' },
        presence: { type: 'integer' },
        toughness: { type: 'integer' },
        max_hp: { type: 'integer' },
        current_hp: { type: 'integer' },
        omens: { type: 'integer' },
        max_omens: { type: 'integer' },
        silver: { type: 'integer' },
        habit: { type: 'string' },
        tale: { type: 'string' },
        body_description: { type: 'string' },
        trait1: { type: 'string' },
        trait2: { type: 'string' },
        abilities: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    name: { type: 'string' },
                    description: { type: 'string' },
                },
            },
        },
        equipment: {
            type: 'array',
            items: EquipmentItemSchema,
        },
        equipped_weapons: {
            type: 'array',
            items: WeaponItemSchema,
        },
        equipped_armor: {
            type: 'object',
            nullable: true,
            properties: ArmorItemSchema.properties,
        },
        created_at: { type: 'string', format: 'date-time' },
        updated_at: { type: 'string', format: 'date-time' },
    },
} as const;

export const ErrorSchema = {
    type: 'object',
    properties: {
        error: { type: 'string' },
    },
} as const;

export const LocaleQuerySchema = {
    type: 'object',
    properties: {
        locale: { type: 'string', default: 'en', description: 'Locale (en, pl)' },
    },
} as const;

export const CharacterIdParamsSchema = {
    type: 'object',
    required: ['id'],
    properties: {
        id: { type: 'string', format: 'uuid' },
    },
} as const;

export const GenerateBodySchema = {
    type: 'object',
    properties: {
        class_id: { type: 'integer', minimum: 1, maximum: 6 },
    },
} as const;

export const UpdateBodySchema = {
    type: 'object',
    properties: {
        name: { type: 'string' },
        current_hp: { type: 'integer' },
        omens: { type: 'integer' },
        silver: { type: 'integer' },
        equipment: { type: 'array', items: EquipmentItemSchema },
        equipped_weapons: { type: 'array', items: WeaponItemSchema },
        equipped_armor: { type: 'object', nullable: true, properties: ArmorItemSchema.properties },
        abilities: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    name: { type: 'string' },
                    description: { type: 'string' },
                },
            },
        },
    },
} as const;
