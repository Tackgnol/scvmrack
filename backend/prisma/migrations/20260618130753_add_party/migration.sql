-- Party system (Phase 1): parties table + character membership columns.
--
-- Hand-authored to match prisma/schema.prisma (no reachable Postgres in the
-- worktree to run `prisma migrate dev`). Apply with `prisma migrate deploy`.

-- CreateTable
CREATE TABLE "parties" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(120) NOT NULL DEFAULT 'Untitled Warband',
    "owner_user_id" TEXT NOT NULL,
    "invite_token" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "parties_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "parties_invite_token_key" ON "parties"("invite_token");

-- CreateIndex
CREATE INDEX "parties_owner_user_id_idx" ON "parties"("owner_user_id");

-- AlterTable
ALTER TABLE "characters" ADD COLUMN "party_id" UUID,
ADD COLUMN "joined_at" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "idx_characters_party_id" ON "characters"("party_id");

-- AddForeignKey: deleting the GM account cascades the party away.
ALTER TABLE "parties" ADD CONSTRAINT "parties_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: deleting a party unbinds its members (party_id -> NULL).
ALTER TABLE "characters" ADD CONSTRAINT "characters_party_id_fkey" FOREIGN KEY ("party_id") REFERENCES "parties"("id") ON DELETE SET NULL ON UPDATE CASCADE;
