--
-- PostgreSQL database dump
--

-- Dumped from database version 16.3
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
-- Name: public; Type: SCHEMA; Schema: -; Owner: morkborg
--

CREATE SCHEMA IF NOT EXISTS public;


ALTER SCHEMA public OWNER TO morkborg;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: morkborg
--

COMMENT ON SCHEMA public IS 'standard public schema';


--
-- Name: generate_character(integer); Type: FUNCTION; Schema: public; Owner: morkborg
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
    str_raw INTEGER; agi_raw INTEGER; pre_raw INTEGER; tou_raw INTEGER;
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
    h_key TEXT; t_key TEXT; b_key TEXT; tr1_key TEXT; tr2_key TEXT;
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
            WHEN tou_raw <= 4 THEN -3 WHEN tou_raw <= 6 THEN -2 WHEN tou_raw <= 8 THEN -1
            WHEN tou_raw <= 12 THEN 0 WHEN tou_raw <= 14 THEN 1 WHEN tou_raw <= 16 THEN 2 ELSE 3 END
    ));

    -- 6. OMENS (d2: 1 or 2)
    omens_val := floor(random() * 2) + 1;

    -- 7. EQUIPMENT POOL
    rolled_pool := rolled_pool || (SELECT jsonb_agg(item) FROM (SELECT jsonb_build_object('key', key, 'tags', tags) as item FROM equipment ORDER BY random() LIMIT 3) t);

    -- Class weapon and armor rolls
    rolled_pool := rolled_pool || (SELECT jsonb_build_object('key', key, 'tags', ARRAY['weapon']) FROM weapons WHERE roll = (floor(random()*class_row.weapon_die)+1) LIMIT 1);
    rolled_pool := rolled_pool || (SELECT jsonb_build_object('key', key, 'tags', ARRAY['armor']) FROM armors WHERE roll = (floor(random()*class_row.armor_die)+1) LIMIT 1);

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
    ability_keys := class_row.class_abilities;
    IF class_row.random_ability_count > 0 THEN
        FOR i IN 1..class_row.random_ability_count LOOP
            ability_keys := ability_keys || (SELECT jsonb_build_array(elem) FROM jsonb_array_elements(class_row.random_abilities) elem ORDER BY random() LIMIT 1);
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


ALTER FUNCTION public.generate_character(p_class_id integer) OWNER TO morkborg;

--
-- Name: get_armor_by_roll(integer); Type: FUNCTION; Schema: public; Owner: morkborg
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


ALTER FUNCTION public.get_armor_by_roll(roll_num integer) OWNER TO morkborg;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: characters; Type: TABLE; Schema: public; Owner: morkborg
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
                                   updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.characters OWNER TO morkborg;

--
-- Name: get_character_full(text); Type: FUNCTION; Schema: public; Owner: morkborg
--

CREATE FUNCTION public.get_character_full(request_locale text) RETURNS TABLE("like" public.characters, class_name text, class_description text, body_description_text text, trait1_text text, trait2_text text, habit_text text, tale_text text)
    LANGUAGE plpgsql
    AS $$
BEGIN
RETURN QUERY
SELECT
    c.*,
    cl.name,
    cl.appendix,
    t_body.value,
    t_trait1.value,
    t_trait2.value,
    t_habit.value,
    t_tale.value
FROM characters c
         LEFT JOIN classes cl ON c.class_id = cl.id
         LEFT JOIN translations t_body ON c.body_description = t_body.key AND t_body.locale = request_locale
         LEFT JOIN translations t_trait1 ON c.trait1 = t_trait1.key AND t_trait1.locale = request_locale
         LEFT JOIN translations t_trait2 ON c.trait2 = t_trait2.key AND t_trait2.locale = request_locale
         LEFT JOIN translations t_habit ON c.habit = t_habit.key AND t_habit.locale = request_locale
         LEFT JOIN translations t_tale ON c.tale = t_tale.key AND t_tale.locale = request_locale;
END;
$$;


ALTER FUNCTION public.get_character_full(request_locale text) OWNER TO morkborg;

--
-- Name: get_character_full(uuid, character varying); Type: FUNCTION; Schema: public; Owner: morkborg
--

CREATE FUNCTION public.get_character_full(p_id uuid, p_locale character varying DEFAULT 'en'::character varying) RETURNS TABLE(id uuid, name character varying, class_id integer, origin text, strength integer, agility integer, presence integer, toughness integer, max_hp integer, current_hp integer, omens integer, max_omens integer, silver integer, habit text, tale text, body_description text, trait1 text, trait2 text, abilities jsonb, equipment jsonb, equipped_weapons jsonb, equipped_armor jsonb, created_at timestamp with time zone, updated_at timestamp with time zone, class_name character varying, class_description text, origin_text text, body_description_text text, trait1_text text, trait2_text text, habit_text text, tale_text text)
    LANGUAGE sql STABLE
    AS $$
SELECT
    c.id,
    c.name,
    c.class_id,
    c.origin,
    c.strength,
    c.agility,
    c.presence,
    c.toughness,
    c.max_hp,
    c.current_hp,
    c.omens,
    c.max_omens,
    c.silver,
    c.habit,
    c.tale,
    c.body_description,
    c.trait1,
    c.trait2,
    c.abilities,
    c.equipment,
    c.equipped_weapons,
    c.equipped_armor,
    c.created_at,
    c.updated_at,
    -- Resolved
    cl.name as class_name,
    cl.appendix as class_description,
    t_origin.value as origin_text,
    t_body.value as body_description_text,
    t_trait1.value as trait1_text,
    t_trait2.value as trait2_text,
    t_habit.value as habit_text,
    t_tale.value as tale_text
FROM characters c
         LEFT JOIN classes cl ON c.class_id = cl.id
         LEFT JOIN translations t_origin ON c.origin = t_origin.key AND t_origin.locale = p_locale
         LEFT JOIN translations t_body ON c.body_description = t_body.key AND t_body.locale = p_locale
         LEFT JOIN translations t_trait1 ON c.trait1 = t_trait1.key AND t_trait1.locale = p_locale
         LEFT JOIN translations t_trait2 ON c.trait2 = t_trait2.key AND t_trait2.locale = p_locale
         LEFT JOIN translations t_habit ON c.habit = t_habit.key AND t_habit.locale = p_locale
         LEFT JOIN translations t_tale ON c.tale = t_tale.key AND t_tale.locale = p_locale
WHERE c.id = p_id
    $$;


ALTER FUNCTION public.get_character_full(p_id uuid, p_locale character varying) OWNER TO morkborg;

--
-- Name: get_scroll_by_roll(integer, text); Type: FUNCTION; Schema: public; Owner: morkborg
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


ALTER FUNCTION public.get_scroll_by_roll(roll_num integer, scroll_type text) OWNER TO morkborg;

--
-- Name: get_weapon_by_roll(integer); Type: FUNCTION; Schema: public; Owner: morkborg
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


ALTER FUNCTION public.get_weapon_by_roll(roll_num integer) OWNER TO morkborg;

--
-- Name: random_row_id(text); Type: FUNCTION; Schema: public; Owner: morkborg
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


ALTER FUNCTION public.random_row_id(table_name text) OWNER TO morkborg;

--
-- Name: roll_amount(integer, integer, integer); Type: FUNCTION; Schema: public; Owner: morkborg
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


ALTER FUNCTION public.roll_amount(min_val integer, max_val integer, mod_stat integer) OWNER TO morkborg;

--
-- Name: roll_dice(integer, integer); Type: FUNCTION; Schema: public; Owner: morkborg
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


ALTER FUNCTION public.roll_dice(num_dice integer, sides integer) OWNER TO morkborg;

--
-- Name: roll_die(integer); Type: FUNCTION; Schema: public; Owner: morkborg
--

CREATE FUNCTION public.roll_die(sides integer) RETURNS integer
    LANGUAGE plpgsql
    AS $$
BEGIN
RETURN floor(random() * sides + 1)::INTEGER;
END;
$$;


ALTER FUNCTION public.roll_die(sides integer) OWNER TO morkborg;

--
-- Name: roll_stat(); Type: FUNCTION; Schema: public; Owner: morkborg
--

CREATE FUNCTION public.roll_stat() RETURNS integer
    LANGUAGE plpgsql
    AS $$
BEGIN
RETURN roll_to_modifier(roll_dice(3, 6));
END;
$$;


ALTER FUNCTION public.roll_stat() OWNER TO morkborg;

--
-- Name: roll_to_modifier(integer); Type: FUNCTION; Schema: public; Owner: morkborg
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


ALTER FUNCTION public.roll_to_modifier(roll integer) OWNER TO morkborg;

--
-- Name: t(text); Type: FUNCTION; Schema: public; Owner: morkborg
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


ALTER FUNCTION public.t(translation_key text) OWNER TO morkborg;

--
-- Name: abilities; Type: TABLE; Schema: public; Owner: morkborg
--

CREATE TABLE public.abilities (
                                  id integer NOT NULL,
                                  class_id integer,
                                  key character varying(255) NOT NULL,
                                  is_random boolean DEFAULT false,
                                  roll_value integer
);


ALTER TABLE public.abilities OWNER TO morkborg;

--
-- Name: abilities_id_seq; Type: SEQUENCE; Schema: public; Owner: morkborg
--

CREATE SEQUENCE public.abilities_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.abilities_id_seq OWNER TO morkborg;

--
-- Name: abilities_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: morkborg
--

ALTER SEQUENCE public.abilities_id_seq OWNED BY public.abilities.id;


--
-- Name: armors; Type: TABLE; Schema: public; Owner: morkborg
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


ALTER TABLE public.armors OWNER TO morkborg;

--
-- Name: armors_id_seq; Type: SEQUENCE; Schema: public; Owner: morkborg
--

CREATE SEQUENCE public.armors_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.armors_id_seq OWNER TO morkborg;

--
-- Name: armors_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: morkborg
--

ALTER SEQUENCE public.armors_id_seq OWNED BY public.armors.id;


--
-- Name: body_descriptions; Type: TABLE; Schema: public; Owner: morkborg
--

CREATE TABLE public.body_descriptions (
                                          id integer NOT NULL,
                                          key character varying(255) NOT NULL,
                                          roll integer
);


ALTER TABLE public.body_descriptions OWNER TO morkborg;

--
-- Name: body_descriptions_id_seq; Type: SEQUENCE; Schema: public; Owner: morkborg
--

CREATE SEQUENCE public.body_descriptions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.body_descriptions_id_seq OWNER TO morkborg;

--
-- Name: body_descriptions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: morkborg
--

ALTER SEQUENCE public.body_descriptions_id_seq OWNED BY public.body_descriptions.id;


--
-- Name: classes; Type: TABLE; Schema: public; Owner: morkborg
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
                                random_ability_count integer DEFAULT 1
);


ALTER TABLE public.classes OWNER TO morkborg;

--
-- Name: classes_id_seq; Type: SEQUENCE; Schema: public; Owner: morkborg
--

CREATE SEQUENCE public.classes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.classes_id_seq OWNER TO morkborg;

--
-- Name: classes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: morkborg
--

ALTER SEQUENCE public.classes_id_seq OWNED BY public.classes.id;


--
-- Name: equipment; Type: TABLE; Schema: public; Owner: morkborg
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


ALTER TABLE public.equipment OWNER TO morkborg;

--
-- Name: equipment_id_seq; Type: SEQUENCE; Schema: public; Owner: morkborg
--

CREATE SEQUENCE public.equipment_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.equipment_id_seq OWNER TO morkborg;

--
-- Name: equipment_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: morkborg
--

ALTER SEQUENCE public.equipment_id_seq OWNED BY public.equipment.id;


--
-- Name: habits; Type: TABLE; Schema: public; Owner: morkborg
--

CREATE TABLE public.habits (
                               id integer NOT NULL,
                               key character varying(255) NOT NULL,
                               roll integer,
                               exp boolean DEFAULT false,
                               items jsonb DEFAULT '[]'::jsonb
);


ALTER TABLE public.habits OWNER TO morkborg;

--
-- Name: habits_id_seq; Type: SEQUENCE; Schema: public; Owner: morkborg
--

CREATE SEQUENCE public.habits_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.habits_id_seq OWNER TO morkborg;

--
-- Name: habits_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: morkborg
--

ALTER SEQUENCE public.habits_id_seq OWNED BY public.habits.id;


--
-- Name: names; Type: TABLE; Schema: public; Owner: morkborg
--

CREATE TABLE public.names (
                              id integer NOT NULL,
                              name character varying(255) NOT NULL
);


ALTER TABLE public.names OWNER TO morkborg;

--
-- Name: names_id_seq; Type: SEQUENCE; Schema: public; Owner: morkborg
--

CREATE SEQUENCE public.names_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.names_id_seq OWNER TO morkborg;

--
-- Name: names_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: morkborg
--

ALTER SEQUENCE public.names_id_seq OWNED BY public.names.id;


--
-- Name: origins; Type: TABLE; Schema: public; Owner: morkborg
--

CREATE TABLE public.origins (
                                id integer NOT NULL,
                                class_id integer,
                                roll integer NOT NULL,
                                key character varying(255) NOT NULL
);


ALTER TABLE public.origins OWNER TO morkborg;

--
-- Name: origins_id_seq; Type: SEQUENCE; Schema: public; Owner: morkborg
--

CREATE SEQUENCE public.origins_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.origins_id_seq OWNER TO morkborg;

--
-- Name: origins_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: morkborg
--

ALTER SEQUENCE public.origins_id_seq OWNED BY public.origins.id;


--
-- Name: pets; Type: TABLE; Schema: public; Owner: morkborg
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


ALTER TABLE public.pets OWNER TO morkborg;

--
-- Name: pets_id_seq; Type: SEQUENCE; Schema: public; Owner: morkborg
--

CREATE SEQUENCE public.pets_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.pets_id_seq OWNER TO morkborg;

--
-- Name: pets_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: morkborg
--

ALTER SEQUENCE public.pets_id_seq OWNED BY public.pets.id;


--
-- Name: tales; Type: TABLE; Schema: public; Owner: morkborg
--

CREATE TABLE public.tales (
                              id integer NOT NULL,
                              key character varying(255) NOT NULL,
                              roll integer,
                              exp boolean DEFAULT false,
                              items jsonb DEFAULT '[]'::jsonb
);


ALTER TABLE public.tales OWNER TO morkborg;

--
-- Name: tales_id_seq; Type: SEQUENCE; Schema: public; Owner: morkborg
--

