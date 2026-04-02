-- Character generation procedure
-- Source: production (matches migration 008 with COALESCE null-safety fixes)

CREATE OR REPLACE FUNCTION pick_random_name() RETURNS TEXT
    LANGUAGE sql AS $$
    SELECT n.name
    FROM names n
    ORDER BY random()
    LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION resolve_character_class_id(p_class_id INTEGER DEFAULT NULL) RETURNS INTEGER
    LANGUAGE sql AS $$
    SELECT COALESCE(
        p_class_id,
        (SELECT id FROM classes ORDER BY random() LIMIT 1)
    );
$$;

CREATE OR REPLACE FUNCTION roll_class_silver(p_class_id INTEGER) RETURNS INTEGER
    LANGUAGE plpgsql AS $$
DECLARE
    v_silver_dice INTEGER[];
    v_silver_modifier INTEGER;
    v_total INTEGER := 0;
    v_face INTEGER;
BEGIN
    SELECT c.silver_dice, COALESCE(c.silver_modifier, 10)
    INTO v_silver_dice, v_silver_modifier
    FROM classes c
    WHERE c.id = p_class_id;

    FOR v_face IN SELECT unnest(v_silver_dice) LOOP
        v_total := v_total + (floor(random() * v_face) + 1);
    END LOOP;

    RETURN v_total * v_silver_modifier;
END;
$$;

CREATE OR REPLACE FUNCTION pick_class_origin(p_class_id INTEGER) RETURNS TEXT
    LANGUAGE sql AS $$
    SELECT o.key
    FROM origins o
    WHERE o.class_id = p_class_id
    ORDER BY random()
    LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION roll_character_stats(p_class_id INTEGER) RETURNS JSONB
    LANGUAGE plpgsql AS $$
DECLARE
    v_stat_modifiers JSONB;
    v_hp_die INTEGER;
    v_strength INTEGER;
    v_agility INTEGER;
    v_presence INTEGER;
    v_toughness INTEGER;
    v_max_hp INTEGER;
BEGIN
    SELECT c.stat_modifiers, c.hp_die
    INTO v_stat_modifiers, v_hp_die
    FROM classes c
    WHERE c.id = p_class_id;

    v_strength := (SELECT SUM(floor(random()*6)+1) FROM generate_series(1,3))
        + COALESCE((v_stat_modifiers->>'strength')::INTEGER, 0);
    v_agility := (SELECT SUM(floor(random()*6)+1) FROM generate_series(1,3))
        + COALESCE((v_stat_modifiers->>'agility')::INTEGER, 0);
    v_presence := (SELECT SUM(floor(random()*6)+1) FROM generate_series(1,3))
        + COALESCE((v_stat_modifiers->>'presence')::INTEGER, 0);
    v_toughness := (SELECT SUM(floor(random()*6)+1) FROM generate_series(1,3))
        + COALESCE((v_stat_modifiers->>'toughness')::INTEGER, 0);

    v_max_hp := GREATEST(
        1,
        (floor(random() * v_hp_die) + 1)
        + CASE
            WHEN v_toughness <= 4 THEN -3
            WHEN v_toughness <= 6 THEN -2
            WHEN v_toughness <= 8 THEN -1
            WHEN v_toughness <= 12 THEN 0
            WHEN v_toughness <= 14 THEN 1
            WHEN v_toughness <= 16 THEN 2
            ELSE 3
        END
    );

    RETURN jsonb_build_object(
        'strength', v_strength,
        'agility', v_agility,
        'presence', v_presence,
        'toughness', v_toughness,
        'max_hp', v_max_hp
    );
END;
$$;

CREATE OR REPLACE FUNCTION roll_character_omens() RETURNS INTEGER
    LANGUAGE sql AS $$
    SELECT floor(random() * 2 + 1)::INTEGER;
$$;

CREATE OR REPLACE FUNCTION build_character_item_pool(p_class_id INTEGER) RETURNS JSONB
    LANGUAGE plpgsql AS $$
