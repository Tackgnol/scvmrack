--
-- PostgreSQL database dump
--

-- Dumped from database version 16.10
-- Dumped by pg_dump version 16.3

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: p1002_scmgrinder
--

-- CREATE SCHEMA public;


-- ALTER SCHEMA public OWNER TO p1002_scmgrinder;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: p1002_scmgrinder
--

COMMENT ON SCHEMA public IS 'standard public schema';


--
-- Name: generate_character(integer); Type: FUNCTION; Schema: public; Owner: p1002_scmgrinder
--

CREATE FUNCTION public.generate_character(p_class_id integer DEFAULT NULL::integer) RETURNS uuid
    LANGUAGE plpgsql
    AS $$
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

    -- 3. ORIGIN SELECTION (from normalized origins table)
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

    -- 6. OMENS (d2: 1 or 2)
    omens_val := floor(random() * 2) + 1;

    -- 7. EQUIPMENT POOL
    rolled_pool := rolled_pool || (
        SELECT jsonb_agg(item)
        FROM (
            SELECT jsonb_build_object('key', key, 'tags', tags) as item
            FROM equipment
            ORDER BY random()
            LIMIT 3
        ) t
    );

    -- Class weapon and armor rolls
    rolled_pool := rolled_pool || (
        SELECT jsonb_build_object('key', key, 'tags', ARRAY['weapon'])
        FROM weapons
        WHERE roll = (floor(random()*class_row.weapon_die)+1)
        LIMIT 1
    );
    rolled_pool := rolled_pool || (
        SELECT jsonb_build_object('key', key, 'tags', ARRAY['armor'])
        FROM armors
        WHERE roll = (floor(random()*class_row.armor_die)+1)
        LIMIT 1
    );

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

    -- 9. ABILITIES (now using keys from abilities table)
    -- Get class abilities (non-random, is_random = false)
SELECT jsonb_agg(jsonb_build_object('key', a.key))
INTO ability_keys
FROM abilities a
WHERE a.class_id = char_class_id AND a.is_random = false;

IF ability_keys IS NULL THEN
        ability_keys := '[]'::JSONB;
END IF;

    -- Get random abilities based on random_ability_count
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


-- ALTER FUNCTION public.generate_character(p_class_id integer) OWNER TO p1002_scmgrinder;

--
-- Name: get_armor_by_roll(integer); Type: FUNCTION; Schema: public; Owner: p1002_scmgrinder
--

CREATE FUNCTION public.get_armor_by_roll(roll_num integer) RETURNS record
    LANGUAGE plpgsql
    AS $$

DECLARE

result RECORD;

BEGIN

SELECT * INTO result FROM armors WHERE roll = roll_num LIMIT 1;

IF NOT FOUND THEN

SELECT * INTO result FROM armors ORDER BY id LIMIT 1 OFFSET (roll_num - 1);

END IF;

RETURN result;

END;

$$;


-- ALTER FUNCTION public.get_armor_by_roll(roll_num integer) OWNER TO p1002_scmgrinder;

--
-- Name: get_character_full(uuid, character varying); Type: FUNCTION; Schema: public; Owner: p1002_scmgrinder
--

CREATE FUNCTION public.get_character_full(p_id uuid, p_locale character varying DEFAULT 'en'::character varying) RETURNS TABLE(id uuid, name character varying, class_id integer, class_name text, class_description text, origin text, strength integer, agility integer, presence integer, toughness integer, max_hp integer, current_hp integer, omens integer, max_omens integer, silver integer, habit text, tale text, body_description text, trait1 text, trait2 text, abilities jsonb, equipment jsonb, storage jsonb, equipped_weapons jsonb, equipped_armor jsonb, created_at timestamp without time zone, updated_at timestamp without time zone)
    LANGUAGE plpgsql STABLE
    AS $$
DECLARE
result RECORD;
    resolved_equipment jsonb;
    resolved_storage jsonb;  -- ADDED
    resolved_weapons jsonb;
    resolved_armor jsonb;
    resolved_abilities jsonb;
BEGIN
    -- Get base character data with resolved text fields
SELECT
    c.id, c.name, c.class_id,
    -- Use translation keys for class name/description, fallback to direct values
    COALESCE(t_class_name.value, cl.name) as class_name,
    COALESCE(t_class_desc.value, cl.appendix) as class_description,
    COALESCE(t_origin.value, c.origin) as origin,
    c.strength, c.agility, c.presence, c.toughness,
    c.max_hp, c.current_hp, c.omens, c.max_omens, c.silver,
    COALESCE(t_habit.value, c.habit) as habit,
    COALESCE(t_tale.value, c.tale) as tale,
    COALESCE(t_body.value, c.body_description) as body_description,
    COALESCE(t_trait1.value, c.trait1) as trait1,
    COALESCE(t_trait2.value, c.trait2) as trait2,
    c.abilities, c.equipment,
    COALESCE(c.storage, '[]'::jsonb) as storage,  -- ADDED
    c.equipped_weapons, c.equipped_armor,
    c.created_at, c.updated_at
INTO result
FROM characters c
         LEFT JOIN classes cl ON c.class_id = cl.id
    -- Class name translation (using name_key if available)
         LEFT JOIN translations t_class_name ON t_class_name.key = cl.name_key AND t_class_name.locale = p_locale
    -- Class description translation (using description_key if available)
         LEFT JOIN translations t_class_desc ON t_class_desc.key = cl.description_key AND t_class_desc.locale = p_locale
         LEFT JOIN translations t_origin ON c.origin = t_origin.key AND t_origin.locale = p_locale
         LEFT JOIN translations t_body ON c.body_description = t_body.key AND t_body.locale = p_locale
         LEFT JOIN translations t_trait1 ON c.trait1 = t_trait1.key AND t_trait1.locale = p_locale
         LEFT JOIN translations t_trait2 ON c.trait2 = t_trait2.key AND t_trait2.locale = p_locale
         LEFT JOIN translations t_habit ON c.habit = t_habit.key AND t_habit.locale = p_locale
         LEFT JOIN translations t_tale ON c.tale = t_tale.key AND t_tale.locale = p_locale
WHERE c.id = p_id;

IF result IS NULL THEN
        RETURN;
END IF;

    -- Resolve equipment
SELECT jsonb_agg(
               jsonb_build_object(
                       'key', eq->>'key',
                       'name', COALESCE(t.value, eq->>'key'),
                       'description', COALESCE(td.value, '')
               )
       )
INTO resolved_equipment
FROM jsonb_array_elements(result.equipment) eq
         LEFT JOIN translations t ON t.key = eq->>'key' AND t.locale = p_locale
    LEFT JOIN translations td ON td.key = (eq->>'key') || '.description' AND td.locale = p_locale;

-- ADDED: Resolve storage (same logic as equipment)
SELECT jsonb_agg(
               jsonb_build_object(
                       'key', st->>'key',
                       'name', COALESCE(t.value, st->>'name', st->>'key'),
                       'description', COALESCE(td.value, st->>'description', '')
               )
       )
INTO resolved_storage
FROM jsonb_array_elements(result.storage) st
         LEFT JOIN translations t ON t.key = st->>'key' AND t.locale = p_locale
    LEFT JOIN translations td ON td.key = (st->>'key') || '.description' AND td.locale = p_locale;

-- Resolve equipped weapons
SELECT jsonb_agg(
               jsonb_build_object(
                       'key', ew->>'key',
                       'name', COALESCE(t.value, ew->>'key'),
                       'description', COALESCE(td.value, ''),
                       'dice', w.dice,
                       'tags', w.tags
               )
       )
INTO resolved_weapons
FROM jsonb_array_elements(result.equipped_weapons) ew
         LEFT JOIN weapons w ON w.key = ew->>'key'
    LEFT JOIN translations t ON t.key = ew->>'key' AND t.locale = p_locale
    LEFT JOIN translations td ON td.key = (ew->>'key') || '.description' AND td.locale = p_locale;

-- Resolve equipped armor
IF result.equipped_armor IS NOT NULL THEN
SELECT jsonb_build_object(
               'key', result.equipped_armor->>'key',
               'name', COALESCE(t.value, result.equipped_armor->>'key'),
               'description', COALESCE(td.value, ''),
               'dice', a.dice,
               'max_tier', a.max_tier,
               'tags', a.tags
       )
INTO resolved_armor
FROM armors a
         LEFT JOIN translations t ON t.key = result.equipped_armor->>'key' AND t.locale = p_locale
    LEFT JOIN translations td ON td.key = (result.equipped_armor->>'key') || '.description' AND td.locale = p_locale
WHERE a.key = result.equipped_armor->>'key';
END IF;

    -- Resolve abilities (translate ability keys)
    -- Supports both new format {"key": "abilities.xxx"} and legacy format {"name": "...", "description": "..."}
SELECT jsonb_agg(
               CASE
                   WHEN ab->>'key' IS NOT NULL THEN
                   jsonb_build_object(
                   'key', ab->>'key',
                   'name', COALESCE(t.value, ab->>'key'),
                   'description', COALESCE(td.value, '')
                   )
                   ELSE
                   -- Legacy format: pass through as-is
                   ab
                   END
       )
INTO resolved_abilities
FROM jsonb_array_elements(result.abilities) ab
         LEFT JOIN translations t ON t.key = ab->>'key' AND t.locale = p_locale
    LEFT JOIN translations td ON td.key = (ab->>'key') || '.description' AND td.locale = p_locale;

RETURN QUERY SELECT
        result.id,
        result.name,
        result.class_id,
        result.class_name,
        result.class_description,
        result.origin,
        result.strength,
        result.agility,
        result.presence,
        result.toughness,
        result.max_hp,
        result.current_hp,
        result.omens,
        result.max_omens,
        result.silver,
        result.habit,
        result.tale,
        result.body_description,
        result.trait1,
        result.trait2,
        COALESCE(resolved_abilities, '[]'::jsonb),
        COALESCE(resolved_equipment, '[]'::jsonb),
        COALESCE(resolved_storage, '[]'::jsonb),  -- ADDED
        COALESCE(resolved_weapons, '[]'::jsonb),
        resolved_armor,
        result.created_at,
        result.updated_at;
END;
$$;


-- ALTER FUNCTION public.get_character_full(p_id uuid, p_locale character varying) OWNER TO p1002_scmgrinder;

--
-- Name: get_scroll_by_roll(integer, text); Type: FUNCTION; Schema: public; Owner: p1002_scmgrinder
--

CREATE FUNCTION public.get_scroll_by_roll(roll_num integer, scroll_type text) RETURNS record
    LANGUAGE plpgsql
    AS $$

DECLARE

result RECORD;

BEGIN

SELECT * INTO result FROM equipment

WHERE roll = roll_num AND scroll_type = ANY(tags)

    LIMIT 1;

RETURN result;

END;

$$;


-- ALTER FUNCTION public.get_scroll_by_roll(roll_num integer, scroll_type text) OWNER TO p1002_scmgrinder;

--
-- Name: get_weapon_by_roll(integer); Type: FUNCTION; Schema: public; Owner: p1002_scmgrinder
--

CREATE FUNCTION public.get_weapon_by_roll(roll_num integer) RETURNS record
    LANGUAGE plpgsql
    AS $$

DECLARE

result RECORD;

BEGIN

SELECT * INTO result FROM weapons WHERE roll = roll_num LIMIT 1;

IF NOT FOUND THEN

        -- Fallback: get by ID offset

SELECT * INTO result FROM weapons ORDER BY id LIMIT 1 OFFSET (roll_num - 1);

END IF;

RETURN result;

END;

$$;


-- ALTER FUNCTION public.get_weapon_by_roll(roll_num integer) OWNER TO p1002_scmgrinder;

--
-- Name: move_to_equipment(uuid, integer, integer); Type: FUNCTION; Schema: public; Owner: p1002_scmgrinder
--

CREATE FUNCTION public.move_to_equipment(p_character_id uuid, p_storage_index integer, p_equipment_position integer DEFAULT NULL::integer) RETURNS jsonb
    LANGUAGE plpgsql
    AS $$
DECLARE
v_item JSONB;
    v_equipment JSONB;
    v_storage JSONB;
    v_new_equipment JSONB;
BEGIN
    -- Get current equipment and storage
SELECT equipment, storage
INTO v_equipment, v_storage
FROM characters
WHERE id = p_character_id;

IF v_storage IS NULL THEN
        RAISE EXCEPTION 'Character not found';
END IF;

    -- Check index bounds
    IF p_storage_index < 0 OR p_storage_index >= jsonb_array_length(v_storage) THEN
        RAISE EXCEPTION 'Invalid storage index: %', p_storage_index;
END IF;

    -- Extract the item
    v_item := v_storage -> p_storage_index;

    -- Remove from storage
    v_storage := (
        SELECT COALESCE(jsonb_agg(elem), '[]'::jsonb)
        FROM jsonb_array_elements(v_storage) WITH ORDINALITY AS arr(elem, idx)
        WHERE idx - 1 != p_storage_index
    );

    -- Add to equipment at specified position or end
    v_equipment := COALESCE(v_equipment, '[]'::jsonb);

    IF p_equipment_position IS NULL OR p_equipment_position >= jsonb_array_length(v_equipment) THEN
        -- Append to end
        v_new_equipment := v_equipment || jsonb_build_array(v_item);
ELSE
        -- Insert at position
        v_new_equipment := (
            SELECT jsonb_agg(elem ORDER BY sort_order)
            FROM (
                SELECT elem, idx - 1 as sort_order
                FROM jsonb_array_elements(v_equipment) WITH ORDINALITY AS arr(elem, idx)
                WHERE idx - 1 < p_equipment_position
                UNION ALL
                SELECT v_item, p_equipment_position
                UNION ALL
                SELECT elem, idx as sort_order
                FROM jsonb_array_elements(v_equipment) WITH ORDINALITY AS arr(elem, idx)
                WHERE idx - 1 >= p_equipment_position
            ) sub
        );
END IF;

    -- Update character
UPDATE characters
SET equipment = v_new_equipment,
    storage = v_storage,
    updated_at = NOW()
WHERE id = p_character_id;

RETURN jsonb_build_object(
        'moved_item', v_item,
        'equipment', v_new_equipment,
        'storage', v_storage
       );
END;
$$;


-- ALTER FUNCTION public.move_to_equipment(p_character_id uuid, p_storage_index integer, p_equipment_position integer) OWNER TO p1002_scmgrinder;

--
-- Name: move_to_storage(uuid, integer); Type: FUNCTION; Schema: public; Owner: p1002_scmgrinder
--

CREATE FUNCTION public.move_to_storage(p_character_id uuid, p_equipment_index integer) RETURNS jsonb
    LANGUAGE plpgsql
    AS $$
DECLARE
v_item JSONB;
    v_equipment JSONB;
    v_storage JSONB;
BEGIN
    -- Get current equipment and storage
SELECT equipment, storage
INTO v_equipment, v_storage
FROM characters
WHERE id = p_character_id;

IF v_equipment IS NULL THEN
        RAISE EXCEPTION 'Character not found';
END IF;

    -- Check index bounds
    IF p_equipment_index < 0 OR p_equipment_index >= jsonb_array_length(v_equipment) THEN
        RAISE EXCEPTION 'Invalid equipment index: %', p_equipment_index;
END IF;

    -- Extract the item
    v_item := v_equipment -> p_equipment_index;

    -- Remove from equipment (rebuild array without that index)
    v_equipment := (
        SELECT COALESCE(jsonb_agg(elem), '[]'::jsonb)
        FROM jsonb_array_elements(v_equipment) WITH ORDINALITY AS arr(elem, idx)
        WHERE idx - 1 != p_equipment_index
    );

    -- Add to storage
    v_storage := COALESCE(v_storage, '[]'::jsonb) || jsonb_build_array(v_item);

    -- Update character
UPDATE characters
SET equipment = v_equipment,
    storage = v_storage,
    updated_at = NOW()
WHERE id = p_character_id;

RETURN jsonb_build_object(
        'moved_item', v_item,
        'equipment', v_equipment,
        'storage', v_storage
       );
END;
$$;


-- ALTER FUNCTION public.move_to_storage(p_character_id uuid, p_equipment_index integer) OWNER TO p1002_scmgrinder;

--
-- Name: random_row_id(text); Type: FUNCTION; Schema: public; Owner: p1002_scmgrinder
--

CREATE FUNCTION public.random_row_id(table_name text) RETURNS integer
    LANGUAGE plpgsql
    AS $$

DECLARE

result_id INTEGER;

BEGIN

EXECUTE format('SELECT id FROM %I ORDER BY random() LIMIT 1', table_name) INTO result_id;

RETURN result_id;

END;

$$;


-- ALTER FUNCTION public.random_row_id(table_name text) OWNER TO p1002_scmgrinder;

--
-- Name: roll_amount(integer, integer, integer); Type: FUNCTION; Schema: public; Owner: p1002_scmgrinder
--

CREATE FUNCTION public.roll_amount(min_val integer, max_val integer, mod_stat integer DEFAULT 0) RETURNS integer
    LANGUAGE plpgsql
    AS $$

BEGIN

    IF min_val IS NULL OR max_val IS NULL THEN

        RETURN 1;

END IF;

RETURN GREATEST(0, floor(random() * (max_val - min_val + 1) + min_val)::INTEGER + mod_stat);

END;

$$;


-- ALTER FUNCTION public.roll_amount(min_val integer, max_val integer, mod_stat integer) OWNER TO p1002_scmgrinder;

--
-- Name: roll_dice(integer, integer); Type: FUNCTION; Schema: public; Owner: p1002_scmgrinder
--

CREATE FUNCTION public.roll_dice(num_dice integer, sides integer) RETURNS integer
    LANGUAGE plpgsql
    AS $$

DECLARE

total INTEGER := 0;

    i INTEGER;

BEGIN

FOR i IN 1..num_dice LOOP

        total := total + floor(random() * sides + 1)::INTEGER;

END LOOP;

RETURN total;

END;

$$;


-- ALTER FUNCTION public.roll_dice(num_dice integer, sides integer) OWNER TO p1002_scmgrinder;

--
-- Name: roll_die(integer); Type: FUNCTION; Schema: public; Owner: p1002_scmgrinder
--

CREATE FUNCTION public.roll_die(sides integer) RETURNS integer
    LANGUAGE plpgsql
    AS $$

BEGIN

RETURN floor(random() * sides + 1)::INTEGER;

END;

$$;


-- ALTER FUNCTION public.roll_die(sides integer) OWNER TO p1002_scmgrinder;

--
-- Name: roll_stat(); Type: FUNCTION; Schema: public; Owner: p1002_scmgrinder
--

CREATE FUNCTION public.roll_stat() RETURNS integer
    LANGUAGE plpgsql
    AS $$

BEGIN

RETURN roll_to_modifier(roll_dice(3, 6));

END;

$$;


-- ALTER FUNCTION public.roll_stat() OWNER TO p1002_scmgrinder;

--
-- Name: roll_to_modifier(integer); Type: FUNCTION; Schema: public; Owner: p1002_scmgrinder
--

CREATE FUNCTION public.roll_to_modifier(roll integer) RETURNS integer
    LANGUAGE plpgsql
    AS $$

BEGIN

RETURN CASE

           WHEN roll <= 4 THEN -3

           WHEN roll <= 6 THEN -2

           WHEN roll <= 8 THEN -1

           WHEN roll <= 12 THEN 0

           WHEN roll <= 14 THEN 1

           WHEN roll <= 16 THEN 2

           ELSE 3

    END;

END;

$$;


-- ALTER FUNCTION public.roll_to_modifier(roll integer) OWNER TO p1002_scmgrinder;

--
-- Name: swap_items(uuid, integer, integer); Type: FUNCTION; Schema: public; Owner: p1002_scmgrinder
--

CREATE FUNCTION public.swap_items(p_character_id uuid, p_equipment_index integer, p_storage_index integer) RETURNS jsonb
    LANGUAGE plpgsql
    AS $$
DECLARE
v_equipment_item JSONB;
    v_storage_item JSONB;
    v_equipment JSONB;
    v_storage JSONB;
BEGIN
    -- Get current arrays
SELECT equipment, storage
INTO v_equipment, v_storage
FROM characters
WHERE id = p_character_id;

IF v_equipment IS NULL THEN
        RAISE EXCEPTION 'Character not found';
END IF;

    -- Validate indices
    IF p_equipment_index < 0 OR p_equipment_index >= jsonb_array_length(v_equipment) THEN
        RAISE EXCEPTION 'Invalid equipment index: %', p_equipment_index;
END IF;

    IF p_storage_index < 0 OR p_storage_index >= jsonb_array_length(v_storage) THEN
        RAISE EXCEPTION 'Invalid storage index: %', p_storage_index;
END IF;

    -- Extract items
    v_equipment_item := v_equipment -> p_equipment_index;
    v_storage_item := v_storage -> p_storage_index;

    -- Swap using jsonb_set
    v_equipment := jsonb_set(v_equipment, ARRAY[p_equipment_index::text], v_storage_item);
    v_storage := jsonb_set(v_storage, ARRAY[p_storage_index::text], v_equipment_item);

    -- Update character
UPDATE characters
SET equipment = v_equipment,
    storage = v_storage,
    updated_at = NOW()
WHERE id = p_character_id;

RETURN jsonb_build_object(
        'equipment', v_equipment,
        'storage', v_storage
       );
END;
$$;


-- ALTER FUNCTION public.swap_items(p_character_id uuid, p_equipment_index integer, p_storage_index integer) OWNER TO p1002_scmgrinder;

--
-- Name: t(text); Type: FUNCTION; Schema: public; Owner: p1002_scmgrinder
--

CREATE FUNCTION public.t(translation_key text) RETURNS text
    LANGUAGE plpgsql
    AS $$

DECLARE

result TEXT;

BEGIN

SELECT value INTO result FROM translations WHERE key = translation_key;

RETURN COALESCE(result, translation_key);

END;

$$;


-- ALTER FUNCTION public.t(translation_key text) OWNER TO p1002_scmgrinder;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: abilities; Type: TABLE; Schema: public; Owner: p1002_scmgrinder
--

CREATE TABLE public.abilities (
                                  id integer NOT NULL,
                                  class_id integer,
                                  key character varying(255) NOT NULL,
                                  is_random boolean DEFAULT false,
                                  roll_value integer
);


-- ALTER TABLE public.abilities OWNER TO p1002_scmgrinder;

--
-- Name: abilities_id_seq; Type: SEQUENCE; Schema: public; Owner: p1002_scmgrinder
--

CREATE SEQUENCE public.abilities_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


-- ALTER SEQUENCE public.abilities_id_seq OWNER TO p1002_scmgrinder;

--
-- Name: abilities_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: p1002_scmgrinder
--

ALTER SEQUENCE public.abilities_id_seq OWNED BY public.abilities.id;


--
-- Name: armors; Type: TABLE; Schema: public; Owner: p1002_scmgrinder
--

CREATE TABLE public.armors (
                               id integer NOT NULL,
                               key character varying(255) NOT NULL,
                               tags text[] DEFAULT '{}'::text[] NOT NULL,
                               dice integer[] DEFAULT '{}'::integer[],
                               roll integer,
                               value integer DEFAULT 0,
                               exp boolean DEFAULT false,
                               max_tier integer DEFAULT 1,
                               modifiers jsonb DEFAULT '[]'::jsonb
);


-- ALTER TABLE public.armors OWNER TO p1002_scmgrinder;

--
-- Name: armors_id_seq; Type: SEQUENCE; Schema: public; Owner: p1002_scmgrinder
--

CREATE SEQUENCE public.armors_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


-- ALTER SEQUENCE public.armors_id_seq OWNER TO p1002_scmgrinder;

--
-- Name: armors_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: p1002_scmgrinder
--

ALTER SEQUENCE public.armors_id_seq OWNED BY public.armors.id;


--
-- Name: body_descriptions; Type: TABLE; Schema: public; Owner: p1002_scmgrinder
--

CREATE TABLE public.body_descriptions (
                                          id integer NOT NULL,
                                          key character varying(255) NOT NULL,
                                          roll integer
);


-- ALTER TABLE public.body_descriptions OWNER TO p1002_scmgrinder;

--
-- Name: body_descriptions_id_seq; Type: SEQUENCE; Schema: public; Owner: p1002_scmgrinder
--

CREATE SEQUENCE public.body_descriptions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


-- ALTER SEQUENCE public.body_descriptions_id_seq OWNER TO p1002_scmgrinder;

--
-- Name: body_descriptions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: p1002_scmgrinder
--

ALTER SEQUENCE public.body_descriptions_id_seq OWNED BY public.body_descriptions.id;


--
-- Name: characters; Type: TABLE; Schema: public; Owner: p1002_scmgrinder
--

CREATE TABLE public.characters (
                                   id uuid DEFAULT gen_random_uuid() NOT NULL,
                                   name character varying(255) NOT NULL,
                                   class_id integer,
                                   body_description text,
                                   habit text,
                                   tale text,
                                   trait1 text,
                                   trait2 text,
                                   origin character varying(255),
                                   strength integer DEFAULT 0 NOT NULL,
                                   agility integer DEFAULT 0 NOT NULL,
                                   presence integer DEFAULT 0 NOT NULL,
                                   toughness integer DEFAULT 0 NOT NULL,
                                   max_hp integer DEFAULT 1 NOT NULL,
                                   current_hp integer DEFAULT 1 NOT NULL,
                                   omens integer DEFAULT 0,
                                   max_omens integer DEFAULT 0,
                                   equipment jsonb DEFAULT '[]'::jsonb,
                                   equipped_weapons jsonb DEFAULT '[]'::jsonb,
                                   equipped_armor jsonb,
                                   abilities jsonb DEFAULT '[]'::jsonb,
                                   pets jsonb DEFAULT '[]'::jsonb,
                                   ammo integer DEFAULT 0,
                                   silver integer DEFAULT 0,
                                   wounded boolean DEFAULT false,
                                   dead boolean DEFAULT false,
                                   created_at timestamp without time zone DEFAULT now(),
                                   updated_at timestamp without time zone DEFAULT now(),
                                   storage jsonb DEFAULT '[]'::jsonb
);


-- ALTER TABLE public.characters OWNER TO p1002_scmgrinder;

--
-- Name: COLUMN characters.storage; Type: COMMENT; Schema: public; Owner: p1002_scmgrinder
--

COMMENT ON COLUMN public.characters.storage IS 'Items stored in backpack/storage, not immediately accessible';


--
-- Name: classes; Type: TABLE; Schema: public; Owner: p1002_scmgrinder
--

CREATE TABLE public.classes (
                                id integer NOT NULL,
                                name character varying(255) NOT NULL,
                                roll integer,
                                appendix text,
                                hp_die integer DEFAULT 8,
                                weapon_die integer DEFAULT 10,
                                armor_die integer DEFAULT 4,
                                silver_dice integer[] DEFAULT ARRAY[6, 6],
                                silver_modifier integer DEFAULT 10,
                                stat_modifiers jsonb DEFAULT '{}'::jsonb,
                                class_abilities jsonb DEFAULT '[]'::jsonb,
                                random_abilities jsonb DEFAULT '[]'::jsonb,
                                random_ability_count integer DEFAULT 1,
                                name_key character varying(255),
                                description_key character varying(255)
);


-- ALTER TABLE public.classes OWNER TO p1002_scmgrinder;

--
-- Name: classes_id_seq; Type: SEQUENCE; Schema: public; Owner: p1002_scmgrinder
--

CREATE SEQUENCE public.classes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


-- ALTER SEQUENCE public.classes_id_seq OWNER TO p1002_scmgrinder;

--
-- Name: classes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: p1002_scmgrinder
--

ALTER SEQUENCE public.classes_id_seq OWNED BY public.classes.id;


--
-- Name: equipment; Type: TABLE; Schema: public; Owner: p1002_scmgrinder
--

CREATE TABLE public.equipment (
                                  id integer NOT NULL,
                                  key character varying(255) NOT NULL,
                                  tags text[] DEFAULT '{}'::text[] NOT NULL,
                                  amount_min integer,
                                  amount_max integer,
                                  mod character varying(50),
                                  hp_min integer,
                                  hp_max integer,
                                  hp_mod integer,
                                  value integer DEFAULT 0,
                                  exp boolean DEFAULT false,
                                  roll integer,
                                  multiple integer DEFAULT 1,
                                  ammo_type character varying(50),
                                  ammo_start integer,
                                  use_effect jsonb
);


-- ALTER TABLE public.equipment OWNER TO p1002_scmgrinder;

--
-- Name: equipment_id_seq; Type: SEQUENCE; Schema: public; Owner: p1002_scmgrinder
--

CREATE SEQUENCE public.equipment_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


-- ALTER SEQUENCE public.equipment_id_seq OWNER TO p1002_scmgrinder;

--
-- Name: equipment_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: p1002_scmgrinder
--

ALTER SEQUENCE public.equipment_id_seq OWNED BY public.equipment.id;


--
-- Name: habits; Type: TABLE; Schema: public; Owner: p1002_scmgrinder
--

CREATE TABLE public.habits (
                               id integer NOT NULL,
                               key character varying(255) NOT NULL,
                               roll integer,
                               exp boolean DEFAULT false,
                               items jsonb DEFAULT '[]'::jsonb
);


-- ALTER TABLE public.habits OWNER TO p1002_scmgrinder;