CREATE SEQUENCE public.tales_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tales_id_seq OWNER TO morkborg;

--
-- Name: tales_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: morkborg
--

ALTER SEQUENCE public.tales_id_seq OWNED BY public.tales.id;


--
-- Name: traits; Type: TABLE; Schema: public; Owner: morkborg
--

CREATE TABLE public.traits (
                               id integer NOT NULL,
                               key character varying(255) NOT NULL,
                               roll integer
);


ALTER TABLE public.traits OWNER TO morkborg;

--
-- Name: traits_id_seq; Type: SEQUENCE; Schema: public; Owner: morkborg
--

CREATE SEQUENCE public.traits_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.traits_id_seq OWNER TO morkborg;

--
-- Name: traits_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: morkborg
--

ALTER SEQUENCE public.traits_id_seq OWNED BY public.traits.id;


--
-- Name: translations; Type: TABLE; Schema: public; Owner: morkborg
--

CREATE TABLE public.translations (
                                     locale character varying(10) DEFAULT 'en'::character varying NOT NULL,
                                     key character varying(255) NOT NULL,
                                     value text NOT NULL
);


ALTER TABLE public.translations OWNER TO morkborg;

--
-- Name: weapons; Type: TABLE; Schema: public; Owner: morkborg
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


ALTER TABLE public.weapons OWNER TO morkborg;

--
-- Name: weapons_id_seq; Type: SEQUENCE; Schema: public; Owner: morkborg
--

CREATE SEQUENCE public.weapons_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.weapons_id_seq OWNER TO morkborg;

--
-- Name: weapons_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: morkborg
--

ALTER SEQUENCE public.weapons_id_seq OWNED BY public.weapons.id;


--
-- Name: abilities id; Type: DEFAULT; Schema: public; Owner: morkborg
--

ALTER TABLE ONLY public.abilities ALTER COLUMN id SET DEFAULT nextval('public.abilities_id_seq'::regclass);


--
-- Name: armors id; Type: DEFAULT; Schema: public; Owner: morkborg
--

ALTER TABLE ONLY public.armors ALTER COLUMN id SET DEFAULT nextval('public.armors_id_seq'::regclass);


--
-- Name: body_descriptions id; Type: DEFAULT; Schema: public; Owner: morkborg
--

ALTER TABLE ONLY public.body_descriptions ALTER COLUMN id SET DEFAULT nextval('public.body_descriptions_id_seq'::regclass);


--
-- Name: classes id; Type: DEFAULT; Schema: public; Owner: morkborg
--

ALTER TABLE ONLY public.classes ALTER COLUMN id SET DEFAULT nextval('public.classes_id_seq'::regclass);


--
-- Name: equipment id; Type: DEFAULT; Schema: public; Owner: morkborg
--

ALTER TABLE ONLY public.equipment ALTER COLUMN id SET DEFAULT nextval('public.equipment_id_seq'::regclass);


--
-- Name: habits id; Type: DEFAULT; Schema: public; Owner: morkborg
--

ALTER TABLE ONLY public.habits ALTER COLUMN id SET DEFAULT nextval('public.habits_id_seq'::regclass);


--
-- Name: names id; Type: DEFAULT; Schema: public; Owner: morkborg
--

ALTER TABLE ONLY public.names ALTER COLUMN id SET DEFAULT nextval('public.names_id_seq'::regclass);


--
-- Name: origins id; Type: DEFAULT; Schema: public; Owner: morkborg
--

ALTER TABLE ONLY public.origins ALTER COLUMN id SET DEFAULT nextval('public.origins_id_seq'::regclass);


--
-- Name: pets id; Type: DEFAULT; Schema: public; Owner: morkborg
--

ALTER TABLE ONLY public.pets ALTER COLUMN id SET DEFAULT nextval('public.pets_id_seq'::regclass);


--
-- Name: tales id; Type: DEFAULT; Schema: public; Owner: morkborg
--

ALTER TABLE ONLY public.tales ALTER COLUMN id SET DEFAULT nextval('public.tales_id_seq'::regclass);


--
-- Name: traits id; Type: DEFAULT; Schema: public; Owner: morkborg
--

ALTER TABLE ONLY public.traits ALTER COLUMN id SET DEFAULT nextval('public.traits_id_seq'::regclass);


--
-- Name: weapons id; Type: DEFAULT; Schema: public; Owner: morkborg
--

ALTER TABLE ONLY public.weapons ALTER COLUMN id SET DEFAULT nextval('public.weapons_id_seq'::regclass);


--
-- Data for Name: abilities; Type: TABLE DATA; Schema: public; Owner: morkborg
--

COPY public.abilities (id, class_id, key, is_random, roll_value) FROM stdin;
1	1	abilities.fanged_deserter.clumsy	f	\N
2	1	abilities.fanged_deserter.bite	f	\N
3	1	abilities.fanged_deserter.mask	t	1
4	1	abilities.fanged_deserter.scimitar	t	2
5	1	abilities.fanged_deserter.teeth	t	3
6	1	abilities.fanged_deserter.sling	t	4
7	1	abilities.fanged_deserter.shoe	t	5
8	1	abilities.fanged_deserter.hound	t	6
9	2	abilities.gutterborn_scum.stealthy	f	\N
10	2	abilities.gutterborn_scum.jab	t	1
11	2	abilities.gutterborn_scum.jester	t	2
12	2	abilities.gutterborn_scum.spatula	t	3
13	2	abilities.gutterborn_scum.muck	t	4
14	2	abilities.gutterborn_scum.poison	t	5
15	2	abilities.gutterborn_scum.nose	t	6
16	3	abilities.esoteric_hermit.scrolls	f	\N
17	3	abilities.esoteric_hermit.book	t	1
18	3	abilities.esoteric_hermit.staff	t	2
19	3	abilities.esoteric_hermit.skin	t	3
20	3	abilities.esoteric_hermit.ash	t	4
21	3	abilities.esoteric_hermit.eye	t	5
22	3	abilities.esoteric_hermit.bird	t	6
23	4	abilities.wretched_royalty.servant	f	\N
24	4	abilities.wretched_royalty.horse	t	1
25	4	abilities.wretched_royalty.blade	t	2
26	4	abilities.wretched_royalty.seal	t	3
27	4	abilities.wretched_royalty.squire	t	4
28	4	abilities.wretched_royalty.cape	t	5
29	4	abilities.wretched_royalty.crown	t	6
30	5	abilities.heretical_priest.sinner	f	\N
31	5	abilities.heretical_priest.beak	t	1
32	5	abilities.heretical_priest.breath	t	2
33	5	abilities.heretical_priest.voice	t	3
34	5	abilities.heretical_priest.fingers	t	4
35	5	abilities.heretical_priest.tongue	t	5
36	5	abilities.heretical_priest.eye	t	6
37	6	abilities.occult_herbmaster.decoctions	f	\N
38	6	abilities.occult_herbmaster.hyphos	t	1
39	6	abilities.occult_herbmaster.black_poison	t	2
40	6	abilities.occult_herbmaster.red_poison	t	3
41	6	abilities.occult_herbmaster.ezumiel	t	4
42	6	abilities.occult_herbmaster.frog	t	5
43	6	abilities.occult_herbmaster.vitalis	t	6
44	6	abilities.occult_herbmaster.soup	t	7
45	6	abilities.occult_herbmaster.philtre	t	8
\.


--
-- Data for Name: armors; Type: TABLE DATA; Schema: public; Owner: morkborg
--

COPY public.armors (id, key, tags, dice, roll, value, exp, max_tier, modifiers) FROM stdin;
1	armor.fur	{armor,light-armor}	{2}	1	20	f	1	[]
2	armor.padded-cloth	{armor,light-armor}	{2}	2	20	f	1	[]
3	armor.leather	{armor,light-armor}	{2}	2	20	f	1	[]
4	armor.scale	{armor,medium-armor,metal}	{4}	3	100	f	2	[{"value": -2, "source": "Scale armor", "statistic": "agility"}]
5	armor.mail	{armor,medium-armor,metal}	{4}	3	100	f	2	[{"value": -2, "source": "Mail armor", "statistic": "agility"}]
6	armor.splint	{armor,heavy-armor,metal}	{6}	4	200	f	3	[{"value": -4, "source": "Splint armor", "exclude": ["defence", "buff", "item"], "statistic": "agility"}, {"value": -2, "source": "Splint armor", "exclude": ["ability", "test", "melee", "ranged", "cast", "heal", "buff"], "statistic": "agility"}]
7	armor.plate	{armor,heavy-armor,metal}	{6}	4	200	f	3	[{"value": -4, "source": "Plate armor", "exclude": ["defence", "buff"], "statistic": "agility"}, {"value": -2, "source": "Plate armor", "exclude": ["ability", "test", "melee", "ranged", "cast", "heal", "buff"], "statistic": "agility"}]
\.


--
-- Data for Name: body_descriptions; Type: TABLE DATA; Schema: public; Owner: morkborg
--

COPY public.body_descriptions (id, key, roll) FROM stdin;
1	body.1	1
2	body.2	2
3	body.3	3
4	body.4	4
5	body.5	5
6	body.6	6
7	body.7	7
8	body.8	8
9	body.9	9
10	body.10	10
11	body.11	11
12	body.12	12
13	body.13	13
14	body.14	14
15	body.15	15
16	body.16	16
17	body.17	17
18	body.18	18
19	body.19	19
20	body.20	20
\.


--
-- Data for Name: characters; Type: TABLE DATA; Schema: public; Owner: morkborg
--

COPY public.characters (id, name, class_id, body_description, habit, tale, trait1, trait2, origin, strength, agility, presence, toughness, max_hp, current_hp, omens, max_omens, equipment, equipped_weapons, equipped_armor, abilities, pets, ammo, silver, wounded, dead, created_at, updated_at) FROM stdin;
d70fd043-205f-4068-8d1b-78439850f123	Dekram	1	body.5	habits.19	tales.18	traits.5	traits.20	origins.fanged_deserter.1	15	12	9	12	6	6	0	0	[{"key": "scroll.unclean.1"}, {"key": "equipment.exquisite-perfume"}]	[{"key": "equipment.bomb"}, {"key": "weapons.flail"}]	{"key": "armor.fur"}	[{"name": "Clumsy and Dull-witted", "description": "Agility tests are DR+2, excluding defence. You are incapable of understanding scrolls."}, {"name": "Bite Attack", "description": "DR10 to attack, d6 damage. You must be close to your target."}, {"name": "Ancient Gore-Hound", "gainPet": "Ancient Gore-Hound", "description": "Asthmatic hound with superb nose. DR10 attack (d6), DR12 defence, 10 HP."}]	[]	0	80	f	f	2026-01-06 21:59:54.65434	2026-01-06 21:59:54.65434
8c75a799-2c33-459f-b66a-7609ef834f65	Svind	1	body.1	habits.4	tales.16	traits.7	traits.18	origins.fanged_deserter.4	16	13	3	13	11	11	1	1	[{"key": "equipment.mirror"}, {"key": "equipment.hyphos-snuff"}, {"key": "scroll.sacred.5"}]	[{"key": "weapons.warhammer"}]	{"key": "armor.padded-cloth"}	[{"name": "Clumsy and Dull-witted", "description": "Agility tests are DR+2, excluding defence. You are incapable of understanding scrolls."}, {"name": "Bite Attack", "description": "DR10 to attack, d6 damage. You must be close to your target."}, {"name": "Ancient Gore-Hound", "gainPet": "Ancient Gore-Hound", "description": "Asthmatic hound with superb nose. DR10 attack (d6), DR12 defence, 10 HP."}]	[]	0	30	f	f	2026-01-06 22:04:16.959639	2026-01-06 22:04:16.959639
e9a658c1-4459-4f37-9664-89422c4ecaea	Frustan	1	body.13	habits.4	tales.11	traits.19	traits.12	origins.fanged_deserter.6	12	8	13	7	2	2	2	2	[{"key": "scroll.sacred.3"}, {"key": "equipment.chalk"}, {"key": "equipment.mirror"}]	[{"key": "weapons.zweihander"}]	{"key": "armor.splint"}	[{"name": "Clumsy and Dull-witted", "description": "Agility tests are DR+2, excluding defence. You are incapable of understanding scrolls."}, {"name": "Bite Attack", "description": "DR10 to attack, d6 damage. You must be close to your target."}, {"name": "The Shoe of Death's Horse", "gainItem": "The Shoe of Death's Horse", "description": "DR10, d4 damage. 1 in 6 instant kill on small-medium creatures. Returns like boomerang."}]	[]	0	30	f	f	2026-01-06 22:04:50.961603	2026-01-06 22:04:50.961603
7ae7bc8e-3558-4994-9437-f3e1203e6cd8	Belum	1	body.6	habits.20	tales.1	traits.16	traits.19	origins.fanged_deserter.4	14	13	11	9	5	5	2	2	[{"key": "equipment.lockpicks"}, {"key": "equipment.chalk"}, {"key": "equipment.black-poison"}]	[{"key": "weapons.bow"}]	{"key": "armor.mail"}	[{"name": "Clumsy and Dull-witted", "description": "Agility tests are DR+2, excluding defence. You are incapable of understanding scrolls."}, {"name": "Bite Attack", "description": "DR10 to attack, d6 damage. You must be close to your target."}, {"name": "The Shoe of Death's Horse", "gainItem": "The Shoe of Death's Horse", "description": "DR10, d4 damage. 1 in 6 instant kill on small-medium creatures. Returns like boomerang."}]	[]	0	60	f	f	2026-01-06 22:05:05.74327	2026-01-06 22:05:05.74327
\.


--
-- Data for Name: classes; Type: TABLE DATA; Schema: public; Owner: morkborg
--

