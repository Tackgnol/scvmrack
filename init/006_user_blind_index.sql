-- Migration: Add blind index email strategy for GDPR compliance

-- Drop existing user table from better-auth (if fresh install, adjust if you have data)
DROP TABLE IF EXISTS "verification" CASCADE;
DROP TABLE IF EXISTS "account" CASCADE;
DROP TABLE IF EXISTS "session" CASCADE;
DROP TABLE IF EXISTS "user" CASCADE;

-- Recreate with blind index strategy
CREATE TABLE "user" (
                        "id" TEXT NOT NULL PRIMARY KEY,
                        "name" TEXT NOT NULL,
                        "encrypted_email" TEXT NOT NULL,        -- AES-256-GCM encrypted
                        "email_bidx" TEXT NOT NULL UNIQUE,      -- HMAC-SHA256 blind index
                        "emailVerified" BOOLEAN NOT NULL DEFAULT FALSE,
                        "image" TEXT,
                        "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
                        "updatedAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX "idx_user_email_bidx" ON "user"("email_bidx");

CREATE TABLE "session" (
                           "id" TEXT NOT NULL PRIMARY KEY,
                           "expiresAt" TIMESTAMPTZ NOT NULL,
                           "token" TEXT NOT NULL UNIQUE,
                           "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
                           "updatedAt" TIMESTAMPTZ NOT NULL,
                           "ipAddress" TEXT,
                           "userAgent" TEXT,
                           "userId" TEXT NOT NULL REFERENCES "user" ("id") ON DELETE CASCADE
);

CREATE INDEX "session_userId_idx" ON "session" ("userId");

CREATE TABLE "account" (
                           "id" TEXT NOT NULL PRIMARY KEY,
                           "accountId" TEXT NOT NULL,
                           "providerId" TEXT NOT NULL,
                           "userId" TEXT NOT NULL REFERENCES "user" ("id") ON DELETE CASCADE,
                           "accessToken" TEXT,
                           "refreshToken" TEXT,
                           "idToken" TEXT,
                           "accessTokenExpiresAt" TIMESTAMPTZ,
                           "refreshTokenExpiresAt" TIMESTAMPTZ,
                           "scope" TEXT,
                           "password" TEXT,
                           "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
                           "updatedAt" TIMESTAMPTZ NOT NULL
);

CREATE INDEX "account_userId_idx" ON "account" ("userId");

CREATE TABLE "verification" (
                                "id" TEXT NOT NULL PRIMARY KEY,
                                "identifier" TEXT NOT NULL,  -- Will store email_bidx for lookups
                                "value" TEXT NOT NULL,
                                "expiresAt" TIMESTAMPTZ NOT NULL,
                                "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
                                "updatedAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX "verification_identifier_idx" ON "verification" ("identifier");
