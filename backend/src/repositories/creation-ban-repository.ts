import prisma from '../lib/prisma.js';

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
  async ban(userId: string, actorUserId: string, reason: string) {
    return prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: userId }, select: { id: true } });
      if (!user) {
        return 'missing' as const;
      }
      const created = await tx.classCreationBan.createMany({
        data: { userId, actorUserId, reason },
        skipDuplicates: true,
      });
      if (created.count === 0) {
        return 'already' as const;
      }
      await tx.moderationLog.create({
        data: { targetUserId: userId, actorUserId, action: 'class_creation_banned', reason },
      });
      return 'created' as const;
    });
  },
  async unban(userId: string, actorUserId: string, reason: string) {
    return prisma.$transaction(async (tx) => {
      const removed = await tx.classCreationBan.deleteMany({ where: { userId } });
      if (removed.count === 0) {
        return false;
      }
      await tx.moderationLog.create({
        data: { targetUserId: userId, actorUserId, action: 'class_creation_unbanned', reason },
      });
      return true;
    });
  },
};
