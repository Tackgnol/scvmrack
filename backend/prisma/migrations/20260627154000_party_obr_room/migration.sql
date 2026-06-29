-- OBR room promotion: persist the source Owlbear room id on durable parties.
-- Nullable + unique keeps normal parties unchanged while making promotion
-- idempotent for a given room.

-- AlterTable
ALTER TABLE "parties" ADD COLUMN "obr_room_id" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "parties_obr_room_id_key" ON "parties"("obr_room_id");
