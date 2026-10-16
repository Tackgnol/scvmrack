-- The category a takedown or removal was decided under.
ALTER TABLE "moderation_log" ADD COLUMN "ground" "moderation_report_reason";

-- The language the reporter used, so decision mail reaches them in it.
ALTER TABLE "moderation_reports" ADD COLUMN "reporter_locale" VARCHAR(5) NOT NULL DEFAULT 'en';

-- The moderation log is append-only: decisions can be followed by new entries, never edited or erased.
CREATE OR REPLACE FUNCTION "moderation_log_append_only"() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'moderation_log is append-only';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "moderation_log_append_only"
  BEFORE UPDATE OR DELETE ON "moderation_log"
  FOR EACH ROW EXECUTE FUNCTION "moderation_log_append_only"();

-- Log entries keep their report: deleting a report must not rewrite the append-only log.
ALTER TABLE "moderation_log" DROP CONSTRAINT "moderation_log_report_id_fkey";
ALTER TABLE "moderation_log" ADD CONSTRAINT "moderation_log_report_id_fkey"
  FOREIGN KEY ("report_id") REFERENCES "moderation_reports"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
