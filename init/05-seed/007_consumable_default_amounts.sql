-- Migration: populate default_amount for consumables so manually added items
-- hydrate a pip array (uses) on the client. Items flagged presence-scaled
-- (lantern-oil, medicine-chest) also add the character's presence modifier at
-- add-to-inventory time.
--
-- Safe to run multiple times.

BEGIN;

UPDATE public.equipment
SET default_amount = 5
WHERE key = 'equipment.lard';

UPDATE public.equipment
SET default_amount = 4
WHERE key = 'equipment.waterskin';

UPDATE public.equipment
SET default_amount = 10,
    tags = ARRAY['tool', 'metal', 'consumable']
WHERE key = 'equipment.iron-nails';

UPDATE public.equipment
SET default_amount = 6
WHERE key = 'equipment.lantern-oil';

UPDATE public.equipment
SET default_amount = 3
WHERE key = 'equipment.red-poison';

UPDATE public.equipment
SET default_amount = 3
WHERE key = 'equipment.black-poison';

UPDATE public.equipment
SET default_amount = 4
WHERE key = 'equipment.medicine-chest';

COMMIT;
