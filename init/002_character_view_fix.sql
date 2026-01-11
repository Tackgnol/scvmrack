-- Migration: Expand get_character_full to resolve equipment/weapons/armor translations

DROP FUNCTION IF EXISTS public.get_character_full(uuid, character varying);

CREATE OR REPLACE FUNCTION public.get_character_full(p_id uuid, p_locale character varying DEFAULT 'en'::character varying)
RETURNS TABLE(
    id uuid,
    name character varying,
    class_id integer,
    class_name character varying,
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
    abilities jsonb,
    equipment jsonb,
    equipped_weapons jsonb,
    equipped_armor jsonb,
    created_at timestamp without time zone,
    updated_at timestamp without time zone
)
LANGUAGE plpgsql STABLE AS $$
DECLARE
result RECORD;
    resolved_equipment jsonb;
    resolved_weapons jsonb;
    resolved_armor jsonb;
BEGIN
    -- Get base character data with resolved text fields
SELECT
    c.id, c.name, c.class_id,
    cl.name as class_name,
    cl.appendix as class_description,
    COALESCE(t_origin.value, c.origin) as origin,
    c.strength, c.agility, c.presence, c.toughness,
    c.max_hp, c.current_hp, c.omens, c.max_omens, c.silver,
    COALESCE(t_habit.value, c.habit) as habit,
    COALESCE(t_tale.value, c.tale) as tale,
    COALESCE(t_body.value, c.body_description) as body_description,
    COALESCE(t_trait1.value, c.trait1) as trait1,
    COALESCE(t_trait2.value, c.trait2) as trait2,
    c.abilities, c.equipment, c.equipped_weapons, c.equipped_armor,
    c.created_at, c.updated_at
INTO result
FROM characters c
         LEFT JOIN classes cl ON c.class_id = cl.id
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
        result.abilities,
        COALESCE(resolved_equipment, '[]'::jsonb),
        COALESCE(resolved_weapons, '[]'::jsonb),
        resolved_armor,
        result.created_at,
        result.updated_at;
END;
$$;
