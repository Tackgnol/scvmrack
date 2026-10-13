import type { ModerationReportReason, ModerationReportStatus, Prisma } from '@prisma/client';
import prisma from '../lib/prisma.js';
import { customClassKeyRoot } from '../lib/class-model.js';

const REMOVED = '[removed by moderation]';

/** The class content a removal blanked, kept on the log so a restore can put it back. */
export type RemovalEvidence = {
  versions: Array<{
    id: number;
    name: string;
    appendix: string | null;
    translations: Array<{ locale: string; key: string; value: string }>;
    modifiers: Array<{ id: number; source: string }>;
  }>;
};

export type CreateModerationReportInput = {
  classId: number;
  reason: ModerationReportReason;
  explanation: string;
  reporterName: string | null;
  reporterEmail: string | null;
};

type Tx = Prisma.TransactionClient;

const reportWithClass = {
  class: { select: { id: true, name: true, lineageId: true, owner: { select: { email: true } } } },
} as const;

/** Report reads and writes bound to one transaction, so a service can combine them atomically. */
function reportOps(tx: Tx) {
  return {
    /** Serializes work on `key` until the transaction ends. */
    async lock(key: string): Promise<void> {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${key}))`;
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
    async findLatestOwnerReport(classId: number, ownerUserId: string, statuses: ModerationReportStatus[]) {
      const cls = await tx.class.findUnique({ where: { id: classId }, select: { lineageId: true } });
      if (!cls) {
        return null;
      }
      return tx.moderationReport.findFirst({
        where: { status: { in: statuses }, class: { lineageId: cls.lineageId, ownerUserId } },
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
      from: ModerationReportStatus[],
      to: ModerationReportStatus,
      resolvedAt?: Date
    ): Promise<boolean> {
      const claimed = await tx.moderationReport.updateMany({
        where: { id, status: { in: from } },
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

    async removeFromPools(lineageId: string): Promise<void> {
      await tx.partyClassPool.deleteMany({ where: { lineageId } });
    },

    /** Every version's authored text and modifier sources, as a removal blanks them. */
    async snapshotContent(lineageId: string): Promise<RemovalEvidence> {
      const versions = await tx.class.findMany({
        where: { lineageId },
        select: { id: true, name: true, appendix: true },
      });
      return {
        versions: await Promise.all(versions.map(async (version) => ({
          ...version,
          translations: await tx.translation.findMany({
            where: { key: { startsWith: `${customClassKeyRoot(version.id)}.` } },
            select: { locale: true, key: true, value: true },
          }),
          modifiers: await tx.classAbilityModifier.findMany({
            where: { classId: version.id },
            select: { id: true, source: true },
          }),
        }))),
      };
    },

    /** Replaces the snapshotted versions' text with the removal marker. */
    async blankContent(evidence: RemovalEvidence, at: Date): Promise<void> {
      for (const version of evidence.versions) {
        await tx.translation.updateMany({
          where: { key: { startsWith: `${customClassKeyRoot(version.id)}.` } },
          data: { value: REMOVED },
        });
        await tx.classAbilityModifier.updateMany({ where: { classId: version.id }, data: { source: REMOVED } });
        await tx.class.update({ where: { id: version.id }, data: { appendix: REMOVED, contentRemovedAt: at } });
      }
    },

    /** The content a removal decision on this report recorded, if any. */
    async findRemovalEvidence(reportId: string): Promise<RemovalEvidence | null> {
      const log = await tx.moderationLog.findFirst({
        where: { reportId, action: 'content_removed' },
        orderBy: { createdAt: 'desc' },
        select: { evidence: true },
      });
      const evidence = log?.evidence as RemovalEvidence | null | undefined;
      return evidence?.versions ? evidence : null;
    },

    async restoreContent(evidence: RemovalEvidence): Promise<void> {
      for (const version of evidence.versions) {
        await tx.class.update({ where: { id: version.id }, data: { name: version.name, appendix: version.appendix } });
        for (const translation of version.translations) {
          await tx.translation.upsert({
            where: { locale_key: { locale: translation.locale, key: translation.key } },
            create: translation,
            update: { value: translation.value },
          });
        }
        for (const modifier of version.modifiers) {
          await tx.classAbilityModifier.update({ where: { id: modifier.id }, data: { source: modifier.source } });
        }
      }
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
      select: { id: true, name: true, source: true, visibility: true },
    });
  },
  async listOpenReports() {
    const reports = await prisma.moderationReport.findMany({
      where: { OR: [{ status: 'open' }, { disputes: { some: {} } }] },
      orderBy: { createdAt: 'desc' },
      include: {
        class: {
          select: {
            id: true,
            name: true,
            lineageId: true,
            version: true,
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
  async anonymizeResolvedReports(before: Date) {
    return prisma.moderationReport.updateMany({
      where: {
        status: { not: 'open' },
        resolvedAt: { lt: before },
        reporterDetailsRemovedAt: null,
      },
      data: {
        reporterName: null,
        reporterEmail: null,
        explanation: '[reporter details removed]',
        reporterDetailsRemovedAt: new Date(),
      },
    });
  },
};
