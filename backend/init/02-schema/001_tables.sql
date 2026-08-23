-- Mörk Borg Database Schema
-- Consolidated from production dump (2026-02-07)
-- This represents the CURRENT production state after all 13 migrations.

-- ============================================================
-- TABLES
-- ============================================================

-- Game content tables
CREATE TABLE classes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    roll INTEGER,
    appendix TEXT,
    hp_die INTEGER DEFAULT 8,
    weapon_die INTEGER DEFAULT 10,
    armor_die INTEGER DEFAULT 4,
    silver_dice INTEGER[] DEFAULT ARRAY[6, 6],
    silver_modifier INTEGER DEFAULT 10,
    stat_modifiers JSONB DEFAULT '{}'::JSONB,
    class_abilities JSONB DEFAULT '[]'::JSONB,
    random_abilities JSONB DEFAULT '[]'::JSONB,
    random_ability_count INTEGER DEFAULT 1,
    name_key VARCHAR(255),
    description_key VARCHAR(255)
);

CREATE TABLE abilities (
    id SERIAL PRIMARY KEY,
    class_id INTEGER REFERENCES classes(id),
    key VARCHAR(255) NOT NULL UNIQUE,
    is_random BOOLEAN DEFAULT FALSE,
    roll_value INTEGER
);

CREATE TABLE origins (
    id SERIAL PRIMARY KEY,
    class_id INTEGER REFERENCES classes(id),
    roll INTEGER NOT NULL,
    key VARCHAR(255) NOT NULL
);

CREATE TABLE weapons (
    id SERIAL PRIMARY KEY,
    key VARCHAR(255) NOT NULL UNIQUE,
    tags TEXT[] NOT NULL DEFAULT '{}',
    amount_min INTEGER,
    amount_max INTEGER,
    mod VARCHAR(50),
    dice INTEGER[] DEFAULT '{}',
    roll INTEGER,
    value INTEGER DEFAULT 0,
    exp BOOLEAN DEFAULT FALSE,
    effect_die INTEGER,
    effect JSONB,
    damage_modifier INTEGER DEFAULT 0,
    modifiers JSONB DEFAULT '[]'::JSONB,
    ammo_type VARCHAR(50),
    default_amount INTEGER
);

CREATE TABLE armors (
    id SERIAL PRIMARY KEY,
    key VARCHAR(255) NOT NULL UNIQUE,
    tags TEXT[] NOT NULL DEFAULT '{}',
    dice INTEGER[] DEFAULT '{}',
    roll INTEGER,
    value INTEGER DEFAULT 0,
    exp BOOLEAN DEFAULT FALSE,
    max_tier INTEGER DEFAULT 1,
    modifiers JSONB DEFAULT '[]'::JSONB
);

CREATE TABLE equipment (
    id SERIAL PRIMARY KEY,
    key VARCHAR(255) NOT NULL UNIQUE,
    tags TEXT[] NOT NULL DEFAULT '{}',
    amount_min INTEGER,
    amount_max INTEGER,
    mod VARCHAR(50),
    hp_min INTEGER,
    hp_max INTEGER,
    hp_mod INTEGER,
    value INTEGER DEFAULT 0,
    exp BOOLEAN DEFAULT FALSE,
    roll INTEGER,
    multiple INTEGER DEFAULT 1,
    ammo_type VARCHAR(50),
    default_amount INTEGER,
    use_effect JSONB
);

CREATE TABLE pets (
    id SERIAL PRIMARY KEY,
    key VARCHAR(255) NOT NULL UNIQUE,
    hp INTEGER NOT NULL DEFAULT 1,
    tags TEXT[] DEFAULT '{}',
    exp BOOLEAN DEFAULT FALSE,
    action_die INTEGER[] DEFAULT '{}',
    action_type VARCHAR(50) DEFAULT 'melee',
    amount INTEGER DEFAULT 1,
    amount_die INTEGER,
    buff JSONB DEFAULT '[]'::JSONB,
    value INTEGER DEFAULT 0
);

CREATE TABLE names (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL
);

CREATE TABLE body_descriptions (
    id SERIAL PRIMARY KEY,
    key VARCHAR(255) NOT NULL UNIQUE,
    roll INTEGER
);

