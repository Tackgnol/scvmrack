-- Align Occult Herbmaster decoctions on existing deployed databases.
-- Fresh databases receive the same values from init/05-seed/001_game_data.sql.

UPDATE public.equipment
SET tags = CASE
  WHEN key IN ('equipment.red-poison', 'equipment.black-poison') THEN
    ARRAY['consumable', 'poison', 'decoction', 'wywar', 'wywary']
  ELSE
    ARRAY['consumable', 'decoction', 'wywar', 'wywary']
END
WHERE key IN (
  'equipment.red-poison',
  'equipment.ezumiel-vapor',
  'equipment.southern-frog',
  'equipment.elixir-vitalis',
  'equipment.spider-owl-soup',
  'equipment.fernors-philtre',
  'equipment.hyphos-snuff',
  'equipment.black-poison'
);

INSERT INTO public.translations (locale, key, value)
SELECT v.locale, v.key, v.value
FROM (VALUES
  ('en', 'abilities.occult_herbmaster.red_poison', 'Red Poison: Toughness DR12 or -D10 HP.'),
  ('en', 'abilities.occult_herbmaster.ezumiel', 'Ezumiel''s Vapor: Pass a DR14 test or severe (and arguably fun) hallucinations for D4 hours.'),
  ('en', 'abilities.occult_herbmaster.frog', 'Southern Frog Stew: Vomit for D4 hours, pass a DR14 test or you can do nothing else.'),
  ('en', 'abilities.occult_herbmaster.vitalis', 'Elixir Vitalis: Heals D6 HP and stops infection. Can be habit-forming.'),
  ('en', 'abilities.occult_herbmaster.soup', 'Spider-Owl Soup: See in darkness, climb on walls for 30 minutes.'),
  ('en', 'abilities.occult_herbmaster.philtre', 'Fernor''s Philtre: Translucent oil, must be dabbed right into the eye. Heals infection and gives +2 on Presence tests for D4 hours.'),
  ('en', 'abilities.occult_herbmaster.hyphos', 'Hyphos'' Enervating Snuff: Berserk! Two attacks per round but defend with DR14. Lasts one fight. Must be snorted, causes sneezing.'),
  ('en', 'abilities.occult_herbmaster.black_poison', 'Black Poison: Toughness DR14 or -D6 HP and blinded for one hour.'),
  ('en', 'equipment.red-poison', 'Red Poison'),
  ('en', 'equipment.red-poison.description', 'Toughness DR12 or -D10 HP.'),
  ('en', 'equipment.ezumiel-vapor', 'Ezumiel''s Vapor'),
  ('en', 'equipment.ezumiel-vapor.description', 'Pass a DR14 test or severe (and arguably fun) hallucinations for D4 hours.'),
  ('en', 'equipment.southern-frog', 'Southern Frog Stew'),
  ('en', 'equipment.southern-frog.description', 'Vomit for D4 hours, pass a DR14 test or you can do nothing else.'),
  ('en', 'equipment.elixir-vitalis', 'Elixir Vitalis'),
  ('en', 'equipment.elixir-vitalis.description', 'Heals D6 HP and stops infection. Can be habit-forming.'),
  ('en', 'equipment.spider-owl-soup', 'Spider-Owl Soup'),
  ('en', 'equipment.spider-owl-soup.description', 'See in darkness, climb on walls for 30 minutes.'),
  ('en', 'equipment.fernors-philtre', 'Fernor''s Philtre'),
  ('en', 'equipment.fernors-philtre.description', 'Translucent oil, must be dabbed right into the eye. Heals infection and gives +2 on Presence tests for D4 hours.'),
  ('en', 'equipment.hyphos-snuff', 'Hyphos'' Enervating Snuff'),
  ('en', 'equipment.hyphos-snuff.description', 'Berserk! Two attacks per round but defend with DR14. Lasts one fight. Must be snorted, causes sneezing.'),
  ('en', 'equipment.black-poison', 'Black Poison'),
  ('en', 'equipment.black-poison.description', 'Toughness DR14 or -D6 HP and blinded for one hour.'),
  ('pl', 'equipment.red-poison', 'czerwona trucizna'),
  ('pl', 'equipment.red-poison.description', 'Wytrzymałość ST12 lub -k10 PŻ.'),
  ('pl', 'equipment.ezumiel-vapor', 'Inhalacje Ezumielskie'),
  ('pl', 'equipment.ezumiel-vapor.description', 'Zdaj test o ST14 lub doświadczasz poważnych (i nawet zabawnych) halucynacji przez k4 godziny.'),
  ('pl', 'equipment.southern-frog', 'Potrawka z Żaby Południowej'),
  ('pl', 'equipment.southern-frog.description', 'Rzygasz przez k4 godziny. Zdaj test o DR14 albo nie możesz robić nic innego.'),
  ('pl', 'equipment.elixir-vitalis', 'Eliksir Życia'),
  ('pl', 'equipment.elixir-vitalis.description', 'Leczy k6 PŻ i usuwa infekcję. Potencjalnie uzależniający.'),
  ('pl', 'equipment.spider-owl-soup', 'Rosół z Sowopająka'),
  ('pl', 'equipment.spider-owl-soup.description', 'Widzisz w ciemności i możesz łazić po ścianach przez pół godziny.'),
  ('pl', 'equipment.fernors-philtre', 'Ekstrakt Fernora'),
  ('pl', 'equipment.fernors-philtre.description', 'Bezbarwny olejek aplikowany bezpośrednio na oko. Leczy infekcję i dodaje +2 do rzutów na Opanowanie przez k4 godziny.'),
  ('pl', 'equipment.hyphos-snuff', 'Ożywcza Tabaka Hyphosa'),
  ('pl', 'equipment.hyphos-snuff.description', 'Furia! Dwa ataki na rundę, ale bronisz się na ST14. Trwa jedną walkę. Wciągana nosem, powoduje kichanie.'),
  ('pl', 'equipment.black-poison', 'Czarna Trucizna'),
  ('pl', 'equipment.black-poison.description', 'Wytrzymałość ST14 lub -k6 PŻ i ślepota przez godzinę.')
) AS v(locale, key, value)
WHERE EXISTS (SELECT 1 FROM public.equipment WHERE key = 'equipment.ezumiel-vapor')
ON CONFLICT (locale, key) DO UPDATE SET value = EXCLUDED.value;
