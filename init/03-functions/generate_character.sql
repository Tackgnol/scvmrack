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

CREATE OR REPLACE FUNCTION build_boolean_uses(p_count INTEGER) RETURNS JSONB
    LANGUAGE sql AS $$
    SELECT CASE
        WHEN COALESCE(p_count, 0) <= 0 THEN '[]'::jsonb
        ELSE to_jsonb(array_fill(false, ARRAY[p_count]))
    END;
$$;

CREATE OR REPLACE FUNCTION build_pool_item(
    p_key TEXT,
    p_extra JSONB DEFAULT '{}'::jsonb
) RETURNS JSONB
    LANGUAGE sql AS $$
    SELECT jsonb_build_object(
        'key', p_key,
        'tags', to_jsonb(COALESCE(e.tags, w.tags, a.tags, p.tags, ARRAY[]::TEXT[]))
    ) || COALESCE(p_extra, '{}'::jsonb)
    FROM (SELECT 1) seed
    LEFT JOIN equipment e ON e.key = p_key
    LEFT JOIN weapons w ON w.key = p_key
    LEFT JOIN armors a ON a.key = p_key
    LEFT JOIN pets p ON p.key = p_key;
$$;

CREATE OR REPLACE FUNCTION build_granted_class_item(p_name TEXT) RETURNS JSONB
    LANGUAGE plpgsql AS $$
BEGIN
    RETURN CASE p_name
        WHEN 'Crumpled Monster Mask' THEN build_pool_item('equipment.crumpled-monster-mask')
        WHEN 'Wizard Teeth' THEN build_pool_item(
            'equipment.wizard-teeth',
            jsonb_build_object('uses', build_boolean_uses(4))
        )
        WHEN 'Lockpicks' THEN build_pool_item('equipment.lockpicks')
        WHEN 'The Brown Scimitar of Galgenbeck' THEN build_pool_item('weapons.brown-scimitar')
        WHEN 'Old Sigürd''s Sling' THEN build_pool_item('weapons.sigurd-sling')
        WHEN 'The Shoe of Death''s Horse' THEN build_pool_item('weapons.shoe-of-death')
        WHEN 'The Blade of your Ancestors' THEN build_pool_item('weapons.blade-of-ancestors')
        WHEN 'The Snake-Skin Gift' THEN build_pool_item('weapons.snake-skin-gift')
        WHEN 'Sacred Shepherd’s Crook' THEN build_pool_item('weapons.sacred-shepherds-crook')
        ELSE NULL
    END;
END;
$$;

CREATE OR REPLACE FUNCTION build_granted_class_pet(p_name TEXT) RETURNS JSONB
    LANGUAGE plpgsql AS $$
BEGIN
    RETURN CASE p_name
        WHEN 'Hawk' THEN build_pool_item('pets.hawk')
        WHEN 'Ancient Gore-Hound' THEN build_pool_item('pets.gore-hound')
        WHEN 'Hamfund the Squire' THEN build_pool_item('pets.hamfund')
        WHEN 'Barbarister the Incredible Horse' THEN build_pool_item('pets.barbarister')
        ELSE NULL
    END;
END;
$$;

CREATE OR REPLACE FUNCTION pick_random_scroll_item(p_kind TEXT) RETURNS JSONB
    LANGUAGE sql AS $$
    SELECT build_pool_item(e.key)
    FROM equipment e
    WHERE p_kind = ANY(e.tags)
    ORDER BY random()
    LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION roll_starting_carry_item() RETURNS JSONB
    LANGUAGE plpgsql AS $$
DECLARE
    v_roll INTEGER;
BEGIN
    v_roll := roll_die(6);

    RETURN CASE v_roll
        WHEN 3 THEN jsonb_build_array(build_pool_item('equipment.backpack'))
        WHEN 4 THEN jsonb_build_array(build_pool_item('equipment.sack'))
        WHEN 5 THEN jsonb_build_array(build_pool_item('equipment.small-wagon'))
        WHEN 6 THEN jsonb_build_array(build_pool_item('equipment.donkey'))
        ELSE '[]'::jsonb
    END;
END;
$$;

CREATE OR REPLACE FUNCTION roll_starting_item_table_one(p_presence INTEGER) RETURNS JSONB
    LANGUAGE plpgsql AS $$
