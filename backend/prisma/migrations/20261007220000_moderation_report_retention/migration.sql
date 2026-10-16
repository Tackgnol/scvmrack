ALTER TABLE "moderation_reports"
  ADD COLUMN "reporter_details_removed_at" TIMESTAMP(3);

CREATE INDEX "moderation_reports_resolved_at_reporter_details_removed_at_idx"
  ON "moderation_reports"("resolved_at", "reporter_details_removed_at");
