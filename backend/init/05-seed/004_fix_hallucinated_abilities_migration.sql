-- Migration: Fix hallucinated class abilities for all 6 main classes
-- Aligning with official MÖRK BORG rules as requested.
-- This script is idempotent and can be run multiple times.

BEGIN;

-- Ensure ability keys are unique so ON CONFLICT (key) works deterministically.
-- This keeps the seed idempotent even on partially-initialized databases.
DELETE FROM public.abilities a
USING public.abilities b
WHERE a.id > b.id
  AND a.key = b.key;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conrelid = 'public.abilities'::regclass
          AND conname = 'abilities_key_key'
    ) THEN
        ALTER TABLE public.abilities
            ADD CONSTRAINT abilities_key_key UNIQUE (key);
    END IF;
END $$;

-- 0. Delete known hallucinated abilities from previous versions to ensure a clean state
DELETE FROM public.abilities WHERE key IN (
    'abilities.fanged_deserter.clumsy',
    'abilities.fanged_deserter.bite',
    'abilities.gutterborn_scum.jester',
    'abilities.gutterborn_scum.spatula',
    'abilities.gutterborn_scum.muck',
    'abilities.gutterborn_scum.poison',
    'abilities.gutterborn_scum.nose',
    'abilities.esoteric_hermit.scrolls',
    'abilities.esoteric_hermit.staff',
    'abilities.esoteric_hermit.skin',
    'abilities.esoteric_hermit.ash',
    'abilities.esoteric_hermit.eye',
    'abilities.esoteric_hermit.bird',
    'abilities.wretched_royalty.servant',
    'abilities.wretched_royalty.horse',
    'abilities.wretched_royalty.seal',
    'abilities.wretched_royalty.squire',
    'abilities.wretched_royalty.cape',
    'abilities.wretched_royalty.crown',
    'abilities.heretical_priest.sinner',
    'abilities.heretical_priest.beak',
    'abilities.heretical_priest.breath',
    'abilities.heretical_priest.voice',
    'abilities.heretical_priest.fingers',
    'abilities.heretical_priest.tongue',
    'abilities.heretical_priest.eye'
);

-- 1. Update random_abilities in the classes table
UPDATE public.classes SET random_abilities = '[{"name": "Crumpled Monster Mask", "description": "Strikes primitive fear into lesser creatures like goblins, gnoums and children. While worn, they check Morale every round."}, {"name": "The Brown Scimitar of Galgenbeck", "gainItem": "The Brown Scimitar of Galgenbeck", "description": "A stinking sword. D6 damage. dr10 attack and defence while you wield it. 1 in 6 chance a wounded enemy dies of sepsis."}, {"name": "Wizard Teeth", "description": "Four weird teeth in a pouch. Roll d6 for each before battle, on 6 one attack deals max damage."}, {"name": "Old Sigürd''s Sling", "gainItem": "Old Sigürd''s Sling", "description": "Woven from hair, 2d4 damage with fist-sized rocks which are everywhere."}, {"name": "Ancient Gore-hound", "gainPet": "Ancient Gore-Hound", "description": "Wizened creature with a superb nose. Attacks with dr10 (bite d6). Defends with dr12, 10 hp. Becomes frenzied around goblins and berserkers."}, {"name": "The Shoe of Death''s Horse", "gainItem": "The Shoe of Death''s Horse", "description": "DR10, d4 damage. 1 in 6 instant kill on small-medium creatures. Returns like boomerang."}]' WHERE id = 1;

UPDATE public.classes SET random_abilities = '[{"name": "Coward’s Jab", "description": "When attacking by surprise test Agility dr10. On a success you automatically hit once with a light one-handed weapon, dealing normal damage +3."}, {"name": "Filthy Fingersmith", "gainItem": "Lockpicks", "description": "Pick locks with a dr8 Agility test. You also begin with lockpicks!"}, {"name": "Abominable Gob Lobber", "description": "Spit d2 times during a fight. Roll a dr8 Presence test for accuracy. Targets are blinded, retching and vomiting for d4 rounds. Others witnessing this must test Toughness (PCs dr10, enemies dr12) or vomit."}, {"name": "Escaping Fate", "description": "50% chance omens are not spent when used."}, {"name": "Excretal Stealth", "description": "Preternatural ability to hide in muck. When hidden in these conditions a dr16 Presence test is required to notice you."}, {"name": "Dodging Death", "description": "On death, if there is even the slightest possibility that you survived, there is a 50% chance that you did. If successful, after 10 rounds you pop back up with d4 hp."}]' WHERE id = 2;

