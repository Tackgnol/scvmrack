-- Add two new catalog items: Violet Poison and Beechwood Tube,
-- with English and Polish translations.
--
-- Violet Poison hydrates uses dynamically (d4+1) on add — that lookup
-- lives in init/03-functions/get_character_full.sql, which the runner
-- re-applies on every deploy.

INSERT INTO public.equipment (key, tags, value, default_amount, use_effect)
VALUES
    ('equipment.violet-poison',  ARRAY['consumable', 'poison'], 30, NULL, '{"type": "SingleUse"}'::jsonb),
    ('equipment.beechwood-tube', ARRAY['scroll'],               30, 1,    NULL)
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.translations (locale, key, value) VALUES
    ('en', 'equipment.violet-poison',              'A Bottle of Violet Poison'),
    ('en', 'equipment.violet-poison.description',  'Toughness DR14 or 2d10 damage. d4+1 doses.'),
    ('en', 'equipment.beechwood-tube',             'Beechwood Tube'),
    ('en', 'equipment.beechwood-tube.description', 'Contains a foul protean scroll: each dawn it holds a new unclean Power, usable once. The scroll is misinterpreted on a 1-3 on a d20 instead of just a 1.'),

    ('pl', 'equipment.violet-poison',              'Butelka fioletowej trucizny'),
    ('pl', 'equipment.violet-poison.description',  'Wytrzymałość PT14 lub 2k10 obrażeń. k4+1 dawek.'),
    ('pl', 'equipment.beechwood-tube',             'Bukowa tuba'),
    ('pl', 'equipment.beechwood-tube.description', 'Zawiera plugawy zmienny zwój: o każdym świcie zwój nosi nową nieczystą Moc, jednorazową. Zwój jest błędnie odczytany przy wyniku 1-3 na k20, zamiast jedynie 1.')
ON CONFLICT (locale, key) DO NOTHING;
