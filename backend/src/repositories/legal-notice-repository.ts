import prisma from '../lib/prisma.js';
import { availableWhere } from '../lib/class-model.js';

/** Finds account email addresses for GMs with an active public Custom Class. */
export const legalNoticeRepository = {
  listPublicClassAuthorEmails() {
    return prisma.user.findMany({
      where: {
        classes: {
          some: {
            source: 'user',
            visibility: 'public',
            ...availableWhere,
          },
        },
      },
      select: { email: true },
    });
  },
};