UPDATE public.classes SET random_abilities = '[{"name": "Master of Fate", "description": "Know the right way with a dr8 Presence test."}, {"name": "Book of Boiling Blood", "description": "Once daily enemy must make a dr12 test or D2 Berserker-slayers appear. D6 roll: 1-4 fight for you, 5-6 they turn on you."}, {"name": "Speaker of Truths", "description": "Twice per day use your wisdom to bring clarity to a creature. The dr of the next test they undertake is lowered by 4."}, {"name": "Initiate of the Invisible College", "description": "Once per day summon D2 scrolls (1-2 sacred, 3-4 unclean). If not used before sunrise they turn to ash."}, {"name": "Bard of the Undying", "description": "Harp music gives +D4 on reaction rolls."}, {"name": "Hawk as Weapon", "gainPet": "Hawk", "description": "Loyal hawk. Attacks/defence dr10 (claws/bite D4) HP 8."}]' WHERE id = 3;

UPDATE public.classes SET random_abilities = '[{"name": "The Blade of your Ancestors", "gainItem": "The Blade of your Ancestors", "description": "Talking sword, foppish and unreliable. Taunts failures. 1 in 6 chance to attack you or companions. D6+1 damage, DR10."}, {"name": "Poltroon the Court Jester", "gainPet": "Poltroon the Court Jester", "description": "Useless but makes enemies lose focus. For the first two rounds you and your allies get +2 on attack/defence."}, {"name": "Barbarister the Incredible Horse", "gainPet": "Barbarister the Incredible Horse", "description": "Magical, intelligent, arrogant talking horse. Persuade him for +2 to Presence tests involving logic and intellect."}, {"name": "Hamfund the Squire", "gainPet": "Hamfund the Squire", "description": "Cowardly servant guards Eurekia sword. 2d6 damage but 1 in 6 kills squire and sword vanishes."}, {"name": "The Snake-Skin Gift", "gainItem": "The Snake-Skin Gift", "description": "Dagger does d4 damage, on 1 target dies of poison."}, {"name": "Horn of the Schleswig Lords", "description": "Once daily, blare trumpet and test Presence dr12. One creature may make their next non-combat test an automatic success."}]' WHERE id = 4;

UPDATE public.classes SET random_abilities = '[{"name": "Sacred Shepherd’s Crook", "gainItem": "Sacred Shepherd’s Crook", "description": "Staff does 2d4 damage except to faithless humans."}, {"name": "Stolen Mitre", "description": "Defence dr10. If pulled over ears outside battle, Priest becomes nearly invisible (Stealth dr8)."}, {"name": "List of Sins", "description": "Successful Presence dr10: A strange light surrounds evil creatures. Owner defends with +2 against them."}, {"name": "The Blasphemous Nechrubel Bible", "description": "Once per day read: Even roll heals PCs d4 hp after 5 min rest; Odd roll causes hallucinations until sunrise."}, {"name": "Stones taken from Thel-Emas’ lost temple", "description": "Pattern reveals if danger lurks in adjacent room. Priest tests Presence dr10 to see if they are true."}, {"name": "Crucifix", "description": "Use against undead, trolls and goblins. Check morale (Presence mod included) to see if they bow and remove themselves."}]' WHERE id = 5;

UPDATE public.classes SET random_abilities = '[]' WHERE id = 6;