COPY public.classes (id, name, roll, appendix, hp_die, weapon_die, armor_die, silver_dice, silver_modifier, stat_modifiers, class_abilities, random_abilities, random_ability_count) FROM stdin;
1	Fanged Deserter	1	You have thirty or so friends who never let you down: YOUR TEETH. Disloyal, deranged or simply uncontrollable, any group that didn't boot you out you left anyway.	10	10	4	{6,6}	10	{"agility": -1, "presence": -1, "strength": 2, "toughness": 0}	[{"name": "Clumsy and Dull-witted", "description": "Agility tests are DR+2, excluding defence. You are incapable of understanding scrolls."}, {"name": "Bite Attack", "description": "DR10 to attack, d6 damage. You must be close to your target."}]	[{"name": "Crumpled Monster Mask", "description": "Strikes primitive fear into lesser creatures like goblins and children."}, {"name": "The Brown Scimitar of Galgenbeck", "gainItem": "The Brown Scimitar of Galgenbeck", "description": "A stinking sword. D6 damage. 1 in 6 chance wounded enemy dies of sepsis."}, {"name": "Wizard Teeth", "description": "Four weird teeth in a pouch. Roll d6 for each before battle, on 6 one attack deals max damage."}, {"name": "Old Sigürd's Sling", "gainItem": "Old Sigürd's Sling", "description": "Woven from hair, 2d4 damage with fist-sized rocks."}, {"name": "Ancient Gore-Hound", "gainPet": "Ancient Gore-Hound", "description": "Asthmatic hound with superb nose. DR10 attack (d6), DR12 defence, 10 HP."}, {"name": "The Shoe of Death's Horse", "gainItem": "The Shoe of Death's Horse", "description": "DR10, d4 damage. 1 in 6 instant kill on small-medium creatures. Returns like boomerang."}]	1
2	Gutterborn Scum	2	An ill star smiled upon your birth. Poverty, crime and bad parenting didn't help either. A razor blade and a moonless night are worth a week of chump-work.	6	6	2	{6}	10	{"agility": 0, "presence": 0, "strength": -2, "toughness": 0}	[{"name": "Stealthy", "description": "All Presence and Agility tests have their DR reduced by 2."}]	[{"name": "Coward's Jab", "description": "When attacking by surprise, DR10 Agility for auto-hit with +3 damage."}, {"name": "Filthy Fingersmith", "gainItem": "Metal file and lockpicks", "description": "Pickpocket and lockpick at DR8 Agility."}, {"name": "Abominable Gob Lobber", "description": "Spit d2 times per fight at DR8 Presence. Targets blinded d4 rounds."}, {"name": "Escaping Fate", "description": "50% chance omens are not spent when used."}, {"name": "Excretal Stealth", "description": "DR16 Presence to spot you when hidden in muck."}, {"name": "Dodging Death", "description": "50% chance to survive death with d4 HP after 10 rounds."}]	1
3	Esoteric Hermit	3	The stone of your cave is one with the stars. Silence and perfection. Now the chaos of a fallen world disturbs your rituals.	4	4	2	{6}	10	{"agility": 0, "presence": 2, "strength": -2, "toughness": 0}	[]	[{"name": "Master of Fate", "description": "Know the right way with a DR8 Presence test."}, {"name": "A Book of Boiling Blood", "description": "Once daily summon D2 Berserker-slayers. D6 roll: 1-4 fight for you, 5-6 attack you."}, {"name": "Speaker of Truths", "description": "Twice daily lower next test DR by 4 for a creature."}, {"name": "Initiate of the Invisible College", "description": "Once daily summon D2 scrolls (sacred or unclean)."}, {"name": "Bard of the Undying", "description": "Harp music gives +D4 on reaction rolls."}, {"name": "Hawk as Weapon", "gainPet": "Hawk", "description": "Loyal hawk. DR10 attack/defence, d4 damage, 8 HP."}]	1
4	Wretched Royalty	4	Bowed down only by the memories of your own lost glory, you could never submit to anyone else. Not you, of noble blood!	6	8	3	{6,6,6,6}	10	{"agility": 0, "presence": 0, "strength": 0, "toughness": 0}	[]	[{"name": "The Blade of your Ancestors", "gainItem": "The Blade of your Ancestors", "description": "Talking sword, foppish and unreliable. D6+1 damage, DR10. 1 in 6 chance to attack you."}, {"name": "Poltroon the Court Jester", "gainPet": "Poltroon the Court Jester", "description": "Irritating but +2 attack/defence for first 2 rounds."}, {"name": "Barbarister the Incredible Horse", "gainPet": "Barbarister the Incredible Horse", "description": "Magical, intelligent, arrogant talking horse. Sometimes +2 to logic tests."}, {"name": "Hamfund the Squire", "gainPet": "Hamfund the Squire", "description": "Cowardly squire guards Eurekia sword. 2d6 damage but 1 in 6 kills squire."}, {"name": "The Snake-Skin Gift", "gainItem": "The Snake-Skin Gift", "description": "Dagger does d4 damage, on 1 target dies of poison."}, {"name": "Horn of the Schleswig Lords", "description": "Once daily, DR12 Presence for automatic success on next non-combat test."}]	2
5	Heretical Priest	5	Hunted by the Two-Headed Basilisks of the One True Faith, you can be found raving in ruins and desecrating cathedrals by night.	8	8	4	{6,6,6}	10	{"agility": 0, "presence": 2, "strength": -2, "toughness": 0}	[]	[{"name": "Sacred Shepherd's Crook", "gainItem": "Sacred Shepherd's Crook", "description": "Staff does 2d4 damage except to faithless humans."}, {"name": "Stolen Mitre", "description": "Defence DR10, stealth DR8 when pulled over ears."}, {"name": "List of Sins", "description": "DR10 Presence to reveal evil creatures, +2 defence against them."}, {"name": "The Blasphemous Nechrubel Bible", "description": "Daily read: even roll heals d4 HP after 5 min rest, odd roll causes hallucinations."}, {"name": "Stones from Thel-Emas' Lost Temple", "description": "Cast to reveal danger in adjacent room. DR10 Presence to verify truth."}, {"name": "Crucifix of the Inverted Christ", "description": "Check morale on undead, trolls, goblins to make them leave."}]	1
6	Occult Herbmaster	6	Born of the mushroom, raised in the glade, watched by the eye of the moon in a silverblack pool.	6	6	2	{6,6}	10	{"agility": 0, "presence": 0, "strength": -2, "toughness": 2}	[{"name": "Portable Laboratory", "description": "Daily create 2 random decoctions, d4 doses total. Expire after 24 hours."}, {"name": "Decoctions Available", "description": "Red Poison, Ezumiel's Vapor, Southern Frog, Elixir Vitalis, Spider-Owl Soup, Fernors Philtre, Hyphoss Snuff, Black Poison"}]	[]	0
\.


--
-- Data for Name: equipment; Type: TABLE DATA; Schema: public; Owner: morkborg
--

COPY public.equipment (id, key, tags, amount_min, amount_max, mod, hp_min, hp_max, hp_mod, value, exp, roll, multiple, ammo_type, ammo_start, use_effect) FROM stdin;
1	equipment.backpack	{carry}	\N	\N	\N	\N	\N	\N	6	f	\N	1	\N	\N	\N
2	equipment.sack	{carry}	\N	\N	\N	\N	\N	\N	3	f	\N	1	\N	\N	\N
3	equipment.small-wagon	{carry}	\N	\N	\N	\N	\N	\N	25	f	\N	1	\N	\N	\N
4	equipment.donkey	{carry}	\N	\N	\N	\N	\N	\N	10	f	\N	1	\N	\N	\N
5	equipment.rope	{tool}	\N	\N	\N	\N	\N	\N	4	f	\N	1	\N	\N	\N
6	equipment.blanket	{camping}	\N	\N	\N	\N	\N	\N	4	f	\N	1	\N	\N	\N
7	equipment.torches	{tool,lighting,consumable}	\N	\N	presence	\N	\N	\N	2	f	\N	1	Torch	6	{"lose": "Torch", "text": "You light your torch", "type": "MultiUse"}
8	equipment.lantern	{tool,metal,lighting,consumable}	\N	\N	presence	\N	\N	\N	10	f	\N	1	Oil	6	{"lose": "Oil", "text": "You add oil and light it", "type": "MultiUse"}
9	equipment.magnesium-strip	{tool,consumable}	\N	\N	\N	\N	\N	\N	4	f	\N	1	\N	\N	\N
10	equipment.firesteel	{tool,metal}	\N	\N	\N	\N	\N	\N	4	f	\N	1	\N	\N	\N
11	equipment.sharp-needle	{tool}	\N	\N	\N	\N	\N	\N	3	f	\N	1	\N	\N	\N
12	equipment.wooden-crucifix	{symbol}	\N	\N	\N	\N	\N	\N	9	f	\N	1	\N	\N	\N
13	equipment.silver-crucifix	{symbol,metal}	\N	\N	\N	\N	\N	\N	60	f	\N	1	\N	\N	\N
14	equipment.lockpicks	{tool,metal}	\N	\N	\N	\N	\N	\N	5	f	\N	1	\N	\N	\N
15	equipment.manacles	{tool,metal}	\N	\N	\N	\N	\N	\N	10	f	\N	1	\N	\N	\N
16	equipment.toolbox	{tool,metal}	\N	\N	\N	\N	\N	\N	20	f	\N	1	\N	\N	\N
17	equipment.heavy-chain	{tool,metal}	\N	\N	\N	\N	\N	\N	10	f	\N	1	\N	\N	\N
18	equipment.scissors	{tool,metal}	\N	\N	\N	\N	\N	\N	9	f	\N	1	\N	\N	\N
19	equipment.grappling-hook	{tool,metal}	\N	\N	\N	\N	\N	\N	12	f	\N	1	\N	\N	\N
20	equipment.noose	{tool}	\N	\N	\N	\N	\N	\N	5	f	\N	1	\N	\N	\N
21	equipment.tent	{camping}	\N	\N	\N	\N	\N	\N	12	f	\N	1	\N	\N	\N
22	equipment.mirror	{luxury,metal}	\N	\N	\N	\N	\N	\N	15	f	\N	1	\N	\N	\N
23	equipment.exquisite-perfume	{luxury,consumable}	\N	\N	\N	\N	\N	\N	25	f	\N	1	\N	\N	\N
24	equipment.bear-trap	{trap,metal}	\N	\N	\N	\N	\N	\N	20	f	\N	1	\N	\N	\N
25	equipment.lard	{food,consumable}	\N	\N	\N	\N	\N	\N	5	f	\N	1	\N	\N	\N
26	equipment.chewing-tobacco	{consumable}	\N	\N	\N	\N	\N	\N	1	f	\N	4	\N	\N	\N
27	equipment.chalk	{consumable,tool}	\N	\N	\N	\N	\N	\N	1	f	\N	4	\N	\N	\N
28	equipment.salt	{consumable,tool}	\N	\N	\N	\N	\N	\N	3	t	\N	1	\N	\N	\N
29	equipment.medicine-chest	{consumable,tool,healing}	\N	\N	presence	\N	\N	\N	15	f	\N	2	\N	\N	{"heal": 6, "type": "SingleUse"}
30	equipment.life-elixir	{healing,consumable}	\N	\N	\N	\N	\N	\N	15	f	\N	1	\N	\N	{"heal": 6, "type": "SingleUse"}
31	equipment.red-poison	{consumable,poison}	\N	\N	\N	\N	\N	\N	20	f	\N	1	\N	\N	{"type": "SingleUse"}
32	equipment.black-poison	{consumable,poison}	\N	\N	\N	\N	\N	\N	20	f	\N	1	\N	\N	{"type": "SingleUse"}
33	equipment.bomb	{weapon,explosive,consumable,ranged}	\N	\N	\N	\N	\N	\N	40	t	\N	1	\N	\N	{"type": "SingleUse", "damage": 10}
34	scroll.unclean.1	{scroll,unclean}	\N	\N	\N	\N	\N	\N	50	f	1	1	\N	\N	\N
35	scroll.unclean.2	{scroll,unclean}	\N	\N	\N	\N	\N	\N	50	f	2	1	\N	\N	\N
36	scroll.unclean.3	{scroll,unclean}	\N	\N	\N	\N	\N	\N	50	f	3	1	\N	\N	\N
37	scroll.unclean.4	{scroll,unclean}	\N	\N	\N	\N	\N	\N	50	f	4	1	\N	\N	\N
38	scroll.unclean.5	{scroll,unclean}	\N	\N	\N	\N	\N	\N	50	f	5	1	\N	\N	\N
39	scroll.unclean.6	{scroll,unclean}	\N	\N	\N	\N	\N	\N	50	f	6	1	\N	\N	\N
40	scroll.unclean.7	{scroll,unclean}	\N	\N	\N	\N	\N	\N	50	f	7	1	\N	\N	\N
41	scroll.unclean.8	{scroll,unclean}	\N	\N	\N	\N	\N	\N	50	f	8	1	\N	\N	\N
42	scroll.unclean.9	{scroll,unclean}	\N	\N	\N	\N	\N	\N	50	f	9	1	\N	\N	\N
43	scroll.unclean.10	{scroll,unclean}	\N	\N	\N	\N	\N	\N	50	f	10	1	\N	\N	\N
44	scroll.sacred.1	{scroll,sacred}	\N	\N	\N	\N	\N	\N	50	f	1	1	\N	\N	\N
45	scroll.sacred.2	{scroll,sacred}	\N	\N	\N	\N	\N	\N	50	f	2	1	\N	\N	\N
46	scroll.sacred.3	{scroll,sacred}	\N	\N	\N	\N	\N	\N	50	f	3	1	\N	\N	\N
47	scroll.sacred.4	{scroll,sacred}	\N	\N	\N	\N	\N	\N	50	f	4	1	\N	\N	\N
48	scroll.sacred.5	{scroll,sacred}	\N	\N	\N	\N	\N	\N	50	f	5	1	\N	\N	\N
49	scroll.sacred.6	{scroll,sacred}	\N	\N	\N	\N	\N	\N	50	f	6	1	\N	\N	\N
50	scroll.sacred.7	{scroll,sacred}	\N	\N	\N	\N	\N	\N	50	f	7	1	\N	\N	\N
51	scroll.sacred.8	{scroll,sacred}	\N	\N	\N	\N	\N	\N	50	f	8	1	\N	\N	\N
52	scroll.sacred.9	{scroll,sacred}	\N	\N	\N	\N	\N	\N	50	f	9	1	\N	\N	\N
53	scroll.sacred.10	{scroll,sacred}	\N	\N	\N	\N	\N	\N	50	f	10	1	\N	\N	\N
54	equipment.ezumiel-vapor	{consumable,decoction}	\N	\N	\N	\N	\N	\N	0	f	\N	1	\N	\N	{"type": "SingleUse", "effectDie": 4}
55	equipment.southern-frog	{consumable,decoction}	\N	\N	\N	\N	\N	\N	0	f	\N	1	\N	\N	{"type": "SingleUse", "effectDie": 4}
56	equipment.elixir-vitalis	{consumable,decoction}	\N	\N	\N	\N	\N	\N	0	f	\N	1	\N	\N	{"heal": 6, "type": "SingleUse"}
57	equipment.spider-owl-soup	{consumable,decoction}	\N	\N	\N	\N	\N	\N	0	f	\N	1	\N	\N	{"type": "SingleUse"}
58	equipment.fernors-philtre	{consumable,decoction}	\N	\N	\N	\N	\N	\N	0	f	\N	1	\N	\N	{"type": "SingleUse", "effectDie": 4}
59	equipment.hyphos-snuff	{consumable,decoction}	\N	\N	\N	\N	\N	\N	0	f	\N	1	\N	\N	{"type": "SingleUse", "statuses": [{"value": -2, "source": "Hyphos snuff", "exclude": ["ability", "heal", "ranged", "melee", "cast"], "statistic": "agility"}]}
\.


