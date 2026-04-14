-- Migration: consolidate release seed alignment for equipment and class starting options.
-- Safe to run multiple times.
--
-- Notes:
-- - This intentionally covers catalog/value/name/description alignment.
-- - Consumable dose hydration for manually added items is still a separate behavior change.
-- - Preserved corpse uses an integer approximation because the schema cannot store 66 + d6 directly.

BEGIN;

UPDATE public.equipment
SET value = 8
WHERE key = 'equipment.wooden-crucifix';

UPDATE public.equipment
SET value = 4,
    exp = false
WHERE key = 'equipment.salt';

INSERT INTO public.equipment (
    key, tags, amount_min, amount_max, mod, hp_min, hp_max, hp_mod, value, exp, roll, multiple, ammo_type, default_amount, use_effect
) VALUES
    ('equipment.dried-food', '{food,consumable}', NULL, NULL, NULL, NULL, NULL, NULL, 1, false, NULL, 1, NULL, NULL, NULL),
    ('equipment.lantern-oil', '{tool,lighting,consumable}', NULL, NULL, NULL, NULL, NULL, NULL, 5, false, NULL, 1, NULL, NULL, NULL),
    ('equipment.iron-nails', '{tool,metal}', NULL, NULL, NULL, NULL, NULL, NULL, 10, false, NULL, 1, NULL, NULL, NULL),
    ('equipment.ladder', '{tool}', NULL, NULL, NULL, NULL, NULL, NULL, 7, false, NULL, 1, NULL, NULL, NULL),
    ('equipment.large-iron-hook', '{tool,metal}', NULL, NULL, NULL, NULL, NULL, NULL, 9, false, NULL, 1, NULL, NULL, NULL),
    ('equipment.mattress', '{camping}', NULL, NULL, NULL, NULL, NULL, NULL, 3, false, NULL, 1, NULL, NULL, NULL),
    ('equipment.metal-file', '{tool,metal}', NULL, NULL, NULL, NULL, NULL, NULL, 10, false, NULL, 1, NULL, NULL, NULL),
    ('equipment.muzzle', '{tool}', NULL, NULL, NULL, NULL, NULL, NULL, 6, false, NULL, 1, NULL, NULL, NULL),
    ('equipment.preserved-corpse', '{oddity}', NULL, NULL, NULL, NULL, NULL, NULL, 69, false, NULL, 1, NULL, NULL, NULL),
    ('equipment.waterskin', '{camping,consumable}', NULL, NULL, NULL, NULL, NULL, NULL, 4, false, NULL, 1, NULL, NULL, NULL),
    ('equipment.crumpled-monster-mask', '{special,wearable}', NULL, NULL, NULL, NULL, NULL, NULL, 0, false, NULL, 1, NULL, NULL, NULL),
    ('equipment.wizard-teeth', '{special,consumable}', NULL, NULL, NULL, NULL, NULL, NULL, 0, false, NULL, 1, NULL, NULL, NULL)
ON CONFLICT (key) DO UPDATE SET
    tags = EXCLUDED.tags,
    value = EXCLUDED.value,
    exp = EXCLUDED.exp,
    multiple = EXCLUDED.multiple;

INSERT INTO public.translations (locale, key, value) VALUES
    ('en', 'equipment.lockpicks', 'Lockpicks'),
    ('en', 'equipment.toolbox.description', '10 nails, tongs, hammer, small saw'),
    ('en', 'equipment.salt', 'Salt'),
    ('en', 'equipment.dried-food', 'Dried Food'),
    ('en', 'equipment.dried-food.description', '1 day'),
    ('en', 'equipment.lantern-oil', 'Lantern Oil'),
    ('en', 'equipment.lantern-oil.description', 'Presence + 6 hours'),
    ('en', 'equipment.iron-nails', 'Iron Nails'),
    ('en', 'equipment.iron-nails.description', '10 nails'),
    ('en', 'equipment.ladder', 'Ladder'),
    ('en', 'equipment.ladder.description', ''),
    ('en', 'equipment.large-iron-hook', 'Large Iron Hook'),
    ('en', 'equipment.large-iron-hook.description', ''),
    ('en', 'equipment.mattress', 'Mattress'),
    ('en', 'equipment.mattress.description', ''),
    ('en', 'equipment.metal-file', 'Metal File'),
    ('en', 'equipment.metal-file.description', ''),
    ('en', 'equipment.muzzle', 'Muzzle'),
    ('en', 'equipment.muzzle.description', ''),
    ('en', 'equipment.preserved-corpse', 'Preserved Corpse'),
    ('en', 'equipment.preserved-corpse.description', 'Priced as 66+d6 silver in the rules'),
    ('en', 'equipment.waterskin', 'Waterskin'),
    ('en', 'equipment.waterskin.description', '4 days of water'),
    ('en', 'equipment.crumpled-monster-mask', 'Crumpled Monster Mask'),
    ('en', 'equipment.crumpled-monster-mask.description', 'Strikes primitive fear into lesser creatures like goblins, gnoums and children. While worn, they check Morale every round.'),
    ('en', 'equipment.wizard-teeth', 'Wizard Teeth'),
    ('en', 'equipment.wizard-teeth.description', 'Four weird teeth rattle within a blackened pouch. Before battle roll a D6 for each one. For every 6 one of your attacks deals maximum damage.'),
    ('pl', 'equipment.lockpicks', 'Wytrychy'),
    ('pl', 'equipment.toolbox.description', '10 gwoździ, szczypce, młotek, mała piła'),
    ('pl', 'equipment.salt', 'Sól'),
    ('pl', 'equipment.dried-food', 'Suszona żywność'),
    ('pl', 'equipment.dried-food.description', '1 dzień'),
    ('pl', 'equipment.lantern-oil', 'Oliwa do latarni'),
    ('pl', 'equipment.lantern-oil.description', 'Obecność + 6 godzin'),
    ('pl', 'equipment.iron-nails', 'Żelazne gwoździe'),
    ('pl', 'equipment.iron-nails.description', '10 gwoździ'),
    ('pl', 'equipment.ladder', 'Drabina'),
    ('pl', 'equipment.ladder.description', ''),
    ('pl', 'equipment.large-iron-hook', 'Duży żelazny hak'),
    ('pl', 'equipment.large-iron-hook.description', ''),
    ('pl', 'equipment.mattress', 'Materac'),
    ('pl', 'equipment.mattress.description', ''),
    ('pl', 'equipment.metal-file', 'Metalowy pilnik'),
    ('pl', 'equipment.metal-file.description', ''),
    ('pl', 'equipment.muzzle', 'Kaganiec'),
    ('pl', 'equipment.muzzle.description', ''),
    ('pl', 'equipment.preserved-corpse', 'Zakonserwowane zwłoki'),
    ('pl', 'equipment.preserved-corpse.description', 'W zasadach kosztuje 66+d6 srebra'),
    ('pl', 'equipment.waterskin', 'Bukłak'),
    ('pl', 'equipment.waterskin.description', '4 dni wody'),
    ('pl', 'equipment.crumpled-monster-mask', 'Pognieciona maska potwora'),
    ('pl', 'equipment.crumpled-monster-mask.description', 'Budzi pierwotny strach w mniejszych stworzeniach, takich jak gobliny, gnoumy i dzieci. Kiedy jest noszona, co rundę sprawdzają morale.'),
    ('pl', 'equipment.wizard-teeth', 'Zęby czarodzieja'),
    ('pl', 'equipment.wizard-teeth.description', 'Cztery dziwne zęby grzechoczą w poczerniałym woreczku. Przed bitwą rzuć d6 za każdy z nich. Za każdą 6 jeden z twoich ataków zadaje maksymalne obrażenia.')