-- 2. Update/Insert into abilities table (to fix hallucinated keys and order)
-- Use ON CONFLICT (key) to handle existing keys, as 'key' has a unique constraint.
-- This ensures we don't have duplicates and syncs them to the correct classes.
INSERT INTO public.abilities (class_id, key, is_random, roll_value) VALUES
(1, 'abilities.fanged_deserter.clumsy', false, NULL),
(1, 'abilities.fanged_deserter.bite', false, NULL),
(1, 'abilities.fanged_deserter.mask', true, 1),
(1, 'abilities.fanged_deserter.scimitar', true, 2),
(1, 'abilities.fanged_deserter.teeth', true, 3),
(1, 'abilities.fanged_deserter.sling', true, 4),
(1, 'abilities.fanged_deserter.hound', true, 5),
(1, 'abilities.fanged_deserter.shoe', true, 6),
(2, 'abilities.gutterborn_scum.stealthy', false, NULL),
(2, 'abilities.gutterborn_scum.jab', true, 1),
(2, 'abilities.gutterborn_scum.fingersmith', true, 2),
(2, 'abilities.gutterborn_scum.gob_lobber', true, 3),
(2, 'abilities.gutterborn_scum.fate', true, 4),
(2, 'abilities.gutterborn_scum.stealth', true, 5),
(2, 'abilities.gutterborn_scum.dodging', true, 6),
(3, 'abilities.esoteric_hermit.master_of_fate', true, 1),
(3, 'abilities.esoteric_hermit.book', true, 2),
(3, 'abilities.esoteric_hermit.speaker', true, 3),
(3, 'abilities.esoteric_hermit.initiate', true, 4),
(3, 'abilities.esoteric_hermit.bard', true, 5),
(3, 'abilities.esoteric_hermit.hawk', true, 6),
(4, 'abilities.wretched_royalty.blade', true, 1),
(4, 'abilities.wretched_royalty.poltroon', true, 2),
(4, 'abilities.wretched_royalty.barbarister', true, 3),
(4, 'abilities.wretched_royalty.hamfund', true, 4),
(4, 'abilities.wretched_royalty.gift', true, 5),
(4, 'abilities.wretched_royalty.horn', true, 6),
(5, 'abilities.heretical_priest.crook', true, 1),
(5, 'abilities.heretical_priest.mitre', true, 2),
(5, 'abilities.heretical_priest.sins', true, 3),
(5, 'abilities.heretical_priest.bible', true, 4),
(5, 'abilities.heretical_priest.stones', true, 5),
(5, 'abilities.heretical_priest.crucifix', true, 6),
(6, 'abilities.occult_herbmaster.decoctions', false, NULL),
(6, 'abilities.occult_herbmaster.red_poison', true, 1),
(6, 'abilities.occult_herbmaster.ezumiel', true, 2),
(6, 'abilities.occult_herbmaster.frog', true, 3),
(6, 'abilities.occult_herbmaster.vitalis', true, 4),
(6, 'abilities.occult_herbmaster.soup', true, 5),
(6, 'abilities.occult_herbmaster.philtre', true, 6),
(6, 'abilities.occult_herbmaster.hyphos', true, 7),
(6, 'abilities.occult_herbmaster.black_poison', true, 8)
ON CONFLICT (key) DO UPDATE SET
    class_id = EXCLUDED.class_id,
    is_random = EXCLUDED.is_random,
    roll_value = EXCLUDED.roll_value;