DECLARE
    v_roll INTEGER;
BEGIN
    v_roll := roll_die(12);

    RETURN CASE v_roll
        WHEN 1 THEN jsonb_build_array(build_pool_item('equipment.rope'))
        WHEN 2 THEN COALESCE((
            SELECT jsonb_agg(build_pool_item('equipment.torches'))
            FROM generate_series(1, GREATEST(0, roll_to_modifier(p_presence) + 4))
        ), '[]'::jsonb)
        WHEN 3 THEN jsonb_build_array(build_pool_item(
            'equipment.lantern',
            jsonb_build_object('uses', build_boolean_uses(GREATEST(0, roll_to_modifier(p_presence) + 6)))
        ))
        WHEN 4 THEN jsonb_build_array(build_pool_item('equipment.magnesium-strip'))
        WHEN 5 THEN jsonb_build_array(pick_random_scroll_item('unclean'))
        WHEN 6 THEN jsonb_build_array(build_pool_item('equipment.sharp-needle'))
        WHEN 7 THEN jsonb_build_array(build_pool_item(
            'equipment.medicine-chest',
            jsonb_build_object('uses', build_boolean_uses(GREATEST(0, roll_to_modifier(p_presence) + 4)))
        ))
        WHEN 8 THEN jsonb_build_array(build_pool_item('equipment.lockpicks'))
        WHEN 9 THEN jsonb_build_array(build_pool_item('equipment.bear-trap'))
        WHEN 10 THEN jsonb_build_array(build_pool_item('equipment.bomb'))
        WHEN 11 THEN jsonb_build_array(build_pool_item(
            'equipment.red-poison',
            jsonb_build_object('uses', build_boolean_uses(roll_die(4)))
        ))
        WHEN 12 THEN jsonb_build_array(build_pool_item('equipment.silver-crucifix'))
        ELSE '[]'::jsonb
    END;
END;
$$;

CREATE OR REPLACE FUNCTION roll_starting_item_table_two() RETURNS JSONB
    LANGUAGE plpgsql AS $$
DECLARE
    v_roll INTEGER;
BEGIN
    v_roll := roll_die(12);

    RETURN CASE v_roll
        WHEN 1 THEN jsonb_build_array(build_pool_item(
            'equipment.life-elixir',
            jsonb_build_object('uses', build_boolean_uses(roll_die(4)))
        ))
        WHEN 2 THEN jsonb_build_array(pick_random_scroll_item('sacred'))
        WHEN 3 THEN jsonb_build_array(build_pool_item('pets.small-dog'))
        WHEN 4 THEN COALESCE((
            SELECT jsonb_agg(build_pool_item('pets.monkey'))
            FROM generate_series(1, roll_die(4))
        ), '[]'::jsonb)
        WHEN 5 THEN jsonb_build_array(build_pool_item('equipment.exquisite-perfume'))
        WHEN 6 THEN jsonb_build_array(build_pool_item('equipment.toolbox'))
        WHEN 7 THEN jsonb_build_array(build_pool_item('equipment.heavy-chain'))
        WHEN 8 THEN jsonb_build_array(build_pool_item('equipment.grappling-hook'))
        WHEN 9 THEN jsonb_build_array(build_pool_item('weapons.shield'))
        WHEN 10 THEN jsonb_build_array(build_pool_item('weapons.crowbar'))
        WHEN 11 THEN jsonb_build_array(build_pool_item(
            'equipment.lard',
            jsonb_build_object('uses', build_boolean_uses(5))
        ))
        WHEN 12 THEN jsonb_build_array(build_pool_item('equipment.tent'))
        ELSE '[]'::jsonb
    END;
END;
$$;

CREATE OR REPLACE FUNCTION roll_starting_weapon_item(
    p_weapon_die INTEGER,
    p_presence INTEGER
) RETURNS JSONB
    LANGUAGE plpgsql AS $$
DECLARE
    v_roll INTEGER;
    v_weapon_key TEXT;
    v_ammo_amount INTEGER;
