import type { ModerationReportReason, ModerationReportStatus, Prisma } from '@prisma/client';
import { IN_FORCE_STATUSES } from '../lib/moderation-model.js';
import prisma from '../lib/prisma.js';
import type { VersionContent } from '../lib/class-version.js';
import { advisoryLock } from './advisory-lock.js';
import { lineageTxOps, snapshotLineage, writeLineageContent } from './class-version-repository.js';

/** The class content a removal blanked, kept on the log so a restore can put it back. */
export type RemovalEvidence = VersionContent;

export type CreateModerationReportInput = {
  classId: number;
  reason: ModerationReportReason;
  explanation: string;
  reporterName: string | null;
  reporterEmail: string | null;
  reporterLocale: string;
};

type Tx = Prisma.TransactionClient;

const evidenceOf = (log: { evidence: Prisma.JsonValue } | null): RemovalEvidence | null => {
  const evidence = log?.evidence as RemovalEvidence | null | undefined;
  return evidence?.versions ? evidence : null;
};

const reportWithClass = {
  class: { select: { id: true, name: true, lineageId: true, source: true, owner: { select: { email: true } } } },
} as const;

/** Report reads and writes bound to one transaction, so a service can combine them atomically. */
function reportOps(tx: Tx) {
  return {
    ...lineageTxOps(tx),
    /** Serializes work on `key` until the transaction ends. */
    async lock(key: string): Promise<void> {
      await advisoryLock(tx, 'report', key);
    },

    async findReportSince(classId: number, reporterEmail: string, since: Date) {
      return tx.moderationReport.findFirst({
        where: { classId, reporterEmail, createdAt: { gte: since } },
        select: { id: true },
      });
    },

    async createReport(input: CreateModerationReportInput) {
      return tx.moderationReport.create({ data: { ...input, goodFaith: true }, select: { id: true } });
    },

    async findReport(id: string) {
      return tx.moderationReport.findUnique({ where: { id }, include: reportWithClass });
    },

    /** The owner's newest report in `statuses` against any version of the class's lineage. */
    async findLatestOwnerReport(classId: number, ownerUserId: string, statuses: readonly ModerationReportStatus[]) {
      const cls = await tx.class.findUnique({ where: { id: classId }, select: { lineageId: true } });
      if (!cls) {
        return null;
      }
      return tx.moderationReport.findFirst({
        where: { status: { in: [...statuses] }, class: { lineageId: cls.lineageId, ownerUserId } },
        orderBy: { resolvedAt: 'desc' },
        include: reportWithClass,
      });
    },

    async countDisputes(reportId: string): Promise<number> {
      return tx.moderationDispute.count({ where: { reportId } });
    },

    async createDispute(reportId: string, authorUserId: string, text: string) {
      return tx.moderationDispute.create({ data: { reportId, authorUserId, text }, select: { id: true } });
    },

    /** Moves the report to `to` only while it is still in `from`; false when another decision won. */
    async claimReport(
      id: string,
      from: readonly ModerationReportStatus[],
      to: ModerationReportStatus,
      resolvedAt?: Date
    ): Promise<boolean> {
      const claimed = await tx.moderationReport.updateMany({
        where: { id, status: { in: [...from] } },
        data: { status: to, resolvedAt },
      });
      return claimed.count > 0;
    },

    async appendLog(entry: {
      classId: number;
      reportId: string;
      actorUserId: string;
      action: ModerationReportStatus;
      reason: string;
      ground?: ModerationReportReason;
      evidence?: RemovalEvidence;
    }): Promise<void> {
      await tx.moderationLog.create({ data: entry });
    },

    /** Hides every version of the lineage with the moderator's reason. */
    async hideLineage(lineageId: string, reason: string, at: Date): Promise<void> {
      await tx.class.updateMany({ where: { lineageId }, data: { takenDownAt: at, takedownReason: reason } });
    },

    async unhideLineage(lineageId: string): Promise<void> {
      await tx.class.updateMany({
        where: { lineageId },
        data: { takenDownAt: null, contentRemovedAt: null, takedownReason: null },
      });
    },

    async clearContentRemoved(lineageId: string): Promise<void> {
      await tx.class.updateMany({ where: { lineageId }, data: { contentRemovedAt: null } });
    },

    /** The statuses of the lineage's reports that are in `statuses`. */
    async lineageReportStatuses(
      lineageId: string,
      statuses: readonly ModerationReportStatus[]
    ): Promise<ModerationReportStatus[]> {
      const rows = await tx.moderationReport.findMany({
        where: { status: { in: [...statuses] }, class: { lineageId } },
        select: { status: true },
      });
      return rows.map((row) => row.status);
    },

    snapshotContent(lineageId: string): Promise<RemovalEvidence> {
      return snapshotLineage(tx, lineageId);
    },

    /** Writes the blanked content over the lineage and records when it was removed. */
    async blankContent(blanked: RemovalEvidence, at: Date): Promise<void> {
      await writeLineageContent(tx, blanked);
      await tx.class.updateMany({
        where: { id: { in: blanked.versions.map((version) => version.id) } },
        data: { contentRemovedAt: at },
      });
    },

    /** The newest removal evidence logged for a lineage report that is still in one of `statuses`. */
    async findLineageRemovalEvidence(
      lineageId: string,
      statuses: readonly ModerationReportStatus[]
    ): Promise<RemovalEvidence | null> {
      const log = await tx.moderationLog.findFirst({
        where: { action: 'content_removed', report: { status: { in: [...statuses] }, class: { lineageId } } },
        orderBy: { createdAt: 'desc' },
        select: { evidence: true },
      });
      return evidenceOf(log);
    },

    /** The content a removal decision on this report recorded, if any. */
    async findRemovalEvidence(reportId: string): Promise<RemovalEvidence | null> {
      const log = await tx.moderationLog.findFirst({
        where: { reportId, action: 'content_removed' },
        orderBy: { createdAt: 'desc' },
        select: { evidence: true },
      });
      return evidenceOf(log);
    },

    restoreContent(evidence: RemovalEvidence): Promise<void> {
      return writeLineageContent(tx, evidence);
    },
  };
}

