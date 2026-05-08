-- Arrows and bolts are ammunition, not use-pip consumables.
-- This fixes both the catalog and already-created character inventory JSON.

UPDATE public.equipment
SET tags = ARRAY['ammo']
WHERE key IN ('equipment.arrows', 'equipment.bolts');

UPDATE public.characters
SET equipment = COALESCE(
    (
        SELECT jsonb_agg(
            CASE
                WHEN item->>'key' = 'equipment.arrows'
                THEN (item - 'uses' - 'tags') || jsonb_build_object('tags', jsonb_build_array('ammo'))
                WHEN item->>'key' = 'equipment.bolts'
                THEN (item - 'uses' - 'tags') || jsonb_build_object('tags', jsonb_build_array('ammo'))
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
        AND (
            item->'tags' ? 'consumable'
            OR item ? 'uses'
            OR item->'tags' IS NULL
            OR NOT (item->'tags' ? 'ammo')
        )
  );

UPDATE public.characters
SET storage = COALESCE(
    (
        SELECT jsonb_agg(
            CASE
                WHEN item->>'key' = 'equipment.arrows'
                THEN (item - 'uses' - 'tags') || jsonb_build_object('tags', jsonb_build_array('ammo'))
                WHEN item->>'key' = 'equipment.bolts'
                THEN (item - 'uses' - 'tags') || jsonb_build_object('tags', jsonb_build_array('ammo'))
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
        AND (
            item->'tags' ? 'consumable'
            OR item ? 'uses'
            OR item->'tags' IS NULL
            OR NOT (item->'tags' ? 'ammo')
        )
  );
