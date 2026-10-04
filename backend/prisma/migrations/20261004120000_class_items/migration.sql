-- Class Items (RPG-269): weapons, armor, gear and pets that belong to one
-- Custom Class. They live in the catalog tables, scoped by "class_id", and
-- never show in item search or the book's starting tables. A row stays when
-- the class drops the item, so characters holding it keep its stats.

ALTER TABLE "weapons" ADD COLUMN "class_id" INTEGER REFERENCES "classes"("id") ON DELETE CASCADE;
ALTER TABLE "armors" ADD COLUMN "class_id" INTEGER REFERENCES "classes"("id") ON DELETE CASCADE;
ALTER TABLE "equipment" ADD COLUMN "class_id" INTEGER REFERENCES "classes"("id") ON DELETE CASCADE;
ALTER TABLE "pets" ADD COLUMN "class_id" INTEGER REFERENCES "classes"("id") ON DELETE CASCADE;

CREATE INDEX "weapons_class_id_idx" ON "weapons"("class_id");
CREATE INDEX "armors_class_id_idx" ON "armors"("class_id");
CREATE INDEX "equipment_class_id_idx" ON "equipment"("class_id");
CREATE INDEX "pets_class_id_idx" ON "pets"("class_id");
