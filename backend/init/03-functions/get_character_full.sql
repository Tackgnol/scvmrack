-- Get full character data with translations and resolved items
-- Source: migration 013 + current_tier support for armor degradation
--
-- NOTE: Production had a stale overload (uuid, varchar) that was never dropped.
-- This file defines only the canonical (uuid, text) signature.
-- The cleanup migration handles dropping the stale overload on prod.

-- Drop the old signature so the overload with p_presence is the only definition.
DROP FUNCTION IF EXISTS resolve_character_inventory_items(jsonb, text, boolean);

-- Default uses array for an item, used when hydrating inventory at write time.
-- Returns NULL when an item has no default (it should keep whatever the caller set, or '[]').
CREATE OR REPLACE FUNCTION resolve_item_default_uses(
    p_key text,
    p_presence int,
    p_scroll_default boolean DEFAULT false
) RETURNS jsonb
    LANGUAGE sql STABLE PARALLEL SAFE AS $$
    SELECT CASE
        WHEN p.hp IS NOT NULL AND p.hp > 0
            THEN to_jsonb(array_fill(true, ARRAY[LEAST(p.hp, 50)]))
        WHEN p_scroll_default AND p_key LIKE 'scroll.%'
            THEN '[false,false,false,false]'::jsonb
        WHEN p_key = 'equipment.violet-poison'
            THEN to_jsonb(array_fill(false, ARRAY[roll_die(4) + 1]))
        WHEN e.default_amount IS NOT NULL
            AND e.default_amount > 0
            AND 'consumable' = ANY(e.tags)
            THEN to_jsonb(array_fill(false, ARRAY[
                GREATEST(0, e.default_amount + CASE
                    WHEN p_key IN ('equipment.lantern-oil', 'equipment.medicine-chest')
                        THEN roll_to_modifier(p_presence)
                    ELSE 0
                END)
            ]))
        ELSE NULL
    END
    FROM (SELECT 1) seed
    LEFT JOIN equipment e ON e.key = p_key
    LEFT JOIN pets p ON p.key = p_key;
$$;

-- Walks an inventory array and fills in a default `uses` array for items that don't already
-- have one. Items with a non-empty array `uses` are left alone.
CREATE OR REPLACE FUNCTION hydrate_inventory_uses(
    p_items jsonb,
    p_presence int,
    p_scroll_default boolean DEFAULT false
) RETURNS jsonb
    LANGUAGE sql STABLE PARALLEL SAFE AS $$
    SELECT COALESCE(jsonb_agg(
        CASE
            WHEN item ? 'uses'
                AND jsonb_typeof(item->'uses') = 'array'
                AND jsonb_array_length(item->'uses') > 0
            THEN item
            WHEN defaults.value IS NOT NULL
            THEN item || jsonb_build_object('uses', defaults.value)
            ELSE item
        END
    ), '[]'::jsonb)
    FROM jsonb_array_elements(COALESCE(p_items, '[]'::jsonb)) item
    LEFT JOIN LATERAL (
        SELECT resolve_item_default_uses(item->>'key', p_presence, p_scroll_default) AS value
    ) defaults ON true;
$$;

