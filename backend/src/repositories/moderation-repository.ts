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
  async createReport(input: CreateModerationReportInput) {
    return prisma.moderationReport.create({
      data: { ...input, goodFaith: true },
      select: { id: true },
    });
  },
  async listOpenReports() {
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
  },};
