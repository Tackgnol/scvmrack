import type { Prisma } from '@prisma/client';

/** Classes open to every roll and picker: Built-in Classes. Custom Classes reach rolls only through Party Class Pools. */
export const builtInClasses = { source: { not: 'user' } } satisfies Prisma.ClassWhereInput;
