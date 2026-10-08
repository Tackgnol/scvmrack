import type { ModerationReportReason } from '@prisma/client';
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
      select: { id: true, name: true },
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
          status: 'taken_down',
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
  },  async listOpenReports() {
    return prisma.moderationReport.findMany({
      where: { status: 'open' }, orderBy: { createdAt: 'desc' },
      include: { class: { select: { id: true, name: true, lineageId: true, source: true, owner: { select: { email: true } } } } },
    });
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
  async restoreReport(id: string, actorUserId: string, reason: string) {
    return prisma.$transaction(async (tx) => {
      const report = await tx.moderationReport.findUnique({ where: { id }, include: { class: { select: { lineageId: true } } } });
      if (!report || report.status !== 'taken_down') return null;
      await Promise.all([
        tx.class.updateMany({ where: { lineageId: report.class.lineageId }, data: { takenDownAt: null, takedownReason: null } }),
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