ON CONFLICT (locale, key) DO UPDATE SET
    value = EXCLUDED.value;

-- Fanged Deserter alignment
UPDATE public.weapons
SET modifiers = '[
  {"value": 2, "source": "The Brown Scimitar of Galgenbeck", "exclude": ["defence", "test", "heal", "cast", "buff"], "statistic": "strength"},
  {"value": 2, "source": "The Brown Scimitar of Galgenbeck", "exclude": ["melee", "ranged", "test", "heal", "cast", "ability", "buff"], "statistic": "agility"}
]'::jsonb
WHERE key = 'weapons.brown-scimitar';

UPDATE public.weapons
SET modifiers = '[
  {"value": 2, "source": "The Shoe of Death''s Horse", "exclude": ["defence", "melee", "test", "heal", "cast", "ability", "buff"], "statistic": "presence"}
]'::jsonb
WHERE key = 'weapons.shoe-of-death';

UPDATE public.classes
SET random_abilities = $$[
  {"name": "Crumpled Monster Mask", "gainItem": "Crumpled Monster Mask", "description": "Strikes primitive fear into lesser creatures like goblins, gnoums and children. While worn, they check Morale every round."},
  {"name": "The Brown Scimitar of Galgenbeck", "gainItem": "The Brown Scimitar of Galgenbeck", "description": "A stinking sword you pulled from a military shit-ditch. D6 damage. DR10 attack and defence while you wield it. 1 in 6 chance a wounded enemy is smitten with potent sepsis, dying in 10 minutes."},
  {"name": "Wizard Teeth", "gainItem": "Wizard Teeth", "description": "Four weird teeth rattle within a blackened pouch. Before battle roll a D6 for each one. For every 6 one of your attacks deals maximum damage."},
  {"name": "Old Sigürd's Sling", "gainItem": "Old Sigürd's Sling", "description": "Sigürd was the strongest man whose throat you ever gnawed. Woven from his long grey hair, this sling has never failed you. 2D4 damage, requires fist-sized rocks which, perhaps regrettably, are everywhere."},
  {"name": "Ancient Gore-Hound", "gainPet": "Ancient Gore-Hound", "description": "Asthmatic, deluded and on its last legs, this wizened creature still has a superb nose and can sniffle up treasure in the most disgusting debris. Attacks with DR10 (bite D6). Defends with DR12, 10 HP. Becomes frenzied around goblins and berserkers."},
  {"name": "The Shoe of Death's Horse", "gainItem": "The Shoe of Death's Horse", "description": "It looks normal but since finding it in an obscure crypt you are convinced this shoe came from the horse of Death himself. In your hands it hits with DR10, D4 damage. 1 in 6 chance the shoe smashes the skull, instantly killing small-to-medium sized creatures. The shoe returns to your hand like a boomerang."}
]$$::jsonb
WHERE id = 1;

-- Gutterborn Scum alignment
UPDATE public.classes
SET random_abilities = $$[
  {"name": "Coward’s Jab", "description": "When attacking by surprise test Agility DR10. On a success you automatically hit once with a light one-handed weapon, dealing normal damage +3."},
  {"name": "Filthy Fingersmith", "gainItem": "Lockpicks", "description": "Your snaky little digits get into pockets and pick locks with a DR8 Agility test. You also begin with lockpicks!"},
  {"name": "Abominable Gob Lobber", "description": "Your phlegm is viscous, lumpy, vile and ballistically accurate at short range. You can spit D2 times during a fight. Roll a DR8 Presence test for accuracy. Targets are blinded, retching and vomiting for D4 rounds. Anyone witnessing this, friend and foe, must make a Toughness test to not also vomit. PCs test DR10 and enemies DR12."},
  {"name": "Escaping Fate", "description": "Every time you use an omen there is a 50% chance it is not spent."},
  {"name": "Excretal Stealth", "description": "You have an astounding, almost preternatural ability to hide in muck, debris and filth. When hidden in these conditions a DR16 Presence test is required to notice you."},
  {"name": "Dodging Death", "description": "You are so unpleasant, irrelevant, disgusting and vile even Death would rather avoid you if it can. On death, if there is even the slightest possibility that you survived, there is a 50% chance that you did. If successful, after 10 rounds you pop back up with D4 HP and an unlikely explanation of your escape."}
]$$::jsonb
WHERE id = 2;

