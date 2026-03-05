-- Seed: Deterministic stat modifiers for optional classes
-- These modifiers are applied when a character possesses the corresponding ability.
-- Mappings follow the MÖRK BORG Bare Bones Edition rules (pages 46-57).

INSERT INTO class_ability_modifiers (class_id, ability_key, value, statistic, exclude, source, notes)
VALUES
    -- Gutterborn Scum (Class 2)
    (
        2,
        'abilities.gutterborn_scum.jester',
        4,
        'agility',
        '[]'::jsonb,
        'Filthy Fingersmith',
        'Pick locks with a DR8 Agility test (standard is DR12, so +4).'
    ),
    (
        2,
        'abilities.gutterborn_scum.spatula',
        4,
        'presence',
        '[]'::jsonb,
        'Abominable Gob Lobber',
        'Roll a DR8 Presence test for accuracy (standard is DR12, so +4).'
    ),
    (
        2,
        'abilities.gutterborn_scum.muck',
        4,
        'presence',
        '[]'::jsonb,
        'Excretal Stealth',
        'DR16 Presence test required to notice you (effectively +4 to stealth Presence).'
    ),
    -- Esoteric Hermit (Class 3)
    (
        3,
        'abilities.esoteric_hermit.book',
        4,
        'presence',
        '[]'::jsonb,
        'Master of Fate',
        'Know the right way with a DR8 Presence test (standard is DR12, so +4).'
    ),
    (
        3,
        'abilities.esoteric_hermit.staff',
        4,
        'presence',
        '[]'::jsonb,
        'Speaker of Truths',
        'The DR of the next test is lowered by 4 (effectively +4 to Presence).'
    ),
    -- Wretched Royalty (Class 4)
    (
        4,
        'abilities.wretched_royalty.servant',
        2,
        'agility',
        '[]'::jsonb,
        'Poltroon the Court Jester',
        'For the first two rounds you and your allies get +2 on attack/defence.'
    ),
    (
        4,
        'abilities.wretched_royalty.servant',
        2,
        'strength',
        '[]'::jsonb,
        'Poltroon the Court Jester',
        'For the first two rounds you and your allies get +2 on attack/defence.'
    ),
    (
        4,
        'abilities.wretched_royalty.horse',
        2,
        'presence',
        '[]'::jsonb,
        'Barbarister the Incredible Horse',
        'Barbarister occasionally adds +2 to Presence tests involving logic and intellect.'
    ),
    -- Heretical Priest (Class 5)
    (
        5,
        'abilities.heretical_priest.breath',
        2,
        'agility',
        '[]'::jsonb,
        'Stolen Mitre',
        'Hard to hit in combat (Defence DR10, standard is DR12, so +2).'
    ),
    (
        5,
        'abilities.heretical_priest.voice',
        2,
        'agility',
        '[]'::jsonb,
        'List of Sins',
        'The list’s owner defends with +2 against any being discovered this way.'
    ),
    -- Occult Herbmaster (Class 6)
    (
        6,
        'abilities.occult_herbmaster.philtre',
        2,
        'presence',
        '[]'::jsonb,
        'Fernor''s Philtre',
        'Gives +2 on Presence tests for D4 hours.'
    ),
    (
        6,
        'abilities.occult_herbmaster.hyphos',
        -2,
        'agility',
        '[]'::jsonb,
        'Hyphos'' Enervating Snuff',
        'Defend with DR14 instead of DR12 (effectively -2 Agility).'
    )
ON CONFLICT (class_id, ability_key, statistic, value, exclude) DO NOTHING;
