-- Get full character data with translations and resolved items
-- Source: migration 013 (latest) - resolves tags/dice from stored JSONB + master tables
--
-- NOTE: Production had a stale overload (uuid, varchar) that was never dropped.
-- This file defines only the canonical (uuid, text) signature.
-- The cleanup migration handles dropping the stale overload on prod.

-- Drop ALL overloads to ensure clean state
DROP FUNCTION IF EXISTS get_character_full(uuid, text);
DROP FUNCTION IF EXISTS get_character_full(uuid, character varying);

CREATE OR REPLACE FUNCTION get_character_full(p_id uuid, p_locale text DEFAULT 'en')
RETURNS TABLE (
    id uuid,
    name text,
    class_id int,
    class_name text,
    class_description text,
    origin text,
    strength int,
    agility int,
    presence int,
    toughness int,
    max_hp int,
    current_hp int,
    omens int,
    max_omens int,
    silver int,
    habit text,
    tale text,
    body_description text,
    trait1 text,
    trait2 text,
    notes text,
    abilities jsonb,
    equipment jsonb,
    storage jsonb,
    equipped_weapons jsonb,
    equipped_armor jsonb,
    created_at timestamptz,
    updated_at timestamptz
) AS $$
DECLARE
    result RECORD;
    resolved_equipment jsonb;
    resolved_storage jsonb;
    resolved_weapons jsonb;
    resolved_armor jsonb;
    resolved_abilities jsonb;