DELETE FROM public.class_ability_modifiers
WHERE class_id = 2
  AND ability_key IN (
    'abilities.gutterborn_scum.fingersmith',
    'abilities.gutterborn_scum.gob_lobber',
    'abilities.gutterborn_scum.stealth'
  );

INSERT INTO public.class_ability_modifiers (class_id, ability_key, value, statistic, exclude, source, notes)
VALUES
    (
        2,
        'abilities.gutterborn_scum.fingersmith',
        4,
        'agility',
        '["melee","ranged","defence","cast","ability","heal","buff"]'::jsonb,
        'Filthy Fingersmith',
        'Pick locks with a DR8 Agility test. This should only help test contexts, not combat.'
    ),
    (
        2,
        'abilities.gutterborn_scum.gob_lobber',
        4,
        'presence',
        '["melee","ranged","defence","cast","ability","heal","buff"]'::jsonb,
        'Abominable Gob Lobber',
        'Spit accuracy is a DR8 Presence test. This should only help test contexts, not standard ranged combat.'
    )
ON CONFLICT (class_id, ability_key, statistic, value, exclude) DO NOTHING;

-- Esoteric Hermit alignment
UPDATE public.classes
SET random_abilities = $$[
  {"name": "Master of Fate", "description": "What use are maps when the substance of causality itself is open to you? You know the right way with a DR8 Presence test."},
  {"name": "Book of Boiling Blood", "description": "You may open and read from this book once a day. Your enemy must make a DR12 test to prevent this. If they fail D2 Berserker-slayers appear from the depths of a forgotten dimension of blood. Roll a D6. On a 1-4 these creatures fight alongside you. On a 5-6 they turn on you, attempting to kill you and destroy the book. After the battle they return to their imprisonment."},
  {"name": "Speaker of Truths", "description": "Twice per day use your wisdom, knowledge, advice and inner calm to bring clarity to a creature of your choice. The DR of the next test they undertake is lowered by 4."},
  {"name": "Initiate of the Invisible College", "description": "Once per day you may summon D2 scrolls, whose power can be used only once. Roll a D4, on a 1-2 the scrolls are sacred, on a 3-4, unclean. If the scrolls are not used before sunrise they turn to ash."},
  {"name": "Bard of the Undying", "description": "You learnt your melodies in the Otherworld. The music of your Harp gives +D4 on reaction rolls."},
  {"name": "Hawk as Weapon", "gainPet": "Hawk", "description": "Your crafty almost-intelligent hawk is loyal only to you. Even without shared language, you understand its cries as it keeps watch, scouts and swoops to attack foes. Attacks/defence DR10 (claws/bite D4), HP 8."}
]$$::jsonb
WHERE id = 3;

DELETE FROM public.class_ability_modifiers
WHERE class_id = 3
  AND ability_key IN (
    'abilities.esoteric_hermit.master_of_fate',
    'abilities.esoteric_hermit.speaker'
  );

-- Wretched Royalty alignment
UPDATE public.classes
SET random_abilities = $$[
  {"name": "The Blade of your Ancestors", "gainItem": "The Blade of your Ancestors", "description": "This magnificent and clearly magical talking sword is foppish, unreliable and quietly despises you. It taunts your failures and, if continually disappointed, develops a 1 in 6 chance to accidentally attack you or your companions. Deals D6+1 damage. Attack/Defence DR is 10."},
  {"name": "Poltroon the Court Jester", "description": "While practically useless, personally irritating and an emotional drain, Poltroon’s capering actually makes enemies lose their focus in combat. For the first two rounds you and your allies get +2 on attack/defence."},
  {"name": "Barbarister the Incredible Horse", "gainPet": "Barbarister the Incredible Horse", "description": "Barbarister is magical, intelligent, arrogant and vain. He can also talk. If you can persuade him to care, Barbarister occasionally adds +2 to Presence tests involving logic and intellect. The horse may be smarter than you and is quite aware of this."},
  {"name": "Hamfund the Squire", "gainPet": "Hamfund the Squire", "description": "This intensely cowardly servant acts only as guardian for the scabbard of the cursed sword Eurekia. Once per combat, if Ham can be found, Eurekia may be drawn. The sword does 2D6 damage, and for every swing of Eurekia roll a D6. On a 1 the squire is slain and Eurekia vanishes forever."},
  {"name": "The Snake-Skin Gift", "gainItem": "The Snake-Skin Gift", "description": "An expensive sandalwood box bound in snakeskin. It contains a seemingly ordinary dagger, wrapped in silk. The dagger does D4 damage but on a 1 the target dies immediately of deadly poison weeping from the blade."},
  {"name": "Horn of the Schleswig Lords", "description": "Once per day release a blare from this dented old trumpet and test Presence DR12. One creature may make their next non-combat test an automatic success."}
]$$::jsonb
WHERE id = 4;

DELETE FROM public.class_ability_modifiers
WHERE class_id = 4
  AND ability_key IN (
    'abilities.wretched_royalty.poltroon',
    'abilities.wretched_royalty.barbarister'
  );

