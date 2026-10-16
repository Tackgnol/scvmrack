-- Per-stat dice and an omen die per class (RPG-259). stat_modifiers is renamed
-- in place, not dropped, because the seed's positional INSERTs into classes
-- rely on column order. Its {stat: modifier} values become
-- {stat: {count: 3, faces: 6, modifier, dropLowest: false}}, which rolls
-- exactly as before. The Esoteric Hermit and Heretical Priest get the printed
-- book's d4 omen die; every other class keeps d2.
-- Fresh databases are migrated before seeding, so the conversion is repeated
-- in init/05-seed/015_class_stat_dice_and_omen_die.sql.

ALTER TABLE "classes" RENAME COLUMN "stat_modifiers" TO "stat_dice";
ALTER TABLE "classes"
ADD COLUMN "omen_die" INTEGER NOT NULL DEFAULT 2,
ADD CONSTRAINT "classes_omen_die_check" CHECK ("omen_die" >= 2);

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

ALTER TABLE "classes"
ALTER COLUMN "stat_dice" SET DEFAULT '{"strength": {"count": 3, "faces": 6, "modifier": 0, "dropLowest": false}, "agility": {"count": 3, "faces": 6, "modifier": 0, "dropLowest": false}, "presence": {"count": 3, "faces": 6, "modifier": 0, "dropLowest": false}, "toughness": {"count": 3, "faces": 6, "modifier": 0, "dropLowest": false}}'::jsonb,
ALTER COLUMN "stat_dice" SET NOT NULL;
