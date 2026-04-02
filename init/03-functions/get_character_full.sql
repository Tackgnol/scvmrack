-- Get full character data with translations and resolved items
-- Source: migration 013 + current_tier support for armor degradation
--
-- NOTE: Production had a stale overload (uuid, varchar) that was never dropped.
-- This file defines only the canonical (uuid, text) signature.
-- The cleanup migration handles dropping the stale overload on prod.

-- Shared resolver for equipment/storage item arrays.
CREATE OR REPLACE FUNCTION resolve_character_inventory_items(
    p_items jsonb,
    p_locale text,
    p_scroll_default_uses boolean DEFAULT false
) RETURNS jsonb
    LANGUAGE sql AS $$
    SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
            'key', item->>'key',
            'name', COALESCE(t.value, item->>'name', item->>'key'),
            'description', COALESCE(td.value, item->>'description', ''),
            'tags', (
                SELECT COALESCE(jsonb_agg(DISTINCT tag_val), '[]'::jsonb)
                FROM (
                    SELECT jsonb_array_elements_text(item->'tags') AS tag_val
                    WHERE item ? 'tags' AND jsonb_typeof(item->'tags') = 'array'
                    UNION ALL
                    SELECT jsonb_array_elements_text(to_jsonb(w.tags)) AS tag_val WHERE w.tags IS NOT NULL
                    UNION ALL
                    SELECT jsonb_array_elements_text(to_jsonb(a.tags)) AS tag_val WHERE a.tags IS NOT NULL
                    UNION ALL
                    SELECT jsonb_array_elements_text(to_jsonb(e_m.tags)) AS tag_val WHERE e_m.tags IS NOT NULL
                    UNION ALL
                    SELECT jsonb_array_elements_text(to_jsonb(p.tags)) AS tag_val WHERE p.tags IS NOT NULL
                ) tags_sub
            ),
            'dice', (
                SELECT COALESCE(jsonb_agg(DISTINCT dice_val), '[]'::jsonb)
                FROM (
                    SELECT jsonb_array_elements_text(item->'dice') AS dice_val
                    WHERE item ? 'dice' AND jsonb_typeof(item->'dice') = 'array'
                    UNION ALL
                    SELECT jsonb_array_elements_text(to_jsonb(w.dice)) AS dice_val WHERE w.dice IS NOT NULL
                    UNION ALL
                    SELECT jsonb_array_elements_text(to_jsonb(a.dice)) AS dice_val WHERE a.dice IS NOT NULL
                    UNION ALL
                    SELECT jsonb_array_elements_text(to_jsonb(p.action_die)) AS dice_val WHERE p.action_die IS NOT NULL
                ) dice_sub
            ),
            'uses', CASE
                WHEN item->'uses' IS NOT NULL
                    AND jsonb_typeof(item->'uses') = 'array'
                    AND jsonb_array_length(item->'uses') > 0 THEN item->'uses'
                WHEN p.hp IS NOT NULL AND p.hp > 0 THEN to_jsonb(array_fill(true, ARRAY[LEAST(p.hp, 50)]))
                WHEN p_scroll_default_uses AND item->>'key' LIKE 'scroll.%' THEN '[false,false,false,false]'::jsonb
                ELSE COALESCE(item->'uses', '[]'::jsonb)
            END,
            'ammo_type', COALESCE(w.ammo_type, e_m.ammo_type),
            'amount', CASE
                WHEN COALESCE(w.ammo_type, e_m.ammo_type) IS NOT NULL
                THEN COALESCE((item->>'amount')::int, COALESCE(e_m.default_amount, w.default_amount))
                ELSE NULL
            END
        ) || CASE
            WHEN a.key IS NOT NULL THEN jsonb_build_object(
                'max_tier', a.max_tier,
                'current_tier', COALESCE((item->>'current_tier')::int, a.max_tier)
            )
            ELSE '{}'::jsonb
        END
    ), '[]'::jsonb)
    FROM jsonb_array_elements(COALESCE(p_items, '[]'::jsonb)) item
    LEFT JOIN weapons w ON w.key = item->>'key'
    LEFT JOIN armors a ON a.key = item->>'key'
    LEFT JOIN equipment e_m ON e_m.key = item->>'key'
    LEFT JOIN pets p ON p.key = item->>'key'
    LEFT JOIN translations t ON t.key = item->>'key' AND t.locale = p_locale
    LEFT JOIN translations td ON td.key = (item->>'key') || '.description' AND td.locale = p_locale;