-- Heretical Priest alignment
UPDATE public.classes
SET random_abilities = $$[
  {"name": "Sacred Shepherd’s Crook", "gainItem": "Sacred Shepherd’s Crook", "description": "Its head a hook of human bone inscribed with overlapping anti-prayers. This crook hooks through other worlds. Staff does 2D4 damage except to faithless humans."},
  {"name": "Stolen Mitre", "description": "While wearing this holy hat the priest’s vile body fades, becoming hard to hit in combat (Defence DR10). If pulled over the ears outside of battle the priest becomes nearly invisible, testing stealth against DR8."},
  {"name": "List of Sins", "description": "A long and accurate document cross-referenced against reality to discover unseen evil-doers. Successful Presence DR10: A strange light surrounds evil creatures. The list’s owner defends with +2 against any being discovered this way."},
  {"name": "The Blasphemous Nechrubel Bible", "description": "So intensely blasphemous even the Priests themselves can only peruse it once per day. When read, roll a die. Even result: For the rest of the day PCs heal D4 HP after just five minutes of rest. Odd result: The priest is plagued by demonic hallucinations. The DM may invent D3 things that only the Priest can see and describe them to the player as if true. This effect ends with sunrise."},
  {"name": "Stones taken from Thel-Emas’ lost temple", "description": "Cast the stones on the ground. Their pattern reveals if danger lurks in an adjacent room. The stones can lie. The priest tests Presence DR10 to see if they are true but after failing they cannot test again until the sun has set."},
  {"name": "(Wrong Jesus) Crucifix", "description": "The crucifix can be used in encounters with the undead as well as lesser trolls and goblins. Check morale, add or subtract the priest’s Presence modifier, to see if the creatures bow and kindly remove themselves."}
]$$::jsonb
WHERE id = 5;

DELETE FROM public.class_ability_modifiers
WHERE class_id = 5
  AND ability_key IN (
    'abilities.heretical_priest.mitre',
    'abilities.heretical_priest.sins'
  );

INSERT INTO public.class_ability_modifiers (class_id, ability_key, value, statistic, exclude, source, notes)
VALUES
    (
        5,
        'abilities.heretical_priest.mitre',
        2,
        'agility',
        '["melee","ranged","cast","ability","test","heal","buff"]'::jsonb,
        'Stolen Mitre',
        'Hard to hit in combat (Defence DR10). The numeric bonus should only apply to defence.'
    )
ON CONFLICT (class_id, ability_key, statistic, value, exclude) DO NOTHING;

INSERT INTO public.translations (locale, key, value) VALUES
    ('en', 'weapons.brown-scimitar.description', 'A stinking sword you pulled from a military shit-ditch. D6 damage. DR10 attack and defence while you wield it.'),
    ('en', 'weapons.sigurd-sling.description', 'Sigürd was the strongest man whose throat you ever gnawed. Woven from his long grey hair, this sling has never failed you. 2D4 damage.'),
    ('en', 'weapons.shoe-of-death.description', 'It looks normal, but in your hands it hits with DR10, D4 damage, and returns like a boomerang.'),
    ('en', 'pets.gore-hound.description', 'Asthmatic, deluded and on its last legs, but still has a superb nose for treasure. Frenzied around goblins and berserkers.'),
    ('en', 'abilities.fanged_deserter.mask', 'Monster Mask: Strikes primitive fear into lesser creatures like goblins, gnoums and children. While worn, they check Morale every round.'),
    ('en', 'abilities.fanged_deserter.scimitar', 'The Brown Scimitar of Galgenbeck: A stinking sword you pulled from a military shit-ditch. D6 damage. DR10 attack and defence while you wield it. 1 in 6 chance a wounded enemy is smitten with potent sepsis, dying in 10 minutes.'),
    ('en', 'abilities.fanged_deserter.teeth', 'Wizard Teeth: Four weird teeth rattle within a blackened pouch. Before battle roll a D6 for each one. For every 6 one of your attacks deals maximum damage.'),
    ('en', 'abilities.fanged_deserter.sling', 'Old Sigürd''s Sling: Sigürd was the strongest man whose throat you ever gnawed. Woven from his long grey hair, this sling has never failed you. 2D4 damage, requires fist-sized rocks which, perhaps regrettably, are everywhere.'),
    ('en', 'abilities.fanged_deserter.hound', 'Ancient Gore-Hound: Asthmatic, deluded and on its last legs, this wizened creature still has a superb nose and can sniffle up treasure in the most disgusting debris. Attacks with DR10 (bite D6). Defends with DR12, 10 HP. Becomes frenzied around goblins and berserkers.'),
    ('en', 'abilities.fanged_deserter.shoe', 'The Shoe of Death''s Horse: It looks normal but since finding it in an obscure crypt you are convinced this shoe came from the horse of Death himself. In your hands it hits with DR10, D4 damage. 1 in 6 chance the shoe smashes the skull, instantly killing small-to-medium sized creatures. The shoe returns to your hand like a boomerang.'),
    ('en', 'abilities.gutterborn_scum.jab', 'Coward’s Jab: When attacking by surprise test Agility DR10. On a success you automatically hit once with a light one-handed weapon, dealing normal damage +3.'),
    ('en', 'abilities.gutterborn_scum.fingersmith', 'Filthy Fingersmith: Your snaky little digits get into pockets and pick locks with a DR8 Agility test. You also begin with lockpicks!'),
    ('en', 'abilities.gutterborn_scum.gob_lobber', 'Abominable Gob Lobber: Your phlegm is viscous, lumpy, vile and ballistically accurate at short range. You can spit D2 times during a fight. Roll a DR8 Presence test for accuracy. Targets are blinded, retching and vomiting for D4 rounds. Anyone witnessing this, friend and foe, must make a Toughness test to not also vomit. PCs test DR10 and enemies DR12.'),
    ('en', 'abilities.gutterborn_scum.fate', 'Escaping Fate: Every time you use an omen there is a 50% chance it is not spent.'),
    ('en', 'abilities.gutterborn_scum.stealth', 'Excretal Stealth: You have an astounding, almost preternatural ability to hide in muck, debris and filth. When hidden in these conditions a DR16 Presence test is required to notice you.'),
    ('en', 'abilities.gutterborn_scum.dodging', 'Dodging Death: You are so unpleasant, irrelevant, disgusting and vile even Death would rather avoid you if it can. On death, if there is even the slightest possibility that you survived, there is a 50% chance that you did. If successful, after 10 rounds you pop back up with D4 HP and an unlikely explanation of your escape.'),
    ('en', 'abilities.esoteric_hermit.master_of_fate', 'Master of Fate: What use are maps when the substance of causality itself is open to you? You know the right way with a DR8 Presence test.'),
    ('en', 'abilities.esoteric_hermit.book', 'Book of Boiling Blood: You may open and read from this book once a day. Your enemy must make a DR12 test to prevent this. If they fail D2 Berserker-slayers appear from the depths of a forgotten dimension of blood. Roll a D6. On a 1-4 these creatures fight alongside you. On a 5-6 they turn on you, attempting to kill you and destroy the book. After the battle they return to their imprisonment.'),
    ('en', 'abilities.esoteric_hermit.speaker', 'Speaker of Truths: Twice per day use your wisdom, knowledge, advice and inner calm to bring clarity to a creature of your choice. The DR of the next test they undertake is lowered by 4.'),
    ('en', 'abilities.esoteric_hermit.initiate', 'Initiate of the Invisible College: Once per day you may summon D2 scrolls, whose power can be used only once. Roll a D4, on a 1-2 the scrolls are sacred, on a 3-4, unclean. If the scrolls are not used before sunrise they turn to ash.'),
    ('en', 'abilities.esoteric_hermit.bard', 'Bard of the Undying: You learnt your melodies in the Otherworld. The music of your Harp gives +D4 on reaction rolls.'),
    ('en', 'abilities.esoteric_hermit.hawk', 'Hawk as Weapon: Your crafty almost-intelligent hawk is loyal only to you. Even without shared language, you understand its cries as it keeps watch, scouts and swoops to attack foes. Attacks/defence DR10 (claws/bite D4), HP 8.'),
    ('en', 'pets.hawk.description', 'Your crafty almost-intelligent hawk is loyal only to you. Even without shared language, you understand its cries as it keeps watch, scouts and swoops to attack foes. Attacks/defence DR10 (claws/bite D4), HP 8.')
