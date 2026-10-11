import prisma from '../lib/prisma.js';

/** Finds account email addresses for GMs with an active public Custom Class. */
export const legalNoticeRepository = {
  listPublicClassAuthorEmails() {
    return prisma.user.findMany({
      where: {
        classes: {
          some: {
            source: 'user',
            visibility: 'public',
            status: 'active',
            takenDownAt: null,
          },
        },
      },
      select: { email: true },
    });
  },
};