--
-- Data for Name: habits; Type: TABLE DATA; Schema: public; Owner: morkborg
--

COPY public.habits (id, key, roll, exp, items) FROM stdin;
1	habits.1	1	f	[{"ammo": {"type": "Stone", "startWith": 66}, "name": "Sackcloth bag", "tags": ["habit-item"], "description": "filled with sharp stones"}]
2	habits.2	2	f	[]
3	habits.3	3	f	[]
4	habits.4	4	f	[]
5	habits.5	5	f	[]
6	habits.6	6	f	[]
7	habits.7	7	f	[{"name": "Skull", "tags": ["useless"], "description": "a trusted friend"}]
8	habits.8	8	f	[]
9	habits.9	9	f	[]
10	habits.10	10	f	[]
11	habits.11	11	f	[]
12	habits.12	12	f	[]
13	habits.13	13	f	[]
14	habits.14	14	f	[]
15	habits.15	15	f	[]
16	habits.16	16	f	[]
17	habits.17	17	f	[]
18	habits.18	18	f	[]
19	habits.19	19	f	[]
20	habits.20	20	f	[{"name": "String necklace", "tags": ["useless"], "description": "most of the teeth are mismatched..."}]
\.


--
-- Data for Name: names; Type: TABLE DATA; Schema: public; Owner: morkborg
--

COPY public.names (id, name) FROM stdin;
1	Aerg-Tval
2	Agn
3	Arvant
4	Belsum
5	Belum
6	Brinta
7	Börda
8	Daeru
9	Eldar
10	Felban
11	Gotven
12	Graft
13	Grin
14	Grittr
15	Haerü
16	Hargha
17	Harmug
18	Jotna
19	Karg
20	Karva
21	Katla
22	Keftar
23	Klort
24	Kratar
25	Kutz
26	Kvetin
27	Lygan
28	Margar
29	Merkari
30	Nagl
31	Niduk
32	Nifehl
33	Prügl
34	Qillnach
35	Risten
36	Svind
37	Theras
38	Therg
39	Torvul
40	Törn
41	Urm
42	Urvarg
43	Vagal
44	Vatan
45	Von
46	Vrakh
47	Vresi
48	Wemut
49	Achard
50	Allram
51	Alwrig
52	Ansgot
53	Aren
54	Arga
55	Arundel
56	Aslan
57	Ator
58	Azor
59	Balfyr
60	Belmis
61	Belsnickel
62	Benzen
63	Beörn
64	Bigred
65	Bigtun
66	Blotra
67	Blotvar
68	Blygr
69	Brom
70	Bölbeck
71	Carax
72	Dedrik
73	Dekram
74	Derril
75	Dismoll
76	Dorhant
77	Dritz
78	Drulme
79	Dundar
80	Duval
81	Eglom
82	Espech
83	Essen
84	Fechr
85	Ferrum
86	Foolium
87	Frustan
88	Fyrfank
89	Gamron
90	Glesbrig
91	Glum
92	Gnell
93	Gorwa
94	Grendl
95	Grima
96	Grotske
97	Guzar
98	Hachet
99	Halbörd
100	Halva
101	Hamr
102	Hargar
103	Harik
104	Hat
105	Hirmot
106	Hispan
107	Hodork
108	Honsel
109	Hostan
110	Hostra
111	Igorn
112	Junkr
113	Jurt
114	Kalih
115	Kalruz
116	Kerwyn
117	Kollsup
118	Kotlin
119	Kotran
120	Krang
121	Krassel
122	Krëk
123	Kulmar
124	Kultr
125	Këttel
126	Lagorm
127	Lenker
128	Lessar
129	Lurtz
130	Magont
131	Magrot
132	Magverk
133	Malaiz
134	Malfux
135	Masar
136	Miron
137	Mirthgin
138	Mogr
139	Mordan
140	Mordhaug
141	Morum
142	Myrrha
143	Naplam
144	Nardag
145	Nedrigg
146	Nilhark
147	Numtor
148	Ochra
149	Ogram
150	Oxkart
151	Parma
152	Parthos
153	Phoba
154	Pluck
155	Prosk
156	Pyron
157	Rankor
158	Rask
159	Rebar
160	Rech
161	Regor
162	Rektam
163	Reukr
164	Rhadon
165	Ribb
166	Ronkhil
167	Rot
168	Rotmun
169	Rugnar
170	Rüsa
171	Satmet
172	Sator
173	Satrin
174	Schmikel
175	Sigman
176	Skral
177	Skross
178	Skura
179	Slaktr
180	Slask
181	Slengar
182	Smark
183	Smolk
184	Snott
185	Sorstig
186	Spiegel
187	Stanpeth
188	Stargon
189	Stein
190	Streta
191	Sveda
192	Tark
193	Tarkin
194	Tarmak
195	Temla
196	Torbe
197	Treck
198	Tyke
199	Ungkar
200	Urskinn
201	Usk
202	Vakopr
203	Valkar
204	Vardok
205	Vask
206	Veder
207	Vegra
208	Vendi
209	Vexa
210	Vindag
211	Vitharm
212	Vittra
213	Vort
214	Wort
215	Zweiman
\.


--
-- Data for Name: origins; Type: TABLE DATA; Schema: public; Owner: morkborg
--

COPY public.origins (id, class_id, roll, key) FROM stdin;
61	1	1	origins.fanged_deserter.1
62	1	2	origins.fanged_deserter.2
63	1	3	origins.fanged_deserter.3
64	1	4	origins.fanged_deserter.4
65	1	5	origins.fanged_deserter.5
66	1	6	origins.fanged_deserter.6
67	2	1	origins.gutterborn_scum.1
68	2	2	origins.gutterborn_scum.2
69	2	3	origins.gutterborn_scum.3
70	2	4	origins.gutterborn_scum.4
71	2	5	origins.gutterborn_scum.5
72	2	6	origins.gutterborn_scum.6
73	3	1	origins.esoteric_hermit.1
74	3	2	origins.esoteric_hermit.2
75	3	3	origins.esoteric_hermit.3
76	3	4	origins.esoteric_hermit.4
77	3	5	origins.esoteric_hermit.5
78	3	6	origins.esoteric_hermit.6
79	4	1	origins.wretched_royalty.1
80	4	2	origins.wretched_royalty.2
81	4	3	origins.wretched_royalty.3
82	4	4	origins.wretched_royalty.4
83	4	5	origins.wretched_royalty.5
84	4	6	origins.wretched_royalty.6
85	5	1	origins.heretical_priest.1
86	5	2	origins.heretical_priest.2
87	5	3	origins.heretical_priest.3
88	5	4	origins.heretical_priest.4
89	5	5	origins.heretical_priest.5
90	5	6	origins.heretical_priest.6
91	6	1	origins.occult_herbmaster.1
92	6	2	origins.occult_herbmaster.2
93	6	3	origins.occult_herbmaster.3
94	6	4	origins.occult_herbmaster.4
95	6	5	origins.occult_herbmaster.5
96	6	6	origins.occult_herbmaster.6
\.


--
-- Data for Name: pets; Type: TABLE DATA; Schema: public; Owner: morkborg
--

COPY public.pets (id, key, hp, tags, exp, action_die, action_type, amount, amount_die, buff, value) FROM stdin;
1	pets.small-dog	6	{animal,pet}	f	{4}	melee	1	\N	[]	25
2	pets.monkey	2	{animal,pet}	f	{4}	melee	1	4	[]	15
3	pets.hawk	8	{pet,special}	f	{4}	melee	1	\N	[]	0
4	pets.gore-hound	10	{pet,special}	f	{6}	melee	1	\N	[]	0
5	pets.hamfund	1	{pet,special,humanoid}	f	{6,6}	melee	1	\N	[]	0
6	pets.barbarister	1	{pet,special}	f	{}	buff	1	\N	[{"value": 2, "source": "Barbarister's guidance", "exclude": ["melee", "ranged", "cast", "ability", "defence", "buff"], "statistic": "presence"}]	0
7	pets.poltroon	1	{pet,special}	f	{}	buff	1	\N	[{"value": 2, "source": "Poltroon's annoyance", "exclude": ["melee", "ranged", "cast", "ability", "test", "heal", "buff"], "statistic": "agility"}, {"value": 2, "source": "Poltroon's annoyance", "exclude": ["defence", "ranged", "cast", "ability", "test", "heal", "buff"], "statistic": "strength"}, {"value": 2, "source": "Poltroon's annoyance", "exclude": ["defence", "melee", "cast", "ability", "test", "heal", "buff"], "statistic": "presence"}]	0
\.


--
-- Data for Name: tales; Type: TABLE DATA; Schema: public; Owner: morkborg
--

COPY public.tales (id, key, roll, exp, items) FROM stdin;
1	tales.1	1	f	[]
2	tales.2	2	f	[]
3	tales.3	3	f	[]
4	tales.4	4	f	[]
5	tales.5	5	f	[]
6	tales.6	6	f	[]
7	tales.7	7	f	[]
8	tales.8	8	f	[]
9	tales.9	9	f	[]
10	tales.10	10	f	[]
11	tales.11	11	f	[]
12	tales.12	12	f	[]
13	tales.13	13	f	[]
14	tales.14	14	f	[]
15	tales.15	15	f	[]
16	tales.16	16	f	[{"name": "Sling", "tags": ["weapon", "ranged"], "value": 8, "description": "d4 damage, unlimited fist-sized rocks"}]
17	tales.17	17	f	[]
18	tales.18	18	f	[]
19	tales.19	19	f	[]
20	tales.20	20	f	[]
\.


--
-- Data for Name: traits; Type: TABLE DATA; Schema: public; Owner: morkborg
--

COPY public.traits (id, key, roll) FROM stdin;
1	traits.1	1
2	traits.2	2
3	traits.3	3
4	traits.4	4
5	traits.5	5
6	traits.6	6
7	traits.7	7
8	traits.8	8
9	traits.9	9
10	traits.10	10
11	traits.11	11
12	traits.12	12
13	traits.13	13
14	traits.14	14
15	traits.15	15
16	traits.16	16
17	traits.17	17
18	traits.18	18
19	traits.19	19
20	traits.20	20
\.


--
-- Data for Name: translations; Type: TABLE DATA; Schema: public; Owner: morkborg
--

