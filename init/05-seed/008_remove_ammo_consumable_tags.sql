-- Migration: arrows and bolts are ammo, not consumables.
-- Safe to run multiple times.

BEGIN;

UPDATE public.equipment
SET tags = array_remove(tags, 'consumable')
WHERE key IN ('equipment.arrows', 'equipment.bolts');

UPDATE public.characters
SET equipment = COALESCE(
    (
        SELECT jsonb_agg(
            CASE
                WHEN item->>'key' IN ('equipment.arrows', 'equipment.bolts')
                    AND jsonb_typeof(item->'tags') = 'array'
                THEN jsonb_set(
                    item,
                    '{tags}',
                    COALESCE(
                        (
                            SELECT jsonb_agg(tag)
                            FROM jsonb_array_elements_text(item->'tags') AS tags(tag)
                            WHERE tag <> 'consumable'
                        ),
                        '[]'::jsonb
                    ),
                    true
                )
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
      WHERE item->>'key' IN ('equipment.arrows', 'equipment.bolts')
        AND item->'tags' ? 'consumable'
  );

UPDATE public.characters
SET storage = COALESCE(
    (
        SELECT jsonb_agg(
            CASE
                WHEN item->>'key' IN ('equipment.arrows', 'equipment.bolts')
                    AND jsonb_typeof(item->'tags') = 'array'
                THEN jsonb_set(
                    item,
                    '{tags}',
                    COALESCE(
                        (
                            SELECT jsonb_agg(tag)
                            FROM jsonb_array_elements_text(item->'tags') AS tags(tag)
                            WHERE tag <> 'consumable'
                        ),
                        '[]'::jsonb
                    ),
                    true
                )
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
      WHERE item->>'key' IN ('equipment.arrows', 'equipment.bolts')
        AND item->'tags' ? 'consumable'
  );

COMMIT;
