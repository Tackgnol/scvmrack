import 'dotenv/config';
import { moderationRepository } from '../src/repositories/moderation-repository.js';
import prisma from '../src/lib/prisma.js';

const cutoff = new Date();
cutoff.setUTCFullYear(cutoff.getUTCFullYear() - 2);

try {
  const { count } = await moderationRepository.anonymizeResolvedReports(cutoff);
  console.log(`Anonymised ${count} resolved moderation report(s).`);
} finally {
  await prisma.$disconnect();
}
