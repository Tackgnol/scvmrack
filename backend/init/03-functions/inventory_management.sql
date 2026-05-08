-- Inventory management: move items between equipment and storage

CREATE OR REPLACE FUNCTION move_to_storage(p_character_id UUID, p_equipment_index INTEGER) RETURNS JSONB
    LANGUAGE plpgsql AS $$
DECLARE
    v_item JSONB;
    v_equipment JSONB;
    v_storage JSONB;
BEGIN
    SELECT equipment, storage INTO v_equipment, v_storage
    FROM characters WHERE id = p_character_id;

    IF v_equipment IS NULL THEN
        RAISE EXCEPTION 'Character not found';
    END IF;

    IF p_equipment_index < 0 OR p_equipment_index >= jsonb_array_length(v_equipment) THEN
        RAISE EXCEPTION 'Invalid equipment index: %', p_equipment_index;
    END IF;

    v_item := v_equipment -> p_equipment_index;

    v_equipment := (
        SELECT COALESCE(jsonb_agg(elem), '[]'::jsonb)
        FROM jsonb_array_elements(v_equipment) WITH ORDINALITY AS arr(elem, idx)
        WHERE idx - 1 != p_equipment_index
    );

    v_storage := COALESCE(v_storage, '[]'::jsonb) || jsonb_build_array(v_item);

    UPDATE characters
    SET equipment = v_equipment, storage = v_storage, updated_at = NOW()
    WHERE id = p_character_id;

    RETURN jsonb_build_object('moved_item', v_item, 'equipment', v_equipment, 'storage', v_storage);
END;
$$;

CREATE OR REPLACE FUNCTION move_to_equipment(
    p_character_id UUID,
    p_storage_index INTEGER,
    p_equipment_position INTEGER DEFAULT NULL
) RETURNS JSONB
    LANGUAGE plpgsql AS $$
DECLARE
    v_item JSONB;
    v_equipment JSONB;
    v_storage JSONB;
    v_new_equipment JSONB;
BEGIN
    SELECT equipment, storage INTO v_equipment, v_storage
    FROM characters WHERE id = p_character_id;

    IF v_storage IS NULL THEN
        RAISE EXCEPTION 'Character not found';
    END IF;

    IF p_storage_index < 0 OR p_storage_index >= jsonb_array_length(v_storage) THEN
        RAISE EXCEPTION 'Invalid storage index: %', p_storage_index;
    END IF;

    v_item := v_storage -> p_storage_index;

    v_storage := (
        SELECT COALESCE(jsonb_agg(elem), '[]'::jsonb)
        FROM jsonb_array_elements(v_storage) WITH ORDINALITY AS arr(elem, idx)
        WHERE idx - 1 != p_storage_index
    );

    v_equipment := COALESCE(v_equipment, '[]'::jsonb);

    IF p_equipment_position IS NULL OR p_equipment_position >= jsonb_array_length(v_equipment) THEN
        v_new_equipment := v_equipment || jsonb_build_array(v_item);
    ELSE
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

    UPDATE characters
    SET equipment = v_new_equipment, storage = v_storage, updated_at = NOW()
    WHERE id = p_character_id;

    RETURN jsonb_build_object('moved_item', v_item, 'equipment', v_new_equipment, 'storage', v_storage);
END;
$$;

CREATE OR REPLACE FUNCTION swap_items(
    p_character_id UUID,
    p_equipment_index INTEGER,
    p_storage_index INTEGER
) RETURNS JSONB
    LANGUAGE plpgsql AS $$
DECLARE
    v_equipment_item JSONB;
    v_storage_item JSONB;
    v_equipment JSONB;
    v_storage JSONB;
BEGIN
    SELECT equipment, storage INTO v_equipment, v_storage
    FROM characters WHERE id = p_character_id;

    IF v_equipment IS NULL THEN
        RAISE EXCEPTION 'Character not found';
    END IF;

    IF p_equipment_index < 0 OR p_equipment_index >= jsonb_array_length(v_equipment) THEN
        RAISE EXCEPTION 'Invalid equipment index: %', p_equipment_index;
    END IF;

    IF p_storage_index < 0 OR p_storage_index >= jsonb_array_length(v_storage) THEN
        RAISE EXCEPTION 'Invalid storage index: %', p_storage_index;
    END IF;

    v_equipment_item := v_equipment -> p_equipment_index;
    v_storage_item := v_storage -> p_storage_index;

    v_equipment := jsonb_set(v_equipment, ARRAY[p_equipment_index::text], v_storage_item);
    v_storage := jsonb_set(v_storage, ARRAY[p_storage_index::text], v_equipment_item);

    UPDATE characters
    SET equipment = v_equipment, storage = v_storage, updated_at = NOW()
    WHERE id = p_character_id;

    RETURN jsonb_build_object('equipment', v_equipment, 'storage', v_storage);
END;
$$;
