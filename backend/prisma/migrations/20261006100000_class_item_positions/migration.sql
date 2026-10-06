-- Class Items have one cross-type order within their owning Custom Class.
ALTER TABLE "weapons" ADD COLUMN "position" INTEGER;
ALTER TABLE "armor" ADD COLUMN "position" INTEGER;
ALTER TABLE "equipment" ADD COLUMN "position" INTEGER;
ALTER TABLE "pets" ADD COLUMN "position" INTEGER;

-- Legacy generated keys used one shared numeric suffix, which is the old order.
UPDATE "weapons" SET "position" = (regexp_match("key", '-([0-9]+)$'))[1]::INTEGER WHERE "class_id" IS NOT NULL;
UPDATE "armor" SET "position" = (regexp_match("key", '-([0-9]+)$'))[1]::INTEGER WHERE "class_id" IS NOT NULL;
UPDATE "equipment" SET "position" = (regexp_match("key", '-([0-9]+)$'))[1]::INTEGER WHERE "class_id" IS NOT NULL;
UPDATE "pets" SET "position" = (regexp_match("key", '-([0-9]+)$'))[1]::INTEGER WHERE "class_id" IS NOT NULL;

CREATE INDEX "weapons_class_id_position_idx" ON "weapons"("class_id", "position");
CREATE INDEX "armor_class_id_position_idx" ON "armor"("class_id", "position");
CREATE INDEX "equipment_class_id_position_idx" ON "equipment"("class_id", "position");
CREATE INDEX "pets_class_id_position_idx" ON "pets"("class_id", "position");
