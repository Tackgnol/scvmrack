-- Lantern and torches are use-pip consumables, not ammunition. Their catalog
-- `ammo_type` ('Oil' / 'Torch') was a stray refill label — the same value is
-- already carried in use_effect.lose. Because both the UI
-- (useEquipmentSections.isAmmoItem) and the backend
-- (get-character-full.isEncumbranceExemptItem) treat ANY item with an ammoType
-- as ammo, the resolved lantern/torch were dropped from the Consumables section
-- AND exempted from encumbrance. Clearing ammo_type fixes both.
--
-- Idempotent + guarded so it runs as a Prisma migration (existing DBs, before
-- seed) and as seed (fresh DBs, after 001_game_data.sql re-inserts the catalog).

UPDATE public.equipment
SET ammo_type = NULL
WHERE key IN ('equipment.lantern', 'equipment.torches');

-- Strip a stale ammoType that may have been persisted into character inventory
-- JSON (the read merges catalog ammoType, and optimistic patches can write the
-- resolved item back).
UPDATE public.characters
SET equipment = COALESCE(
    (
        SELECT jsonb_agg(
            CASE
                WHEN item->>'key' IN ('equipment.lantern', 'equipment.torches')
                THEN item - 'ammoType'
                ELSE item
            END
            ORDER BY ordinality
        )
        FROM jsonb_array_elements(equipment) WITH ORDINALITY AS inventory(item, ordinality)
    ),
    '[]'::jsonb
)
WHERE jsonb_typeof(equipment) = 'array'
  AND EXISTS (
      SELECT 1
      FROM jsonb_array_elements(equipment) AS inventory(item)
      WHERE item->>'key' IN ('equipment.lantern', 'equipment.torches')
        AND item ? 'ammoType'
  );

UPDATE public.characters
SET storage = COALESCE(
    (
        SELECT jsonb_agg(
            CASE
                WHEN item->>'key' IN ('equipment.lantern', 'equipment.torches')
                THEN item - 'ammoType'
                ELSE item
            END
            ORDER BY ordinality
        )
        FROM jsonb_array_elements(storage) WITH ORDINALITY AS inventory(item, ordinality)
    ),
    '[]'::jsonb
)
WHERE jsonb_typeof(storage) = 'array'
  AND EXISTS (
      SELECT 1
      FROM jsonb_array_elements(storage) AS inventory(item)
      WHERE item->>'key' IN ('equipment.lantern', 'equipment.torches')
        AND item ? 'ammoType'
  );
