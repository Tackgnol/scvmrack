ALTER TABLE obr_token_character_bindings ADD COLUMN generation uuid NOT NULL DEFAULT gen_random_uuid();

CREATE TABLE obr_removals (
  room_id varchar(256) NOT NULL,
  operation_id uuid NOT NULL,
  character_id uuid NOT NULL,
  actor_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (room_id, operation_id)
);

CREATE TABLE obr_scene_cleanup (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id varchar(256) NOT NULL,
  operation_id uuid NOT NULL,
  character_id uuid NOT NULL,
  token_id varchar(256) NOT NULL,
  generation uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX obr_scene_cleanup_room_id_idx ON obr_scene_cleanup(room_id);
