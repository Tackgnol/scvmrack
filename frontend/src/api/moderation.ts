import { client } from "@/api";
import { unwrapApiResult, type UntypedApiClient } from "@/api/clientResult";
import type { ReportReason } from "@/api/reports";

export type AdminModerationReport = {
  id: string;
  classId: number;
  className: string;
  lineageId: string;
  classVersion: number;
  reason: ReportReason;
  explanation: string;
  reporterName: string | null;
  reporterEmail: string | null;
  createdAt: string;
  serious: boolean;
  status: "open" | "dismissed" | "taken_down" | "content_removed" | "restored";
  disputes: Array<{ id: string; text: string; createdAt: string }>;
};

export type AdminModerationReportGroup = {
  lineageId: string;
  ownerUserId: string | null;
  latest: { id: number; lineageId: string; name: string; version: number };
  versions: Array<{ id: number; lineageId: string; name: string; version: number }>;
  reports: AdminModerationReport[];
  removalHistory: Array<{ id: string; className: string; date: string; reason: string | null; restored: boolean }> | null;
};

export type AdminCreationBan = {
  userId: string;
  active: { reason: string; bannedAt: string } | null;
  history: Array<{ id: string; action: string; actorUserId: string | null; reason: string | null; date: string }>;
};

const moderationClient = client as unknown as UntypedApiClient;

export async function getCreationBan(userId: string): Promise<AdminCreationBan> {
  return unwrapApiResult(
    await moderationClient.GET<AdminCreationBan>(`/api/admin/creation-bans/${encodeURIComponent(userId)}`),
    "Failed to load creation ban",
  );
}

export async function banClassCreation(userId: string, reason: string) {
  return unwrapApiResult(
    await moderationClient.POST<{ banned: true }>(`/api/admin/creation-bans/${encodeURIComponent(userId)}`, { body: { reason } }),
    "Failed to ban class creation",
  );
}

export async function unbanClassCreation(userId: string, reason: string) {
  return unwrapApiResult(
    await moderationClient.DELETE<{ banned: false }>(`/api/admin/creation-bans/${encodeURIComponent(userId)}`, { body: { reason } }),
    "Failed to lift creation ban",
  );
}

export async function listOpenModerationReports(): Promise<AdminModerationReportGroup[]> {
  return unwrapApiResult(
    await moderationClient.GET<AdminModerationReportGroup[]>("/api/admin/reports"),
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
export async function removeModerationContent(id: string, reason: string) {
  return unwrapApiResult(
    await moderationClient.POST<{ contentRemoved: boolean }>(`/api/admin/reports/${id}/remove-content`, {
      body: { reason },
    }),
    "Failed to remove class content",
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
