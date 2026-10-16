import { client } from "@/api";
import type { paths } from "@/api/schema";
import { unwrapApiResult } from "@/api/clientResult";

type ReportBody = paths["/api/reports"]["post"]["requestBody"]["content"]["application/json"];
export type PublicReportInput = Omit<ReportBody, "goodFaith">;
export type ReportReason = ReportBody["reason"];
export const REPORT_REASONS = [
  "copyright",
  "child_sexual_abuse_material",
  "threat_to_life_or_safety",
  "terrorist_content",
  "other_illegal_content",
  "abusive_or_hateful",
  "owner_removal",
  "other",
] as const satisfies readonly ReportReason[];

/** Sends a public class report for human review. */
export async function submitPublicReport(
  input: PublicReportInput,
): Promise<{ id: string }> {
  return unwrapApiResult(
    await client.POST("/api/reports", {
      body: { ...input, goodFaith: true },
    }),
    "Failed to submit the report",
  );
}