COPY public.translations (locale, key, value) FROM stdin;
en	weapons.snake-skin-gift	The Snake-Skin Gift
en	weapons.snake-skin-gift.description	An expensive sandalwood box bound in snakeskin containing a dagger. d4 damage
en	weapons.blade-of-ancestors	The Blade of your Ancestors
en	weapons.blade-of-ancestors.description	A magnificent talking sword that is foppish, unreliable and quietly despises you. d6+1 damage
en	weapons.brown-scimitar	The Brown Scimitar of Galgenbeck
en	weapons.brown-scimitar.description	A stinking sword from a military shit-ditch. d6 damage
en	weapons.sigurd-sling	Old Sigürd's Sling
en	weapons.sigurd-sling.description	Woven from grey hair, this sling has never failed you. 2d4 damage
en	weapons.shoe-of-death	The Shoe of Death's Horse
en	weapons.shoe-of-death.description	A horseshoe from Death himself. d4 damage, returns like a boomerang
en	weapons.femur	Femur
en	weapons.femur.description	d4 damage
en	weapons.staff	Staff
en	weapons.staff.description	d4 damage
en	weapons.shortsword	Shortsword
en	weapons.shortsword.description	d4 damage
en	weapons.knife	Knife
en	weapons.knife.description	d4 damage
en	weapons.warhammer	Warhammer
en	weapons.warhammer.description	d6 damage
en	weapons.sword	Sword
en	weapons.sword.description	d6 damage
en	weapons.bow	Bow
en	weapons.bow.description	d6 damage
en	weapons.flail	Flail
en	weapons.flail.description	d8 damage
en	weapons.crossbow	Crossbow
en	weapons.crossbow.description	d8 damage
en	weapons.zweihander	Zweihänder
en	weapons.zweihander.description	d10 damage
en	weapons.whip	Whip
en	weapons.whip.description	d2 damage
en	weapons.cudgel	Cudgel
en	weapons.cudgel.description	d4 damage
en	weapons.sling	Sling
en	weapons.sling.description	d4 damage, unlimited fist-sized rocks
en	weapons.sickle	Sickle
en	weapons.sickle.description	d4 damage
en	weapons.club	Club
en	weapons.club.description	d6 damage
en	weapons.handaxe	Handaxe
en	weapons.handaxe.description	d6 damage
en	weapons.mace	Mace
en	weapons.mace.description	d6 damage
en	weapons.spear	Spear
en	weapons.spear.description	d6 damage
en	weapons.battle-axe	Battle Axe
en	weapons.battle-axe.description	d8 damage
en	weapons.goedendag	Goedendag
en	weapons.goedendag.description	d8 damage
en	weapons.meat-cleaver	Meat Cleaver
en	weapons.meat-cleaver.description	d4 damage
en	weapons.crowbar	Crowbar
en	weapons.crowbar.description	d4 damage
en	weapons.hammer	Hammer
en	weapons.hammer.description	d4 damage
en	weapons.caltrops	Caltrops
en	weapons.caltrops.description	d4 damage + infection on 1 in 6
en	weapons.shield	Shield
en	weapons.shield.description	-1 HP damage or break to ignore one attack
en	armor.fur	Fur Armor
en	armor.fur.description	-d2 damage, tier 1
en	armor.padded-cloth	Padded Cloth Armor
en	armor.padded-cloth.description	-d2 damage, tier 1
en	armor.leather	Leather Armor
en	armor.leather.description	-d2 damage, tier 1
en	armor.scale	Scale Armor
en	armor.scale.description	-d4 damage, tier 2, DR +2 on Agility tests
en	armor.mail	Mail Armor
en	armor.mail.description	-d4 damage, tier 2, DR +2 on Agility tests
en	armor.splint	Splint Armor
en	armor.splint.description	-d6 damage, tier 3, DR +4 on Agility tests, defence DR +2
en	armor.plate	Plate Armor
en	armor.plate.description	-d6 damage, tier 3, DR +4 on Agility tests, defence DR +2
en	pets.small-dog	Small but vicious dog
en	pets.small-dog.description	Bite d4, only obeys you
en	pets.monkey	Monkey
en	pets.monkey.description	It ignores you but loves you. 2 HP, punch/bite d4
en	origins.esoteric_hermit.4	You were dying of plague in a Bergen Chrypt hovel, when you touched something from outside.
en	pets.hawk.description	Your crafty almost-intelligent hawk is loyal only to you. Swoops to attack foes.
en	pets.gore-hound	Ancient Gore-Hound
en	pets.gore-hound.description	Asthmatic, deluded, but has a superb nose for treasure. Frenzied around goblins.
en	pets.hamfund.description	Cowardly guardian of the cursed sword Eurekia. Once per combat, draw for 2d6 damage.
en	pets.barbarister.description	Magical, intelligent, arrogant talking horse. Sometimes +2 to Presence tests.
en	pets.poltroon.description	Irritating but distracting. First two rounds: +2 attack/defence for allies.
en	equipment.backpack	Backpack
en	equipment.backpack.description	For 7 normal-sized items
en	equipment.sack	Sack
en	equipment.sack.description	For 10 normal-sized items
en	equipment.small-wagon	Small Wagon
en	equipment.small-wagon.description	You can put stuff in it
en	equipment.donkey	Donkey
en	equipment.donkey.description	Mostly ignores you
en	equipment.rope	Rope
en	equipment.rope.description	30 feet
en	equipment.blanket	Blanket
en	equipment.blanket.description	
en	equipment.torches	Torches
en	equipment.torches.description	
en	equipment.lantern	Lantern
en	equipment.lantern.description	With oil
en	equipment.magnesium-strip	Magnesium Strip
en	equipment.magnesium-strip.description	
en	equipment.firesteel	Firesteel
en	equipment.firesteel.description	
en	equipment.sharp-needle	Sharp Needle
en	equipment.sharp-needle.description	
en	equipment.wooden-crucifix	Wooden Crucifix
en	equipment.wooden-crucifix.description	
en	equipment.silver-crucifix	Silver Crucifix
en	equipment.silver-crucifix.description	
en	equipment.lockpicks	Metal File and Lockpicks
en	equipment.lockpicks.description	
en	equipment.manacles	Manacles
en	equipment.manacles.description	
en	equipment.toolbox	Toolbox
en	equipment.toolbox.description	10 nails, tongs, hammer, small saw, and drill
en	equipment.heavy-chain	Heavy Chain
en	equipment.heavy-chain.description	15 feet
en	equipment.scissors	Scissors
en	equipment.scissors.description	
en	equipment.grappling-hook	Grappling Hook
en	equipment.grappling-hook.description	
en	equipment.noose	Noose
en	equipment.noose.description	
en	equipment.tent	Tent
en	equipment.tent.description	
en	equipment.mirror	Mirror
en	equipment.mirror.description	Worth 15s
en	equipment.exquisite-perfume	Exquisite Perfume
en	equipment.exquisite-perfume.description	Worth 25s
en	equipment.bear-trap	Bear Trap
en	equipment.bear-trap.description	DR14 to spot, d8 damage
en	equipment.lard	Lard
en	equipment.lard.description	May function as 5 meals in a pinch
en	equipment.chewing-tobacco	Chewing Tobacco
en	equipment.chewing-tobacco.description	
en	equipment.chalk	Stick of Chalk
en	equipment.chalk.description	
en	equipment.salt	A Bottle of Salt
en	equipment.salt.description	
en	equipment.medicine-chest	Medicine Chest
en	equipment.medicine-chest.description	Stops bleeding/infection and heals d6 HP
en	equipment.life-elixir	Life Elixir
en	equipment.life-elixir.description	Heals d6 HP and removes infection
en	equipment.red-poison	A Bottle of Red Poison
en	equipment.red-poison.description	Toughness DR12 or d10 damage
en	equipment.black-poison	A Bottle of Black Poison
en	equipment.black-poison.description	Toughness DR14 or d6 damage + blind for one hour
en	equipment.bomb	Bomb
en	equipment.bomb.description	Sealed bottle, d10 damage
en	scroll.unclean.1	Palms Open the Southern Gate
en	scroll.unclean.1.description	A ball of fire hits d2 creatures dealing d8 damage per creature
en	scroll.unclean.2	Tongue of Eris
en	scroll.unclean.2.description	A creature of your choice is confused for 10 minutes
en	scroll.unclean.3	Te-le-kin-esis
en	scroll.unclean.3.description	Move an object up 1d10 feet for d6 minutes
en	scroll.unclean.4	Lucy-Fires Levitation
en	scroll.unclean.4.description	Hover for Presence + d10 rounds
en	scroll.unclean.5	Daemon of Capillaries
en	scroll.unclean.5.description	One creature suffocates for d6 rounds, losing d4 HP per round
en	scroll.unclean.6	Nine Violet Signs Unknot the Storm
en	scroll.unclean.6.description	Produce d2 lightning bolts dealing d6 damage each
en	scroll.unclean.7	Metzhuotl Blind Your Eye
en	scroll.unclean.7.description	A creature becomes invisible for d6 rounds
en	scroll.unclean.8	Foul Psychopomp
en	scroll.unclean.8.description	Summon d4 skeletons or zombies
en	scroll.unclean.9	Eyelid Blinds the Mind
en	scroll.unclean.9.description	d4 creatures fall asleep for one hour
en	scroll.unclean.10	Death
en	scroll.unclean.10.description	All creatures within 30 feet lose a total of 4d10 HP
en	scroll.sacred.1	Grace of a Dead Saint
en	scroll.sacred.1.description	d2 creatures regain d10 HP each
en	scroll.sacred.2	Grace for a Sinner
en	scroll.sacred.2.description	A creature gets +d6 on one roll
en	scroll.sacred.3	Whispers Pass the Gate
en	scroll.sacred.3.description	Ask three questions to a deceased creature
en	scroll.sacred.4	Aegis of Sorrow
en	scroll.sacred.4.description	A creature gains 2d6 extra HP for 10 rounds
en	scroll.sacred.5	Unmet Fate
en	scroll.sacred.5.description	Awaken a creature dead for no more than a week
en	scroll.sacred.6	Bestial Speech
en	scroll.sacred.6.description	Speak with animals for d20 minutes
en	scroll.sacred.7	False Dawn Night's Chariot
en	scroll.sacred.7.description	Light or pitch black for 3d10 minutes
en	scroll.sacred.8	Hermetic Step
en	scroll.sacred.8.description	Find all traps in your path for 2d10 minutes
en	scroll.sacred.9	Roskoe's Consuming Glare
en	scroll.sacred.9.description	d4 creatures lose d8 HP each
en	scroll.sacred.10	Enochian Syntax
en	scroll.sacred.10.description	One creature blindly obeys a single command
en	equipment.ezumiel-vapor	Ezumiel Vapor
en	equipment.ezumiel-vapor.description	Pass a DR14 test or severe hallucinations for d4 hours
en	equipment.southern-frog	Southern Frog Stew
en	equipment.southern-frog.description	Vomit for d4 hours, DR14 test or do nothing else
en	equipment.elixir-vitalis	Elixir Vitalis
en	equipment.elixir-vitalis.description	Heals d6 HP and stops infection. Can be habit forming
en	equipment.spider-owl-soup	Spider-Owl Soup
en	equipment.spider-owl-soup.description	See in darkness, climb on walls for 30 minutes
en	equipment.fernors-philtre	Fernor's Philtre
en	equipment.fernors-philtre.description	Dab in eye. Heals infection, +2 presence for d4 hours
en	equipment.hyphos-snuff	Hyphos's Enervating Snuff
en	equipment.hyphos-snuff.description	Berserk! Two attacks per round but defend with DR14. One fight.
en	origins.esoteric_hermit.5	You were an average individual until you encountered something in a dim glade in Sarkash.
en	origins.esoteric_hermit.6	You were raised on a lonely island in Lake Onda. No one else has ever heard of it.
en	origins.wretched_royalty.1	Things were going so well, until your Wästland palace was reduced to rubble.
en	origins.wretched_royalty.2	Things were going so well, until your caravan kingdom of Tveland fell into penury.
en	origins.wretched_royalty.3	Things were going so well, until King Fathmu IX's brother Zigmund, your father, was murdered.
en	origins.wretched_royalty.4	Things were going so well, until the southern empire of Südglans sank into the sea.
en	origins.wretched_royalty.5	Things were going so well, until two young princes were kidnapped west of Bergen Chrypt.
en	origins.wretched_royalty.6	Things were going so well, until Anthelia demanded a gift of noble blood.
en	origins.heretical_priest.1	You come from Galgenbeck, near the cathedral of the Two-Headed Basilisks.
en	origins.heretical_priest.2	You are the sole survivor of a massacred Allians cult.
en	origins.heretical_priest.3	You come from the crypts of Grift.
en	origins.heretical_priest.4	You come from some temple ruins in the Valley of the Unfortunate Undead.
en	origins.heretical_priest.5	You come from one of the many Graven-Tosk thief-tunnels.
en	origins.heretical_priest.6	You come from a secret Bergen Chrypt church.
en	origins.occult_herbmaster.1	Raised in calm isolation in the Sarkash dark.
en	origins.occult_herbmaster.2	From the illegal midnight markets of Schleswig.
en	origins.occult_herbmaster.3	From the heretic isle of Crëlut, two nautical miles east of Grift.
en	origins.occult_herbmaster.4	From the old frozen ruins not far from Allians.
en	origins.occult_herbmaster.5	From a little witches cottage in Galgenbeck.
en	origins.occult_herbmaster.6	From the ruins of the Shadow King's manse.
pl	weapons.snake-skin-gift	Prezent z wężowej skóry
pl	weapons.snake-skin-gift.description	Drogie pudełko z drewna sandałowego oprawione w skórę węża, zawierające sztylet. d4 obrażeń
pl	weapons.blade-of-ancestors	Ostrze Twoich Przodków
pl	weapons.blade-of-ancestors.description	Wspaniały gadający miecz, który jest fircykowaty, nieziemsko zawodny i po cichu tobą gardzi. d6+1 obrażeń
pl	weapons.brown-scimitar	Brązowy sejmitar z Galgenbeck
pl	weapons.brown-scimitar.description	Cuchnący miecz z wojskowego rowu kloacznego. d6 obrażeń
pl	weapons.sigurd-sling	Proca Starego Sigürda
pl	weapons.sigurd-sling.description	Upleciona z siwych włosów, ta proca nigdy cię nie zawiodła. 2d4 obrażeń
pl	weapons.shoe-of-death	Podkowa Konia Śmierci
pl	weapons.shoe-of-death.description	Podkowa samego Śmierci. d4 obrażeń, wraca jak bumerang
pl	weapons.femur	Kość udowa
pl	weapons.femur.description	d4 obrażeń
pl	weapons.staff	Kostur
pl	weapons.staff.description	d4 obrażeń
pl	weapons.shortsword	Krótki miecz
pl	weapons.shortsword.description	d4 obrażeń
pl	weapons.knife	Nóż
pl	weapons.knife.description	d4 obrażeń
pl	weapons.warhammer	Młot bojowy
pl	weapons.warhammer.description	d6 obrażeń
pl	weapons.sword	Miecz
pl	weapons.sword.description	d6 obrażeń
pl	weapons.bow	Łuk
pl	weapons.bow.description	d6 obrażeń
pl	weapons.flail	Kiścień
pl	weapons.flail.description	d8 obrażeń
pl	weapons.crossbow	Kusza
pl	weapons.crossbow.description	d8 obrażeń
pl	weapons.zweihander	Zweihänder
pl	weapons.zweihander.description	d10 obrażeń
pl	weapons.whip	Bicz
pl	weapons.whip.description	d2 obrażeń
pl	weapons.cudgel	Pałka
pl	weapons.cudgel.description	d4 obrażeń
pl	weapons.sling	Proca
pl	weapons.sling.description	d4 obrażeń, nieograniczona ilość kamieni wielkości pięści
pl	weapons.sickle	Sierp
pl	weapons.sickle.description	d4 obrażeń
pl	weapons.club	Maczuga
pl	weapons.club.description	d6 obrażeń
pl	weapons.handaxe	Toporek
pl	weapons.handaxe.description	d6 obrażeń
pl	weapons.mace	Buława
pl	weapons.mace.description	d6 obrażeń
pl	weapons.spear	Włócznia
pl	weapons.spear.description	d6 obrażeń
pl	weapons.battle-axe	Topór bitewny
pl	weapons.battle-axe.description	d8 obrażeń
pl	weapons.goedendag	Goedendag
pl	weapons.goedendag.description	d8 obrażeń
pl	weapons.meat-cleaver	Tasak do mięsa
pl	weapons.meat-cleaver.description	d4 obrażeń
pl	weapons.crowbar	Łom
pl	weapons.crowbar.description	d4 obrażeń
pl	weapons.hammer	Młotek
pl	weapons.hammer.description	d4 obrażeń
pl	weapons.caltrops	Czosnki (kolce)
pl	weapons.caltrops.description	d4 obrażeń + infekcja przy 1 na 6
pl	weapons.shield	Tarcza
pl	weapons.shield.description	-1 obrażeń PŻ lub zniszcz, aby zignorować jeden atak
pl	armor.fur	Zbroja z futra
pl	armor.fur.description	-d2 obrażeń, poziom 1
pl	armor.padded-cloth	Przeszywanica
pl	armor.padded-cloth.description	-d2 obrażeń, poziom 1
pl	armor.leather	Zbroja skórzana
pl	armor.leather.description	-d2 obrażeń, poziom 1
pl	armor.scale	Zbroja łuskowa
pl	armor.scale.description	-d4 obrażeń, poziom 2, PT +2 do testów Zwinności
pl	armor.mail	Kolczuga
pl	armor.mail.description	-d4 obrażeń, poziom 2, PT +2 do testów Zwinności
pl	armor.splint	Zbroja karacenowa
pl	armor.splint.description	-d6 obrażeń, poziom 3, PT +4 do testów Zwinności, PT obrony +2
pl	armor.plate	Zbroja płytowa
pl	armor.plate.description	-d6 obrażeń, poziom 3, PT +4 do testów Zwinności, PT obrony +2
pl	pets.small-dog	Mały, ale wściekły pies
pl	pets.small-dog.description	Ugryzienie d4, słucha tylko ciebie
pl	pets.monkey	Małpa
pl	pets.monkey.description	Ignoruje cię, ale cię kocha. 2 PŻ, cios/ugryzienie d4
pl	pets.hawk	Jastrząb
pl	pets.hawk.description	Twój przebiegły, niemal inteligentny jastrząb jest lojalny tylko wobec ciebie. Atakuje wrogów z powietrza.
pl	pets.gore-hound	Starożytny ogar posokowiec
pl	pets.gore-hound.description	Astmatyczny, błądzący w ułudzie, ale ma genialny nos do skarbów. Wpada w szał przy goblinach.
pl	pets.hamfund	Splunięcie Hamfunda
pl	pets.hamfund.description	Tchórzliwy strażnik przeklętego miecza Eurekia. Raz na walkę, dobądź go dla 2d6 obrażeń.
pl	pets.barbarister	Barbarister, Niesamowity Koń
pl	pets.barbarister.description	Magiczny, inteligentny, arogancki gadający koń. Czasami +2 do testów Obecności.
pl	pets.poltroon	"Poltroon" Błazen Dworski
pl	pets.poltroon.description	Irytujący, ale odwracający uwagę. Pierwsze dwie rundy: +2 do ataku/obrony dla sojuszników.
pl	equipment.backpack	Plecak
pl	equipment.backpack.description	Na 7 przedmiotów normalnej wielkości
pl	equipment.sack	Worek
pl	equipment.sack.description	Na 10 przedmiotów normalnej wielkości
pl	equipment.small-wagon	Mały wóz
pl	equipment.small-wagon.description	Możesz do niego kłaść rzeczy
pl	equipment.donkey	Osioł
pl	equipment.donkey.description	Głównie cię ignoruje
pl	equipment.rope	Lina
pl	equipment.rope.description	30 stóp
pl	equipment.blanket	Koc
pl	equipment.blanket.description	
pl	equipment.torches	Pochodnie
pl	equipment.torches.description	
pl	equipment.lantern	Latarnia
pl	equipment.lantern.description	Z oliwą
pl	equipment.magnesium-strip	Pasek magnezowy
pl	equipment.magnesium-strip.description	
pl	equipment.firesteel	Krzesiwo
pl	equipment.firesteel.description	
pl	equipment.sharp-needle	Ostra igła
pl	equipment.sharp-needle.description	
pl	equipment.wooden-crucifix	Drewniany krucyfiks
pl	equipment.wooden-crucifix.description	
pl	equipment.silver-crucifix	Srebrny krucyfiks
pl	equipment.silver-crucifix.description	
pl	equipment.lockpicks	Metalowy pilnik i wytrychy
pl	equipment.lockpicks.description	
pl	equipment.manacles	Kajdany
pl	equipment.manacles.description	
pl	equipment.toolbox	Skrzynka z narzędziami
pl	equipment.toolbox.description	10 gwoździ, szczypce, młotek, mała piła i świder
pl	equipment.heavy-chain	Ciężki łańcuch
pl	equipment.heavy-chain.description	15 stóp
pl	equipment.scissors	Nożyczki
pl	equipment.scissors.description	
pl	equipment.grappling-hook	Kotwiczka
pl	equipment.grappling-hook.description	
pl	equipment.noose	Pętla
pl	equipment.noose.description	
pl	equipment.tent	Namiot
pl	equipment.tent.description	
pl	equipment.mirror	Lustro
pl	equipment.mirror.description	Warte 15s
pl	equipment.exquisite-perfume	Wykwintne perfumy
pl	equipment.exquisite-perfume.description	Warte 25s
pl	equipment.bear-trap	Potrzask na niedźwiedzie
pl	equipment.bear-trap.description	PT14 by zauważyć, d8 obrażeń
pl	equipment.lard	Smalec
pl	equipment.lard.description	W ostateczności może służyć jako 5 posiłków
pl	equipment.chewing-tobacco	Tytoń do żucia
pl	equipment.chewing-tobacco.description	
pl	equipment.chalk	Laska kredy
pl	equipment.chalk.description	
pl	equipment.salt	Butelka soli
pl	equipment.salt.description	
pl	equipment.medicine-chest	Apteczka
pl	equipment.medicine-chest.description	Tamuje krwawienie/infekcję i leczy d6 PŻ
pl	equipment.life-elixir	Eliksir życia
pl	equipment.life-elixir.description	Leczy d6 PŻ i usuwa infekcję
pl	equipment.red-poison	Butelka czerwonej trucizny
pl	equipment.red-poison.description	Wytrzymałość PT12 lub d10 obrażeń
pl	equipment.black-poison	Butelka czarnej trucizny
pl	equipment.black-poison.description	Wytrzymałość PT14 lub d6 obrażeń + oślepienie na godzinę
pl	equipment.bomb	Bomba
pl	equipment.bomb.description	Zapieczętowana butelka, d10 obrażeń
pl	scroll.unclean.1	Dłonie otwierają Południową Bramę
pl	scroll.unclean.1.description	Kula ognia uderza w d2 stworzenia, zadając d8 obrażeń każdemu
pl	scroll.unclean.2	Język Eris
pl	scroll.unclean.2.description	Wybrane stworzenie jest zdezorientowane przez 10 minut
pl	scroll.unclean.3	Te-le-ki-neza
pl	scroll.unclean.3.description	Przesuń obiekt do 1d10 stóp na d6 minut
pl	scroll.unclean.4	Lewitacja Lucy-Fires
pl	scroll.unclean.4.description	Unoszenie się przez Obecność + d10 rund
pl	scroll.unclean.5	Demon Naczyń Włosowatych
pl	scroll.unclean.5.description	Jedno stworzenie dusi się przez d6 rund, tracąc d4 PŻ na rundę
pl	scroll.unclean.6	Dziewięć Fioletowych Znaków Rozsupłuje Burzę
pl	scroll.unclean.6.description	Wytwarza d2 błyskawice zadające po d6 obrażeń
pl	scroll.unclean.7	Metzhuotl oślepia twe oko
pl	scroll.unclean.7.description	Stworzenie staje się niewidzialne na d6 rund
pl	scroll.unclean.8	Plugawy Psychopomp
pl	scroll.unclean.8.description	Przywołuje d4 szkielety lub zombie
pl	scroll.unclean.9	Powieka oślepia umysł
pl	scroll.unclean.9.description	d4 stworzenia zasypiają na godzinę
pl	scroll.unclean.10	Śmierć
pl	scroll.unclean.10.description	Wszystkie stworzenia w promieniu 30 stóp tracą łącznie 4d10 PŻ
pl	scroll.sacred.1	Łaska Martwego Świętego
pl	scroll.sacred.1.description	d2 stworzenia odzyskują po d10 PŻ
pl	scroll.sacred.2	Łaska dla Grzesznika
pl	scroll.sacred.2.description	Stworzenie otrzymuje +d6 do jednego rzutu
pl	scroll.sacred.3	Szepty przechodzą przez Bramę
pl	scroll.sacred.3.description	Zadaj trzy pytania zmarłemu stworzeniu
pl	scroll.sacred.4	Egida Smutku
pl	scroll.sacred.4.description	Stworzenie zyskuje 2d6 dodatkowych PŻ na 10 rund
pl	scroll.sacred.5	Niespełniony Los
pl	scroll.sacred.5.description	Obudź stworzenie martwe nie dłużej niż tydzień
pl	scroll.sacred.6	Mowa Bestii
pl	scroll.sacred.6.description	Rozmawiaj ze zwierzętami przez d20 minut
pl	scroll.sacred.7	Fałszywy Świt Rydwanu Nocy
pl	scroll.sacred.7.description	Światło lub egipska ciemność przez 3d10 minut
pl	scroll.sacred.8	Hermetyczny Krok
pl	scroll.sacred.8.description	Znajdź wszystkie pułapki na swojej drodze przez 2d10 minut
pl	scroll.sacred.9	Konsumujące Spojrzenie Roskoe
pl	scroll.sacred.9.description	d4 stworzenia tracą po d8 PŻ
pl	scroll.sacred.10	Składnia Enochiańska
pl	scroll.sacred.10.description	Jedno stworzenie ślepo wykonuje pojedynczy rozkaz
pl	equipment.ezumiel-vapor	Opary Ezumiela
pl	equipment.ezumiel-vapor.description	Zdaj test PT14 lub dozna silnych halucynacji przez d4 godziny
pl	equipment.southern-frog	Gulasz z żaby południowej
pl	equipment.southern-frog.description	Wymioty przez d4 godziny, test PT14 by móc robić cokolwiek innego
pl	equipment.elixir-vitalis	Eliksir Vitalis
pl	equipment.elixir-vitalis.description	Leczy d6 PŻ i powstrzymuje infekcję. Może uzależniać
pl	equipment.spider-owl-soup	Zupa z pająko-sowy
pl	equipment.spider-owl-soup.description	Widzenie w ciemności, wspinanie się po ścianach przez 30 minut
pl	equipment.fernors-philtre	Filtr Fernora
pl	equipment.fernors-philtre.description	Wpuść do oka. Leczy infekcję, +2 do obecności przez d4 godziny
pl	equipment.hyphos-snuff	Obezwładniająca tabaka Hyphosa
pl	equipment.hyphos-snuff.description	Szał! Dwa ataki na rundę, ale obrona z PT14. Jedna walka.
en	abilities.fanged_deserter.clumsy	Clumsy: All Agility tests (except defense) are DR+2. You cannot use scrolls.
en	abilities.fanged_deserter.bite	Teeth: DR10 to attack, d6 damage. You must be in close range.
en	abilities.fanged_deserter.mask	Monster Mask: NPCs must test Morale to stay near you.
en	abilities.fanged_deserter.scimitar	Brown Scimitar: d10 damage. If you roll a 1, it breaks.
en	abilities.fanged_deserter.teeth	Wizard Teeth: d6 teeth. Throw for d4 damage; they grow back after rest.
en	abilities.fanged_deserter.sling	Sigurd's Sling: 2d4 damage. Heavy stones only.
en	abilities.fanged_deserter.shoe	Death Horse Shoe: You always win initiative.
en	abilities.fanged_deserter.hound	Gore-Hound: A loyal pet with d6 HP and d4 bite.
en	abilities.gutterborn_scum.stealthy	Stealthy: All Presence and Agility DR are reduced by 2.
en	abilities.gutterborn_scum.jab	Kidney Jab: +d4 damage if you attack from stealth.
en	abilities.gutterborn_scum.jester	Poltroon the Jester: A pet that mocks your enemies (DR-2 to enemy morale).
en	abilities.gutterborn_scum.spatula	Graver's Spatula: Can be used to pry open locks and graves.
en	abilities.gutterborn_scum.muck	Muck-covered: Your smell is so bad that animals won't bite you first.
en	abilities.gutterborn_scum.poison	Poisoner: You can apply poison to your blade (d4 extra damage).
en	abilities.gutterborn_scum.nose	City Nose: You can smell gold or silver within 30 feet.
en	abilities.esoteric_hermit.scrolls	Scroll-Bound: You start with two random scrolls.
en	abilities.esoteric_hermit.book	Book of Fate: Once per day, reroll any one die.
en	abilities.esoteric_hermit.staff	Hermit's Staff: d4 damage. Can cast light once per day.
en	abilities.wretched_royalty.servant	Complacent Servant: Carries all your items and takes hits for you.
en	abilities.wretched_royalty.horse	Barbarister: A majestic horse that never flees.
en	abilities.heretical_priest.sinner	Sinner: You cannot be healed by holy magic.
en	abilities.heretical_priest.voice	Thunderous Voice: Presence DR12 to make an enemy flee.
en	abilities.occult_herbmaster.decoctions	Herbmaster: You can create d4 decoctions every morning.
en	abilities.occult_herbmaster.hyphos	Hyphos Snuff: DR-2 to all Toughness tests for 1 hour.
pl	habits.14	Piroman.
en	tales.1	Pursued for manslaughter. There is a bounty.
en	tales.2	In massive debt. The debt is being traded to successively more ruthless groups.
en	tales.3	You have a rare, sought after item.
en	tales.4	You have a cursed never-healing wound.
en	tales.5	Had an illegal, immoral and secret affair with a member of the royal family. You have proof.
en	tales.6	Escaped cult member. Terrified and paranoid. Other cultists are everywhere.
en	tales.7	An identity thief who recently killed and replaced this person.
en	tales.8	Banished and disowned for unspecified deeds. Can never go home.
en	tales.9	Deserted military after witnessing a massacre, bounty on head. Hunted by former friends.
en	tales.10	Very recently murdered a close relative. Very recently.
en	tales.11	A puzzle cube has been calibrated incorrectly (or has it?), awakening a slumbering abomination.
en	tales.12	Evil creatures love the scent of your spoor and are drawn to it, bringing disaster in your wake.
en	tales.13	A battle wound left a shard of metal slowly inching closer to your heart. Every day there is a 2% chance it reaches it.
en	tales.14	Violence forced you into the wilderness. You think waving trees are whispering. You talk to, scream at, attack trees.
en	tales.15	Cursed to share the nightmares of others, you sleep far, far away.
en	tales.16	At permanent war with all corvids. No contact without some violence. You carry a sling.
en	tales.17	After dreaming of an underground temple to a forgotten god you understand the songs of insects and worms.
en	tales.18	Being tracked and observed by a golem after an agreement which you know has been wiped from your mind.
en	tales.19	'Burn or be burned' is the fate you accept.
en	tales.20	Your flesh heals twice as fast, but your companions twice as slow. You see a many-eyed 'guardian angel'.
en	habits.1	Obsessively collects small sharp stones.
en	habits.2	Won't use a blade without testing it on your own flesh. Arms knitted with scars.
en	habits.3	Can't stop drinking once you start.
en	habits.4	Gambling addict. Must bet every day. If you lose, raise and bet again.
en	habits.5	Cannot tolerate criticism of any kind. Results in rage and weeping.
en	habits.6	Unable to get to the point. You have never actually finished a story.
en	habits.7	Best friend is a skull. Carry it with you, tell it everything, you trust no one more.
en	habits.8	You pick your nose so deep it bleeds.
en	habits.9	Laughs hysterically at your own jokes which you then explain in detail.
en	habits.10	A nihilist. You insist on telling everyone you are a nihilist and explaining why.
en	habits.11	Inveterate bug eater.
en	habits.12	Stress response is aesthetic display. The worse things get the fancier you need to be.
en	habits.13	Permanent phlegm deposit in throat. Continuously coughs, snorts, spits and swallows.
en	habits.14	Pyromaniac.
en	habits.15	Consistently loses important items and forgets vital facts.
en	habits.16	Insecure shit-stirrer. Will talk about whoever just left the room.
en	habits.17	You stutter when lying.
en	habits.18	You giggle insanely at the worst possible times.
en	habits.19	You whistle while trying to hide. You will deny this. Whistle when 5, 7, 9, 11, or 13 is rolled on a d20.
en	habits.20	You make jewelry from the teeth of the dead, if this can be considered a bad habit.
en	traits.1	endlessly aggravated
en	traits.2	inferiority complex ridden
en	traits.3	authority denying
en	traits.4	loud mouth
en	traits.5	cruel
en	traits.6	egocentric
en	traits.7	nihilistic
en	traits.8	prone to substance abuse
en	traits.9	conflicted
en	traits.10	shrewd
en	traits.11	vindictive
en	traits.12	cowardly
en	traits.13	lazy
en	traits.14	suspicious
en	traits.15	ruthless
en	traits.16	constantly worried
en	traits.17	very bitter
en	traits.18	deceitful
en	traits.19	wasteful
en	traits.20	arrogant
en	body.1	Has a staring manic gaze
en	body.2	Is covered in (for some) blasphemous tattoos
en	body.3	Has a rotting face (wears a mask)
en	body.4	Is missing 3 toes, is limping
en	body.5	Looks starved: gaunt and pale
en	body.6	One hand is replaced with a rusting hook
en	body.7	Has decaying teeth
en	body.8	Is hauntingly beautiful, unnervingly clean
en	body.9	Has hands caked with sores
en	body.10	Has cataract and its slowly but surely spreading to both eyes
en	body.11	Has long tangled hair, at least one cockroach is in residence
en	body.12	Has broken crushed ears
en	body.13	Is juddering and stuttering from nerve damage or stress
en	body.14	Is corpulent, ravenous, drooling
en	body.15	In one hand misses a thumb and index finger, grips like a lobster
en	body.16	Has a red, swollen alcoholic's nose
en	body.17	Has resting maniac face, making friends is hard
en	body.18	Has chronic athlete's foot
en	body.19	Was recently slashed and stinking eye is covered with a patch
en	body.20	Has cracked black nails, probably about to drop off
pl	tales.1	Ścigany za nieumyślne spowodowanie śmierci. Wyznaczono nagrodę.
pl	tales.2	W ogromnych długach. Dług jest sprzedawany coraz bardziej bezwzględnym grupom.
pl	tales.3	Posiadasz rzadki, pożądany przedmiot.
pl	tales.4	Masz przeklętą, nigdy nie gojącą się ranę.
pl	tales.5	Miałeś nielegalny, niemoralny i tajny romans z członkiem rodziny królewskiej. Masz dowód.
pl	tales.6	Zbiegły członek kultu. Przerażony i paranoiczny. Inni kultyści są wszędzie.
pl	tales.7	Złodziej tożsamości, który niedawno zabił i zastąpił tę osobę.
pl	tales.8	Wygnany i wydziedziczony za niesprecyzowane czyny. Nigdy nie możesz wrócić do domu.
pl	tales.9	Zdezerterował z wojska po byciu świadkiem masakry, nagroda za głowę. Ścigany przez dawnych przyjaciół.
pl	tales.10	Bardzo niedawno zamordował bliskiego krewnego. Bardzo niedawno.
pl	tales.11	Kostka zagadki została błędnie skalibrowana (czyżby?), budząc uśpioną abominację.
pl	tales.12	Złe stworzenia uwielbiają zapach twoich śladów i są do nich przyciągane, sprowadzając nieszczęście tam, gdzie się pojawisz.
pl	tales.13	Rana bitewna pozostawiła odłamek metalu powoli przesuwający się w stronę serca. Każdego dnia jest 2% szansy, że do niego dotrze.
pl	tales.14	Przemoc zmusiła cię do ucieczki w dzicz. Myślisz, że kołyszące się drzewa szepczą. Rozmawiasz z drzewami, krzyczysz na nie, atakujesz je.
pl	tales.15	Przeklęty, by dzielić koszmary innych, śpisz daleko, bardzo daleko.
pl	tales.16	Na stałe w stanie wojny ze wszystkimi krukowatymi. Żadnego kontaktu bez przemocy. Nosisz procę.
pl	tales.17	Po śnieniu o podziemnej świątyni zapomnianego boga, rozumiesz pieśni owadów i robaków.
pl	tales.18	Śledzony i obserwowany przez golema po umowie, która – jak wiesz – została wymazana z twojej pamięci.
pl	tales.19	'Płoń lub daj się spalić' to los, który akceptujesz.
pl	tales.20	Twoje ciało goi się dwa razy szybciej, ale twoich towarzyszy dwa razy wolniej. Widzisz wielookiego 'anioła stróża'.
pl	habits.1	Obsesyjnie zbiera małe ostre kamienie.
pl	habits.2	Nie użyje ostrza bez przetestowania go na własnym ciele. Ramiona pokryte bliznami.
pl	habits.3	Nie potrafi przestać pić, gdy już zacznie.
pl	habits.4	Hazardzista. Musi obstawiać każdego dnia. Jeśli przegra, podbija stawkę i obstawia ponownie.
pl	habits.5	Nie toleruje krytyki w żadnej formie. Skutkuje to wściekłością i płaczem.
pl	habits.6	Nie potrafi przejść do sedna. Nigdy tak naprawdę nie dokończył żadnej opowieści.
pl	habits.7	Najlepszym przyjacielem jest czaszka. Nosisz ją ze sobą, mówisz jej wszystko, nikomu nie ufasz bardziej.
pl	habits.8	Dłubie w nosie tak głęboko, że krwawi.
pl	habits.9	Śmieje się histerycznie z własnych żartów, które potem szczegółowo wyjaśnia.
pl	habits.10	Nihilista. Upiera się przy mówieniu każdemu, że jest nihilistą i wyjaśnianiu dlaczego.
pl	habits.11	Zatwardziały pożeracz robaków.
pl	habits.12	Reakcją na stres jest dbałość o estetykę. Im gorzej się dzieje, tym bardziej strojny musisz być.
pl	habits.13	Stała wydzielina w gardle. Ciągle kaszle, pociąga nosem, spluwa i przełyka.
pl	habits.15	Notorycznie gubi ważne przedmioty i zapomina o istotnych faktach.
pl	habits.16	Niepewny siebie mąciwoda. Będzie obgadywać każdego, kto właśnie wyszedł z pokoju.
pl	habits.17	Jąka się, gdy kłamie.
pl	habits.18	Chichocze obłąkańczo w najgorszych możliwych momentach.
pl	habits.19	Gwiżdże, próbując się ukryć. Będzie temu zaprzeczać. Gwiżdże, gdy na k20 wypadnie 5, 7, 9, 11 lub 13.
pl	habits.20	Robi biżuterię z zębów zmarłych, jeśli można to uznać za zły nawyk.
pl	traits.1	ciągle poirytowany
pl	traits.2	pełen kompleksów niższości
pl	traits.3	negujący autorytety
pl	traits.4	pyskacz
pl	traits.5	okrutny
pl	traits.6	egocentryczny
pl	traits.7	nihilistyczny
pl	traits.8	skłonny do używek
pl	traits.9	skonfliktowany
pl	traits.10	przebiegły
pl	traits.11	mściwy
pl	traits.12	tchórzliwy
pl	traits.13	leniwy
pl	traits.14	podejrzliwy
pl	traits.15	bezwzględny
pl	traits.16	ciągle zmartwiony
pl	traits.17	bardzo gorzki
pl	traits.18	podstępny
pl	traits.19	rozrzutny
pl	traits.20	arogancki
pl	body.1	Ma obłąkane, utkwione spojrzenie
pl	body.2	Pokryty (dla niektórych) bluźnierczymi tatuażami
pl	body.3	Ma gnijącą twarz (nosi maskę)
pl	body.4	Brakuje mu 3 palców u nóg, utyka
pl	body.5	Wygląda na zagłodzonego: wychudzony i blady
pl	body.6	Jedna ręka zastąpiona rdzewiejącym hakiem
pl	body.7	Ma zepsute zęby
pl	body.8	Niepokojąco piękny, nienaturalnie czysty
pl	body.9	Dłonie pokryte strupami
pl	body.10	Ma kataraktę, która powoli, ale nieuchronnie rozprzestrzenia się na oba oczy
pl	body.11	Długie splątane włosy, zamieszkane przez przynajmniej jednego karalucha
pl	body.12	Zmiażdżone małżowiny uszne
pl	body.13	Drży i jąka się z powodu uszkodzenia nerwów lub stresu
pl	body.14	Otyły, zachłanny, śliniący się
pl	body.15	W jednej dłoni brakuje kciuka i palca wskazującego, chwyta jak szczypcami homara
pl	body.16	Ma czerwony, opuchnięty nos alkoholika
pl	body.17	Ma twarz maniaka (resting maniac face), trudno mu nawiązywać przyjaźnie
pl	body.18	Ma przewlekłą grzybicę stóp
pl	body.19	Niedawno pocięty, cuchnące oko zakryte opaską
pl	body.20	Ma pęknięte czarne paznokcie, prawdopodobnie zaraz odpadną
en	classes.fanged_deserter.appendix	You have thirty or so friends who never let you down: YOUR TEETH. Fanged, infectious, and magnificent.
en	classes.gutterborn_scum.appendix	An ill star smiled upon your birth. Poverty, crime, and bad parenting didn’t help either. In your eyes, the world is a gutter.
en	classes.esoteric_hermit.appendix	The stone of your cave is one with the stars. Silence and perfection. You are a vessel for the bizarre.
en	classes.wretched_royalty.appendix	Bowed down only by the memories of your own lost glory, you could never submit to anyone else. You are noble, even in the mud.
en	classes.heretical_priest.appendix	Hunted by the Two-Headed Basilisks of the One True Faith, you can be found raving in ruins and cursing the sky.
en	origins.occult_herbmaster.7	From a little witches cottage in Galgenbeck.
en	origins.occult_herbmaster.8	From the ruins of the Shadow King's manse, thick of memories of mushrooms and smoke.
en	items.crumpled_monster_mask	Crumpled Monster Mask
en	items.brown_scimitar	The Brown Scimitar of Galgenbeck
en	items.wizard_teeth	Wizard Teeth
en	items.sigurds_sling	Old Sigûrd's Sling
en	items.death_horse_shoe	The Shoe of Death's Horse
en	pets.gore_hound	Ancient Gore-Hound
en	pets.poltroon	"Poltroon" the Court Jester
en	pets.barbarister	Barbarister the Incredible Horse
en	pets.hamfund	Hamfund the Squire
en	pets.hawk	Hawk
en	classes.occult_herbmaster.appendix	Born of the mushroom, raised in the glade, watched by the eye of the moon in a silver-black pool.
en	origins.fanged_deserter.1	Your earliest memories are of a burnt-black building in Sarkash. Your home?
en	origins.fanged_deserter.2	Your earliest memories are of a derelict rotting ship rolling endlessly across a grey sea.
en	origins.fanged_deserter.3	Your earliest memories are of a brothel in Schleswig. Quite a friendly environment.
en	origins.fanged_deserter.4	Your earliest memories are of sleeping with dogs in the corner of an inn, waiting for someone to return.
en	origins.fanged_deserter.5	Your earliest memories are of following an army in eastern Wästland.
en	origins.fanged_deserter.6	Your earliest memories are of suckling a wolf in the wilds of Bergen Chrypt.
en	origins.gutterborn_scum.1	As a child, you were dumped onto a moving shit-cart still in your birth caul.
en	origins.esoteric_hermit.1	You remember awakening, adult, in a ritual circle underneath the northern bridge to Grift.
en	origins.esoteric_hermit.2	You wandered, memoryless, from the mouth of a cavern at the cliffs of Terion.
en	origins.esoteric_hermit.3	You were the single child survivor of an incident in the Valley of the Unfortunate Undead.
en	origins.gutterborn_scum.2	As a child, your mother was hanged from a tree outside of Galgenbeck, you fell from the corpse.
en	origins.gutterborn_scum.3	As a child, you were raised by rats in the gutters of Grift.
en	origins.gutterborn_scum.4	As a child, you grew up kicked and beaten beneath a baker's table in Schleswig.
en	origins.gutterborn_scum.5	As a child, you escaped the Tvelandian orphanarium.
en	origins.gutterborn_scum.6	As a child, you were educated by outlaws in a hovel south of Allians.
\.


