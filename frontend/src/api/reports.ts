import { client } from "@/api";
import { unwrapApiResult, type UntypedApiClient } from "@/api/clientResult";

export const REPORT_REASONS = [
  "copyright",
  "child_sexual_abuse_material",
  "threat_to_life_or_safety",
  "terrorist_content",
  "other_illegal_content",
  "abusive_or_hateful",
  "other",
] as const;
export type ReportReason = (typeof REPORT_REASONS)[number];
export type PublicReportInput = {
  classId: number;
  reason: ReportReason;
  explanation: string;
  reporterName?: string;
  reporterEmail?: string;
  locale: "en" | "pl";
};
const reportClient = client as unknown as UntypedApiClient;

/** Sends a public class report for human review. */
export async function submitPublicReport(
  input: PublicReportInput,
): Promise<{ id: string }> {
  return unwrapApiResult(
    await reportClient.POST<{ id: string }>("/api/reports", {
      body: { ...input, goodFaith: true },
    }),
    "Failed to submit the report",
  );
}
