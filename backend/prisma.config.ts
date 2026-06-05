import 'dotenv/config';
import { defineConfig } from 'prisma/config';

const databaseUrl =
  process.env.DATABASE_URL ??
  'postgresql://p1002_scmgrinder:p1002_scmgrinder@localhost:5433/p1002_scmgrinder';

export default defineConfig({
  experimental: {
    externalTables: true,
  },
  schema: 'prisma/schema.prisma',
  datasource: {
    url: databaseUrl,
  },
  migrations: {
    path: 'prisma/migrations',
  },
});