--
-- Name: habits_id_seq; Type: SEQUENCE; Schema: public; Owner: p1002_scmgrinder
--

CREATE SEQUENCE public.habits_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


-- ALTER SEQUENCE public.habits_id_seq OWNER TO p1002_scmgrinder;

--
-- Name: habits_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: p1002_scmgrinder
--

ALTER SEQUENCE public.habits_id_seq OWNED BY public.habits.id;


--
-- Name: names; Type: TABLE; Schema: public; Owner: p1002_scmgrinder
--

CREATE TABLE public.names (
                              id integer NOT NULL,
                              name character varying(255) NOT NULL
);


-- ALTER TABLE public.names OWNER TO p1002_scmgrinder;

--
-- Name: names_id_seq; Type: SEQUENCE; Schema: public; Owner: p1002_scmgrinder
--

CREATE SEQUENCE public.names_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


-- ALTER SEQUENCE public.names_id_seq OWNER TO p1002_scmgrinder;

--
-- Name: names_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: p1002_scmgrinder
--

ALTER SEQUENCE public.names_id_seq OWNED BY public.names.id;


--
-- Name: origins; Type: TABLE; Schema: public; Owner: p1002_scmgrinder
--

CREATE TABLE public.origins (
                                id integer NOT NULL,
                                class_id integer,
                                roll integer NOT NULL,
                                key character varying(255) NOT NULL
);


-- ALTER TABLE public.origins OWNER TO p1002_scmgrinder;

--
-- Name: origins_id_seq; Type: SEQUENCE; Schema: public; Owner: p1002_scmgrinder
--

CREATE SEQUENCE public.origins_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


-- ALTER SEQUENCE public.origins_id_seq OWNER TO p1002_scmgrinder;

--
-- Name: origins_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: p1002_scmgrinder
--

ALTER SEQUENCE public.origins_id_seq OWNED BY public.origins.id;


--
-- Name: pets; Type: TABLE; Schema: public; Owner: p1002_scmgrinder
--

CREATE TABLE public.pets (
                             id integer NOT NULL,
                             key character varying(255) NOT NULL,
                             hp integer DEFAULT 1 NOT NULL,
                             tags text[] DEFAULT '{}'::text[],
                             exp boolean DEFAULT false,
                             action_die integer[] DEFAULT '{}'::integer[],
                             action_type character varying(50) DEFAULT 'melee'::character varying,
                             amount integer DEFAULT 1,
                             amount_die integer,
                             buff jsonb DEFAULT '[]'::jsonb,
                             value integer DEFAULT 0
);


-- ALTER TABLE public.pets OWNER TO p1002_scmgrinder;

--
-- Name: pets_id_seq; Type: SEQUENCE; Schema: public; Owner: p1002_scmgrinder
--

CREATE SEQUENCE public.pets_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


-- ALTER SEQUENCE public.pets_id_seq OWNER TO p1002_scmgrinder;

--
-- Name: pets_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: p1002_scmgrinder
--

ALTER SEQUENCE public.pets_id_seq OWNED BY public.pets.id;


--
-- Name: tales; Type: TABLE; Schema: public; Owner: p1002_scmgrinder
--

CREATE TABLE public.tales (
                              id integer NOT NULL,
                              key character varying(255) NOT NULL,
                              roll integer,
                              exp boolean DEFAULT false,
                              items jsonb DEFAULT '[]'::jsonb
);


-- ALTER TABLE public.tales OWNER TO p1002_scmgrinder;

--
-- Name: tales_id_seq; Type: SEQUENCE; Schema: public; Owner: p1002_scmgrinder
--

CREATE SEQUENCE public.tales_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


-- ALTER SEQUENCE public.tales_id_seq OWNER TO p1002_scmgrinder;

--
-- Name: tales_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: p1002_scmgrinder
--

ALTER SEQUENCE public.tales_id_seq OWNED BY public.tales.id;


--
-- Name: traits; Type: TABLE; Schema: public; Owner: p1002_scmgrinder
--

CREATE TABLE public.traits (
                               id integer NOT NULL,
                               key character varying(255) NOT NULL,
                               roll integer
);


-- ALTER TABLE public.traits OWNER TO p1002_scmgrinder;

--
-- Name: traits_id_seq; Type: SEQUENCE; Schema: public; Owner: p1002_scmgrinder
--

CREATE SEQUENCE public.traits_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


-- ALTER SEQUENCE public.traits_id_seq OWNER TO p1002_scmgrinder;

--
-- Name: traits_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: p1002_scmgrinder
--

ALTER SEQUENCE public.traits_id_seq OWNED BY public.traits.id;


--
-- Name: translations; Type: TABLE; Schema: public; Owner: p1002_scmgrinder
--

CREATE TABLE public.translations (
                                     locale character varying(10) DEFAULT 'en'::character varying NOT NULL,
                                     key character varying(255) NOT NULL,
                                     value text NOT NULL
);


-- ALTER TABLE public.translations OWNER TO p1002_scmgrinder;

--
-- Name: weapons; Type: TABLE; Schema: public; Owner: p1002_scmgrinder
--

CREATE TABLE public.weapons (
                                id integer NOT NULL,
                                key character varying(255) NOT NULL,
                                tags text[] DEFAULT '{}'::text[] NOT NULL,
                                amount_min integer,
                                amount_max integer,
                                mod character varying(50),
                                dice integer[] DEFAULT '{}'::integer[],
                                roll integer,
                                value integer DEFAULT 0,
                                exp boolean DEFAULT false,
                                effect_die integer,
                                effect jsonb,
                                damage_modifier integer DEFAULT 0,
                                modifiers jsonb DEFAULT '[]'::jsonb,
                                ammo_type character varying(50),
                                ammo_start integer
);


-- ALTER TABLE public.weapons OWNER TO p1002_scmgrinder;

--
-- Name: weapons_id_seq; Type: SEQUENCE; Schema: public; Owner: p1002_scmgrinder
--

CREATE SEQUENCE public.weapons_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


-- ALTER SEQUENCE public.weapons_id_seq OWNER TO p1002_scmgrinder;

--
-- Name: weapons_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: p1002_scmgrinder
--

ALTER SEQUENCE public.weapons_id_seq OWNED BY public.weapons.id;


--
-- Name: abilities id; Type: DEFAULT; Schema: public; Owner: p1002_scmgrinder
--

ALTER TABLE ONLY public.abilities ALTER COLUMN id SET DEFAULT nextval('public.abilities_id_seq'::regclass);


--
-- Name: armors id; Type: DEFAULT; Schema: public; Owner: p1002_scmgrinder
--

ALTER TABLE ONLY public.armors ALTER COLUMN id SET DEFAULT nextval('public.armors_id_seq'::regclass);


--
-- Name: body_descriptions id; Type: DEFAULT; Schema: public; Owner: p1002_scmgrinder
--

ALTER TABLE ONLY public.body_descriptions ALTER COLUMN id SET DEFAULT nextval('public.body_descriptions_id_seq'::regclass);


--
-- Name: classes id; Type: DEFAULT; Schema: public; Owner: p1002_scmgrinder
--

ALTER TABLE ONLY public.classes ALTER COLUMN id SET DEFAULT nextval('public.classes_id_seq'::regclass);


--
-- Name: equipment id; Type: DEFAULT; Schema: public; Owner: p1002_scmgrinder
--

ALTER TABLE ONLY public.equipment ALTER COLUMN id SET DEFAULT nextval('public.equipment_id_seq'::regclass);


--
-- Name: habits id; Type: DEFAULT; Schema: public; Owner: p1002_scmgrinder
--

ALTER TABLE ONLY public.habits ALTER COLUMN id SET DEFAULT nextval('public.habits_id_seq'::regclass);


--
-- Name: names id; Type: DEFAULT; Schema: public; Owner: p1002_scmgrinder
--

ALTER TABLE ONLY public.names ALTER COLUMN id SET DEFAULT nextval('public.names_id_seq'::regclass);


--
-- Name: origins id; Type: DEFAULT; Schema: public; Owner: p1002_scmgrinder
--

ALTER TABLE ONLY public.origins ALTER COLUMN id SET DEFAULT nextval('public.origins_id_seq'::regclass);


--
-- Name: pets id; Type: DEFAULT; Schema: public; Owner: p1002_scmgrinder
--

ALTER TABLE ONLY public.pets ALTER COLUMN id SET DEFAULT nextval('public.pets_id_seq'::regclass);


--
-- Name: tales id; Type: DEFAULT; Schema: public; Owner: p1002_scmgrinder
--

ALTER TABLE ONLY public.tales ALTER COLUMN id SET DEFAULT nextval('public.tales_id_seq'::regclass);


--
-- Name: traits id; Type: DEFAULT; Schema: public; Owner: p1002_scmgrinder
--

ALTER TABLE ONLY public.traits ALTER COLUMN id SET DEFAULT nextval('public.traits_id_seq'::regclass);


--
-- Name: weapons id; Type: DEFAULT; Schema: public; Owner: p1002_scmgrinder
--

ALTER TABLE ONLY public.weapons ALTER COLUMN id SET DEFAULT nextval('public.weapons_id_seq'::regclass);


--
-- Data for Name: abilities; Type: TABLE DATA; Schema: public; Owner: p1002_scmgrinder
--

INSERT INTO public.abilities VALUES (1, 1, 'abilities.fanged_deserter.clumsy', false, NULL);
INSERT INTO public.abilities VALUES (2, 1, 'abilities.fanged_deserter.bite', false, NULL);
INSERT INTO public.abilities VALUES (3, 1, 'abilities.fanged_deserter.mask', true, 1);
INSERT INTO public.abilities VALUES (4, 1, 'abilities.fanged_deserter.scimitar', true, 2);
INSERT INTO public.abilities VALUES (5, 1, 'abilities.fanged_deserter.teeth', true, 3);
INSERT INTO public.abilities VALUES (6, 1, 'abilities.fanged_deserter.sling', true, 4);
INSERT INTO public.abilities VALUES (7, 1, 'abilities.fanged_deserter.shoe', true, 5);
INSERT INTO public.abilities VALUES (8, 1, 'abilities.fanged_deserter.hound', true, 6);
INSERT INTO public.abilities VALUES (9, 2, 'abilities.gutterborn_scum.stealthy', false, NULL);
INSERT INTO public.abilities VALUES (10, 2, 'abilities.gutterborn_scum.jab', true, 1);
INSERT INTO public.abilities VALUES (11, 2, 'abilities.gutterborn_scum.jester', true, 2);
INSERT INTO public.abilities VALUES (12, 2, 'abilities.gutterborn_scum.spatula', true, 3);
INSERT INTO public.abilities VALUES (13, 2, 'abilities.gutterborn_scum.muck', true, 4);
INSERT INTO public.abilities VALUES (14, 2, 'abilities.gutterborn_scum.poison', true, 5);
INSERT INTO public.abilities VALUES (15, 2, 'abilities.gutterborn_scum.nose', true, 6);
INSERT INTO public.abilities VALUES (16, 3, 'abilities.esoteric_hermit.scrolls', false, NULL);
INSERT INTO public.abilities VALUES (17, 3, 'abilities.esoteric_hermit.book', true, 1);
INSERT INTO public.abilities VALUES (18, 3, 'abilities.esoteric_hermit.staff', true, 2);
INSERT INTO public.abilities VALUES (19, 3, 'abilities.esoteric_hermit.skin', true, 3);
INSERT INTO public.abilities VALUES (20, 3, 'abilities.esoteric_hermit.ash', true, 4);
INSERT INTO public.abilities VALUES (21, 3, 'abilities.esoteric_hermit.eye', true, 5);
INSERT INTO public.abilities VALUES (22, 3, 'abilities.esoteric_hermit.bird', true, 6);
INSERT INTO public.abilities VALUES (23, 4, 'abilities.wretched_royalty.servant', false, NULL);
INSERT INTO public.abilities VALUES (24, 4, 'abilities.wretched_royalty.horse', true, 1);
INSERT INTO public.abilities VALUES (25, 4, 'abilities.wretched_royalty.blade', true, 2);
INSERT INTO public.abilities VALUES (26, 4, 'abilities.wretched_royalty.seal', true, 3);
INSERT INTO public.abilities VALUES (27, 4, 'abilities.wretched_royalty.squire', true, 4);
INSERT INTO public.abilities VALUES (28, 4, 'abilities.wretched_royalty.cape', true, 5);
INSERT INTO public.abilities VALUES (29, 4, 'abilities.wretched_royalty.crown', true, 6);
INSERT INTO public.abilities VALUES (30, 5, 'abilities.heretical_priest.sinner', false, NULL);
INSERT INTO public.abilities VALUES (31, 5, 'abilities.heretical_priest.beak', true, 1);
INSERT INTO public.abilities VALUES (32, 5, 'abilities.heretical_priest.breath', true, 2);
INSERT INTO public.abilities VALUES (33, 5, 'abilities.heretical_priest.voice', true, 3);
INSERT INTO public.abilities VALUES (34, 5, 'abilities.heretical_priest.fingers', true, 4);
INSERT INTO public.abilities VALUES (35, 5, 'abilities.heretical_priest.tongue', true, 5);
INSERT INTO public.abilities VALUES (36, 5, 'abilities.heretical_priest.eye', true, 6);
INSERT INTO public.abilities VALUES (37, 6, 'abilities.occult_herbmaster.decoctions', false, NULL);
INSERT INTO public.abilities VALUES (38, 6, 'abilities.occult_herbmaster.hyphos', true, 1);
INSERT INTO public.abilities VALUES (39, 6, 'abilities.occult_herbmaster.black_poison', true, 2);
INSERT INTO public.abilities VALUES (40, 6, 'abilities.occult_herbmaster.red_poison', true, 3);
INSERT INTO public.abilities VALUES (41, 6, 'abilities.occult_herbmaster.ezumiel', true, 4);
INSERT INTO public.abilities VALUES (42, 6, 'abilities.occult_herbmaster.frog', true, 5);
INSERT INTO public.abilities VALUES (43, 6, 'abilities.occult_herbmaster.vitalis', true, 6);
INSERT INTO public.abilities VALUES (44, 6, 'abilities.occult_herbmaster.soup', true, 7);
INSERT INTO public.abilities VALUES (45, 6, 'abilities.occult_herbmaster.philtre', true, 8);


--
-- Data for Name: armors; Type: TABLE DATA; Schema: public; Owner: p1002_scmgrinder
--

INSERT INTO public.armors VALUES (1, 'armor.fur', '{armor,light-armor}', '{2}', 1, 20, false, 1, '[]');
INSERT INTO public.armors VALUES (2, 'armor.padded-cloth', '{armor,light-armor}', '{2}', 2, 20, false, 1, '[]');
INSERT INTO public.armors VALUES (3, 'armor.leather', '{armor,light-armor}', '{2}', 2, 20, false, 1, '[]');
INSERT INTO public.armors VALUES (4, 'armor.scale', '{armor,medium-armor,metal}', '{4}', 3, 100, false, 2, '[{"value": -2, "source": "Scale armor", "statistic": "agility"}]');
INSERT INTO public.armors VALUES (5, 'armor.mail', '{armor,medium-armor,metal}', '{4}', 3, 100, false, 2, '[{"value": -2, "source": "Mail armor", "statistic": "agility"}]');
INSERT INTO public.armors VALUES (6, 'armor.splint', '{armor,heavy-armor,metal}', '{6}', 4, 200, false, 3, '[{"value": -4, "source": "Splint armor", "exclude": ["defence", "buff", "item"], "statistic": "agility"}, {"value": -2, "source": "Splint armor", "exclude": ["ability", "test", "melee", "ranged", "cast", "heal", "buff"], "statistic": "agility"}]');
INSERT INTO public.armors VALUES (7, 'armor.plate', '{armor,heavy-armor,metal}', '{6}', 4, 200, false, 3, '[{"value": -4, "source": "Plate armor", "exclude": ["defence", "buff"], "statistic": "agility"}, {"value": -2, "source": "Plate armor", "exclude": ["ability", "test", "melee", "ranged", "cast", "heal", "buff"], "statistic": "agility"}]');


--
-- Data for Name: body_descriptions; Type: TABLE DATA; Schema: public; Owner: p1002_scmgrinder
--

INSERT INTO public.body_descriptions VALUES (1, 'body.1', 1);
INSERT INTO public.body_descriptions VALUES (2, 'body.2', 2);
INSERT INTO public.body_descriptions VALUES (3, 'body.3', 3);
INSERT INTO public.body_descriptions VALUES (4, 'body.4', 4);
INSERT INTO public.body_descriptions VALUES (5, 'body.5', 5);
INSERT INTO public.body_descriptions VALUES (6, 'body.6', 6);
INSERT INTO public.body_descriptions VALUES (7, 'body.7', 7);
INSERT INTO public.body_descriptions VALUES (8, 'body.8', 8);
INSERT INTO public.body_descriptions VALUES (9, 'body.9', 9);
INSERT INTO public.body_descriptions VALUES (10, 'body.10', 10);
INSERT INTO public.body_descriptions VALUES (11, 'body.11', 11);
INSERT INTO public.body_descriptions VALUES (12, 'body.12', 12);
INSERT INTO public.body_descriptions VALUES (13, 'body.13', 13);
INSERT INTO public.body_descriptions VALUES (14, 'body.14', 14);
INSERT INTO public.body_descriptions VALUES (15, 'body.15', 15);
INSERT INTO public.body_descriptions VALUES (16, 'body.16', 16);
INSERT INTO public.body_descriptions VALUES (17, 'body.17', 17);
INSERT INTO public.body_descriptions VALUES (18, 'body.18', 18);
INSERT INTO public.body_descriptions VALUES (19, 'body.19', 19);
INSERT INTO public.body_descriptions VALUES (20, 'body.20', 20);


--
-- Data for Name: characters; Type: TABLE DATA; Schema: public; Owner: p1002_scmgrinder
--

