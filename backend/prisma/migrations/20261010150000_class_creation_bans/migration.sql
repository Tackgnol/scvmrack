ALTER TABLE "moderation_log" ALTER COLUMN "class_id" DROP NOT NULL;
ALTER TABLE "moderation_log" ADD COLUMN "target_user_id" TEXT;
CREATE INDEX "moderation_log_target_user_id_created_at_idx" ON "moderation_log"("target_user_id", "created_at");

CREATE TABLE "class_creation_bans" (
  "user_id" TEXT NOT NULL,
  "reason" VARCHAR(4000) NOT NULL,
  "actor_user_id" TEXT NOT NULL,
  "banned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "class_creation_bans_pkey" PRIMARY KEY ("user_id")
);
