import type { Prisma } from '@prisma/client';

/** Classes a roll may use outside a party: active Book Classes. Everything else needs a Party Class Pool. */
export const bookClasses = {
  source: 'main_book',
  status: 'active',
  takenDownAt: null,
} satisfies Prisma.ClassWhereInput;
