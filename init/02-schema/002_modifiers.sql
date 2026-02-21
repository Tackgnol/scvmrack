-- Migration: Add modifiers column to characters table
-- Part of modifiers-architecture.md implementation

ALTER TABLE characters
    ADD COLUMN IF NOT EXISTS modifiers JSONB NOT NULL DEFAULT '[]'::JSONB;
