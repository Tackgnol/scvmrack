import type { AdminModerationReportGroup } from "@/api/moderation";

export type ModerationRemovalHistoryProps = {
  history: NonNullable<AdminModerationReportGroup["removalHistory"]>;
};