DECLARE
    v_pool JSONB := '[]'::jsonb;
    v_weapon_die INTEGER;
    v_armor_die INTEGER;
BEGIN
    SELECT c.weapon_die, c.armor_die
    INTO v_weapon_die, v_armor_die
    FROM classes c
    WHERE c.id = p_class_id;

    v_pool := v_pool || COALESCE((
        SELECT jsonb_agg(item)
        FROM (
            SELECT jsonb_build_object('key', e.key, 'tags', e.tags) AS item
            FROM equipment e
            ORDER BY random()
            LIMIT 3
        ) t
    ), '[]'::jsonb);

    v_pool := v_pool || COALESCE((
        SELECT jsonb_build_object('key', w.key, 'tags', ARRAY['weapon'])
        FROM weapons w
        WHERE w.roll = (floor(random() * v_weapon_die) + 1)
        LIMIT 1
    ), '[]'::jsonb);

    v_pool := v_pool || COALESCE((
        SELECT jsonb_build_object('key', a.key, 'tags', ARRAY['armor'])
        FROM armors a
        WHERE a.roll = (floor(random() * v_armor_die) + 1)
        LIMIT 1
    ), '[]'::jsonb);

    RETURN v_pool;
END;
$$;

CREATE OR REPLACE FUNCTION auto_equip_character_items(p_rolled_pool JSONB) RETURNS JSONB
    LANGUAGE plpgsql AS $$
DECLARE
    v_final_equipment JSONB := '[]'::jsonb;
    v_equipped_weapons JSONB := '[]'::jsonb;
    v_equipped_armor JSONB := NULL;
    v_item RECORD;
    v_weapon_record RECORD;
    v_ammo_key TEXT;
BEGIN
    FOR v_item IN
        SELECT *
        FROM jsonb_to_recordset(COALESCE(p_rolled_pool, '[]'::jsonb)) AS x(key TEXT, tags TEXT[])
    LOOP
        IF 'weapon' = ANY(v_item.tags) AND jsonb_array_length(v_equipped_weapons) < 2 THEN
            -- Get weapon to check for ammo
            SELECT w.key, w.ammo_type, w.default_amount
            INTO v_weapon_record
            FROM weapons w
            WHERE w.key = v_item.key;

            v_equipped_weapons := v_equipped_weapons || jsonb_build_array(jsonb_build_object('key', v_item.key));

            -- Reset ammo key for each weapon
            v_ammo_key := NULL;

            -- Auto-add ammo if weapon has an ammo type
            IF v_weapon_record.ammo_type IS NOT NULL AND v_weapon_record.default_amount > 0 THEN
                -- Map ammo type string to equipment key
                IF v_weapon_record.ammo_type = 'Arrow' THEN
                    v_ammo_key := 'equipment.arrows';
                ELSIF v_weapon_record.ammo_type = 'Bolt' THEN
                    v_ammo_key := 'equipment.bolts';
                END IF;

                IF v_ammo_key IS NOT NULL THEN
                    v_final_equipment := v_final_equipment || jsonb_build_array(
                        jsonb_build_object('key', v_ammo_key, 'amount', v_weapon_record.default_amount)
                    );
                END IF;
            END IF;

        ELSIF 'armor' = ANY(v_item.tags) AND v_equipped_armor IS NULL THEN
            v_equipped_armor := jsonb_build_object('key', v_item.key);
        ELSE
            v_final_equipment := v_final_equipment || jsonb_build_array(jsonb_build_object('key', v_item.key));
        END IF;
    END LOOP;

    RETURN jsonb_build_object(
        'equipment', v_final_equipment,
        'equipped_weapons', v_equipped_weapons,
        'equipped_armor', v_equipped_armor
    );
END;
$$;

CREATE OR REPLACE FUNCTION build_character_abilities(p_class_id INTEGER) RETURNS JSONB
    LANGUAGE plpgsql AS $$
DECLARE
    v_abilities JSONB := '[]'::jsonb;
    v_random_ability_count INTEGER := 0;
