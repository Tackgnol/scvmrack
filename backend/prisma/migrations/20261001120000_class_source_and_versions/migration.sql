-- Custom Classes groundwork (RPG-257): every class row carries its source,
-- Credit, owner, lifecycle and Class Version lineage (ADR 0001).
-- Column defaults describe a Book Class so the positional seed INSERTs and the
-- existing rows (each becoming version 1 of its own lineage) need no changes.

CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE TYPE "class_source" AS ENUM ('main_book', 'zine', 'the_rack', 'user');
CREATE TYPE "class_visibility" AS ENUM ('private', 'public');
CREATE TYPE "class_status" AS ENUM ('draft', 'active', 'archived');

ALTER TABLE "classes"
ADD COLUMN "source" "class_source" NOT NULL DEFAULT 'main_book',
ADD COLUMN "credit_work" TEXT,
ADD COLUMN "credit_author" TEXT,
ADD COLUMN "credit_url" TEXT,
ADD COLUMN "owner_user_id" TEXT,
ADD COLUMN "languages" VARCHAR(2)[] NOT NULL DEFAULT ARRAY['en', 'pl']::VARCHAR(2)[],
ADD COLUMN "visibility" "class_visibility" NOT NULL DEFAULT 'public',
ADD COLUMN "status" "class_status" NOT NULL DEFAULT 'active',
ADD COLUMN "taken_down_at" TIMESTAMP(3),
ADD COLUMN "takedown_reason" TEXT,
ADD COLUMN "lineage_id" UUID NOT NULL DEFAULT gen_random_uuid(),
ADD COLUMN "version" INTEGER NOT NULL DEFAULT 1,
ADD CONSTRAINT "classes_owner_user_id_fkey"
  FOREIGN KEY ("owner_user_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE,
ADD CONSTRAINT "classes_built_in_has_no_owner_check"
  CHECK ("source" = 'user' OR "owner_user_id" IS NULL),
ADD CONSTRAINT "classes_credit_check"
  CHECK (CASE WHEN "source" IN ('zine', 'the_rack')
    THEN "credit_work" IS NOT NULL AND "credit_author" IS NOT NULL
    ELSE "credit_work" IS NULL AND "credit_author" IS NULL AND "credit_url" IS NULL
  END),
ADD CONSTRAINT "classes_languages_check"
  CHECK (cardinality("languages") > 0 AND "languages" <@ ARRAY['en', 'pl']::VARCHAR(2)[]),
ADD CONSTRAINT "classes_version_check" CHECK ("version" >= 1),
ADD CONSTRAINT "classes_takedown_check"
  CHECK ("taken_down_at" IS NOT NULL OR "takedown_reason" IS NULL);

CREATE UNIQUE INDEX "classes_lineage_id_version_key" ON "classes"("lineage_id", "version");
CREATE INDEX "classes_owner_user_id_idx" ON "classes"("owner_user_id");

-- Names are unique per owner, not globally. Versions of one lineage share a
-- name, so a plain unique index can't express this; the exclusion constraint
-- only rejects the same (owner, name) across different lineages. Built-in
-- Classes share one namespace; a Custom Class orphaned by its owner's deletion
-- gets its lineage as namespace, so the owner's ON DELETE SET NULL can't clash.
ALTER TABLE "classes" DROP CONSTRAINT "classes_name_key";
ALTER TABLE "classes" ADD CONSTRAINT "classes_name_per_owner"
  EXCLUDE USING gist (
    (CASE WHEN "source" = 'user' THEN coalesce("owner_user_id", "lineage_id"::text) ELSE '' END) WITH =,
    "name" WITH =,
    "lineage_id" WITH <>
  );
