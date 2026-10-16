CREATE TABLE "moderation_disputes" (
  "id" UUID NOT NULL,
  "report_id" UUID NOT NULL,
  "author_user_id" TEXT NOT NULL,
  "text" VARCHAR(4000) NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "moderation_disputes_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "moderation_disputes_report_id_fkey"
    FOREIGN KEY ("report_id") REFERENCES "moderation_reports"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "moderation_disputes_report_id_created_at_idx"
  ON "moderation_disputes"("report_id", "created_at");