$$;

CREATE OR REPLACE FUNCTION resolve_character_equipped_weapons(
    p_items jsonb,
    p_locale text
) RETURNS jsonb
    LANGUAGE sql AS $$
    SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
            'key', ew->>'key',
            'name', COALESCE(t.value, ew->>'key'),
            'description', COALESCE(td.value, ''),
            'dice', COALESCE(to_jsonb(w.dice), '[]'::jsonb),
            'tags', COALESCE(to_jsonb(w.tags), '[]'::jsonb),
            'ammo_type', w.ammo_type
        )
    ), '[]'::jsonb)
    FROM jsonb_array_elements(COALESCE(p_items, '[]'::jsonb)) ew
    LEFT JOIN weapons w ON w.key = ew->>'key'
    LEFT JOIN translations t ON t.key = ew->>'key' AND t.locale = p_locale
    LEFT JOIN translations td ON td.key = (ew->>'key') || '.description' AND td.locale = p_locale;
$$;

CREATE OR REPLACE FUNCTION resolve_character_equipped_armor(
    p_item jsonb,
    p_locale text
) RETURNS jsonb
    LANGUAGE sql AS $$
    SELECT CASE
        WHEN p_item IS NULL THEN NULL
        ELSE (
            SELECT jsonb_build_object(
                'key', p_item->>'key',
                'name', COALESCE(t.value, p_item->>'key'),
                'description', COALESCE(td.value, ''),
                'dice', COALESCE(to_jsonb(a.dice), '[]'::jsonb),
                'max_tier', a.max_tier,
                'current_tier', COALESCE((p_item->>'current_tier')::int, a.max_tier),
                'tags', COALESCE(to_jsonb(a.tags), '[]'::jsonb)
            )
            FROM armors a
            LEFT JOIN translations t ON t.key = p_item->>'key' AND t.locale = p_locale
            LEFT JOIN translations td ON td.key = (p_item->>'key') || '.description' AND td.locale = p_locale
            WHERE a.key = p_item->>'key'
        )
    END;
$$;

CREATE OR REPLACE FUNCTION resolve_character_abilities(
    p_abilities jsonb,
    p_locale text
) RETURNS jsonb
    LANGUAGE sql AS $$
    SELECT COALESCE(jsonb_agg(
        CASE
            WHEN ab->>'key' IS NOT NULL THEN jsonb_build_object(
                'key', ab->>'key',
                'name', COALESCE(t.value, ab->>'key'),
                'description', COALESCE(td.value, '')
            ) || CASE
                WHEN ab ? 'comment' THEN jsonb_build_object('comment', ab->>'comment')
                ELSE '{}'::jsonb
            END
            ELSE ab
        END
    ), '[]'::jsonb)
    FROM jsonb_array_elements(COALESCE(p_abilities, '[]'::jsonb)) ab
    LEFT JOIN translations t ON t.key = ab->>'key' AND t.locale = p_locale
    LEFT JOIN translations td ON td.key = (ab->>'key') || '.description' AND td.locale = p_locale;
$$;

DROP FUNCTION IF EXISTS resolve_character_computed_modifiers(jsonb, jsonb, jsonb, text);
DROP FUNCTION IF EXISTS resolve_character_computed_modifiers(jsonb, jsonb, jsonb, int, text);
DROP FUNCTION IF EXISTS resolve_character_computed_modifiers(jsonb, jsonb, jsonb, int, int, jsonb, text);

CREATE OR REPLACE FUNCTION resolve_character_computed_modifiers(
    p_equipped_armor jsonb,
    p_equipped_weapons jsonb,
    p_equipment jsonb,
    p_strength int,
    p_class_id int,
    p_abilities jsonb,
    p_locale text
) RETURNS jsonb
    LANGUAGE plpgsql AS $$
DECLARE
    v_result jsonb := '[]'::jsonb;
    v_strength_modifier int;
    v_max_encumbrance int;
    v_encumbrance int;
    v_encumbrance_label text;
    v_over_capacity_source text;
    v_double_capacity_source text;
