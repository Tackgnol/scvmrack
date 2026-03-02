-- Migration: Add class ability modifier mappings
-- Stores deterministic numeric modifiers implied by class abilities.

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
