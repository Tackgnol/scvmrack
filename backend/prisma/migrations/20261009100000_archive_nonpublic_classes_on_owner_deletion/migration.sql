-- A deleted Custom Class owner becomes a former GM. Keep public lineages
-- available, but archive non-public lineages and take them out of all pools.
CREATE FUNCTION archive_nonpublic_classes_on_owner_deletion()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD."source" = 'user'
    AND OLD."owner_user_id" IS NOT NULL
    AND NEW."owner_user_id" IS NULL
    AND NOT EXISTS (
      SELECT 1
      FROM "classes"
      WHERE "lineage_id" = NEW."lineage_id"
        AND "visibility" = 'public'
    ) THEN
    UPDATE "classes"
    SET "status" = 'archived'
    WHERE "lineage_id" = NEW."lineage_id";

    DELETE FROM "party_class_pool"
    WHERE "lineage_id" = NEW."lineage_id";
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER archive_nonpublic_classes_on_owner_deletion
AFTER UPDATE OF "owner_user_id" ON "classes"
FOR EACH ROW
EXECUTE FUNCTION archive_nonpublic_classes_on_owner_deletion();
