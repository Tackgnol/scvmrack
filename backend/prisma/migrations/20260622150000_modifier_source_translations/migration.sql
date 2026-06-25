-- Computed-modifier effect sources were inline English in the catalog `modifiers`
-- JSONB / class_ability_modifiers.source, so the modifier UI showed them untranslated.
-- These rows let get-character-full translate `source` by `modifier.source.<slug>`.
-- Idempotent + guarded so it can run as a Prisma migration (existing DBs) and as
-- seed (fresh DBs, after base catalog is present).
INSERT INTO public.translations (locale, key, value)
SELECT v.locale, v.key, v.value
FROM (VALUES
  ('en', 'modifier.source.mail_armor', 'Mail armor'),
  ('pl', 'modifier.source.mail_armor', 'Kolczuga'),
  ('en', 'modifier.source.plate_armor', 'Plate armor'),
  ('pl', 'modifier.source.plate_armor', 'Zbroja płytowa'),
  ('en', 'modifier.source.scale_armor', 'Scale armor'),
  ('pl', 'modifier.source.scale_armor', 'Zbroja łuskowa'),
  ('en', 'modifier.source.splint_armor', 'Splint armor'),
  ('pl', 'modifier.source.splint_armor', 'Zbroja karacenowa'),
  ('en', 'modifier.source.barbaristers_guidance', 'Barbarister''s guidance'),
  ('pl', 'modifier.source.barbaristers_guidance', 'Pomoc Barbaristera'),
  ('en', 'modifier.source.hyphos_snuff', 'Hyphos snuff'),
  ('pl', 'modifier.source.hyphos_snuff', 'Ożywcza Tabaka Hyphosa'),
  ('en', 'modifier.source.poltroons_annoyance', 'Poltroon''s annoyance'),
  ('pl', 'modifier.source.poltroons_annoyance', 'Wkurw Trzęsidupieca'),
  ('en', 'modifier.source.the_blade_of_your_ancestors', 'The Blade of your Ancestors'),
  ('pl', 'modifier.source.the_blade_of_your_ancestors', 'Klinga Przodków Twych'),
  ('en', 'modifier.source.the_brown_scimitar_of_galgenbeck', 'The Brown Scimitar of Galgenbeck'),
  ('pl', 'modifier.source.the_brown_scimitar_of_galgenbeck', 'Brunatny Bułat Galgenbecku'),
  ('en', 'modifier.source.the_shoe_of_deaths_horse', 'The Shoe of Death''s Horse'),
  ('pl', 'modifier.source.the_shoe_of_deaths_horse', 'Podkowa Chabety Śmierci'),
  ('en', 'modifier.source.abominable_gob_lobber', 'Abominable Gob Lobber'),
  ('pl', 'modifier.source.abominable_gob_lobber', 'Wstrętny Miotacz Plwociny'),
  ('en', 'modifier.source.clumsy_and_dull_witted', 'Clumsy and Dull-witted'),
  ('pl', 'modifier.source.clumsy_and_dull_witted', 'Niezdarny'),
  ('en', 'modifier.source.fernors_philtre', 'Fernor''s Philtre'),
  ('pl', 'modifier.source.fernors_philtre', 'Ekstrakt Fernora'),
  ('en', 'modifier.source.filthy_fingersmith', 'Filthy Fingersmith'),
  ('pl', 'modifier.source.filthy_fingersmith', 'Paskudny Kieszonkowiec'),
  ('en', 'modifier.source.hyphos_enervating_snuff', 'Hyphos'' Enervating Snuff'),
  ('pl', 'modifier.source.hyphos_enervating_snuff', 'Ożywcza Tabaka Hyphosa'),
  ('en', 'modifier.source.stealthy', 'Stealthy'),
  ('pl', 'modifier.source.stealthy', 'Szpicel'),
  ('en', 'modifier.source.stolen_mitre', 'Stolen Mitre'),
  ('pl', 'modifier.source.stolen_mitre', 'Skradziona Mitra')
) AS v(locale, key, value)
WHERE EXISTS (SELECT 1 FROM public.classes LIMIT 1)
ON CONFLICT (locale, key) DO UPDATE SET value = EXCLUDED.value;
