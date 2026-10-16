-- Abilities state their grants directly (RPG-258). Code no longer reads the
-- positional classes.random_abilities JSON; the column stays because the seed's
-- positional INSERTs into classes would misalign without it.
-- Fresh databases are migrated before seeding, so the same grants are also in
-- init/05-seed/014_ability_grants.sql.

ALTER TABLE "abilities"
ADD COLUMN "grant_item_key" VARCHAR(255),
ADD COLUMN "grant_pet_key" VARCHAR(255);

UPDATE public.abilities AS a
SET grant_item_key = g.item, grant_pet_key = g.pet
FROM (VALUES
  ('abilities.esoteric_hermit.hawk', NULL, 'pets.hawk'),
  ('abilities.fanged_deserter.hound', NULL, 'pets.gore-hound'),
  ('abilities.fanged_deserter.mask', 'equipment.crumpled-monster-mask', NULL),
  ('abilities.fanged_deserter.scimitar', 'weapons.brown-scimitar', NULL),
  ('abilities.fanged_deserter.shoe', 'weapons.shoe-of-death', NULL),
  ('abilities.fanged_deserter.sling', 'weapons.sigurd-sling', NULL),
  ('abilities.fanged_deserter.teeth', 'equipment.wizard-teeth', NULL),
  ('abilities.gutterborn_scum.fingersmith', 'equipment.lockpicks', NULL),
  ('abilities.heretical_priest.crook', 'weapons.sacred-shepherds-crook', NULL),
  ('abilities.wretched_royalty.barbarister', NULL, 'pets.barbarister'),
  ('abilities.wretched_royalty.blade', 'weapons.blade-of-ancestors', NULL),
  ('abilities.wretched_royalty.gift', 'weapons.snake-skin-gift', NULL),
  ('abilities.wretched_royalty.hamfund', NULL, 'pets.hamfund')
) AS g(ability_key, item, pet)
WHERE a.key = g.ability_key;
