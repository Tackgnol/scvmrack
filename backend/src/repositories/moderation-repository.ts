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
};
