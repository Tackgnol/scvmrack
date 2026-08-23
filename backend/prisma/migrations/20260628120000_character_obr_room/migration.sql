-- Legacy character-level Owlbear room stamp for the first OBR card gate.
-- Superseded by durable OBR room binding tables and dropped by
-- 20260701120000_drop_character_obr_room.
ALTER TABLE "characters" ADD COLUMN "obr_room_id" TEXT;
