-- Authoritative sync of class_ability_modifiers — the deterministic, always-on
-- numeric test modifiers granted by class abilities. This is the single source of
-- truth; it is re-applied on every deploy (see .woodpecker/deploy.yaml).
--
-- Why a full DELETE + INSERT instead of additive seeds:
--   * 002/003 inserted modifiers with empty `exclude` (so e.g. Filthy Fingersmith
--     wrongly boosted dodge), 004 did a DELETE-all + re-insert that silently
--     dropped Stealthy/Clumsy, and 006 later corrected fingersmith/gob_lobber/
--     mitre and removed the non-deterministic abilities. Re-applying those seeds
--     additively (ON CONFLICT DO NOTHING) can't dedupe rows that differ only by
--     `exclude`, which produced duplicate modifiers in long-lived databases.
--   A delete-all + insert of the canonical set is idempotent and converges any
--   environment (fresh or long-lived) to exactly these rows.
BEGIN;

DELETE FROM class_ability_modifiers;

INSERT INTO class_ability_modifiers (class_id, ability_key, value, statistic, exclude, source, notes)
VALUES
    -- Fanged Deserter
    (1, 'abilities.fanged_deserter.clumsy', -2, 'agility', '["defence"]'::jsonb,
        'Clumsy and Dull-witted', 'Normal Agility tests are DR14 instead of DR12, excluding defence.'),
    -- Gutterborn Scum
    (2, 'abilities.gutterborn_scum.stealthy', 2, 'agility', '[]'::jsonb,
        'Stealthy', 'All Presence and Agility tests have their DR reduced by 2.'),
    (2, 'abilities.gutterborn_scum.stealthy', 2, 'presence', '[]'::jsonb,
        'Stealthy', 'All Presence and Agility tests have their DR reduced by 2.'),
    (2, 'abilities.gutterborn_scum.fingersmith', 4, 'agility',
        '["melee","ranged","defence","cast","ability","heal","buff"]'::jsonb,
        'Filthy Fingersmith', 'Pick locks with a DR8 Agility test. Test contexts only, not combat.'),
    (2, 'abilities.gutterborn_scum.gob_lobber', 4, 'presence',
        '["melee","ranged","defence","cast","ability","heal","buff"]'::jsonb,
        'Abominable Gob Lobber', 'Spit accuracy is a DR8 Presence test. Test contexts only, not standard ranged combat.'),
    -- Heretical Priest
    (5, 'abilities.heretical_priest.mitre', 2, 'agility',
        '["melee","ranged","cast","ability","test","heal","buff"]'::jsonb,
        'Stolen Mitre', 'Hard to hit in combat (Defence DR10). The numeric bonus should only apply to defence.'),
    -- Occult Herbmaster
    (6, 'abilities.occult_herbmaster.philtre', 2, 'presence', '[]'::jsonb,
        'Fernor''s Philtre', 'Gives +2 on Presence tests for D4 hours.'),
    (6, 'abilities.occult_herbmaster.hyphos', -2, 'agility', '[]'::jsonb,
        'Hyphos'' Enervating Snuff', 'Defend with DR14 instead of DR12 (effectively -2 Agility).');

COMMIT;
