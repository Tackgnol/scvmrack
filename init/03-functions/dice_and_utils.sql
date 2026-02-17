-- Dice rolling and utility functions

CREATE OR REPLACE FUNCTION roll_die(sides INTEGER) RETURNS INTEGER
    LANGUAGE plpgsql AS $$
BEGIN
    RETURN floor(random() * sides + 1)::INTEGER;
END;
$$;

CREATE OR REPLACE FUNCTION roll_dice(num_dice INTEGER, sides INTEGER) RETURNS INTEGER
    LANGUAGE plpgsql AS $$
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

CREATE OR REPLACE FUNCTION roll_to_modifier(roll INTEGER) RETURNS INTEGER
    LANGUAGE plpgsql AS $$
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

CREATE OR REPLACE FUNCTION roll_stat() RETURNS INTEGER
    LANGUAGE plpgsql AS $$
BEGIN
    RETURN roll_to_modifier(roll_dice(3, 6));
END;
$$;

CREATE OR REPLACE FUNCTION roll_amount(min_val INTEGER, max_val INTEGER, mod_stat INTEGER DEFAULT 0) RETURNS INTEGER
    LANGUAGE plpgsql AS $$
BEGIN
    IF min_val IS NULL OR max_val IS NULL THEN
        RETURN 1;
    END IF;
    RETURN GREATEST(0, floor(random() * (max_val - min_val + 1) + min_val)::INTEGER + mod_stat);
END;
$$;

CREATE OR REPLACE FUNCTION random_row_id(table_name TEXT) RETURNS INTEGER
    LANGUAGE plpgsql AS $$
DECLARE
    result_id INTEGER;
BEGIN
    EXECUTE format('SELECT id FROM %I ORDER BY random() LIMIT 1', table_name) INTO result_id;
    RETURN result_id;
END;
$$;

-- Simple translation helper
CREATE OR REPLACE FUNCTION t(translation_key TEXT) RETURNS TEXT
    LANGUAGE plpgsql AS $$
DECLARE
    result TEXT;
BEGIN
    SELECT value INTO result FROM translations WHERE key = translation_key;
    RETURN COALESCE(result, translation_key);
END;
$$;

-- Item lookup by roll
CREATE OR REPLACE FUNCTION get_weapon_by_roll(roll_num INTEGER) RETURNS RECORD
    LANGUAGE plpgsql AS $$
DECLARE
    result RECORD;
BEGIN
    SELECT * INTO result FROM weapons WHERE roll = roll_num LIMIT 1;
    IF NOT FOUND THEN
        SELECT * INTO result FROM weapons ORDER BY id LIMIT 1 OFFSET (roll_num - 1);
    END IF;
    RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION get_armor_by_roll(roll_num INTEGER) RETURNS RECORD
    LANGUAGE plpgsql AS $$
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

CREATE OR REPLACE FUNCTION get_scroll_by_roll(roll_num INTEGER, scroll_type TEXT) RETURNS RECORD
    LANGUAGE plpgsql AS $$
DECLARE
    result RECORD;
BEGIN
    SELECT * INTO result FROM equipment
    WHERE roll = roll_num AND scroll_type = ANY(tags)
    LIMIT 1;
    RETURN result;
END;
$$;

-- Item full data lookup (used by item_search view queries)
CREATE OR REPLACE FUNCTION get_item_full(p_item_type TEXT, p_id INTEGER) RETURNS JSONB
    LANGUAGE plpgsql AS $$
BEGIN
    IF p_item_type = 'weapon' THEN
        RETURN to_jsonb(w) FROM weapons w WHERE w.id = p_id;
    ELSIF p_item_type = 'armor' THEN
        RETURN to_jsonb(a) FROM armors a WHERE a.id = p_id;
    ELSIF p_item_type = 'equipment' THEN
        RETURN to_jsonb(e) FROM equipment e WHERE e.id = p_id;
    ELSIF p_item_type = 'pet' THEN
        RETURN to_jsonb(p) FROM pets p WHERE p.id = p_id;
    ELSE
        RAISE EXCEPTION 'Unknown item_type: %', p_item_type;
    END IF;
END;
$$;