BEGIN
    v_roll := roll_die(p_weapon_die);

    SELECT w.key,
           CASE
               WHEN w.ammo_type IN ('Arrow', 'Bolt') THEN GREATEST(0, roll_to_modifier(p_presence) + COALESCE(w.default_amount, 0))
               WHEN w.default_amount IS NOT NULL THEN GREATEST(0, w.default_amount)
               ELSE NULL
           END
    INTO v_weapon_key, v_ammo_amount
    FROM weapons w
    WHERE w.roll = v_roll
    LIMIT 1;

    IF v_weapon_key IS NULL THEN
        RETURN '[]'::jsonb;
    END IF;

    RETURN jsonb_build_array(build_pool_item(
        v_weapon_key,
        jsonb_strip_nulls(jsonb_build_object(
            'auto_equip', true,
            'starting_ammo_amount', v_ammo_amount
        ))
    ));
END;
$$;

CREATE OR REPLACE FUNCTION roll_starting_armor_item(p_armor_die INTEGER) RETURNS JSONB
    LANGUAGE plpgsql AS $$
DECLARE
    v_roll INTEGER;
    v_armor_key TEXT;
BEGIN
    v_roll := roll_die(p_armor_die);

    IF v_roll = 1 THEN
        RETURN '[]'::jsonb;
    END IF;

    SELECT a.key
    INTO v_armor_key
    FROM armors a
    WHERE a.max_tier = CASE
        WHEN v_roll = 2 THEN 1
        WHEN v_roll = 3 THEN 2
        ELSE 3
    END
    ORDER BY random()
    LIMIT 1;

    IF v_armor_key IS NULL THEN
        RETURN '[]'::jsonb;
    END IF;

    RETURN jsonb_build_array(build_pool_item(
        v_armor_key,
        jsonb_build_object('auto_equip', true)
    ));
END;
$$;

CREATE OR REPLACE FUNCTION build_character_item_pool(
    p_class_id INTEGER,
    p_presence INTEGER
) RETURNS JSONB
    LANGUAGE plpgsql AS $$
DECLARE
    v_pool JSONB := '[]'::jsonb;
    v_weapon_die INTEGER;
    v_armor_die INTEGER;
    v_has_scroll BOOLEAN := false;
BEGIN
    SELECT c.weapon_die, c.armor_die
    INTO v_weapon_die, v_armor_die
    FROM classes c
    WHERE c.id = p_class_id;

    v_pool := v_pool
        || roll_starting_carry_item()
        || roll_starting_item_table_one(p_presence)
        || roll_starting_item_table_two();

    SELECT EXISTS (
        SELECT 1
        FROM jsonb_array_elements(v_pool) item
        WHERE item->>'key' LIKE 'scroll.%'
    ) INTO v_has_scroll;

    IF v_has_scroll THEN
        v_weapon_die := LEAST(v_weapon_die, 6);
        v_armor_die := LEAST(v_armor_die, 2);
    END IF;

    v_pool := v_pool
        || roll_starting_weapon_item(v_weapon_die, p_presence)
        || roll_starting_armor_item(v_armor_die);

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
    v_ammo_amount INTEGER;
BEGIN
    FOR v_item IN
        SELECT value AS item
        FROM jsonb_array_elements(COALESCE(p_rolled_pool, '[]'::jsonb))
    LOOP
        IF COALESCE((v_item.item->>'auto_equip')::BOOLEAN, false)
           AND COALESCE(v_item.item->'tags', '[]'::jsonb) ? 'weapon'
           AND jsonb_array_length(v_equipped_weapons) < 2 THEN
            -- Get weapon to check for ammo
            SELECT w.key, w.ammo_type, w.default_amount
            INTO v_weapon_record
            FROM weapons w
            WHERE w.key = v_item.item->>'key';

            v_equipped_weapons := v_equipped_weapons || jsonb_build_array(
                jsonb_build_object('key', v_item.item->>'key')
            );

            -- Reset ammo key for each weapon
            v_ammo_key := NULL;
            v_ammo_amount := COALESCE(
                NULLIF(v_item.item->>'starting_ammo_amount', '')::INTEGER,
                v_weapon_record.default_amount,
                0
            );

            -- Auto-add ammo if weapon has an ammo type
            IF v_weapon_record.ammo_type IS NOT NULL AND v_ammo_amount > 0 THEN
                -- Map ammo type string to equipment key
                IF v_weapon_record.ammo_type = 'Arrow' THEN
                    v_ammo_key := 'equipment.arrows';
                ELSIF v_weapon_record.ammo_type = 'Bolt' THEN
                    v_ammo_key := 'equipment.bolts';
                END IF;

                IF v_ammo_key IS NOT NULL THEN
                    v_final_equipment := v_final_equipment || COALESCE((
                        SELECT jsonb_agg(build_pool_item(v_ammo_key))
                        FROM generate_series(1, v_ammo_amount)
                    ), '[]'::jsonb);
                END IF;
            END IF;

        ELSIF COALESCE((v_item.item->>'auto_equip')::BOOLEAN, false)
              AND COALESCE(v_item.item->'tags', '[]'::jsonb) ? 'armor'
              AND v_equipped_armor IS NULL THEN
            v_equipped_armor := jsonb_build_object('key', v_item.item->>'key');
        ELSE
            v_final_equipment := v_final_equipment || jsonb_build_array(
                v_item.item - 'auto_equip' - 'starting_ammo_amount'
            );
        END IF;
    END LOOP;

    RETURN jsonb_build_object(
        'equipment', v_final_equipment,
        'equipped_weapons', v_equipped_weapons,
        'equipped_armor', v_equipped_armor
    );
