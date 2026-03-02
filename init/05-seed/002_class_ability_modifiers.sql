-- Seed: Class ability modifiers inferred from MÖRK BORG Bare Bones (pages 46-57)
-- Only deterministic, always-on numeric test modifiers are included.

INSERT INTO class_ability_modifiers (class_id, ability_key, value, statistic, exclude, source, notes)
VALUES
    (
        1,
        'abilities.fanged_deserter.clumsy',
        -2,
        'agility',
        '["defence"]'::jsonb,
        'Clumsy and Dull-witted',
        'Normal Agility tests are DR14 instead of DR12, excluding defence.'
    ),
    (
        2,
        'abilities.gutterborn_scum.stealthy',
        2,
        'agility',
        '[]'::jsonb,
        'Stealthy',
        'All Presence and Agility tests have DR reduced by 2.'
    ),
    (
        2,
        'abilities.gutterborn_scum.stealthy',
        2,
        'presence',
        '[]'::jsonb,
        'Stealthy',
        'All Presence and Agility tests have DR reduced by 2.'
    )
ON CONFLICT (class_id, ability_key, statistic, value, exclude) DO NOTHING;