BEGIN
    v_strength_modifier := roll_to_modifier(p_strength);
    v_max_encumbrance := GREATEST(0, 8 + v_strength_modifier);
    v_encumbrance := COALESCE(jsonb_array_length(COALESCE(p_equipment, '[]'::jsonb)), 0);

    IF p_locale = 'pl' THEN
        v_encumbrance_label := 'Obciążenie';
        v_over_capacity_source := 'Przeciążenie: -2 do wszystkich testów Zręczności';
        v_double_capacity_source := 'Nie da się nieść więcej niż dwa razy tyle, ile wynosi twój udźwig';
    ELSE
        v_encumbrance_label := 'Encumbrance';
        v_over_capacity_source := 'Over capacity: -2 Agility to all tests';
        v_double_capacity_source := 'It is impossible to carry more than twice your capacity';
    END IF;

    v_result := v_result || (
        SELECT COALESCE(jsonb_agg(
            m || jsonb_build_object(
                'origin', 'armor',
                'origin_key', 'armor.' || a.key,
                'origin_name', COALESCE(t.value, a.key)
            )
        ), '[]'::jsonb)
        FROM armors a
        CROSS JOIN LATERAL jsonb_array_elements(a.modifiers) m
        LEFT JOIN translations t ON t.key = a.key AND t.locale = p_locale
        WHERE a.key = p_equipped_armor->>'key'
    );

    IF p_equipped_weapons IS NOT NULL AND jsonb_array_length(p_equipped_weapons) > 0 THEN
        v_result := v_result || (
            SELECT COALESCE(jsonb_agg(
                m || jsonb_build_object(
                    'origin', 'weapon',
                    'origin_key', 'weapon.' || w.key,
                    'origin_name', COALESCE(t.value, w.key)
                )
            ), '[]'::jsonb)
            FROM weapons w
            CROSS JOIN LATERAL jsonb_array_elements(w.modifiers) m
            LEFT JOIN translations t ON t.key = w.key AND t.locale = p_locale
            WHERE w.key IN (
                SELECT ew->>'key'
                FROM jsonb_array_elements(p_equipped_weapons) ew
            )
        );
    END IF;

    IF p_equipment IS NOT NULL THEN
        v_result := v_result || (
            SELECT COALESCE(jsonb_agg(
                p.buff || jsonb_build_object(
                    'origin', 'pet',
                    'origin_key', 'pet.' || p.key,
                    'origin_name', COALESCE(t.value, p.key)
                )
            ), '[]'::jsonb)
            FROM pets p
            LEFT JOIN translations t ON t.key = p.key AND t.locale = p_locale
            WHERE p.key IN (
                SELECT eq->>'key'
                FROM jsonb_array_elements(p_equipment) eq
                WHERE eq->>'key' LIKE 'pet.%' OR eq->>'key' LIKE 'pets.%'
            )
        );
    END IF;

    IF p_abilities IS NOT NULL AND jsonb_array_length(p_abilities) > 0 THEN
        v_result := v_result || (
            SELECT COALESCE(jsonb_agg(
                jsonb_build_object(
                    'value', cam.value,
                    'source', cam.source,
                    'statistic', cam.statistic,
                    'exclude', COALESCE(cam.exclude, '[]'::jsonb),
                    'origin', 'system',
                    'origin_key', 'class_ability.' || cam.ability_key,
                    'origin_name', cam.source
                )
            ), '[]'::jsonb)
            FROM class_ability_modifiers cam
            WHERE cam.class_id = p_class_id
              AND cam.ability_key IN (
                SELECT ab->>'key'
                FROM jsonb_array_elements(p_abilities) ab
                WHERE ab ? 'key'
              )
        );
    END IF;

    IF v_encumbrance > v_max_encumbrance THEN
        v_result := v_result || jsonb_build_array(
            jsonb_build_object(
                'value', -2,
                'source', v_over_capacity_source,
                'statistic', 'agility',
                'exclude', '[]'::jsonb,
                'origin', 'system',
                'origin_key', 'system.encumbrance.over_capacity',
                'origin_name', v_encumbrance_label
            )
        );
    END IF;

    IF v_encumbrance > (v_max_encumbrance * 2) THEN
        v_result := v_result || jsonb_build_array(
            jsonb_build_object(
                'value', 0,
                'source', v_double_capacity_source,
                'statistic', 'strength',
                'exclude', '[]'::jsonb,
                'origin', 'system',
                'origin_key', 'system.encumbrance.double_capacity',
                'origin_name', v_double_capacity_source
            )
        );
    END IF;

    RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;

