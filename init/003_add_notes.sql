-- Migration: Add notes field to characters

-- 1. Add the column
ALTER TABLE characters
    ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT '';

-- 2. Update get_character_full to include notes
DROP FUNCTION IF EXISTS get_character_full(uuid, text);
DROP FUNCTION IF EXISTS get_character_full(uuid, character varying);

CREATE OR REPLACE FUNCTION get_character_full(p_id uuid, p_locale character varying DEFAULT 'en'::character varying)
RETURNS TABLE(
    id uuid,
    name character varying,
    class_id integer,
    class_name text,
    class_description text,
    origin text,
    strength integer,
    agility integer,
    presence integer,
    toughness integer,
    max_hp integer,
    current_hp integer,
    omens integer,
    max_omens integer,
    silver integer,
    habit text,
    tale text,
    body_description text,
    trait1 text,
    trait2 text,
    notes text,  -- ADDED
    abilities jsonb,
    equipment jsonb,
    storage jsonb,
    equipped_weapons jsonb,
    equipped_armor jsonb,
    created_at timestamp without time zone,
    updated_at timestamp without time zone
)
LANGUAGE plpgsql STABLE
AS $$
DECLARE
result RECORD;
    resolved_equipment jsonb;
    resolved_storage jsonb;
    resolved_weapons jsonb;
    resolved_armor jsonb;
    resolved_abilities jsonb;
BEGIN
    -- Get base character data with resolved text fields
SELECT
    c.id, c.name, c.class_id,
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
    COALESCE(c.notes, '') as notes,  -- ADDED
    c.abilities, c.equipment,
    COALESCE(c.storage, '[]'::jsonb) as storage,
    c.equipped_weapons, c.equipped_armor,
    c.created_at, c.updated_at
INTO result
FROM characters c
         LEFT JOIN classes cl ON c.class_id = cl.id
         LEFT JOIN translations t_class_name ON t_class_name.key = cl.name_key AND t_class_name.locale = p_locale
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

    -- Resolve equipment (PRESERVES 'uses' field when present)
SELECT jsonb_agg(
               jsonb_build_object(
                       'key', eq->>'key',
                       'name', COALESCE(t.value, eq->>'name', eq->>'key'),
                       'description', COALESCE(td.value, eq->>'description', '')
               ) ||
               CASE WHEN eq ? 'uses' THEN jsonb_build_object('uses', eq->'uses') ELSE '{}'::jsonb END
       )
INTO resolved_equipment
FROM jsonb_array_elements(result.equipment) eq
         LEFT JOIN translations t ON t.key = eq->>'key' AND t.locale = p_locale
    LEFT JOIN translations td ON td.key = (eq->>'key') || '.description' AND td.locale = p_locale;

-- Resolve storage (PRESERVES 'uses' field when present)
SELECT jsonb_agg(
               jsonb_build_object(
                       'key', st->>'key',
                       'name', COALESCE(t.value, st->>'name', st->>'key'),
                       'description', COALESCE(td.value, st->>'description', '')
               ) ||
               CASE WHEN st ? 'uses' THEN jsonb_build_object('uses', st->'uses') ELSE '{}'::jsonb END
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

    -- Resolve abilities
SELECT jsonb_agg(
               CASE
                   WHEN ab->>'key' IS NOT NULL THEN
                   jsonb_build_object(
                   'key', ab->>'key',
                   'name', COALESCE(t.value, ab->>'key'),
                   'description', COALESCE(td.value, '')
                   )
                   ELSE
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
        result.notes,  -- ADDED
        COALESCE(resolved_abilities, '[]'::jsonb),
        COALESCE(resolved_equipment, '[]'::jsonb),
        COALESCE(resolved_storage, '[]'::jsonb),
        COALESCE(resolved_weapons, '[]'::jsonb),
        resolved_armor,
        result.created_at,
        result.updated_at;
END;
$$;