ON CONFLICT (locale, key) DO UPDATE SET
    value = EXCLUDED.value;

INSERT INTO public.translations (locale, key, value) VALUES
    ('pl', 'weapons.brown-scimitar.description', 'Cuchnący miecz wyciągnięty z wojskowego rowu kloacznego. d6 obrażeń. PT10 do ataku i obrony, gdy go dzierżysz.'),
    ('pl', 'weapons.sigurd-sling.description', 'Sigürd był najsilniejszym człowiekiem, któremu kiedykolwiek przegryzłeś gardło. Zapleciona z jego długich siwych włosów, ta proca nigdy cię nie zawiodła. 2d4 obrażeń.'),
    ('pl', 'weapons.shoe-of-death.description', 'Wygląda normalnie, ale w twoich rękach uderza z PT10, d4 obrażeń i wraca jak bumerang.'),
    ('pl', 'pets.gore-hound.description', 'Astmatyczne, obłąkane i ledwo żywe stworzenie, ale wciąż ma genialny nos do skarbów. Wpada w szał przy goblinach i berserkerach.'),
    ('pl', 'abilities.fanged_deserter.mask', 'Maska Potwora: Budzi pierwotny strach w mniejszych stworzeniach, takich jak gobliny, gnoumy i dzieci. Kiedy jest noszona, co rundę sprawdzają morale.'),
    ('pl', 'abilities.fanged_deserter.scimitar', 'Brązowy Sejmitar z Galgenbeck: Cuchnący miecz wyciągnięty z wojskowego rowu kloacznego. d6 obrażeń. PT10 do ataku i obrony, gdy go dzierżysz. 1 na 6 szansy, że ranny wróg umrze na sepsę w 10 minut.'),
    ('pl', 'abilities.fanged_deserter.teeth', 'Zęby Czarodzieja: Cztery dziwne zęby grzechoczą w poczerniałym woreczku. Przed bitwą rzuć d6 za każdy z nich. Za każdą 6 jeden z twoich ataków zadaje maksymalne obrażenia.'),
    ('pl', 'abilities.fanged_deserter.sling', 'Proca Starego Sigürda: Sigürd był najsilniejszym człowiekiem, któremu kiedykolwiek przegryzłeś gardło. Zapleciona z jego długich siwych włosów, ta proca nigdy cię nie zawiodła. 2d4 obrażeń, wymaga kamieni wielkości pięści, których wszędzie pełno.'),
    ('pl', 'abilities.fanged_deserter.hound', 'Starożytny Ogar Krwi: Astmatyczne, obłąkane i ledwo żywe stworzenie, ale wciąż ma genialny nos i potrafi wywęszyć skarb w najbardziej obrzydliwych śmieciach. Atak PT10 (ugryzienie d6). Obrona PT12, 10 PŻ. Wpada w szał przy goblinach i berserkerach.'),
    ('pl', 'abilities.fanged_deserter.shoe', 'Podkowa Konia Śmierci: Wygląda normalnie, ale odkąd znalazłeś ją w zapomnianej krypcie, jesteś przekonany, że należała do konia samej Śmierci. W twoich rękach uderza z PT10, d4 obrażeń. 1 na 6 szansy na natychmiastowe zmiażdżenie czaszki małym i średnim stworzeniom. Wraca do ręki jak bumerang.'),
    ('pl', 'abilities.gutterborn_scum.jab', 'Cios Tchórza: Przy ataku z zaskoczenia testuj Zwinność PT10. Sukces oznacza automatyczne trafienie lekką bronią jednoręczną z obrażeniami +3.'),
    ('pl', 'abilities.gutterborn_scum.fingersmith', 'Zwinne Paluszki: Twoje żmijowate palce dostają się do kieszeni i zamków przy teście Zwinności PT8. Zaczynasz też z wytrychami!'),
    ('pl', 'abilities.gutterborn_scum.gob_lobber', 'Obrzydliwy Spluwacz: Twoja flegma jest lepka, grudkowata, ohydna i zaskakująco celna na krótki dystans. Możesz pluć D2 razy podczas walki. Test Obecności PT8 określa celność. Cele są oślepione, dławią się i wymiotują przez D4 rundy. Każdy świadek, wróg lub sojusznik, musi zdać test Wytrzymałości, by samemu nie zwymiotować. BG testują PT10, wrogowie PT12.'),
    ('pl', 'abilities.gutterborn_scum.fate', 'Ucieczka Przeznaczeniu: Za każdym razem, gdy używasz omenu, istnieje 50% szans, że nie zostanie on zużyty.'),
    ('pl', 'abilities.gutterborn_scum.stealth', 'Gówniane Skradanie się: Masz zdumiewającą, niemal nadnaturalną zdolność ukrywania się w błocie, śmieciach i brudzie. Gdy jesteś ukryty w takich warunkach, potrzeba testu Obecności PT16, by cię zauważyć.'),
    ('pl', 'abilities.gutterborn_scum.dodging', 'Unikanie Śmierci: Jesteś tak odpychający, nieistotny, obrzydliwy i plugawy, że nawet Śmierć wolałaby cię ominąć. Przy śmierci, jeśli istnieje choć cień szansy, że przeżyłeś, masz 50% szans, że tak właśnie było. Jeśli się uda, po 10 rundach wracasz z D4 PŻ i mało wiarygodnym wyjaśnieniem swojej ucieczki.'),
    ('pl', 'abilities.esoteric_hermit.master_of_fate', 'Mistrz Przeznaczenia: Jaki pożytek z map, skoro sama tkanka przyczynowości stoi przed tobą otworem? Znasz właściwą drogę przy teście Obecności PT8.'),
    ('pl', 'abilities.esoteric_hermit.book', 'Księga Wrzącej Krwi: Raz dziennie możesz otworzyć tę księgę i z niej czytać. Twój wróg musi zdać test PT12, aby temu zapobiec. Jeśli obleje, z głębin zapomnianego wymiaru krwi wyłaniają się D2 pogromcy berserkerów. Rzuć D6. Na 1-4 walczą u twego boku. Na 5-6 zwracają się przeciw tobie, próbując cię zabić i zniszczyć księgę. Po bitwie wracają do swego więzienia.'),
    ('pl', 'abilities.esoteric_hermit.speaker', 'Mówca Prawd: Dwa razy dziennie użyj swojej mądrości, wiedzy, rady i wewnętrznego spokoju, by przynieść jasność wybranej istocie. PT jej następnego testu jest obniżone o 4.'),
    ('pl', 'abilities.esoteric_hermit.initiate', 'Inicjowany Niewidzialnego Kolegium: Raz dziennie możesz przyzwać D2 zwoje, których moc można wykorzystać tylko raz. Rzuć D4: na 1-2 zwoje są święte, na 3-4 nieczyste. Jeśli nie zostaną użyte przed świtem, zamieniają się w popiół.'),
    ('pl', 'abilities.esoteric_hermit.bard', 'Bard Nieumarłych: Nauczyłeś się swych melodii w Zaświatach. Muzyka twej harfy daje +D4 do rzutów na reakcję.'),
    ('pl', 'abilities.esoteric_hermit.hawk', 'Jastrząb jako Broń: Twój przebiegły, niemal inteligentny jastrząb jest lojalny tylko wobec ciebie. Nawet bez wspólnego języka rozumiesz jego krzyki, gdy wypatruje, zwiaduje i nurkuje na wrogów. Atak/obrona PT10 (pazury/dziób D4), 8 PŻ.'),
    ('pl', 'pets.hawk.description', 'Twój przebiegły, niemal inteligentny jastrząb jest lojalny tylko wobec ciebie. Nawet bez wspólnego języka rozumiesz jego krzyki, gdy wypatruje, zwiaduje i nurkuje na wrogów. Atak/obrona PT10 (pazury/dziób D4), 8 PŻ.')
