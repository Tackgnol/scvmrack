import type { Prisma } from '@prisma/client';
import { availableWhere } from './class-model.js';

/** Classes a roll may use outside a party: active Book Classes. Everything else needs a Party Class Pool. */
export const bookClasses = {
  source: 'main_book',
  ...availableWhere,
} satisfies Prisma.ClassWhereInput;
