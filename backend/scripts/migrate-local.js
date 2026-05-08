#!/usr/bin/env node
// Convenience wrapper: applies any pending migrations to the LOCAL dev DB
// (the one started by `docker compose up` from compose.yaml).
//
// Hardcodes the dev credentials that already live in compose.yaml — they're
// not secret. Pass real env vars to run against a different target.
//
// Usage: npm run migrate:local

process.env.DATABASE_HOST ??= 'localhost';
process.env.DATABASE_PORT ??= '5433';
process.env.DATABASE_USER ??= 'p1002_scmgrinder';
process.env.DATABASE_PASSWORD ??= 'p1002_scmgrinder';
process.env.DATABASE_NAME ??= 'p1002_scmgrinder';

await import('./migrate.js');
