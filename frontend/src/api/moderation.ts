import { client, type ApiOk } from "@/api";
import { unwrapApiResult } from "@/api/clientResult";
import type { paths } from "@/api/schema";

export type AdminModerationReportGroup = ApiOk<"/api/admin/reports">[number];
export type AdminModerationReport = AdminModerationReportGroup["reports"][number];
export type AdminCreationBan = ApiOk<"/api/admin/creation-bans/{userId}">;
export type ModerationLogEntry = ApiOk<"/api/admin/log">[number];
/** The category a takedown or removal cites in its statement of reasons. */
export type ModerationGround =
  paths["/api/admin/reports/{id}/take-down"]["post"]["requestBody"]["content"]["application/json"]["ground"];

export const moderationKeys = {
  reports: ["moderation", "reports"] as const,
  log: ["moderation", "log"] as const,
  creationBan: (userId: string) => ["moderation", "creation-ban", userId] as const,
};

const userPath = (userId: string) => ({ params: { path: { userId } } });
const reportPath = (id: string) => ({ params: { path: { id } } });

export async function getCreationBan(userId: string): Promise<AdminCreationBan> {
  return unwrapApiResult(
    await client.GET("/api/admin/creation-bans/{userId}", userPath(userId)),
    "Failed to load creation ban",
  );
}

export async function banClassCreation(userId: string, reason: string) {
  return unwrapApiResult(
    await client.POST("/api/admin/creation-bans/{userId}", { ...userPath(userId), body: { reason } }),
    "Failed to ban class creation",
  );
}

export async function unbanClassCreation(userId: string, reason: string) {
  return unwrapApiResult(
    await client.DELETE("/api/admin/creation-bans/{userId}", { ...userPath(userId), body: { reason } }),
    "Failed to lift creation ban",
  );
}

export async function listOpenModerationReports(): Promise<AdminModerationReportGroup[]> {
  return unwrapApiResult(await client.GET("/api/admin/reports"), "Failed to load moderation reports");
}

export async function dismissModerationReport(id: string, reason: string) {
  return unwrapApiResult(
    await client.POST("/api/admin/reports/{id}/dismiss", { ...reportPath(id), body: { reason } }),
    "Failed to dismiss moderation report",
  );
}

export async function takeDownModerationReport(id: string, reason: string, ground: ModerationGround) {
  return unwrapApiResult(
    await client.POST("/api/admin/reports/{id}/take-down", { ...reportPath(id), body: { reason, ground } }),
    "Failed to take down class",
  );
}

export async function removeModerationContent(id: string, reason: string, ground: ModerationGround) {
  return unwrapApiResult(
    await client.POST("/api/admin/reports/{id}/remove-content", { ...reportPath(id), body: { reason, ground } }),
    "Failed to remove class content",
  );
}

export async function restoreModerationReport(id: string, reason: string) {
  return unwrapApiResult(
    await client.POST("/api/admin/reports/{id}/restore", { ...reportPath(id), body: { reason } }),
    "Failed to restore class",
  );
}

export async function listModerationLog(): Promise<ModerationLogEntry[]> {
  return unwrapApiResult(await client.GET("/api/admin/log"), "Failed to load the moderation log");
}
