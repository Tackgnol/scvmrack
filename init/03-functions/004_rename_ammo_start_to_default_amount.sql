-- Migration: Update get_character_full.sql to use default_amount instead of ammo_start
-- Depends on: 004_rename_ammo_start_to_default_amount.sql

-- Update the amount resolution for equipped weapons (weapons resolution block)
-- Replace: COALESCE(e_m.ammo_start, w.ammo_start)
-- With:    COALESCE(e_m.default_amount, w.default_amount)

-- Update the amount resolution for inventory items
-- Replace: COALESCE(e_m.ammo_start, w.ammo_start)
-- With:    COALESCE(e_m.default_amount, w.default_amount)

-- Note: The exact line in get_character_full.sql line 59:
--   THEN COALESCE((item->>'amount')::int, COALESCE(e_m.ammo_start, w.ammo_start))
-- Must be changed to:
--   THEN COALESCE((item->>'amount')::int, COALESCE(e_m.default_amount, w.default_amount))
