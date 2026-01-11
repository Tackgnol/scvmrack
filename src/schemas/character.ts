// Stricter schema definitions with validation limits
// Use these in your route schemas

export const CharacterIdParamsSchema = {
    type: 'object',
    required: ['id'],
    properties: {
        id: {
            type: 'string',
            format: 'uuid'
        }
    }
};

export const LocaleQuerySchema = {
    type: 'object',
    properties: {
        locale: {
            type: 'string',
            enum: ['en', 'pl'],
            default: 'en'
        }
    }
};

const EquipmentItemSchema = {
    type: 'object',
    additionalProperties: false,
    properties: {
        key: {type: 'string', maxLength: 100},
        name: {type: 'string', maxLength: 255},
        description: {type: 'string', maxLength: 1000},
        uses: {
            type: 'array',
            items: {type: 'boolean'},
            maxItems: 10
        },
        dice: {
            type: 'array',
            items: {type: 'integer', minimum: 1, maximum: 20},
            maxItems: 5
        },
        tags: {
            type: 'array',
            items: {type: 'string', maxLength: 50},
            maxItems: 10
        }
    }
};

const AbilitySchema = {
    type: 'object',
    additionalProperties: false,
    properties: {
        key: {type: 'string', maxLength: 100},
        name: {type: 'string', maxLength: 500},
        description: {type: 'string', maxLength: 2000}
    }
};

const WeaponSchema = {
    type: 'object',
    additionalProperties: false,
    properties: {
        key: {type: 'string', maxLength: 100},
        name: {type: 'string', maxLength: 255},
        description: {type: 'string', maxLength: 1000},
        dice: {
            type: 'array',
            items: {type: 'integer', minimum: 1, maximum: 20},
            maxItems: 5
        },
        tags: {
            type: 'array',
            items: {type: 'string', maxLength: 50},
            maxItems: 10
        }
    }
};

const ArmorSchema = {
    type: 'object',
    additionalProperties: false,
    properties: {
        key: {type: 'string', maxLength: 100},
        name: {type: 'string', maxLength: 255},
        description: {type: 'string', maxLength: 1000},
        dice: {
            type: 'array',
            items: {type: 'integer', minimum: 1, maximum: 20},
            maxItems: 5
        },
        max_tier: {type: 'integer', minimum: 0, maximum: 4},
        tags: {
            type: 'array',
            items: {type: 'string', maxLength: 50},
            maxItems: 10
        }
    }
};

export const UpdateBodySchema = {
    type: 'object',
    additionalProperties: false,  // Reject unknown fields
    properties: {
        name: {type: 'string', maxLength: 255},
        current_hp: {type: 'integer', minimum: -100, maximum: 1000},
        max_hp: {type: 'integer', minimum: 1, maximum: 1000},
        omens: {type: 'integer', minimum: 0, maximum: 100},
        max_omens: {type: 'integer', minimum: 0, maximum: 100},
        silver: {type: 'integer', minimum: 0, maximum: 1000000},
        strength: {type: 'integer', minimum: 1, maximum: 30},
        agility: {type: 'integer', minimum: 1, maximum: 30},
        presence: {type: 'integer', minimum: 1, maximum: 30},
        toughness: {type: 'integer', minimum: 1, maximum: 30},
        trait1: {type: 'string', maxLength: 255},
        trait2: {type: 'string', maxLength: 255},
        habit: {type: 'string', maxLength: 1000},
        tale: {type: 'string', maxLength: 1000},
        body_description: {type: 'string', maxLength: 1000},
        origin: {type: 'string', maxLength: 1000},
        notes: {type: 'string', maxLength: 10000},
        abilities: {
            type: 'array',
            items: AbilitySchema,
            maxItems: 20
        },
        equipment: {
            type: 'array',
            items: EquipmentItemSchema,
            maxItems: 50
        },
        storage: {
            type: 'array',
            items: EquipmentItemSchema,
            maxItems: 100
        },
        equipped_weapons: {
            type: 'array',
            items: WeaponSchema,
            maxItems: 10
        },
        equipped_armor: {
            oneOf: [
                ArmorSchema,
                {type: 'null'}
            ]
        }
    }
};

export const CharacterSchema = {
    type: 'object',
    properties: {
        id: {type: 'string', format: 'uuid'},
        name: {type: 'string'},
        class_id: {type: 'integer'},
        class_name: {type: 'string'},
        class_description: {type: 'string'},
        origin: {type: 'string'},
        strength: {type: 'integer'},
        agility: {type: 'integer'},
        presence: {type: 'integer'},
        toughness: {type: 'integer'},
        max_hp: {type: 'integer'},
        current_hp: {type: 'integer'},
        omens: {type: 'integer'},
        max_omens: {type: 'integer'},
        silver: {type: 'integer'},
        habit: {type: 'string'},
        tale: {type: 'string'},
        body_description: {type: 'string'},
        trait1: {type: 'string'},
        trait2: {type: 'string'},
        notes: {type: 'string'},
        abilities: {type: 'array', items: AbilitySchema},
        equipment: {type: 'array', items: EquipmentItemSchema},
        storage: {type: 'array', items: EquipmentItemSchema},
        equipped_weapons: {type: 'array', items: WeaponSchema},
        equipped_armor: {oneOf: [ArmorSchema, {type: 'null'}]},
        created_at: {type: 'string', format: 'date-time'},
        updated_at: {type: 'string', format: 'date-time'}
    }
};

export const ErrorSchema = {
    type: 'object',
    properties: {
        error: {type: 'string'}
    }
};

export const GenerateBodySchema = {
    type: 'object',
    properties: {
        class_id: {type: 'integer', minimum: 1, maximum: 6},
    },
} as const;
