-- Enemy stat blocks are owned by durable parties. Deleting a party cascades its
-- enemies; player-facing reads use service projections instead of this table.

-- CreateTable
CREATE TABLE "enemies" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "party_id" UUID NOT NULL,
    "name" VARCHAR(80) NOT NULL,
    "type" VARCHAR(80) NOT NULL DEFAULT '',
    "habitat" VARCHAR(120) NOT NULL DEFAULT '',
    "description" VARCHAR(500) NOT NULL DEFAULT '',
    "health_percent" INTEGER NOT NULL DEFAULT 100,
    "max_health" INTEGER NOT NULL DEFAULT 1,
    "morale" INTEGER NOT NULL DEFAULT 0,
    "armor_die" VARCHAR(24) NOT NULL DEFAULT '',
    "armor_description" VARCHAR(120) NOT NULL DEFAULT '',
    "attacks" JSONB NOT NULL DEFAULT '[]',
    "specials" JSONB NOT NULL DEFAULT '[]',
    "loot" JSONB NOT NULL DEFAULT '[]',
    "statuses" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "enemies_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "enemies_party_id_idx" ON "enemies"("party_id");

-- AddForeignKey
ALTER TABLE "enemies" ADD CONSTRAINT "enemies_party_id_fkey" FOREIGN KEY ("party_id") REFERENCES "parties"("id") ON DELETE CASCADE ON UPDATE CASCADE;
