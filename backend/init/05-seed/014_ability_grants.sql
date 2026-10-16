-- Book Class ability grants: the item and pet each ability gives at roll time.
-- Mirrors prisma/migrations/20261001130000_ability_grants, which grants the
-- same on already-seeded databases.

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
