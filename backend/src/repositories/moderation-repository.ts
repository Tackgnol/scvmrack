import { Prisma, type ModerationReportReason } from '@prisma/client';
import prisma from '../lib/prisma.js';

export type CreateModerationReportInput = {
  classId: number;
  reason: ModerationReportReason;
  explanation: string;
  reporterName: string | null;
  reporterEmail: string | null;
};

/** Data access for immutable public-content reports. */
export const moderationRepository = {
  async findClass(id: number) {
    return prisma.class.findUnique({
      where: { id },
      select: { id: true, name: true, source: true, visibility: true },
    });
  },
  async createOrMergeReport(input: CreateModerationReportInput) {
    return prisma.$transaction(async (tx) => {
      if (input.reporterEmail) {
        // Serialize one reporter-class pair so simultaneous retries still merge.
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`${input.classId}:${input.reporterEmail}`}))`;
        const recent = await tx.moderationReport.findFirst({
          where: {
            classId: input.classId,
            reporterEmail: input.reporterEmail,
            createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
          },
          select: { id: true },
        });
        if (recent) return { ...recent, merged: true };
      }
      const report = await tx.moderationReport.create({
        data: { ...input, goodFaith: true },
        select: { id: true },
      });
      return { ...report, merged: false };
    });
  },
async createDispute(classId: number, authorUserId: string, text: string) {
    return prisma.$transaction(async (tx) => {
      const cls = await tx.class.findUnique({
        where: { id: classId },
        select: { lineageId: true },
      });
      if (!cls) return { kind: 'missing' as const };
      const report = await tx.moderationReport.findFirst({
        where: {
          status: { in: ['taken_down', 'content_removed'] },
          class: { lineageId: cls.lineageId, ownerUserId: authorUserId },
        },
        orderBy: { resolvedAt: 'desc' },
        include: { class: { select: { name: true, owner: { select: { email: true } } } } },
      });
      if (!report) return { kind: 'missing' as const };
      const count = await tx.moderationDispute.count({ where: { reportId: report.id } });
      if (count >= 3) return { kind: 'limit' as const };
      const dispute = await tx.moderationDispute.create({
        data: { reportId: report.id, authorUserId, text },
        select: { id: true },
      });
      return { kind: 'created' as const, dispute, report };
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
  async dismissReport(id: string, actorUserId: string, reason: string) {
    return prisma.$transaction(async (tx) => {
      const report = await tx.moderationReport.findUnique({ where: { id }, include: { class: { select: { name: true } } } });
      if (!report || report.status !== 'open') return null;
      await tx.moderationReport.update({ where: { id }, data: { status: 'dismissed', resolvedAt: new Date() } });
      await tx.moderationLog.create({ data: { classId: report.classId, reportId: id, actorUserId, action: 'dismissed', reason } });
      return report;
    });
  },
  async takeDownReport(id: string, actorUserId: string, reason: string) {
    return prisma.$transaction(async (tx) => {
      const report = await tx.moderationReport.findUnique({ where: { id }, include: { class: { select: { id: true, name: true, lineageId: true, owner: { select: { email: true } } } } } });
      if (!report || report.status !== 'open') return null;
      const now = new Date();
      await Promise.all([
        tx.class.updateMany({ where: { lineageId: report.class.lineageId }, data: { takenDownAt: now, takedownReason: reason } }),
        tx.partyClassPool.deleteMany({ where: { lineageId: report.class.lineageId } }),
        tx.moderationReport.update({ where: { id }, data: { status: 'taken_down', resolvedAt: now } }),
        tx.moderationLog.create({ data: { classId: report.classId, reportId: id, actorUserId, action: 'taken_down', reason } }),
      ]);
      return report;
    });
  },
  async removeContentReport(id: string, actorUserId: string, reason: string) {
    return prisma.$transaction(async (tx) => {
      const report = await tx.moderationReport.findUnique({
        where: { id },
        include: { class: { select: { name: true, lineageId: true, owner: { select: { email: true } } } } },
      });
      if (!report || report.status !== 'open') return null;
      const versions = await tx.class.findMany({
        where: { lineageId: report.class.lineageId },
        select: { id: true, name: true, appendix: true },
      });
      const evidence = {
        versions: await Promise.all(versions.map(async (version) => ({
          ...version,
          translations: await tx.translation.findMany({
            where: { key: { startsWith: `cc.${version.id}.` } },
            select: { locale: true, key: true, value: true },
          }),
          modifiers: await tx.classAbilityModifier.findMany({
            where: { classId: version.id },
            select: { id: true, source: true },
          }),
        }))),
      } satisfies Prisma.InputJsonValue;
      const now = new Date();
      for (const version of versions) {
        await Promise.all([
          tx.translation.updateMany({
            where: { key: { startsWith: `cc.${version.id}.` } },
            data: { value: '[removed by moderation]' },
          }),
          tx.classAbilityModifier.updateMany({
            where: { classId: version.id },
            data: { source: '[removed by moderation]' },
          }),
        ]);
      }
      await Promise.all([
        tx.class.updateMany({
          where: { lineageId: report.class.lineageId },
          data: { appendix: '[removed by moderation]', takenDownAt: now, contentRemovedAt: now, takedownReason: reason },
        }),
        tx.partyClassPool.deleteMany({ where: { lineageId: report.class.lineageId } }),
        tx.moderationReport.update({ where: { id }, data: { status: 'content_removed', resolvedAt: now } }),
        tx.moderationLog.create({
          data: { classId: report.classId, reportId: id, actorUserId, action: 'content_removed', reason, evidence },
        }),
      ]);
      return report;
    });
  },
  async restoreReport(id: string, actorUserId: string, reason: string) {
    return prisma.$transaction(async (tx) => {
      const report = await tx.moderationReport.findUnique({ where: { id }, include: { class: { select: { lineageId: true } } } });
      if (!report || !['taken_down', 'content_removed'].includes(report.status)) return null;
      const claimed = await tx.moderationReport.updateMany({
        where: { id, status: { in: ['taken_down', 'content_removed'] } },
        data: { status: 'restored' },
      });
      if (claimed.count === 0) return null;
      if (report.status === 'content_removed') {
        const log = await tx.moderationLog.findFirst({
          where: { reportId: id, action: 'content_removed' },
          orderBy: { createdAt: 'desc' },
          select: { evidence: true },
        });
        const evidence = log?.evidence as { versions?: Array<{
          id: number; name: string; appendix: string | null;
          translations: Array<{ locale: string; key: string; value: string }>;
          modifiers: Array<{ id: number; source: string }>;
        }> } | null;
        if (!evidence?.versions) throw new Error('Missing content-removal evidence');
        for (const version of evidence.versions) {
          await tx.class.update({ where: { id: version.id }, data: { name: version.name, appendix: version.appendix } });
          await Promise.all([
            ...version.translations.map((translation) => tx.translation.upsert({
              where: { locale_key: { locale: translation.locale, key: translation.key } },
              create: translation,
              update: { value: translation.value },
            })),
            ...version.modifiers.map((modifier) => tx.classAbilityModifier.update({
              where: { id: modifier.id }, data: { source: modifier.source },
            })),
          ]);
        }
      }
      await Promise.all([
        tx.class.updateMany({ where: { lineageId: report.class.lineageId }, data: { takenDownAt: null, contentRemovedAt: null, takedownReason: null } }),
        tx.moderationLog.create({ data: { classId: report.classId, reportId: id, actorUserId, action: 'restored', reason } }),
      ]);
      return report;
    });
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