BEGIN
    SELECT COALESCE(c.random_ability_count, 0)
    INTO v_random_ability_count
    FROM classes c
    WHERE c.id = p_class_id;

    SELECT jsonb_agg(jsonb_build_object('key', a.key))
    INTO v_abilities
    FROM abilities a
    WHERE a.class_id = p_class_id
      AND a.is_random = false;

    IF v_abilities IS NULL THEN
        v_abilities := '[]'::jsonb;
    END IF;

    IF v_random_ability_count > 0 THEN
        v_abilities := v_abilities || COALESCE((
            SELECT jsonb_agg(jsonb_build_object('key', a.key))
            FROM (
                SELECT key
                FROM abilities
                WHERE class_id = p_class_id
                  AND is_random = true
                ORDER BY random()
                LIMIT v_random_ability_count
            ) a
        ), '[]'::jsonb);
    END IF;

    RETURN v_abilities;
END;
$$;

CREATE OR REPLACE FUNCTION pick_character_personality() RETURNS JSONB
    LANGUAGE plpgsql AS $$
DECLARE
    v_habit TEXT;
    v_tale TEXT;
    v_body TEXT;
    v_trait1 TEXT;
    v_trait2 TEXT;
BEGIN
    SELECT key INTO v_habit FROM habits ORDER BY random() LIMIT 1;
    SELECT key INTO v_tale FROM tales ORDER BY random() LIMIT 1;
    SELECT key INTO v_body FROM body_descriptions ORDER BY random() LIMIT 1;
    SELECT key INTO v_trait1 FROM traits ORDER BY random() LIMIT 1;
    SELECT key INTO v_trait2 FROM traits WHERE key != v_trait1 ORDER BY random() LIMIT 1;

    RETURN jsonb_build_object(
        'habit', v_habit,
        'tale', v_tale,
        'body_description', v_body,
        'trait1', v_trait1,
        'trait2', v_trait2
    );
END;
$$;

CREATE OR REPLACE FUNCTION generate_character(p_class_id INTEGER DEFAULT NULL) RETURNS UUID
    LANGUAGE plpgsql AS $$
DECLARE
    char_id UUID;
    char_name VARCHAR(255);
    char_class_id INTEGER;
    rolled_origin TEXT;

    stats JSONB;
    item_pool JSONB;
    equipment_bundle JSONB;
    ability_keys JSONB;
    personality JSONB;

    silver_val INTEGER;
    omens_val INTEGER;
BEGIN
    char_name := pick_random_name();
    char_class_id := resolve_character_class_id(p_class_id);

    silver_val := roll_class_silver(char_class_id);
    rolled_origin := pick_class_origin(char_class_id);

    stats := roll_character_stats(char_class_id);
    omens_val := roll_character_omens();

    item_pool := build_character_item_pool(char_class_id);
    equipment_bundle := auto_equip_character_items(item_pool);

    ability_keys := build_character_abilities(char_class_id);
    personality := pick_character_personality();

    INSERT INTO characters (
        name, class_id, origin, strength, agility, presence, toughness, max_hp, current_hp,
        omens, max_omens,
        habit, tale, body_description, trait1, trait2,
        abilities, equipment, equipped_weapons, equipped_armor, silver
    ) VALUES (
        char_name,
        char_class_id,
        rolled_origin,
        (stats->>'strength')::INTEGER,
        (stats->>'agility')::INTEGER,
        (stats->>'presence')::INTEGER,
        (stats->>'toughness')::INTEGER,
        (stats->>'max_hp')::INTEGER,
        (stats->>'max_hp')::INTEGER,
        omens_val,
        omens_val,
        personality->>'habit',
        personality->>'tale',
        personality->>'body_description',
        personality->>'trait1',
        personality->>'trait2',
        COALESCE(ability_keys, '[]'::jsonb),
        COALESCE(equipment_bundle->'equipment', '[]'::jsonb),
        COALESCE(equipment_bundle->'equipped_weapons', '[]'::jsonb),
        equipment_bundle->'equipped_armor',
        silver_val
    ) RETURNING id INTO char_id;

    RETURN char_id;
END;
$$;
