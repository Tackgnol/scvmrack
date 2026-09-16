-- Getting Better previews and applied improvement history.
--
-- Hand-authored to match prisma/schema.prisma. Apply with
-- `prisma migrate deploy`.

-- CreateTable
CREATE TABLE "character_improvements" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "character_id" UUID NOT NULL,
    "sequence" INTEGER NOT NULL,
    "rolled_draft" JSONB NOT NULL,
    "applied" JSONB,
    "snapshot_hash" VARCHAR(128) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "applied_at" TIMESTAMP(3),

    CONSTRAINT "character_improvements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "character_improvements_character_id_sequence_key" ON "character_improvements"("character_id", "sequence");

-- CreateIndex
CREATE INDEX "character_improvements_character_id_applied_at_idx" ON "character_improvements"("character_id", "applied_at");

-- CreateIndex
CREATE UNIQUE INDEX "character_improvements_one_active" ON "character_improvements"("character_id") WHERE "applied_at" IS NULL;

-- AddForeignKey
ALTER TABLE "character_improvements" ADD CONSTRAINT "character_improvements_character_id_fkey" FOREIGN KEY ("character_id") REFERENCES "characters"("id") ON DELETE CASCADE ON UPDATE CASCADE;
