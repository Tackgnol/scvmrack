-- Book Class stat dice and omen dice. The positional class INSERTs above write
-- the old {stat: modifier} JSON into stat_dice; this converts it to 3d6 specs
-- and sets the printed book's omen dice. Mirrors
-- prisma/migrations/20261001140000_class_stat_dice_and_omen_die.

UPDATE public.classes AS c
SET stat_dice = (
  SELECT jsonb_object_agg(stat, jsonb_build_object(
    'count', 3,
    'faces', 6,
    'modifier', coalesce((c.stat_dice ->> stat)::int, 0),
    'dropLowest', false
  ))
  FROM unnest(ARRAY['strength', 'agility', 'presence', 'toughness']) AS stat
)
WHERE jsonb_typeof(c.stat_dice -> 'strength') IS DISTINCT FROM 'object';

UPDATE public.classes SET omen_die = 4
WHERE name_key IN ('classes.esoteric_hermit.name', 'classes.heretical_priest.name');
