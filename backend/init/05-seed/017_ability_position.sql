-- Book Class ability order: fixed abilities first (by id), then random ones by
-- the roll value that 001/004's INSERTs wrote into position. Mirrors
-- prisma/migrations/20261002130000_ability_position.

UPDATE public.abilities AS a
SET position = ordered.position
FROM (
  SELECT id, row_number() OVER (
    PARTITION BY class_id
    ORDER BY is_random, CASE WHEN is_random THEN position END, id
  ) AS position
  FROM public.abilities
) AS ordered
WHERE a.id = ordered.id;
