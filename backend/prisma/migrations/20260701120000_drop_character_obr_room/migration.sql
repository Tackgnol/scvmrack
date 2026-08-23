-- Durable OBR room binding rows now own room access. The character-level room
-- stamp was a transitional shortcut and would couple OBR back into characters.
ALTER TABLE "characters" DROP COLUMN IF EXISTS "obr_room_id";
