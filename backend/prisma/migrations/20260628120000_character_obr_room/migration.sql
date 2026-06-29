-- Records which Owlbear room a character is bound to (stamped at token-bind
-- time). Gates GET /api/characters/cards: a card is only returned when the
-- caller presents the matching (obr_room_id, id) pair, so a leaked character
-- UUID alone no longer reads the card.
ALTER TABLE "characters" ADD COLUMN "obr_room_id" TEXT;
