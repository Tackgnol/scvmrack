-- Abilities keep an explicit order (RPG-261). roll_value is renamed in place
-- rather than dropped: the seed's positional INSERTs into abilities rely on
-- column order. It is then rewritten to 1..N per class: fixed abilities first
-- (by id), then random ones by their old roll value, which keeps today's
-- sheet order. Fresh databases are migrated before seeding, so
-- init/05-seed/017_ability_position.sql repeats the backfill.

ALTER TABLE "abilities" RENAME COLUMN "roll_value" TO "position";

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

CREATE INDEX "abilities_class_id_position_idx" ON "abilities"("class_id", "position", "id");