BEGIN
    -- 1. Fetch base character data with translations
    SELECT
        c.*,
        COALESCE(t_class_name.value, cl.name) as class_name_trans,
        COALESCE(t_class_desc.value, cl.appendix) as class_description_trans,
        COALESCE(t_origin.value, c.origin) as origin_trans,
        COALESCE(t_habit.value, c.habit) as habit_trans,
        COALESCE(t_tale.value, c.tale) as tale_trans,
        COALESCE(t_body.value, c.body_description) as body_trans,
        COALESCE(t_trait1.value, c.trait1) as trait1_trans,
        COALESCE(t_trait2.value, c.trait2) as trait2_trans
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

    IF result IS NULL THEN RETURN; END IF;

    -- 2. Equipment - reads from stored JSONB first, falls back to master tables
    SELECT jsonb_agg(
        jsonb_build_object(
            'key', eq->>'key',
            'name', COALESCE(t.value, eq->>'name', eq->>'key'),
            'description', COALESCE(td.value, eq->>'description', ''),
            'tags',
            (
                SELECT COALESCE(jsonb_agg(DISTINCT tag_val), '[]'::jsonb)
                FROM (
                    SELECT jsonb_array_elements_text(eq->'tags') AS tag_val
                        WHERE eq ? 'tags' AND jsonb_typeof(eq->'tags') = 'array'
                    UNION ALL
                    SELECT jsonb_array_elements_text(to_jsonb(w.tags)) AS tag_val WHERE w.tags IS NOT NULL
                    UNION ALL
                    SELECT jsonb_array_elements_text(to_jsonb(a.tags)) AS tag_val WHERE a.tags IS NOT NULL
                    UNION ALL
                    SELECT jsonb_array_elements_text(to_jsonb(e_m.tags)) AS tag_val WHERE e_m.tags IS NOT NULL
                ) tags_sub
            ),
            'dice',
            (
                SELECT COALESCE(jsonb_agg(DISTINCT dice_val), '[]'::jsonb)
                FROM (
                    SELECT jsonb_array_elements_text(eq->'dice') AS dice_val
                        WHERE eq ? 'dice' AND jsonb_typeof(eq->'dice') = 'array'
                    UNION ALL
                    SELECT jsonb_array_elements_text(to_jsonb(w.dice)) AS dice_val WHERE w.dice IS NOT NULL
                    UNION ALL
                    SELECT jsonb_array_elements_text(to_jsonb(a.dice)) AS dice_val WHERE a.dice IS NOT NULL
                ) dice_sub
            ),
            'uses', COALESCE(eq->'uses', '[]'::jsonb)
        )
    )
    INTO resolved_equipment
    FROM jsonb_array_elements(result.equipment) eq
        LEFT JOIN weapons w ON w.key = eq->>'key'
        LEFT JOIN armors a ON a.key = eq->>'key'
        LEFT JOIN equipment e_m ON e_m.key = eq->>'key'
        LEFT JOIN translations t ON t.key = eq->>'key' AND t.locale = p_locale
        LEFT JOIN translations td ON td.key = (eq->>'key') || '.description' AND td.locale = p_locale;

    -- 3. Storage - same logic as equipment
    SELECT jsonb_agg(
        jsonb_build_object(
            'key', st->>'key',
            'name', COALESCE(t.value, st->>'name', st->>'key'),
            'description', COALESCE(td.value, st->>'description', ''),
            'tags',
            (
                SELECT COALESCE(jsonb_agg(DISTINCT tag_val), '[]'::jsonb)
                FROM (
                    SELECT jsonb_array_elements_text(st->'tags') AS tag_val
                        WHERE st ? 'tags' AND jsonb_typeof(st->'tags') = 'array'
                    UNION ALL
                    SELECT jsonb_array_elements_text(to_jsonb(w.tags)) AS tag_val WHERE w.tags IS NOT NULL
                    UNION ALL
                    SELECT jsonb_array_elements_text(to_jsonb(a.tags)) AS tag_val WHERE a.tags IS NOT NULL
                    UNION ALL
                    SELECT jsonb_array_elements_text(to_jsonb(e_m.tags)) AS tag_val WHERE e_m.tags IS NOT NULL
                ) tags_sub
            ),
            'dice',
            (
                SELECT COALESCE(jsonb_agg(DISTINCT dice_val), '[]'::jsonb)
                FROM (
                    SELECT jsonb_array_elements_text(st->'dice') AS dice_val
                        WHERE st ? 'dice' AND jsonb_typeof(st->'dice') = 'array'
                    UNION ALL
                    SELECT jsonb_array_elements_text(to_jsonb(w.dice)) AS dice_val WHERE w.dice IS NOT NULL
                    UNION ALL
                    SELECT jsonb_array_elements_text(to_jsonb(a.dice)) AS dice_val WHERE a.dice IS NOT NULL
                ) dice_sub
            ),
            'uses', COALESCE(st->'uses', '[]'::jsonb)
        )
    )
    INTO resolved_storage
    FROM jsonb_array_elements(result.storage) st
        LEFT JOIN weapons w ON w.key = st->>'key'
        LEFT JOIN armors a ON a.key = st->>'key'
        LEFT JOIN equipment e_m ON e_m.key = st->>'key'
        LEFT JOIN translations t ON t.key = st->>'key' AND t.locale = p_locale
        LEFT JOIN translations td ON td.key = (st->>'key') || '.description' AND td.locale = p_locale;

    -- 4. Equipped Weapons
    SELECT jsonb_agg(
        jsonb_build_object(
            'key', ew->>'key',
            'name', COALESCE(t.value, ew->>'key'),
            'description', COALESCE(td.value, ''),
            'dice', COALESCE(to_jsonb(w.dice), '[]'::jsonb),
            'tags', COALESCE(to_jsonb(w.tags), '[]'::jsonb)
        )
    )
    INTO resolved_weapons
    FROM jsonb_array_elements(result.equipped_weapons) ew
        LEFT JOIN weapons w ON w.key = ew->>'key'
        LEFT JOIN translations t ON t.key = ew->>'key' AND t.locale = p_locale
        LEFT JOIN translations td ON td.key = (ew->>'key') || '.description' AND td.locale = p_locale;

    -- 5. Equipped Armor
    IF result.equipped_armor IS NOT NULL THEN
        SELECT jsonb_build_object(
            'key', result.equipped_armor->>'key',
            'name', COALESCE(t.value, result.equipped_armor->>'key'),
            'description', COALESCE(td.value, ''),
            'dice', COALESCE(to_jsonb(a.dice), '[]'::jsonb),
            'max_tier', a.max_tier,
            'tags', COALESCE(to_jsonb(a.tags), '[]'::jsonb)
        )
        INTO resolved_armor
        FROM armors a
            LEFT JOIN translations t ON t.key = result.equipped_armor->>'key' AND t.locale = p_locale
            LEFT JOIN translations td ON td.key = (result.equipped_armor->>'key') || '.description' AND td.locale = p_locale
        WHERE a.key = result.equipped_armor->>'key';
    END IF;

    -- 6. Abilities
    SELECT jsonb_agg(
        CASE WHEN ab->>'key' IS NOT NULL THEN
            jsonb_build_object(
                'key', ab->>'key',
                'name', COALESCE(t.value, ab->>'key'),
                'description', COALESCE(td.value, '')
            )
        ELSE ab END
    )
    INTO resolved_abilities
    FROM jsonb_array_elements(result.abilities) ab
        LEFT JOIN translations t ON t.key = ab->>'key' AND t.locale = p_locale
        LEFT JOIN translations td ON td.key = (ab->>'key') || '.description' AND td.locale = p_locale;

    -- Final return
    RETURN QUERY SELECT
        result.id,
        result.name::text,
        result.class_id,
        result.class_name_trans::text,
        result.class_description_trans::text,
        result.origin_trans::text,
        result.strength,
        result.agility,
        result.presence,
        result.toughness,
        result.max_hp,
        result.current_hp,
        result.omens,
        result.max_omens,
        result.silver,
        result.habit_trans::text,
        result.tale_trans::text,
        result.body_trans::text,
        result.trait1_trans::text,
        result.trait2_trans::text,
        COALESCE(result.notes, '')::text,
        COALESCE(resolved_abilities, '[]'::jsonb),
        COALESCE(resolved_equipment, '[]'::jsonb),
        COALESCE(resolved_storage, '[]'::jsonb),
        COALESCE(resolved_weapons, '[]'::jsonb),
        resolved_armor,
        result.created_at::timestamptz,
        result.updated_at::timestamptz;
END;
$$ LANGUAGE plpgsql;
