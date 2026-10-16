-- Book Class reference tables: the Occult Herbmaster's d8 decoctions. Mirrors
-- prisma/migrations/20261002140000_ability_reference_tables.

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
