import { client } from "@/api";
import { unwrapApiResult, type UntypedApiClient } from "@/api/clientResult";
import type { ReportReason } from "@/api/reports";

export type AdminModerationReport = {
  id: string;
  classId: number;
  className: string;
  reason: ReportReason;
  explanation: string;
  reporterName: string | null;
  reporterEmail: string | null;
  createdAt: string;
  serious: boolean;
  status: "open" | "dismissed" | "taken_down" | "content_removed";
  disputes: Array<{ id: string; text: string; createdAt: string }>;
};

const moderationClient = client as unknown as UntypedApiClient;

export async function listOpenModerationReports(): Promise<AdminModerationReport[]> {
  return unwrapApiResult(
    await moderationClient.GET<AdminModerationReport[]>("/api/admin/reports"),
    "Failed to load moderation reports",
  );
}

export async function dismissModerationReport(id: string, reason: string) {
  return unwrapApiResult(
    await moderationClient.POST<{ dismissed: boolean }>(`/api/admin/reports/${id}/dismiss`, {
      body: { reason },
    }),
    "Failed to dismiss moderation report",
  );
}

export async function takeDownModerationReport(id: string, reason: string) {
  return unwrapApiResult(
    await moderationClient.POST<{ takenDown: boolean }>(`/api/admin/reports/${id}/take-down`, {
      body: { reason },
    }),
    "Failed to take down class",
  );
}
export async function restoreModerationReport(id: string, reason: string) {
  return unwrapApiResult(
    await moderationClient.POST<{ restored: boolean }>(`/api/admin/reports/${id}/restore`, {
      body: { reason },
    }),
    "Failed to restore class",
  );
}