--
-- Data for Name: weapons; Type: TABLE DATA; Schema: public; Owner: morkborg
--

COPY public.weapons (id, key, tags, amount_min, amount_max, mod, dice, roll, value, exp, effect_die, effect, damage_modifier, modifiers, ammo_type, ammo_start) FROM stdin;
1	weapons.snake-skin-gift	{weapon,special,melee}	\N	\N	\N	{4}	\N	0	f	4	{"1": {"text": "The target dies immediately of deadly poison"}, "2": {"text": "No effect"}, "3": {"text": "No effect"}, "4": {"text": "No effect"}}	0	[]	\N	\N
2	weapons.blade-of-ancestors	{weapon,melee,special}	\N	\N	\N	{6}	\N	0	f	6	{"1": {"text": "The blade accidentally attacks a companion"}, "2": {"text": "No effect"}, "3": {"text": "No effect"}, "4": {"text": "No effect"}, "5": {"text": "No effect"}, "6": {"text": "No effect"}}	1	[{"value": 2, "source": "The Blade of your Ancestors", "exclude": ["defence", "test", "heal", "cast", "buff"], "statistic": "strength"}, {"value": 2, "source": "The Blade of your Ancestors", "exclude": ["melee", "ranged", "test", "heal", "cast", "ability", "buff"], "statistic": "agility"}]	\N	\N
3	weapons.brown-scimitar	{weapon,melee,special}	\N	\N	\N	{6}	\N	0	f	6	{"1": {"text": "Enemy struck with potent sepsis, dies in 10 mins"}, "2": {"text": "No effect"}, "3": {"text": "No effect"}, "4": {"text": "No effect"}, "5": {"text": "No effect"}, "6": {"text": "No effect"}}	0	[]	\N	\N
4	weapons.sigurd-sling	{weapon,ranged,special}	\N	\N	\N	{4,4}	\N	0	f	\N	\N	0	[]	Infinite	999
5	weapons.shoe-of-death	{weapon,ranged,special}	\N	\N	\N	{4}	\N	0	f	6	{"1": {"text": "Smashes skull, instant kill on small-medium creatures"}, "2": {"text": "No effect"}, "3": {"text": "No effect"}, "4": {"text": "No effect"}, "5": {"text": "No effect"}, "6": {"text": "No effect"}}	0	[]	\N	\N
6	weapons.femur	{weapon,melee}	\N	\N	\N	{4}	1	0	f	\N	\N	0	[]	\N	\N
7	weapons.staff	{weapon,melee}	\N	\N	\N	{4}	2	5	f	\N	\N	0	[]	\N	\N
8	weapons.shortsword	{weapon,melee}	\N	\N	\N	{4}	3	20	f	\N	\N	0	[]	\N	\N
9	weapons.knife	{weapon,melee}	\N	\N	\N	{4}	4	10	f	\N	\N	0	[]	\N	\N
10	weapons.warhammer	{weapon,melee}	\N	\N	\N	{6}	5	30	f	\N	\N	0	[]	\N	\N
11	weapons.sword	{weapon,melee}	\N	\N	\N	{6}	6	30	f	\N	\N	0	[]	\N	\N
12	weapons.bow	{weapon,ranged}	\N	\N	presence	{6}	7	25	f	\N	\N	0	[]	Arrow	10
13	weapons.flail	{weapon,melee}	\N	\N	\N	{8}	8	35	f	\N	\N	0	[]	\N	\N
14	weapons.crossbow	{weapon,ranged}	\N	\N	presence	{8}	9	40	f	\N	\N	0	[]	Bolt	10
15	weapons.zweihander	{weapon,melee}	\N	\N	\N	{10}	10	60	f	\N	\N	0	[]	\N	\N
16	weapons.whip	{weapon,melee}	\N	\N	\N	{2}	\N	5	f	\N	\N	0	[]	\N	\N
17	weapons.cudgel	{weapon,melee}	\N	\N	\N	{4}	\N	20	t	\N	\N	0	[]	\N	\N
18	weapons.sling	{weapon,ranged}	\N	\N	\N	{4}	\N	8	f	\N	\N	0	[]	Infinite	999
19	weapons.sickle	{weapon,melee}	\N	\N	\N	{4}	\N	15	t	\N	\N	0	[]	\N	\N
20	weapons.club	{weapon,melee}	\N	\N	\N	{6}	\N	10	f	\N	\N	0	[]	\N	\N
21	weapons.handaxe	{weapon,melee}	\N	\N	\N	{6}	\N	15	f	\N	\N	0	[]	\N	\N
22	weapons.mace	{weapon,melee}	\N	\N	\N	{6}	\N	25	f	\N	\N	0	[]	\N	\N
23	weapons.spear	{weapon,melee}	\N	\N	\N	{6}	\N	15	t	\N	\N	0	[]	\N	\N
24	weapons.battle-axe	{weapon,melee}	\N	\N	\N	{8}	\N	35	f	\N	\N	0	[]	\N	\N
25	weapons.goedendag	{weapon,melee}	\N	\N	\N	{8}	\N	30	t	\N	\N	0	[]	\N	\N
26	weapons.meat-cleaver	{tool,metal,weapon}	\N	\N	\N	{4}	\N	15	f	\N	\N	0	[]	\N	\N
27	weapons.crowbar	{tool,metal,weapon}	\N	\N	\N	{4}	\N	8	f	\N	\N	0	[]	\N	\N
28	weapons.hammer	{tool,metal,weapon}	\N	\N	\N	{4}	\N	8	f	\N	\N	0	[]	\N	\N
29	weapons.caltrops	{trap,metal}	\N	\N	\N	{4}	\N	7	f	\N	\N	0	[]	\N	\N
30	weapons.shield	{shield}	\N	\N	\N	{4}	\N	20	f	\N	\N	0	[]	\N	\N
\.