-- 3. Update/Insert translations for the abilities
INSERT INTO public.translations (locale, key, value) VALUES
('en', 'abilities.fanged_deserter.clumsy', 'Clumsy: All Agility tests (except defense) are DR+2. You cannot use scrolls.'),
('en', 'abilities.fanged_deserter.bite', 'Teeth: DR10 to attack, d6 damage. You must be in close range.'),
('en', 'abilities.fanged_deserter.mask', 'Monster Mask: Strikes primitive fear into lesser creatures like goblins, gnoums and children. While worn, they check Morale every round.'),
('en', 'abilities.fanged_deserter.scimitar', 'The Brown Scimitar of Galgenbeck: A stinking sword you pulled from a military shit-ditch. D6 damage. dr10 attack and defence while you wield it. 1 in 6 chance a wounded enemy is smitten with potent sepsis, dying in 10 minutes.'),
('en', 'abilities.fanged_deserter.teeth', 'Wizard Teeth: Four weird teeth rattle within a blackened pouch. Before battle roll a d6 for each one. For every 6 one of your attacks deals maximum damage.'),
('en', 'abilities.fanged_deserter.sling', 'Old Sigürd’s Sling: Woven from his long grey hair, this sling has never failed you. 2d4 damage, requires fist-sized rocks which are everywhere.'),
('en', 'abilities.fanged_deserter.hound', 'Ancient Gore-hound: Wizened creature with a superb nose, can sniffle up treasure. Attacks with dr10 (bite d6). Defends with dr12, 10 hp. Becomes frenzied around goblins and berserkers.'),
('en', 'abilities.fanged_deserter.shoe', 'The Shoe of Death’s Horse: DR10, d4 damage. 1 in 6 chance the shoe smashes the skull, instantly killing small-to-medium sized creatures. Returns to your hand like a boomerang.'),
('en', 'abilities.gutterborn_scum.stealthy', 'Stealthy: All Presence and Agility tests have their DR reduced by 2.'),
('en', 'abilities.gutterborn_scum.jab', 'Coward’s Jab: When attacking by surprise test Agility dr10. On a success you automatically hit once with a light one-handed weapon, dealing normal damage +3.'),
('en', 'abilities.gutterborn_scum.fingersmith', 'Filthy Fingersmith: Your snaky little digits get into pockets and pick locks with a dr8 Agility test. You also begin with lockpicks!'),
('en', 'abilities.gutterborn_scum.gob_lobber', 'Abominable Gob Lobber: Spit d2 times during a fight. Roll a dr8 Presence test for accuracy. Targets are blinded, retching and vomiting for d4 rounds. Others witnessing this must test Toughness (PCs dr10, enemies dr12) or vomit.'),
('en', 'abilities.gutterborn_scum.fate', 'Escaping Fate: Every time you use an omen there is a 50% chance it is not spent.'),
('en', 'abilities.gutterborn_scum.stealth', 'Excretal Stealth: Astounding ability to hide in muck. When hidden in these conditions a dr16 Presence test is required to notice you.'),
('en', 'abilities.gutterborn_scum.dodging', 'Dodging Death: On death, if there is even the slightest possibility that you survived, there is a 50% chance that you did. If successful, after 10 rounds you pop back up with d4 hp.'),
('en', 'abilities.esoteric_hermit.master_of_fate', 'Master of Fate: What use are maps when the substance of causality itself is open to you? You know the right way with a dr8 Presence test.'),
('en', 'abilities.esoteric_hermit.book', 'Book of Boiling Blood: Once daily enemy must make a dr12 test or D2 Berserker-slayers appear. D6 roll: 1-4 fight for you, 5-6 they turn on you.'),
('en', 'abilities.esoteric_hermit.speaker', 'Speaker of Truths: Twice per day use your wisdom to bring clarity to a creature. The dr of the next test they undertake is lowered by 4.'),
('en', 'abilities.esoteric_hermit.initiate', 'Initiate of the Invisible College: Once per day summon D2 scrolls (1-2 sacred, 3-4 unclean). If not used before sunrise they turn to ash.'),
('en', 'abilities.esoteric_hermit.bard', 'Bard of the Undying: You learnt your melodies in the Otherworld. The music of your Harp gives +D4 on reaction rolls.'),
('en', 'abilities.esoteric_hermit.hawk', 'Hawk as Weapon: Crafty almost-intelligent hawk loyal only to you. Attacks/defence dr10 (claws/bite D4) HP 8.'),
('en', 'abilities.wretched_royalty.blade', 'The Blade of your Ancestors: Talking sword, foppish and unreliable. Taunts failures. 1 in 6 chance to attack you or companions. D6+1 damage, DR10.'),
('en', 'abilities.wretched_royalty.poltroon', 'Poltroon the Court Jester: Useless but makes enemies lose focus. For the first two rounds you and your allies get +2 on attack/defence.'),
('en', 'abilities.wretched_royalty.barbarister', 'Barbarister the Incredible Horse: Magical, intelligent, arrogant talking horse. Persuade him for +2 to Presence tests involving logic and intellect.'),
('en', 'abilities.wretched_royalty.hamfund', 'Hamfund the Squire: Cowardly servant. Once per combat, Eurekia may be drawn (2d6 damage). 1 in 6 swing roll: squire slain and sword vanishes.'),
('en', 'abilities.wretched_royalty.gift', 'The Snake-Skin Gift: Sandalwood box with a dagger. D4 damage, on 1 target dies immediately of deadly poison.'),
('en', 'abilities.wretched_royalty.horn', 'Horn of the Schleswig Lords: Once per day blare trumpet and test Presence dr12. One creature may make their next non-combat test an automatic success.'),
('en', 'abilities.heretical_priest.crook', 'Sacred Shepherd’s Crook: Head of human bone inscribed with anti-prayers. Staff does 2d4 damage except to faithless humans.'),
('en', 'abilities.heretical_priest.mitre', 'Stolen Mitre: While wearing it Defence is dr10. If pulled over ears outside battle, Priest becomes nearly invisible (Stealth dr8).'),
('en', 'abilities.heretical_priest.sins', 'List of Sins: Accurate document of evil-doers. Successful Presence dr10: A strange light surrounds evil creatures. Owner defends with +2 against them.'),
('en', 'abilities.heretical_priest.bible', 'The Blasphemous Nechrubel Bible: Once per day read: Even roll heals PCs d4 hp after 5 min rest; Odd roll causes hallucinations until sunrise.'),
('en', 'abilities.heretical_priest.stones', 'Stones from Thel-Emas’ Lost Temple: Pattern reveals if danger lurks in adjacent room. Priest tests Presence dr10 to see if they are true.'),
('en', 'abilities.heretical_priest.crucifix', 'Crucifix: Use against undead, trolls and goblins. Check morale (Presence mod included) to see if they bow and remove themselves.'),
('en', 'abilities.occult_herbmaster.decoctions', 'Portable Laboratory: Daily create two random decoctions and brew d4 doses total. Lose vitality after 24 hours.'),
('en', 'abilities.occult_herbmaster.red_poison', 'Red Poison: Toughness DR12 or -D10 HP.'),
('en', 'abilities.occult_herbmaster.ezumiel', 'Ezumiel''s Vapor: Pass a DR14 test or severe (and arguably fun) hallucinations for D4 hours.'),
('en', 'abilities.occult_herbmaster.frog', 'Southern Frog Stew: Vomit for D4 hours, pass a DR14 test or you can do nothing else.'),
('en', 'abilities.occult_herbmaster.vitalis', 'Elixir Vitalis: Heals D6 HP and stops infection. Can be habit-forming.'),
('en', 'abilities.occult_herbmaster.soup', 'Spider-Owl Soup: See in darkness, climb on walls for 30 minutes.'),
('en', 'abilities.occult_herbmaster.philtre', 'Fernor''s Philtre: Translucent oil, must be dabbed right into the eye. Heals infection and gives +2 on Presence tests for D4 hours.'),
('en', 'abilities.occult_herbmaster.hyphos', 'Hyphos'' Enervating Snuff: Berserk! Two attacks per round but defend with DR14. Lasts one fight. Must be snorted, causes sneezing.'),
('en', 'abilities.occult_herbmaster.black_poison', 'Black Poison: Toughness DR14 or -D6 HP and blinded for one hour.'),
('pl', 'abilities.fanged_deserter.clumsy', 'Niezdarny: Wszystkie testy Zwinności (oprócz obrony) mają PT+2. Nie możesz używać zwojów.'),
('pl', 'abilities.fanged_deserter.bite', 'Zęby: PT10 do ataku, d6 obrażeń. Musisz być w zasięgu bliskim.'),
('pl', 'abilities.fanged_deserter.mask', 'Maska Potwora: Budzi pierwotny strach w mniejszych stworzeniach, takich jak gobliny, gnoumy i dzieci. Kiedy jest noszona, co rundę sprawdzają Morale.'),
('pl', 'abilities.fanged_deserter.scimitar', 'Brązowy Sejmitar z Galgenbeck: Śmierdzący miecz wyciągnięty z wojskowego rowu z gównem. d10 obrażeń. PT10 do ataku i obrony, gdy go dzierżysz. 1 na 6 szansy, że ranny wróg umrze na sepsę w 10 minut.'),
('pl', 'abilities.fanged_deserter.teeth', 'Zęby Czarodzieja: Cztery dziwne zęby grzechoczą w poczerniałym woreczku. Przed bitwą rzuć d6 za każdy z nich. Za każdą 6 jeden z twoich ataków zadaje maksymalne obrażenia.'),
('pl', 'abilities.fanged_deserter.sling', 'Proca Starego Sigürda: Zapleciona z jego długich szarych włosów. 2d4 obrażeń, wymaga kamieni wielkości pięści.'),
('pl', 'abilities.fanged_deserter.hound', 'Starożytny Ogar Krwi: Astmatyczne, starcze stworzenie ze świetnym węchem, potrafi wywęszyć skarb w obrzydliwych śmieciach. Atak PT10 (d6), Obrona PT12, 10 PŻ. Wpada w szał przy goblinach i berserkerach.'),
('pl', 'abilities.fanged_deserter.shoe', 'Podkowa Konia Śmierci: Wygląda normalnie, ale w twoich rękach uderza z PT10, d4 obrażeń. 1 na 6 szansy na natychmiastowe zmiażdżenie czaszki małym i średnim stworzeniom. Wraca do ręki jak bumerang.'),
('pl', 'abilities.gutterborn_scum.stealthy', 'Skryty: Wszystkie PT Obecności i Zwinności są zmniejszone o 2.'),
('pl', 'abilities.gutterborn_scum.jab', 'Cios Tchórza: Przy ataku z zaskoczenia testuj Zwinność PT10. Sukces oznacza automatyczne trafienie lekką bronią jednoręczną z obrażeniami +3.'),
('pl', 'abilities.gutterborn_scum.fingersmith', 'Zwinne Paluszki: Twoje palce dostają się do kieszeni i zamków przy teście Zwinności PT8. Zaczynasz z wytrychami!'),
('pl', 'abilities.gutterborn_scum.gob_lobber', 'Obrzydliwy Spluwacz: Twoja flegma jest lepka i celna. Możesz pluć d2 razy podczas walki. Test Obecności PT8 na trafienie. Cele są oślepione i wymiotują przez d4 rundy.'),
('pl', 'abilities.gutterborn_scum.fate', 'Ucieczka Przeznaczeniu: Za każdym razem, gdy używasz znaku (omen), masz 50% szansy, że nie zostanie on zużyty.'),
('pl', 'abilities.gutterborn_scum.stealth', 'Gówniane Skradanie się: Nadnaturalna zdolność ukrywania się w błocie i nieczystościach. Wymagany test Obecności PT16, aby cię zauważyć.'),
('pl', 'abilities.gutterborn_scum.dodging', 'Unikanie Śmierci: Nawet Śmierć woli cię unikać. Przy śmierci masz 50% szansy na przeżycie. Jeśli się uda, po 10 rundach wstajesz z d4 PŻ.'),
('pl', 'abilities.esoteric_hermit.master_of_fate', 'Mistrz Przeznaczenia: Znasz właściwą drogę przy teście Obecności PT8.'),
('pl', 'abilities.esoteric_hermit.book', 'Księga Wrzącej Krwi: Raz dziennie wróg musi zdać test PT12, inaczej pojawiają się D2 pogromcy berserkerów. Na 1-4 walczą dla ciebie, na 5-6 atakują ciebie.'),
('pl', 'abilities.esoteric_hermit.speaker', 'Mówca Prawdy: Dwa razy dziennie obniż PT następnego testu wybranej istoty o 4.'),
('pl', 'abilities.esoteric_hermit.initiate', 'Inicjowany Niewidzialnego Kolegium: Raz dziennie przywołaj D2 zwoje (1-2 święte, 3-4 nieczyste). Jeśli nie zostaną użyte do świtu, zamieniają się w popiół.'),
('pl', 'abilities.esoteric_hermit.bard', 'Bard Nieumarłych: Muzyka twojej harfy daje +D4 do rzutów na reakcję.'),
('pl', 'abilities.esoteric_hermit.hawk', 'Jastrząb jako Broń: Lojalny jastrząb. Atak/obrona PT10 (pazury d4), 8 PŻ.'),
('pl', 'abilities.wretched_royalty.blade', 'Ostrze Przodków: Gadający miecz, foppish i niepewny. d6+1 obrażeń. PT10. 1 na 6 szansy na zaatakowanie ciebie lub towarzyszy.'),
('pl', 'abilities.wretched_royalty.poltroon', 'Błazen Poltroon: Irytujący, ale wrogowie tracą koncentrację. Przez pierwsze dwie rundy ty i sojusznicy macie +2 do ataku/obrony.'),
('pl', 'abilities.wretched_royalty.barbarister', 'Niezwykły Koń Barbarister: Magiczny, inteligentny, arogancki gadający koń. Czasem daje +2 do testów Obecności związanych z logiką.'),
('pl', 'abilities.wretched_royalty.hamfund', 'Giermek Hamfund: Tchórzliwy sługa strzeże miecza Eurekia. Raz na walkę miecz zadaje 2d6 obrażeń. Przy każdym ataku rzut d6: na 1 giermek ginie, a miecz znika na zawsze.'),
('pl', 'abilities.wretched_royalty.gift', 'Prezent ze Skóry Węża: Pudełko z dagerem d4 obrażeń. Przy wyrzuceniu 1 cel natychmiast umiera od trucizny.'),
('pl', 'abilities.wretched_royalty.horn', 'Róg Lordów Schleswig: Raz dziennie ryk trąby i test Obecności PT12 daje jednej istocie automatyczny sukces w następnym teście poza walką.'),
('pl', 'abilities.heretical_priest.crook', 'Święty Kostur Pasterza: Głowica z ludzkiej kości. Kostur zadaje 2d4 obrażeń (z wyjątkiem bezwiernych ludzi).'),
('pl', 'abilities.heretical_priest.mitre', 'Skradziona Mitra: Podczas noszenia obrona PT10. Po naciągnięciu na uszy poza walką stajesz się prawie niewidzialny (Skradanie PT8).'),
('pl', 'abilities.heretical_priest.sins', 'Lista Grzechów: Dokument ujawniający grzeszników. Test Obecności PT10: Dziwne światło otacza złe istoty. Właściciel broni się z +2 przeciwko nim.'),
('pl', 'abilities.heretical_priest.bible', 'Bluźniercza Biblia Nechrubela: Czytana raz dziennie. Wynik parzysty: leczy d4 PŻ po 5 min odpoczynku. Wynik nieparzysty: halucynacje do świtu.'),
('pl', 'abilities.heretical_priest.stones', 'Kamienie z Zaginionej Świątyni Thel-Emas: Układ ujawnia niebezpieczeństwo w sąsiednim pokoju. Test Obecności PT10 na prawdziwość wróżby.'),
('pl', 'abilities.heretical_priest.crucifix', 'Krucyfiks: Używany przeciwko nieumarłym, trollom i goblinom. Sprawdź morale (z modyfikatorem Obecności), aby odeszły.'),
('pl', 'abilities.occult_herbmaster.decoctions', 'Przenośne laboratorium: Każdego dnia masz składniki, by przyrządzić dwa losowe wywary w łącznej liczbie k4 dawek. Nieużyte tracą skuteczność po dobie.'),
('pl', 'abilities.occult_herbmaster.red_poison', 'czerwona trucizna: Wytrzymałość ST12 lub -k10 PŻ.'),
('pl', 'abilities.occult_herbmaster.ezumiel', 'Inhalacje Ezumielskie: Zdaj test o ST14 lub doświadczasz poważnych (i nawet zabawnych) halucynacji przez k4 godziny.'),
('pl', 'abilities.occult_herbmaster.frog', 'Potrawka z Żaby Południowej: Rzygasz przez k4 godziny. Zdaj test o DR14 albo nie możesz robić nic innego.'),
('pl', 'abilities.occult_herbmaster.vitalis', 'Eliksir Życia: Leczy k6 PŻ i usuwa infekcję. Potencjalnie uzależniający.'),
('pl', 'abilities.occult_herbmaster.soup', 'Rosół z Sowopająka: Widzisz w ciemności i możesz łazić po ścianach przez pół godziny.'),
('pl', 'abilities.occult_herbmaster.philtre', 'Ekstrakt Fernora: Bezbarwny olejek aplikowany bezpośrednio na oko. Leczy infekcję i dodaje +2 do rzutów na Opanowanie przez k4 godziny.'),
('pl', 'abilities.occult_herbmaster.hyphos', 'Ożywcza Tabaka Hyphosa: Furia! Dwa ataki na rundę, ale bronisz się na ST14. Trwa jedną walkę. Wciągana nosem, powoduje kichanie.'),
('pl', 'abilities.occult_herbmaster.black_poison', 'Czarna Trucizna: Wytrzymałość ST14 lub -k6 PŻ i ślepota przez godzinę.')
ON CONFLICT (locale, key) DO UPDATE SET value = EXCLUDED.value;


