-- Better Auth anonymous plugin support.
-- Safe to run multiple times.
ALTER TABLE "user"
    ADD COLUMN IF NOT EXISTS "isAnonymous" BOOLEAN NOT NULL DEFAULT FALSE;
