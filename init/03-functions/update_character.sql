CREATE OR REPLACE FUNCTION validate_character_patch(p_patch jsonb)
RETURNS void
LANGUAGE plpgsql AS $$
BEGIN
    -- Validate numeric fields
    IF p_patch ? 'current_hp' AND jsonb_typeof(p_patch->'current_hp') NOT IN ('number', 'null') THEN
        RAISE EXCEPTION 'Invalid type for current_hp';
    END IF;
    IF p_patch ? 'omens' AND jsonb_typeof(p_patch->'omens') NOT IN ('number', 'null') THEN
        RAISE EXCEPTION 'Invalid type for omens';
    END IF;
    IF p_patch ? 'silver' AND jsonb_typeof(p_patch->'silver') NOT IN ('number', 'null') THEN
        RAISE EXCEPTION 'Invalid type for silver';
    END IF;
    IF p_patch ? 'agility' AND jsonb_typeof(p_patch->'agility') NOT IN ('number', 'null') THEN
        RAISE EXCEPTION 'Invalid type for agility';
    END IF;
    IF p_patch ? 'strength' AND jsonb_typeof(p_patch->'strength') NOT IN ('number', 'null') THEN
        RAISE EXCEPTION 'Invalid type for strength';
    END IF;
    IF p_patch ? 'presence' AND jsonb_typeof(p_patch->'presence') NOT IN ('number', 'null') THEN
        RAISE EXCEPTION 'Invalid type for presence';
    END IF;
    IF p_patch ? 'toughness' AND jsonb_typeof(p_patch->'toughness') NOT IN ('number', 'null') THEN
        RAISE EXCEPTION 'Invalid type for toughness';
    END IF;

    -- Validate string fields
    IF p_patch ? 'name' AND jsonb_typeof(p_patch->'name') NOT IN ('string', 'null') THEN
        RAISE EXCEPTION 'Invalid type for name';
    END IF;
    
    -- Validate array fields
    IF p_patch ? 'abilities' AND jsonb_typeof(p_patch->'abilities') NOT IN ('array', 'null') THEN
        RAISE EXCEPTION 'Invalid type for abilities';
    END IF;
    IF p_patch ? 'equipment' AND jsonb_typeof(p_patch->'equipment') NOT IN ('array', 'null') THEN
        RAISE EXCEPTION 'Invalid type for equipment';
    END IF;
    IF p_patch ? 'storage' AND jsonb_typeof(p_patch->'storage') NOT IN ('array', 'null') THEN
        RAISE EXCEPTION 'Invalid type for storage';
    END IF;
    IF p_patch ? 'equipped_weapons' AND jsonb_typeof(p_patch->'equipped_weapons') NOT IN ('array', 'null') THEN
        RAISE EXCEPTION 'Invalid type for equipped_weapons';
    END IF;
    IF p_patch ? 'equipped_armor' AND jsonb_typeof(p_patch->'equipped_armor') NOT IN ('array', 'null') THEN
        RAISE EXCEPTION 'Invalid type for equipped_armor';
    END IF;
    IF p_patch ? 'modifiers' AND jsonb_typeof(p_patch->'modifiers') NOT IN ('array', 'null') THEN
        RAISE EXCEPTION 'Invalid type for modifiers';
    END IF;
END;
$$;

CREATE OR REPLACE FUNCTION update_character(
    p_id uuid,
    p_patch jsonb
) RETURNS uuid
LANGUAGE plpgsql AS $$
DECLARE
    v_row characters;
BEGIN
    PERFORM validate_character_patch(p_patch);

    UPDATE characters
    SET
        name = CASE WHEN p_patch ? 'name' THEN p_patch->>'name' ELSE name END,
        current_hp = CASE WHEN p_patch ? 'current_hp' THEN (p_patch->>'current_hp')::int ELSE current_hp END,
        omens = CASE WHEN p_patch ? 'omens' THEN (p_patch->>'omens')::int ELSE omens END,
        silver = CASE WHEN p_patch ? 'silver' THEN (p_patch->>'silver')::int ELSE silver END,
        agility = CASE WHEN p_patch ? 'agility' THEN (p_patch->>'agility')::int ELSE agility END,
        strength = CASE WHEN p_patch ? 'strength' THEN (p_patch->>'strength')::int ELSE strength END,
        presence = CASE WHEN p_patch ? 'presence' THEN (p_patch->>'presence')::int ELSE presence END,
        toughness = CASE WHEN p_patch ? 'toughness' THEN (p_patch->>'toughness')::int ELSE toughness END,
        habit = CASE WHEN p_patch ? 'habit' THEN p_patch->>'habit' ELSE habit END,
        body_description = CASE WHEN p_patch ? 'body_description' THEN p_patch->>'body_description' ELSE body_description END,
        origin = CASE WHEN p_patch ? 'origin' THEN p_patch->>'origin' ELSE origin END,
        notes = CASE WHEN p_patch ? 'notes' THEN p_patch->>'notes' ELSE notes END,
        trait1 = CASE WHEN p_patch ? 'trait1' THEN p_patch->>'trait1' ELSE trait1 END,
        trait2 = CASE WHEN p_patch ? 'trait2' THEN p_patch->>'trait2' ELSE trait2 END,

        abilities = CASE WHEN p_patch ? 'abilities' THEN p_patch->'abilities' ELSE abilities END,
        equipment = CASE WHEN p_patch ? 'equipment' THEN p_patch->'equipment' ELSE equipment END,
        storage = CASE WHEN p_patch ? 'storage' THEN p_patch->'storage' ELSE storage END,
        equipped_weapons = CASE WHEN p_patch ? 'equipped_weapons' THEN p_patch->'equipped_weapons' ELSE equipped_weapons END,
        equipped_armor = CASE WHEN p_patch ? 'equipped_armor' THEN p_patch->'equipped_armor' ELSE equipped_armor END,
        modifiers = CASE WHEN p_patch ? 'modifiers' THEN p_patch->'modifiers' ELSE modifiers END,

        updated_at = now()
    WHERE id = p_id
    RETURNING * INTO v_row;

    IF v_row IS NULL THEN
        RAISE EXCEPTION 'Character not found: %', p_id;
    END IF;

    RETURN v_row.id;
END;
$$;
