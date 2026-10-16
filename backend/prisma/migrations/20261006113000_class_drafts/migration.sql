CREATE TABLE "class_drafts" (
    "id" SERIAL NOT NULL,
    "owner_user_id" TEXT NOT NULL,
    "class_id" INTEGER,
    "payload" JSONB NOT NULL,
    "revision" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "class_drafts_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "class_drafts_owner_user_id_class_id_key" ON "class_drafts"("owner_user_id", "class_id");
CREATE INDEX "class_drafts_owner_user_id_updated_at_idx" ON "class_drafts"("owner_user_id", "updated_at");
CREATE INDEX "class_drafts_class_id_idx" ON "class_drafts"("class_id");

ALTER TABLE "class_drafts" ADD CONSTRAINT "class_drafts_owner_user_id_fkey"
  FOREIGN KEY ("owner_user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "class_drafts" ADD CONSTRAINT "class_drafts_class_id_fkey"
  FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE SET NULL ON UPDATE CASCADE;