CREATE TABLE habits (
    id SERIAL PRIMARY KEY,
    key VARCHAR(255) NOT NULL UNIQUE,
    roll INTEGER,
    exp BOOLEAN DEFAULT FALSE,
    items JSONB DEFAULT '[]'::JSONB
);

CREATE TABLE tales (
    id SERIAL PRIMARY KEY,
    key VARCHAR(255) NOT NULL UNIQUE,
    roll INTEGER,
    exp BOOLEAN DEFAULT FALSE,
    items JSONB DEFAULT '[]'::JSONB
);

CREATE TABLE traits (
    id SERIAL PRIMARY KEY,
    key VARCHAR(255) NOT NULL UNIQUE,
    roll INTEGER
);

CREATE TABLE translations (
    locale VARCHAR(10) NOT NULL DEFAULT 'en',
    key VARCHAR(255) NOT NULL,
    value TEXT NOT NULL,
    PRIMARY KEY (locale, key)
);

-- Character data
CREATE TABLE characters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    class_id INTEGER REFERENCES classes(id),
    body_description TEXT,
    habit TEXT,
    tale TEXT,
    trait1 TEXT,
    trait2 TEXT,
    origin VARCHAR(255),
    strength INTEGER NOT NULL DEFAULT 0,
    agility INTEGER NOT NULL DEFAULT 0,
    presence INTEGER NOT NULL DEFAULT 0,
    toughness INTEGER NOT NULL DEFAULT 0,
    max_hp INTEGER NOT NULL DEFAULT 1,
    current_hp INTEGER NOT NULL DEFAULT 1,
    omens INTEGER DEFAULT 0,
    max_omens INTEGER DEFAULT 0,
    equipment JSONB DEFAULT '[]'::JSONB,
    equipped_weapons JSONB DEFAULT '[]'::JSONB,
    equipped_armor JSONB,
    abilities JSONB DEFAULT '[]'::JSONB,
    pets JSONB DEFAULT '[]'::JSONB,
    ammo INTEGER DEFAULT 0,
    silver INTEGER DEFAULT 0,
    wounded BOOLEAN DEFAULT FALSE,
    dead BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    storage JSONB DEFAULT '[]'::JSONB,
    notes TEXT DEFAULT '',
    misery_count INTEGER NOT NULL DEFAULT 0 CHECK (misery_count BETWEEN 0 AND 7),
    session_id TEXT,
    user_id TEXT
);

COMMENT ON COLUMN characters.storage IS 'Items stored in backpack/storage, not immediately accessible';
COMMENT ON COLUMN characters.session_id IS 'Guest session that created this character';
COMMENT ON COLUMN characters.user_id IS 'User who owns this character (NULL for unclaimed guests)';

-- ============================================================
-- INDEXES
-- ============================================================

-- Game data indexes
CREATE INDEX idx_armors_roll ON armors (roll) WHERE roll IS NOT NULL;
CREATE INDEX idx_weapons_roll ON weapons (roll) WHERE roll IS NOT NULL;
CREATE INDEX idx_equipment_roll ON equipment (roll) WHERE roll IS NOT NULL;
CREATE INDEX idx_equipment_tags ON equipment USING gin (tags);
CREATE INDEX idx_habits_roll ON habits (roll) WHERE roll IS NOT NULL;
CREATE INDEX idx_tales_roll ON tales (roll) WHERE roll IS NOT NULL;
CREATE INDEX idx_origins_class_roll ON origins (class_id, roll);
CREATE INDEX idx_translations_key ON translations (key);

-- Fuzzy search indexes
CREATE INDEX idx_equipment_key_trgm ON equipment USING gin (key gin_trgm_ops);
CREATE INDEX idx_translations_value_trgm ON translations USING gin (value gin_trgm_ops);
CREATE INDEX idx_translations_key_prefix ON translations (key text_pattern_ops);

-- Character indexes
CREATE INDEX idx_characters_class ON characters (class_id);
CREATE INDEX idx_characters_created ON characters (created_at);
CREATE INDEX idx_characters_session_id ON characters (session_id);
CREATE INDEX idx_characters_user_id ON characters (user_id);