INSERT INTO public.characters VALUES ('d70fd043-205f-4068-8d1b-78439850f123', 'Dekram', 1, 'body.5', 'habits.19', 'tales.18', 'traits.5', 'traits.20', 'origins.fanged_deserter.1', 15, 12, 9, 12, 6, 6, 0, 0, '[{"key": "scroll.unclean.1"}, {"key": "equipment.exquisite-perfume"}]', '[{"key": "equipment.bomb"}, {"key": "weapons.flail"}]', '{"key": "armor.fur"}', '[{"name": "Clumsy and Dull-witted", "description": "Agility tests are DR+2, excluding defence. You are incapable of understanding scrolls."}, {"name": "Bite Attack", "description": "DR10 to attack, d6 damage. You must be close to your target."}, {"name": "Ancient Gore-Hound", "gainPet": "Ancient Gore-Hound", "description": "Asthmatic hound with superb nose. DR10 attack (d6), DR12 defence, 10 HP."}]', '[]', 0, 80, false, false, '2026-01-06 21:59:54.65434', '2026-01-06 21:59:54.65434', '[]');
INSERT INTO public.characters VALUES ('8c75a799-2c33-459f-b66a-7609ef834f65', 'Svind', 1, 'body.1', 'habits.4', 'tales.16', 'traits.7', 'traits.18', 'origins.fanged_deserter.4', 16, 13, 3, 13, 11, 11, 1, 1, '[{"key": "equipment.mirror"}, {"key": "equipment.hyphos-snuff"}, {"key": "scroll.sacred.5"}]', '[{"key": "weapons.warhammer"}]', '{"key": "armor.padded-cloth"}', '[{"name": "Clumsy and Dull-witted", "description": "Agility tests are DR+2, excluding defence. You are incapable of understanding scrolls."}, {"name": "Bite Attack", "description": "DR10 to attack, d6 damage. You must be close to your target."}, {"name": "Ancient Gore-Hound", "gainPet": "Ancient Gore-Hound", "description": "Asthmatic hound with superb nose. DR10 attack (d6), DR12 defence, 10 HP."}]', '[]', 0, 30, false, false, '2026-01-06 22:04:16.959639', '2026-01-06 22:04:16.959639', '[]');
INSERT INTO public.characters VALUES ('e9a658c1-4459-4f37-9664-89422c4ecaea', 'Frustan', 1, 'body.13', 'habits.4', 'tales.11', 'traits.19', 'traits.12', 'origins.fanged_deserter.6', 12, 8, 13, 7, 2, 2, 2, 2, '[{"key": "scroll.sacred.3"}, {"key": "equipment.chalk"}, {"key": "equipment.mirror"}]', '[{"key": "weapons.zweihander"}]', '{"key": "armor.splint"}', '[{"name": "Clumsy and Dull-witted", "description": "Agility tests are DR+2, excluding defence. You are incapable of understanding scrolls."}, {"name": "Bite Attack", "description": "DR10 to attack, d6 damage. You must be close to your target."}, {"name": "The Shoe of Death''s Horse", "gainItem": "The Shoe of Death''s Horse", "description": "DR10, d4 damage. 1 in 6 instant kill on small-medium creatures. Returns like boomerang."}]', '[]', 0, 30, false, false, '2026-01-06 22:04:50.961603', '2026-01-06 22:04:50.961603', '[]');
INSERT INTO public.characters VALUES ('7ae7bc8e-3558-4994-9437-f3e1203e6cd8', 'Belum', 1, 'body.6', 'habits.20', 'tales.1', 'traits.16', 'traits.19', 'origins.fanged_deserter.4', 14, 13, 11, 9, 5, 5, 2, 2, '[{"key": "equipment.lockpicks"}, {"key": "equipment.chalk"}, {"key": "equipment.black-poison"}]', '[{"key": "weapons.bow"}]', '{"key": "armor.mail"}', '[{"name": "Clumsy and Dull-witted", "description": "Agility tests are DR+2, excluding defence. You are incapable of understanding scrolls."}, {"name": "Bite Attack", "description": "DR10 to attack, d6 damage. You must be close to your target."}, {"name": "The Shoe of Death''s Horse", "gainItem": "The Shoe of Death''s Horse", "description": "DR10, d4 damage. 1 in 6 instant kill on small-medium creatures. Returns like boomerang."}]', '[]', 0, 60, false, false, '2026-01-06 22:05:05.74327', '2026-01-06 22:05:05.74327', '[]');
INSERT INTO public.characters VALUES ('f8dc1c66-9a09-4cb0-b650-22833d18d650', 'Glum', 2, 'body.8', 'habits.13', 'tales.19', 'traits.17', 'traits.6', 'origins.gutterborn_scum.2', 6, 8, 8, 10, 5, 5, 1, 1, '[]', '[]', NULL, '[{"name": "Stealthy", "description": "All Presence and Agility tests have their DR reduced by 2."}, {"name": "Abominable Gob Lobber", "description": "Spit d2 times per fight at DR8 Presence. Targets blinded d4 rounds."}]', '[]', 0, 30, false, false, '2026-01-11 22:03:02.969876', '2026-01-11 22:03:02.969876', '[]');
INSERT INTO public.characters VALUES ('a41993d0-d03d-411f-bb25-be8e3bff072a', 'Urvarg', 1, 'body.12', 'habits.19', 'tales.13', 'traits.20', 'traits.15', 'origins.fanged_deserter.6', 11, 6, 8, 9, 9, 9, 2, 2, '[]', '[]', NULL, '[{"name": "Clumsy and Dull-witted", "description": "Agility tests are DR+2, excluding defence. You are incapable of understanding scrolls."}, {"name": "Bite Attack", "description": "DR10 to attack, d6 damage. You must be close to your target."}, {"name": "The Brown Scimitar of Galgenbeck", "gainItem": "The Brown Scimitar of Galgenbeck", "description": "A stinking sword. D6 damage. 1 in 6 chance wounded enemy dies of sepsis."}]', '[]', 0, 30, false, false, '2026-01-11 22:03:03.061052', '2026-01-11 22:03:03.061052', '[]');
INSERT INTO public.characters VALUES ('c8abf64f-c622-4033-a37c-a5e6f213eee0', 'Skura', 2, 'body.4', 'habits.12', 'tales.6', 'traits.20', 'traits.7', 'origins.gutterborn_scum.3', 8, 9, 12, 14, 4, 4, 1, 1, '[{"key": "equipment.fernors-philtre"}, {"key": "scroll.sacred.1"}, {"key": "equipment.firesteel"}]', '[{"key": "weapons.warhammer"}]', '{"key": "armor.fur"}', '[{"name": "Stealthy", "description": "All Presence and Agility tests have their DR reduced by 2."}, {"name": "Filthy Fingersmith", "gainItem": "Metal file and lockpicks", "description": "Pickpocket and lockpick at DR8 Agility."}]', '[]', 0, 20, false, false, '2026-01-11 22:03:09.034538', '2026-01-11 22:03:09.034538', '[]');
INSERT INTO public.characters VALUES ('867320e9-1a86-47c8-8bcf-05d1d748574f', 'Rankor', 6, 'body.20', 'habits.20', 'tales.20', 'traits.13', 'traits.9', 'origins.occult_herbmaster.1', 11, 10, 4, 7, 3, 3, 2, 2, '[{"key": "equipment.scissors"}, {"key": "equipment.southern-frog"}, {"key": "equipment.torches"}]', '[{"key": "weapons.femur"}]', '{"key": "armor.padded-cloth"}', '[{"name": "Portable Laboratory", "description": "Daily create 2 random decoctions, d4 doses total. Expire after 24 hours."}, {"name": "Decoctions Available", "description": "Red Poison, Ezumiel''s Vapor, Southern Frog, Elixir Vitalis, Spider-Owl Soup, Fernors Philtre, Hyphoss Snuff, Black Poison"}]', '[]', 0, 70, false, false, '2026-01-11 22:03:29.993679', '2026-01-11 22:03:29.993679', '[]');
INSERT INTO public.characters VALUES ('7cfdfab9-2838-456d-90f6-f43d07499a44', 'Lagorm', 2, 'body.7', 'habits.16', 'tales.12', 'traits.16', 'traits.11', 'origins.gutterborn_scum.5', 10, 9, 6, 11, 1, 1, 1, 1, '[]', '[]', NULL, '[{"name": "Stealthy", "description": "All Presence and Agility tests have their DR reduced by 2."}, {"name": "Abominable Gob Lobber", "description": "Spit d2 times per fight at DR8 Presence. Targets blinded d4 rounds."}]', '[]', 0, 10, false, false, '2026-01-11 22:12:30.229692', '2026-01-11 22:12:30.229692', '[]');
INSERT INTO public.characters VALUES ('9fc40d55-b105-4d22-8baf-76d0fbdc8613', 'Graft', 4, 'body.6', 'habits.9', 'tales.1', 'traits.1', 'traits.3', 'origins.wretched_royalty.3', 8, 7, 10, 8, 4, 4, 2, 2, '[{"key": "scroll.unclean.8"}, {"key": "equipment.red-poison"}]', '[{"key": "equipment.bomb"}, {"key": "weapons.shortsword"}]', '{"key": "armor.fur"}', '[{"name": "Barbarister the Incredible Horse", "gainPet": "Barbarister the Incredible Horse", "description": "Magical, intelligent, arrogant talking horse. Sometimes +2 to logic tests."}, {"name": "The Snake-Skin Gift", "gainItem": "The Snake-Skin Gift", "description": "Dagger does d4 damage, on 1 target dies of poison."}]', '[]', 0, 110, false, false, '2026-01-11 22:12:30.363976', '2026-01-11 22:12:30.363976', '[]');
INSERT INTO public.characters VALUES ('9b6544ff-9e6a-4f09-a8d5-2cccb39c1fba', 'Numtor', 5, 'body.18', 'habits.11', 'tales.4', 'traits.8', 'traits.9', 'origins.heretical_priest.5', 7, 16, 13, 7, 6, 6, 1, 1, '[{"key": "scroll.unclean.5"}, {"key": "equipment.torches"}, {"key": "scroll.sacred.2"}]', '[{"key": "weapons.staff"}]', '{"key": "armor.leather"}', '[{"name": "Sacred Shepherd''s Crook", "gainItem": "Sacred Shepherd''s Crook", "description": "Staff does 2d4 damage except to faithless humans."}]', '[]', 0, 90, false, false, '2026-01-11 22:16:05.443559', '2026-01-11 22:16:05.443559', '[]');
INSERT INTO public.characters VALUES ('6a5f539c-88fb-43a2-9879-e47d8d5520df', 'Belum', 6, 'body.5', 'habits.17', 'tales.1', 'traits.19', 'traits.13', 'origins.occult_herbmaster.3', 6, 15, 9, 12, 2, 2, 1, 1, '[{"key": "scroll.sacred.4"}, {"key": "equipment.sharp-needle"}]', '[{"key": "equipment.bomb"}, {"key": "weapons.warhammer"}]', '{"key": "armor.padded-cloth"}', '[{"name": "Portable Laboratory", "description": "Daily create 2 random decoctions, d4 doses total. Expire after 24 hours."}, {"name": "Decoctions Available", "description": "Red Poison, Ezumiel''s Vapor, Southern Frog, Elixir Vitalis, Spider-Owl Soup, Fernors Philtre, Hyphoss Snuff, Black Poison"}]', '[]', 0, 80, false, false, '2026-01-11 22:16:22.915934', '2026-01-11 22:16:22.915934', '[]');
INSERT INTO public.characters VALUES ('1cf6327d-c34d-42e9-bb26-c66a11129e15', 'Snott', 6, 'body.18', 'habits.6', 'tales.3', 'traits.16', 'traits.1', 'origins.occult_herbmaster.4', 10, 14, 10, 13, 5, 5, 2, 2, '[{"key": "equipment.chewing-tobacco"}, {"key": "scroll.unclean.6"}, {"key": "scroll.unclean.5"}]', '[{"key": "weapons.femur"}]', '{"key": "armor.fur"}', '[{"key": "abilities.occult_herbmaster.decoctions"}]', '[]', 0, 70, false, false, '2026-01-11 22:24:39.245226', '2026-01-11 22:24:39.245226', '[]');
INSERT INTO public.characters VALUES ('b98f3cd3-d804-4bb4-bf34-859e7f0237d4', 'Kulmar', 4, 'body.19', 'habits.7', 'tales.15', 'traits.4', 'traits.17', 'origins.wretched_royalty.3', 6, 10, 11, 14, 5, 5, 2, 2, '[{"key": "equipment.sharp-needle"}, {"key": "equipment.magnesium-strip"}, {"key": "equipment.red-poison"}]', '[{"key": "weapons.knife"}]', '{"key": "armor.fur"}', '[{"name": "Horn of the Schleswig Lords", "description": "Once daily, DR12 Presence for automatic success on next non-combat test."}, {"name": "Horn of the Schleswig Lords", "description": "Once daily, DR12 Presence for automatic success on next non-combat test."}]', '[]', 0, 190, false, false, '2026-01-11 22:03:30.194926', '2026-01-11 23:25:22.28509', '[]');
INSERT INTO public.characters VALUES ('8060a314-fcce-45c4-81be-4dce634b8a60', 'Mirthgin', 5, 'body.16', 'habits.18', 'tales.13', 'traits.4', 'traits.14', 'origins.heretical_priest.2', 7, 9, 17, 9, 1, 1, 2, 2, '[]', '[]', NULL, '[{"key": "abilities.heretical_priest.sinner"}, {"key": "abilities.heretical_priest.breath"}]', '[]', 0, 130, false, false, '2026-01-12 06:00:33.975643', '2026-01-12 06:00:33.975643', '[]');
INSERT INTO public.characters VALUES ('ca496b51-8d26-4b13-9cf4-5d14d56cf09e', 'Niduk', 2, 'body.12', 'habits.14', 'tales.19', 'traits.20', 'traits.19', 'origins.gutterborn_scum.3', 11, 5, 12, 13, 6, 6, 1, 1, '[]', '[]', NULL, '[{"key": "abilities.gutterborn_scum.stealthy"}, {"key": "abilities.gutterborn_scum.poison"}]', '[]', 0, 10, false, false, '2026-01-12 06:00:34.275083', '2026-01-12 06:00:34.275083', '[]');
INSERT INTO public.characters VALUES ('943c55a0-109e-46bc-88ad-f2c3e388f992', 'Vrakh', 4, 'body.10', 'habits.19', 'tales.20', 'traits.12', 'traits.10', 'origins.wretched_royalty.5', 9, 11, 11, 13, 4, 4, 2, 2, '[]', '[]', NULL, '[{"key": "abilities.wretched_royalty.servant"}, {"key": "abilities.wretched_royalty.horse"}, {"key": "abilities.wretched_royalty.horse"}]', '[]', 0, 140, false, false, '2026-01-12 21:12:29.512172', '2026-01-12 21:12:29.512172', '[]');
INSERT INTO public.characters VALUES ('61fe7b4f-cd0f-4038-abeb-03cf9ff5c741', 'Rot', 5, 'body.8', 'habits.3', 'tales.9', 'traits.3', 'traits.13', 'origins.heretical_priest.5', 6, 14, 15, 12, 1, 1, 2, 2, '[]', '[]', NULL, '[{"key": "abilities.heretical_priest.sinner"}, {"key": "abilities.heretical_priest.beak"}]', '[]', 0, 140, false, false, '2026-01-12 21:12:29.555601', '2026-01-12 21:12:29.555601', '[]');
INSERT INTO public.characters VALUES ('a3824090-15fc-4488-b4c0-9246fc94ad39', 'Karg', 3, 'body.4', 'habits.15', 'tales.20', 'traits.2', 'traits.12', 'origins.esoteric_hermit.1', 9, 6, 12, 5, 2, 2, 1, 1, '[]', '[]', NULL, '[{"key": "abilities.esoteric_hermit.scrolls"}, {"key": "abilities.esoteric_hermit.bird"}]', '[]', 0, 20, false, false, '2026-01-12 22:03:22.369774', '2026-01-12 22:03:22.369774', '[]');
INSERT INTO public.characters VALUES ('7d222f30-a323-46d9-b9b6-df3ee886e69b', 'Miron', 6, 'body.6', 'habits.8', 'tales.18', 'traits.13', 'traits.9', 'origins.occult_herbmaster.6', 6, 7, 14, 20, 5, 5, 1, 1, '[{"key": "scroll.sacred.2"}, {"key": "equipment.mirror"}, {"key": "equipment.sack"}]', '[{"key": "weapons.femur"}]', '{"key": "armor.fur"}', '[{"key": "abilities.occult_herbmaster.decoctions"}]', '[]', 0, 120, false, false, '2026-01-12 22:03:53.607259', '2026-01-12 22:03:53.607259', '[]');
INSERT INTO public.characters VALUES ('f2d38686-c6dd-40dc-9696-c03d2058ed75', 'Eglom', 3, 'body.3', 'habits.10', 'tales.7', 'traits.10', 'traits.8', 'origins.esoteric_hermit.1', 10, 9, 15, 11, 2, 2, 2, 2, '[]', '[]', NULL, '[{"key": "abilities.esoteric_hermit.scrolls"}, {"key": "abilities.esoteric_hermit.ash"}]', '[]', 0, 20, false, false, '2026-01-12 22:08:52.855644', '2026-01-12 22:08:52.855644', '[]');
INSERT INTO public.characters VALUES ('5622793f-a8be-4129-9bd8-4c1d1899d637', 'Snott', 1, 'body.16', 'habits.2', 'tales.7', 'traits.18', 'traits.20', 'origins.fanged_deserter.1', 12, 12, 9, 11, 10, 10, 2, 2, '[{"key": "scroll.unclean.2"}, {"key": "equipment.heavy-chain"}, {"key": "scroll.sacred.3"}]', '[{"key": "weapons.sword"}]', '{"key": "armor.leather"}', '[{"key": "abilities.fanged_deserter.clumsy"}, {"key": "abilities.fanged_deserter.bite"}, {"key": "abilities.fanged_deserter.sling"}]', '[]', 0, 30, false, false, '2026-01-12 22:09:02.920839', '2026-01-12 22:09:02.920839', '[]');
INSERT INTO public.characters VALUES ('dd54a5e8-a888-4289-91ee-a82f35ce701c', 'Nedrigg', 4, 'body.7', 'habits.4', 'tales.1', 'traits.1', 'traits.11', 'origins.wretched_royalty.3', 12, 9, 7, 14, 2, 2, 1, 1, '[{"key": "equipment.black-poison"}, {"key": "equipment.silver-crucifix"}, {"key": "equipment.mirror"}]', '[{"key": "weapons.warhammer"}]', '{"key": "armor.mail"}', '[{"key": "abilities.wretched_royalty.servant"}, {"key": "abilities.wretched_royalty.squire"}, {"key": "abilities.wretched_royalty.horse"}]', '[]', 0, 80, false, false, '2026-01-12 22:09:39.0676', '2026-01-12 22:09:39.0676', '[]');
INSERT INTO public.characters VALUES ('dd92e093-7c90-4926-aa74-4ac2f8198b3e', 'Torbe', 1, 'body.14', 'habits.9', 'tales.9', 'traits.14', 'traits.10', 'origins.fanged_deserter.6', 13, 7, 9, 8, 8, 8, 2, 2, '[]', '[]', NULL, '[{"key": "abilities.fanged_deserter.clumsy"}, {"key": "abilities.fanged_deserter.bite"}, {"key": "abilities.fanged_deserter.scimitar"}]', '[]', 0, 80, false, false, '2026-01-12 22:09:48.026921', '2026-01-12 22:09:48.026921', '[]');
INSERT INTO public.characters VALUES ('e17df620-2a88-4223-a0d1-fb7582ee1fc1', 'Parthos', 3, 'body.19', 'habits.13', 'tales.14', 'traits.2', 'traits.8', 'origins.esoteric_hermit.2', 13, 12, 12, 14, 4, 4, 1, 1, '[{"key": "scroll.sacred.6"}, {"key": "equipment.red-poison"}, {"key": "equipment.exquisite-perfume"}]', '[{"key": "weapons.shortsword"}]', '{"key": "armor.leather"}', '[{"key": "abilities.esoteric_hermit.scrolls"}, {"key": "abilities.esoteric_hermit.staff"}]', '[]', 0, 10, false, false, '2026-01-12 22:09:57.291265', '2026-01-12 22:09:57.291265', '[]');
INSERT INTO public.characters VALUES ('a3b19737-ae01-4ac7-b56d-b24251ae39e4', 'Prügl', 6, 'body.10', 'habits.2', 'tales.11', 'traits.5', 'traits.9', 'origins.occult_herbmaster.1', 5, 12, 5, 11, 3, 3, 1, 1, '[{"key": "equipment.chalk"}, {"key": "equipment.lantern"}, {"key": "equipment.sack"}]', '[{"key": "weapons.sword"}]', '{"key": "armor.leather"}', '[{"key": "abilities.occult_herbmaster.decoctions"}]', '[]', 0, 90, false, false, '2026-01-12 22:10:06.156544', '2026-01-12 22:10:06.156544', '[]');
INSERT INTO public.characters VALUES ('3d266beb-23ce-40f8-94c6-06c14f68bcf5', 'Katla', 3, 'body.4', 'habits.8', 'tales.11', 'traits.18', 'traits.1', 'origins.esoteric_hermit.6', 15, 5, 11, 11, 1, 1, 2, 2, '[{"key": "equipment.sack"}, {"key": "equipment.chewing-tobacco"}, {"key": "equipment.salt"}]', '[{"key": "weapons.femur"}]', '{"key": "armor.fur"}', '[{"key": "abilities.esoteric_hermit.scrolls"}, {"key": "abilities.esoteric_hermit.book"}]', '[]', 0, 20, false, false, '2026-01-12 22:10:12.909646', '2026-01-12 22:10:12.909646', '[]');
INSERT INTO public.characters VALUES ('70b25466-3bdf-4dac-8f59-908e52f61aa0', 'Sator', 1, 'body.13', 'habits.6', 'tales.18', 'traits.17', 'traits.8', 'origins.fanged_deserter.2', 10, 9, 8, 14, 3, 3, 1, 1, '[{"key": "equipment.tent"}, {"key": "equipment.grappling-hook"}, {"key": "scroll.unclean.8"}]', '[{"key": "weapons.femur"}]', '{"key": "armor.padded-cloth"}', '[{"key": "abilities.fanged_deserter.clumsy"}, {"key": "abilities.fanged_deserter.bite"}, {"key": "abilities.fanged_deserter.teeth"}]', '[]', 0, 60, false, false, '2026-01-12 22:10:19.995024', '2026-01-12 22:10:19.995024', '[]');
INSERT INTO public.characters VALUES ('0f168de2-605a-4971-b073-7adf8229d115', 'Hirmot', 3, 'body.13', 'habits.16', 'tales.17', 'traits.18', 'traits.13', 'origins.esoteric_hermit.5', 8, 14, 13, 5, 1, 1, 2, 2, '[{"key": "scroll.sacred.1"}, {"key": "equipment.firesteel"}, {"key": "scroll.unclean.5"}]', '[{"key": "weapons.knife"}]', '{"key": "armor.fur"}', '[{"key": "abilities.esoteric_hermit.scrolls"}, {"key": "abilities.esoteric_hermit.skin"}]', '[]', 0, 10, false, false, '2026-01-12 22:16:17.817888', '2026-01-12 22:16:17.817888', '[]');


--
-- Data for Name: classes; Type: TABLE DATA; Schema: public; Owner: p1002_scmgrinder
--

INSERT INTO public.classes VALUES (3, 'Esoteric Hermit', 3, 'The stone of your cave is one with the stars. Silence and perfection. Now the chaos of a fallen world disturbs your rituals.', 4, 4, 2, '{6}', 10, '{"agility": 0, "presence": 2, "strength": -2, "toughness": 0}', '[]', '[{"name": "Master of Fate", "description": "Know the right way with a DR8 Presence test."}, {"name": "A Book of Boiling Blood", "description": "Once daily summon D2 Berserker-slayers. D6 roll: 1-4 fight for you, 5-6 attack you."}, {"name": "Speaker of Truths", "description": "Twice daily lower next test DR by 4 for a creature."}, {"name": "Initiate of the Invisible College", "description": "Once daily summon D2 scrolls (sacred or unclean)."}, {"name": "Bard of the Undying", "description": "Harp music gives +D4 on reaction rolls."}, {"name": "Hawk as Weapon", "gainPet": "Hawk", "description": "Loyal hawk. DR10 attack/defence, d4 damage, 8 HP."}]', 1, 'classes.esoteric_hermit.name', 'classes.esoteric_hermit.description');
INSERT INTO public.classes VALUES (1, 'Fanged Deserter', 1, 'You have thirty or so friends who never let you down: YOUR TEETH. Disloyal, deranged or simply uncontrollable, any group that didn''t boot you out you left anyway.', 10, 10, 4, '{6,6}', 10, '{"agility": -1, "presence": -1, "strength": 2, "toughness": 0}', '[{"name": "Clumsy and Dull-witted", "description": "Agility tests are DR+2, excluding defence. You are incapable of understanding scrolls."}, {"name": "Bite Attack", "description": "DR10 to attack, d6 damage. You must be close to your target."}]', '[{"name": "Crumpled Monster Mask", "description": "Strikes primitive fear into lesser creatures like goblins and children."}, {"name": "The Brown Scimitar of Galgenbeck", "gainItem": "The Brown Scimitar of Galgenbeck", "description": "A stinking sword. D6 damage. 1 in 6 chance wounded enemy dies of sepsis."}, {"name": "Wizard Teeth", "description": "Four weird teeth in a pouch. Roll d6 for each before battle, on 6 one attack deals max damage."}, {"name": "Old Sigürd''s Sling", "gainItem": "Old Sigürd''s Sling", "description": "Woven from hair, 2d4 damage with fist-sized rocks."}, {"name": "Ancient Gore-Hound", "gainPet": "Ancient Gore-Hound", "description": "Asthmatic hound with superb nose. DR10 attack (d6), DR12 defence, 10 HP."}, {"name": "The Shoe of Death''s Horse", "gainItem": "The Shoe of Death''s Horse", "description": "DR10, d4 damage. 1 in 6 instant kill on small-medium creatures. Returns like boomerang."}]', 1, 'classes.fanged_deserter.name', 'classes.fanged_deserter.description');
INSERT INTO public.classes VALUES (2, 'Gutterborn Scum', 2, 'An ill star smiled upon your birth. Poverty, crime and bad parenting didn''t help either. A razor blade and a moonless night are worth a week of chump-work.', 6, 6, 2, '{6}', 10, '{"agility": 0, "presence": 0, "strength": -2, "toughness": 0}', '[{"name": "Stealthy", "description": "All Presence and Agility tests have their DR reduced by 2."}]', '[{"name": "Coward''s Jab", "description": "When attacking by surprise, DR10 Agility for auto-hit with +3 damage."}, {"name": "Filthy Fingersmith", "gainItem": "Metal file and lockpicks", "description": "Pickpocket and lockpick at DR8 Agility."}, {"name": "Abominable Gob Lobber", "description": "Spit d2 times per fight at DR8 Presence. Targets blinded d4 rounds."}, {"name": "Escaping Fate", "description": "50% chance omens are not spent when used."}, {"name": "Excretal Stealth", "description": "DR16 Presence to spot you when hidden in muck."}, {"name": "Dodging Death", "description": "50% chance to survive death with d4 HP after 10 rounds."}]', 1, 'classes.gutterborn_scum.name', 'classes.gutterborn_scum.description');
INSERT INTO public.classes VALUES (4, 'Wretched Royalty', 4, 'Bowed down only by the memories of your own lost glory, you could never submit to anyone else. Not you, of noble blood!', 6, 8, 3, '{6,6,6,6}', 10, '{"agility": 0, "presence": 0, "strength": 0, "toughness": 0}', '[]', '[{"name": "The Blade of your Ancestors", "gainItem": "The Blade of your Ancestors", "description": "Talking sword, foppish and unreliable. D6+1 damage, DR10. 1 in 6 chance to attack you."}, {"name": "Poltroon the Court Jester", "gainPet": "Poltroon the Court Jester", "description": "Irritating but +2 attack/defence for first 2 rounds."}, {"name": "Barbarister the Incredible Horse", "gainPet": "Barbarister the Incredible Horse", "description": "Magical, intelligent, arrogant talking horse. Sometimes +2 to logic tests."}, {"name": "Hamfund the Squire", "gainPet": "Hamfund the Squire", "description": "Cowardly squire guards Eurekia sword. 2d6 damage but 1 in 6 kills squire."}, {"name": "The Snake-Skin Gift", "gainItem": "The Snake-Skin Gift", "description": "Dagger does d4 damage, on 1 target dies of poison."}, {"name": "Horn of the Schleswig Lords", "description": "Once daily, DR12 Presence for automatic success on next non-combat test."}]', 2, 'classes.wretched_royalty.name', 'classes.wretched_royalty.description');
INSERT INTO public.classes VALUES (5, 'Heretical Priest', 5, 'Hunted by the Two-Headed Basilisks of the One True Faith, you can be found raving in ruins and desecrating cathedrals by night.', 8, 8, 4, '{6,6,6}', 10, '{"agility": 0, "presence": 2, "strength": -2, "toughness": 0}', '[]', '[{"name": "Sacred Shepherd''s Crook", "gainItem": "Sacred Shepherd''s Crook", "description": "Staff does 2d4 damage except to faithless humans."}, {"name": "Stolen Mitre", "description": "Defence DR10, stealth DR8 when pulled over ears."}, {"name": "List of Sins", "description": "DR10 Presence to reveal evil creatures, +2 defence against them."}, {"name": "The Blasphemous Nechrubel Bible", "description": "Daily read: even roll heals d4 HP after 5 min rest, odd roll causes hallucinations."}, {"name": "Stones from Thel-Emas'' Lost Temple", "description": "Cast to reveal danger in adjacent room. DR10 Presence to verify truth."}, {"name": "Crucifix of the Inverted Christ", "description": "Check morale on undead, trolls, goblins to make them leave."}]', 1, 'classes.heretical_priest.name', 'classes.heretical_priest.description');
INSERT INTO public.classes VALUES (6, 'Occult Herbmaster', 6, 'Born of the mushroom, raised in the glade, watched by the eye of the moon in a silverblack pool.', 6, 6, 2, '{6,6}', 10, '{"agility": 0, "presence": 0, "strength": -2, "toughness": 2}', '[{"name": "Portable Laboratory", "description": "Daily create 2 random decoctions, d4 doses total. Expire after 24 hours."}, {"name": "Decoctions Available", "description": "Red Poison, Ezumiel''s Vapor, Southern Frog, Elixir Vitalis, Spider-Owl Soup, Fernors Philtre, Hyphoss Snuff, Black Poison"}]', '[]', 0, 'classes.occult_herbmaster.name', 'classes.occult_herbmaster.description');


--
-- Data for Name: equipment; Type: TABLE DATA; Schema: public; Owner: p1002_scmgrinder
--

INSERT INTO public.equipment VALUES (1, 'equipment.backpack', '{carry}', NULL, NULL, NULL, NULL, NULL, NULL, 6, false, NULL, 1, NULL, NULL, NULL);
INSERT INTO public.equipment VALUES (2, 'equipment.sack', '{carry}', NULL, NULL, NULL, NULL, NULL, NULL, 3, false, NULL, 1, NULL, NULL, NULL);
INSERT INTO public.equipment VALUES (3, 'equipment.small-wagon', '{carry}', NULL, NULL, NULL, NULL, NULL, NULL, 25, false, NULL, 1, NULL, NULL, NULL);
INSERT INTO public.equipment VALUES (4, 'equipment.donkey', '{carry}', NULL, NULL, NULL, NULL, NULL, NULL, 10, false, NULL, 1, NULL, NULL, NULL);
INSERT INTO public.equipment VALUES (5, 'equipment.rope', '{tool}', NULL, NULL, NULL, NULL, NULL, NULL, 4, false, NULL, 1, NULL, NULL, NULL);
INSERT INTO public.equipment VALUES (6, 'equipment.blanket', '{camping}', NULL, NULL, NULL, NULL, NULL, NULL, 4, false, NULL, 1, NULL, NULL, NULL);
INSERT INTO public.equipment VALUES (7, 'equipment.torches', '{tool,lighting,consumable}', NULL, NULL, 'presence', NULL, NULL, NULL, 2, false, NULL, 1, 'Torch', 6, '{"lose": "Torch", "text": "You light your torch", "type": "MultiUse"}');
INSERT INTO public.equipment VALUES (8, 'equipment.lantern', '{tool,metal,lighting,consumable}', NULL, NULL, 'presence', NULL, NULL, NULL, 10, false, NULL, 1, 'Oil', 6, '{"lose": "Oil", "text": "You add oil and light it", "type": "MultiUse"}');
INSERT INTO public.equipment VALUES (9, 'equipment.magnesium-strip', '{tool,consumable}', NULL, NULL, NULL, NULL, NULL, NULL, 4, false, NULL, 1, NULL, NULL, NULL);
INSERT INTO public.equipment VALUES (10, 'equipment.firesteel', '{tool,metal}', NULL, NULL, NULL, NULL, NULL, NULL, 4, false, NULL, 1, NULL, NULL, NULL);
INSERT INTO public.equipment VALUES (11, 'equipment.sharp-needle', '{tool}', NULL, NULL, NULL, NULL, NULL, NULL, 3, false, NULL, 1, NULL, NULL, NULL);
INSERT INTO public.equipment VALUES (12, 'equipment.wooden-crucifix', '{symbol}', NULL, NULL, NULL, NULL, NULL, NULL, 9, false, NULL, 1, NULL, NULL, NULL);
INSERT INTO public.equipment VALUES (13, 'equipment.silver-crucifix', '{symbol,metal}', NULL, NULL, NULL, NULL, NULL, NULL, 60, false, NULL, 1, NULL, NULL, NULL);
INSERT INTO public.equipment VALUES (14, 'equipment.lockpicks', '{tool,metal}', NULL, NULL, NULL, NULL, NULL, NULL, 5, false, NULL, 1, NULL, NULL, NULL);
INSERT INTO public.equipment VALUES (15, 'equipment.manacles', '{tool,metal}', NULL, NULL, NULL, NULL, NULL, NULL, 10, false, NULL, 1, NULL, NULL, NULL);
INSERT INTO public.equipment VALUES (16, 'equipment.toolbox', '{tool,metal}', NULL, NULL, NULL, NULL, NULL, NULL, 20, false, NULL, 1, NULL, NULL, NULL);
INSERT INTO public.equipment VALUES (17, 'equipment.heavy-chain', '{tool,metal}', NULL, NULL, NULL, NULL, NULL, NULL, 10, false, NULL, 1, NULL, NULL, NULL);
INSERT INTO public.equipment VALUES (18, 'equipment.scissors', '{tool,metal}', NULL, NULL, NULL, NULL, NULL, NULL, 9, false, NULL, 1, NULL, NULL, NULL);
INSERT INTO public.equipment VALUES (19, 'equipment.grappling-hook', '{tool,metal}', NULL, NULL, NULL, NULL, NULL, NULL, 12, false, NULL, 1, NULL, NULL, NULL);
INSERT INTO public.equipment VALUES (20, 'equipment.noose', '{tool}', NULL, NULL, NULL, NULL, NULL, NULL, 5, false, NULL, 1, NULL, NULL, NULL);
INSERT INTO public.equipment VALUES (21, 'equipment.tent', '{camping}', NULL, NULL, NULL, NULL, NULL, NULL, 12, false, NULL, 1, NULL, NULL, NULL);
INSERT INTO public.equipment VALUES (22, 'equipment.mirror', '{luxury,metal}', NULL, NULL, NULL, NULL, NULL, NULL, 15, false, NULL, 1, NULL, NULL, NULL);
INSERT INTO public.equipment VALUES (23, 'equipment.exquisite-perfume', '{luxury,consumable}', NULL, NULL, NULL, NULL, NULL, NULL, 25, false, NULL, 1, NULL, NULL, NULL);
INSERT INTO public.equipment VALUES (24, 'equipment.bear-trap', '{trap,metal}', NULL, NULL, NULL, NULL, NULL, NULL, 20, false, NULL, 1, NULL, NULL, NULL);
INSERT INTO public.equipment VALUES (25, 'equipment.lard', '{food,consumable}', NULL, NULL, NULL, NULL, NULL, NULL, 5, false, NULL, 1, NULL, NULL, NULL);
INSERT INTO public.equipment VALUES (26, 'equipment.chewing-tobacco', '{consumable}', NULL, NULL, NULL, NULL, NULL, NULL, 1, false, NULL, 4, NULL, NULL, NULL);
INSERT INTO public.equipment VALUES (27, 'equipment.chalk', '{consumable,tool}', NULL, NULL, NULL, NULL, NULL, NULL, 1, false, NULL, 4, NULL, NULL, NULL);
INSERT INTO public.equipment VALUES (28, 'equipment.salt', '{consumable,tool}', NULL, NULL, NULL, NULL, NULL, NULL, 3, true, NULL, 1, NULL, NULL, NULL);
INSERT INTO public.equipment VALUES (29, 'equipment.medicine-chest', '{consumable,tool,healing}', NULL, NULL, 'presence', NULL, NULL, NULL, 15, false, NULL, 2, NULL, NULL, '{"heal": 6, "type": "SingleUse"}');
INSERT INTO public.equipment VALUES (30, 'equipment.life-elixir', '{healing,consumable}', NULL, NULL, NULL, NULL, NULL, NULL, 15, false, NULL, 1, NULL, NULL, '{"heal": 6, "type": "SingleUse"}');
INSERT INTO public.equipment VALUES (31, 'equipment.red-poison', '{consumable,poison}', NULL, NULL, NULL, NULL, NULL, NULL, 20, false, NULL, 1, NULL, NULL, '{"type": "SingleUse"}');
INSERT INTO public.equipment VALUES (32, 'equipment.black-poison', '{consumable,poison}', NULL, NULL, NULL, NULL, NULL, NULL, 20, false, NULL, 1, NULL, NULL, '{"type": "SingleUse"}');
INSERT INTO public.equipment VALUES (33, 'equipment.bomb', '{weapon,explosive,consumable,ranged}', NULL, NULL, NULL, NULL, NULL, NULL, 40, true, NULL, 1, NULL, NULL, '{"type": "SingleUse", "damage": 10}');
INSERT INTO public.equipment VALUES (34, 'scroll.unclean.1', '{scroll,unclean}', NULL, NULL, NULL, NULL, NULL, NULL, 50, false, 1, 1, NULL, NULL, NULL);
INSERT INTO public.equipment VALUES (35, 'scroll.unclean.2', '{scroll,unclean}', NULL, NULL, NULL, NULL, NULL, NULL, 50, false, 2, 1, NULL, NULL, NULL);
INSERT INTO public.equipment VALUES (36, 'scroll.unclean.3', '{scroll,unclean}', NULL, NULL, NULL, NULL, NULL, NULL, 50, false, 3, 1, NULL, NULL, NULL);
INSERT INTO public.equipment VALUES (37, 'scroll.unclean.4', '{scroll,unclean}', NULL, NULL, NULL, NULL, NULL, NULL, 50, false, 4, 1, NULL, NULL, NULL);
INSERT INTO public.equipment VALUES (38, 'scroll.unclean.5', '{scroll,unclean}', NULL, NULL, NULL, NULL, NULL, NULL, 50, false, 5, 1, NULL, NULL, NULL);
INSERT INTO public.equipment VALUES (39, 'scroll.unclean.6', '{scroll,unclean}', NULL, NULL, NULL, NULL, NULL, NULL, 50, false, 6, 1, NULL, NULL, NULL);
INSERT INTO public.equipment VALUES (40, 'scroll.unclean.7', '{scroll,unclean}', NULL, NULL, NULL, NULL, NULL, NULL, 50, false, 7, 1, NULL, NULL, NULL);
INSERT INTO public.equipment VALUES (41, 'scroll.unclean.8', '{scroll,unclean}', NULL, NULL, NULL, NULL, NULL, NULL, 50, false, 8, 1, NULL, NULL, NULL);
INSERT INTO public.equipment VALUES (42, 'scroll.unclean.9', '{scroll,unclean}', NULL, NULL, NULL, NULL, NULL, NULL, 50, false, 9, 1, NULL, NULL, NULL);
INSERT INTO public.equipment VALUES (43, 'scroll.unclean.10', '{scroll,unclean}', NULL, NULL, NULL, NULL, NULL, NULL, 50, false, 10, 1, NULL, NULL, NULL);
INSERT INTO public.equipment VALUES (44, 'scroll.sacred.1', '{scroll,sacred}', NULL, NULL, NULL, NULL, NULL, NULL, 50, false, 1, 1, NULL, NULL, NULL);
INSERT INTO public.equipment VALUES (45, 'scroll.sacred.2', '{scroll,sacred}', NULL, NULL, NULL, NULL, NULL, NULL, 50, false, 2, 1, NULL, NULL, NULL);
INSERT INTO public.equipment VALUES (46, 'scroll.sacred.3', '{scroll,sacred}', NULL, NULL, NULL, NULL, NULL, NULL, 50, false, 3, 1, NULL, NULL, NULL);
INSERT INTO public.equipment VALUES (47, 'scroll.sacred.4', '{scroll,sacred}', NULL, NULL, NULL, NULL, NULL, NULL, 50, false, 4, 1, NULL, NULL, NULL);
INSERT INTO public.equipment VALUES (48, 'scroll.sacred.5', '{scroll,sacred}', NULL, NULL, NULL, NULL, NULL, NULL, 50, false, 5, 1, NULL, NULL, NULL);
INSERT INTO public.equipment VALUES (49, 'scroll.sacred.6', '{scroll,sacred}', NULL, NULL, NULL, NULL, NULL, NULL, 50, false, 6, 1, NULL, NULL, NULL);
INSERT INTO public.equipment VALUES (50, 'scroll.sacred.7', '{scroll,sacred}', NULL, NULL, NULL, NULL, NULL, NULL, 50, false, 7, 1, NULL, NULL, NULL);
INSERT INTO public.equipment VALUES (51, 'scroll.sacred.8', '{scroll,sacred}', NULL, NULL, NULL, NULL, NULL, NULL, 50, false, 8, 1, NULL, NULL, NULL);
INSERT INTO public.equipment VALUES (52, 'scroll.sacred.9', '{scroll,sacred}', NULL, NULL, NULL, NULL, NULL, NULL, 50, false, 9, 1, NULL, NULL, NULL);
INSERT INTO public.equipment VALUES (53, 'scroll.sacred.10', '{scroll,sacred}', NULL, NULL, NULL, NULL, NULL, NULL, 50, false, 10, 1, NULL, NULL, NULL);
INSERT INTO public.equipment VALUES (54, 'equipment.ezumiel-vapor', '{consumable,decoction}', NULL, NULL, NULL, NULL, NULL, NULL, 0, false, NULL, 1, NULL, NULL, '{"type": "SingleUse", "effectDie": 4}');
INSERT INTO public.equipment VALUES (55, 'equipment.southern-frog', '{consumable,decoction}', NULL, NULL, NULL, NULL, NULL, NULL, 0, false, NULL, 1, NULL, NULL, '{"type": "SingleUse", "effectDie": 4}');
INSERT INTO public.equipment VALUES (56, 'equipment.elixir-vitalis', '{consumable,decoction}', NULL, NULL, NULL, NULL, NULL, NULL, 0, false, NULL, 1, NULL, NULL, '{"heal": 6, "type": "SingleUse"}');
INSERT INTO public.equipment VALUES (57, 'equipment.spider-owl-soup', '{consumable,decoction}', NULL, NULL, NULL, NULL, NULL, NULL, 0, false, NULL, 1, NULL, NULL, '{"type": "SingleUse"}');
INSERT INTO public.equipment VALUES (58, 'equipment.fernors-philtre', '{consumable,decoction}', NULL, NULL, NULL, NULL, NULL, NULL, 0, false, NULL, 1, NULL, NULL, '{"type": "SingleUse", "effectDie": 4}');
INSERT INTO public.equipment VALUES (59, 'equipment.hyphos-snuff', '{consumable,decoction}', NULL, NULL, NULL, NULL, NULL, NULL, 0, false, NULL, 1, NULL, NULL, '{"type": "SingleUse", "statuses": [{"value": -2, "source": "Hyphos snuff", "exclude": ["ability", "heal", "ranged", "melee", "cast"], "statistic": "agility"}]}');


