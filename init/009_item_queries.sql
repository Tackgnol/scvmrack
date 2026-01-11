-- Migration: Multi-language Full-Text Search View
DROP VIEW IF EXISTS public.item_search;

CREATE OR REPLACE VIEW public.item_search AS
-- Weapons
SELECT
    'weapon'::text AS item_type,
    w.id,
    w.key,
    w.tags,
    to_tsvector('simple',
                w.key || ' ' ||
                coalesce(string_agg(t.value, ' '), '') || ' ' ||
                coalesce(w.tags::text, '') || ' ' ||
                coalesce(w.effect::text, '')
    ) AS document
FROM public.weapons w
         LEFT JOIN public.translations t ON t.key = w.key
GROUP BY w.id, w.key, w.tags, w.effect

UNION ALL

-- Armor
SELECT
    'armor'::text AS item_type,
    a.id,
    a.key,
    a.tags,
    to_tsvector('simple',
                a.key || ' ' ||
                coalesce(string_agg(t.value, ' '), '') || ' ' ||
                coalesce(a.tags::text, '')
    ) AS document
FROM public.armors a
         LEFT JOIN public.translations t ON t.key = a.key
GROUP BY a.id, a.key, a.tags

UNION ALL

-- Equipment
SELECT
    'equipment'::text AS item_type,
    e.id,
    e.key,
    e.tags,
    to_tsvector('simple',
                e.key || ' ' ||
                coalesce(string_agg(t.value, ' '), '') || ' ' ||
                coalesce(e.tags::text, '') || ' ' ||
                coalesce(e.use_effect::text, '')
    ) AS document
FROM public.equipment e
         LEFT JOIN public.translations t ON t.key = e.key
GROUP BY e.id, e.key, e.tags, e.use_effect

UNION ALL

-- Pets
SELECT
    'pet'::text AS item_type,
    p.id,
    p.key,
    p.tags,
    to_tsvector('simple',
                p.key || ' ' ||
                coalesce(string_agg(t.value, ' '), '') || ' ' ||
                coalesce(p.tags::text, '') || ' ' ||
                coalesce(p.buff::text, '')
    ) AS document
FROM public.pets p
         LEFT JOIN public.translations t ON t.key = p.key
GROUP BY p.id, p.key, p.tags, p.buff;


CREATE FUNCTION get_item_full(
    p_item_type text,
    p_id integer
)
    RETURNS jsonb
    LANGUAGE plpgsql
AS $$
BEGIN
    IF p_item_type = 'weapon' THEN
        RETURN to_jsonb(w)
        FROM weapons w
        WHERE w.id = p_id;

    ELSIF p_item_type = 'armor' THEN
        RETURN to_jsonb(a)
        FROM armors a
        WHERE a.id = p_id;

    ELSIF p_item_type = 'equipment' THEN
        RETURN to_jsonb(e)
        FROM equipment e
        WHERE e.id = p_id;

    ELSIF p_item_type = 'pet' THEN
        RETURN to_jsonb(p)
        FROM pets p
        WHERE p.id = p_id;

ELSE
        RAISE EXCEPTION 'Unknown item_type: %', p_item_type;
END IF;
END;
$$;
