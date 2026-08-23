ALTER TABLE "characters"
ADD COLUMN "misery_count" INTEGER NOT NULL DEFAULT 0,
ADD CONSTRAINT "characters_misery_count_check"
CHECK ("misery_count" BETWEEN 0 AND 7);
