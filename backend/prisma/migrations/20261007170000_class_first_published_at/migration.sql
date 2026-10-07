ALTER TABLE "classes" ADD COLUMN "first_published_at" TIMESTAMP(3);

CREATE INDEX "classes_owner_user_id_first_published_at_idx"
  ON "classes"("owner_user_id", "first_published_at");