ON CONFLICT (locale, key) DO UPDATE SET
    value = EXCLUDED.value;

INSERT INTO public.translations (locale, key, value) VALUES
    ('en', 'abilities.wretched_royalty.blade', 'The Blade of your Ancestors: This magnificent and clearly magical talking sword is foppish, unreliable and quietly despises you. It taunts your failures and, if continually disappointed, develops a 1 in 6 chance to accidentally attack you or your companions. Deals D6+1 damage. Attack/Defence DR is 10.'),
    ('en', 'abilities.wretched_royalty.poltroon', 'Poltroon the Court Jester: While practically useless, personally irritating and an emotional drain, Poltroon''s capering actually makes enemies lose their focus in combat. For the first two rounds you and your allies get +2 on attack/defence.'),
    ('en', 'abilities.wretched_royalty.barbarister', 'Barbarister the Incredible Horse: Barbarister is magical, intelligent, arrogant and vain. He can also talk. If you can persuade him to care, Barbarister occasionally adds +2 to Presence tests involving logic and intellect. The horse may be smarter than you and is quite aware of this.'),
    ('en', 'abilities.wretched_royalty.hamfund', 'Hamfund the Squire: This intensely cowardly servant acts only as guardian for the scabbard of the cursed sword Eurekia. Once per combat, if Ham can be found, Eurekia may be drawn. The sword does 2D6 damage, and for every swing of Eurekia roll a D6. On a 1 the squire is slain and Eurekia vanishes forever.'),
    ('en', 'abilities.wretched_royalty.gift', 'The Snake-Skin Gift: An expensive sandalwood box bound in snakeskin. It contains a seemingly ordinary dagger, wrapped in silk. The dagger does D4 damage but on a 1 the target dies immediately of deadly poison weeping from the blade.'),
    ('en', 'abilities.wretched_royalty.horn', 'Horn of the Schleswig Lords: Once per day release a blare from this dented old trumpet and test Presence DR12. One creature may make their next non-combat test an automatic success.'),
    ('en', 'weapons.blade-of-ancestors.description', 'A magnificent and clearly magical talking sword that is foppish, unreliable and quietly despises you. Deals D6+1 damage. Attack/Defence DR is 10.'),
    ('en', 'weapons.snake-skin-gift.description', 'An expensive sandalwood box bound in snakeskin containing a silk-wrapped dagger. The dagger deals D4 damage, but on a 1 the target dies immediately of deadly poison.'),
    ('en', 'pets.barbarister.description', 'Barbarister is magical, intelligent, arrogant and vain. He can also talk. If you can persuade him to care, Barbarister occasionally adds +2 to Presence tests involving logic and intellect. The horse may be smarter than you and is quite aware of this.'),
    ('en', 'pets.hamfund.description', 'This intensely cowardly servant acts only as guardian for the scabbard of the cursed sword Eurekia. Once per combat, if Ham can be found, Eurekia may be drawn for 2D6 damage. For every swing of Eurekia roll a D6. On a 1 the squire is slain and Eurekia vanishes forever.'),
    ('en', 'abilities.heretical_priest.crook', 'Sacred Shepherd’s Crook: Its head a hook of human bone inscribed with overlapping anti-prayers. This crook hooks through other worlds. Staff does 2D4 damage except to faithless humans.'),
    ('en', 'abilities.heretical_priest.mitre', 'Stolen Mitre: While wearing this holy hat the priest’s vile body fades, becoming hard to hit in combat (Defence DR10). If pulled over the ears outside of battle the priest becomes nearly invisible, testing stealth against DR8.'),
    ('en', 'abilities.heretical_priest.sins', 'List of Sins: A long and accurate document cross-referenced against reality to discover unseen evil-doers. Successful Presence DR10: A strange light surrounds evil creatures. The list’s owner defends with +2 against any being discovered this way.'),
    ('en', 'abilities.heretical_priest.bible', 'The Blasphemous Nechrubel Bible: So intensely blasphemous even the Priests themselves can only peruse it once per day. When read, roll a die. Even result: For the rest of the day PCs heal D4 HP after just five minutes of rest. Odd result: The priest is plagued by demonic hallucinations. The DM may invent D3 things that only the Priest can see and describe them to the player as if true. This effect ends with sunrise.'),
    ('en', 'abilities.heretical_priest.stones', 'Stones taken from Thel-Emas’ lost temple: Cast the stones on the ground. Their pattern reveals if danger lurks in an adjacent room. The stones can lie. The priest tests Presence DR10 to see if they are true but after failing they cannot test again until the sun has set.'),
    ('en', 'abilities.heretical_priest.crucifix', '(Wrong Jesus) Crucifix: The crucifix can be used in encounters with the undead as well as lesser trolls and goblins. Check morale, add or subtract the priest’s Presence modifier, to see if the creatures bow and kindly remove themselves.'),
    ('en', 'weapons.sacred-shepherds-crook.description', 'Its head a hook of human bone inscribed with overlapping anti-prayers. This crook hooks through other worlds. Staff does 2D4 damage except to faithless humans.'),
    ('pl', 'abilities.wretched_royalty.blade', 'Ostrze Twoich Przodków: Ten wspaniały i wyraźnie magiczny gadający miecz jest fircykowaty, zawodny i po cichu tobą gardzi. Szydzi z twoich porażek i, jeśli wciąż go rozczarowujesz, zyskuje 1 na 6 szansy, by przypadkiem zaatakować ciebie lub towarzyszy. Zadaje D6+1 obrażeń. PT ataku i obrony wynosi 10.'),
    ('pl', 'abilities.wretched_royalty.poltroon', 'Poltroon, Błazen Dworski: Choć jest praktycznie bezużyteczny, osobiście irytujący i emocjonalnie wyczerpujący, wygłupy Poltroona sprawiają, że wrogowie tracą koncentrację w walce. Przez pierwsze dwie rundy ty i twoi sojusznicy otrzymujecie +2 do ataku/obrony.'),
    ('pl', 'abilities.wretched_royalty.barbarister', 'Barbarister, Niesamowity Koń: Barbarister jest magiczny, inteligentny, arogancki i próżny. Potrafi też mówić. Jeśli zdołasz przekonać go, by się przejął, Barbarister od czasu do czasu daje +2 do testów Obecności związanych z logiką i intelektem. Koń może być mądrzejszy od ciebie i doskonale o tym wie.'),
    ('pl', 'abilities.wretched_royalty.hamfund', 'Hamfund Giermek: Ten skrajnie tchórzliwy sługa działa wyłącznie jako strażnik pochwy przeklętego miecza Eurekia. Raz na walkę, jeśli uda się znaleźć Hama, Eurekia może zostać dobyta. Miecz zadaje 2D6 obrażeń, a za każdy zamach Eurekią rzuć D6. Na 1 giermek ginie, a Eurekia znika na zawsze.'),
    ('pl', 'abilities.wretched_royalty.gift', 'Prezent ze Skóry Węża: Drogie pudełko z drewna sandałowego oprawione w skórę węża. W środku znajduje się pozornie zwyczajny sztylet owinięty w jedwab. Sztylet zadaje D4 obrażeń, ale na 1 cel natychmiast umiera od śmiercionośnej trucizny sączącej się z ostrza.'),
    ('pl', 'abilities.wretched_royalty.horn', 'Róg Lordów Schleswig: Raz dziennie wydaj przeciągły dźwięk z tej starej, pogiętej trąby i wykonaj test Obecności PT12. Jedna istota może automatycznie odnieść sukces w swoim następnym teście poza walką.'),
    ('pl', 'weapons.blade-of-ancestors.description', 'Wspaniały i wyraźnie magiczny gadający miecz, który jest fircykowaty, zawodny i po cichu tobą gardzi. Zadaje D6+1 obrażeń. PT ataku i obrony wynosi 10.'),
    ('pl', 'weapons.snake-skin-gift.description', 'Drogie pudełko z drewna sandałowego oprawione w skórę węża, zawierające owinięty w jedwab sztylet. Sztylet zadaje D4 obrażeń, ale na 1 cel natychmiast umiera od śmiercionośnej trucizny.'),
    ('pl', 'pets.barbarister.description', 'Barbarister jest magiczny, inteligentny, arogancki i próżny. Potrafi też mówić. Jeśli zdołasz przekonać go, by się przejął, Barbarister od czasu do czasu daje +2 do testów Obecności związanych z logiką i intelektem. Koń może być mądrzejszy od ciebie i doskonale o tym wie.'),
    ('pl', 'pets.hamfund', 'Hamfund Giermek'),
    ('pl', 'pets.hamfund.description', 'Ten skrajnie tchórzliwy sługa działa wyłącznie jako strażnik pochwy przeklętego miecza Eurekia. Raz na walkę, jeśli uda się znaleźć Hama, Eurekia może zostać dobyta i zadać 2D6 obrażeń. Za każdy zamach Eurekią rzuć D6. Na 1 giermek ginie, a Eurekia znika na zawsze.'),
    ('pl', 'abilities.heretical_priest.crook', 'Święty Kostur Pasterza: Jego głowica to hak z ludzkiej kości pokryty nakładającymi się antymodlitwami. Ten kostur zahacza o inne światy. Kostur zadaje 2D4 obrażeń z wyjątkiem bezbożnych ludzi.'),
    ('pl', 'abilities.heretical_priest.mitre', 'Skradziona Mitra: Kiedy nosisz to święte nakrycie głowy, plugawa sylwetka kapłana blednie i staje się trudna do trafienia w walce (Obrona PT10). Jeśli naciągniesz ją na uszy poza walką, kapłan staje się niemal niewidzialny, testując skradanie przeciw PT8.'),
    ('pl', 'abilities.heretical_priest.sins', 'Lista Grzechów: Długi i dokładny dokument, skrzyżowany z samą rzeczywistością, by odkrywać niewidocznych złoczyńców. Udany test Obecności PT10: Dziwne światło otacza złe istoty. Właściciel listy broni się z +2 przeciw każdemu tak odkrytemu stworzeniu.'),
    ('pl', 'abilities.heretical_priest.bible', 'Bluźniercza Biblia Nechrubela: Tak intensywnie bluźniercza, że nawet sami kapłani mogą ją studiować tylko raz dziennie. Gdy jest czytana, rzuć kością. Wynik parzysty: Przez resztę dnia BG leczą D4 PŻ już po pięciu minutach odpoczynku. Wynik nieparzysty: Kapłana nawiedzają demoniczne halucynacje. MG może wymyślić D3 rzeczy, które widzi tylko kapłan, i opisywać je graczowi tak, jakby były prawdziwe. Efekt kończy się wraz ze wschodem słońca.'),
    ('pl', 'abilities.heretical_priest.stones', 'Kamienie z zaginionej świątyni Thel-Emas: Rzuć kamienie na ziemię. Ich układ ujawnia, czy w sąsiednim pomieszczeniu czai się niebezpieczeństwo. Kamienie mogą kłamać. Kapłan wykonuje test Obecności PT10, by sprawdzić, czy mówią prawdę, ale po porażce nie może testować ponownie aż do zachodu słońca.'),
    ('pl', 'abilities.heretical_priest.crucifix', 'Krucyfiks Niewłaściwego Jezusa: Krucyfiks można wykorzystać podczas spotkań z nieumarłymi, a także z pomniejszymi trollami i goblinami. Sprawdź morale, dodając lub odejmując modyfikator Obecności kapłana, by zobaczyć, czy stworzenia skłonią się i uprzejmie odejdą.'),
    ('pl', 'weapons.sacred-shepherds-crook.description', 'Jego głowica to hak z ludzkiej kości pokryty nakładającymi się antymodlitwami. Ten kostur zahacza o inne światy. Kostur zadaje 2D4 obrażeń z wyjątkiem bezbożnych ludzi.')
ON CONFLICT (locale, key) DO UPDATE SET
    value = EXCLUDED.value;

COMMIT;
