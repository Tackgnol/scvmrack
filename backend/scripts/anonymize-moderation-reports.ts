import 'dotenv/config';
import { anonymizeExpiredModerationReports } from '../src/services/moderation-service.js';
import prisma from '../src/lib/prisma.js';

try {
  const { count } = await anonymizeExpiredModerationReports();
  console.log(`Anonymised ${count} resolved moderation report(s).`);
} finally {
  await prisma.$disconnect();
}