CREATE OR REPLACE FUNCTION calculate_character_dr(
    p_ability int,
    p_all_modifiers jsonb,
    p_statistic text,
    p_excluded text[]
) RETURNS int
    LANGUAGE sql AS $$
    SELECT 12
        - roll_to_modifier(p_ability)
        - COALESCE(
        (
            SELECT SUM((m->>'value')::int)
            FROM jsonb_array_elements(COALESCE(p_all_modifiers, '[]'::jsonb)) m
            WHERE m->>'statistic' = p_statistic
              AND NOT COALESCE(m->'exclude', '[]'::jsonb) ?| p_excluded
        ),
        0
    );
$$;

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
    modifiers jsonb,
    computed_modifiers jsonb,
    encumbrance int,
    max_encumbrance int,
    dr_to_dodge int,
    dr_to_melee int,
    dr_to_ranged int,
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
    resolved_computed_modifiers jsonb;
    encumbrance int;
    max_encumbrance int;
    strength_modifier int;
    dr_to_dodge int;
    dr_to_melee int;
    dr_to_ranged int;
BEGIN
    SELECT
        c.*,
        COALESCE(t_class_name.value, cl.name) AS class_name_trans,
        COALESCE(t_class_desc.value, cl.appendix) AS class_description_trans,
        COALESCE(t_origin.value, c.origin) AS origin_trans,
        COALESCE(t_habit.value, c.habit) AS habit_trans,
        COALESCE(t_tale.value, c.tale) AS tale_trans,
        COALESCE(t_body.value, c.body_description) AS body_trans,
        COALESCE(t_trait1.value, c.trait1) AS trait1_trans,
        COALESCE(t_trait2.value, c.trait2) AS trait2_trans
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

    resolved_equipment := resolve_character_inventory_items(result.equipment, p_locale, true);
    resolved_storage := resolve_character_inventory_items(result.storage, p_locale, false);
    resolved_weapons := resolve_character_equipped_weapons(result.equipped_weapons, p_locale);
    resolved_armor := resolve_character_equipped_armor(result.equipped_armor, p_locale);
    resolved_abilities := resolve_character_abilities(result.abilities, p_locale);

    resolved_computed_modifiers := resolve_character_computed_modifiers(
        result.equipped_armor,
        result.equipped_weapons,
        result.equipment,
        result.strength,
        result.class_id,
        result.abilities,
        p_locale
    );

    encumbrance := COALESCE(jsonb_array_length(COALESCE(result.equipment, '[]'::jsonb)), 0);
    strength_modifier := roll_to_modifier(result.strength);
    max_encumbrance := GREATEST(0, 8 + strength_modifier);

    dr_to_dodge := calculate_character_dr(
        result.agility,
        COALESCE(result.modifiers, '[]'::jsonb) || COALESCE(resolved_computed_modifiers, '[]'::jsonb),
        'agility',
        ARRAY['defence']
    );
    dr_to_melee := calculate_character_dr(
        result.strength,
        COALESCE(result.modifiers, '[]'::jsonb) || COALESCE(resolved_computed_modifiers, '[]'::jsonb),
        'strength',
        ARRAY['melee']
    );
    dr_to_ranged := calculate_character_dr(
        result.presence,
        COALESCE(result.modifiers, '[]'::jsonb) || COALESCE(resolved_computed_modifiers, '[]'::jsonb),
        'presence',
        ARRAY['ranged']
    );

    RETURN QUERY
    SELECT
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
        COALESCE(result.modifiers, '[]'::jsonb),
        COALESCE(resolved_computed_modifiers, '[]'::jsonb),
        encumbrance,
        max_encumbrance,
        dr_to_dodge,
        dr_to_melee,
        dr_to_ranged,
        result.created_at::timestamptz,
        result.updated_at::timestamptz;
END;
$$ LANGUAGE plpgsql;