export type ReportOps = ReturnType<typeof reportOps>;
export type ReportWithClass = NonNullable<Awaited<ReturnType<ReportOps['findReport']>>>;

/** Data access for immutable public-content reports. */
export const moderationRepository = {
  /** Runs `work` in one transaction with the report operations bound to it. */
  transaction<T>(work: (ops: ReportOps) => Promise<T>): Promise<T> {
    return prisma.$transaction((tx) => work(reportOps(tx)));
  },
  async findClass(id: number) {
    return prisma.class.findUnique({
      where: { id },
      select: { id: true, name: true, source: true, visibility: true, takenDownAt: true },
    });
  },
  async listOpenReports() {
    const reports = await prisma.moderationReport.findMany({
      where: { OR: [{ status: 'open' }, { status: { in: [...IN_FORCE_STATUSES] }, disputes: { some: {} } }] },
      orderBy: { createdAt: 'desc' },
      include: {
        class: {
          select: {
            id: true,
            name: true,
            lineageId: true,
            version: true,
            source: true,
            ownerUserId: true,
            owner: { select: { email: true } },
          },
        },
        disputes: { select: { id: true, text: true, createdAt: true }, orderBy: { createdAt: 'asc' } },
      },
    });
    const lineageIds = [...new Set(reports.map((report) => report.class.lineageId))];
    const versions = lineageIds.length === 0
      ? []
      : await prisma.class.findMany({
          where: { lineageId: { in: lineageIds } },
          select: { id: true, lineageId: true, name: true, version: true },
          orderBy: [{ lineageId: 'asc' }, { version: 'desc' }],
        });
    const ownerIds = [...new Set(reports.map((report) => report.class.ownerUserId).filter((id): id is string => id !== null))];
    const removalLogs = ownerIds.length === 0
      ? []
      : await prisma.moderationLog.findMany({
          where: {
            action: { in: ['taken_down', 'content_removed', 'restored'] },
            class: { ownerUserId: { in: ownerIds } },
          },
          select: {
            id: true, reportId: true, action: true, reason: true, createdAt: true,
            class: { select: { name: true, ownerUserId: true } },
          },
          orderBy: { createdAt: 'desc' },
        });
    return { reports, versions, removalLogs };
  },
  /** The newest `limit` moderation log entries with the class they concern. */
  async listLog(limit: number) {
    return prisma.moderationLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        action: true,
        reason: true,
        ground: true,
        actorUserId: true,
        reportId: true,
        targetUserId: true,
        createdAt: true,
        class: { select: { id: true, name: true } },
      },
    });
  },
  /** Clears reporter details on reports in `statuses` resolved before `before`, replacing the explanation. */
  async anonymizeReports(input: { statuses: readonly ModerationReportStatus[]; before: Date; explanation: string }) {
    return prisma.moderationReport.updateMany({
      where: {
        status: { in: [...input.statuses] },
        resolvedAt: { lt: input.before },
        reporterDetailsRemovedAt: null,
      },
      data: {
        reporterName: null,
        reporterEmail: null,
        explanation: input.explanation,
        reporterDetailsRemovedAt: new Date(),
      },
    });
  },
};
