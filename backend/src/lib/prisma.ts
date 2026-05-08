import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

function resolveDatabaseUrl(): string {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  const {
    DATABASE_USER,
    DATABASE_PASSWORD,
    DATABASE_HOST,
    DATABASE_NAME,
    DATABASE_PORT,
  } = process.env;

  if (!DATABASE_USER || !DATABASE_PASSWORD || !DATABASE_HOST || !DATABASE_NAME) {
    throw new Error('DATABASE_URL or DATABASE_* environment variables are required for Prisma');
  }

  const user = encodeURIComponent(DATABASE_USER);
  const password = encodeURIComponent(DATABASE_PASSWORD);
  const host = DATABASE_HOST;
  const port = DATABASE_PORT || '5432';
  const database = encodeURIComponent(DATABASE_NAME);

  return `postgresql://${user}:${password}@${host}:${port}/${database}`;
}

const adapter = new PrismaPg({ connectionString: resolveDatabaseUrl() });

export const prisma = new PrismaClient({ adapter });

export default prisma;