-- Shared resolver for equipment/storage item arrays. Read-time only — `uses` is a passthrough;
-- defaults are baked at write time by hydrate_inventory_uses (called from update_character /
-- generate_character).
CREATE OR REPLACE FUNCTION resolve_character_inventory_items(
    p_items jsonb,
    p_locale text,
    p_scroll_default_uses boolean DEFAULT false,
    p_presence int DEFAULT 10
) RETURNS jsonb
    LANGUAGE sql STABLE PARALLEL SAFE AS $$
    SELECT COALESCE(jsonb_agg(
        jsonb_strip_nulls(jsonb_build_object(
            'key', item->>'key',
            'name', COALESCE(t.value, item->>'name', item->>'key'),
            'description', COALESCE(td.value, item->>'description', ''),
            'comments', item->>'comments',
            'source', item->>'source',
            'category', item->>'category',
            'value', CASE
                WHEN item ? 'value' AND item->>'value' ~ '^[0-9]+$'
                    THEN (item->>'value')::int
                ELSE COALESCE(w.value, a.value, e_m.value)
            END,
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
                WHEN jsonb_typeof(item->'uses') = 'array' THEN item->'uses'
                ELSE '[]'::jsonb
            END,
            'ammo_type', COALESCE(w.ammo_type, e_m.ammo_type, item->>'ammo_type'),
            'amount', CASE
                WHEN COALESCE(w.ammo_type, e_m.ammo_type, item->>'ammo_type') IS NOT NULL
                 AND item ? 'amount'
                 AND item->>'amount' ~ '^[0-9]+$'
                THEN (item->>'amount')::int
                ELSE NULL
            END,
            'use_count_rule', CASE
                WHEN jsonb_typeof(item->'use_count_rule') = 'object' THEN item->'use_count_rule'
                ELSE NULL
            END,
            'modifiers', CASE
                WHEN jsonb_typeof(item->'modifiers') = 'array' THEN item->'modifiers'
                ELSE '[]'::jsonb
            END
        ) || CASE
            -- Gate the armor sub-object on either a catalog match or an explicit "armor" tag
            -- in the stored JSONB. Tag-based detection mirrors how the frontend decides
            -- whether an item is armor, and prevents stray max_tier/current_tier keys on
            -- non-armor items from synthesizing a tier-0 armor block.
            WHEN a.key IS NOT NULL
              OR (jsonb_typeof(item->'tags') = 'array' AND item->'tags' @> '["armor"]'::jsonb)
            THEN jsonb_build_object(
                'max_tier', COALESCE(
                    CASE
                        WHEN item ? 'max_tier' AND item->>'max_tier' ~ '^[0-9]+$'
                            THEN (item->>'max_tier')::int
                        ELSE NULL
                    END,
                    a.max_tier,
                    0
                ),
                'current_tier', COALESCE(
                    CASE
                        WHEN item ? 'current_tier' AND item->>'current_tier' ~ '^[0-9]+$'
                            THEN (item->>'current_tier')::int
                        ELSE NULL
                    END,
                    CASE
                        WHEN item ? 'max_tier' AND item->>'max_tier' ~ '^[0-9]+$'
                            THEN (item->>'max_tier')::int
                        ELSE NULL
                    END,
                    a.max_tier,
                    0
                )
            )
            ELSE '{}'::jsonb
        END)
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
    LANGUAGE sql STABLE PARALLEL SAFE AS $$
    SELECT COALESCE(jsonb_agg(
        jsonb_strip_nulls(jsonb_build_object(
            'key', ew->>'key',
            'name', COALESCE(t.value, ew->>'name', ew->>'key'),
            'description', COALESCE(td.value, ew->>'description', ''),
            'comments', ew->>'comments',
            'source', ew->>'source',
            'category', ew->>'category',
            'value', CASE
                WHEN ew ? 'value' AND ew->>'value' ~ '^[0-9]+$'
                    THEN (ew->>'value')::int
                ELSE w.value
            END,
            'dice', (
                SELECT COALESCE(jsonb_agg(DISTINCT dice_val), '[]'::jsonb)
                FROM (
                    SELECT jsonb_array_elements_text(ew->'dice') AS dice_val
                    WHERE ew ? 'dice' AND jsonb_typeof(ew->'dice') = 'array'
                    UNION ALL
                    SELECT jsonb_array_elements_text(to_jsonb(w.dice)) AS dice_val WHERE w.dice IS NOT NULL
                ) dice_sub
            ),
            'tags', (
                SELECT COALESCE(jsonb_agg(DISTINCT tag_val), '[]'::jsonb)
                FROM (
                    SELECT jsonb_array_elements_text(ew->'tags') AS tag_val
                    WHERE ew ? 'tags' AND jsonb_typeof(ew->'tags') = 'array'
                    UNION ALL
                    SELECT jsonb_array_elements_text(to_jsonb(w.tags)) AS tag_val WHERE w.tags IS NOT NULL
                ) tags_sub
            ),
            'ammo_type', COALESCE(w.ammo_type, ew->>'ammo_type'),
            'modifiers', CASE
                WHEN jsonb_typeof(ew->'modifiers') = 'array' THEN ew->'modifiers'
                ELSE '[]'::jsonb
            END
        ))
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
    LANGUAGE sql STABLE PARALLEL SAFE AS $$
    SELECT CASE
        WHEN p_item IS NULL THEN NULL
        ELSE (
            SELECT jsonb_strip_nulls(jsonb_build_object(
                'key', p_item->>'key',
                'name', COALESCE(t.value, p_item->>'name', p_item->>'key'),
                'description', COALESCE(td.value, p_item->>'description', ''),
                'comments', p_item->>'comments',
                'source', p_item->>'source',
                'category', p_item->>'category',
                'value', CASE
                    WHEN p_item ? 'value' AND p_item->>'value' ~ '^[0-9]+$'
                        THEN (p_item->>'value')::int
                    ELSE a.value
                END,
                'dice', (
                    SELECT COALESCE(jsonb_agg(DISTINCT dice_val), '[]'::jsonb)
                    FROM (
                        SELECT jsonb_array_elements_text(p_item->'dice') AS dice_val
                        WHERE p_item ? 'dice' AND jsonb_typeof(p_item->'dice') = 'array'
                        UNION ALL
                        SELECT jsonb_array_elements_text(to_jsonb(a.dice)) AS dice_val WHERE a.dice IS NOT NULL
                    ) dice_sub
                ),
                'max_tier', COALESCE(
                    CASE
                        WHEN p_item ? 'max_tier' AND p_item->>'max_tier' ~ '^[0-9]+$'
                            THEN (p_item->>'max_tier')::int
                        ELSE NULL
                    END,
                    a.max_tier,
                    0
                ),
                'current_tier', COALESCE(
                    CASE
                        WHEN p_item ? 'current_tier' AND p_item->>'current_tier' ~ '^[0-9]+$'
                            THEN (p_item->>'current_tier')::int
                        ELSE NULL
                    END,
                    CASE
                        WHEN p_item ? 'max_tier' AND p_item->>'max_tier' ~ '^[0-9]+$'
                            THEN (p_item->>'max_tier')::int
                        ELSE NULL
                    END,
                    a.max_tier,
                    0
                ),
                'tags', (
                    SELECT COALESCE(jsonb_agg(DISTINCT tag_val), '[]'::jsonb)
                    FROM (
                        SELECT jsonb_array_elements_text(p_item->'tags') AS tag_val
                        WHERE p_item ? 'tags' AND jsonb_typeof(p_item->'tags') = 'array'
                        UNION ALL
                        SELECT jsonb_array_elements_text(to_jsonb(a.tags)) AS tag_val WHERE a.tags IS NOT NULL
                    ) tags_sub
                ),
                'modifiers', CASE
                    WHEN jsonb_typeof(p_item->'modifiers') = 'array' THEN p_item->'modifiers'
                    ELSE '[]'::jsonb
                END
            ))
            FROM (SELECT 1) seed
            LEFT JOIN armors a ON a.key = p_item->>'key'
            LEFT JOIN translations t ON t.key = p_item->>'key' AND t.locale = p_locale
            LEFT JOIN translations td ON td.key = (p_item->>'key') || '.description' AND td.locale = p_locale
        )
    END;
$$;

CREATE OR REPLACE FUNCTION resolve_character_abilities(
    p_abilities jsonb,
    p_locale text
) RETURNS jsonb
    LANGUAGE sql STABLE PARALLEL SAFE AS $$
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

CREATE OR REPLACE FUNCTION calculate_character_encumbrance(
    p_equipment jsonb,
    p_equipped_weapons jsonb,
    p_equipped_armor jsonb
) RETURNS int
    LANGUAGE sql STABLE PARALLEL SAFE AS $$
    SELECT
        COALESCE((
            SELECT COUNT(*)
            FROM jsonb_array_elements(COALESCE(p_equipment, '[]'::jsonb)) item
            WHERE jsonb_typeof(item) = 'object'
              AND COALESCE(item->>'key', '') <> ''
              AND NOT EXISTS (
                  SELECT 1
                  FROM (
                      SELECT jsonb_array_elements_text(item->'tags') AS tag
                      WHERE item ? 'tags' AND jsonb_typeof(item->'tags') = 'array'
                      UNION ALL
                      SELECT unnest(e.tags) AS tag
                      FROM equipment e
                      WHERE e.key = item->>'key'
                      UNION ALL
                      SELECT unnest(p.tags) AS tag
                      FROM pets p
                      WHERE p.key = item->>'key'
                  ) encumbrance_exempt_tags
                  WHERE tag IN ('ammo', 'carry', 'pet')
              )
        ), 0)
        + COALESCE((
            SELECT COUNT(*)
            FROM jsonb_array_elements(COALESCE(p_equipped_weapons, '[]'::jsonb)) equipped_weapon
            WHERE jsonb_typeof(equipped_weapon) = 'object'
              AND COALESCE(equipped_weapon->>'key', '') <> ''
        ), 0)
        + CASE
            WHEN p_equipped_armor IS NOT NULL
             AND jsonb_typeof(p_equipped_armor) = 'object'
             AND COALESCE(p_equipped_armor->>'key', '') <> ''
            THEN 1
            ELSE 0
        END;
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
    LANGUAGE plpgsql STABLE PARALLEL SAFE AS $$
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
    v_encumbrance := calculate_character_encumbrance(
        p_equipment,
        p_equipped_weapons,
        p_equipped_armor
    );

    IF p_locale = 'pl' THEN
        v_encumbrance_label := 'Obciążenie';
        v_over_capacity_source := 'Przeciążenie: -2 do wszystkich testów Zręczności';
        v_double_capacity_source := 'Nie da się nieść więcej niż dwa razy tyle, ile wynosi twój udźwig';
    ELSE
        v_encumbrance_label := 'Encumbrance';
        v_over_capacity_source := 'Over capacity: -2 Agility to all tests';
        v_double_capacity_source := 'It is impossible to carry more than twice your capacity';
    END IF;

    -- Armor modifiers. Rule: catalog rows always use their own modifiers; only items with
    -- no catalog match may contribute the modifiers stored on the JSONB blob (i.e. custom
    -- armor). One pass handles both cases.
    IF p_equipped_armor IS NOT NULL
       AND jsonb_typeof(p_equipped_armor) = 'object'
       AND COALESCE(p_equipped_armor->>'key', '') <> '' THEN
        v_result := v_result || COALESCE((
            SELECT jsonb_agg(
                m || jsonb_build_object(
                    'origin', 'armor',
                    'origin_key', CASE
                        WHEN a.key IS NOT NULL THEN 'armor.' || a.key
                        ELSE COALESCE(p_equipped_armor->>'key', 'custom.armor')
                    END,
                    'origin_name', CASE
                        WHEN a.key IS NOT NULL THEN COALESCE(t.value, a.key)
                        ELSE COALESCE(p_equipped_armor->>'name', p_equipped_armor->>'key', 'Custom armor')
                    END
                )
            )
            FROM (SELECT 1) seed
            LEFT JOIN armors a ON a.key = p_equipped_armor->>'key'
            LEFT JOIN translations t ON t.key = a.key AND t.locale = p_locale
            CROSS JOIN LATERAL jsonb_array_elements(
                CASE
                    WHEN a.key IS NOT NULL THEN COALESCE(a.modifiers, '[]'::jsonb)
                    WHEN jsonb_typeof(p_equipped_armor->'modifiers') = 'array' THEN p_equipped_armor->'modifiers'
                    ELSE '[]'::jsonb
                END
            ) m
            WHERE jsonb_typeof(m) = 'object'
        ), '[]'::jsonb);
    END IF;

    -- Weapon modifiers. Same rule as armor: catalog rows always use their own modifiers,
    -- custom rows (no catalog match) fall back to the JSONB modifiers on the item.
    IF p_equipped_weapons IS NOT NULL AND jsonb_array_length(p_equipped_weapons) > 0 THEN
        v_result := v_result || COALESCE((
            SELECT jsonb_agg(
                m || jsonb_build_object(
                    'origin', 'weapon',
                    'origin_key', CASE
                        WHEN w.key IS NOT NULL THEN 'weapon.' || w.key
                        ELSE COALESCE(ew->>'key', 'custom.weapon')
                    END,
                    'origin_name', CASE
                        WHEN w.key IS NOT NULL THEN COALESCE(t.value, w.key)
                        ELSE COALESCE(ew->>'name', ew->>'key', 'Custom weapon')
                    END
                )
            )
            FROM jsonb_array_elements(p_equipped_weapons) ew
            LEFT JOIN weapons w ON w.key = ew->>'key'
            LEFT JOIN translations t ON t.key = w.key AND t.locale = p_locale
            CROSS JOIN LATERAL jsonb_array_elements(
                CASE
                    WHEN w.key IS NOT NULL THEN COALESCE(w.modifiers, '[]'::jsonb)
                    WHEN jsonb_typeof(ew->'modifiers') = 'array' THEN ew->'modifiers'
                    ELSE '[]'::jsonb
                END
            ) m
            WHERE jsonb_typeof(ew) = 'object'
              AND jsonb_typeof(m) = 'object'
        ), '[]'::jsonb);
    END IF;

    IF p_equipment IS NOT NULL THEN
        v_result := v_result || (
            SELECT COALESCE(jsonb_agg(
                buff_elem || jsonb_build_object(
                    'origin', 'pet',
                    'origin_key', 'pet.' || p.key,
                    'origin_name', COALESCE(t.value, p.key)
                )
            ), '[]'::jsonb)
            FROM pets p
            CROSS JOIN LATERAL jsonb_array_elements(p.buff) buff_elem
            LEFT JOIN translations t ON t.key = p.key AND t.locale = p_locale
            WHERE p.key IN (
                SELECT eq->>'key'
                FROM jsonb_array_elements(p_equipment) eq
                WHERE (eq->>'key' LIKE 'pet.%' OR eq->>'key' LIKE 'pets.%')
                  AND NOT COALESCE((eq->>'suppress_pet_buff')::boolean, false)
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

    -- Strip any empty/null/malformed elements from the result
    RETURN (
        SELECT COALESCE(jsonb_agg(elem), '[]'::jsonb)
        FROM jsonb_array_elements(COALESCE(v_result, '[]'::jsonb)) elem
        WHERE jsonb_typeof(elem) = 'object'
          AND elem != '{}'::jsonb
          AND elem ? 'origin'
    );
END;
$$;

CREATE OR REPLACE FUNCTION calculate_character_dr(
    p_ability int,
    p_all_modifiers jsonb,
    p_statistic text,
    p_excluded text[]
) RETURNS int
    LANGUAGE sql STABLE PARALLEL SAFE AS $$
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

    resolved_equipment := resolve_character_inventory_items(result.equipment, p_locale, true, result.presence);
    resolved_storage := resolve_character_inventory_items(result.storage, p_locale, false, result.presence);
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

    encumbrance := calculate_character_encumbrance(
        result.equipment,
        result.equipped_weapons,
        result.equipped_armor
    );
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
$$ LANGUAGE plpgsql STABLE PARALLEL SAFE;
