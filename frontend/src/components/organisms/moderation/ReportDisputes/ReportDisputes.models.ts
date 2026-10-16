import type { AdminModerationReport } from "@/api/moderation";

export type ReportDisputesProps = {
  disputes: AdminModerationReport["disputes"];
};
