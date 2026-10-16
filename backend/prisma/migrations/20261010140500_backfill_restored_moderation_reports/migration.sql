UPDATE "moderation_reports" AS report
SET "status" = 'restored'
WHERE report."status" IN ('taken_down', 'content_removed')
  AND EXISTS (
    SELECT 1
    FROM "moderation_log" AS log
    WHERE log."report_id" = report."id"
      AND log."action" = 'restored'
  );