--
-- Name: abilities_id_seq; Type: SEQUENCE SET; Schema: public; Owner: morkborg
--

SELECT pg_catalog.setval('public.abilities_id_seq', 45, true);


--
-- Name: armors_id_seq; Type: SEQUENCE SET; Schema: public; Owner: morkborg
--

SELECT pg_catalog.setval('public.armors_id_seq', 7, true);


--
-- Name: body_descriptions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: morkborg
--

SELECT pg_catalog.setval('public.body_descriptions_id_seq', 20, true);


--
-- Name: classes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: morkborg
--

SELECT pg_catalog.setval('public.classes_id_seq', 6, true);


--
-- Name: equipment_id_seq; Type: SEQUENCE SET; Schema: public; Owner: morkborg
--

SELECT pg_catalog.setval('public.equipment_id_seq', 59, true);


--
-- Name: habits_id_seq; Type: SEQUENCE SET; Schema: public; Owner: morkborg
--

SELECT pg_catalog.setval('public.habits_id_seq', 20, true);


--
-- Name: names_id_seq; Type: SEQUENCE SET; Schema: public; Owner: morkborg
--

SELECT pg_catalog.setval('public.names_id_seq', 215, true);


--
-- Name: origins_id_seq; Type: SEQUENCE SET; Schema: public; Owner: morkborg
--