-- 4. Sync class_ability_modifiers
DELETE FROM public.class_ability_modifiers;
INSERT INTO public.class_ability_modifiers (class_id, ability_key, value, statistic, exclude, source, notes)
VALUES
    (2, 'abilities.gutterborn_scum.fingersmith', 4, 'agility', '[]'::jsonb, 'Filthy Fingersmith', 'Pick locks with a dr8 Agility test (standard is dr12, so +4).'),
    (2, 'abilities.gutterborn_scum.gob_lobber', 4, 'presence', '[]'::jsonb, 'Abominable Gob Lobber', 'Roll a dr8 Presence test for accuracy (standard is dr12, so +4).'),
    (2, 'abilities.gutterborn_scum.stealth', -4, 'presence', '[]'::jsonb, 'Excretal Stealth', 'dr16 Presence test required to notice you (standard is dr12, so -4 modifier to spotter).'),
    (3, 'abilities.esoteric_hermit.master_of_fate', 4, 'presence', '[]'::jsonb, 'Master of Fate', 'Know the right way with a dr8 Presence test (standard is dr12, so +4).'),
    (3, 'abilities.esoteric_hermit.speaker', 4, 'presence', '[]'::jsonb, 'Speaker of Truths', 'The dr of the next test is lowered by 4 (effectively +4 to Presence).'),
    (4, 'abilities.wretched_royalty.poltroon', 2, 'agility', '[]'::jsonb, 'Poltroon the Court Jester', 'For the first two rounds you and your allies get +2 on attack/defence.'),
    (4, 'abilities.wretched_royalty.poltroon', 2, 'strength', '[]'::jsonb, 'Poltroon the Court Jester', 'For the first two rounds you and your allies get +2 on attack/defence.'),
    (4, 'abilities.wretched_royalty.barbarister', 2, 'presence', '[]'::jsonb, 'Barbarister the Incredible Horse', 'Barbarister occasionally adds +2 to Presence tests involving logic and intellect.'),
    (5, 'abilities.heretical_priest.mitre', 2, 'agility', '[]'::jsonb, 'Stolen Mitre', 'Hard to hit in combat (Defence dr10, standard is dr12, so +2).'),
    (5, 'abilities.heretical_priest.sins', 2, 'agility', '[]'::jsonb, 'List of Sins', 'The list’s owner defends with +2 against any being discovered this way.'),
    (6, 'abilities.occult_herbmaster.philtre', 2, 'presence', '[]'::jsonb, 'Fernor''s Philtre', 'Gives +2 on Presence tests for D4 hours.'),
    (6, 'abilities.occult_herbmaster.hyphos', -2, 'agility', '[]'::jsonb, 'Hyphos'' Enervating Snuff', 'Defend with DR14 instead of DR12 (effectively -2 Agility).');

-- 5. Fix duplicate abilities in build_character_abilities function
CREATE OR REPLACE FUNCTION build_character_abilities(p_class_id INTEGER) RETURNS JSONB
    LANGUAGE plpgsql AS $$
DECLARE
    v_abilities JSONB := '[]'::jsonb;
    v_random_ability_count INTEGER := 0;
BEGIN
    SELECT COALESCE(c.random_ability_count, 0)
    INTO v_random_ability_count
    FROM classes c
    WHERE c.id = p_class_id;

    SELECT jsonb_agg(jsonb_build_object('key', a.key))
    INTO v_abilities
    FROM abilities a
    WHERE a.class_id = p_class_id
      AND a.is_random = false;

    IF v_abilities IS NULL THEN
        v_abilities := '[]'::jsonb;
    END IF;

    IF v_random_ability_count > 0 THEN
        v_abilities := v_abilities || COALESCE((
            SELECT jsonb_agg(jsonb_build_object('key', a.key))
            FROM (
                SELECT key
                FROM abilities
                WHERE class_id = p_class_id
                  AND is_random = true
                ORDER BY random()
                LIMIT v_random_ability_count
            ) a
        ), '[]'::jsonb);
    END IF;

    RETURN v_abilities;
END;
$$;

COMMIT;
