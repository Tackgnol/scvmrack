-- Party Class Pools (RPG-265): the class lineages a party's join flows may
-- roll or forge from, plus whether Classless is allowed. Every existing party
-- gets the default pool: Book Classes on (Zine and Rack off), Classless on.

ALTER TABLE "parties" ADD COLUMN "classless_enabled" BOOLEAN NOT NULL DEFAULT true;

CREATE TABLE "party_class_pools" (
  "party_id" UUID NOT NULL REFERENCES "parties"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "lineage_id" UUID NOT NULL,
  PRIMARY KEY ("party_id", "lineage_id")
);

INSERT INTO "party_class_pools" ("party_id", "lineage_id")
SELECT DISTINCT p.id, c.lineage_id
FROM "parties" AS p
CROSS JOIN "classes" AS c
WHERE c.source = 'main_book';