SELECT pg_catalog.setval('public.origins_id_seq', 96, true);


--
-- Name: pets_id_seq; Type: SEQUENCE SET; Schema: public; Owner: morkborg
--

SELECT pg_catalog.setval('public.pets_id_seq', 7, true);


--
-- Name: tales_id_seq; Type: SEQUENCE SET; Schema: public; Owner: morkborg
--

SELECT pg_catalog.setval('public.tales_id_seq', 20, true);


--
-- Name: traits_id_seq; Type: SEQUENCE SET; Schema: public; Owner: morkborg
--

SELECT pg_catalog.setval('public.traits_id_seq', 20, true);


--
-- Name: weapons_id_seq; Type: SEQUENCE SET; Schema: public; Owner: morkborg
--

SELECT pg_catalog.setval('public.weapons_id_seq', 30, true);


--
-- Name: abilities abilities_key_key; Type: CONSTRAINT; Schema: public; Owner: morkborg
--

ALTER TABLE ONLY public.abilities
    ADD CONSTRAINT abilities_key_key UNIQUE (key);


--
-- Name: abilities abilities_pkey; Type: CONSTRAINT; Schema: public; Owner: morkborg
--

ALTER TABLE ONLY public.abilities
    ADD CONSTRAINT abilities_pkey PRIMARY KEY (id);


--
-- Name: armors armors_key_key; Type: CONSTRAINT; Schema: public; Owner: morkborg
--

ALTER TABLE ONLY public.armors
    ADD CONSTRAINT armors_key_key UNIQUE (key);


--
-- Name: armors armors_pkey; Type: CONSTRAINT; Schema: public; Owner: morkborg
--

ALTER TABLE ONLY public.armors
    ADD CONSTRAINT armors_pkey PRIMARY KEY (id);


--
-- Name: body_descriptions body_descriptions_key_key; Type: CONSTRAINT; Schema: public; Owner: morkborg
--

ALTER TABLE ONLY public.body_descriptions
    ADD CONSTRAINT body_descriptions_key_key UNIQUE (key);


--
-- Name: body_descriptions body_descriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: morkborg
--

ALTER TABLE ONLY public.body_descriptions
    ADD CONSTRAINT body_descriptions_pkey PRIMARY KEY (id);


--
-- Name: characters characters_pkey; Type: CONSTRAINT; Schema: public; Owner: morkborg
--

ALTER TABLE ONLY public.characters
    ADD CONSTRAINT characters_pkey PRIMARY KEY (id);


--
-- Name: classes classes_name_key; Type: CONSTRAINT; Schema: public; Owner: morkborg
--

ALTER TABLE ONLY public.classes
    ADD CONSTRAINT classes_name_key UNIQUE (name);


--
-- Name: classes classes_pkey; Type: CONSTRAINT; Schema: public; Owner: morkborg
--

ALTER TABLE ONLY public.classes
    ADD CONSTRAINT classes_pkey PRIMARY KEY (id);


--
-- Name: equipment equipment_key_key; Type: CONSTRAINT; Schema: public; Owner: morkborg
--

ALTER TABLE ONLY public.equipment
    ADD CONSTRAINT equipment_key_key UNIQUE (key);


--
-- Name: equipment equipment_pkey; Type: CONSTRAINT; Schema: public; Owner: morkborg
--

ALTER TABLE ONLY public.equipment
    ADD CONSTRAINT equipment_pkey PRIMARY KEY (id);


--
-- Name: habits habits_key_key; Type: CONSTRAINT; Schema: public; Owner: morkborg
--

ALTER TABLE ONLY public.habits
    ADD CONSTRAINT habits_key_key UNIQUE (key);


--
-- Name: habits habits_pkey; Type: CONSTRAINT; Schema: public; Owner: morkborg
--

ALTER TABLE ONLY public.habits
    ADD CONSTRAINT habits_pkey PRIMARY KEY (id);


--
-- Name: names names_pkey; Type: CONSTRAINT; Schema: public; Owner: morkborg
--

ALTER TABLE ONLY public.names
    ADD CONSTRAINT names_pkey PRIMARY KEY (id);


--
-- Name: origins origins_pkey; Type: CONSTRAINT; Schema: public; Owner: morkborg
--

ALTER TABLE ONLY public.origins
    ADD CONSTRAINT origins_pkey PRIMARY KEY (id);


--
-- Name: pets pets_key_key; Type: CONSTRAINT; Schema: public; Owner: morkborg
--

ALTER TABLE ONLY public.pets
    ADD CONSTRAINT pets_key_key UNIQUE (key);


--
-- Name: pets pets_pkey; Type: CONSTRAINT; Schema: public; Owner: morkborg
--

ALTER TABLE ONLY public.pets
    ADD CONSTRAINT pets_pkey PRIMARY KEY (id);


--
-- Name: tales tales_key_key; Type: CONSTRAINT; Schema: public; Owner: morkborg
--

ALTER TABLE ONLY public.tales
    ADD CONSTRAINT tales_key_key UNIQUE (key);


--
-- Name: tales tales_pkey; Type: CONSTRAINT; Schema: public; Owner: morkborg
--

ALTER TABLE ONLY public.tales
    ADD CONSTRAINT tales_pkey PRIMARY KEY (id);


--
-- Name: traits traits_key_key; Type: CONSTRAINT; Schema: public; Owner: morkborg
--

ALTER TABLE ONLY public.traits
    ADD CONSTRAINT traits_key_key UNIQUE (key);


--
-- Name: traits traits_pkey; Type: CONSTRAINT; Schema: public; Owner: morkborg
--

ALTER TABLE ONLY public.traits
    ADD CONSTRAINT traits_pkey PRIMARY KEY (id);


--
-- Name: translations translations_pkey; Type: CONSTRAINT; Schema: public; Owner: morkborg
--

ALTER TABLE ONLY public.translations
    ADD CONSTRAINT translations_pkey PRIMARY KEY (locale, key);


--
-- Name: weapons weapons_key_key; Type: CONSTRAINT; Schema: public; Owner: morkborg
--

ALTER TABLE ONLY public.weapons
    ADD CONSTRAINT weapons_key_key UNIQUE (key);


--
-- Name: weapons weapons_pkey; Type: CONSTRAINT; Schema: public; Owner: morkborg
--

ALTER TABLE ONLY public.weapons
    ADD CONSTRAINT weapons_pkey PRIMARY KEY (id);


--
-- Name: idx_armors_roll; Type: INDEX; Schema: public; Owner: morkborg
--

CREATE INDEX idx_armors_roll ON public.armors USING btree (roll) WHERE (roll IS NOT NULL);


--
-- Name: idx_characters_class; Type: INDEX; Schema: public; Owner: morkborg
--

CREATE INDEX idx_characters_class ON public.characters USING btree (class_id);


--
-- Name: idx_characters_created; Type: INDEX; Schema: public; Owner: morkborg
--

CREATE INDEX idx_characters_created ON public.characters USING btree (created_at);


--
-- Name: idx_equipment_roll; Type: INDEX; Schema: public; Owner: morkborg
--

CREATE INDEX idx_equipment_roll ON public.equipment USING btree (roll) WHERE (roll IS NOT NULL);


--
-- Name: idx_equipment_tags; Type: INDEX; Schema: public; Owner: morkborg
--

CREATE INDEX idx_equipment_tags ON public.equipment USING gin (tags);


--
-- Name: idx_habits_roll; Type: INDEX; Schema: public; Owner: morkborg
--

CREATE INDEX idx_habits_roll ON public.habits USING btree (roll) WHERE (roll IS NOT NULL);


--
-- Name: idx_origins_class_roll; Type: INDEX; Schema: public; Owner: morkborg
--

CREATE INDEX idx_origins_class_roll ON public.origins USING btree (class_id, roll);


--
-- Name: idx_tales_roll; Type: INDEX; Schema: public; Owner: morkborg
--

CREATE INDEX idx_tales_roll ON public.tales USING btree (roll) WHERE (roll IS NOT NULL);


--
-- Name: idx_translations_key; Type: INDEX; Schema: public; Owner: morkborg
--

CREATE INDEX idx_translations_key ON public.translations USING btree (key);


--
-- Name: idx_weapons_roll; Type: INDEX; Schema: public; Owner: morkborg
--

CREATE INDEX idx_weapons_roll ON public.weapons USING btree (roll) WHERE (roll IS NOT NULL);


--
-- Name: abilities abilities_class_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: morkborg
--

ALTER TABLE ONLY public.abilities
    ADD CONSTRAINT abilities_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(id);


--
-- Name: characters characters_class_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: morkborg
--

ALTER TABLE ONLY public.characters
    ADD CONSTRAINT characters_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(id);


--
-- Name: origins origins_class_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: morkborg
--

ALTER TABLE ONLY public.origins
    ADD CONSTRAINT origins_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(id);


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: morkborg
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


--
-- PostgreSQL database dump complete
--

