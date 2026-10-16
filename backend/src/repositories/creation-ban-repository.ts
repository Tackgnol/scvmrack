import type { Prisma } from '@prisma/client';
import prisma from '../lib/prisma.js';

type Tx = Prisma.TransactionClient;

/** Ban reads and writes bound to one transaction. */
function banOps(tx: Tx) {
  return {
    async userExists(userId: string): Promise<boolean> {
      return (await tx.user.findUnique({ where: { id: userId }, select: { id: true } })) !== null;
    },
    /** Adds the ban unless one exists; false when the user was already banned. */
    async addBan(userId: string, actorUserId: string, reason: string): Promise<boolean> {
      const created = await tx.classCreationBan.createMany({ data: { userId, actorUserId, reason }, skipDuplicates: true });
      return created.count > 0;
    },
    /** Lifts the ban; false when there was none. */
    async removeBan(userId: string): Promise<boolean> {
      const removed = await tx.classCreationBan.deleteMany({ where: { userId } });
      return removed.count > 0;
    },
    async appendLog(entry: { targetUserId: string; actorUserId: string; action: string; reason: string }): Promise<void> {
      await tx.moderationLog.create({ data: entry });
    },
  };
}

export type BanOps = ReturnType<typeof banOps>;

/** Reads active creation restrictions and records administrator decisions. */
export const creationBanRepository = {
  async findUser(userId: string) {
    return prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
  },
  async findActive(userId: string) {
    return prisma.classCreationBan.findUnique({
      where: { userId },
      select: { reason: true, bannedAt: true },
    });
  },
  async listHistory(userId: string) {
    return prisma.moderationLog.findMany({
      where: { targetUserId: userId, action: { in: ['class_creation_banned', 'class_creation_unbanned'] } },
      select: { id: true, action: true, actorUserId: true, reason: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
  },
  /** Runs `work` in one transaction with the ban operations bound to it. */
  transaction<T>(work: (ops: BanOps) => Promise<T>): Promise<T> {
    return prisma.$transaction((tx) => work(banOps(tx)));
  },
};
