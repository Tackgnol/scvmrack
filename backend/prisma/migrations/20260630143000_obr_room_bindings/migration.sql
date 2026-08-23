CREATE TABLE "obr_room_bindings" (
    "obr_room_id" VARCHAR(256) NOT NULL,
    "party_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "obr_room_bindings_pkey" PRIMARY KEY ("obr_room_id")
);

CREATE TABLE "obr_player_character_bindings" (
    "obr_room_id" VARCHAR(256) NOT NULL,
    "obr_player_id" VARCHAR(256) NOT NULL,
    "obr_connection_id" VARCHAR(256),
    "character_id" UUID NOT NULL,
    "assigned_by_player_id" VARCHAR(256) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "obr_player_character_bindings_pkey" PRIMARY KEY ("obr_room_id", "obr_player_id")
);

CREATE TABLE "obr_token_character_bindings" (
    "obr_room_id" VARCHAR(256) NOT NULL,
    "obr_token_id" VARCHAR(256) NOT NULL,
    "character_id" UUID NOT NULL,
    "assigned_player_id" VARCHAR(256),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "obr_token_character_bindings_pkey" PRIMARY KEY ("obr_room_id", "obr_token_id")
);

CREATE INDEX "obr_room_bindings_party_id_idx" ON "obr_room_bindings"("party_id");
CREATE INDEX "obr_player_character_bindings_character_id_idx" ON "obr_player_character_bindings"("character_id");
CREATE INDEX "obr_token_character_bindings_obr_room_id_character_id_idx" ON "obr_token_character_bindings"("obr_room_id", "character_id");

ALTER TABLE "obr_room_bindings"
    ADD CONSTRAINT "obr_room_bindings_party_id_fkey"
    FOREIGN KEY ("party_id") REFERENCES "parties"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "obr_player_character_bindings"
    ADD CONSTRAINT "obr_player_character_bindings_obr_room_id_fkey"
    FOREIGN KEY ("obr_room_id") REFERENCES "obr_room_bindings"("obr_room_id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "obr_player_character_bindings"
    ADD CONSTRAINT "obr_player_character_bindings_character_id_fkey"
    FOREIGN KEY ("character_id") REFERENCES "characters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "obr_token_character_bindings"
    ADD CONSTRAINT "obr_token_character_bindings_obr_room_id_fkey"
    FOREIGN KEY ("obr_room_id") REFERENCES "obr_room_bindings"("obr_room_id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "obr_token_character_bindings"
    ADD CONSTRAINT "obr_token_character_bindings_character_id_fkey"
    FOREIGN KEY ("character_id") REFERENCES "characters"("id") ON DELETE CASCADE ON UPDATE CASCADE;
