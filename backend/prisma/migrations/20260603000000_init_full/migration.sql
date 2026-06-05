-- Comprehensive baseline migration
-- Replaces the two prior incomplete migrations.
-- Strategy: tabula rasa — creates everything a fresh database needs.
-- Functions are omitted (ported to TypeScript). Seed data is in the seed script.

-- ============================================================
-- SECTION 1: Extensions
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;

-- ============================================================
-- SECTION 2: Auth tables (Better Auth / shared-auth)
-- ============================================================

-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "isAnonymous" BOOLEAN DEFAULT false,
    "logto_sub" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session" (
    "id" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "token" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "verification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "claim_code" (
    "code" TEXT NOT NULL,
    "payload_user_id" TEXT NOT NULL,
    "payload_source_user_id" TEXT NOT NULL,
    "payload_character_id" TEXT NOT NULL,
    "payload_signature" TEXT NOT NULL,
    "payload_issued_at" TIMESTAMP(3) NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "claim_code_pkey" PRIMARY KEY ("code")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "session_token_key" ON "session"("token");

-- CreateIndex
CREATE INDEX "session_userId_idx" ON "session"("userId");

-- CreateIndex
CREATE INDEX "account_userId_idx" ON "account"("userId");

-- CreateIndex
CREATE INDEX "verification_identifier_idx" ON "verification"("identifier");

-- AddForeignKey
ALTER TABLE "session" ADD CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account" ADD CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ============================================================
-- SECTION 3: Game catalog tables
-- ============================================================

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

-- ============================================================
-- SECTION 4: Characters table
-- ============================================================

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
    session_id TEXT,
    user_id TEXT,
    modifiers JSONB NOT NULL DEFAULT '[]'::JSONB
);

COMMENT ON COLUMN characters.storage IS 'Items stored in backpack/storage, not immediately accessible';
COMMENT ON COLUMN characters.session_id IS 'Guest session that created this character';
COMMENT ON COLUMN characters.user_id IS 'User who owns this character (NULL for unclaimed guests)';

-- ============================================================
-- SECTION 5: Indexes
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

-- Fuzzy search indexes (require pg_trgm extension — created in Section 1)
CREATE INDEX idx_equipment_key_trgm ON equipment USING gin (key gin_trgm_ops);
CREATE INDEX idx_translations_value_trgm ON translations USING gin (value gin_trgm_ops);
CREATE INDEX idx_translations_key_prefix ON translations (key text_pattern_ops);

-- Character indexes
CREATE INDEX idx_characters_class ON characters (class_id);
CREATE INDEX idx_characters_created ON characters (created_at);
CREATE INDEX idx_characters_session_id ON characters (session_id);
CREATE INDEX idx_characters_user_id ON characters (user_id);

-- ============================================================
-- SECTION 6: Characters → user FK (NOT VALID deferred constraint)
-- ============================================================

ALTER TABLE "characters"
ADD CONSTRAINT "characters_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "user"("id")
ON DELETE SET NULL ON UPDATE CASCADE
NOT VALID;

-- ============================================================
-- SECTION 7: item_search plain VIEW
-- Phase 6 decision: MATERIALIZED VIEW replaced by plain VIEW;
-- Fastify cache layer replaces the refresh machinery.
-- ============================================================

DROP VIEW IF EXISTS item_search CASCADE;

CREATE OR REPLACE VIEW item_search AS
SELECT
    item.item_type,
    item.id,
    item.key,
    t.locale,
    COALESCE(t.value, item.key) AS name,
    lower(unaccent(COALESCE(t.value, item.key))) AS normalized_name,
    -- A: Item Name, B: Category Synonyms, C: Tags
    setweight(to_tsvector('simple', unaccent(COALESCE(t.value, item.key))), 'A') ||
    setweight(to_tsvector('simple', unaccent(
        CASE
            WHEN item.item_type = 'weapon' THEN 'weapon broń uzbrojenie oręż arms armament'
            WHEN item.item_type = 'armor'  THEN 'armor armour zbroja pancerz ubiór protection shield'
            WHEN item.item_type = 'equipment' THEN 'equipment ekwipunek przedmiot tool item'
            WHEN item.item_type = 'pet' THEN 'pet zwierzak chowaniec towarzysz companion'
            ELSE ''
        END
    )), 'B') ||
    setweight(to_tsvector('simple', unaccent(COALESCE(item.tags::text, ''))), 'C') AS document
FROM (
    SELECT id, key, tags, 'armor' as item_type FROM armors
    UNION ALL
    SELECT id, key, tags, 'weapon' FROM weapons
    UNION ALL
    SELECT id, key, tags, 'equipment' FROM equipment
    UNION ALL
    SELECT id, key, tags, 'pet' FROM pets
) item
LEFT JOIN translations t ON t.key = item.key;

-- ============================================================
-- SECTION 8: class_ability_modifiers table
-- ============================================================

CREATE TABLE IF NOT EXISTS class_ability_modifiers (
    id SERIAL PRIMARY KEY,
    class_id INTEGER NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    ability_key VARCHAR(255) NOT NULL,
    value INTEGER NOT NULL,
    statistic VARCHAR(20) NOT NULL CHECK (statistic IN ('agility', 'strength', 'presence', 'toughness')),
    exclude JSONB NOT NULL DEFAULT '[]'::JSONB,
    source TEXT NOT NULL,
    notes TEXT,
    UNIQUE (class_id, ability_key, statistic, value, exclude)
);

CREATE INDEX IF NOT EXISTS idx_class_ability_modifiers_class_id
    ON class_ability_modifiers (class_id);

CREATE INDEX IF NOT EXISTS idx_class_ability_modifiers_ability_key
    ON class_ability_modifiers (ability_key);
