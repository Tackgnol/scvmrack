-- Character generation procedure
-- Source: production (matches migration 008 with COALESCE null-safety fixes)

CREATE OR REPLACE FUNCTION generate_character(p_class_id INTEGER DEFAULT NULL) RETURNS UUID
    LANGUAGE plpgsql AS $$
DECLARE
    char_id UUID;
    char_name VARCHAR(255);
    char_class_id INTEGER;
    class_row RECORD;

    -- Raw Stats
    str_raw INTEGER;
    agi_raw INTEGER;
    pre_raw INTEGER;
    tou_raw INTEGER;
    hp_val INTEGER;
    silver_val INTEGER := 0;
    omens_val INTEGER;

    -- Selection
    rolled_origin TEXT;

    -- Items and Abilities
    ability_keys JSONB := '[]'::JSONB;
    rolled_pool JSONB := '[]'::JSONB;
    final_equipment JSONB := '[]'::JSONB;
    equipped_weapons JSONB := '[]'::JSONB;
    equipped_armor JSONB := NULL;

    -- Helpers
    temp_item RECORD;
    dice_face INTEGER;
    i INTEGER;

    -- Personality Keys
    h_key TEXT;
    t_key TEXT;
    b_key TEXT;
    tr1_key TEXT;
    tr2_key TEXT;

    -- Ability selection
    random_ability_key TEXT;
BEGIN
    -- 1. Setup Class and Name
    SELECT n.name INTO char_name FROM names n ORDER BY random() LIMIT 1;

    IF p_class_id IS NOT NULL THEN
        char_class_id := p_class_id;
    ELSE
        SELECT id INTO char_class_id FROM classes ORDER BY random() LIMIT 1;
    END IF;

    SELECT * INTO class_row FROM classes WHERE id = char_class_id;

    -- 2. SILVER ROLLING
    FOR dice_face IN SELECT unnest(class_row.silver_dice) LOOP
        silver_val := silver_val + (floor(random() * dice_face) + 1);
    END LOOP;
    silver_val := silver_val * COALESCE(class_row.silver_modifier, 10);

    -- 3. ORIGIN SELECTION
    SELECT key INTO rolled_origin
    FROM origins
    WHERE class_id = char_class_id
    ORDER BY random()
    LIMIT 1;

    -- 4. STAT ROLLING
    str_raw := (SELECT SUM(floor(random()*6)+1) FROM generate_series(1,3)) + COALESCE((class_row.stat_modifiers->>'strength')::INTEGER, 0);
    agi_raw := (SELECT SUM(floor(random()*6)+1) FROM generate_series(1,3)) + COALESCE((class_row.stat_modifiers->>'agility')::INTEGER, 0);
    pre_raw := (SELECT SUM(floor(random()*6)+1) FROM generate_series(1,3)) + COALESCE((class_row.stat_modifiers->>'presence')::INTEGER, 0);
    tou_raw := (SELECT SUM(floor(random()*6)+1) FROM generate_series(1,3)) + COALESCE((class_row.stat_modifiers->>'toughness')::INTEGER, 0);

    -- 5. HP CALCULATION
    hp_val := GREATEST(1, (floor(random() * class_row.hp_die) + 1) + (
        CASE
            WHEN tou_raw <= 4 THEN -3
            WHEN tou_raw <= 6 THEN -2
            WHEN tou_raw <= 8 THEN -1
            WHEN tou_raw <= 12 THEN 0
            WHEN tou_raw <= 14 THEN 1
            WHEN tou_raw <= 16 THEN 2
            ELSE 3
        END
    ));

    -- 6. OMENS
    omens_val := floor(random() * 2) + 1;

    -- 7. EQUIPMENT POOL (with COALESCE to prevent NULL poisoning)
    rolled_pool := rolled_pool || COALESCE((
        SELECT jsonb_agg(item)
        FROM (
            SELECT jsonb_build_object('key', key, 'tags', tags) as item
            FROM equipment
            ORDER BY random()
            LIMIT 3
        ) t
    ), '[]'::jsonb);

    -- Class weapon rolls
    rolled_pool := rolled_pool || COALESCE((
        SELECT jsonb_build_object('key', key, 'tags', ARRAY['weapon'])
        FROM weapons
        WHERE roll = (floor(random()*class_row.weapon_die)+1)
        LIMIT 1
    ), '[]'::jsonb);

    -- Class armor rolls
    rolled_pool := rolled_pool || COALESCE((
        SELECT jsonb_build_object('key', key, 'tags', ARRAY['armor'])
        FROM armors
        WHERE roll = (floor(random()*class_row.armor_die)+1)
        LIMIT 1
    ), '[]'::jsonb);

    -- 8. AUTO-EQUIP LOGIC
    FOR temp_item IN SELECT * FROM jsonb_to_recordset(rolled_pool) AS x(key TEXT, tags TEXT[]) LOOP
        IF 'weapon' = ANY(temp_item.tags) AND jsonb_array_length(equipped_weapons) < 2 THEN
            equipped_weapons := equipped_weapons || jsonb_build_array(jsonb_build_object('key', temp_item.key));
        ELSIF 'armor' = ANY(temp_item.tags) AND equipped_armor IS NULL THEN
            equipped_armor := jsonb_build_object('key', temp_item.key);
        ELSE
            final_equipment := final_equipment || jsonb_build_array(jsonb_build_object('key', temp_item.key));
        END IF;
    END LOOP;

    -- 9. ABILITIES
    SELECT jsonb_agg(jsonb_build_object('key', a.key))
    INTO ability_keys
    FROM abilities a
    WHERE a.class_id = char_class_id AND a.is_random = false;

    IF ability_keys IS NULL THEN
        ability_keys := '[]'::JSONB;
    END IF;

    IF class_row.random_ability_count > 0 THEN
        FOR i IN 1..class_row.random_ability_count LOOP
            SELECT a.key INTO random_ability_key
            FROM abilities a
            WHERE a.class_id = char_class_id AND a.is_random = true
            ORDER BY random()
            LIMIT 1;

            IF random_ability_key IS NOT NULL THEN
                ability_keys := ability_keys || jsonb_build_array(jsonb_build_object('key', random_ability_key));
            END IF;
        END LOOP;
    END IF;

    -- 10. PERSONALITY KEYS
    SELECT key INTO h_key FROM habits ORDER BY random() LIMIT 1;
    SELECT key INTO t_key FROM tales ORDER BY random() LIMIT 1;
    SELECT key INTO b_key FROM body_descriptions ORDER BY random() LIMIT 1;
    SELECT key INTO tr1_key FROM traits ORDER BY random() LIMIT 1;
    SELECT key INTO tr2_key FROM traits WHERE key != tr1_key ORDER BY random() LIMIT 1;

    -- 11. FINAL INSERT
    INSERT INTO characters (
        name, class_id, origin, strength, agility, presence, toughness, max_hp, current_hp,
        omens, max_omens,
        habit, tale, body_description, trait1, trait2,
        abilities, equipment, equipped_weapons, equipped_armor, silver
    ) VALUES (
        char_name, char_class_id, rolled_origin, str_raw, agi_raw, pre_raw, tou_raw, hp_val, hp_val,
        omens_val, omens_val,
        h_key, t_key, b_key, tr1_key, tr2_key,
        ability_keys, final_equipment, equipped_weapons, equipped_armor, silver_val
    ) RETURNING id INTO char_id;

    RETURN char_id;
END;
$$;