--
-- Data for Name: habits; Type: TABLE DATA; Schema: public; Owner: p1002_scmgrinder
--

INSERT INTO public.habits VALUES (1, 'habits.1', 1, false, '[{"ammo": {"type": "Stone", "startWith": 66}, "name": "Sackcloth bag", "tags": ["habit-item"], "description": "filled with sharp stones"}]');
INSERT INTO public.habits VALUES (2, 'habits.2', 2, false, '[]');
INSERT INTO public.habits VALUES (3, 'habits.3', 3, false, '[]');
INSERT INTO public.habits VALUES (4, 'habits.4', 4, false, '[]');
INSERT INTO public.habits VALUES (5, 'habits.5', 5, false, '[]');
INSERT INTO public.habits VALUES (6, 'habits.6', 6, false, '[]');
INSERT INTO public.habits VALUES (7, 'habits.7', 7, false, '[{"name": "Skull", "tags": ["useless"], "description": "a trusted friend"}]');
INSERT INTO public.habits VALUES (8, 'habits.8', 8, false, '[]');
INSERT INTO public.habits VALUES (9, 'habits.9', 9, false, '[]');
INSERT INTO public.habits VALUES (10, 'habits.10', 10, false, '[]');
INSERT INTO public.habits VALUES (11, 'habits.11', 11, false, '[]');
INSERT INTO public.habits VALUES (12, 'habits.12', 12, false, '[]');
INSERT INTO public.habits VALUES (13, 'habits.13', 13, false, '[]');
INSERT INTO public.habits VALUES (14, 'habits.14', 14, false, '[]');
INSERT INTO public.habits VALUES (15, 'habits.15', 15, false, '[]');
INSERT INTO public.habits VALUES (16, 'habits.16', 16, false, '[]');
INSERT INTO public.habits VALUES (17, 'habits.17', 17, false, '[]');
INSERT INTO public.habits VALUES (18, 'habits.18', 18, false, '[]');
INSERT INTO public.habits VALUES (19, 'habits.19', 19, false, '[]');
INSERT INTO public.habits VALUES (20, 'habits.20', 20, false, '[{"name": "String necklace", "tags": ["useless"], "description": "most of the teeth are mismatched..."}]');


--
-- Data for Name: names; Type: TABLE DATA; Schema: public; Owner: p1002_scmgrinder
--

INSERT INTO public.names VALUES (1, 'Aerg-Tval');
INSERT INTO public.names VALUES (2, 'Agn');
INSERT INTO public.names VALUES (3, 'Arvant');
INSERT INTO public.names VALUES (4, 'Belsum');
INSERT INTO public.names VALUES (5, 'Belum');
INSERT INTO public.names VALUES (6, 'Brinta');
INSERT INTO public.names VALUES (7, 'Börda');
INSERT INTO public.names VALUES (8, 'Daeru');
INSERT INTO public.names VALUES (9, 'Eldar');
INSERT INTO public.names VALUES (10, 'Felban');
INSERT INTO public.names VALUES (11, 'Gotven');
INSERT INTO public.names VALUES (12, 'Graft');
INSERT INTO public.names VALUES (13, 'Grin');
INSERT INTO public.names VALUES (14, 'Grittr');
INSERT INTO public.names VALUES (15, 'Haerü');
INSERT INTO public.names VALUES (16, 'Hargha');
INSERT INTO public.names VALUES (17, 'Harmug');
INSERT INTO public.names VALUES (18, 'Jotna');
INSERT INTO public.names VALUES (19, 'Karg');
INSERT INTO public.names VALUES (20, 'Karva');
INSERT INTO public.names VALUES (21, 'Katla');
INSERT INTO public.names VALUES (22, 'Keftar');
INSERT INTO public.names VALUES (23, 'Klort');
INSERT INTO public.names VALUES (24, 'Kratar');
INSERT INTO public.names VALUES (25, 'Kutz');
INSERT INTO public.names VALUES (26, 'Kvetin');
INSERT INTO public.names VALUES (27, 'Lygan');
INSERT INTO public.names VALUES (28, 'Margar');
INSERT INTO public.names VALUES (29, 'Merkari');
INSERT INTO public.names VALUES (30, 'Nagl');
INSERT INTO public.names VALUES (31, 'Niduk');
INSERT INTO public.names VALUES (32, 'Nifehl');
INSERT INTO public.names VALUES (33, 'Prügl');
INSERT INTO public.names VALUES (34, 'Qillnach');
INSERT INTO public.names VALUES (35, 'Risten');
INSERT INTO public.names VALUES (36, 'Svind');
INSERT INTO public.names VALUES (37, 'Theras');
INSERT INTO public.names VALUES (38, 'Therg');
INSERT INTO public.names VALUES (39, 'Torvul');
INSERT INTO public.names VALUES (40, 'Törn');
INSERT INTO public.names VALUES (41, 'Urm');
INSERT INTO public.names VALUES (42, 'Urvarg');
INSERT INTO public.names VALUES (43, 'Vagal');
INSERT INTO public.names VALUES (44, 'Vatan');
INSERT INTO public.names VALUES (45, 'Von');
INSERT INTO public.names VALUES (46, 'Vrakh');
INSERT INTO public.names VALUES (47, 'Vresi');
INSERT INTO public.names VALUES (48, 'Wemut');
INSERT INTO public.names VALUES (49, 'Achard');
INSERT INTO public.names VALUES (50, 'Allram');
INSERT INTO public.names VALUES (51, 'Alwrig');
INSERT INTO public.names VALUES (52, 'Ansgot');
INSERT INTO public.names VALUES (53, 'Aren');
INSERT INTO public.names VALUES (54, 'Arga');
INSERT INTO public.names VALUES (55, 'Arundel');
INSERT INTO public.names VALUES (56, 'Aslan');
INSERT INTO public.names VALUES (57, 'Ator');
INSERT INTO public.names VALUES (58, 'Azor');
INSERT INTO public.names VALUES (59, 'Balfyr');
INSERT INTO public.names VALUES (60, 'Belmis');
INSERT INTO public.names VALUES (61, 'Belsnickel');
INSERT INTO public.names VALUES (62, 'Benzen');
INSERT INTO public.names VALUES (63, 'Beörn');
INSERT INTO public.names VALUES (64, 'Bigred');
INSERT INTO public.names VALUES (65, 'Bigtun');
INSERT INTO public.names VALUES (66, 'Blotra');
INSERT INTO public.names VALUES (67, 'Blotvar');
INSERT INTO public.names VALUES (68, 'Blygr');
INSERT INTO public.names VALUES (69, 'Brom');
INSERT INTO public.names VALUES (70, 'Bölbeck');
INSERT INTO public.names VALUES (71, 'Carax');
INSERT INTO public.names VALUES (72, 'Dedrik');
INSERT INTO public.names VALUES (73, 'Dekram');
INSERT INTO public.names VALUES (74, 'Derril');
INSERT INTO public.names VALUES (75, 'Dismoll');
INSERT INTO public.names VALUES (76, 'Dorhant');
INSERT INTO public.names VALUES (77, 'Dritz');
INSERT INTO public.names VALUES (78, 'Drulme');
INSERT INTO public.names VALUES (79, 'Dundar');
INSERT INTO public.names VALUES (80, 'Duval');
INSERT INTO public.names VALUES (81, 'Eglom');
INSERT INTO public.names VALUES (82, 'Espech');
INSERT INTO public.names VALUES (83, 'Essen');
INSERT INTO public.names VALUES (84, 'Fechr');
INSERT INTO public.names VALUES (85, 'Ferrum');
INSERT INTO public.names VALUES (86, 'Foolium');
INSERT INTO public.names VALUES (87, 'Frustan');
INSERT INTO public.names VALUES (88, 'Fyrfank');
INSERT INTO public.names VALUES (89, 'Gamron');
INSERT INTO public.names VALUES (90, 'Glesbrig');
INSERT INTO public.names VALUES (91, 'Glum');
INSERT INTO public.names VALUES (92, 'Gnell');
INSERT INTO public.names VALUES (93, 'Gorwa');
INSERT INTO public.names VALUES (94, 'Grendl');
INSERT INTO public.names VALUES (95, 'Grima');
INSERT INTO public.names VALUES (96, 'Grotske');
INSERT INTO public.names VALUES (97, 'Guzar');
INSERT INTO public.names VALUES (98, 'Hachet');
INSERT INTO public.names VALUES (99, 'Halbörd');
INSERT INTO public.names VALUES (100, 'Halva');
INSERT INTO public.names VALUES (101, 'Hamr');
INSERT INTO public.names VALUES (102, 'Hargar');
INSERT INTO public.names VALUES (103, 'Harik');
INSERT INTO public.names VALUES (104, 'Hat');
INSERT INTO public.names VALUES (105, 'Hirmot');
INSERT INTO public.names VALUES (106, 'Hispan');
INSERT INTO public.names VALUES (107, 'Hodork');
INSERT INTO public.names VALUES (108, 'Honsel');
INSERT INTO public.names VALUES (109, 'Hostan');
INSERT INTO public.names VALUES (110, 'Hostra');
INSERT INTO public.names VALUES (111, 'Igorn');
INSERT INTO public.names VALUES (112, 'Junkr');
INSERT INTO public.names VALUES (113, 'Jurt');
INSERT INTO public.names VALUES (114, 'Kalih');
INSERT INTO public.names VALUES (115, 'Kalruz');
INSERT INTO public.names VALUES (116, 'Kerwyn');
INSERT INTO public.names VALUES (117, 'Kollsup');
INSERT INTO public.names VALUES (118, 'Kotlin');
INSERT INTO public.names VALUES (119, 'Kotran');
INSERT INTO public.names VALUES (120, 'Krang');
INSERT INTO public.names VALUES (121, 'Krassel');
INSERT INTO public.names VALUES (122, 'Krëk');
INSERT INTO public.names VALUES (123, 'Kulmar');
INSERT INTO public.names VALUES (124, 'Kultr');
INSERT INTO public.names VALUES (125, 'Këttel');
INSERT INTO public.names VALUES (126, 'Lagorm');
INSERT INTO public.names VALUES (127, 'Lenker');
INSERT INTO public.names VALUES (128, 'Lessar');
INSERT INTO public.names VALUES (129, 'Lurtz');
INSERT INTO public.names VALUES (130, 'Magont');
INSERT INTO public.names VALUES (131, 'Magrot');
INSERT INTO public.names VALUES (132, 'Magverk');
INSERT INTO public.names VALUES (133, 'Malaiz');
INSERT INTO public.names VALUES (134, 'Malfux');
INSERT INTO public.names VALUES (135, 'Masar');
INSERT INTO public.names VALUES (136, 'Miron');
INSERT INTO public.names VALUES (137, 'Mirthgin');
INSERT INTO public.names VALUES (138, 'Mogr');
INSERT INTO public.names VALUES (139, 'Mordan');
INSERT INTO public.names VALUES (140, 'Mordhaug');
INSERT INTO public.names VALUES (141, 'Morum');
INSERT INTO public.names VALUES (142, 'Myrrha');
INSERT INTO public.names VALUES (143, 'Naplam');
INSERT INTO public.names VALUES (144, 'Nardag');
INSERT INTO public.names VALUES (145, 'Nedrigg');
INSERT INTO public.names VALUES (146, 'Nilhark');
INSERT INTO public.names VALUES (147, 'Numtor');
INSERT INTO public.names VALUES (148, 'Ochra');
INSERT INTO public.names VALUES (149, 'Ogram');
INSERT INTO public.names VALUES (150, 'Oxkart');
INSERT INTO public.names VALUES (151, 'Parma');
INSERT INTO public.names VALUES (152, 'Parthos');
INSERT INTO public.names VALUES (153, 'Phoba');
INSERT INTO public.names VALUES (154, 'Pluck');
INSERT INTO public.names VALUES (155, 'Prosk');
INSERT INTO public.names VALUES (156, 'Pyron');
INSERT INTO public.names VALUES (157, 'Rankor');
INSERT INTO public.names VALUES (158, 'Rask');
INSERT INTO public.names VALUES (159, 'Rebar');
INSERT INTO public.names VALUES (160, 'Rech');
INSERT INTO public.names VALUES (161, 'Regor');
INSERT INTO public.names VALUES (162, 'Rektam');
INSERT INTO public.names VALUES (163, 'Reukr');
INSERT INTO public.names VALUES (164, 'Rhadon');
INSERT INTO public.names VALUES (165, 'Ribb');
INSERT INTO public.names VALUES (166, 'Ronkhil');
INSERT INTO public.names VALUES (167, 'Rot');
INSERT INTO public.names VALUES (168, 'Rotmun');
INSERT INTO public.names VALUES (169, 'Rugnar');
INSERT INTO public.names VALUES (170, 'Rüsa');
INSERT INTO public.names VALUES (171, 'Satmet');
INSERT INTO public.names VALUES (172, 'Sator');
INSERT INTO public.names VALUES (173, 'Satrin');
INSERT INTO public.names VALUES (174, 'Schmikel');
INSERT INTO public.names VALUES (175, 'Sigman');
INSERT INTO public.names VALUES (176, 'Skral');
INSERT INTO public.names VALUES (177, 'Skross');
INSERT INTO public.names VALUES (178, 'Skura');
INSERT INTO public.names VALUES (179, 'Slaktr');
INSERT INTO public.names VALUES (180, 'Slask');
INSERT INTO public.names VALUES (181, 'Slengar');
INSERT INTO public.names VALUES (182, 'Smark');
INSERT INTO public.names VALUES (183, 'Smolk');
INSERT INTO public.names VALUES (184, 'Snott');
INSERT INTO public.names VALUES (185, 'Sorstig');
INSERT INTO public.names VALUES (186, 'Spiegel');
INSERT INTO public.names VALUES (187, 'Stanpeth');
INSERT INTO public.names VALUES (188, 'Stargon');
INSERT INTO public.names VALUES (189, 'Stein');
INSERT INTO public.names VALUES (190, 'Streta');
INSERT INTO public.names VALUES (191, 'Sveda');
INSERT INTO public.names VALUES (192, 'Tark');
INSERT INTO public.names VALUES (193, 'Tarkin');
INSERT INTO public.names VALUES (194, 'Tarmak');
INSERT INTO public.names VALUES (195, 'Temla');
INSERT INTO public.names VALUES (196, 'Torbe');
INSERT INTO public.names VALUES (197, 'Treck');
INSERT INTO public.names VALUES (198, 'Tyke');
INSERT INTO public.names VALUES (199, 'Ungkar');
INSERT INTO public.names VALUES (200, 'Urskinn');
INSERT INTO public.names VALUES (201, 'Usk');
INSERT INTO public.names VALUES (202, 'Vakopr');
INSERT INTO public.names VALUES (203, 'Valkar');
INSERT INTO public.names VALUES (204, 'Vardok');
INSERT INTO public.names VALUES (205, 'Vask');
INSERT INTO public.names VALUES (206, 'Veder');
INSERT INTO public.names VALUES (207, 'Vegra');
INSERT INTO public.names VALUES (208, 'Vendi');
INSERT INTO public.names VALUES (209, 'Vexa');
INSERT INTO public.names VALUES (210, 'Vindag');
INSERT INTO public.names VALUES (211, 'Vitharm');
INSERT INTO public.names VALUES (212, 'Vittra');
INSERT INTO public.names VALUES (213, 'Vort');
INSERT INTO public.names VALUES (214, 'Wort');
INSERT INTO public.names VALUES (215, 'Zweiman');


--
-- Data for Name: origins; Type: TABLE DATA; Schema: public; Owner: p1002_scmgrinder
--

INSERT INTO public.origins VALUES (61, 1, 1, 'origins.fanged_deserter.1');
INSERT INTO public.origins VALUES (62, 1, 2, 'origins.fanged_deserter.2');
INSERT INTO public.origins VALUES (63, 1, 3, 'origins.fanged_deserter.3');
INSERT INTO public.origins VALUES (64, 1, 4, 'origins.fanged_deserter.4');
INSERT INTO public.origins VALUES (65, 1, 5, 'origins.fanged_deserter.5');
INSERT INTO public.origins VALUES (66, 1, 6, 'origins.fanged_deserter.6');
INSERT INTO public.origins VALUES (67, 2, 1, 'origins.gutterborn_scum.1');
INSERT INTO public.origins VALUES (68, 2, 2, 'origins.gutterborn_scum.2');
INSERT INTO public.origins VALUES (69, 2, 3, 'origins.gutterborn_scum.3');
INSERT INTO public.origins VALUES (70, 2, 4, 'origins.gutterborn_scum.4');
INSERT INTO public.origins VALUES (71, 2, 5, 'origins.gutterborn_scum.5');
INSERT INTO public.origins VALUES (72, 2, 6, 'origins.gutterborn_scum.6');
INSERT INTO public.origins VALUES (73, 3, 1, 'origins.esoteric_hermit.1');
INSERT INTO public.origins VALUES (74, 3, 2, 'origins.esoteric_hermit.2');
INSERT INTO public.origins VALUES (75, 3, 3, 'origins.esoteric_hermit.3');
INSERT INTO public.origins VALUES (76, 3, 4, 'origins.esoteric_hermit.4');
INSERT INTO public.origins VALUES (77, 3, 5, 'origins.esoteric_hermit.5');
INSERT INTO public.origins VALUES (78, 3, 6, 'origins.esoteric_hermit.6');
INSERT INTO public.origins VALUES (79, 4, 1, 'origins.wretched_royalty.1');
INSERT INTO public.origins VALUES (80, 4, 2, 'origins.wretched_royalty.2');
INSERT INTO public.origins VALUES (81, 4, 3, 'origins.wretched_royalty.3');
INSERT INTO public.origins VALUES (82, 4, 4, 'origins.wretched_royalty.4');
INSERT INTO public.origins VALUES (83, 4, 5, 'origins.wretched_royalty.5');
INSERT INTO public.origins VALUES (84, 4, 6, 'origins.wretched_royalty.6');
INSERT INTO public.origins VALUES (85, 5, 1, 'origins.heretical_priest.1');
INSERT INTO public.origins VALUES (86, 5, 2, 'origins.heretical_priest.2');
INSERT INTO public.origins VALUES (87, 5, 3, 'origins.heretical_priest.3');
INSERT INTO public.origins VALUES (88, 5, 4, 'origins.heretical_priest.4');
INSERT INTO public.origins VALUES (89, 5, 5, 'origins.heretical_priest.5');
INSERT INTO public.origins VALUES (90, 5, 6, 'origins.heretical_priest.6');
INSERT INTO public.origins VALUES (91, 6, 1, 'origins.occult_herbmaster.1');
INSERT INTO public.origins VALUES (92, 6, 2, 'origins.occult_herbmaster.2');
INSERT INTO public.origins VALUES (93, 6, 3, 'origins.occult_herbmaster.3');
INSERT INTO public.origins VALUES (94, 6, 4, 'origins.occult_herbmaster.4');
INSERT INTO public.origins VALUES (95, 6, 5, 'origins.occult_herbmaster.5');
INSERT INTO public.origins VALUES (96, 6, 6, 'origins.occult_herbmaster.6');


--
-- Data for Name: pets; Type: TABLE DATA; Schema: public; Owner: p1002_scmgrinder
--

INSERT INTO public.pets VALUES (1, 'pets.small-dog', 6, '{animal,pet}', false, '{4}', 'melee', 1, NULL, '[]', 25);
INSERT INTO public.pets VALUES (2, 'pets.monkey', 2, '{animal,pet}', false, '{4}', 'melee', 1, 4, '[]', 15);
INSERT INTO public.pets VALUES (3, 'pets.hawk', 8, '{pet,special}', false, '{4}', 'melee', 1, NULL, '[]', 0);
INSERT INTO public.pets VALUES (4, 'pets.gore-hound', 10, '{pet,special}', false, '{6}', 'melee', 1, NULL, '[]', 0);
INSERT INTO public.pets VALUES (5, 'pets.hamfund', 1, '{pet,special,humanoid}', false, '{6,6}', 'melee', 1, NULL, '[]', 0);
INSERT INTO public.pets VALUES (6, 'pets.barbarister', 1, '{pet,special}', false, '{}', 'buff', 1, NULL, '[{"value": 2, "source": "Barbarister''s guidance", "exclude": ["melee", "ranged", "cast", "ability", "defence", "buff"], "statistic": "presence"}]', 0);
INSERT INTO public.pets VALUES (7, 'pets.poltroon', 1, '{pet,special}', false, '{}', 'buff', 1, NULL, '[{"value": 2, "source": "Poltroon''s annoyance", "exclude": ["melee", "ranged", "cast", "ability", "test", "heal", "buff"], "statistic": "agility"}, {"value": 2, "source": "Poltroon''s annoyance", "exclude": ["defence", "ranged", "cast", "ability", "test", "heal", "buff"], "statistic": "strength"}, {"value": 2, "source": "Poltroon''s annoyance", "exclude": ["defence", "melee", "cast", "ability", "test", "heal", "buff"], "statistic": "presence"}]', 0);


--
-- Data for Name: tales; Type: TABLE DATA; Schema: public; Owner: p1002_scmgrinder
--

INSERT INTO public.tales VALUES (1, 'tales.1', 1, false, '[]');
INSERT INTO public.tales VALUES (2, 'tales.2', 2, false, '[]');
INSERT INTO public.tales VALUES (3, 'tales.3', 3, false, '[]');
INSERT INTO public.tales VALUES (4, 'tales.4', 4, false, '[]');
INSERT INTO public.tales VALUES (5, 'tales.5', 5, false, '[]');
INSERT INTO public.tales VALUES (6, 'tales.6', 6, false, '[]');
INSERT INTO public.tales VALUES (7, 'tales.7', 7, false, '[]');
INSERT INTO public.tales VALUES (8, 'tales.8', 8, false, '[]');
INSERT INTO public.tales VALUES (9, 'tales.9', 9, false, '[]');
INSERT INTO public.tales VALUES (10, 'tales.10', 10, false, '[]');
INSERT INTO public.tales VALUES (11, 'tales.11', 11, false, '[]');
INSERT INTO public.tales VALUES (12, 'tales.12', 12, false, '[]');
INSERT INTO public.tales VALUES (13, 'tales.13', 13, false, '[]');
INSERT INTO public.tales VALUES (14, 'tales.14', 14, false, '[]');
INSERT INTO public.tales VALUES (15, 'tales.15', 15, false, '[]');
INSERT INTO public.tales VALUES (16, 'tales.16', 16, false, '[{"name": "Sling", "tags": ["weapon", "ranged"], "value": 8, "description": "d4 damage, unlimited fist-sized rocks"}]');
INSERT INTO public.tales VALUES (17, 'tales.17', 17, false, '[]');
INSERT INTO public.tales VALUES (18, 'tales.18', 18, false, '[]');
INSERT INTO public.tales VALUES (19, 'tales.19', 19, false, '[]');
INSERT INTO public.tales VALUES (20, 'tales.20', 20, false, '[]');


--
-- Data for Name: traits; Type: TABLE DATA; Schema: public; Owner: p1002_scmgrinder
--

INSERT INTO public.traits VALUES (1, 'traits.1', 1);
INSERT INTO public.traits VALUES (2, 'traits.2', 2);
INSERT INTO public.traits VALUES (3, 'traits.3', 3);
INSERT INTO public.traits VALUES (4, 'traits.4', 4);
INSERT INTO public.traits VALUES (5, 'traits.5', 5);
INSERT INTO public.traits VALUES (6, 'traits.6', 6);
INSERT INTO public.traits VALUES (7, 'traits.7', 7);
INSERT INTO public.traits VALUES (8, 'traits.8', 8);
INSERT INTO public.traits VALUES (9, 'traits.9', 9);
INSERT INTO public.traits VALUES (10, 'traits.10', 10);
INSERT INTO public.traits VALUES (11, 'traits.11', 11);
INSERT INTO public.traits VALUES (12, 'traits.12', 12);
INSERT INTO public.traits VALUES (13, 'traits.13', 13);
INSERT INTO public.traits VALUES (14, 'traits.14', 14);
INSERT INTO public.traits VALUES (15, 'traits.15', 15);
INSERT INTO public.traits VALUES (16, 'traits.16', 16);
INSERT INTO public.traits VALUES (17, 'traits.17', 17);
INSERT INTO public.traits VALUES (18, 'traits.18', 18);
INSERT INTO public.traits VALUES (19, 'traits.19', 19);
INSERT INTO public.traits VALUES (20, 'traits.20', 20);


--
-- Data for Name: translations; Type: TABLE DATA; Schema: public; Owner: p1002_scmgrinder
--