END;
$$;

CREATE OR REPLACE FUNCTION build_character_ability_bundle(p_class_id INTEGER) RETURNS JSONB
    LANGUAGE plpgsql AS $$
DECLARE
    v_fixed_abilities JSONB := '[]'::jsonb;
    v_random_abilities JSONB := '[]'::jsonb;
    v_granted_items JSONB := '[]'::jsonb;
    v_class_random_abilities JSONB := '[]'::jsonb;
    v_random_ability_count INTEGER := 0;
BEGIN
    SELECT COALESCE(c.random_ability_count, 0),
           COALESCE(c.random_abilities, '[]'::jsonb)
    INTO v_random_ability_count, v_class_random_abilities
    FROM classes c
    WHERE c.id = p_class_id;

    SELECT jsonb_agg(jsonb_build_object('key', a.key))
    INTO v_fixed_abilities
    FROM abilities a
    WHERE a.class_id = p_class_id
      AND a.is_random = false;

    IF v_fixed_abilities IS NULL THEN
        v_fixed_abilities := '[]'::jsonb;
    END IF;

    IF v_random_ability_count > 0 THEN
        WITH rolled_random AS (
            SELECT key, roll_value
            FROM abilities
            WHERE class_id = p_class_id
              AND is_random = true
            ORDER BY random()
            LIMIT v_random_ability_count
        )
        SELECT
            COALESCE(jsonb_agg(jsonb_build_object('key', key)), '[]'::jsonb),
            COALESCE(jsonb_agg(granted_item) FILTER (WHERE granted_item IS NOT NULL), '[]'::jsonb)
        INTO v_random_abilities, v_granted_items
        FROM (
            SELECT
                rr.key,
                COALESCE(
                    build_granted_class_item(
                        v_class_random_abilities -> (rr.roll_value - 1) ->> 'gainItem'
                    ),
                    build_granted_class_pet(
                        v_class_random_abilities -> (rr.roll_value - 1) ->> 'gainPet'
                    )
                ) AS granted_item
            FROM rolled_random rr
        ) resolved_random;
    END IF;

    RETURN jsonb_build_object(
        'abilities', COALESCE(v_fixed_abilities, '[]'::jsonb) || COALESCE(v_random_abilities, '[]'::jsonb),
        'granted_items', COALESCE(v_granted_items, '[]'::jsonb)
    );
END;
$$;

CREATE OR REPLACE FUNCTION build_character_abilities(p_class_id INTEGER) RETURNS JSONB
    LANGUAGE sql AS $$
    SELECT COALESCE(
        build_character_ability_bundle(p_class_id)->'abilities',
        '[]'::jsonb
    );
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
    ability_bundle JSONB;
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

    ability_bundle := build_character_ability_bundle(char_class_id);
    ability_keys := COALESCE(ability_bundle->'abilities', '[]'::jsonb);

    item_pool := build_character_item_pool(char_class_id, (stats->>'presence')::INTEGER)
        || COALESCE(ability_bundle->'granted_items', '[]'::jsonb);
    equipment_bundle := auto_equip_character_items(item_pool);
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
