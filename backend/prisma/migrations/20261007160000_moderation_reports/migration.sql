CREATE TYPE "moderation_report_reason" AS ENUM (
  'copyright',
  'child_sexual_abuse_material',
  'threat_to_life_or_safety',
  'terrorist_content',
  'other_illegal_content',
  'abusive_or_hateful',
  'other'
);

CREATE TYPE "moderation_report_status" AS ENUM (
  'open',
  'dismissed',
  'taken_down',
  'content_removed'
);

CREATE TABLE "moderation_reports" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "class_id" INTEGER NOT NULL,
  "reason" "moderation_report_reason" NOT NULL,
  "explanation" VARCHAR(4000) NOT NULL,
  "reporter_name" VARCHAR(200),
  "reporter_email" VARCHAR(320),
  "good_faith" BOOLEAN NOT NULL,
  "status" "moderation_report_status" NOT NULL DEFAULT 'open',
  "resolved_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "moderation_reports_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "moderation_log" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "class_id" INTEGER NOT NULL,
  "report_id" UUID,
  "actor_user_id" TEXT,
  "action" VARCHAR(40) NOT NULL,
  "reason" VARCHAR(4000),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "moderation_log_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "moderation_reports_class_id_status_created_at_idx"
  ON "moderation_reports"("class_id", "status", "created_at");
CREATE INDEX "moderation_reports_status_created_at_idx"
  ON "moderation_reports"("status", "created_at");
CREATE INDEX "moderation_log_class_id_created_at_idx"
  ON "moderation_log"("class_id", "created_at");
CREATE INDEX "moderation_log_report_id_idx" ON "moderation_log"("report_id");

ALTER TABLE "moderation_reports" ADD CONSTRAINT "moderation_reports_class_id_fkey"
  FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "moderation_log" ADD CONSTRAINT "moderation_log_class_id_fkey"
  FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "moderation_log" ADD CONSTRAINT "moderation_log_report_id_fkey"
  FOREIGN KEY ("report_id") REFERENCES "moderation_reports"("id") ON DELETE SET NULL ON UPDATE CASCADE;