INSERT INTO public.translations VALUES ('en', 'weapons.snake-skin-gift', 'The Snake-Skin Gift');
INSERT INTO public.translations VALUES ('en', 'weapons.snake-skin-gift.description', 'An expensive sandalwood box bound in snakeskin containing a dagger. d4 damage');
INSERT INTO public.translations VALUES ('en', 'weapons.blade-of-ancestors', 'The Blade of your Ancestors');
INSERT INTO public.translations VALUES ('en', 'weapons.blade-of-ancestors.description', 'A magnificent talking sword that is foppish, unreliable and quietly despises you. d6+1 damage');
INSERT INTO public.translations VALUES ('en', 'weapons.brown-scimitar', 'The Brown Scimitar of Galgenbeck');
INSERT INTO public.translations VALUES ('en', 'weapons.brown-scimitar.description', 'A stinking sword from a military shit-ditch. d6 damage');
INSERT INTO public.translations VALUES ('en', 'weapons.sigurd-sling', 'Old Sigürd''s Sling');
INSERT INTO public.translations VALUES ('en', 'weapons.sigurd-sling.description', 'Woven from grey hair, this sling has never failed you. 2d4 damage');
INSERT INTO public.translations VALUES ('en', 'weapons.shoe-of-death', 'The Shoe of Death''s Horse');
INSERT INTO public.translations VALUES ('en', 'weapons.shoe-of-death.description', 'A horseshoe from Death himself. d4 damage, returns like a boomerang');
INSERT INTO public.translations VALUES ('en', 'weapons.femur', 'Femur');
INSERT INTO public.translations VALUES ('en', 'weapons.femur.description', 'd4 damage');
INSERT INTO public.translations VALUES ('en', 'weapons.staff', 'Staff');
INSERT INTO public.translations VALUES ('en', 'weapons.staff.description', 'd4 damage');
INSERT INTO public.translations VALUES ('en', 'weapons.shortsword', 'Shortsword');
INSERT INTO public.translations VALUES ('en', 'weapons.shortsword.description', 'd4 damage');
INSERT INTO public.translations VALUES ('en', 'weapons.knife', 'Knife');
INSERT INTO public.translations VALUES ('en', 'weapons.knife.description', 'd4 damage');
INSERT INTO public.translations VALUES ('en', 'weapons.warhammer', 'Warhammer');
INSERT INTO public.translations VALUES ('en', 'weapons.warhammer.description', 'd6 damage');
INSERT INTO public.translations VALUES ('en', 'weapons.sword', 'Sword');
INSERT INTO public.translations VALUES ('en', 'weapons.sword.description', 'd6 damage');
INSERT INTO public.translations VALUES ('en', 'weapons.bow', 'Bow');
INSERT INTO public.translations VALUES ('en', 'weapons.bow.description', 'd6 damage');
INSERT INTO public.translations VALUES ('en', 'weapons.flail', 'Flail');
INSERT INTO public.translations VALUES ('en', 'weapons.flail.description', 'd8 damage');
INSERT INTO public.translations VALUES ('en', 'weapons.crossbow', 'Crossbow');
INSERT INTO public.translations VALUES ('en', 'weapons.crossbow.description', 'd8 damage');
INSERT INTO public.translations VALUES ('en', 'weapons.zweihander', 'Zweihänder');
INSERT INTO public.translations VALUES ('en', 'weapons.zweihander.description', 'd10 damage');
INSERT INTO public.translations VALUES ('en', 'weapons.whip', 'Whip');
INSERT INTO public.translations VALUES ('en', 'weapons.whip.description', 'd2 damage');
INSERT INTO public.translations VALUES ('en', 'weapons.cudgel', 'Cudgel');
INSERT INTO public.translations VALUES ('en', 'weapons.cudgel.description', 'd4 damage');
INSERT INTO public.translations VALUES ('en', 'weapons.sling', 'Sling');
INSERT INTO public.translations VALUES ('en', 'weapons.sling.description', 'd4 damage, unlimited fist-sized rocks');
INSERT INTO public.translations VALUES ('en', 'weapons.sickle', 'Sickle');
INSERT INTO public.translations VALUES ('en', 'weapons.sickle.description', 'd4 damage');
INSERT INTO public.translations VALUES ('en', 'weapons.club', 'Club');
INSERT INTO public.translations VALUES ('en', 'weapons.club.description', 'd6 damage');
INSERT INTO public.translations VALUES ('en', 'weapons.handaxe', 'Handaxe');
INSERT INTO public.translations VALUES ('en', 'weapons.handaxe.description', 'd6 damage');
INSERT INTO public.translations VALUES ('en', 'weapons.mace', 'Mace');
INSERT INTO public.translations VALUES ('en', 'weapons.mace.description', 'd6 damage');
INSERT INTO public.translations VALUES ('en', 'weapons.spear', 'Spear');
INSERT INTO public.translations VALUES ('en', 'weapons.spear.description', 'd6 damage');
INSERT INTO public.translations VALUES ('en', 'weapons.battle-axe', 'Battle Axe');
INSERT INTO public.translations VALUES ('en', 'weapons.battle-axe.description', 'd8 damage');
INSERT INTO public.translations VALUES ('en', 'weapons.goedendag', 'Goedendag');
INSERT INTO public.translations VALUES ('en', 'weapons.goedendag.description', 'd8 damage');
INSERT INTO public.translations VALUES ('en', 'weapons.meat-cleaver', 'Meat Cleaver');
INSERT INTO public.translations VALUES ('en', 'weapons.meat-cleaver.description', 'd4 damage');
INSERT INTO public.translations VALUES ('en', 'weapons.crowbar', 'Crowbar');
INSERT INTO public.translations VALUES ('en', 'weapons.crowbar.description', 'd4 damage');
INSERT INTO public.translations VALUES ('en', 'weapons.hammer', 'Hammer');
INSERT INTO public.translations VALUES ('en', 'weapons.hammer.description', 'd4 damage');
INSERT INTO public.translations VALUES ('en', 'weapons.caltrops', 'Caltrops');
INSERT INTO public.translations VALUES ('en', 'weapons.caltrops.description', 'd4 damage + infection on 1 in 6');
INSERT INTO public.translations VALUES ('en', 'weapons.shield', 'Shield');
INSERT INTO public.translations VALUES ('en', 'weapons.shield.description', '-1 HP damage or break to ignore one attack');
INSERT INTO public.translations VALUES ('en', 'armor.fur', 'Fur Armor');
INSERT INTO public.translations VALUES ('en', 'armor.fur.description', '-d2 damage, tier 1');
INSERT INTO public.translations VALUES ('en', 'armor.padded-cloth', 'Padded Cloth Armor');
INSERT INTO public.translations VALUES ('en', 'armor.padded-cloth.description', '-d2 damage, tier 1');
INSERT INTO public.translations VALUES ('en', 'armor.leather', 'Leather Armor');
INSERT INTO public.translations VALUES ('en', 'armor.leather.description', '-d2 damage, tier 1');
INSERT INTO public.translations VALUES ('en', 'armor.scale', 'Scale Armor');
INSERT INTO public.translations VALUES ('en', 'armor.scale.description', '-d4 damage, tier 2, DR +2 on Agility tests');
INSERT INTO public.translations VALUES ('en', 'armor.mail', 'Mail Armor');
INSERT INTO public.translations VALUES ('en', 'armor.mail.description', '-d4 damage, tier 2, DR +2 on Agility tests');
INSERT INTO public.translations VALUES ('en', 'armor.splint', 'Splint Armor');
INSERT INTO public.translations VALUES ('en', 'armor.splint.description', '-d6 damage, tier 3, DR +4 on Agility tests, defence DR +2');
INSERT INTO public.translations VALUES ('en', 'armor.plate', 'Plate Armor');
INSERT INTO public.translations VALUES ('en', 'armor.plate.description', '-d6 damage, tier 3, DR +4 on Agility tests, defence DR +2');
INSERT INTO public.translations VALUES ('en', 'pets.small-dog', 'Small but vicious dog');
INSERT INTO public.translations VALUES ('en', 'pets.small-dog.description', 'Bite d4, only obeys you');
INSERT INTO public.translations VALUES ('en', 'pets.monkey', 'Monkey');
INSERT INTO public.translations VALUES ('en', 'pets.monkey.description', 'It ignores you but loves you. 2 HP, punch/bite d4');
INSERT INTO public.translations VALUES ('en', 'origins.esoteric_hermit.4', 'You were dying of plague in a Bergen Chrypt hovel, when you touched something from outside.');
INSERT INTO public.translations VALUES ('en', 'pets.hawk.description', 'Your crafty almost-intelligent hawk is loyal only to you. Swoops to attack foes.');
INSERT INTO public.translations VALUES ('en', 'pets.gore-hound', 'Ancient Gore-Hound');
INSERT INTO public.translations VALUES ('en', 'pets.gore-hound.description', 'Asthmatic, deluded, but has a superb nose for treasure. Frenzied around goblins.');
INSERT INTO public.translations VALUES ('en', 'pets.hamfund.description', 'Cowardly guardian of the cursed sword Eurekia. Once per combat, draw for 2d6 damage.');
INSERT INTO public.translations VALUES ('en', 'pets.barbarister.description', 'Magical, intelligent, arrogant talking horse. Sometimes +2 to Presence tests.');
INSERT INTO public.translations VALUES ('en', 'pets.poltroon.description', 'Irritating but distracting. First two rounds: +2 attack/defence for allies.');
INSERT INTO public.translations VALUES ('en', 'equipment.backpack', 'Backpack');
INSERT INTO public.translations VALUES ('en', 'equipment.backpack.description', 'For 7 normal-sized items');
INSERT INTO public.translations VALUES ('en', 'equipment.sack', 'Sack');
INSERT INTO public.translations VALUES ('en', 'equipment.sack.description', 'For 10 normal-sized items');
INSERT INTO public.translations VALUES ('en', 'equipment.small-wagon', 'Small Wagon');
INSERT INTO public.translations VALUES ('en', 'equipment.small-wagon.description', 'You can put stuff in it');
INSERT INTO public.translations VALUES ('en', 'equipment.donkey', 'Donkey');
INSERT INTO public.translations VALUES ('en', 'equipment.donkey.description', 'Mostly ignores you');
INSERT INTO public.translations VALUES ('en', 'equipment.rope', 'Rope');
INSERT INTO public.translations VALUES ('en', 'equipment.rope.description', '30 feet');
INSERT INTO public.translations VALUES ('en', 'equipment.blanket', 'Blanket');
INSERT INTO public.translations VALUES ('en', 'equipment.blanket.description', '');
INSERT INTO public.translations VALUES ('en', 'equipment.torches', 'Torches');
INSERT INTO public.translations VALUES ('en', 'equipment.torches.description', '');
INSERT INTO public.translations VALUES ('en', 'equipment.lantern', 'Lantern');
INSERT INTO public.translations VALUES ('en', 'equipment.lantern.description', 'With oil');
INSERT INTO public.translations VALUES ('en', 'equipment.magnesium-strip', 'Magnesium Strip');
INSERT INTO public.translations VALUES ('en', 'equipment.magnesium-strip.description', '');
INSERT INTO public.translations VALUES ('en', 'equipment.firesteel', 'Firesteel');
INSERT INTO public.translations VALUES ('en', 'equipment.firesteel.description', '');
INSERT INTO public.translations VALUES ('en', 'equipment.sharp-needle', 'Sharp Needle');
INSERT INTO public.translations VALUES ('en', 'equipment.sharp-needle.description', '');
INSERT INTO public.translations VALUES ('en', 'equipment.wooden-crucifix', 'Wooden Crucifix');
INSERT INTO public.translations VALUES ('en', 'equipment.wooden-crucifix.description', '');
INSERT INTO public.translations VALUES ('en', 'equipment.silver-crucifix', 'Silver Crucifix');
INSERT INTO public.translations VALUES ('en', 'equipment.silver-crucifix.description', '');
INSERT INTO public.translations VALUES ('en', 'equipment.lockpicks', 'Metal File and Lockpicks');
INSERT INTO public.translations VALUES ('en', 'equipment.lockpicks.description', '');
INSERT INTO public.translations VALUES ('en', 'equipment.manacles', 'Manacles');
INSERT INTO public.translations VALUES ('en', 'equipment.manacles.description', '');
INSERT INTO public.translations VALUES ('en', 'equipment.toolbox', 'Toolbox');
INSERT INTO public.translations VALUES ('en', 'equipment.toolbox.description', '10 nails, tongs, hammer, small saw, and drill');
INSERT INTO public.translations VALUES ('en', 'equipment.heavy-chain', 'Heavy Chain');
INSERT INTO public.translations VALUES ('en', 'equipment.heavy-chain.description', '15 feet');
INSERT INTO public.translations VALUES ('en', 'equipment.scissors', 'Scissors');
INSERT INTO public.translations VALUES ('en', 'equipment.scissors.description', '');
INSERT INTO public.translations VALUES ('en', 'equipment.grappling-hook', 'Grappling Hook');
INSERT INTO public.translations VALUES ('en', 'equipment.grappling-hook.description', '');
INSERT INTO public.translations VALUES ('en', 'equipment.noose', 'Noose');
INSERT INTO public.translations VALUES ('en', 'equipment.noose.description', '');
INSERT INTO public.translations VALUES ('en', 'equipment.tent', 'Tent');
INSERT INTO public.translations VALUES ('en', 'equipment.tent.description', '');
INSERT INTO public.translations VALUES ('en', 'equipment.mirror', 'Mirror');
INSERT INTO public.translations VALUES ('en', 'equipment.mirror.description', 'Worth 15s');
INSERT INTO public.translations VALUES ('en', 'equipment.exquisite-perfume', 'Exquisite Perfume');
INSERT INTO public.translations VALUES ('en', 'equipment.exquisite-perfume.description', 'Worth 25s');
INSERT INTO public.translations VALUES ('en', 'equipment.bear-trap', 'Bear Trap');
INSERT INTO public.translations VALUES ('en', 'equipment.bear-trap.description', 'DR14 to spot, d8 damage');
INSERT INTO public.translations VALUES ('en', 'equipment.lard', 'Lard');
INSERT INTO public.translations VALUES ('en', 'equipment.lard.description', 'May function as 5 meals in a pinch');
INSERT INTO public.translations VALUES ('en', 'equipment.chewing-tobacco', 'Chewing Tobacco');
INSERT INTO public.translations VALUES ('en', 'equipment.chewing-tobacco.description', '');
INSERT INTO public.translations VALUES ('en', 'equipment.chalk', 'Stick of Chalk');
INSERT INTO public.translations VALUES ('en', 'equipment.chalk.description', '');
INSERT INTO public.translations VALUES ('en', 'equipment.salt', 'A Bottle of Salt');
INSERT INTO public.translations VALUES ('en', 'equipment.salt.description', '');
INSERT INTO public.translations VALUES ('en', 'equipment.medicine-chest', 'Medicine Chest');
INSERT INTO public.translations VALUES ('en', 'equipment.medicine-chest.description', 'Stops bleeding/infection and heals d6 HP');
INSERT INTO public.translations VALUES ('en', 'equipment.life-elixir', 'Life Elixir');
INSERT INTO public.translations VALUES ('en', 'equipment.life-elixir.description', 'Heals d6 HP and removes infection');
INSERT INTO public.translations VALUES ('en', 'equipment.red-poison', 'A Bottle of Red Poison');
INSERT INTO public.translations VALUES ('en', 'equipment.red-poison.description', 'Toughness DR12 or d10 damage');
INSERT INTO public.translations VALUES ('en', 'equipment.black-poison', 'A Bottle of Black Poison');
INSERT INTO public.translations VALUES ('en', 'equipment.black-poison.description', 'Toughness DR14 or d6 damage + blind for one hour');
INSERT INTO public.translations VALUES ('en', 'equipment.bomb', 'Bomb');
INSERT INTO public.translations VALUES ('en', 'equipment.bomb.description', 'Sealed bottle, d10 damage');
INSERT INTO public.translations VALUES ('en', 'scroll.unclean.1', 'Palms Open the Southern Gate');
INSERT INTO public.translations VALUES ('en', 'scroll.unclean.1.description', 'A ball of fire hits d2 creatures dealing d8 damage per creature');
INSERT INTO public.translations VALUES ('en', 'scroll.unclean.2', 'Tongue of Eris');
INSERT INTO public.translations VALUES ('en', 'scroll.unclean.2.description', 'A creature of your choice is confused for 10 minutes');
INSERT INTO public.translations VALUES ('en', 'scroll.unclean.3', 'Te-le-kin-esis');
INSERT INTO public.translations VALUES ('en', 'scroll.unclean.3.description', 'Move an object up 1d10 feet for d6 minutes');
INSERT INTO public.translations VALUES ('en', 'scroll.unclean.4', 'Lucy-Fires Levitation');
INSERT INTO public.translations VALUES ('en', 'scroll.unclean.4.description', 'Hover for Presence + d10 rounds');
INSERT INTO public.translations VALUES ('en', 'scroll.unclean.5', 'Daemon of Capillaries');
INSERT INTO public.translations VALUES ('en', 'scroll.unclean.5.description', 'One creature suffocates for d6 rounds, losing d4 HP per round');
INSERT INTO public.translations VALUES ('en', 'scroll.unclean.6', 'Nine Violet Signs Unknot the Storm');
INSERT INTO public.translations VALUES ('en', 'scroll.unclean.6.description', 'Produce d2 lightning bolts dealing d6 damage each');
INSERT INTO public.translations VALUES ('en', 'scroll.unclean.7', 'Metzhuotl Blind Your Eye');
INSERT INTO public.translations VALUES ('en', 'scroll.unclean.7.description', 'A creature becomes invisible for d6 rounds');
INSERT INTO public.translations VALUES ('en', 'scroll.unclean.8', 'Foul Psychopomp');
INSERT INTO public.translations VALUES ('en', 'scroll.unclean.8.description', 'Summon d4 skeletons or zombies');
INSERT INTO public.translations VALUES ('en', 'scroll.unclean.9', 'Eyelid Blinds the Mind');
INSERT INTO public.translations VALUES ('en', 'scroll.unclean.9.description', 'd4 creatures fall asleep for one hour');
INSERT INTO public.translations VALUES ('en', 'scroll.unclean.10', 'Death');
INSERT INTO public.translations VALUES ('en', 'scroll.unclean.10.description', 'All creatures within 30 feet lose a total of 4d10 HP');
INSERT INTO public.translations VALUES ('en', 'scroll.sacred.1', 'Grace of a Dead Saint');
INSERT INTO public.translations VALUES ('en', 'scroll.sacred.1.description', 'd2 creatures regain d10 HP each');
INSERT INTO public.translations VALUES ('en', 'scroll.sacred.2', 'Grace for a Sinner');
INSERT INTO public.translations VALUES ('en', 'scroll.sacred.2.description', 'A creature gets +d6 on one roll');
INSERT INTO public.translations VALUES ('en', 'scroll.sacred.3', 'Whispers Pass the Gate');
INSERT INTO public.translations VALUES ('en', 'scroll.sacred.3.description', 'Ask three questions to a deceased creature');
INSERT INTO public.translations VALUES ('en', 'scroll.sacred.4', 'Aegis of Sorrow');
INSERT INTO public.translations VALUES ('en', 'scroll.sacred.4.description', 'A creature gains 2d6 extra HP for 10 rounds');
INSERT INTO public.translations VALUES ('en', 'scroll.sacred.5', 'Unmet Fate');
INSERT INTO public.translations VALUES ('en', 'scroll.sacred.5.description', 'Awaken a creature dead for no more than a week');
INSERT INTO public.translations VALUES ('en', 'scroll.sacred.6', 'Bestial Speech');
INSERT INTO public.translations VALUES ('en', 'scroll.sacred.6.description', 'Speak with animals for d20 minutes');
INSERT INTO public.translations VALUES ('en', 'scroll.sacred.7', 'False Dawn Night''s Chariot');
INSERT INTO public.translations VALUES ('en', 'scroll.sacred.7.description', 'Light or pitch black for 3d10 minutes');
INSERT INTO public.translations VALUES ('en', 'scroll.sacred.8', 'Hermetic Step');
INSERT INTO public.translations VALUES ('en', 'scroll.sacred.8.description', 'Find all traps in your path for 2d10 minutes');
INSERT INTO public.translations VALUES ('en', 'scroll.sacred.9', 'Roskoe''s Consuming Glare');
INSERT INTO public.translations VALUES ('en', 'scroll.sacred.9.description', 'd4 creatures lose d8 HP each');
INSERT INTO public.translations VALUES ('en', 'scroll.sacred.10', 'Enochian Syntax');
INSERT INTO public.translations VALUES ('en', 'scroll.sacred.10.description', 'One creature blindly obeys a single command');
INSERT INTO public.translations VALUES ('en', 'equipment.ezumiel-vapor', 'Ezumiel Vapor');
INSERT INTO public.translations VALUES ('en', 'equipment.ezumiel-vapor.description', 'Pass a DR14 test or severe hallucinations for d4 hours');
INSERT INTO public.translations VALUES ('en', 'equipment.southern-frog', 'Southern Frog Stew');
INSERT INTO public.translations VALUES ('en', 'equipment.southern-frog.description', 'Vomit for d4 hours, DR14 test or do nothing else');
INSERT INTO public.translations VALUES ('en', 'equipment.elixir-vitalis', 'Elixir Vitalis');
INSERT INTO public.translations VALUES ('en', 'equipment.elixir-vitalis.description', 'Heals d6 HP and stops infection. Can be habit forming');
INSERT INTO public.translations VALUES ('en', 'equipment.spider-owl-soup', 'Spider-Owl Soup');
INSERT INTO public.translations VALUES ('en', 'equipment.spider-owl-soup.description', 'See in darkness, climb on walls for 30 minutes');
INSERT INTO public.translations VALUES ('en', 'equipment.fernors-philtre', 'Fernor''s Philtre');
INSERT INTO public.translations VALUES ('en', 'equipment.fernors-philtre.description', 'Dab in eye. Heals infection, +2 presence for d4 hours');
INSERT INTO public.translations VALUES ('en', 'equipment.hyphos-snuff', 'Hyphos''s Enervating Snuff');
INSERT INTO public.translations VALUES ('en', 'equipment.hyphos-snuff.description', 'Berserk! Two attacks per round but defend with DR14. One fight.');
INSERT INTO public.translations VALUES ('en', 'origins.esoteric_hermit.5', 'You were an average individual until you encountered something in a dim glade in Sarkash.');
INSERT INTO public.translations VALUES ('en', 'origins.esoteric_hermit.6', 'You were raised on a lonely island in Lake Onda. No one else has ever heard of it.');
INSERT INTO public.translations VALUES ('en', 'origins.wretched_royalty.1', 'Things were going so well, until your Wästland palace was reduced to rubble.');
INSERT INTO public.translations VALUES ('en', 'origins.wretched_royalty.2', 'Things were going so well, until your caravan kingdom of Tveland fell into penury.');
INSERT INTO public.translations VALUES ('en', 'origins.wretched_royalty.3', 'Things were going so well, until King Fathmu IX''s brother Zigmund, your father, was murdered.');
INSERT INTO public.translations VALUES ('en', 'origins.wretched_royalty.4', 'Things were going so well, until the southern empire of Südglans sank into the sea.');
INSERT INTO public.translations VALUES ('en', 'origins.wretched_royalty.5', 'Things were going so well, until two young princes were kidnapped west of Bergen Chrypt.');
INSERT INTO public.translations VALUES ('en', 'origins.wretched_royalty.6', 'Things were going so well, until Anthelia demanded a gift of noble blood.');
INSERT INTO public.translations VALUES ('en', 'origins.heretical_priest.1', 'You come from Galgenbeck, near the cathedral of the Two-Headed Basilisks.');
INSERT INTO public.translations VALUES ('en', 'origins.heretical_priest.2', 'You are the sole survivor of a massacred Allians cult.');
INSERT INTO public.translations VALUES ('en', 'origins.heretical_priest.3', 'You come from the crypts of Grift.');
INSERT INTO public.translations VALUES ('en', 'origins.heretical_priest.4', 'You come from some temple ruins in the Valley of the Unfortunate Undead.');
INSERT INTO public.translations VALUES ('en', 'origins.heretical_priest.5', 'You come from one of the many Graven-Tosk thief-tunnels.');
INSERT INTO public.translations VALUES ('en', 'origins.heretical_priest.6', 'You come from a secret Bergen Chrypt church.');
INSERT INTO public.translations VALUES ('en', 'origins.occult_herbmaster.1', 'Raised in calm isolation in the Sarkash dark.');
INSERT INTO public.translations VALUES ('en', 'origins.occult_herbmaster.2', 'From the illegal midnight markets of Schleswig.');
INSERT INTO public.translations VALUES ('en', 'origins.occult_herbmaster.3', 'From the heretic isle of Crëlut, two nautical miles east of Grift.');
INSERT INTO public.translations VALUES ('en', 'origins.occult_herbmaster.4', 'From the old frozen ruins not far from Allians.');
INSERT INTO public.translations VALUES ('en', 'origins.occult_herbmaster.5', 'From a little witches cottage in Galgenbeck.');
INSERT INTO public.translations VALUES ('en', 'origins.occult_herbmaster.6', 'From the ruins of the Shadow King''s manse.');
INSERT INTO public.translations VALUES ('pl', 'weapons.snake-skin-gift', 'Prezent z wężowej skóry');
INSERT INTO public.translations VALUES ('pl', 'weapons.snake-skin-gift.description', 'Drogie pudełko z drewna sandałowego oprawione w skórę węża, zawierające sztylet. d4 obrażeń');
INSERT INTO public.translations VALUES ('pl', 'weapons.blade-of-ancestors', 'Ostrze Twoich Przodków');
INSERT INTO public.translations VALUES ('pl', 'weapons.blade-of-ancestors.description', 'Wspaniały gadający miecz, który jest fircykowaty, nieziemsko zawodny i po cichu tobą gardzi. d6+1 obrażeń');
INSERT INTO public.translations VALUES ('pl', 'weapons.brown-scimitar', 'Brązowy sejmitar z Galgenbeck');
INSERT INTO public.translations VALUES ('pl', 'weapons.brown-scimitar.description', 'Cuchnący miecz z wojskowego rowu kloacznego. d6 obrażeń');
INSERT INTO public.translations VALUES ('pl', 'weapons.sigurd-sling', 'Proca Starego Sigürda');
INSERT INTO public.translations VALUES ('pl', 'weapons.sigurd-sling.description', 'Upleciona z siwych włosów, ta proca nigdy cię nie zawiodła. 2d4 obrażeń');
INSERT INTO public.translations VALUES ('pl', 'weapons.shoe-of-death', 'Podkowa Konia Śmierci');
INSERT INTO public.translations VALUES ('pl', 'weapons.shoe-of-death.description', 'Podkowa samego Śmierci. d4 obrażeń, wraca jak bumerang');
INSERT INTO public.translations VALUES ('pl', 'weapons.femur', 'Kość udowa');
INSERT INTO public.translations VALUES ('pl', 'weapons.femur.description', 'd4 obrażeń');
INSERT INTO public.translations VALUES ('pl', 'weapons.staff', 'Kostur');
INSERT INTO public.translations VALUES ('pl', 'weapons.staff.description', 'd4 obrażeń');
INSERT INTO public.translations VALUES ('pl', 'weapons.shortsword', 'Krótki miecz');
INSERT INTO public.translations VALUES ('pl', 'weapons.shortsword.description', 'd4 obrażeń');
INSERT INTO public.translations VALUES ('pl', 'weapons.knife', 'Nóż');
INSERT INTO public.translations VALUES ('pl', 'weapons.knife.description', 'd4 obrażeń');
INSERT INTO public.translations VALUES ('pl', 'weapons.warhammer', 'Młot bojowy');
INSERT INTO public.translations VALUES ('pl', 'weapons.warhammer.description', 'd6 obrażeń');
INSERT INTO public.translations VALUES ('pl', 'weapons.sword', 'Miecz');
INSERT INTO public.translations VALUES ('pl', 'weapons.sword.description', 'd6 obrażeń');
INSERT INTO public.translations VALUES ('pl', 'weapons.bow', 'Łuk');
INSERT INTO public.translations VALUES ('pl', 'weapons.bow.description', 'd6 obrażeń');
INSERT INTO public.translations VALUES ('pl', 'weapons.flail', 'Kiścień');
INSERT INTO public.translations VALUES ('pl', 'weapons.flail.description', 'd8 obrażeń');
INSERT INTO public.translations VALUES ('pl', 'weapons.crossbow', 'Kusza');
INSERT INTO public.translations VALUES ('pl', 'weapons.crossbow.description', 'd8 obrażeń');
INSERT INTO public.translations VALUES ('pl', 'weapons.zweihander', 'Zweihänder');
INSERT INTO public.translations VALUES ('pl', 'weapons.zweihander.description', 'd10 obrażeń');
INSERT INTO public.translations VALUES ('pl', 'weapons.whip', 'Bicz');
INSERT INTO public.translations VALUES ('pl', 'weapons.whip.description', 'd2 obrażeń');
INSERT INTO public.translations VALUES ('pl', 'weapons.cudgel', 'Pałka');
INSERT INTO public.translations VALUES ('pl', 'weapons.cudgel.description', 'd4 obrażeń');
INSERT INTO public.translations VALUES ('pl', 'weapons.sling', 'Proca');
INSERT INTO public.translations VALUES ('pl', 'weapons.sling.description', 'd4 obrażeń, nieograniczona ilość kamieni wielkości pięści');
INSERT INTO public.translations VALUES ('pl', 'weapons.sickle', 'Sierp');
INSERT INTO public.translations VALUES ('pl', 'weapons.sickle.description', 'd4 obrażeń');
INSERT INTO public.translations VALUES ('pl', 'weapons.club', 'Maczuga');
INSERT INTO public.translations VALUES ('pl', 'weapons.club.description', 'd6 obrażeń');
INSERT INTO public.translations VALUES ('pl', 'weapons.handaxe', 'Toporek');
INSERT INTO public.translations VALUES ('pl', 'weapons.handaxe.description', 'd6 obrażeń');
INSERT INTO public.translations VALUES ('pl', 'weapons.mace', 'Buława');
INSERT INTO public.translations VALUES ('pl', 'weapons.mace.description', 'd6 obrażeń');
INSERT INTO public.translations VALUES ('pl', 'weapons.spear', 'Włócznia');
INSERT INTO public.translations VALUES ('pl', 'weapons.spear.description', 'd6 obrażeń');
INSERT INTO public.translations VALUES ('pl', 'weapons.battle-axe', 'Topór bitewny');
INSERT INTO public.translations VALUES ('pl', 'weapons.battle-axe.description', 'd8 obrażeń');
INSERT INTO public.translations VALUES ('pl', 'weapons.goedendag', 'Goedendag');
INSERT INTO public.translations VALUES ('pl', 'weapons.goedendag.description', 'd8 obrażeń');
INSERT INTO public.translations VALUES ('pl', 'weapons.meat-cleaver', 'Tasak do mięsa');
INSERT INTO public.translations VALUES ('pl', 'weapons.meat-cleaver.description', 'd4 obrażeń');
INSERT INTO public.translations VALUES ('pl', 'weapons.crowbar', 'Łom');
INSERT INTO public.translations VALUES ('pl', 'weapons.crowbar.description', 'd4 obrażeń');
INSERT INTO public.translations VALUES ('pl', 'weapons.hammer', 'Młotek');
INSERT INTO public.translations VALUES ('pl', 'weapons.hammer.description', 'd4 obrażeń');
INSERT INTO public.translations VALUES ('pl', 'weapons.caltrops', 'Czosnki (kolce)');
INSERT INTO public.translations VALUES ('pl', 'weapons.caltrops.description', 'd4 obrażeń + infekcja przy 1 na 6');
INSERT INTO public.translations VALUES ('pl', 'weapons.shield', 'Tarcza');
INSERT INTO public.translations VALUES ('pl', 'weapons.shield.description', '-1 obrażeń PŻ lub zniszcz, aby zignorować jeden atak');
INSERT INTO public.translations VALUES ('pl', 'armor.fur', 'Zbroja z futra');
INSERT INTO public.translations VALUES ('pl', 'armor.fur.description', '-d2 obrażeń, poziom 1');
INSERT INTO public.translations VALUES ('pl', 'armor.padded-cloth', 'Przeszywanica');
INSERT INTO public.translations VALUES ('pl', 'armor.padded-cloth.description', '-d2 obrażeń, poziom 1');
INSERT INTO public.translations VALUES ('pl', 'armor.leather', 'Zbroja skórzana');
INSERT INTO public.translations VALUES ('pl', 'armor.leather.description', '-d2 obrażeń, poziom 1');
INSERT INTO public.translations VALUES ('pl', 'armor.scale', 'Zbroja łuskowa');
INSERT INTO public.translations VALUES ('pl', 'armor.scale.description', '-d4 obrażeń, poziom 2, PT +2 do testów Zwinności');
INSERT INTO public.translations VALUES ('pl', 'armor.mail', 'Kolczuga');
INSERT INTO public.translations VALUES ('pl', 'armor.mail.description', '-d4 obrażeń, poziom 2, PT +2 do testów Zwinności');
INSERT INTO public.translations VALUES ('pl', 'armor.splint', 'Zbroja karacenowa');
INSERT INTO public.translations VALUES ('pl', 'armor.splint.description', '-d6 obrażeń, poziom 3, PT +4 do testów Zwinności, PT obrony +2');
INSERT INTO public.translations VALUES ('pl', 'armor.plate', 'Zbroja płytowa');
INSERT INTO public.translations VALUES ('pl', 'armor.plate.description', '-d6 obrażeń, poziom 3, PT +4 do testów Zwinności, PT obrony +2');
INSERT INTO public.translations VALUES ('pl', 'pets.small-dog', 'Mały, ale wściekły pies');
INSERT INTO public.translations VALUES ('pl', 'pets.small-dog.description', 'Ugryzienie d4, słucha tylko ciebie');
INSERT INTO public.translations VALUES ('pl', 'pets.monkey', 'Małpa');
INSERT INTO public.translations VALUES ('pl', 'pets.monkey.description', 'Ignoruje cię, ale cię kocha. 2 PŻ, cios/ugryzienie d4');
INSERT INTO public.translations VALUES ('pl', 'pets.hawk', 'Jastrząb');
INSERT INTO public.translations VALUES ('pl', 'pets.hawk.description', 'Twój przebiegły, niemal inteligentny jastrząb jest lojalny tylko wobec ciebie. Atakuje wrogów z powietrza.');
INSERT INTO public.translations VALUES ('pl', 'pets.gore-hound', 'Starożytny ogar posokowiec');
INSERT INTO public.translations VALUES ('pl', 'pets.gore-hound.description', 'Astmatyczny, błądzący w ułudzie, ale ma genialny nos do skarbów. Wpada w szał przy goblinach.');
INSERT INTO public.translations VALUES ('pl', 'pets.hamfund', 'Splunięcie Hamfunda');
INSERT INTO public.translations VALUES ('pl', 'pets.hamfund.description', 'Tchórzliwy strażnik przeklętego miecza Eurekia. Raz na walkę, dobądź go dla 2d6 obrażeń.');
INSERT INTO public.translations VALUES ('pl', 'pets.barbarister', 'Barbarister, Niesamowity Koń');
INSERT INTO public.translations VALUES ('pl', 'pets.barbarister.description', 'Magiczny, inteligentny, arogancki gadający koń. Czasami +2 do testów Obecności.');
INSERT INTO public.translations VALUES ('pl', 'pets.poltroon', '"Poltroon" Błazen Dworski');
INSERT INTO public.translations VALUES ('pl', 'pets.poltroon.description', 'Irytujący, ale odwracający uwagę. Pierwsze dwie rundy: +2 do ataku/obrony dla sojuszników.');
INSERT INTO public.translations VALUES ('pl', 'equipment.backpack', 'Plecak');
INSERT INTO public.translations VALUES ('pl', 'equipment.backpack.description', 'Na 7 przedmiotów normalnej wielkości');
INSERT INTO public.translations VALUES ('pl', 'equipment.sack', 'Worek');
INSERT INTO public.translations VALUES ('pl', 'equipment.sack.description', 'Na 10 przedmiotów normalnej wielkości');
INSERT INTO public.translations VALUES ('pl', 'equipment.small-wagon', 'Mały wóz');
INSERT INTO public.translations VALUES ('pl', 'equipment.small-wagon.description', 'Możesz do niego kłaść rzeczy');
INSERT INTO public.translations VALUES ('pl', 'equipment.donkey', 'Osioł');
INSERT INTO public.translations VALUES ('pl', 'equipment.donkey.description', 'Głównie cię ignoruje');
INSERT INTO public.translations VALUES ('pl', 'equipment.rope', 'Lina');
INSERT INTO public.translations VALUES ('pl', 'equipment.rope.description', '30 stóp');
INSERT INTO public.translations VALUES ('pl', 'equipment.blanket', 'Koc');
INSERT INTO public.translations VALUES ('pl', 'equipment.blanket.description', '');
INSERT INTO public.translations VALUES ('pl', 'equipment.torches', 'Pochodnie');
INSERT INTO public.translations VALUES ('pl', 'equipment.torches.description', '');
INSERT INTO public.translations VALUES ('pl', 'equipment.lantern', 'Latarnia');
INSERT INTO public.translations VALUES ('pl', 'equipment.lantern.description', 'Z oliwą');
INSERT INTO public.translations VALUES ('pl', 'equipment.magnesium-strip', 'Pasek magnezowy');
INSERT INTO public.translations VALUES ('pl', 'equipment.magnesium-strip.description', '');
INSERT INTO public.translations VALUES ('pl', 'equipment.firesteel', 'Krzesiwo');
INSERT INTO public.translations VALUES ('pl', 'equipment.firesteel.description', '');
INSERT INTO public.translations VALUES ('pl', 'equipment.sharp-needle', 'Ostra igła');
INSERT INTO public.translations VALUES ('pl', 'equipment.sharp-needle.description', '');
INSERT INTO public.translations VALUES ('pl', 'equipment.wooden-crucifix', 'Drewniany krucyfiks');
INSERT INTO public.translations VALUES ('pl', 'equipment.wooden-crucifix.description', '');
INSERT INTO public.translations VALUES ('pl', 'equipment.silver-crucifix', 'Srebrny krucyfiks');
INSERT INTO public.translations VALUES ('pl', 'equipment.silver-crucifix.description', '');
INSERT INTO public.translations VALUES ('pl', 'equipment.lockpicks', 'Metalowy pilnik i wytrychy');
INSERT INTO public.translations VALUES ('pl', 'equipment.lockpicks.description', '');
INSERT INTO public.translations VALUES ('pl', 'equipment.manacles', 'Kajdany');
INSERT INTO public.translations VALUES ('pl', 'equipment.manacles.description', '');
INSERT INTO public.translations VALUES ('pl', 'equipment.toolbox', 'Skrzynka z narzędziami');
INSERT INTO public.translations VALUES ('pl', 'equipment.toolbox.description', '10 gwoździ, szczypce, młotek, mała piła i świder');
INSERT INTO public.translations VALUES ('pl', 'equipment.heavy-chain', 'Ciężki łańcuch');
INSERT INTO public.translations VALUES ('pl', 'equipment.heavy-chain.description', '15 stóp');
INSERT INTO public.translations VALUES ('pl', 'equipment.scissors', 'Nożyczki');
INSERT INTO public.translations VALUES ('pl', 'equipment.scissors.description', '');
INSERT INTO public.translations VALUES ('pl', 'equipment.grappling-hook', 'Kotwiczka');
INSERT INTO public.translations VALUES ('pl', 'equipment.grappling-hook.description', '');
INSERT INTO public.translations VALUES ('pl', 'equipment.noose', 'Pętla');
INSERT INTO public.translations VALUES ('pl', 'equipment.noose.description', '');
INSERT INTO public.translations VALUES ('pl', 'equipment.tent', 'Namiot');
INSERT INTO public.translations VALUES ('pl', 'equipment.tent.description', '');
INSERT INTO public.translations VALUES ('pl', 'equipment.mirror', 'Lustro');
INSERT INTO public.translations VALUES ('pl', 'equipment.mirror.description', 'Warte 15s');
INSERT INTO public.translations VALUES ('pl', 'equipment.exquisite-perfume', 'Wykwintne perfumy');
INSERT INTO public.translations VALUES ('pl', 'equipment.exquisite-perfume.description', 'Warte 25s');
INSERT INTO public.translations VALUES ('pl', 'equipment.bear-trap', 'Potrzask na niedźwiedzie');
INSERT INTO public.translations VALUES ('pl', 'equipment.bear-trap.description', 'PT14 by zauważyć, d8 obrażeń');
INSERT INTO public.translations VALUES ('pl', 'equipment.lard', 'Smalec');
INSERT INTO public.translations VALUES ('pl', 'equipment.lard.description', 'W ostateczności może służyć jako 5 posiłków');
INSERT INTO public.translations VALUES ('pl', 'equipment.chewing-tobacco', 'Tytoń do żucia');
INSERT INTO public.translations VALUES ('pl', 'equipment.chewing-tobacco.description', '');
INSERT INTO public.translations VALUES ('pl', 'equipment.chalk', 'Laska kredy');
INSERT INTO public.translations VALUES ('pl', 'equipment.chalk.description', '');
INSERT INTO public.translations VALUES ('pl', 'equipment.salt', 'Butelka soli');
INSERT INTO public.translations VALUES ('pl', 'equipment.salt.description', '');
INSERT INTO public.translations VALUES ('pl', 'equipment.medicine-chest', 'Apteczka');
INSERT INTO public.translations VALUES ('pl', 'equipment.medicine-chest.description', 'Tamuje krwawienie/infekcję i leczy d6 PŻ');
INSERT INTO public.translations VALUES ('pl', 'equipment.life-elixir', 'Eliksir życia');
INSERT INTO public.translations VALUES ('pl', 'equipment.life-elixir.description', 'Leczy d6 PŻ i usuwa infekcję');
INSERT INTO public.translations VALUES ('pl', 'equipment.red-poison', 'Butelka czerwonej trucizny');
INSERT INTO public.translations VALUES ('pl', 'equipment.red-poison.description', 'Wytrzymałość PT12 lub d10 obrażeń');
INSERT INTO public.translations VALUES ('pl', 'equipment.black-poison', 'Butelka czarnej trucizny');
INSERT INTO public.translations VALUES ('pl', 'equipment.black-poison.description', 'Wytrzymałość PT14 lub d6 obrażeń + oślepienie na godzinę');
INSERT INTO public.translations VALUES ('pl', 'equipment.bomb', 'Bomba');
INSERT INTO public.translations VALUES ('pl', 'equipment.bomb.description', 'Zapieczętowana butelka, d10 obrażeń');
INSERT INTO public.translations VALUES ('pl', 'scroll.unclean.1', 'Dłonie otwierają Południową Bramę');
INSERT INTO public.translations VALUES ('pl', 'scroll.unclean.1.description', 'Kula ognia uderza w d2 stworzenia, zadając d8 obrażeń każdemu');
INSERT INTO public.translations VALUES ('pl', 'scroll.unclean.2', 'Język Eris');
INSERT INTO public.translations VALUES ('pl', 'scroll.unclean.2.description', 'Wybrane stworzenie jest zdezorientowane przez 10 minut');
INSERT INTO public.translations VALUES ('pl', 'scroll.unclean.3', 'Te-le-ki-neza');
INSERT INTO public.translations VALUES ('pl', 'scroll.unclean.3.description', 'Przesuń obiekt do 1d10 stóp na d6 minut');
INSERT INTO public.translations VALUES ('pl', 'scroll.unclean.4', 'Lewitacja Lucy-Fires');
INSERT INTO public.translations VALUES ('pl', 'scroll.unclean.4.description', 'Unoszenie się przez Obecność + d10 rund');
INSERT INTO public.translations VALUES ('pl', 'scroll.unclean.5', 'Demon Naczyń Włosowatych');
INSERT INTO public.translations VALUES ('pl', 'scroll.unclean.5.description', 'Jedno stworzenie dusi się przez d6 rund, tracąc d4 PŻ na rundę');
INSERT INTO public.translations VALUES ('pl', 'scroll.unclean.6', 'Dziewięć Fioletowych Znaków Rozsupłuje Burzę');
INSERT INTO public.translations VALUES ('pl', 'scroll.unclean.6.description', 'Wytwarza d2 błyskawice zadające po d6 obrażeń');
INSERT INTO public.translations VALUES ('pl', 'scroll.unclean.7', 'Metzhuotl oślepia twe oko');
INSERT INTO public.translations VALUES ('pl', 'scroll.unclean.7.description', 'Stworzenie staje się niewidzialne na d6 rund');
INSERT INTO public.translations VALUES ('pl', 'scroll.unclean.8', 'Plugawy Psychopomp');
INSERT INTO public.translations VALUES ('pl', 'scroll.unclean.8.description', 'Przywołuje d4 szkielety lub zombie');
INSERT INTO public.translations VALUES ('pl', 'scroll.unclean.9', 'Powieka oślepia umysł');
INSERT INTO public.translations VALUES ('pl', 'scroll.unclean.9.description', 'd4 stworzenia zasypiają na godzinę');
INSERT INTO public.translations VALUES ('pl', 'scroll.unclean.10', 'Śmierć');
INSERT INTO public.translations VALUES ('pl', 'scroll.unclean.10.description', 'Wszystkie stworzenia w promieniu 30 stóp tracą łącznie 4d10 PŻ');
INSERT INTO public.translations VALUES ('pl', 'scroll.sacred.1', 'Łaska Martwego Świętego');
INSERT INTO public.translations VALUES ('pl', 'scroll.sacred.1.description', 'd2 stworzenia odzyskują po d10 PŻ');
INSERT INTO public.translations VALUES ('pl', 'scroll.sacred.2', 'Łaska dla Grzesznika');
INSERT INTO public.translations VALUES ('pl', 'scroll.sacred.2.description', 'Stworzenie otrzymuje +d6 do jednego rzutu');
INSERT INTO public.translations VALUES ('pl', 'scroll.sacred.3', 'Szepty przechodzą przez Bramę');
INSERT INTO public.translations VALUES ('pl', 'scroll.sacred.3.description', 'Zadaj trzy pytania zmarłemu stworzeniu');
INSERT INTO public.translations VALUES ('pl', 'scroll.sacred.4', 'Egida Smutku');
INSERT INTO public.translations VALUES ('pl', 'scroll.sacred.4.description', 'Stworzenie zyskuje 2d6 dodatkowych PŻ na 10 rund');
INSERT INTO public.translations VALUES ('pl', 'scroll.sacred.5', 'Niespełniony Los');
INSERT INTO public.translations VALUES ('pl', 'scroll.sacred.5.description', 'Obudź stworzenie martwe nie dłużej niż tydzień');
INSERT INTO public.translations VALUES ('pl', 'scroll.sacred.6', 'Mowa Bestii');
INSERT INTO public.translations VALUES ('pl', 'scroll.sacred.6.description', 'Rozmawiaj ze zwierzętami przez d20 minut');
INSERT INTO public.translations VALUES ('pl', 'scroll.sacred.7', 'Fałszywy Świt Rydwanu Nocy');
INSERT INTO public.translations VALUES ('pl', 'scroll.sacred.7.description', 'Światło lub egipska ciemność przez 3d10 minut');
INSERT INTO public.translations VALUES ('pl', 'scroll.sacred.8', 'Hermetyczny Krok');
INSERT INTO public.translations VALUES ('pl', 'scroll.sacred.8.description', 'Znajdź wszystkie pułapki na swojej drodze przez 2d10 minut');
INSERT INTO public.translations VALUES ('pl', 'scroll.sacred.9', 'Konsumujące Spojrzenie Roskoe');
INSERT INTO public.translations VALUES ('pl', 'scroll.sacred.9.description', 'd4 stworzenia tracą po d8 PŻ');
INSERT INTO public.translations VALUES ('pl', 'scroll.sacred.10', 'Składnia Enochiańska');
INSERT INTO public.translations VALUES ('pl', 'scroll.sacred.10.description', 'Jedno stworzenie ślepo wykonuje pojedynczy rozkaz');
INSERT INTO public.translations VALUES ('pl', 'equipment.ezumiel-vapor', 'Opary Ezumiela');
INSERT INTO public.translations VALUES ('pl', 'equipment.ezumiel-vapor.description', 'Zdaj test PT14 lub dozna silnych halucynacji przez d4 godziny');
INSERT INTO public.translations VALUES ('pl', 'equipment.southern-frog', 'Gulasz z żaby południowej');
INSERT INTO public.translations VALUES ('pl', 'equipment.southern-frog.description', 'Wymioty przez d4 godziny, test PT14 by móc robić cokolwiek innego');
INSERT INTO public.translations VALUES ('pl', 'equipment.elixir-vitalis', 'Eliksir Vitalis');
INSERT INTO public.translations VALUES ('pl', 'equipment.elixir-vitalis.description', 'Leczy d6 PŻ i powstrzymuje infekcję. Może uzależniać');
INSERT INTO public.translations VALUES ('pl', 'equipment.spider-owl-soup', 'Zupa z pająko-sowy');
INSERT INTO public.translations VALUES ('pl', 'equipment.spider-owl-soup.description', 'Widzenie w ciemności, wspinanie się po ścianach przez 30 minut');
INSERT INTO public.translations VALUES ('pl', 'equipment.fernors-philtre', 'Filtr Fernora');
INSERT INTO public.translations VALUES ('pl', 'equipment.fernors-philtre.description', 'Wpuść do oka. Leczy infekcję, +2 do obecności przez d4 godziny');
INSERT INTO public.translations VALUES ('pl', 'equipment.hyphos-snuff', 'Obezwładniająca tabaka Hyphosa');
INSERT INTO public.translations VALUES ('pl', 'equipment.hyphos-snuff.description', 'Szał! Dwa ataki na rundę, ale obrona z PT14. Jedna walka.');
INSERT INTO public.translations VALUES ('en', 'abilities.fanged_deserter.clumsy', 'Clumsy: All Agility tests (except defense) are DR+2. You cannot use scrolls.');
INSERT INTO public.translations VALUES ('en', 'abilities.fanged_deserter.bite', 'Teeth: DR10 to attack, d6 damage. You must be in close range.');
INSERT INTO public.translations VALUES ('en', 'abilities.fanged_deserter.mask', 'Monster Mask: NPCs must test Morale to stay near you.');
INSERT INTO public.translations VALUES ('en', 'abilities.fanged_deserter.scimitar', 'Brown Scimitar: d10 damage. If you roll a 1, it breaks.');
INSERT INTO public.translations VALUES ('en', 'abilities.fanged_deserter.teeth', 'Wizard Teeth: d6 teeth. Throw for d4 damage; they grow back after rest.');
INSERT INTO public.translations VALUES ('en', 'abilities.fanged_deserter.sling', 'Sigurd''s Sling: 2d4 damage. Heavy stones only.');
INSERT INTO public.translations VALUES ('en', 'abilities.fanged_deserter.shoe', 'Death Horse Shoe: You always win initiative.');
INSERT INTO public.translations VALUES ('en', 'abilities.fanged_deserter.hound', 'Gore-Hound: A loyal pet with d6 HP and d4 bite.');
INSERT INTO public.translations VALUES ('en', 'abilities.gutterborn_scum.stealthy', 'Stealthy: All Presence and Agility DR are reduced by 2.');
INSERT INTO public.translations VALUES ('en', 'abilities.gutterborn_scum.jab', 'Kidney Jab: +d4 damage if you attack from stealth.');
INSERT INTO public.translations VALUES ('en', 'abilities.gutterborn_scum.jester', 'Poltroon the Jester: A pet that mocks your enemies (DR-2 to enemy morale).');
INSERT INTO public.translations VALUES ('en', 'abilities.gutterborn_scum.spatula', 'Graver''s Spatula: Can be used to pry open locks and graves.');
INSERT INTO public.translations VALUES ('en', 'abilities.gutterborn_scum.muck', 'Muck-covered: Your smell is so bad that animals won''t bite you first.');
INSERT INTO public.translations VALUES ('en', 'abilities.gutterborn_scum.poison', 'Poisoner: You can apply poison to your blade (d4 extra damage).');
INSERT INTO public.translations VALUES ('en', 'abilities.gutterborn_scum.nose', 'City Nose: You can smell gold or silver within 30 feet.');
INSERT INTO public.translations VALUES ('en', 'abilities.esoteric_hermit.scrolls', 'Scroll-Bound: You start with two random scrolls.');
INSERT INTO public.translations VALUES ('en', 'abilities.esoteric_hermit.book', 'Book of Fate: Once per day, reroll any one die.');
INSERT INTO public.translations VALUES ('en', 'abilities.esoteric_hermit.staff', 'Hermit''s Staff: d4 damage. Can cast light once per day.');
INSERT INTO public.translations VALUES ('en', 'abilities.wretched_royalty.servant', 'Complacent Servant: Carries all your items and takes hits for you.');
INSERT INTO public.translations VALUES ('en', 'abilities.wretched_royalty.horse', 'Barbarister: A majestic horse that never flees.');
INSERT INTO public.translations VALUES ('en', 'abilities.heretical_priest.sinner', 'Sinner: You cannot be healed by holy magic.');
INSERT INTO public.translations VALUES ('en', 'abilities.heretical_priest.voice', 'Thunderous Voice: Presence DR12 to make an enemy flee.');
INSERT INTO public.translations VALUES ('en', 'abilities.occult_herbmaster.decoctions', 'Herbmaster: You can create d4 decoctions every morning.');
INSERT INTO public.translations VALUES ('en', 'abilities.occult_herbmaster.hyphos', 'Hyphos Snuff: DR-2 to all Toughness tests for 1 hour.');
INSERT INTO public.translations VALUES ('pl', 'habits.14', 'Piroman.');
INSERT INTO public.translations VALUES ('en', 'tales.1', 'Pursued for manslaughter. There is a bounty.');
INSERT INTO public.translations VALUES ('en', 'tales.2', 'In massive debt. The debt is being traded to successively more ruthless groups.');
INSERT INTO public.translations VALUES ('en', 'tales.3', 'You have a rare, sought after item.');
INSERT INTO public.translations VALUES ('en', 'tales.4', 'You have a cursed never-healing wound.');
INSERT INTO public.translations VALUES ('en', 'tales.5', 'Had an illegal, immoral and secret affair with a member of the royal family. You have proof.');
INSERT INTO public.translations VALUES ('en', 'tales.6', 'Escaped cult member. Terrified and paranoid. Other cultists are everywhere.');
INSERT INTO public.translations VALUES ('en', 'tales.7', 'An identity thief who recently killed and replaced this person.');
INSERT INTO public.translations VALUES ('en', 'tales.8', 'Banished and disowned for unspecified deeds. Can never go home.');
INSERT INTO public.translations VALUES ('en', 'tales.9', 'Deserted military after witnessing a massacre, bounty on head. Hunted by former friends.');
INSERT INTO public.translations VALUES ('en', 'tales.10', 'Very recently murdered a close relative. Very recently.');
INSERT INTO public.translations VALUES ('en', 'tales.11', 'A puzzle cube has been calibrated incorrectly (or has it?), awakening a slumbering abomination.');
INSERT INTO public.translations VALUES ('en', 'tales.12', 'Evil creatures love the scent of your spoor and are drawn to it, bringing disaster in your wake.');
INSERT INTO public.translations VALUES ('en', 'tales.13', 'A battle wound left a shard of metal slowly inching closer to your heart. Every day there is a 2% chance it reaches it.');
INSERT INTO public.translations VALUES ('en', 'tales.14', 'Violence forced you into the wilderness. You think waving trees are whispering. You talk to, scream at, attack trees.');
INSERT INTO public.translations VALUES ('en', 'tales.15', 'Cursed to share the nightmares of others, you sleep far, far away.');
INSERT INTO public.translations VALUES ('en', 'tales.16', 'At permanent war with all corvids. No contact without some violence. You carry a sling.');
INSERT INTO public.translations VALUES ('en', 'tales.17', 'After dreaming of an underground temple to a forgotten god you understand the songs of insects and worms.');
INSERT INTO public.translations VALUES ('en', 'tales.18', 'Being tracked and observed by a golem after an agreement which you know has been wiped from your mind.');
INSERT INTO public.translations VALUES ('en', 'tales.19', '''Burn or be burned'' is the fate you accept.');
INSERT INTO public.translations VALUES ('en', 'tales.20', 'Your flesh heals twice as fast, but your companions twice as slow. You see a many-eyed ''guardian angel''.');
INSERT INTO public.translations VALUES ('en', 'habits.1', 'Obsessively collects small sharp stones.');
INSERT INTO public.translations VALUES ('en', 'habits.2', 'Won''t use a blade without testing it on your own flesh. Arms knitted with scars.');
INSERT INTO public.translations VALUES ('en', 'habits.3', 'Can''t stop drinking once you start.');
INSERT INTO public.translations VALUES ('en', 'habits.4', 'Gambling addict. Must bet every day. If you lose, raise and bet again.');
INSERT INTO public.translations VALUES ('en', 'habits.5', 'Cannot tolerate criticism of any kind. Results in rage and weeping.');
INSERT INTO public.translations VALUES ('en', 'habits.6', 'Unable to get to the point. You have never actually finished a story.');
INSERT INTO public.translations VALUES ('en', 'habits.7', 'Best friend is a skull. Carry it with you, tell it everything, you trust no one more.');
INSERT INTO public.translations VALUES ('en', 'habits.8', 'You pick your nose so deep it bleeds.');
INSERT INTO public.translations VALUES ('en', 'habits.9', 'Laughs hysterically at your own jokes which you then explain in detail.');
INSERT INTO public.translations VALUES ('en', 'habits.10', 'A nihilist. You insist on telling everyone you are a nihilist and explaining why.');
INSERT INTO public.translations VALUES ('en', 'habits.11', 'Inveterate bug eater.');
INSERT INTO public.translations VALUES ('en', 'habits.12', 'Stress response is aesthetic display. The worse things get the fancier you need to be.');
INSERT INTO public.translations VALUES ('en', 'habits.13', 'Permanent phlegm deposit in throat. Continuously coughs, snorts, spits and swallows.');
INSERT INTO public.translations VALUES ('en', 'habits.14', 'Pyromaniac.');
INSERT INTO public.translations VALUES ('en', 'habits.15', 'Consistently loses important items and forgets vital facts.');
INSERT INTO public.translations VALUES ('en', 'habits.16', 'Insecure shit-stirrer. Will talk about whoever just left the room.');
INSERT INTO public.translations VALUES ('en', 'habits.17', 'You stutter when lying.');
INSERT INTO public.translations VALUES ('en', 'habits.18', 'You giggle insanely at the worst possible times.');
INSERT INTO public.translations VALUES ('en', 'habits.19', 'You whistle while trying to hide. You will deny this. Whistle when 5, 7, 9, 11, or 13 is rolled on a d20.');
INSERT INTO public.translations VALUES ('en', 'habits.20', 'You make jewelry from the teeth of the dead, if this can be considered a bad habit.');
INSERT INTO public.translations VALUES ('en', 'traits.1', 'endlessly aggravated');
INSERT INTO public.translations VALUES ('en', 'traits.2', 'inferiority complex ridden');
INSERT INTO public.translations VALUES ('en', 'traits.3', 'authority denying');
INSERT INTO public.translations VALUES ('en', 'traits.4', 'loud mouth');
INSERT INTO public.translations VALUES ('en', 'traits.5', 'cruel');
INSERT INTO public.translations VALUES ('en', 'traits.6', 'egocentric');
INSERT INTO public.translations VALUES ('en', 'traits.7', 'nihilistic');
INSERT INTO public.translations VALUES ('en', 'traits.8', 'prone to substance abuse');
INSERT INTO public.translations VALUES ('en', 'traits.9', 'conflicted');
INSERT INTO public.translations VALUES ('en', 'traits.10', 'shrewd');
INSERT INTO public.translations VALUES ('en', 'traits.11', 'vindictive');
INSERT INTO public.translations VALUES ('en', 'traits.12', 'cowardly');
INSERT INTO public.translations VALUES ('en', 'traits.13', 'lazy');
INSERT INTO public.translations VALUES ('en', 'traits.14', 'suspicious');
INSERT INTO public.translations VALUES ('en', 'traits.15', 'ruthless');
INSERT INTO public.translations VALUES ('en', 'traits.16', 'constantly worried');
INSERT INTO public.translations VALUES ('en', 'traits.17', 'very bitter');
INSERT INTO public.translations VALUES ('en', 'traits.18', 'deceitful');
INSERT INTO public.translations VALUES ('en', 'traits.19', 'wasteful');
INSERT INTO public.translations VALUES ('en', 'traits.20', 'arrogant');
INSERT INTO public.translations VALUES ('en', 'body.1', 'Has a staring manic gaze');
INSERT INTO public.translations VALUES ('en', 'body.2', 'Is covered in (for some) blasphemous tattoos');
INSERT INTO public.translations VALUES ('en', 'body.3', 'Has a rotting face (wears a mask)');
INSERT INTO public.translations VALUES ('en', 'body.4', 'Is missing 3 toes, is limping');
INSERT INTO public.translations VALUES ('en', 'body.5', 'Looks starved: gaunt and pale');
INSERT INTO public.translations VALUES ('en', 'body.6', 'One hand is replaced with a rusting hook');
INSERT INTO public.translations VALUES ('en', 'body.7', 'Has decaying teeth');
INSERT INTO public.translations VALUES ('en', 'body.8', 'Is hauntingly beautiful, unnervingly clean');
INSERT INTO public.translations VALUES ('en', 'body.9', 'Has hands caked with sores');
INSERT INTO public.translations VALUES ('en', 'body.10', 'Has cataract and its slowly but surely spreading to both eyes');
INSERT INTO public.translations VALUES ('en', 'body.11', 'Has long tangled hair, at least one cockroach is in residence');
INSERT INTO public.translations VALUES ('en', 'body.12', 'Has broken crushed ears');
INSERT INTO public.translations VALUES ('en', 'body.13', 'Is juddering and stuttering from nerve damage or stress');
INSERT INTO public.translations VALUES ('en', 'body.14', 'Is corpulent, ravenous, drooling');
INSERT INTO public.translations VALUES ('en', 'body.15', 'In one hand misses a thumb and index finger, grips like a lobster');
INSERT INTO public.translations VALUES ('en', 'body.16', 'Has a red, swollen alcoholic''s nose');
INSERT INTO public.translations VALUES ('en', 'body.17', 'Has resting maniac face, making friends is hard');
INSERT INTO public.translations VALUES ('en', 'body.18', 'Has chronic athlete''s foot');
INSERT INTO public.translations VALUES ('en', 'body.19', 'Was recently slashed and stinking eye is covered with a patch');
INSERT INTO public.translations VALUES ('en', 'body.20', 'Has cracked black nails, probably about to drop off');
INSERT INTO public.translations VALUES ('pl', 'tales.1', 'Ścigany za nieumyślne spowodowanie śmierci. Wyznaczono nagrodę.');
INSERT INTO public.translations VALUES ('pl', 'tales.2', 'W ogromnych długach. Dług jest sprzedawany coraz bardziej bezwzględnym grupom.');
INSERT INTO public.translations VALUES ('pl', 'tales.3', 'Posiadasz rzadki, pożądany przedmiot.');
INSERT INTO public.translations VALUES ('pl', 'tales.4', 'Masz przeklętą, nigdy nie gojącą się ranę.');
INSERT INTO public.translations VALUES ('pl', 'tales.5', 'Miałeś nielegalny, niemoralny i tajny romans z członkiem rodziny królewskiej. Masz dowód.');
INSERT INTO public.translations VALUES ('pl', 'tales.6', 'Zbiegły członek kultu. Przerażony i paranoiczny. Inni kultyści są wszędzie.');
INSERT INTO public.translations VALUES ('pl', 'tales.7', 'Złodziej tożsamości, który niedawno zabił i zastąpił tę osobę.');
INSERT INTO public.translations VALUES ('pl', 'tales.8', 'Wygnany i wydziedziczony za niesprecyzowane czyny. Nigdy nie możesz wrócić do domu.');
INSERT INTO public.translations VALUES ('pl', 'tales.9', 'Zdezerterował z wojska po byciu świadkiem masakry, nagroda za głowę. Ścigany przez dawnych przyjaciół.');
INSERT INTO public.translations VALUES ('pl', 'tales.10', 'Bardzo niedawno zamordował bliskiego krewnego. Bardzo niedawno.');
INSERT INTO public.translations VALUES ('pl', 'tales.11', 'Kostka zagadki została błędnie skalibrowana (czyżby?), budząc uśpioną abominację.');
INSERT INTO public.translations VALUES ('pl', 'tales.12', 'Złe stworzenia uwielbiają zapach twoich śladów i są do nich przyciągane, sprowadzając nieszczęście tam, gdzie się pojawisz.');
INSERT INTO public.translations VALUES ('pl', 'tales.13', 'Rana bitewna pozostawiła odłamek metalu powoli przesuwający się w stronę serca. Każdego dnia jest 2% szansy, że do niego dotrze.');
INSERT INTO public.translations VALUES ('pl', 'tales.14', 'Przemoc zmusiła cię do ucieczki w dzicz. Myślisz, że kołyszące się drzewa szepczą. Rozmawiasz z drzewami, krzyczysz na nie, atakujesz je.');
INSERT INTO public.translations VALUES ('pl', 'tales.15', 'Przeklęty, by dzielić koszmary innych, śpisz daleko, bardzo daleko.');
INSERT INTO public.translations VALUES ('pl', 'tales.16', 'Na stałe w stanie wojny ze wszystkimi krukowatymi. Żadnego kontaktu bez przemocy. Nosisz procę.');
INSERT INTO public.translations VALUES ('pl', 'tales.17', 'Po śnieniu o podziemnej świątyni zapomnianego boga, rozumiesz pieśni owadów i robaków.');
INSERT INTO public.translations VALUES ('pl', 'tales.18', 'Śledzony i obserwowany przez golema po umowie, która – jak wiesz – została wymazana z twojej pamięci.');
INSERT INTO public.translations VALUES ('pl', 'tales.19', '''Płoń lub daj się spalić'' to los, który akceptujesz.');
INSERT INTO public.translations VALUES ('pl', 'tales.20', 'Twoje ciało goi się dwa razy szybciej, ale twoich towarzyszy dwa razy wolniej. Widzisz wielookiego ''anioła stróża''.');
INSERT INTO public.translations VALUES ('pl', 'habits.1', 'Obsesyjnie zbiera małe ostre kamienie.');
INSERT INTO public.translations VALUES ('pl', 'habits.2', 'Nie użyje ostrza bez przetestowania go na własnym ciele. Ramiona pokryte bliznami.');
INSERT INTO public.translations VALUES ('pl', 'habits.3', 'Nie potrafi przestać pić, gdy już zacznie.');
INSERT INTO public.translations VALUES ('pl', 'habits.4', 'Hazardzista. Musi obstawiać każdego dnia. Jeśli przegra, podbija stawkę i obstawia ponownie.');
INSERT INTO public.translations VALUES ('pl', 'habits.5', 'Nie toleruje krytyki w żadnej formie. Skutkuje to wściekłością i płaczem.');
INSERT INTO public.translations VALUES ('pl', 'habits.6', 'Nie potrafi przejść do sedna. Nigdy tak naprawdę nie dokończył żadnej opowieści.');
INSERT INTO public.translations VALUES ('pl', 'habits.7', 'Najlepszym przyjacielem jest czaszka. Nosisz ją ze sobą, mówisz jej wszystko, nikomu nie ufasz bardziej.');
INSERT INTO public.translations VALUES ('pl', 'habits.8', 'Dłubie w nosie tak głęboko, że krwawi.');
INSERT INTO public.translations VALUES ('pl', 'habits.9', 'Śmieje się histerycznie z własnych żartów, które potem szczegółowo wyjaśnia.');
INSERT INTO public.translations VALUES ('pl', 'habits.10', 'Nihilista. Upiera się przy mówieniu każdemu, że jest nihilistą i wyjaśnianiu dlaczego.');
INSERT INTO public.translations VALUES ('pl', 'habits.11', 'Zatwardziały pożeracz robaków.');
INSERT INTO public.translations VALUES ('pl', 'habits.12', 'Reakcją na stres jest dbałość o estetykę. Im gorzej się dzieje, tym bardziej strojny musisz być.');
INSERT INTO public.translations VALUES ('pl', 'habits.13', 'Stała wydzielina w gardle. Ciągle kaszle, pociąga nosem, spluwa i przełyka.');
INSERT INTO public.translations VALUES ('pl', 'habits.15', 'Notorycznie gubi ważne przedmioty i zapomina o istotnych faktach.');
INSERT INTO public.translations VALUES ('pl', 'habits.16', 'Niepewny siebie mąciwoda. Będzie obgadywać każdego, kto właśnie wyszedł z pokoju.');
INSERT INTO public.translations VALUES ('pl', 'habits.17', 'Jąka się, gdy kłamie.');
INSERT INTO public.translations VALUES ('pl', 'habits.18', 'Chichocze obłąkańczo w najgorszych możliwych momentach.');
INSERT INTO public.translations VALUES ('pl', 'habits.19', 'Gwiżdże, próbując się ukryć. Będzie temu zaprzeczać. Gwiżdże, gdy na k20 wypadnie 5, 7, 9, 11 lub 13.');
INSERT INTO public.translations VALUES ('pl', 'habits.20', 'Robi biżuterię z zębów zmarłych, jeśli można to uznać za zły nawyk.');
INSERT INTO public.translations VALUES ('pl', 'traits.1', 'ciągle poirytowany');
INSERT INTO public.translations VALUES ('pl', 'traits.2', 'pełen kompleksów niższości');
INSERT INTO public.translations VALUES ('pl', 'traits.3', 'negujący autorytety');
INSERT INTO public.translations VALUES ('pl', 'traits.4', 'pyskacz');
INSERT INTO public.translations VALUES ('pl', 'traits.5', 'okrutny');
INSERT INTO public.translations VALUES ('pl', 'traits.6', 'egocentryczny');
INSERT INTO public.translations VALUES ('pl', 'traits.7', 'nihilistyczny');
INSERT INTO public.translations VALUES ('pl', 'traits.8', 'skłonny do używek');
INSERT INTO public.translations VALUES ('pl', 'traits.9', 'skonfliktowany');
INSERT INTO public.translations VALUES ('pl', 'traits.10', 'przebiegły');
INSERT INTO public.translations VALUES ('pl', 'traits.11', 'mściwy');
INSERT INTO public.translations VALUES ('pl', 'traits.12', 'tchórzliwy');
INSERT INTO public.translations VALUES ('pl', 'traits.13', 'leniwy');
INSERT INTO public.translations VALUES ('pl', 'traits.14', 'podejrzliwy');
INSERT INTO public.translations VALUES ('pl', 'traits.15', 'bezwzględny');
INSERT INTO public.translations VALUES ('pl', 'traits.16', 'ciągle zmartwiony');
INSERT INTO public.translations VALUES ('pl', 'traits.17', 'bardzo gorzki');
INSERT INTO public.translations VALUES ('pl', 'traits.18', 'podstępny');
INSERT INTO public.translations VALUES ('pl', 'traits.19', 'rozrzutny');
INSERT INTO public.translations VALUES ('pl', 'traits.20', 'arogancki');
INSERT INTO public.translations VALUES ('pl', 'body.1', 'Ma obłąkane, utkwione spojrzenie');
INSERT INTO public.translations VALUES ('pl', 'body.2', 'Pokryty (dla niektórych) bluźnierczymi tatuażami');
INSERT INTO public.translations VALUES ('pl', 'body.3', 'Ma gnijącą twarz (nosi maskę)');
INSERT INTO public.translations VALUES ('pl', 'body.4', 'Brakuje mu 3 palców u nóg, utyka');
INSERT INTO public.translations VALUES ('pl', 'body.5', 'Wygląda na zagłodzonego: wychudzony i blady');
INSERT INTO public.translations VALUES ('pl', 'body.6', 'Jedna ręka zastąpiona rdzewiejącym hakiem');
INSERT INTO public.translations VALUES ('pl', 'body.7', 'Ma zepsute zęby');
INSERT INTO public.translations VALUES ('pl', 'body.8', 'Niepokojąco piękny, nienaturalnie czysty');
INSERT INTO public.translations VALUES ('pl', 'body.9', 'Dłonie pokryte strupami');
INSERT INTO public.translations VALUES ('pl', 'body.10', 'Ma kataraktę, która powoli, ale nieuchronnie rozprzestrzenia się na oba oczy');
INSERT INTO public.translations VALUES ('pl', 'body.11', 'Długie splątane włosy, zamieszkane przez przynajmniej jednego karalucha');
INSERT INTO public.translations VALUES ('pl', 'body.12', 'Zmiażdżone małżowiny uszne');
INSERT INTO public.translations VALUES ('pl', 'body.13', 'Drży i jąka się z powodu uszkodzenia nerwów lub stresu');
INSERT INTO public.translations VALUES ('pl', 'body.14', 'Otyły, zachłanny, śliniący się');
INSERT INTO public.translations VALUES ('pl', 'body.15', 'W jednej dłoni brakuje kciuka i palca wskazującego, chwyta jak szczypcami homara');
INSERT INTO public.translations VALUES ('pl', 'body.16', 'Ma czerwony, opuchnięty nos alkoholika');
INSERT INTO public.translations VALUES ('pl', 'body.17', 'Ma twarz maniaka (resting maniac face), trudno mu nawiązywać przyjaźnie');
INSERT INTO public.translations VALUES ('pl', 'body.18', 'Ma przewlekłą grzybicę stóp');
INSERT INTO public.translations VALUES ('pl', 'body.19', 'Niedawno pocięty, cuchnące oko zakryte opaską');
INSERT INTO public.translations VALUES ('pl', 'body.20', 'Ma pęknięte czarne paznokcie, prawdopodobnie zaraz odpadną');
INSERT INTO public.translations VALUES ('en', 'classes.fanged_deserter.appendix', 'You have thirty or so friends who never let you down: YOUR TEETH. Fanged, infectious, and magnificent.');
INSERT INTO public.translations VALUES ('en', 'classes.gutterborn_scum.appendix', 'An ill star smiled upon your birth. Poverty, crime, and bad parenting didn’t help either. In your eyes, the world is a gutter.');
INSERT INTO public.translations VALUES ('en', 'classes.esoteric_hermit.appendix', 'The stone of your cave is one with the stars. Silence and perfection. You are a vessel for the bizarre.');
INSERT INTO public.translations VALUES ('en', 'classes.wretched_royalty.appendix', 'Bowed down only by the memories of your own lost glory, you could never submit to anyone else. You are noble, even in the mud.');
INSERT INTO public.translations VALUES ('en', 'classes.heretical_priest.appendix', 'Hunted by the Two-Headed Basilisks of the One True Faith, you can be found raving in ruins and cursing the sky.');
INSERT INTO public.translations VALUES ('en', 'origins.occult_herbmaster.7', 'From a little witches cottage in Galgenbeck.');
INSERT INTO public.translations VALUES ('en', 'origins.occult_herbmaster.8', 'From the ruins of the Shadow King''s manse, thick of memories of mushrooms and smoke.');
INSERT INTO public.translations VALUES ('en', 'items.crumpled_monster_mask', 'Crumpled Monster Mask');
INSERT INTO public.translations VALUES ('en', 'items.brown_scimitar', 'The Brown Scimitar of Galgenbeck');
INSERT INTO public.translations VALUES ('en', 'items.wizard_teeth', 'Wizard Teeth');
INSERT INTO public.translations VALUES ('en', 'items.sigurds_sling', 'Old Sigûrd''s Sling');
INSERT INTO public.translations VALUES ('en', 'items.death_horse_shoe', 'The Shoe of Death''s Horse');
INSERT INTO public.translations VALUES ('en', 'pets.gore_hound', 'Ancient Gore-Hound');
INSERT INTO public.translations VALUES ('en', 'pets.poltroon', '"Poltroon" the Court Jester');
INSERT INTO public.translations VALUES ('en', 'pets.barbarister', 'Barbarister the Incredible Horse');
INSERT INTO public.translations VALUES ('en', 'pets.hamfund', 'Hamfund the Squire');
INSERT INTO public.translations VALUES ('en', 'pets.hawk', 'Hawk');
INSERT INTO public.translations VALUES ('en', 'classes.occult_herbmaster.appendix', 'Born of the mushroom, raised in the glade, watched by the eye of the moon in a silver-black pool.');
INSERT INTO public.translations VALUES ('en', 'origins.fanged_deserter.1', 'Your earliest memories are of a burnt-black building in Sarkash. Your home?');
INSERT INTO public.translations VALUES ('en', 'origins.fanged_deserter.2', 'Your earliest memories are of a derelict rotting ship rolling endlessly across a grey sea.');
INSERT INTO public.translations VALUES ('en', 'origins.fanged_deserter.3', 'Your earliest memories are of a brothel in Schleswig. Quite a friendly environment.');
INSERT INTO public.translations VALUES ('en', 'origins.fanged_deserter.4', 'Your earliest memories are of sleeping with dogs in the corner of an inn, waiting for someone to return.');
INSERT INTO public.translations VALUES ('en', 'origins.fanged_deserter.5', 'Your earliest memories are of following an army in eastern Wästland.');
INSERT INTO public.translations VALUES ('en', 'origins.fanged_deserter.6', 'Your earliest memories are of suckling a wolf in the wilds of Bergen Chrypt.');
INSERT INTO public.translations VALUES ('en', 'origins.gutterborn_scum.1', 'As a child, you were dumped onto a moving shit-cart still in your birth caul.');
INSERT INTO public.translations VALUES ('en', 'origins.esoteric_hermit.1', 'You remember awakening, adult, in a ritual circle underneath the northern bridge to Grift.');
INSERT INTO public.translations VALUES ('en', 'origins.esoteric_hermit.2', 'You wandered, memoryless, from the mouth of a cavern at the cliffs of Terion.');
INSERT INTO public.translations VALUES ('en', 'origins.esoteric_hermit.3', 'You were the single child survivor of an incident in the Valley of the Unfortunate Undead.');
INSERT INTO public.translations VALUES ('en', 'origins.gutterborn_scum.2', 'As a child, your mother was hanged from a tree outside of Galgenbeck, you fell from the corpse.');
INSERT INTO public.translations VALUES ('en', 'origins.gutterborn_scum.3', 'As a child, you were raised by rats in the gutters of Grift.');
INSERT INTO public.translations VALUES ('en', 'origins.gutterborn_scum.4', 'As a child, you grew up kicked and beaten beneath a baker''s table in Schleswig.');
INSERT INTO public.translations VALUES ('en', 'origins.gutterborn_scum.5', 'As a child, you escaped the Tvelandian orphanarium.');
INSERT INTO public.translations VALUES ('en', 'origins.gutterborn_scum.6', 'As a child, you were educated by outlaws in a hovel south of Allians.');
INSERT INTO public.translations VALUES ('pl', 'classes.fanged_deserter.name', 'Kłowaty Dezerter');
INSERT INTO public.translations VALUES ('pl', 'classes.fanged_deserter.description', 'Masz ze trzydziestu przyjaciół, którzy nigdy cię nie zawiodą: TWOJE ZĘBY. Nielojalny, obłąkany lub po prostu niekontrolowany, każdą grupę, która cię nie wyrzuciła, sam opuściłeś.');
INSERT INTO public.translations VALUES ('pl', 'classes.gutterborn_scum.name', 'Rynsztokowy Szumowina');
INSERT INTO public.translations VALUES ('pl', 'classes.gutterborn_scum.description', 'Zła gwiazda uśmiechnęła się przy twoich narodzinach. Bieda, przestępczość i złe wychowanie też nie pomogły. Żyletka i bezksiężycowa noc są warte tygodnia ciężkiej roboty.');
INSERT INTO public.translations VALUES ('pl', 'classes.esoteric_hermit.name', 'Ezoteryczny Pustelnik');
INSERT INTO public.translations VALUES ('pl', 'classes.esoteric_hermit.description', 'Kamień twojej jaskini jest jednym z gwiazdami. Cisza i doskonałość. Teraz chaos upadłego świata zakłóca twoje rytuały.');
INSERT INTO public.translations VALUES ('pl', 'classes.wretched_royalty.name', 'Nędzna Królewskość');
INSERT INTO public.translations VALUES ('pl', 'classes.wretched_royalty.description', 'Uginasz się tylko pod ciężarem wspomnień własnej utraconej chwały, nigdy nie mógłbyś podporządkować się komuś innemu. Nie ty, z krwi szlacheckiej!');
INSERT INTO public.translations VALUES ('pl', 'classes.heretical_priest.name', 'Heretycki Kapłan');
INSERT INTO public.translations VALUES ('pl', 'classes.heretical_priest.description', 'Ścigany przez Dwugłowe Bazyliszki Jedynej Prawdziwej Wiary, można cię znaleźć bredzącego w ruinach i profanującego katedry nocą.');
INSERT INTO public.translations VALUES ('pl', 'classes.occult_herbmaster.name', 'Okultystyczny Zielarz');
INSERT INTO public.translations VALUES ('pl', 'classes.occult_herbmaster.description', 'Zrodzony z grzyba, wychowany w polanie, obserwowany przez oko księżyca w srebrnoczarnym stawie.');
INSERT INTO public.translations VALUES ('pl', 'origins.fanged_deserter.1', 'Twoje najwcześniejsze wspomnienia to spalony na węgiel budynek w Sarkash. Twój dom?');
INSERT INTO public.translations VALUES ('pl', 'origins.fanged_deserter.2', 'Twoje najwcześniejsze wspomnienia to porzucony gnijący statek kołyszący się bez końca po szarym morzu.');
INSERT INTO public.translations VALUES ('pl', 'origins.fanged_deserter.3', 'Twoje najwcześniejsze wspomnienia to burdel w Schleswig. Całkiem przyjazne środowisko.');
INSERT INTO public.translations VALUES ('pl', 'origins.fanged_deserter.4', 'Twoje najwcześniejsze wspomnienia to spanie z psami w kącie karczmy, czekając na czyiś powrót.');
INSERT INTO public.translations VALUES ('pl', 'origins.fanged_deserter.5', 'Twoje najwcześniejsze wspomnienia to podążanie za armią we wschodnim Wästland.');
INSERT INTO public.translations VALUES ('pl', 'origins.fanged_deserter.6', 'Twoje najwcześniejsze wspomnienia to ssanie wilczycy na dzikich terenach Bergen Chrypt.');
INSERT INTO public.translations VALUES ('pl', 'origins.gutterborn_scum.1', 'Jako dziecko zostałeś wrzucony na jadący wóz z gównem, wciąż w błonie płodowej.');
INSERT INTO public.translations VALUES ('pl', 'origins.gutterborn_scum.2', 'Jako dziecko twoją matkę powieszono na drzewie pod Galgenbeck, spadłeś z jej zwłok.');
INSERT INTO public.translations VALUES ('pl', 'origins.gutterborn_scum.3', 'Jako dziecko byłeś wychowywany przez szczury w rynsztokach Grift.');
INSERT INTO public.translations VALUES ('pl', 'origins.gutterborn_scum.4', 'Jako dziecko dorastałeś kopany i bity pod stołem piekarza w Schleswig.');
INSERT INTO public.translations VALUES ('pl', 'origins.gutterborn_scum.5', 'Jako dziecko uciekłeś z sierocinarium w Tveland.');
INSERT INTO public.translations VALUES ('pl', 'origins.gutterborn_scum.6', 'Jako dziecko byłeś edukowany przez banitów w ruderze na południe od Allians.');
INSERT INTO public.translations VALUES ('pl', 'origins.esoteric_hermit.1', 'Pamiętasz przebudzenie, dorosły, w kręgu rytualnym pod północnym mostem do Grift.');
INSERT INTO public.translations VALUES ('pl', 'origins.esoteric_hermit.2', 'Błąkałeś się, bez pamięci, z wnętrza jaskini przy klifach Terion.');
INSERT INTO public.translations VALUES ('pl', 'origins.esoteric_hermit.3', 'Byłeś jedynym dzieckiem, które przeżyło incydent w Dolinie Nieszczęsnych Nieumarłych.');
INSERT INTO public.translations VALUES ('pl', 'origins.esoteric_hermit.4', 'Umierałeś na zarazę w norze w Bergen Chrypt, gdy dotknąłeś czegoś z zewnątrz.');
INSERT INTO public.translations VALUES ('pl', 'origins.esoteric_hermit.5', 'Byłeś przeciętną osobą, dopóki nie spotkałeś czegoś w mrocznej polanie w Sarkash.');
INSERT INTO public.translations VALUES ('pl', 'origins.esoteric_hermit.6', 'Wychowałeś się na samotnej wyspie na jeziorze Onda. Nikt inny o niej nie słyszał.');
INSERT INTO public.translations VALUES ('pl', 'origins.wretched_royalty.1', 'Wszystko szło tak dobrze, dopóki twój pałac w Wästland nie został obrócony w gruzy.');
INSERT INTO public.translations VALUES ('pl', 'origins.wretched_royalty.2', 'Wszystko szło tak dobrze, dopóki twoje karawanowe królestwo Tveland nie popadło w nędzę.');
INSERT INTO public.translations VALUES ('pl', 'origins.wretched_royalty.3', 'Wszystko szło tak dobrze, dopóki brat króla Fathmu IX, Zigmund, twój ojciec, nie został zamordowany.');
INSERT INTO public.translations VALUES ('pl', 'origins.wretched_royalty.4', 'Wszystko szło tak dobrze, dopóki południowe imperium Südglans nie zatonęło w morzu.');
INSERT INTO public.translations VALUES ('pl', 'origins.wretched_royalty.5', 'Wszystko szło tak dobrze, dopóki dwóch młodych książąt nie zostało porwanych na zachód od Bergen Chrypt.');
INSERT INTO public.translations VALUES ('pl', 'origins.wretched_royalty.6', 'Wszystko szło tak dobrze, dopóki Anthelia nie zażądała daru z szlacheckiej krwi.');
INSERT INTO public.translations VALUES ('pl', 'origins.heretical_priest.1', 'Pochodzisz z Galgenbeck, w pobliżu katedry Dwugłowych Bazyliszków.');
INSERT INTO public.translations VALUES ('pl', 'origins.heretical_priest.2', 'Jesteś jedynym ocalałym z zmasakrowanego kultu Allians.');
INSERT INTO public.translations VALUES ('pl', 'origins.heretical_priest.3', 'Pochodzisz z krypt Grift.');
INSERT INTO public.translations VALUES ('pl', 'origins.heretical_priest.4', 'Pochodzisz z jakichś ruin świątyni w Dolinie Nieszczęsnych Nieumarłych.');
INSERT INTO public.translations VALUES ('pl', 'origins.heretical_priest.5', 'Pochodzisz z jednego z wielu tuneli złodziejskich Graven-Tosk.');
INSERT INTO public.translations VALUES ('pl', 'origins.heretical_priest.6', 'Pochodzisz z tajnego kościoła w Bergen Chrypt.');
INSERT INTO public.translations VALUES ('pl', 'origins.occult_herbmaster.1', 'Wychowany w spokojnej izolacji w mroku Sarkash.');
INSERT INTO public.translations VALUES ('pl', 'origins.occult_herbmaster.2', 'Z nielegalnych nocnych targów w Schleswig.');
INSERT INTO public.translations VALUES ('pl', 'origins.occult_herbmaster.3', 'Z heretyckiej wyspy Crëlut, dwie mile morskie na wschód od Grift.');
INSERT INTO public.translations VALUES ('pl', 'origins.occult_herbmaster.4', 'Ze starych zamarzniętych ruin niedaleko Allians.');
INSERT INTO public.translations VALUES ('pl', 'origins.occult_herbmaster.5', 'Z małej chatki wiedźmy w Galgenbeck.');
INSERT INTO public.translations VALUES ('pl', 'origins.occult_herbmaster.6', 'Z ruin dworu Króla Cieni.');
INSERT INTO public.translations VALUES ('pl', 'abilities.fanged_deserter.clumsy', 'Niezdarny: Wszystkie testy Zwinności (oprócz obrony) mają PT+2. Nie możesz używać zwojów.');
INSERT INTO public.translations VALUES ('pl', 'abilities.fanged_deserter.bite', 'Zęby: PT10 do ataku, d6 obrażeń. Musisz być w zasięgu bliskim.');
INSERT INTO public.translations VALUES ('pl', 'abilities.fanged_deserter.mask', 'Maska Potwora: BN muszą zdać test Morale, aby pozostać w pobliżu.');
INSERT INTO public.translations VALUES ('pl', 'abilities.fanged_deserter.scimitar', 'Brązowy Sejmitar: d10 obrażeń. Jeśli wyrzucisz 1, pęka.');
INSERT INTO public.translations VALUES ('pl', 'abilities.fanged_deserter.teeth', 'Zęby Czarodzieja: d6 zębów. Rzuć za d4 obrażeń; odrastają po odpoczynku.');
INSERT INTO public.translations VALUES ('pl', 'abilities.fanged_deserter.sling', 'Proca Sigürda: 2d4 obrażeń. Tylko ciężkie kamienie.');
INSERT INTO public.translations VALUES ('pl', 'abilities.fanged_deserter.shoe', 'Podkowa Konia Śmierci: Zawsze wygrywasz inicjatywę.');
INSERT INTO public.translations VALUES ('pl', 'abilities.fanged_deserter.hound', 'Ogar Krwi: Lojalny zwierzak z d6 PŻ i d4 ugryzieniem.');
INSERT INTO public.translations VALUES ('pl', 'abilities.gutterborn_scum.stealthy', 'Skryty: Wszystkie PT Obecności i Zwinności są zmniejszone o 2.');
INSERT INTO public.translations VALUES ('pl', 'abilities.gutterborn_scum.jab', 'Cios w Nerkę: +d4 obrażeń przy ataku z ukrycia.');
INSERT INTO public.translations VALUES ('pl', 'abilities.gutterborn_scum.jester', 'Poltroon Błazen: Zwierzak, który wyśmiewa twoich wrogów (PT-2 do morale wroga).');
INSERT INTO public.translations VALUES ('pl', 'abilities.gutterborn_scum.spatula', 'Szpachelka Grabarza: Może być użyta do otwierania zamków i grobów.');
INSERT INTO public.translations VALUES ('pl', 'abilities.gutterborn_scum.muck', 'Pokryty Błotem: Twój zapach jest tak okropny, że zwierzęta nie gryzą cię pierwsze.');
INSERT INTO public.translations VALUES ('pl', 'abilities.gutterborn_scum.poison', 'Truciciel: Możesz nakładać truciznę na ostrze (d4 dodatkowych obrażeń).');
INSERT INTO public.translations VALUES ('pl', 'abilities.gutterborn_scum.nose', 'Miejski Nos: Wyczuwasz złoto lub srebro w promieniu 30 stóp.');
INSERT INTO public.translations VALUES ('pl', 'abilities.esoteric_hermit.scrolls', 'Związany ze Zwojami: Zaczynasz z dwoma losowymi zwojami.');
INSERT INTO public.translations VALUES ('pl', 'abilities.esoteric_hermit.book', 'Księga Przeznaczenia: Raz dziennie przerzuć dowolną kość.');
INSERT INTO public.translations VALUES ('pl', 'abilities.esoteric_hermit.staff', 'Laska Pustelnika: d4 obrażeń. Może rzucić światło raz dziennie.');
INSERT INTO public.translations VALUES ('pl', 'abilities.esoteric_hermit.skin', 'Skóra Pustelnika: -d2 do obrażeń od zimna i gorąca.');
INSERT INTO public.translations VALUES ('pl', 'abilities.esoteric_hermit.ash', 'Popiół Pustelnika: Rzuć garść popiołu, aby oślepić wrogów na d4 rund.');
INSERT INTO public.translations VALUES ('pl', 'abilities.esoteric_hermit.eye', 'Oko Pustelnika: Widzisz w ciemności na odległość 30 stóp.');
INSERT INTO public.translations VALUES ('pl', 'abilities.esoteric_hermit.bird', 'Ptak Pustelnika: Mały ptak przynosi ci wieści i drobne przedmioty.');
INSERT INTO public.translations VALUES ('pl', 'abilities.wretched_royalty.servant', 'Potulny Sługa: Nosi wszystkie twoje przedmioty i przyjmuje za ciebie ciosy.');
INSERT INTO public.translations VALUES ('pl', 'abilities.wretched_royalty.horse', 'Barbarister: Majestatyczny koń, który nigdy nie ucieka.');
INSERT INTO public.translations VALUES ('pl', 'abilities.wretched_royalty.blade', 'Ostrze Przodków: d6+1 obrażeń. Gadający miecz, który czasem cię atakuje.');
INSERT INTO public.translations VALUES ('pl', 'abilities.wretched_royalty.seal', 'Królewska Pieczęć: Możesz żądać posłuszeństwa od pospólstwa (PT10 Obecność).');
INSERT INTO public.translations VALUES ('pl', 'abilities.wretched_royalty.squire', 'Giermek Hamfund: Tchórzliwy strażnik miecza Eurekia. 2d6 obrażeń, ale 1 na 6 zabija giermka.');
INSERT INTO public.translations VALUES ('pl', 'abilities.wretched_royalty.cape', 'Peleryna Szlachectwa: +2 do testów Obecności wobec pospólstwa.');
INSERT INTO public.translations VALUES ('pl', 'abilities.wretched_royalty.crown', 'Korona Bez Królestwa: Raz dziennie zainspiruj sojuszników, +2 do następnego testu.');
INSERT INTO public.translations VALUES ('pl', 'abilities.heretical_priest.sinner', 'Grzesznik: Nie możesz być leczony przez świętą magię.');
INSERT INTO public.translations VALUES ('pl', 'abilities.heretical_priest.beak', 'Dziób Zarazy: Maska dająca +2 do obrony przed chorobami.');
INSERT INTO public.translations VALUES ('pl', 'abilities.heretical_priest.breath', 'Oddech Heretyka: Twój oddech może zatruć wodę (test PT14 lub d4 obrażeń).');
INSERT INTO public.translations VALUES ('pl', 'abilities.heretical_priest.voice', 'Grzmiący Głos: PT12 Obecność, aby zmusić wroga do ucieczki.');
INSERT INTO public.translations VALUES ('pl', 'abilities.heretical_priest.fingers', 'Palce Kapłana: Możesz wyczuć świętość lub nieczystość dotykając przedmiotów.');
INSERT INTO public.translations VALUES ('pl', 'abilities.heretical_priest.tongue', 'Język Heretyka: Mówisz w obcych językach, gdy jesteś w transie.');
INSERT INTO public.translations VALUES ('pl', 'abilities.heretical_priest.eye', 'Oko Herezji: Widzisz demony i nieumarłych niewidzialnych dla innych.');
INSERT INTO public.translations VALUES ('pl', 'abilities.occult_herbmaster.decoctions', 'Zielarz: Możesz tworzyć d4 wywarów każdego ranka.');
INSERT INTO public.translations VALUES ('pl', 'abilities.occult_herbmaster.hyphos', 'Tabaka Hyphosa: PT-2 do wszystkich testów Wytrzymałości przez 1 godzinę.');
INSERT INTO public.translations VALUES ('pl', 'abilities.occult_herbmaster.black_poison', 'Czarna Trucizna: PT14 Wytrzymałość lub d6 obrażeń + ślepota na godzinę.');
INSERT INTO public.translations VALUES ('pl', 'abilities.occult_herbmaster.red_poison', 'Czerwona Trucizna: PT12 Wytrzymałość lub d10 obrażeń.');
INSERT INTO public.translations VALUES ('pl', 'abilities.occult_herbmaster.ezumiel', 'Opary Ezumiela: Ofiara ma halucynacje przez d4 godziny (PT14 aby się oprzeć).');
INSERT INTO public.translations VALUES ('pl', 'abilities.occult_herbmaster.frog', 'Gulasz z Żaby Południowej: Wymioty przez d4 godziny (PT14 aby cokolwiek robić).');
INSERT INTO public.translations VALUES ('pl', 'abilities.occult_herbmaster.vitalis', 'Eliksir Vitalis: Leczy d6 PŻ i zatrzymuje infekcję.');
INSERT INTO public.translations VALUES ('pl', 'abilities.occult_herbmaster.soup', 'Zupa z Pająko-Sowy: Widzenie w ciemności i chodzenie po ścianach przez 30 minut.');
INSERT INTO public.translations VALUES ('pl', 'abilities.occult_herbmaster.philtre', 'Filtr Fernora: Leczy infekcję, +2 Obecność przez d4 godziny.');
INSERT INTO public.translations VALUES ('en', 'classes.fanged_deserter.name', 'Fanged Deserter');
INSERT INTO public.translations VALUES ('en', 'classes.fanged_deserter.description', 'You have thirty or so friends who never let you down: YOUR TEETH. Disloyal, deranged or simply uncontrollable, any group that didn''t boot you out you left anyway.');
INSERT INTO public.translations VALUES ('en', 'classes.gutterborn_scum.name', 'Gutterborn Scum');
INSERT INTO public.translations VALUES ('en', 'classes.gutterborn_scum.description', 'An ill star smiled upon your birth. Poverty, crime and bad parenting didn''t help either. A razor blade and a moonless night are worth a week of chump-work.');
INSERT INTO public.translations VALUES ('en', 'classes.esoteric_hermit.name', 'Esoteric Hermit');
INSERT INTO public.translations VALUES ('en', 'classes.esoteric_hermit.description', 'The stone of your cave is one with the stars. Silence and perfection. Now the chaos of a fallen world disturbs your rituals.');
INSERT INTO public.translations VALUES ('en', 'classes.wretched_royalty.name', 'Wretched Royalty');
INSERT INTO public.translations VALUES ('en', 'classes.wretched_royalty.description', 'Bowed down only by the memories of your own lost glory, you could never submit to anyone else. Not you, of noble blood!');
INSERT INTO public.translations VALUES ('en', 'classes.heretical_priest.name', 'Heretical Priest');
INSERT INTO public.translations VALUES ('en', 'classes.heretical_priest.description', 'Hunted by the Two-Headed Basilisks of the One True Faith, you can be found raving in ruins and desecrating cathedrals by night.');
INSERT INTO public.translations VALUES ('en', 'classes.occult_herbmaster.name', 'Occult Herbmaster');
INSERT INTO public.translations VALUES ('en', 'classes.occult_herbmaster.description', 'Born of the mushroom, raised in the glade, watched by the eye of the moon in a silverblack pool.');


--
-- Data for Name: weapons; Type: TABLE DATA; Schema: public; Owner: p1002_scmgrinder
--

INSERT INTO public.weapons VALUES (1, 'weapons.snake-skin-gift', '{weapon,special,melee}', NULL, NULL, NULL, '{4}', NULL, 0, false, 4, '{"1": {"text": "The target dies immediately of deadly poison"}, "2": {"text": "No effect"}, "3": {"text": "No effect"}, "4": {"text": "No effect"}}', 0, '[]', NULL, NULL);
INSERT INTO public.weapons VALUES (2, 'weapons.blade-of-ancestors', '{weapon,melee,special}', NULL, NULL, NULL, '{6}', NULL, 0, false, 6, '{"1": {"text": "The blade accidentally attacks a companion"}, "2": {"text": "No effect"}, "3": {"text": "No effect"}, "4": {"text": "No effect"}, "5": {"text": "No effect"}, "6": {"text": "No effect"}}', 1, '[{"value": 2, "source": "The Blade of your Ancestors", "exclude": ["defence", "test", "heal", "cast", "buff"], "statistic": "strength"}, {"value": 2, "source": "The Blade of your Ancestors", "exclude": ["melee", "ranged", "test", "heal", "cast", "ability", "buff"], "statistic": "agility"}]', NULL, NULL);
INSERT INTO public.weapons VALUES (3, 'weapons.brown-scimitar', '{weapon,melee,special}', NULL, NULL, NULL, '{6}', NULL, 0, false, 6, '{"1": {"text": "Enemy struck with potent sepsis, dies in 10 mins"}, "2": {"text": "No effect"}, "3": {"text": "No effect"}, "4": {"text": "No effect"}, "5": {"text": "No effect"}, "6": {"text": "No effect"}}', 0, '[]', NULL, NULL);
INSERT INTO public.weapons VALUES (4, 'weapons.sigurd-sling', '{weapon,ranged,special}', NULL, NULL, NULL, '{4,4}', NULL, 0, false, NULL, NULL, 0, '[]', 'Infinite', 999);
INSERT INTO public.weapons VALUES (5, 'weapons.shoe-of-death', '{weapon,ranged,special}', NULL, NULL, NULL, '{4}', NULL, 0, false, 6, '{"1": {"text": "Smashes skull, instant kill on small-medium creatures"}, "2": {"text": "No effect"}, "3": {"text": "No effect"}, "4": {"text": "No effect"}, "5": {"text": "No effect"}, "6": {"text": "No effect"}}', 0, '[]', NULL, NULL);
INSERT INTO public.weapons VALUES (6, 'weapons.femur', '{weapon,melee}', NULL, NULL, NULL, '{4}', 1, 0, false, NULL, NULL, 0, '[]', NULL, NULL);
INSERT INTO public.weapons VALUES (7, 'weapons.staff', '{weapon,melee}', NULL, NULL, NULL, '{4}', 2, 5, false, NULL, NULL, 0, '[]', NULL, NULL);
INSERT INTO public.weapons VALUES (8, 'weapons.shortsword', '{weapon,melee}', NULL, NULL, NULL, '{4}', 3, 20, false, NULL, NULL, 0, '[]', NULL, NULL);
INSERT INTO public.weapons VALUES (9, 'weapons.knife', '{weapon,melee}', NULL, NULL, NULL, '{4}', 4, 10, false, NULL, NULL, 0, '[]', NULL, NULL);
INSERT INTO public.weapons VALUES (10, 'weapons.warhammer', '{weapon,melee}', NULL, NULL, NULL, '{6}', 5, 30, false, NULL, NULL, 0, '[]', NULL, NULL);
INSERT INTO public.weapons VALUES (11, 'weapons.sword', '{weapon,melee}', NULL, NULL, NULL, '{6}', 6, 30, false, NULL, NULL, 0, '[]', NULL, NULL);
INSERT INTO public.weapons VALUES (12, 'weapons.bow', '{weapon,ranged}', NULL, NULL, 'presence', '{6}', 7, 25, false, NULL, NULL, 0, '[]', 'Arrow', 10);
INSERT INTO public.weapons VALUES (13, 'weapons.flail', '{weapon,melee}', NULL, NULL, NULL, '{8}', 8, 35, false, NULL, NULL, 0, '[]', NULL, NULL);
INSERT INTO public.weapons VALUES (14, 'weapons.crossbow', '{weapon,ranged}', NULL, NULL, 'presence', '{8}', 9, 40, false, NULL, NULL, 0, '[]', 'Bolt', 10);
INSERT INTO public.weapons VALUES (15, 'weapons.zweihander', '{weapon,melee}', NULL, NULL, NULL, '{10}', 10, 60, false, NULL, NULL, 0, '[]', NULL, NULL);
INSERT INTO public.weapons VALUES (16, 'weapons.whip', '{weapon,melee}', NULL, NULL, NULL, '{2}', NULL, 5, false, NULL, NULL, 0, '[]', NULL, NULL);
INSERT INTO public.weapons VALUES (17, 'weapons.cudgel', '{weapon,melee}', NULL, NULL, NULL, '{4}', NULL, 20, true, NULL, NULL, 0, '[]', NULL, NULL);
INSERT INTO public.weapons VALUES (18, 'weapons.sling', '{weapon,ranged}', NULL, NULL, NULL, '{4}', NULL, 8, false, NULL, NULL, 0, '[]', 'Infinite', 999);
INSERT INTO public.weapons VALUES (19, 'weapons.sickle', '{weapon,melee}', NULL, NULL, NULL, '{4}', NULL, 15, true, NULL, NULL, 0, '[]', NULL, NULL);
INSERT INTO public.weapons VALUES (20, 'weapons.club', '{weapon,melee}', NULL, NULL, NULL, '{6}', NULL, 10, false, NULL, NULL, 0, '[]', NULL, NULL);
INSERT INTO public.weapons VALUES (21, 'weapons.handaxe', '{weapon,melee}', NULL, NULL, NULL, '{6}', NULL, 15, false, NULL, NULL, 0, '[]', NULL, NULL);
INSERT INTO public.weapons VALUES (22, 'weapons.mace', '{weapon,melee}', NULL, NULL, NULL, '{6}', NULL, 25, false, NULL, NULL, 0, '[]', NULL, NULL);
INSERT INTO public.weapons VALUES (23, 'weapons.spear', '{weapon,melee}', NULL, NULL, NULL, '{6}', NULL, 15, true, NULL, NULL, 0, '[]', NULL, NULL);
INSERT INTO public.weapons VALUES (24, 'weapons.battle-axe', '{weapon,melee}', NULL, NULL, NULL, '{8}', NULL, 35, false, NULL, NULL, 0, '[]', NULL, NULL);
INSERT INTO public.weapons VALUES (25, 'weapons.goedendag', '{weapon,melee}', NULL, NULL, NULL, '{8}', NULL, 30, true, NULL, NULL, 0, '[]', NULL, NULL);
INSERT INTO public.weapons VALUES (26, 'weapons.meat-cleaver', '{tool,metal,weapon}', NULL, NULL, NULL, '{4}', NULL, 15, false, NULL, NULL, 0, '[]', NULL, NULL);
INSERT INTO public.weapons VALUES (27, 'weapons.crowbar', '{tool,metal,weapon}', NULL, NULL, NULL, '{4}', NULL, 8, false, NULL, NULL, 0, '[]', NULL, NULL);
INSERT INTO public.weapons VALUES (28, 'weapons.hammer', '{tool,metal,weapon}', NULL, NULL, NULL, '{4}', NULL, 8, false, NULL, NULL, 0, '[]', NULL, NULL);
INSERT INTO public.weapons VALUES (29, 'weapons.caltrops', '{trap,metal}', NULL, NULL, NULL, '{4}', NULL, 7, false, NULL, NULL, 0, '[]', NULL, NULL);
INSERT INTO public.weapons VALUES (30, 'weapons.shield', '{shield}', NULL, NULL, NULL, '{4}', NULL, 20, false, NULL, NULL, 0, '[]', NULL, NULL);


--
-- Name: abilities_id_seq; Type: SEQUENCE SET; Schema: public; Owner: p1002_scmgrinder
--

SELECT pg_catalog.setval('public.abilities_id_seq', 45, true);


--
-- Name: armors_id_seq; Type: SEQUENCE SET; Schema: public; Owner: p1002_scmgrinder
--

SELECT pg_catalog.setval('public.armors_id_seq', 7, true);


--
-- Name: body_descriptions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: p1002_scmgrinder
--

SELECT pg_catalog.setval('public.body_descriptions_id_seq', 20, true);


--
-- Name: classes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: p1002_scmgrinder
--

SELECT pg_catalog.setval('public.classes_id_seq', 6, true);


--
-- Name: equipment_id_seq; Type: SEQUENCE SET; Schema: public; Owner: p1002_scmgrinder
--

SELECT pg_catalog.setval('public.equipment_id_seq', 59, true);


--
-- Name: habits_id_seq; Type: SEQUENCE SET; Schema: public; Owner: p1002_scmgrinder
--

SELECT pg_catalog.setval('public.habits_id_seq', 20, true);


--
-- Name: names_id_seq; Type: SEQUENCE SET; Schema: public; Owner: p1002_scmgrinder
--

SELECT pg_catalog.setval('public.names_id_seq', 215, true);


--
-- Name: origins_id_seq; Type: SEQUENCE SET; Schema: public; Owner: p1002_scmgrinder
--

SELECT pg_catalog.setval('public.origins_id_seq', 96, true);


--
-- Name: pets_id_seq; Type: SEQUENCE SET; Schema: public; Owner: p1002_scmgrinder
--

SELECT pg_catalog.setval('public.pets_id_seq', 7, true);


--
-- Name: tales_id_seq; Type: SEQUENCE SET; Schema: public; Owner: p1002_scmgrinder
--

SELECT pg_catalog.setval('public.tales_id_seq', 20, true);


--
-- Name: traits_id_seq; Type: SEQUENCE SET; Schema: public; Owner: p1002_scmgrinder
--

SELECT pg_catalog.setval('public.traits_id_seq', 20, true);


--
-- Name: weapons_id_seq; Type: SEQUENCE SET; Schema: public; Owner: p1002_scmgrinder
--

SELECT pg_catalog.setval('public.weapons_id_seq', 30, true);


--
-- Name: abilities abilities_key_key; Type: CONSTRAINT; Schema: public; Owner: p1002_scmgrinder
--

ALTER TABLE ONLY public.abilities
    ADD CONSTRAINT abilities_key_key UNIQUE (key);


--
-- Name: abilities abilities_pkey; Type: CONSTRAINT; Schema: public; Owner: p1002_scmgrinder
--

ALTER TABLE ONLY public.abilities
    ADD CONSTRAINT abilities_pkey PRIMARY KEY (id);


--
-- Name: armors armors_key_key; Type: CONSTRAINT; Schema: public; Owner: p1002_scmgrinder
--

ALTER TABLE ONLY public.armors
    ADD CONSTRAINT armors_key_key UNIQUE (key);


--
-- Name: armors armors_pkey; Type: CONSTRAINT; Schema: public; Owner: p1002_scmgrinder
--

ALTER TABLE ONLY public.armors
    ADD CONSTRAINT armors_pkey PRIMARY KEY (id);


--
-- Name: body_descriptions body_descriptions_key_key; Type: CONSTRAINT; Schema: public; Owner: p1002_scmgrinder
--

ALTER TABLE ONLY public.body_descriptions
    ADD CONSTRAINT body_descriptions_key_key UNIQUE (key);


--
-- Name: body_descriptions body_descriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: p1002_scmgrinder
--

ALTER TABLE ONLY public.body_descriptions
    ADD CONSTRAINT body_descriptions_pkey PRIMARY KEY (id);


--
-- Name: characters characters_pkey; Type: CONSTRAINT; Schema: public; Owner: p1002_scmgrinder
--

ALTER TABLE ONLY public.characters
    ADD CONSTRAINT characters_pkey PRIMARY KEY (id);


--
-- Name: classes classes_name_key; Type: CONSTRAINT; Schema: public; Owner: p1002_scmgrinder
--

ALTER TABLE ONLY public.classes
    ADD CONSTRAINT classes_name_key UNIQUE (name);


--
-- Name: classes classes_pkey; Type: CONSTRAINT; Schema: public; Owner: p1002_scmgrinder
--

ALTER TABLE ONLY public.classes
    ADD CONSTRAINT classes_pkey PRIMARY KEY (id);


--
-- Name: equipment equipment_key_key; Type: CONSTRAINT; Schema: public; Owner: p1002_scmgrinder
--

ALTER TABLE ONLY public.equipment
    ADD CONSTRAINT equipment_key_key UNIQUE (key);


--
-- Name: equipment equipment_pkey; Type: CONSTRAINT; Schema: public; Owner: p1002_scmgrinder
--

ALTER TABLE ONLY public.equipment
    ADD CONSTRAINT equipment_pkey PRIMARY KEY (id);


--
-- Name: habits habits_key_key; Type: CONSTRAINT; Schema: public; Owner: p1002_scmgrinder
--

ALTER TABLE ONLY public.habits
    ADD CONSTRAINT habits_key_key UNIQUE (key);


--
-- Name: habits habits_pkey; Type: CONSTRAINT; Schema: public; Owner: p1002_scmgrinder
--

ALTER TABLE ONLY public.habits
    ADD CONSTRAINT habits_pkey PRIMARY KEY (id);


--
-- Name: names names_pkey; Type: CONSTRAINT; Schema: public; Owner: p1002_scmgrinder
--

ALTER TABLE ONLY public.names
    ADD CONSTRAINT names_pkey PRIMARY KEY (id);


--
-- Name: origins origins_pkey; Type: CONSTRAINT; Schema: public; Owner: p1002_scmgrinder
--

ALTER TABLE ONLY public.origins
    ADD CONSTRAINT origins_pkey PRIMARY KEY (id);


--
-- Name: pets pets_key_key; Type: CONSTRAINT; Schema: public; Owner: p1002_scmgrinder
--

ALTER TABLE ONLY public.pets
    ADD CONSTRAINT pets_key_key UNIQUE (key);


--
-- Name: pets pets_pkey; Type: CONSTRAINT; Schema: public; Owner: p1002_scmgrinder
--

ALTER TABLE ONLY public.pets
    ADD CONSTRAINT pets_pkey PRIMARY KEY (id);


--
-- Name: tales tales_key_key; Type: CONSTRAINT; Schema: public; Owner: p1002_scmgrinder
--

ALTER TABLE ONLY public.tales
    ADD CONSTRAINT tales_key_key UNIQUE (key);


--
-- Name: tales tales_pkey; Type: CONSTRAINT; Schema: public; Owner: p1002_scmgrinder
--

ALTER TABLE ONLY public.tales
    ADD CONSTRAINT tales_pkey PRIMARY KEY (id);


--
-- Name: traits traits_key_key; Type: CONSTRAINT; Schema: public; Owner: p1002_scmgrinder
--

ALTER TABLE ONLY public.traits
    ADD CONSTRAINT traits_key_key UNIQUE (key);


--
-- Name: traits traits_pkey; Type: CONSTRAINT; Schema: public; Owner: p1002_scmgrinder
--

ALTER TABLE ONLY public.traits
    ADD CONSTRAINT traits_pkey PRIMARY KEY (id);


--
-- Name: translations translations_pkey; Type: CONSTRAINT; Schema: public; Owner: p1002_scmgrinder
--

ALTER TABLE ONLY public.translations
    ADD CONSTRAINT translations_pkey PRIMARY KEY (locale, key);


--
-- Name: weapons weapons_key_key; Type: CONSTRAINT; Schema: public; Owner: p1002_scmgrinder
--

ALTER TABLE ONLY public.weapons
    ADD CONSTRAINT weapons_key_key UNIQUE (key);


--
-- Name: weapons weapons_pkey; Type: CONSTRAINT; Schema: public; Owner: p1002_scmgrinder
--

ALTER TABLE ONLY public.weapons
    ADD CONSTRAINT weapons_pkey PRIMARY KEY (id);


--
-- Name: idx_armors_roll; Type: INDEX; Schema: public; Owner: p1002_scmgrinder
--

CREATE INDEX idx_armors_roll ON public.armors USING btree (roll) WHERE (roll IS NOT NULL);


--
-- Name: idx_characters_class; Type: INDEX; Schema: public; Owner: p1002_scmgrinder
--

CREATE INDEX idx_characters_class ON public.characters USING btree (class_id);


--
-- Name: idx_characters_created; Type: INDEX; Schema: public; Owner: p1002_scmgrinder
--

CREATE INDEX idx_characters_created ON public.characters USING btree (created_at);


--
-- Name: idx_equipment_roll; Type: INDEX; Schema: public; Owner: p1002_scmgrinder
--

CREATE INDEX idx_equipment_roll ON public.equipment USING btree (roll) WHERE (roll IS NOT NULL);


--
-- Name: idx_equipment_tags; Type: INDEX; Schema: public; Owner: p1002_scmgrinder
--

CREATE INDEX idx_equipment_tags ON public.equipment USING gin (tags);


--
-- Name: idx_habits_roll; Type: INDEX; Schema: public; Owner: p1002_scmgrinder
--

CREATE INDEX idx_habits_roll ON public.habits USING btree (roll) WHERE (roll IS NOT NULL);


--
-- Name: idx_origins_class_roll; Type: INDEX; Schema: public; Owner: p1002_scmgrinder
--

CREATE INDEX idx_origins_class_roll ON public.origins USING btree (class_id, roll);


--
-- Name: idx_tales_roll; Type: INDEX; Schema: public; Owner: p1002_scmgrinder
--

CREATE INDEX idx_tales_roll ON public.tales USING btree (roll) WHERE (roll IS NOT NULL);


--
-- Name: idx_translations_key; Type: INDEX; Schema: public; Owner: p1002_scmgrinder
--

CREATE INDEX idx_translations_key ON public.translations USING btree (key);


--
-- Name: idx_weapons_roll; Type: INDEX; Schema: public; Owner: p1002_scmgrinder
--

CREATE INDEX idx_weapons_roll ON public.weapons USING btree (roll) WHERE (roll IS NOT NULL);


--
-- Name: abilities abilities_class_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: p1002_scmgrinder
--

ALTER TABLE ONLY public.abilities
    ADD CONSTRAINT abilities_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(id);


--
-- Name: characters characters_class_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: p1002_scmgrinder
--

ALTER TABLE ONLY public.characters
    ADD CONSTRAINT characters_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(id);


--
-- Name: origins origins_class_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: p1002_scmgrinder
--

ALTER TABLE ONLY public.origins
    ADD CONSTRAINT origins_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(id);


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: p1002_scmgrinder
--

-- REVOKE USAGE ON SCHEMA public FROM PUBLIC;


--
-- PostgreSQL database dump complete
--
