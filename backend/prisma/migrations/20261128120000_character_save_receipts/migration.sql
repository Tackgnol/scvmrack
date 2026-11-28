CREATE TABLE "character_save_receipts" (
  "character_id" UUID NOT NULL REFERENCES "characters"("id") ON DELETE CASCADE,
  "save_id" VARCHAR(64) NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("character_id", "save_id")
);

ALTER TABLE "characters" DROP COLUMN IF EXISTS "last_save_id";
