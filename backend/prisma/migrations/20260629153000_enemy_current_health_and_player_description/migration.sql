-- Keep actual HP as source of truth. Percentages are derived in projections.
ALTER TABLE "enemies"
  ADD COLUMN "player_description" VARCHAR(500) NOT NULL DEFAULT '',
  ADD COLUMN "current_health" INTEGER NOT NULL DEFAULT 1;

UPDATE "enemies"
SET "current_health" = GREATEST(
  0,
  LEAST("max_health", ROUND(("max_health" * "health_percent") / 100.0)::INTEGER)
);

ALTER TABLE "enemies"
  DROP COLUMN "health_percent";
