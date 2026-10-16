import { SERIOUS_REPORT_REASONS } from '../lib/moderation-model.js';
import type { moderationRepository } from '../repositories/moderation-repository.js';
import type { ModerationQueueGroup, ModerationQueueReport, RemovalHistoryEntry } from '../schemas/moderation.js';

type QueueRows = Awaited<ReturnType<typeof moderationRepository.listOpenReports>>;

/** Each GM's earlier takedowns and removals, newest first, marked when a later restore undid them. */
function removalHistoryByOwner(logs: QueueRows['removalLogs']): Map<string, RemovalHistoryEntry[]> {
  const restored = new Set(logs.filter((entry) => entry.action === 'restored').map((entry) => entry.reportId));
  const byOwner = new Map<string, RemovalHistoryEntry[]>();
  for (const entry of logs) {
    const ownerUserId = entry.class?.ownerUserId;
    if (entry.action === 'restored' || !ownerUserId) {
      continue;
    }
    byOwner.set(ownerUserId, [
      ...(byOwner.get(ownerUserId) ?? []),
      {
        id: entry.id,
        className: entry.class!.name,
        date: entry.createdAt.toISOString(),
        reason: entry.reason,
        restored: entry.reportId !== null && restored.has(entry.reportId),
      },
    ]);
  }
  return byOwner;
}

/**
 * The moderation queue: open or disputed reports grouped by class lineage, each group with its
 * versions newest first and the owner's removal history. Groups holding a serious report come first.
 */
export function buildModerationQueue({ reports, versions, removalLogs }: QueueRows) {
  const historyByOwner = removalHistoryByOwner(removalLogs);
  const groups = new Map<string, ModerationQueueGroup>();
  for (const report of reports) {
    const { lineageId, ownerUserId } = report.class;
    const group = groups.get(lineageId);
    if (group) {
      group.reports.push(toQueueReport(report));
      continue;
    }
    const known = versions.filter((version) => version.lineageId === lineageId);
    const lineageVersions = (known.length > 0
      ? known
      : [{ id: report.classId, lineageId, name: report.class.name, version: report.class.version }]
    ).sort((a, b) => b.version - a.version);
    groups.set(lineageId, {
      lineageId,
      latest: lineageVersions[0],
      versions: lineageVersions,
      reports: [toQueueReport(report)],
      ownerUserId,
      builtIn: report.class.source !== 'user',
      removalHistory: ownerUserId ? historyByOwner.get(ownerUserId) ?? [] : null,
    });
  }
  const serious = (group: { reports: Array<{ serious: boolean }> }) => group.reports.some((report) => report.serious);
  return [...groups.values()].sort((a, b) => Number(serious(b)) - Number(serious(a)));
}

function toQueueReport(report: QueueRows['reports'][number]): ModerationQueueReport {
  return {
    id: report.id,
    classId: report.classId,
    className: report.class.name,
    lineageId: report.class.lineageId,
    classVersion: report.class.version,
    reason: report.reason,
    explanation: report.explanation,
    reporterName: report.reporterName,
    reporterEmail: report.reporterEmail,
    status: report.status,
    disputes: report.disputes.map((dispute) => ({
      id: dispute.id,
      text: dispute.text,
      createdAt: dispute.createdAt.toISOString(),
    })),
    createdAt: report.createdAt.toISOString(),
    serious: SERIOUS_REPORT_REASONS.includes(report.reason),
  };
}
