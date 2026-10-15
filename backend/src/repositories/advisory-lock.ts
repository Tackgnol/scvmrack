import type { Prisma } from '@prisma/client';

/** Holds a transaction-scoped advisory lock on `namespace:key`, released when the transaction ends. */
export async function advisoryLock(
  tx: Prisma.TransactionClient,
  namespace: 'lineage' | 'owner' | 'report' | 'party',
  key: string
): Promise<void> {
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`${namespace}:${key}`}))`;
}
