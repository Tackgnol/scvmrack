-- Abilities carry dN reference tables (RPG-262). Each row's roll is its die
-- result; a row may link a catalog item. The Occult Herbmaster's Portable
-- Laboratory gets its d8 decoctions table.
-- Fresh databases are migrated before seeding, so
-- init/05-seed/018_ability_reference_tables.sql repeats the data part.

ALTER TABLE "abilities"
ADD COLUMN "table_die" INTEGER,
ADD CONSTRAINT "abilities_table_die_check" CHECK ("table_die" IN (2, 3, 4, 6, 8, 10, 12));

CREATE TABLE "ability_table_rows" (
  "id" SERIAL PRIMARY KEY,
  "ability_id" INTEGER NOT NULL REFERENCES "abilities"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "roll" INTEGER NOT NULL CHECK ("roll" >= 1),
  "text_key" VARCHAR(255) NOT NULL,
  "item_key" VARCHAR(255)
);
CREATE UNIQUE INDEX "ability_table_rows_ability_id_roll_key" ON "ability_table_rows"("ability_id", "roll");

UPDATE public.abilities SET table_die = 8
WHERE key = 'abilities.occult_herbmaster.decoctions';

INSERT INTO public.ability_table_rows (ability_id, roll, text_key, item_key)
SELECT a.id, r.roll, r.text_key, r.item_key
FROM public.abilities AS a
CROSS JOIN (VALUES
  (1, 'abilities.occult_herbmaster.red_poison', 'equipment.red-poison'),
  (2, 'abilities.occult_herbmaster.ezumiel', 'equipment.ezumiel-vapor'),
  (3, 'abilities.occult_herbmaster.frog', 'equipment.southern-frog'),
  (4, 'abilities.occult_herbmaster.vitalis', 'equipment.elixir-vitalis'),
  (5, 'abilities.occult_herbmaster.soup', 'equipment.spider-owl-soup'),
  (6, 'abilities.occult_herbmaster.philtre', 'equipment.fernors-philtre'),
  (7, 'abilities.occult_herbmaster.hyphos', 'equipment.hyphos-snuff'),
  (8, 'abilities.occult_herbmaster.black_poison', 'equipment.black-poison')
) AS r(roll, text_key, item_key)
WHERE a.key = 'abilities.occult_herbmaster.decoctions'
ON CONFLICT (ability_id, roll) DO NOTHING;

-- The eight decoction "abilities" were never rolled (random_ability_count 0);
-- they only carried the table text, which the rows now reference.
DELETE FROM public.abilities
WHERE key IN (
  'abilities.occult_herbmaster.red_poison',
  'abilities.occult_herbmaster.ezumiel',
  'abilities.occult_herbmaster.frog',
  'abilities.occult_herbmaster.vitalis',
  'abilities.occult_herbmaster.soup',
  'abilities.occult_herbmaster.philtre',
  'abilities.occult_herbmaster.hyphos',
  'abilities.occult_herbmaster.black_poison'
);
