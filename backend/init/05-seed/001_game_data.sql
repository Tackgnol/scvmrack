--
-- PostgreSQL database dump
--

-- Dumped from database version 16.10
-- Dumped by pg_dump version 16.3

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: classes; Type: TABLE DATA; Schema: public; Owner: p1002_scmgrinder
--

INSERT INTO public.classes VALUES (3, 'Esoteric Hermit', 3, 'The stone of your cave is one with the stars. Silence and perfection. Now the chaos of a fallen world disturbs your rituals.', 4, 4, 2, '{6}', 10, '{"agility": 0, "presence": 2, "strength": -2, "toughness": 0}', '[]', '[{"name": "Master of Fate", "description": "Know the right way with a dr8 Presence test."}, {"name": "Book of Boiling Blood", "description": "Once daily enemy must make a dr12 test or D2 Berserker-slayers appear. D6 roll: 1-4 fight for you, 5-6 they turn on you."}, {"name": "Speaker of Truths", "description": "Twice per day use your wisdom to bring clarity to a creature. The dr of the next test they undertake is lowered by 4."}, {"name": "Initiate of the Invisible College", "description": "Once per day summon D2 scrolls (1-2 sacred, 3-4 unclean). If not used before sunrise they turn to ash."}, {"name": "Bard of the Undying", "description": "Harp music gives +D4 on reaction rolls."}, {"name": "Hawk as Weapon", "gainPet": "Hawk", "description": "Loyal hawk. Attacks/defence dr10 (claws/bite D4) HP 8."}]', 1, 'classes.esoteric_hermit.name', 'classes.esoteric_hermit.description');
INSERT INTO public.classes VALUES (1, 'Fanged Deserter', 1, 'You have thirty or so friends who never let you down: YOUR TEETH. Disloyal, deranged or simply uncontrollable, any group that didn''t boot you out you left anyway.', 10, 10, 4, '{6,6}', 10, '{"agility": -1, "presence": -1, "strength": 2, "toughness": 0}', '[{"name": "Clumsy and Dull-witted", "description": "Agility tests are DR+2, excluding defence. You are incapable of understanding scrolls."}, {"name": "Bite Attack", "description": "DR10 to attack, d6 damage. You must be close to your target."}]', '[{"name": "Crumpled Monster Mask", "description": "Strikes primitive fear into lesser creatures like goblins, gnoums and children. While worn, they check Morale every round."}, {"name": "The Brown Scimitar of Galgenbeck", "gainItem": "The Brown Scimitar of Galgenbeck", "description": "A stinking sword. D6 damage. dr10 attack and defence while you wield it. 1 in 6 chance a wounded enemy dies of sepsis."}, {"name": "Wizard Teeth", "description": "Four weird teeth in a pouch. Roll d6 for each before battle, on 6 one attack deals max damage."}, {"name": "Old Sigürd''s Sling", "gainItem": "Old Sigürd''s Sling", "description": "Woven from hair, 2d4 damage with fist-sized rocks which are everywhere."}, {"name": "Ancient Gore-hound", "gainPet": "Ancient Gore-Hound", "description": "Wizened creature with a superb nose. Attacks with dr10 (bite d6). Defends with dr12, 10 hp. Becomes frenzied around goblins and berserkers."}, {"name": "The Shoe of Death''s Horse", "gainItem": "The Shoe of Death''s Horse", "description": "DR10, d4 damage. 1 in 6 instant kill on small-medium creatures. Returns like boomerang."}]', 1, 'classes.fanged_deserter.name', 'classes.fanged_deserter.description');
INSERT INTO public.classes VALUES (2, 'Gutterborn Scum', 2, 'An ill star smiled upon your birth. Poverty, crime and bad parenting didn''t help either. A razor blade and a moonless night are worth a week of chump-work.', 6, 6, 2, '{6}', 10, '{"agility": 0, "presence": 0, "strength": -2, "toughness": 0}', '[{"name": "Stealthy", "description": "All Presence and Agility tests have their DR reduced by 2."}]', '[{"name": "Coward’s Jab", "description": "When attacking by surprise test Agility dr10. On a success you automatically hit once with a light one-handed weapon, dealing normal damage +3."}, {"name": "Filthy Fingersmith", "gainItem": "Lockpicks", "description": "Pick locks with a dr8 Agility test. You also begin with lockpicks!"}, {"name": "Abominable Gob Lobber", "description": "Spit d2 times during a fight. Roll a dr8 Presence test for accuracy. Targets are blinded, retching and vomiting for d4 rounds. Others witnessing this must test Toughness (PCs dr10, enemies dr12) or vomit."}, {"name": "Escaping Fate", "description": "50% chance omens are not spent when used."}, {"name": "Excretal Stealth", "description": "Preternatural ability to hide in muck. When hidden in these conditions a dr16 Presence test is required to notice you."}, {"name": "Dodging Death", "description": "On death, if there is even the slightest possibility that you survived, there is a 50% chance that you did. If successful, after 10 rounds you pop back up with d4 hp."}]', 1, 'classes.gutterborn_scum.name', 'classes.gutterborn_scum.description');
INSERT INTO public.classes VALUES (4, 'Wretched Royalty', 4, 'Bowed down only by the memories of your own lost glory, you could never submit to anyone else. Not you, of noble blood!', 6, 8, 3, '{6,6,6,6}', 10, '{"agility": 0, "presence": 0, "strength": 0, "toughness": 0}', '[]', '[{"name": "The Blade of your Ancestors", "gainItem": "The Blade of your Ancestors", "description": "Talking sword, foppish and unreliable. Taunts failures. 1 in 6 chance to attack you or companions. D6+1 damage, DR10."}, {"name": "Poltroon the Court Jester", "gainPet": "Poltroon the Court Jester", "description": "Useless but makes enemies lose focus. For the first two rounds you and your allies get +2 on attack/defence."}, {"name": "Barbarister the Incredible Horse", "gainPet": "Barbarister the Incredible Horse", "description": "Magical, intelligent, arrogant talking horse. Persuade him for +2 to Presence tests involving logic and intellect."}, {"name": "Hamfund the Squire", "gainPet": "Hamfund the Squire", "description": "Cowardly servant guards Eurekia sword. 2d6 damage but 1 in 6 kills squire and sword vanishes."}, {"name": "The Snake-Skin Gift", "gainItem": "The Snake-Skin Gift", "description": "Dagger does d4 damage, on 1 target dies of poison."}, {"name": "Horn of the Schleswig Lords", "description": "Once daily, blare trumpet and test Presence dr12. One creature may make their next non-combat test an automatic success."}]', 2, 'classes.wretched_royalty.name', 'classes.wretched_royalty.description');
INSERT INTO public.classes VALUES (5, 'Heretical Priest', 5, 'Hunted by the Two-Headed Basilisks of the One True Faith, you can be found raving in ruins and desecrating cathedrals by night.', 8, 8, 4, '{6,6,6}', 10, '{"agility": 0, "presence": 2, "strength": -2, "toughness": 0}', '[]', '[{"name": "Sacred Shepherd’s Crook", "gainItem": "Sacred Shepherd’s Crook", "description": "Staff does 2d4 damage except to faithless humans."}, {"name": "Stolen Mitre", "description": "Defence dr10. If pulled over ears outside battle, Priest becomes nearly invisible (Stealth dr8)."}, {"name": "List of Sins", "description": "Successful Presence dr10: A strange light surrounds evil creatures. Owner defends with +2 against them."}, {"name": "The Blasphemous Nechrubel Bible", "description": "Once per day read: Even roll heals PCs d4 hp after 5 min rest; Odd roll causes hallucinations until sunrise."}, {"name": "Stones taken from Thel-Emas’ lost temple", "description": "Pattern reveals if danger lurks in adjacent room. Priest tests Presence dr10 to see if they are true."}, {"name": "Crucifix", "description": "Use against undead, trolls and goblins. Check morale (Presence mod included) to see if they bow and remove themselves."}]', 1, 'classes.heretical_priest.name', 'classes.heretical_priest.description');
INSERT INTO public.classes VALUES (6, 'Occult Herbmaster', 6, 'Born of the mushroom, raised in the glade, watched by the eye of the moon in a silverblack pool.', 6, 6, 2, '{6,6}', 10, '{"agility": 0, "presence": 0, "strength": -2, "toughness": 2}', '[{"name": "Portable Laboratory", "description": "Daily create two random decoctions and brew d4 doses total. Lose vitality after 24 hours."}, {"name": "Decoctions Available", "description": "Red Poison, Ezumiel’s Vapor, Southern Frog Stew, Elixir Vitalis, Spider-Owl Soup, Fernor’s Philtre, Hyphos’ Enervating Snuff, Black Poison"}]', '[]', 0, 'classes.occult_herbmaster.name', 'classes.occult_herbmaster.description');


--
-- Data for Name: abilities; Type: TABLE DATA; Schema: public; Owner: p1002_scmgrinder
--

INSERT INTO public.abilities VALUES (1, 1, 'abilities.fanged_deserter.clumsy', false, NULL);
INSERT INTO public.abilities VALUES (2, 1, 'abilities.fanged_deserter.bite', false, NULL);
INSERT INTO public.abilities VALUES (3, 1, 'abilities.fanged_deserter.mask', true, 1);
INSERT INTO public.abilities VALUES (4, 1, 'abilities.fanged_deserter.scimitar', true, 2);
INSERT INTO public.abilities VALUES (5, 1, 'abilities.fanged_deserter.teeth', true, 3);
INSERT INTO public.abilities VALUES (6, 1, 'abilities.fanged_deserter.sling', true, 4);
INSERT INTO public.abilities VALUES (7, 1, 'abilities.fanged_deserter.hound', true, 5);
INSERT INTO public.abilities VALUES (8, 1, 'abilities.fanged_deserter.shoe', true, 6);
INSERT INTO public.abilities VALUES (9, 2, 'abilities.gutterborn_scum.stealthy', false, NULL);
INSERT INTO public.abilities VALUES (10, 2, 'abilities.gutterborn_scum.jab', true, 1);
INSERT INTO public.abilities VALUES (11, 2, 'abilities.gutterborn_scum.fingersmith', true, 2);
INSERT INTO public.abilities VALUES (12, 2, 'abilities.gutterborn_scum.gob_lobber', true, 3);
INSERT INTO public.abilities VALUES (13, 2, 'abilities.gutterborn_scum.fate', true, 4);
INSERT INTO public.abilities VALUES (14, 2, 'abilities.gutterborn_scum.stealth', true, 5);
INSERT INTO public.abilities VALUES (15, 2, 'abilities.gutterborn_scum.dodging', true, 6);
INSERT INTO public.abilities VALUES (16, 3, 'abilities.esoteric_hermit.master_of_fate', true, 1);
INSERT INTO public.abilities VALUES (17, 3, 'abilities.esoteric_hermit.book', true, 2);
INSERT INTO public.abilities VALUES (18, 3, 'abilities.esoteric_hermit.speaker', true, 3);
INSERT INTO public.abilities VALUES (19, 3, 'abilities.esoteric_hermit.initiate', true, 4);
INSERT INTO public.abilities VALUES (20, 3, 'abilities.esoteric_hermit.bard', true, 5);
INSERT INTO public.abilities VALUES (21, 3, 'abilities.esoteric_hermit.hawk', true, 6);
INSERT INTO public.abilities VALUES (22, 4, 'abilities.wretched_royalty.blade', true, 1);
INSERT INTO public.abilities VALUES (23, 4, 'abilities.wretched_royalty.poltroon', true, 2);
INSERT INTO public.abilities VALUES (24, 4, 'abilities.wretched_royalty.barbarister', true, 3);
INSERT INTO public.abilities VALUES (25, 4, 'abilities.wretched_royalty.hamfund', true, 4);
INSERT INTO public.abilities VALUES (26, 4, 'abilities.wretched_royalty.gift', true, 5);
INSERT INTO public.abilities VALUES (27, 4, 'abilities.wretched_royalty.horn', true, 6);
INSERT INTO public.abilities VALUES (28, 5, 'abilities.heretical_priest.crook', true, 1);
INSERT INTO public.abilities VALUES (29, 5, 'abilities.heretical_priest.mitre', true, 2);
INSERT INTO public.abilities VALUES (30, 5, 'abilities.heretical_priest.sins', true, 3);
INSERT INTO public.abilities VALUES (31, 5, 'abilities.heretical_priest.bible', true, 4);
INSERT INTO public.abilities VALUES (32, 5, 'abilities.heretical_priest.stones', true, 5);
INSERT INTO public.abilities VALUES (33, 5, 'abilities.heretical_priest.crucifix', true, 6);
INSERT INTO public.abilities VALUES (34, 6, 'abilities.occult_herbmaster.decoctions', false, NULL);
INSERT INTO public.abilities VALUES (35, 6, 'abilities.occult_herbmaster.red_poison', true, 1);
INSERT INTO public.abilities VALUES (36, 6, 'abilities.occult_herbmaster.ezumiel', true, 2);
INSERT INTO public.abilities VALUES (37, 6, 'abilities.occult_herbmaster.frog', true, 3);
INSERT INTO public.abilities VALUES (38, 6, 'abilities.occult_herbmaster.vitalis', true, 4);
INSERT INTO public.abilities VALUES (39, 6, 'abilities.occult_herbmaster.soup', true, 5);
INSERT INTO public.abilities VALUES (40, 6, 'abilities.occult_herbmaster.philtre', true, 6);
INSERT INTO public.abilities VALUES (41, 6, 'abilities.occult_herbmaster.hyphos', true, 7);
INSERT INTO public.abilities VALUES (42, 6, 'abilities.occult_herbmaster.black_poison', true, 8);



--
-- Data for Name: armors; Type: TABLE DATA; Schema: public; Owner: p1002_scmgrinder
--

INSERT INTO public.armors VALUES (1, 'armor.fur', '{armor,light-armor}', '{2}', 1, 20, false, 1, '[]');
INSERT INTO public.armors VALUES (2, 'armor.padded-cloth', '{armor,light-armor}', '{2}', 2, 20, false, 1, '[]');
INSERT INTO public.armors VALUES (3, 'armor.leather', '{armor,light-armor}', '{2}', 2, 20, false, 1, '[]');
INSERT INTO public.armors VALUES (4, 'armor.scale', '{armor,medium-armor,metal}', '{4}', 3, 100, false, 2, '[{"value": -2, "source": "Scale armor", "statistic": "agility"}]');
INSERT INTO public.armors VALUES (5, 'armor.mail', '{armor,medium-armor,metal}', '{4}', 3, 100, false, 2, '[{"value": -2, "source": "Mail armor", "statistic": "agility"}]');
INSERT INTO public.armors VALUES (6, 'armor.splint', '{armor,heavy-armor,metal}', '{6}', 4, 200, false, 3, '[{"value": -4, "source": "Splint armor", "exclude": ["defence", "buff", "item"], "statistic": "agility"}, {"value": -2, "source": "Splint armor", "exclude": ["ability", "test", "melee", "ranged", "cast", "heal", "buff"], "statistic": "agility"}]');
INSERT INTO public.armors VALUES (7, 'armor.plate', '{armor,heavy-armor,metal}', '{6}', 4, 200, false, 3, '[{"value": -4, "source": "Plate armor", "exclude": ["defence", "buff"], "statistic": "agility"}, {"value": -2, "source": "Plate armor", "exclude": ["ability", "test", "melee", "ranged", "cast", "heal", "buff"], "statistic": "agility"}]');


--
-- Data for Name: body_descriptions; Type: TABLE DATA; Schema: public; Owner: p1002_scmgrinder
--

INSERT INTO public.body_descriptions VALUES (1, 'body.1', 1);
INSERT INTO public.body_descriptions VALUES (2, 'body.2', 2);
INSERT INTO public.body_descriptions VALUES (3, 'body.3', 3);
INSERT INTO public.body_descriptions VALUES (4, 'body.4', 4);
INSERT INTO public.body_descriptions VALUES (5, 'body.5', 5);
INSERT INTO public.body_descriptions VALUES (6, 'body.6', 6);
INSERT INTO public.body_descriptions VALUES (7, 'body.7', 7);
INSERT INTO public.body_descriptions VALUES (8, 'body.8', 8);
INSERT INTO public.body_descriptions VALUES (9, 'body.9', 9);
INSERT INTO public.body_descriptions VALUES (10, 'body.10', 10);
INSERT INTO public.body_descriptions VALUES (11, 'body.11', 11);
INSERT INTO public.body_descriptions VALUES (12, 'body.12', 12);
INSERT INTO public.body_descriptions VALUES (13, 'body.13', 13);
INSERT INTO public.body_descriptions VALUES (14, 'body.14', 14);
INSERT INTO public.body_descriptions VALUES (15, 'body.15', 15);
INSERT INTO public.body_descriptions VALUES (16, 'body.16', 16);
INSERT INTO public.body_descriptions VALUES (17, 'body.17', 17);
INSERT INTO public.body_descriptions VALUES (18, 'body.18', 18);
INSERT INTO public.body_descriptions VALUES (19, 'body.19', 19);
INSERT INTO public.body_descriptions VALUES (20, 'body.20', 20);


--
-- Data for Name: equipment; Type: TABLE DATA; Schema: public; Owner: p1002_scmgrinder
--

INSERT INTO public.equipment VALUES (1, 'equipment.backpack', '{carry}', NULL, NULL, NULL, NULL, NULL, NULL, 6, false, NULL, 1, NULL, NULL, NULL);
INSERT INTO public.equipment VALUES (2, 'equipment.sack', '{carry}', NULL, NULL, NULL, NULL, NULL, NULL, 3, false, NULL, 1, NULL, NULL, NULL);
INSERT INTO public.equipment VALUES (3, 'equipment.small-wagon', '{carry}', NULL, NULL, NULL, NULL, NULL, NULL, 25, false, NULL, 1, NULL, NULL, NULL);
INSERT INTO public.equipment VALUES (4, 'equipment.donkey', '{carry}', NULL, NULL, NULL, NULL, NULL, NULL, 10, false, NULL, 1, NULL, NULL, NULL);
INSERT INTO public.equipment VALUES (5, 'equipment.rope', '{tool}', NULL, NULL, NULL, NULL, NULL, NULL, 4, false, NULL, 1, NULL, NULL, NULL);
INSERT INTO public.equipment VALUES (6, 'equipment.blanket', '{camping}', NULL, NULL, NULL, NULL, NULL, NULL, 4, false, NULL, 1, NULL, NULL, NULL);
INSERT INTO public.equipment VALUES (7, 'equipment.torches', '{tool,lighting,consumable}', NULL, NULL, 'presence', NULL, NULL, NULL, 2, false, NULL, 1, 'Torch', 6, '{"lose": "Torch", "text": "You light your torch", "type": "MultiUse"}');
INSERT INTO public.equipment VALUES (8, 'equipment.lantern', '{tool,metal,lighting,consumable}', NULL, NULL, 'presence', NULL, NULL, NULL, 10, false, NULL, 1, 'Oil', 6, '{"lose": "Oil", "text": "You add oil and light it", "type": "MultiUse"}');
INSERT INTO public.equipment VALUES (9, 'equipment.magnesium-strip', '{tool,consumable}', NULL, NULL, NULL, NULL, NULL, NULL, 4, false, NULL, 1, NULL, NULL, NULL);
INSERT INTO public.equipment VALUES (10, 'equipment.firesteel', '{tool,metal}', NULL, NULL, NULL, NULL, NULL, NULL, 4, false, NULL, 1, NULL, NULL, NULL);
INSERT INTO public.equipment VALUES (11, 'equipment.sharp-needle', '{tool}', NULL, NULL, NULL, NULL, NULL, NULL, 3, false, NULL, 1, NULL, NULL, NULL);
INSERT INTO public.equipment VALUES (12, 'equipment.wooden-crucifix', '{symbol}', NULL, NULL, NULL, NULL, NULL, NULL, 9, false, NULL, 1, NULL, NULL, NULL);
INSERT INTO public.equipment VALUES (13, 'equipment.silver-crucifix', '{symbol,metal}', NULL, NULL, NULL, NULL, NULL, NULL, 60, false, NULL, 1, NULL, NULL, NULL);
INSERT INTO public.equipment VALUES (14, 'equipment.lockpicks', '{tool,metal}', NULL, NULL, NULL, NULL, NULL, NULL, 5, false, NULL, 1, NULL, NULL, NULL);
INSERT INTO public.equipment VALUES (15, 'equipment.manacles', '{tool,metal}', NULL, NULL, NULL, NULL, NULL, NULL, 10, false, NULL, 1, NULL, NULL, NULL);
INSERT INTO public.equipment VALUES (16, 'equipment.toolbox', '{tool,metal}', NULL, NULL, NULL, NULL, NULL, NULL, 20, false, NULL, 1, NULL, NULL, NULL);
INSERT INTO public.equipment VALUES (17, 'equipment.heavy-chain', '{tool,metal}', NULL, NULL, NULL, NULL, NULL, NULL, 10, false, NULL, 1, NULL, NULL, NULL);
INSERT INTO public.equipment VALUES (18, 'equipment.scissors', '{tool,metal}', NULL, NULL, NULL, NULL, NULL, NULL, 9, false, NULL, 1, NULL, NULL, NULL);
INSERT INTO public.equipment VALUES (19, 'equipment.grappling-hook', '{tool,metal}', NULL, NULL, NULL, NULL, NULL, NULL, 12, false, NULL, 1, NULL, NULL, NULL);
INSERT INTO public.equipment VALUES (20, 'equipment.noose', '{tool}', NULL, NULL, NULL, NULL, NULL, NULL, 5, false, NULL, 1, NULL, NULL, NULL);
INSERT INTO public.equipment VALUES (21, 'equipment.tent', '{camping}', NULL, NULL, NULL, NULL, NULL, NULL, 12, false, NULL, 1, NULL, NULL, NULL);
INSERT INTO public.equipment VALUES (22, 'equipment.mirror', '{luxury,metal}', NULL, NULL, NULL, NULL, NULL, NULL, 15, false, NULL, 1, NULL, NULL, NULL);
INSERT INTO public.equipment VALUES (23, 'equipment.exquisite-perfume', '{luxury,consumable}', NULL, NULL, NULL, NULL, NULL, NULL, 25, false, NULL, 1, NULL, NULL, NULL);
INSERT INTO public.equipment VALUES (24, 'equipment.bear-trap', '{trap,metal}', NULL, NULL, NULL, NULL, NULL, NULL, 20, false, NULL, 1, NULL, NULL, NULL);
INSERT INTO public.equipment VALUES (25, 'equipment.lard', '{food,consumable}', NULL, NULL, NULL, NULL, NULL, NULL, 5, false, NULL, 1, NULL, NULL, NULL);
INSERT INTO public.equipment VALUES (26, 'equipment.chewing-tobacco', '{consumable}', NULL, NULL, NULL, NULL, NULL, NULL, 1, false, NULL, 4, NULL, NULL, NULL);
INSERT INTO public.equipment VALUES (27, 'equipment.chalk', '{consumable,tool}', NULL, NULL, NULL, NULL, NULL, NULL, 1, false, NULL, 4, NULL, NULL, NULL);
INSERT INTO public.equipment VALUES (28, 'equipment.salt', '{consumable,tool}', NULL, NULL, NULL, NULL, NULL, NULL, 3, true, NULL, 1, NULL, NULL, NULL);
INSERT INTO public.equipment VALUES (29, 'equipment.medicine-chest', '{consumable,tool,healing}', NULL, NULL, 'presence', NULL, NULL, NULL, 15, false, NULL, 2, NULL, NULL, '{"heal": 6, "type": "SingleUse"}');
INSERT INTO public.equipment VALUES (30, 'equipment.life-elixir', '{healing,consumable}', NULL, NULL, NULL, NULL, NULL, NULL, 15, false, NULL, 1, NULL, NULL, '{"heal": 6, "type": "SingleUse"}');
INSERT INTO public.equipment VALUES (31, 'equipment.red-poison', '{consumable,poison}', NULL, NULL, NULL, NULL, NULL, NULL, 20, false, NULL, 1, NULL, NULL, '{"type": "SingleUse"}');
INSERT INTO public.equipment VALUES (32, 'equipment.black-poison', '{consumable,poison}', NULL, NULL, NULL, NULL, NULL, NULL, 20, false, NULL, 1, NULL, NULL, '{"type": "SingleUse"}');
INSERT INTO public.equipment VALUES (33, 'equipment.bomb', '{weapon,explosive,consumable,ranged}', NULL, NULL, NULL, NULL, NULL, NULL, 40, true, NULL, 1, NULL, NULL, '{"type": "SingleUse", "damage": 10}');
INSERT INTO public.equipment VALUES (34, 'scroll.unclean.1', '{scroll,unclean}', NULL, NULL, NULL, NULL, NULL, NULL, 50, false, 1, 1, NULL, NULL, NULL);
INSERT INTO public.equipment VALUES (35, 'scroll.unclean.2', '{scroll,unclean}', NULL, NULL, NULL, NULL, NULL, NULL, 50, false, 2, 1, NULL, NULL, NULL);
INSERT INTO public.equipment VALUES (36, 'scroll.unclean.3', '{scroll,unclean}', NULL, NULL, NULL, NULL, NULL, NULL, 50, false, 3, 1, NULL, NULL, NULL);
INSERT INTO public.equipment VALUES (37, 'scroll.unclean.4', '{scroll,unclean}', NULL, NULL, NULL, NULL, NULL, NULL, 50, false, 4, 1, NULL, NULL, NULL);
INSERT INTO public.equipment VALUES (38, 'scroll.unclean.5', '{scroll,unclean}', NULL, NULL, NULL, NULL, NULL, NULL, 50, false, 5, 1, NULL, NULL, NULL);
INSERT INTO public.equipment VALUES (39, 'scroll.unclean.6', '{scroll,unclean}', NULL, NULL, NULL, NULL, NULL, NULL, 50, false, 6, 1, NULL, NULL, NULL);
INSERT INTO public.equipment VALUES (40, 'scroll.unclean.7', '{scroll,unclean}', NULL, NULL, NULL, NULL, NULL, NULL, 50, false, 7, 1, NULL, NULL, NULL);
INSERT INTO public.equipment VALUES (41, 'scroll.unclean.8', '{scroll,unclean}', NULL, NULL, NULL, NULL, NULL, NULL, 50, false, 8, 1, NULL, NULL, NULL);
INSERT INTO public.equipment VALUES (42, 'scroll.unclean.9', '{scroll,unclean}', NULL, NULL, NULL, NULL, NULL, NULL, 50, false, 9, 1, NULL, NULL, NULL);
INSERT INTO public.equipment VALUES (43, 'scroll.unclean.10', '{scroll,unclean}', NULL, NULL, NULL, NULL, NULL, NULL, 50, false, 10, 1, NULL, NULL, NULL);
INSERT INTO public.equipment VALUES (44, 'scroll.sacred.1', '{scroll,sacred}', NULL, NULL, NULL, NULL, NULL, NULL, 50, false, 1, 1, NULL, NULL, NULL);
INSERT INTO public.equipment VALUES (45, 'scroll.sacred.2', '{scroll,sacred}', NULL, NULL, NULL, NULL, NULL, NULL, 50, false, 2, 1, NULL, NULL, NULL);
INSERT INTO public.equipment VALUES (46, 'scroll.sacred.3', '{scroll,sacred}', NULL, NULL, NULL, NULL, NULL, NULL, 50, false, 3, 1, NULL, NULL, NULL);
INSERT INTO public.equipment VALUES (47, 'scroll.sacred.4', '{scroll,sacred}', NULL, NULL, NULL, NULL, NULL, NULL, 50, false, 4, 1, NULL, NULL, NULL);
INSERT INTO public.equipment VALUES (48, 'scroll.sacred.5', '{scroll,sacred}', NULL, NULL, NULL, NULL, NULL, NULL, 50, false, 5, 1, NULL, NULL, NULL);
INSERT INTO public.equipment VALUES (49, 'scroll.sacred.6', '{scroll,sacred}', NULL, NULL, NULL, NULL, NULL, NULL, 50, false, 6, 1, NULL, NULL, NULL);
INSERT INTO public.equipment VALUES (50, 'scroll.sacred.7', '{scroll,sacred}', NULL, NULL, NULL, NULL, NULL, NULL, 50, false, 7, 1, NULL, NULL, NULL);
INSERT INTO public.equipment VALUES (51, 'scroll.sacred.8', '{scroll,sacred}', NULL, NULL, NULL, NULL, NULL, NULL, 50, false, 8, 1, NULL, NULL, NULL);
INSERT INTO public.equipment VALUES (52, 'scroll.sacred.9', '{scroll,sacred}', NULL, NULL, NULL, NULL, NULL, NULL, 50, false, 9, 1, NULL, NULL, NULL);
INSERT INTO public.equipment VALUES (53, 'scroll.sacred.10', '{scroll,sacred}', NULL, NULL, NULL, NULL, NULL, NULL, 50, false, 10, 1, NULL, NULL, NULL);
INSERT INTO public.equipment VALUES (54, 'equipment.ezumiel-vapor', '{consumable,decoction}', NULL, NULL, NULL, NULL, NULL, NULL, 0, false, NULL, 1, NULL, NULL, '{"type": "SingleUse", "effectDie": 4}');
INSERT INTO public.equipment VALUES (55, 'equipment.southern-frog', '{consumable,decoction}', NULL, NULL, NULL, NULL, NULL, NULL, 0, false, NULL, 1, NULL, NULL, '{"type": "SingleUse", "effectDie": 4}');
INSERT INTO public.equipment VALUES (56, 'equipment.elixir-vitalis', '{consumable,decoction}', NULL, NULL, NULL, NULL, NULL, NULL, 0, false, NULL, 1, NULL, NULL, '{"heal": 6, "type": "SingleUse"}');
INSERT INTO public.equipment VALUES (57, 'equipment.spider-owl-soup', '{consumable,decoction}', NULL, NULL, NULL, NULL, NULL, NULL, 0, false, NULL, 1, NULL, NULL, '{"type": "SingleUse"}');
INSERT INTO public.equipment VALUES (58, 'equipment.fernors-philtre', '{consumable,decoction}', NULL, NULL, NULL, NULL, NULL, NULL, 0, false, NULL, 1, NULL, NULL, '{"type": "SingleUse", "effectDie": 4}');
INSERT INTO public.equipment VALUES (59, 'equipment.hyphos-snuff', '{consumable,decoction}', NULL, NULL, NULL, NULL, NULL, NULL, 0, false, NULL, 1, NULL, NULL, '{"type": "SingleUse", "statuses": [{"value": -2, "source": "Hyphos snuff", "exclude": ["ability", "heal", "ranged", "melee", "cast"], "statistic": "agility"}]}');
INSERT INTO public.equipment VALUES (60, 'equipment.arrows', '{ammo}', NULL, NULL, NULL, NULL, NULL, NULL, 3, false, NULL, 1, 'Arrow', 10, NULL);
INSERT INTO public.equipment VALUES (61, 'equipment.bolts', '{ammo}', NULL, NULL, NULL, NULL, NULL, NULL, 5, false, NULL, 1, 'Bolt', 10, NULL);



--
-- Data for Name: habits; Type: TABLE DATA; Schema: public; Owner: p1002_scmgrinder
--

INSERT INTO public.habits VALUES (1, 'habits.1', 1, false, '[{"ammo": {"type": "Stone", "startWith": 66}, "name": "Sackcloth bag", "tags": ["habit-item"], "description": "filled with sharp stones"}]');
INSERT INTO public.habits VALUES (2, 'habits.2', 2, false, '[]');
INSERT INTO public.habits VALUES (3, 'habits.3', 3, false, '[]');
INSERT INTO public.habits VALUES (4, 'habits.4', 4, false, '[]');
INSERT INTO public.habits VALUES (5, 'habits.5', 5, false, '[]');
INSERT INTO public.habits VALUES (6, 'habits.6', 6, false, '[]');
INSERT INTO public.habits VALUES (7, 'habits.7', 7, false, '[{"name": "Skull", "tags": ["useless"], "description": "a trusted friend"}]');
INSERT INTO public.habits VALUES (8, 'habits.8', 8, false, '[]');
INSERT INTO public.habits VALUES (9, 'habits.9', 9, false, '[]');
INSERT INTO public.habits VALUES (10, 'habits.10', 10, false, '[]');
INSERT INTO public.habits VALUES (11, 'habits.11', 11, false, '[]');
INSERT INTO public.habits VALUES (12, 'habits.12', 12, false, '[]');
INSERT INTO public.habits VALUES (13, 'habits.13', 13, false, '[]');
INSERT INTO public.habits VALUES (14, 'habits.14', 14, false, '[]');
INSERT INTO public.habits VALUES (15, 'habits.15', 15, false, '[]');
INSERT INTO public.habits VALUES (16, 'habits.16', 16, false, '[]');
INSERT INTO public.habits VALUES (17, 'habits.17', 17, false, '[]');
INSERT INTO public.habits VALUES (18, 'habits.18', 18, false, '[]');
INSERT INTO public.habits VALUES (19, 'habits.19', 19, false, '[]');
INSERT INTO public.habits VALUES (20, 'habits.20', 20, false, '[{"name": "String necklace", "tags": ["useless"], "description": "most of the teeth are mismatched..."}]');


--
-- Data for Name: names; Type: TABLE DATA; Schema: public; Owner: p1002_scmgrinder
--

INSERT INTO public.names VALUES (1, 'Aerg-Tval');
INSERT INTO public.names VALUES (2, 'Agn');
INSERT INTO public.names VALUES (3, 'Arvant');
INSERT INTO public.names VALUES (4, 'Belsum');
INSERT INTO public.names VALUES (5, 'Belum');
INSERT INTO public.names VALUES (6, 'Brinta');
INSERT INTO public.names VALUES (7, 'Börda');
INSERT INTO public.names VALUES (8, 'Daeru');
INSERT INTO public.names VALUES (9, 'Eldar');
INSERT INTO public.names VALUES (10, 'Felban');
INSERT INTO public.names VALUES (11, 'Gotven');
INSERT INTO public.names VALUES (12, 'Graft');
INSERT INTO public.names VALUES (13, 'Grin');
INSERT INTO public.names VALUES (14, 'Grittr');
INSERT INTO public.names VALUES (15, 'Haerü');
INSERT INTO public.names VALUES (16, 'Hargha');
INSERT INTO public.names VALUES (17, 'Harmug');
INSERT INTO public.names VALUES (18, 'Jotna');
INSERT INTO public.names VALUES (19, 'Karg');
INSERT INTO public.names VALUES (20, 'Karva');
INSERT INTO public.names VALUES (21, 'Katla');
INSERT INTO public.names VALUES (22, 'Keftar');
INSERT INTO public.names VALUES (23, 'Klort');
INSERT INTO public.names VALUES (24, 'Kratar');
INSERT INTO public.names VALUES (25, 'Kutz');
INSERT INTO public.names VALUES (26, 'Kvetin');
INSERT INTO public.names VALUES (27, 'Lygan');
INSERT INTO public.names VALUES (28, 'Margar');
INSERT INTO public.names VALUES (29, 'Merkari');
INSERT INTO public.names VALUES (30, 'Nagl');
INSERT INTO public.names VALUES (31, 'Niduk');
INSERT INTO public.names VALUES (32, 'Nifehl');
INSERT INTO public.names VALUES (33, 'Prügl');
INSERT INTO public.names VALUES (34, 'Qillnach');
INSERT INTO public.names VALUES (35, 'Risten');
INSERT INTO public.names VALUES (36, 'Svind');
INSERT INTO public.names VALUES (37, 'Theras');
INSERT INTO public.names VALUES (38, 'Therg');
INSERT INTO public.names VALUES (39, 'Torvul');
INSERT INTO public.names VALUES (40, 'Törn');
INSERT INTO public.names VALUES (41, 'Urm');
INSERT INTO public.names VALUES (42, 'Urvarg');
INSERT INTO public.names VALUES (43, 'Vagal');
INSERT INTO public.names VALUES (44, 'Vatan');
INSERT INTO public.names VALUES (45, 'Von');
INSERT INTO public.names VALUES (46, 'Vrakh');
INSERT INTO public.names VALUES (47, 'Vresi');
INSERT INTO public.names VALUES (48, 'Wemut');
INSERT INTO public.names VALUES (49, 'Achard');
INSERT INTO public.names VALUES (50, 'Allram');
INSERT INTO public.names VALUES (51, 'Alwrig');
INSERT INTO public.names VALUES (52, 'Ansgot');
INSERT INTO public.names VALUES (53, 'Aren');
INSERT INTO public.names VALUES (54, 'Arga');
INSERT INTO public.names VALUES (55, 'Arundel');
INSERT INTO public.names VALUES (56, 'Aslan');
INSERT INTO public.names VALUES (57, 'Ator');
INSERT INTO public.names VALUES (58, 'Azor');
INSERT INTO public.names VALUES (59, 'Balfyr');
INSERT INTO public.names VALUES (60, 'Belmis');
INSERT INTO public.names VALUES (61, 'Belsnickel');
INSERT INTO public.names VALUES (62, 'Benzen');
INSERT INTO public.names VALUES (63, 'Beörn');
INSERT INTO public.names VALUES (64, 'Bigred');
INSERT INTO public.names VALUES (65, 'Bigtun');
INSERT INTO public.names VALUES (66, 'Blotra');
INSERT INTO public.names VALUES (67, 'Blotvar');
INSERT INTO public.names VALUES (68, 'Blygr');
INSERT INTO public.names VALUES (69, 'Brom');
INSERT INTO public.names VALUES (70, 'Bölbeck');
INSERT INTO public.names VALUES (71, 'Carax');
INSERT INTO public.names VALUES (72, 'Dedrik');
INSERT INTO public.names VALUES (73, 'Dekram');
INSERT INTO public.names VALUES (74, 'Derril');
INSERT INTO public.names VALUES (75, 'Dismoll');
INSERT INTO public.names VALUES (76, 'Dorhant');
INSERT INTO public.names VALUES (77, 'Dritz');
INSERT INTO public.names VALUES (78, 'Drulme');
INSERT INTO public.names VALUES (79, 'Dundar');
INSERT INTO public.names VALUES (80, 'Duval');
INSERT INTO public.names VALUES (81, 'Eglom');
INSERT INTO public.names VALUES (82, 'Espech');
INSERT INTO public.names VALUES (83, 'Essen');
INSERT INTO public.names VALUES (84, 'Fechr');
INSERT INTO public.names VALUES (85, 'Ferrum');
INSERT INTO public.names VALUES (86, 'Foolium');
INSERT INTO public.names VALUES (87, 'Frustan');
INSERT INTO public.names VALUES (88, 'Fyrfank');
INSERT INTO public.names VALUES (89, 'Gamron');
INSERT INTO public.names VALUES (90, 'Glesbrig');
INSERT INTO public.names VALUES (91, 'Glum');
INSERT INTO public.names VALUES (92, 'Gnell');
INSERT INTO public.names VALUES (93, 'Gorwa');
INSERT INTO public.names VALUES (94, 'Grendl');
INSERT INTO public.names VALUES (95, 'Grima');
INSERT INTO public.names VALUES (96, 'Grotske');
INSERT INTO public.names VALUES (97, 'Guzar');
INSERT INTO public.names VALUES (98, 'Hachet');
INSERT INTO public.names VALUES (99, 'Halbörd');
INSERT INTO public.names VALUES (100, 'Halva');
INSERT INTO public.names VALUES (101, 'Hamr');
INSERT INTO public.names VALUES (102, 'Hargar');
INSERT INTO public.names VALUES (103, 'Harik');
INSERT INTO public.names VALUES (104, 'Hat');
INSERT INTO public.names VALUES (105, 'Hirmot');
INSERT INTO public.names VALUES (106, 'Hispan');
INSERT INTO public.names VALUES (107, 'Hodork');
INSERT INTO public.names VALUES (108, 'Honsel');
INSERT INTO public.names VALUES (109, 'Hostan');
INSERT INTO public.names VALUES (110, 'Hostra');
INSERT INTO public.names VALUES (111, 'Igorn');
INSERT INTO public.names VALUES (112, 'Junkr');
INSERT INTO public.names VALUES (113, 'Jurt');
INSERT INTO public.names VALUES (114, 'Kalih');
INSERT INTO public.names VALUES (115, 'Kalruz');
INSERT INTO public.names VALUES (116, 'Kerwyn');
INSERT INTO public.names VALUES (117, 'Kollsup');
INSERT INTO public.names VALUES (118, 'Kotlin');
INSERT INTO public.names VALUES (119, 'Kotran');
INSERT INTO public.names VALUES (120, 'Krang');
INSERT INTO public.names VALUES (121, 'Krassel');
INSERT INTO public.names VALUES (122, 'Krëk');
INSERT INTO public.names VALUES (123, 'Kulmar');
INSERT INTO public.names VALUES (124, 'Kultr');
INSERT INTO public.names VALUES (125, 'Këttel');
INSERT INTO public.names VALUES (126, 'Lagorm');
INSERT INTO public.names VALUES (127, 'Lenker');
INSERT INTO public.names VALUES (128, 'Lessar');
INSERT INTO public.names VALUES (129, 'Lurtz');
INSERT INTO public.names VALUES (130, 'Magont');
INSERT INTO public.names VALUES (131, 'Magrot');
INSERT INTO public.names VALUES (132, 'Magverk');
INSERT INTO public.names VALUES (133, 'Malaiz');
INSERT INTO public.names VALUES (134, 'Malfux');
INSERT INTO public.names VALUES (135, 'Masar');
INSERT INTO public.names VALUES (136, 'Miron');
INSERT INTO public.names VALUES (137, 'Mirthgin');
INSERT INTO public.names VALUES (138, 'Mogr');
INSERT INTO public.names VALUES (139, 'Mordan');
INSERT INTO public.names VALUES (140, 'Mordhaug');
INSERT INTO public.names VALUES (141, 'Morum');
INSERT INTO public.names VALUES (142, 'Myrrha');
INSERT INTO public.names VALUES (143, 'Naplam');
INSERT INTO public.names VALUES (144, 'Nardag');
INSERT INTO public.names VALUES (145, 'Nedrigg');
INSERT INTO public.names VALUES (146, 'Nilhark');
INSERT INTO public.names VALUES (147, 'Numtor');
INSERT INTO public.names VALUES (148, 'Ochra');
INSERT INTO public.names VALUES (149, 'Ogram');
INSERT INTO public.names VALUES (150, 'Oxkart');
INSERT INTO public.names VALUES (151, 'Parma');
INSERT INTO public.names VALUES (152, 'Parthos');
INSERT INTO public.names VALUES (153, 'Phoba');
INSERT INTO public.names VALUES (154, 'Pluck');
INSERT INTO public.names VALUES (155, 'Prosk');
INSERT INTO public.names VALUES (156, 'Pyron');
INSERT INTO public.names VALUES (157, 'Rankor');
INSERT INTO public.names VALUES (158, 'Rask');
INSERT INTO public.names VALUES (159, 'Rebar');
INSERT INTO public.names VALUES (160, 'Rech');
INSERT INTO public.names VALUES (161, 'Regor');
INSERT INTO public.names VALUES (162, 'Rektam');
INSERT INTO public.names VALUES (163, 'Reukr');
INSERT INTO public.names VALUES (164, 'Rhadon');
INSERT INTO public.names VALUES (165, 'Ribb');
INSERT INTO public.names VALUES (166, 'Ronkhil');
INSERT INTO public.names VALUES (167, 'Rot');
INSERT INTO public.names VALUES (168, 'Rotmun');
INSERT INTO public.names VALUES (169, 'Rugnar');
INSERT INTO public.names VALUES (170, 'Rüsa');
INSERT INTO public.names VALUES (171, 'Satmet');
INSERT INTO public.names VALUES (172, 'Sator');
INSERT INTO public.names VALUES (173, 'Satrin');
INSERT INTO public.names VALUES (174, 'Schmikel');
INSERT INTO public.names VALUES (175, 'Sigman');
INSERT INTO public.names VALUES (176, 'Skral');
INSERT INTO public.names VALUES (177, 'Skross');
INSERT INTO public.names VALUES (178, 'Skura');
INSERT INTO public.names VALUES (179, 'Slaktr');
INSERT INTO public.names VALUES (180, 'Slask');
INSERT INTO public.names VALUES (181, 'Slengar');
INSERT INTO public.names VALUES (182, 'Smark');
INSERT INTO public.names VALUES (183, 'Smolk');
INSERT INTO public.names VALUES (184, 'Snott');
INSERT INTO public.names VALUES (185, 'Sorstig');
INSERT INTO public.names VALUES (186, 'Spiegel');
INSERT INTO public.names VALUES (187, 'Stanpeth');
INSERT INTO public.names VALUES (188, 'Stargon');
INSERT INTO public.names VALUES (189, 'Stein');
INSERT INTO public.names VALUES (190, 'Streta');
INSERT INTO public.names VALUES (191, 'Sveda');
INSERT INTO public.names VALUES (192, 'Tark');
INSERT INTO public.names VALUES (193, 'Tarkin');
INSERT INTO public.names VALUES (194, 'Tarmak');
INSERT INTO public.names VALUES (195, 'Temla');
INSERT INTO public.names VALUES (196, 'Torbe');
INSERT INTO public.names VALUES (197, 'Treck');
INSERT INTO public.names VALUES (198, 'Tyke');
INSERT INTO public.names VALUES (199, 'Ungkar');
INSERT INTO public.names VALUES (200, 'Urskinn');
INSERT INTO public.names VALUES (201, 'Usk');
INSERT INTO public.names VALUES (202, 'Vakopr');
INSERT INTO public.names VALUES (203, 'Valkar');
INSERT INTO public.names VALUES (204, 'Vardok');
INSERT INTO public.names VALUES (205, 'Vask');
INSERT INTO public.names VALUES (206, 'Veder');
INSERT INTO public.names VALUES (207, 'Vegra');
INSERT INTO public.names VALUES (208, 'Vendi');
INSERT INTO public.names VALUES (209, 'Vexa');
INSERT INTO public.names VALUES (210, 'Vindag');
INSERT INTO public.names VALUES (211, 'Vitharm');
INSERT INTO public.names VALUES (212, 'Vittra');
INSERT INTO public.names VALUES (213, 'Vort');
INSERT INTO public.names VALUES (214, 'Wort');
INSERT INTO public.names VALUES (215, 'Zweiman');


--
-- Data for Name: origins; Type: TABLE DATA; Schema: public; Owner: p1002_scmgrinder
--

INSERT INTO public.origins VALUES (61, 1, 1, 'origins.fanged_deserter.1');
INSERT INTO public.origins VALUES (62, 1, 2, 'origins.fanged_deserter.2');
INSERT INTO public.origins VALUES (63, 1, 3, 'origins.fanged_deserter.3');
INSERT INTO public.origins VALUES (64, 1, 4, 'origins.fanged_deserter.4');
INSERT INTO public.origins VALUES (65, 1, 5, 'origins.fanged_deserter.5');
INSERT INTO public.origins VALUES (66, 1, 6, 'origins.fanged_deserter.6');
INSERT INTO public.origins VALUES (67, 2, 1, 'origins.gutterborn_scum.1');
INSERT INTO public.origins VALUES (68, 2, 2, 'origins.gutterborn_scum.2');
INSERT INTO public.origins VALUES (69, 2, 3, 'origins.gutterborn_scum.3');
INSERT INTO public.origins VALUES (70, 2, 4, 'origins.gutterborn_scum.4');
INSERT INTO public.origins VALUES (71, 2, 5, 'origins.gutterborn_scum.5');
INSERT INTO public.origins VALUES (72, 2, 6, 'origins.gutterborn_scum.6');
INSERT INTO public.origins VALUES (73, 3, 1, 'origins.esoteric_hermit.1');
INSERT INTO public.origins VALUES (74, 3, 2, 'origins.esoteric_hermit.2');
INSERT INTO public.origins VALUES (75, 3, 3, 'origins.esoteric_hermit.3');
INSERT INTO public.origins VALUES (76, 3, 4, 'origins.esoteric_hermit.4');
INSERT INTO public.origins VALUES (77, 3, 5, 'origins.esoteric_hermit.5');
INSERT INTO public.origins VALUES (78, 3, 6, 'origins.esoteric_hermit.6');
INSERT INTO public.origins VALUES (79, 4, 1, 'origins.wretched_royalty.1');
INSERT INTO public.origins VALUES (80, 4, 2, 'origins.wretched_royalty.2');
INSERT INTO public.origins VALUES (81, 4, 3, 'origins.wretched_royalty.3');
INSERT INTO public.origins VALUES (82, 4, 4, 'origins.wretched_royalty.4');
INSERT INTO public.origins VALUES (83, 4, 5, 'origins.wretched_royalty.5');
INSERT INTO public.origins VALUES (84, 4, 6, 'origins.wretched_royalty.6');
INSERT INTO public.origins VALUES (85, 5, 1, 'origins.heretical_priest.1');
INSERT INTO public.origins VALUES (86, 5, 2, 'origins.heretical_priest.2');
INSERT INTO public.origins VALUES (87, 5, 3, 'origins.heretical_priest.3');
INSERT INTO public.origins VALUES (88, 5, 4, 'origins.heretical_priest.4');
INSERT INTO public.origins VALUES (89, 5, 5, 'origins.heretical_priest.5');
INSERT INTO public.origins VALUES (90, 5, 6, 'origins.heretical_priest.6');
INSERT INTO public.origins VALUES (91, 6, 1, 'origins.occult_herbmaster.1');
INSERT INTO public.origins VALUES (92, 6, 2, 'origins.occult_herbmaster.2');
INSERT INTO public.origins VALUES (93, 6, 3, 'origins.occult_herbmaster.3');
INSERT INTO public.origins VALUES (94, 6, 4, 'origins.occult_herbmaster.4');
INSERT INTO public.origins VALUES (95, 6, 5, 'origins.occult_herbmaster.5');
INSERT INTO public.origins VALUES (96, 6, 6, 'origins.occult_herbmaster.6');


--
-- Data for Name: pets; Type: TABLE DATA; Schema: public; Owner: p1002_scmgrinder
--

INSERT INTO public.pets VALUES (1, 'pets.small-dog', 6, '{animal,pet}', false, '{4}', 'melee', 1, NULL, '[]', 25);
INSERT INTO public.pets VALUES (2, 'pets.monkey', 2, '{animal,pet}', false, '{4}', 'melee', 1, 4, '[]', 15);
INSERT INTO public.pets VALUES (3, 'pets.hawk', 8, '{pet,special}', false, '{4}', 'melee', 1, NULL, '[]', 0);
INSERT INTO public.pets VALUES (4, 'pets.gore-hound', 10, '{pet,special}', false, '{6}', 'melee', 1, NULL, '[]', 0);
INSERT INTO public.pets VALUES (5, 'pets.hamfund', 1, '{pet,special,humanoid}', false, '{6,6}', 'melee', 1, NULL, '[]', 0);
INSERT INTO public.pets VALUES (6, 'pets.barbarister', 1, '{pet,special}', false, '{}', 'buff', 1, NULL, '[{"value": 2, "source": "Barbarister''s guidance", "exclude": ["melee", "ranged", "cast", "ability", "defence", "buff"], "statistic": "presence"}]', 0);
INSERT INTO public.pets VALUES (7, 'pets.poltroon', 1, '{pet,special}', false, '{}', 'buff', 1, NULL, '[{"value": 2, "source": "Poltroon''s annoyance", "exclude": ["melee", "ranged", "cast", "ability", "test", "heal", "buff"], "statistic": "agility"}, {"value": 2, "source": "Poltroon''s annoyance", "exclude": ["defence", "ranged", "cast", "ability", "test", "heal", "buff"], "statistic": "strength"}, {"value": 2, "source": "Poltroon''s annoyance", "exclude": ["defence", "melee", "cast", "ability", "test", "heal", "buff"], "statistic": "presence"}]', 0);



--
-- Data for Name: tales; Type: TABLE DATA; Schema: public; Owner: p1002_scmgrinder
--

INSERT INTO public.tales VALUES (1, 'tales.1', 1, false, '[]');
INSERT INTO public.tales VALUES (2, 'tales.2', 2, false, '[]');
INSERT INTO public.tales VALUES (3, 'tales.3', 3, false, '[]');
INSERT INTO public.tales VALUES (4, 'tales.4', 4, false, '[]');
INSERT INTO public.tales VALUES (5, 'tales.5', 5, false, '[]');
INSERT INTO public.tales VALUES (6, 'tales.6', 6, false, '[]');
INSERT INTO public.tales VALUES (7, 'tales.7', 7, false, '[]');
INSERT INTO public.tales VALUES (8, 'tales.8', 8, false, '[]');
INSERT INTO public.tales VALUES (9, 'tales.9', 9, false, '[]');
INSERT INTO public.tales VALUES (10, 'tales.10', 10, false, '[]');
INSERT INTO public.tales VALUES (11, 'tales.11', 11, false, '[]');
INSERT INTO public.tales VALUES (12, 'tales.12', 12, false, '[]');
INSERT INTO public.tales VALUES (13, 'tales.13', 13, false, '[]');
INSERT INTO public.tales VALUES (14, 'tales.14', 14, false, '[]');
INSERT INTO public.tales VALUES (15, 'tales.15', 15, false, '[]');
INSERT INTO public.tales VALUES (16, 'tales.16', 16, false, '[{"name": "Sling", "tags": ["weapon", "ranged"], "value": 8, "description": "d4 damage, unlimited fist-sized rocks"}]');
INSERT INTO public.tales VALUES (17, 'tales.17', 17, false, '[]');
INSERT INTO public.tales VALUES (18, 'tales.18', 18, false, '[]');
INSERT INTO public.tales VALUES (19, 'tales.19', 19, false, '[]');
INSERT INTO public.tales VALUES (20, 'tales.20', 20, false, '[]');


--
-- Data for Name: traits; Type: TABLE DATA; Schema: public; Owner: p1002_scmgrinder
--

INSERT INTO public.traits VALUES (1, 'traits.1', 1);
INSERT INTO public.traits VALUES (2, 'traits.2', 2);
INSERT INTO public.traits VALUES (3, 'traits.3', 3);
INSERT INTO public.traits VALUES (4, 'traits.4', 4);
INSERT INTO public.traits VALUES (5, 'traits.5', 5);
INSERT INTO public.traits VALUES (6, 'traits.6', 6);
INSERT INTO public.traits VALUES (7, 'traits.7', 7);
INSERT INTO public.traits VALUES (8, 'traits.8', 8);
INSERT INTO public.traits VALUES (9, 'traits.9', 9);
INSERT INTO public.traits VALUES (10, 'traits.10', 10);
INSERT INTO public.traits VALUES (11, 'traits.11', 11);
INSERT INTO public.traits VALUES (12, 'traits.12', 12);
INSERT INTO public.traits VALUES (13, 'traits.13', 13);
INSERT INTO public.traits VALUES (14, 'traits.14', 14);
INSERT INTO public.traits VALUES (15, 'traits.15', 15);
INSERT INTO public.traits VALUES (16, 'traits.16', 16);
INSERT INTO public.traits VALUES (17, 'traits.17', 17);
INSERT INTO public.traits VALUES (18, 'traits.18', 18);
INSERT INTO public.traits VALUES (19, 'traits.19', 19);
INSERT INTO public.traits VALUES (20, 'traits.20', 20);


--
-- Data for Name: translations; Type: TABLE DATA; Schema: public; Owner: p1002_scmgrinder
--

INSERT INTO public.translations VALUES ('en', 'weapons.snake-skin-gift', 'The Snake-Skin Gift');
INSERT INTO public.translations VALUES ('en', 'weapons.snake-skin-gift.description', 'An expensive sandalwood box bound in snakeskin containing a dagger. d4 damage');
INSERT INTO public.translations VALUES ('en', 'weapons.blade-of-ancestors', 'The Blade of your Ancestors');
INSERT INTO public.translations VALUES ('en', 'weapons.blade-of-ancestors.description', 'A magnificent talking sword that is foppish, unreliable and quietly despises you. d6+1 damage');
INSERT INTO public.translations VALUES ('en', 'weapons.brown-scimitar', 'The Brown Scimitar of Galgenbeck');
INSERT INTO public.translations VALUES ('en', 'weapons.brown-scimitar.description', 'A stinking sword from a military shit-ditch. d6 damage');
INSERT INTO public.translations VALUES ('en', 'weapons.sigurd-sling', 'Old Sigürd''s Sling');
INSERT INTO public.translations VALUES ('en', 'weapons.sigurd-sling.description', 'Woven from grey hair, this sling has never failed you. 2d4 damage');
INSERT INTO public.translations VALUES ('en', 'weapons.shoe-of-death', 'The Shoe of Death''s Horse');
INSERT INTO public.translations VALUES ('en', 'weapons.shoe-of-death.description', 'A horseshoe from Death himself. d4 damage, returns like a boomerang');
INSERT INTO public.translations VALUES ('en', 'weapons.sacred-shepherds-crook', 'Sacred Shepherd’s Crook');
INSERT INTO public.translations VALUES ('en', 'weapons.sacred-shepherds-crook.description', 'Head of human bone inscribed with anti-prayers. Staff does 2d4 damage except to faithless humans.');
INSERT INTO public.translations VALUES ('en', 'weapons.femur', 'Femur');
INSERT INTO public.translations VALUES ('en', 'weapons.femur.description', 'd4 damage');
INSERT INTO public.translations VALUES ('en', 'weapons.staff', 'Staff');
INSERT INTO public.translations VALUES ('en', 'weapons.staff.description', 'd4 damage');
INSERT INTO public.translations VALUES ('en', 'weapons.shortsword', 'Shortsword');
INSERT INTO public.translations VALUES ('en', 'weapons.shortsword.description', 'd4 damage');
INSERT INTO public.translations VALUES ('en', 'weapons.knife', 'Knife');
INSERT INTO public.translations VALUES ('en', 'weapons.knife.description', 'd4 damage');
INSERT INTO public.translations VALUES ('en', 'weapons.warhammer', 'Warhammer');
INSERT INTO public.translations VALUES ('en', 'weapons.warhammer.description', 'd6 damage');
INSERT INTO public.translations VALUES ('en', 'weapons.sword', 'Sword');
INSERT INTO public.translations VALUES ('en', 'weapons.sword.description', 'd6 damage');
INSERT INTO public.translations VALUES ('en', 'weapons.bow', 'Bow');
INSERT INTO public.translations VALUES ('en', 'weapons.bow.description', 'd6 damage');
INSERT INTO public.translations VALUES ('en', 'weapons.flail', 'Flail');
INSERT INTO public.translations VALUES ('en', 'weapons.flail.description', 'd8 damage');
INSERT INTO public.translations VALUES ('en', 'weapons.crossbow', 'Crossbow');
INSERT INTO public.translations VALUES ('en', 'weapons.crossbow.description', 'd8 damage');
INSERT INTO public.translations VALUES ('en', 'weapons.zweihander', 'Zweihänder');
INSERT INTO public.translations VALUES ('en', 'weapons.zweihander.description', 'd10 damage');
INSERT INTO public.translations VALUES ('en', 'weapons.whip', 'Whip');
INSERT INTO public.translations VALUES ('en', 'weapons.whip.description', 'd2 damage');
INSERT INTO public.translations VALUES ('en', 'weapons.cudgel', 'Cudgel');
INSERT INTO public.translations VALUES ('en', 'weapons.cudgel.description', 'd4 damage');
INSERT INTO public.translations VALUES ('en', 'weapons.sling', 'Sling');
INSERT INTO public.translations VALUES ('en', 'weapons.sling.description', 'd4 damage, unlimited fist-sized rocks');
INSERT INTO public.translations VALUES ('en', 'weapons.sickle', 'Sickle');
INSERT INTO public.translations VALUES ('en', 'weapons.sickle.description', 'd4 damage');
INSERT INTO public.translations VALUES ('en', 'weapons.club', 'Club');
INSERT INTO public.translations VALUES ('en', 'weapons.club.description', 'd6 damage');
INSERT INTO public.translations VALUES ('en', 'weapons.handaxe', 'Handaxe');
INSERT INTO public.translations VALUES ('en', 'weapons.handaxe.description', 'd6 damage');
INSERT INTO public.translations VALUES ('en', 'weapons.mace', 'Mace');
INSERT INTO public.translations VALUES ('en', 'weapons.mace.description', 'd6 damage');
INSERT INTO public.translations VALUES ('en', 'weapons.spear', 'Spear');
INSERT INTO public.translations VALUES ('en', 'weapons.spear.description', 'd6 damage');
INSERT INTO public.translations VALUES ('en', 'weapons.battle-axe', 'Battle Axe');
INSERT INTO public.translations VALUES ('en', 'weapons.battle-axe.description', 'd8 damage');
INSERT INTO public.translations VALUES ('en', 'weapons.goedendag', 'Goedendag');
INSERT INTO public.translations VALUES ('en', 'weapons.goedendag.description', 'd8 damage');
INSERT INTO public.translations VALUES ('en', 'weapons.meat-cleaver', 'Meat Cleaver');
INSERT INTO public.translations VALUES ('en', 'weapons.meat-cleaver.description', 'd4 damage');
INSERT INTO public.translations VALUES ('en', 'weapons.crowbar', 'Crowbar');
INSERT INTO public.translations VALUES ('en', 'weapons.crowbar.description', 'd4 damage');
INSERT INTO public.translations VALUES ('en', 'weapons.hammer', 'Hammer');
INSERT INTO public.translations VALUES ('en', 'weapons.hammer.description', 'd4 damage');
INSERT INTO public.translations VALUES ('en', 'weapons.caltrops', 'Caltrops');
INSERT INTO public.translations VALUES ('en', 'weapons.caltrops.description', 'd4 damage + infection on 1 in 6');
INSERT INTO public.translations VALUES ('en', 'weapons.shield', 'Shield');
INSERT INTO public.translations VALUES ('en', 'weapons.shield.description', '-1 HP damage or break to ignore one attack');
INSERT INTO public.translations VALUES ('en', 'armor.fur', 'Fur Armor');
INSERT INTO public.translations VALUES ('en', 'armor.fur.description', '-d2 damage, tier 1');
INSERT INTO public.translations VALUES ('en', 'armor.padded-cloth', 'Padded Cloth Armor');
INSERT INTO public.translations VALUES ('en', 'armor.padded-cloth.description', '-d2 damage, tier 1');
INSERT INTO public.translations VALUES ('en', 'armor.leather', 'Leather Armor');
INSERT INTO public.translations VALUES ('en', 'armor.leather.description', '-d2 damage, tier 1');
INSERT INTO public.translations VALUES ('en', 'armor.scale', 'Scale Armor');
INSERT INTO public.translations VALUES ('en', 'armor.scale.description', '-d4 damage, tier 2, DR +2 on Agility tests');
INSERT INTO public.translations VALUES ('en', 'armor.mail', 'Mail Armor');
INSERT INTO public.translations VALUES ('en', 'armor.mail.description', '-d4 damage, tier 2, DR +2 on Agility tests');
INSERT INTO public.translations VALUES ('en', 'armor.splint', 'Splint Armor');
INSERT INTO public.translations VALUES ('en', 'armor.splint.description', '-d6 damage, tier 3, DR +4 on Agility tests, defence DR +2');
INSERT INTO public.translations VALUES ('en', 'armor.plate', 'Plate Armor');
INSERT INTO public.translations VALUES ('en', 'armor.plate.description', '-d6 damage, tier 3, DR +4 on Agility tests, defence DR +2');
INSERT INTO public.translations VALUES ('en', 'pets.small-dog', 'Small but vicious dog');
INSERT INTO public.translations VALUES ('en', 'pets.small-dog.description', 'Bite d4, only obeys you');
INSERT INTO public.translations VALUES ('en', 'pets.monkey', 'Monkey');
INSERT INTO public.translations VALUES ('en', 'pets.monkey.description', 'It ignores you but loves you. 2 HP, punch/bite d4');
INSERT INTO public.translations VALUES ('en', 'origins.esoteric_hermit.4', 'You were dying of plague in a Bergen Chrypt hovel, when you touched something from outside.');
INSERT INTO public.translations VALUES ('en', 'pets.hawk.description', 'Your crafty almost-intelligent hawk is loyal only to you. Swoops to attack foes.');
INSERT INTO public.translations VALUES ('en', 'pets.gore-hound', 'Ancient Gore-Hound');
INSERT INTO public.translations VALUES ('en', 'pets.gore-hound.description', 'Asthmatic, deluded, but has a superb nose for treasure. Frenzied around goblins.');
INSERT INTO public.translations VALUES ('en', 'pets.hamfund.description', 'Cowardly guardian of the cursed sword Eurekia. Once per combat, draw for 2d6 damage.');
INSERT INTO public.translations VALUES ('en', 'pets.barbarister.description', 'Magical, intelligent, arrogant talking horse. Sometimes +2 to Presence tests.');
INSERT INTO public.translations VALUES ('en', 'pets.poltroon.description', 'Irritating but distracting. First two rounds: +2 attack/defence for allies.');
INSERT INTO public.translations VALUES ('en', 'equipment.backpack', 'Backpack');
INSERT INTO public.translations VALUES ('en', 'equipment.backpack.description', 'For 7 normal-sized items');
INSERT INTO public.translations VALUES ('en', 'equipment.sack', 'Sack');
INSERT INTO public.translations VALUES ('en', 'equipment.sack.description', 'For 10 normal-sized items');
INSERT INTO public.translations VALUES ('en', 'equipment.small-wagon', 'Small Wagon');
INSERT INTO public.translations VALUES ('en', 'equipment.small-wagon.description', 'You can put stuff in it');
INSERT INTO public.translations VALUES ('en', 'equipment.donkey', 'Donkey');
INSERT INTO public.translations VALUES ('en', 'equipment.donkey.description', 'Mostly ignores you');
INSERT INTO public.translations VALUES ('en', 'equipment.rope', 'Rope');
INSERT INTO public.translations VALUES ('en', 'equipment.rope.description', '30 feet');
INSERT INTO public.translations VALUES ('en', 'equipment.blanket', 'Blanket');
INSERT INTO public.translations VALUES ('en', 'equipment.blanket.description', '');
INSERT INTO public.translations VALUES ('en', 'equipment.torches', 'Torches');
INSERT INTO public.translations VALUES ('en', 'equipment.torches.description', '');
INSERT INTO public.translations VALUES ('en', 'equipment.lantern', 'Lantern');
INSERT INTO public.translations VALUES ('en', 'equipment.lantern.description', 'With oil');
INSERT INTO public.translations VALUES ('en', 'equipment.magnesium-strip', 'Magnesium Strip');
INSERT INTO public.translations VALUES ('en', 'equipment.magnesium-strip.description', '');
INSERT INTO public.translations VALUES ('en', 'equipment.firesteel', 'Firesteel');
INSERT INTO public.translations VALUES ('en', 'equipment.firesteel.description', '');
INSERT INTO public.translations VALUES ('en', 'equipment.sharp-needle', 'Sharp Needle');
INSERT INTO public.translations VALUES ('en', 'equipment.sharp-needle.description', '');
INSERT INTO public.translations VALUES ('en', 'equipment.wooden-crucifix', 'Wooden Crucifix');
INSERT INTO public.translations VALUES ('en', 'equipment.wooden-crucifix.description', '');
INSERT INTO public.translations VALUES ('en', 'equipment.silver-crucifix', 'Silver Crucifix');
INSERT INTO public.translations VALUES ('en', 'equipment.silver-crucifix.description', '');
INSERT INTO public.translations VALUES ('en', 'equipment.lockpicks', 'Metal File and Lockpicks');
INSERT INTO public.translations VALUES ('en', 'equipment.lockpicks.description', '');
INSERT INTO public.translations VALUES ('en', 'equipment.manacles', 'Manacles');
INSERT INTO public.translations VALUES ('en', 'equipment.manacles.description', '');
INSERT INTO public.translations VALUES ('en', 'equipment.toolbox', 'Toolbox');
INSERT INTO public.translations VALUES ('en', 'equipment.toolbox.description', '10 nails, tongs, hammer, small saw, and drill');
INSERT INTO public.translations VALUES ('en', 'equipment.heavy-chain', 'Heavy Chain');
INSERT INTO public.translations VALUES ('en', 'equipment.heavy-chain.description', '15 feet');
INSERT INTO public.translations VALUES ('en', 'equipment.scissors', 'Scissors');
INSERT INTO public.translations VALUES ('en', 'equipment.scissors.description', '');
INSERT INTO public.translations VALUES ('en', 'equipment.grappling-hook', 'Grappling Hook');
INSERT INTO public.translations VALUES ('en', 'equipment.grappling-hook.description', '');
INSERT INTO public.translations VALUES ('en', 'equipment.noose', 'Noose');
INSERT INTO public.translations VALUES ('en', 'equipment.noose.description', '');
INSERT INTO public.translations VALUES ('en', 'equipment.tent', 'Tent');
INSERT INTO public.translations VALUES ('en', 'equipment.tent.description', '');
INSERT INTO public.translations VALUES ('en', 'equipment.mirror', 'Mirror');
INSERT INTO public.translations VALUES ('en', 'equipment.mirror.description', 'Worth 15s');
INSERT INTO public.translations VALUES ('en', 'equipment.exquisite-perfume', 'Exquisite Perfume');
INSERT INTO public.translations VALUES ('en', 'equipment.exquisite-perfume.description', 'Worth 25s');
INSERT INTO public.translations VALUES ('en', 'equipment.bear-trap', 'Bear Trap');
INSERT INTO public.translations VALUES ('en', 'equipment.bear-trap.description', 'DR14 to spot, d8 damage');
INSERT INTO public.translations VALUES ('en', 'equipment.lard', 'Lard');
INSERT INTO public.translations VALUES ('en', 'equipment.lard.description', 'May function as 5 meals in a pinch');
INSERT INTO public.translations VALUES ('en', 'equipment.chewing-tobacco', 'Chewing Tobacco');
INSERT INTO public.translations VALUES ('en', 'equipment.chewing-tobacco.description', '');
INSERT INTO public.translations VALUES ('en', 'equipment.chalk', 'Stick of Chalk');
INSERT INTO public.translations VALUES ('en', 'equipment.chalk.description', '');
INSERT INTO public.translations VALUES ('en', 'equipment.salt', 'A Bottle of Salt');
INSERT INTO public.translations VALUES ('en', 'equipment.salt.description', '');
INSERT INTO public.translations VALUES ('en', 'equipment.medicine-chest', 'Medicine Chest');
INSERT INTO public.translations VALUES ('en', 'equipment.medicine-chest.description', 'Stops bleeding/infection and heals d6 HP');
INSERT INTO public.translations VALUES ('en', 'equipment.life-elixir', 'Life Elixir');
INSERT INTO public.translations VALUES ('en', 'equipment.life-elixir.description', 'Heals d6 HP and removes infection');
INSERT INTO public.translations VALUES ('en', 'equipment.red-poison', 'A Bottle of Red Poison');
INSERT INTO public.translations VALUES ('en', 'equipment.red-poison.description', 'Toughness DR12 or d10 damage');
INSERT INTO public.translations VALUES ('en', 'equipment.black-poison', 'A Bottle of Black Poison');
INSERT INTO public.translations VALUES ('en', 'equipment.black-poison.description', 'Toughness DR14 or d6 damage + blind for one hour');
INSERT INTO public.translations VALUES ('en', 'equipment.bomb', 'Bomb');
INSERT INTO public.translations VALUES ('en', 'equipment.bomb.description', 'Sealed bottle, d10 damage');
INSERT INTO public.translations VALUES ('en', 'equipment.arrows', 'Arrows');
INSERT INTO public.translations VALUES ('en', 'equipment.arrows.description', 'Ammunition for bows');
INSERT INTO public.translations VALUES ('en', 'equipment.bolts', 'Bolts');
INSERT INTO public.translations VALUES ('en', 'equipment.bolts.description', 'Ammunition for crossbows');
INSERT INTO public.translations VALUES ('en', 'scroll.unclean.1', 'Palms Open the Southern Gate');
INSERT INTO public.translations VALUES ('en', 'scroll.unclean.1.description', 'A ball of fire hits d2 creatures dealing d8 damage per creature');
INSERT INTO public.translations VALUES ('en', 'scroll.unclean.2', 'Tongue of Eris');
INSERT INTO public.translations VALUES ('en', 'scroll.unclean.2.description', 'A creature of your choice is confused for 10 minutes');
INSERT INTO public.translations VALUES ('en', 'scroll.unclean.3', 'Te-le-kin-esis');
INSERT INTO public.translations VALUES ('en', 'scroll.unclean.3.description', 'Move an object up 1d10 feet for d6 minutes');
INSERT INTO public.translations VALUES ('en', 'scroll.unclean.4', 'Lucy-Fires Levitation');
INSERT INTO public.translations VALUES ('en', 'scroll.unclean.4.description', 'Hover for Presence + d10 rounds');
INSERT INTO public.translations VALUES ('en', 'scroll.unclean.5', 'Daemon of Capillaries');
INSERT INTO public.translations VALUES ('en', 'scroll.unclean.5.description', 'One creature suffocates for d6 rounds, losing d4 HP per round');
INSERT INTO public.translations VALUES ('en', 'scroll.unclean.6', 'Nine Violet Signs Unknot the Storm');
INSERT INTO public.translations VALUES ('en', 'scroll.unclean.6.description', 'Produce d2 lightning bolts dealing d6 damage each');
INSERT INTO public.translations VALUES ('en', 'scroll.unclean.7', 'Metzhuotl Blind Your Eye');
INSERT INTO public.translations VALUES ('en', 'scroll.unclean.7.description', 'A creature becomes invisible for d6 rounds');
INSERT INTO public.translations VALUES ('en', 'scroll.unclean.8', 'Foul Psychopomp');
INSERT INTO public.translations VALUES ('en', 'scroll.unclean.8.description', 'Summon d4 skeletons or zombies');
INSERT INTO public.translations VALUES ('en', 'scroll.unclean.9', 'Eyelid Blinds the Mind');
INSERT INTO public.translations VALUES ('en', 'scroll.unclean.9.description', 'd4 creatures fall asleep for one hour');
INSERT INTO public.translations VALUES ('en', 'scroll.unclean.10', 'Death');
INSERT INTO public.translations VALUES ('en', 'scroll.unclean.10.description', 'All creatures within 30 feet lose a total of 4d10 HP');
INSERT INTO public.translations VALUES ('en', 'scroll.sacred.1', 'Grace of a Dead Saint');
INSERT INTO public.translations VALUES ('en', 'scroll.sacred.1.description', 'd2 creatures regain d10 HP each');
INSERT INTO public.translations VALUES ('en', 'scroll.sacred.2', 'Grace for a Sinner');
INSERT INTO public.translations VALUES ('en', 'scroll.sacred.2.description', 'A creature gets +d6 on one roll');
INSERT INTO public.translations VALUES ('en', 'scroll.sacred.3', 'Whispers Pass the Gate');
INSERT INTO public.translations VALUES ('en', 'scroll.sacred.3.description', 'Ask three questions to a deceased creature');
INSERT INTO public.translations VALUES ('en', 'scroll.sacred.4', 'Aegis of Sorrow');
INSERT INTO public.translations VALUES ('en', 'scroll.sacred.4.description', 'A creature gains 2d6 extra HP for 10 rounds');
INSERT INTO public.translations VALUES ('en', 'scroll.sacred.5', 'Unmet Fate');
INSERT INTO public.translations VALUES ('en', 'scroll.sacred.5.description', 'Awaken a creature dead for no more than a week');
INSERT INTO public.translations VALUES ('en', 'scroll.sacred.6', 'Bestial Speech');
INSERT INTO public.translations VALUES ('en', 'scroll.sacred.6.description', 'Speak with animals for d20 minutes');
INSERT INTO public.translations VALUES ('en', 'scroll.sacred.7', 'False Dawn Night''s Chariot');
INSERT INTO public.translations VALUES ('en', 'scroll.sacred.7.description', 'Light or pitch black for 3d10 minutes');
INSERT INTO public.translations VALUES ('en', 'scroll.sacred.8', 'Hermetic Step');
INSERT INTO public.translations VALUES ('en', 'scroll.sacred.8.description', 'Find all traps in your path for 2d10 minutes');
INSERT INTO public.translations VALUES ('en', 'scroll.sacred.9', 'Roskoe''s Consuming Glare');
INSERT INTO public.translations VALUES ('en', 'scroll.sacred.9.description', 'd4 creatures lose d8 HP each');
INSERT INTO public.translations VALUES ('en', 'scroll.sacred.10', 'Enochian Syntax');
INSERT INTO public.translations VALUES ('en', 'scroll.sacred.10.description', 'One creature blindly obeys a single command');
INSERT INTO public.translations VALUES ('en', 'equipment.ezumiel-vapor', 'Ezumiel Vapor');
INSERT INTO public.translations VALUES ('en', 'equipment.ezumiel-vapor.description', 'Pass a DR14 test or severe hallucinations for d4 hours');
INSERT INTO public.translations VALUES ('en', 'equipment.southern-frog', 'Southern Frog Stew');
INSERT INTO public.translations VALUES ('en', 'equipment.southern-frog.description', 'Vomit for d4 hours, DR14 test or do nothing else');
INSERT INTO public.translations VALUES ('en', 'equipment.elixir-vitalis', 'Elixir Vitalis');
INSERT INTO public.translations VALUES ('en', 'equipment.elixir-vitalis.description', 'Heals d6 HP and stops infection. Can be habit forming');
INSERT INTO public.translations VALUES ('en', 'equipment.spider-owl-soup', 'Spider-Owl Soup');
INSERT INTO public.translations VALUES ('en', 'equipment.spider-owl-soup.description', 'See in darkness, climb on walls for 30 minutes');
INSERT INTO public.translations VALUES ('en', 'equipment.fernors-philtre', 'Fernor''s Philtre');
INSERT INTO public.translations VALUES ('en', 'equipment.fernors-philtre.description', 'Dab in eye. Heals infection, +2 presence for d4 hours');
INSERT INTO public.translations VALUES ('en', 'equipment.hyphos-snuff', 'Hyphos''s Enervating Snuff');
INSERT INTO public.translations VALUES ('en', 'equipment.hyphos-snuff.description', 'Berserk! Two attacks per round but defend with DR14. One fight.');
INSERT INTO public.translations VALUES ('en', 'origins.esoteric_hermit.5', 'You were an average individual until you encountered something in a dim glade in Sarkash.');
INSERT INTO public.translations VALUES ('en', 'origins.esoteric_hermit.6', 'You were raised on a lonely island in Lake Onda. No one else has ever heard of it.');
INSERT INTO public.translations VALUES ('en', 'origins.wretched_royalty.1', 'Things were going so well, until your Wästland palace was reduced to rubble.');
INSERT INTO public.translations VALUES ('en', 'origins.wretched_royalty.2', 'Things were going so well, until your caravan kingdom of Tveland fell into penury.');
INSERT INTO public.translations VALUES ('en', 'origins.wretched_royalty.3', 'Things were going so well, until King Fathmu IX''s brother Zigmund, your father, was murdered.');
INSERT INTO public.translations VALUES ('en', 'origins.wretched_royalty.4', 'Things were going so well, until the southern empire of Südglans sank into the sea.');
INSERT INTO public.translations VALUES ('en', 'origins.wretched_royalty.5', 'Things were going so well, until two young princes were kidnapped west of Bergen Chrypt.');
INSERT INTO public.translations VALUES ('en', 'origins.wretched_royalty.6', 'Things were going so well, until Anthelia demanded a gift of noble blood.');
INSERT INTO public.translations VALUES ('en', 'origins.heretical_priest.1', 'You come from Galgenbeck, near the cathedral of the Two-Headed Basilisks.');
INSERT INTO public.translations VALUES ('en', 'origins.heretical_priest.2', 'You are the sole survivor of a massacred Allians cult.');
INSERT INTO public.translations VALUES ('en', 'origins.heretical_priest.3', 'You come from the crypts of Grift.');
INSERT INTO public.translations VALUES ('en', 'origins.heretical_priest.4', 'You come from some temple ruins in the Valley of the Unfortunate Undead.');
INSERT INTO public.translations VALUES ('en', 'origins.heretical_priest.5', 'You come from one of the many Graven-Tosk thief-tunnels.');
INSERT INTO public.translations VALUES ('en', 'origins.heretical_priest.6', 'You come from a secret Bergen Chrypt church.');
INSERT INTO public.translations VALUES ('en', 'origins.occult_herbmaster.1', 'Raised in calm isolation in the Sarkash dark.');
INSERT INTO public.translations VALUES ('en', 'origins.occult_herbmaster.2', 'From the illegal midnight markets of Schleswig.');
INSERT INTO public.translations VALUES ('en', 'origins.occult_herbmaster.3', 'From the heretic isle of Crëlut, two nautical miles east of Grift.');
INSERT INTO public.translations VALUES ('en', 'origins.occult_herbmaster.4', 'From the old frozen ruins not far from Allians.');
INSERT INTO public.translations VALUES ('en', 'origins.occult_herbmaster.5', 'From a little witches cottage in Galgenbeck.');
INSERT INTO public.translations VALUES ('en', 'origins.occult_herbmaster.6', 'From the ruins of the Shadow King''s manse.');
INSERT INTO public.translations VALUES ('pl', 'weapons.snake-skin-gift', 'Prezent z wężowej skóry');
INSERT INTO public.translations VALUES ('pl', 'weapons.snake-skin-gift.description', 'Drogie pudełko z drewna sandałowego oprawione w skórę węża, zawierające sztylet. d4 obrażeń');
INSERT INTO public.translations VALUES ('pl', 'weapons.blade-of-ancestors', 'Ostrze Twoich Przodków');
INSERT INTO public.translations VALUES ('pl', 'weapons.blade-of-ancestors.description', 'Wspaniały gadający miecz, który jest fircykowaty, nieziemsko zawodny i po cichu tobą gardzi. d6+1 obrażeń');
INSERT INTO public.translations VALUES ('pl', 'weapons.brown-scimitar', 'Brązowy sejmitar z Galgenbeck');
INSERT INTO public.translations VALUES ('pl', 'weapons.brown-scimitar.description', 'Cuchnący miecz z wojskowego rowu kloacznego. d6 obrażeń');
INSERT INTO public.translations VALUES ('pl', 'weapons.sigurd-sling', 'Proca Starego Sigürda');
INSERT INTO public.translations VALUES ('pl', 'weapons.sigurd-sling.description', 'Upleciona z siwych włosów, ta proca nigdy cię nie zawiodła. 2d4 obrażeń');
INSERT INTO public.translations VALUES ('pl', 'weapons.shoe-of-death', 'Podkowa Konia Śmierci');
INSERT INTO public.translations VALUES ('pl', 'weapons.shoe-of-death.description', 'Podkowa samego Śmierci. d4 obrażeń, wraca jak bumerang');
INSERT INTO public.translations VALUES ('pl', 'weapons.sacred-shepherds-crook', 'Święty Kostur Pasterza');
INSERT INTO public.translations VALUES ('pl', 'weapons.sacred-shepherds-crook.description', 'Głowica z ludzkiej kości pokryta antymodlitwami. Kostur zadaje 2d4 obrażeń z wyjątkiem bezbożnych ludzi.');
INSERT INTO public.translations VALUES ('pl', 'weapons.femur', 'Kość udowa');
INSERT INTO public.translations VALUES ('pl', 'weapons.femur.description', 'd4 obrażeń');
INSERT INTO public.translations VALUES ('pl', 'weapons.staff', 'Kostur');
INSERT INTO public.translations VALUES ('pl', 'weapons.staff.description', 'd4 obrażeń');
INSERT INTO public.translations VALUES ('pl', 'weapons.shortsword', 'Krótki miecz');
INSERT INTO public.translations VALUES ('pl', 'weapons.shortsword.description', 'd4 obrażeń');
INSERT INTO public.translations VALUES ('pl', 'weapons.knife', 'Nóż');
INSERT INTO public.translations VALUES ('pl', 'weapons.knife.description', 'd4 obrażeń');
INSERT INTO public.translations VALUES ('pl', 'weapons.warhammer', 'Młot bojowy');
INSERT INTO public.translations VALUES ('pl', 'weapons.warhammer.description', 'd6 obrażeń');
INSERT INTO public.translations VALUES ('pl', 'weapons.sword', 'Miecz');
INSERT INTO public.translations VALUES ('pl', 'weapons.sword.description', 'd6 obrażeń');
INSERT INTO public.translations VALUES ('pl', 'weapons.bow', 'Łuk');
INSERT INTO public.translations VALUES ('pl', 'weapons.bow.description', 'd6 obrażeń');
INSERT INTO public.translations VALUES ('pl', 'weapons.flail', 'Kiścień');
INSERT INTO public.translations VALUES ('pl', 'weapons.flail.description', 'd8 obrażeń');
INSERT INTO public.translations VALUES ('pl', 'weapons.crossbow', 'Kusza');
INSERT INTO public.translations VALUES ('pl', 'weapons.crossbow.description', 'd8 obrażeń');
INSERT INTO public.translations VALUES ('pl', 'weapons.zweihander', 'Zweihänder');
INSERT INTO public.translations VALUES ('pl', 'weapons.zweihander.description', 'd10 obrażeń');
INSERT INTO public.translations VALUES ('pl', 'weapons.whip', 'Bicz');
INSERT INTO public.translations VALUES ('pl', 'weapons.whip.description', 'd2 obrażeń');
INSERT INTO public.translations VALUES ('pl', 'weapons.cudgel', 'Pałka');
INSERT INTO public.translations VALUES ('pl', 'weapons.cudgel.description', 'd4 obrażeń');
INSERT INTO public.translations VALUES ('pl', 'weapons.sling', 'Proca');
INSERT INTO public.translations VALUES ('pl', 'weapons.sling.description', 'd4 obrażeń, nieograniczona ilość kamieni wielkości pięści');
INSERT INTO public.translations VALUES ('pl', 'weapons.sickle', 'Sierp');
INSERT INTO public.translations VALUES ('pl', 'weapons.sickle.description', 'd4 obrażeń');
INSERT INTO public.translations VALUES ('pl', 'weapons.club', 'Maczuga');
INSERT INTO public.translations VALUES ('pl', 'weapons.club.description', 'd6 obrażeń');
INSERT INTO public.translations VALUES ('pl', 'weapons.handaxe', 'Toporek');
INSERT INTO public.translations VALUES ('pl', 'weapons.handaxe.description', 'd6 obrażeń');
INSERT INTO public.translations VALUES ('pl', 'weapons.mace', 'Buława');
INSERT INTO public.translations VALUES ('pl', 'weapons.mace.description', 'd6 obrażeń');
INSERT INTO public.translations VALUES ('pl', 'weapons.spear', 'Włócznia');
INSERT INTO public.translations VALUES ('pl', 'weapons.spear.description', 'd6 obrażeń');
INSERT INTO public.translations VALUES ('pl', 'weapons.battle-axe', 'Topór bitewny');
INSERT INTO public.translations VALUES ('pl', 'weapons.battle-axe.description', 'd8 obrażeń');
INSERT INTO public.translations VALUES ('pl', 'weapons.goedendag', 'Goedendag');
INSERT INTO public.translations VALUES ('pl', 'weapons.goedendag.description', 'd8 obrażeń');
INSERT INTO public.translations VALUES ('pl', 'weapons.meat-cleaver', 'Tasak do mięsa');
INSERT INTO public.translations VALUES ('pl', 'weapons.meat-cleaver.description', 'd4 obrażeń');
INSERT INTO public.translations VALUES ('pl', 'weapons.crowbar', 'Łom');
INSERT INTO public.translations VALUES ('pl', 'weapons.crowbar.description', 'd4 obrażeń');
INSERT INTO public.translations VALUES ('pl', 'weapons.hammer', 'Młotek');
INSERT INTO public.translations VALUES ('pl', 'weapons.hammer.description', 'd4 obrażeń');
INSERT INTO public.translations VALUES ('pl', 'weapons.caltrops', 'Czosnki (kolce)');
INSERT INTO public.translations VALUES ('pl', 'weapons.caltrops.description', 'd4 obrażeń + infekcja przy 1 na 6');
INSERT INTO public.translations VALUES ('pl', 'weapons.shield', 'Tarcza');
INSERT INTO public.translations VALUES ('pl', 'weapons.shield.description', '-1 obrażeń PŻ lub zniszcz, aby zignorować jeden atak');
INSERT INTO public.translations VALUES ('pl', 'armor.fur', 'Zbroja z futra');
INSERT INTO public.translations VALUES ('pl', 'armor.fur.description', '-d2 obrażeń, poziom 1');
INSERT INTO public.translations VALUES ('pl', 'armor.padded-cloth', 'Przeszywanica');
INSERT INTO public.translations VALUES ('pl', 'armor.padded-cloth.description', '-d2 obrażeń, poziom 1');
INSERT INTO public.translations VALUES ('pl', 'armor.leather', 'Zbroja skórzana');
INSERT INTO public.translations VALUES ('pl', 'armor.leather.description', '-d2 obrażeń, poziom 1');
INSERT INTO public.translations VALUES ('pl', 'armor.scale', 'Zbroja łuskowa');
INSERT INTO public.translations VALUES ('pl', 'armor.scale.description', '-d4 obrażeń, poziom 2, PT +2 do testów Zwinności');
INSERT INTO public.translations VALUES ('pl', 'armor.mail', 'Kolczuga');
INSERT INTO public.translations VALUES ('pl', 'armor.mail.description', '-d4 obrażeń, poziom 2, PT +2 do testów Zwinności');
INSERT INTO public.translations VALUES ('pl', 'armor.splint', 'Zbroja karacenowa');
INSERT INTO public.translations VALUES ('pl', 'armor.splint.description', '-d6 obrażeń, poziom 3, PT +4 do testów Zwinności, PT obrony +2');
INSERT INTO public.translations VALUES ('pl', 'armor.plate', 'Zbroja płytowa');
INSERT INTO public.translations VALUES ('pl', 'armor.plate.description', '-d6 obrażeń, poziom 3, PT +4 do testów Zwinności, PT obrony +2');
INSERT INTO public.translations VALUES ('pl', 'pets.small-dog', 'Mały, ale wściekły pies');
INSERT INTO public.translations VALUES ('pl', 'pets.small-dog.description', 'Ugryzienie d4, słucha tylko ciebie');
INSERT INTO public.translations VALUES ('pl', 'pets.monkey', 'Małpa');
INSERT INTO public.translations VALUES ('pl', 'pets.monkey.description', 'Ignoruje cię, ale cię kocha. 2 PŻ, cios/ugryzienie d4');
INSERT INTO public.translations VALUES ('pl', 'pets.hawk', 'Jastrząb');
INSERT INTO public.translations VALUES ('pl', 'pets.hawk.description', 'Twój przebiegły, niemal inteligentny jastrząb jest lojalny tylko wobec ciebie. Atakuje wrogów z powietrza.');
INSERT INTO public.translations VALUES ('pl', 'pets.gore-hound', 'Starożytny ogar posokowiec');
INSERT INTO public.translations VALUES ('pl', 'pets.gore-hound.description', 'Astmatyczny, błądzący w ułudzie, ale ma genialny nos do skarbów. Wpada w szał przy goblinach.');
INSERT INTO public.translations VALUES ('pl', 'pets.hamfund', 'Splunięcie Hamfunda');
INSERT INTO public.translations VALUES ('pl', 'pets.hamfund.description', 'Tchórzliwy strażnik przeklętego miecza Eurekia. Raz na walkę, dobądź go dla 2d6 obrażeń.');
INSERT INTO public.translations VALUES ('pl', 'pets.barbarister', 'Barbarister, Niesamowity Koń');
INSERT INTO public.translations VALUES ('pl', 'pets.barbarister.description', 'Magiczny, inteligentny, arogancki gadający koń. Czasami +2 do testów Obecności.');
INSERT INTO public.translations VALUES ('pl', 'pets.poltroon', '"Poltroon" Błazen Dworski');
INSERT INTO public.translations VALUES ('pl', 'pets.poltroon.description', 'Irytujący, ale odwracający uwagę. Pierwsze dwie rundy: +2 do ataku/obrony dla sojuszników.');
INSERT INTO public.translations VALUES ('pl', 'equipment.backpack', 'Plecak');
INSERT INTO public.translations VALUES ('pl', 'equipment.backpack.description', 'Na 7 przedmiotów normalnej wielkości');
INSERT INTO public.translations VALUES ('pl', 'equipment.sack', 'Worek');
INSERT INTO public.translations VALUES ('pl', 'equipment.sack.description', 'Na 10 przedmiotów normalnej wielkości');
INSERT INTO public.translations VALUES ('pl', 'equipment.small-wagon', 'Mały wóz');
INSERT INTO public.translations VALUES ('pl', 'equipment.small-wagon.description', 'Możesz do niego kłaść rzeczy');
INSERT INTO public.translations VALUES ('pl', 'equipment.donkey', 'Osioł');
INSERT INTO public.translations VALUES ('pl', 'equipment.donkey.description', 'Głównie cię ignoruje');
INSERT INTO public.translations VALUES ('pl', 'equipment.rope', 'Lina');
INSERT INTO public.translations VALUES ('pl', 'equipment.rope.description', '30 stóp');
INSERT INTO public.translations VALUES ('pl', 'equipment.blanket', 'Koc');
INSERT INTO public.translations VALUES ('pl', 'equipment.blanket.description', '');
INSERT INTO public.translations VALUES ('pl', 'equipment.torches', 'Pochodnie');
INSERT INTO public.translations VALUES ('pl', 'equipment.torches.description', '');
INSERT INTO public.translations VALUES ('pl', 'equipment.lantern', 'Latarnia');
INSERT INTO public.translations VALUES ('pl', 'equipment.lantern.description', 'Z oliwą');
INSERT INTO public.translations VALUES ('pl', 'equipment.magnesium-strip', 'Pasek magnezowy');
INSERT INTO public.translations VALUES ('pl', 'equipment.magnesium-strip.description', '');
INSERT INTO public.translations VALUES ('pl', 'equipment.firesteel', 'Krzesiwo');
INSERT INTO public.translations VALUES ('pl', 'equipment.firesteel.description', '');
INSERT INTO public.translations VALUES ('pl', 'equipment.sharp-needle', 'Ostra igła');
INSERT INTO public.translations VALUES ('pl', 'equipment.sharp-needle.description', '');
INSERT INTO public.translations VALUES ('pl', 'equipment.wooden-crucifix', 'Drewniany krucyfiks');
INSERT INTO public.translations VALUES ('pl', 'equipment.wooden-crucifix.description', '');
INSERT INTO public.translations VALUES ('pl', 'equipment.silver-crucifix', 'Srebrny krucyfiks');
INSERT INTO public.translations VALUES ('pl', 'equipment.silver-crucifix.description', '');
INSERT INTO public.translations VALUES ('pl', 'equipment.lockpicks', 'Metalowy pilnik i wytrychy');
INSERT INTO public.translations VALUES ('pl', 'equipment.lockpicks.description', '');
INSERT INTO public.translations VALUES ('pl', 'equipment.manacles', 'Kajdany');
INSERT INTO public.translations VALUES ('pl', 'equipment.manacles.description', '');
INSERT INTO public.translations VALUES ('pl', 'equipment.toolbox', 'Skrzynka z narzędziami');
INSERT INTO public.translations VALUES ('pl', 'equipment.toolbox.description', '10 gwoździ, szczypce, młotek, mała piła i świder');
INSERT INTO public.translations VALUES ('pl', 'equipment.heavy-chain', 'Ciężki łańcuch');
INSERT INTO public.translations VALUES ('pl', 'equipment.heavy-chain.description', '15 stóp');
INSERT INTO public.translations VALUES ('pl', 'equipment.scissors', 'Nożyczki');
INSERT INTO public.translations VALUES ('pl', 'equipment.scissors.description', '');
INSERT INTO public.translations VALUES ('pl', 'equipment.grappling-hook', 'Kotwiczka');
INSERT INTO public.translations VALUES ('pl', 'equipment.grappling-hook.description', '');
INSERT INTO public.translations VALUES ('pl', 'equipment.noose', 'Pętla');
INSERT INTO public.translations VALUES ('pl', 'equipment.noose.description', '');
INSERT INTO public.translations VALUES ('pl', 'equipment.tent', 'Namiot');
INSERT INTO public.translations VALUES ('pl', 'equipment.tent.description', '');
INSERT INTO public.translations VALUES ('pl', 'equipment.mirror', 'Lustro');
INSERT INTO public.translations VALUES ('pl', 'equipment.mirror.description', 'Warte 15s');
INSERT INTO public.translations VALUES ('pl', 'equipment.exquisite-perfume', 'Wykwintne perfumy');
INSERT INTO public.translations VALUES ('pl', 'equipment.exquisite-perfume.description', 'Warte 25s');
INSERT INTO public.translations VALUES ('pl', 'equipment.bear-trap', 'Potrzask na niedźwiedzie');
INSERT INTO public.translations VALUES ('pl', 'equipment.bear-trap.description', 'PT14 by zauważyć, d8 obrażeń');
INSERT INTO public.translations VALUES ('pl', 'equipment.lard', 'Smalec');
INSERT INTO public.translations VALUES ('pl', 'equipment.lard.description', 'W ostateczności może służyć jako 5 posiłków');
INSERT INTO public.translations VALUES ('pl', 'equipment.chewing-tobacco', 'Tytoń do żucia');
INSERT INTO public.translations VALUES ('pl', 'equipment.chewing-tobacco.description', '');
INSERT INTO public.translations VALUES ('pl', 'equipment.chalk', 'Laska kredy');
INSERT INTO public.translations VALUES ('pl', 'equipment.chalk.description', '');
INSERT INTO public.translations VALUES ('pl', 'equipment.salt', 'Butelka soli');
INSERT INTO public.translations VALUES ('pl', 'equipment.salt.description', '');
INSERT INTO public.translations VALUES ('pl', 'equipment.medicine-chest', 'Apteczka');
INSERT INTO public.translations VALUES ('pl', 'equipment.medicine-chest.description', 'Tamuje krwawienie/infekcję i leczy d6 PŻ');
INSERT INTO public.translations VALUES ('pl', 'equipment.life-elixir', 'Eliksir życia');
INSERT INTO public.translations VALUES ('pl', 'equipment.life-elixir.description', 'Leczy d6 PŻ i usuwa infekcję');
INSERT INTO public.translations VALUES ('pl', 'equipment.red-poison', 'Butelka czerwonej trucizny');
INSERT INTO public.translations VALUES ('pl', 'equipment.red-poison.description', 'Wytrzymałość PT12 lub d10 obrażeń');
INSERT INTO public.translations VALUES ('pl', 'equipment.black-poison', 'Butelka czarnej trucizny');
INSERT INTO public.translations VALUES ('pl', 'equipment.black-poison.description', 'Wytrzymałość PT14 lub d6 obrażeń + oślepienie na godzinę');
INSERT INTO public.translations VALUES ('pl', 'equipment.bomb', 'Bomba');
INSERT INTO public.translations VALUES ('pl', 'equipment.bomb.description', 'Zapieczętowana butelka, d10 obrażeń');
INSERT INTO public.translations VALUES ('pl', 'equipment.arrows', 'Strzały');
INSERT INTO public.translations VALUES ('pl', 'equipment.arrows.description', 'Amunicja do łuków');
INSERT INTO public.translations VALUES ('pl', 'equipment.bolts', 'Belty');
INSERT INTO public.translations VALUES ('pl', 'equipment.bolts.description', 'Amunicja do kusz');
INSERT INTO public.translations VALUES ('pl', 'scroll.unclean.1', 'Dłonie otwierają Południową Bramę');
INSERT INTO public.translations VALUES ('pl', 'scroll.unclean.1.description', 'Kula ognia uderza w d2 stworzenia, zadając d8 obrażeń każdemu');
INSERT INTO public.translations VALUES ('pl', 'scroll.unclean.2', 'Język Eris');
INSERT INTO public.translations VALUES ('pl', 'scroll.unclean.2.description', 'Wybrane stworzenie jest zdezorientowane przez 10 minut');
INSERT INTO public.translations VALUES ('pl', 'scroll.unclean.3', 'Te-le-ki-neza');
INSERT INTO public.translations VALUES ('pl', 'scroll.unclean.3.description', 'Przesuń obiekt do 1d10 stóp na d6 minut');
INSERT INTO public.translations VALUES ('pl', 'scroll.unclean.4', 'Lewitacja Lucy-Fires');
INSERT INTO public.translations VALUES ('pl', 'scroll.unclean.4.description', 'Unoszenie się przez Obecność + d10 rund');
INSERT INTO public.translations VALUES ('pl', 'scroll.unclean.5', 'Demon Naczyń Włosowatych');
INSERT INTO public.translations VALUES ('pl', 'scroll.unclean.5.description', 'Jedno stworzenie dusi się przez d6 rund, tracąc d4 PŻ na rundę');
INSERT INTO public.translations VALUES ('pl', 'scroll.unclean.6', 'Dziewięć Fioletowych Znaków Rozsupłuje Burzę');
INSERT INTO public.translations VALUES ('pl', 'scroll.unclean.6.description', 'Wytwarza d2 błyskawice zadające po d6 obrażeń');
INSERT INTO public.translations VALUES ('pl', 'scroll.unclean.7', 'Metzhuotl oślepia twe oko');
INSERT INTO public.translations VALUES ('pl', 'scroll.unclean.7.description', 'Stworzenie staje się niewidzialne na d6 rund');
INSERT INTO public.translations VALUES ('pl', 'scroll.unclean.8', 'Plugawy Psychopomp');
INSERT INTO public.translations VALUES ('pl', 'scroll.unclean.8.description', 'Przywołuje d4 szkielety lub zombie');
INSERT INTO public.translations VALUES ('pl', 'scroll.unclean.9', 'Powieka oślepia umysł');
INSERT INTO public.translations VALUES ('pl', 'scroll.unclean.9.description', 'd4 stworzenia zasypiają na godzinę');
INSERT INTO public.translations VALUES ('pl', 'scroll.unclean.10', 'Śmierć');
INSERT INTO public.translations VALUES ('pl', 'scroll.unclean.10.description', 'Wszystkie stworzenia w promieniu 30 stóp tracą łącznie 4d10 PŻ');
INSERT INTO public.translations VALUES ('pl', 'scroll.sacred.1', 'Łaska Martwego Świętego');
INSERT INTO public.translations VALUES ('pl', 'scroll.sacred.1.description', 'd2 stworzenia odzyskują po d10 PŻ');
INSERT INTO public.translations VALUES ('pl', 'scroll.sacred.2', 'Łaska dla Grzesznika');
INSERT INTO public.translations VALUES ('pl', 'scroll.sacred.2.description', 'Stworzenie otrzymuje +d6 do jednego rzutu');
INSERT INTO public.translations VALUES ('pl', 'scroll.sacred.3', 'Szepty przechodzą przez Bramę');
INSERT INTO public.translations VALUES ('pl', 'scroll.sacred.3.description', 'Zadaj trzy pytania zmarłemu stworzeniu');
INSERT INTO public.translations VALUES ('pl', 'scroll.sacred.4', 'Egida Smutku');
INSERT INTO public.translations VALUES ('pl', 'scroll.sacred.4.description', 'Stworzenie zyskuje 2d6 dodatkowych PŻ na 10 rund');
INSERT INTO public.translations VALUES ('pl', 'scroll.sacred.5', 'Niespełniony Los');
INSERT INTO public.translations VALUES ('pl', 'scroll.sacred.5.description', 'Obudź stworzenie martwe nie dłużej niż tydzień');
INSERT INTO public.translations VALUES ('pl', 'scroll.sacred.6', 'Mowa Bestii');
INSERT INTO public.translations VALUES ('pl', 'scroll.sacred.6.description', 'Rozmawiaj ze zwierzętami przez d20 minut');
INSERT INTO public.translations VALUES ('pl', 'scroll.sacred.7', 'Fałszywy Świt Rydwanu Nocy');
INSERT INTO public.translations VALUES ('pl', 'scroll.sacred.7.description', 'Światło lub egipska ciemność przez 3d10 minut');
INSERT INTO public.translations VALUES ('pl', 'scroll.sacred.8', 'Hermetyczny Krok');
INSERT INTO public.translations VALUES ('pl', 'scroll.sacred.8.description', 'Znajdź wszystkie pułapki na swojej drodze przez 2d10 minut');
INSERT INTO public.translations VALUES ('pl', 'scroll.sacred.9', 'Konsumujące Spojrzenie Roskoe');
INSERT INTO public.translations VALUES ('pl', 'scroll.sacred.9.description', 'd4 stworzenia tracą po d8 PŻ');
INSERT INTO public.translations VALUES ('pl', 'scroll.sacred.10', 'Składnia Enochiańska');
INSERT INTO public.translations VALUES ('pl', 'scroll.sacred.10.description', 'Jedno stworzenie ślepo wykonuje pojedynczy rozkaz');
INSERT INTO public.translations VALUES ('pl', 'equipment.ezumiel-vapor', 'Opary Ezumiela');
INSERT INTO public.translations VALUES ('pl', 'equipment.ezumiel-vapor.description', 'Zdaj test PT14 lub dozna silnych halucynacji przez d4 godziny');
INSERT INTO public.translations VALUES ('pl', 'equipment.southern-frog', 'Gulasz z żaby południowej');
INSERT INTO public.translations VALUES ('pl', 'equipment.southern-frog.description', 'Wymioty przez d4 godziny, test PT14 by móc robić cokolwiek innego');
INSERT INTO public.translations VALUES ('pl', 'equipment.elixir-vitalis', 'Eliksir Vitalis');
INSERT INTO public.translations VALUES ('pl', 'equipment.elixir-vitalis.description', 'Leczy d6 PŻ i powstrzymuje infekcję. Może uzależniać');
INSERT INTO public.translations VALUES ('pl', 'equipment.spider-owl-soup', 'Zupa z pająko-sowy');
INSERT INTO public.translations VALUES ('pl', 'equipment.spider-owl-soup.description', 'Widzenie w ciemności, wspinanie się po ścianach przez 30 minut');
INSERT INTO public.translations VALUES ('pl', 'equipment.fernors-philtre', 'Filtr Fernora');
INSERT INTO public.translations VALUES ('pl', 'equipment.fernors-philtre.description', 'Wpuść do oka. Leczy infekcję, +2 do obecności przez d4 godziny');
INSERT INTO public.translations VALUES ('pl', 'equipment.hyphos-snuff', 'Obezwładniająca tabaka Hyphosa');
INSERT INTO public.translations VALUES ('pl', 'equipment.hyphos-snuff.description', 'Szał! Dwa ataki na rundę, ale obrona z PT14. Jedna walka.');
INSERT INTO public.translations VALUES ('en', 'abilities.fanged_deserter.clumsy', 'Clumsy: All Agility tests (except defense) are DR+2. You cannot use scrolls.');
INSERT INTO public.translations VALUES ('en', 'abilities.fanged_deserter.bite', 'Teeth: DR10 to attack, d6 damage. You must be in close range.');
INSERT INTO public.translations VALUES ('en', 'abilities.fanged_deserter.mask', 'Monster Mask: Strikes primitive fear into lesser creatures like goblins, gnoums and children. While worn, they check Morale every round.');
INSERT INTO public.translations VALUES ('en', 'abilities.fanged_deserter.scimitar', 'The Brown Scimitar of Galgenbeck: A stinking sword you pulled from a military shit-ditch. D6 damage. dr10 attack and defence while you wield it. 1 in 6 chance a wounded enemy is smitten with potent sepsis, dying in 10 minutes.');
INSERT INTO public.translations VALUES ('en', 'abilities.fanged_deserter.teeth', 'Wizard Teeth: Four weird teeth rattle within a blackened pouch. Before battle roll a d6 for each one. For every 6 one of your attacks deals maximum damage.');
INSERT INTO public.translations VALUES ('en', 'abilities.fanged_deserter.sling', 'Old Sigürd’s Sling: Woven from his long grey hair, this sling has never failed you. 2d4 damage, requires fist-sized rocks which are everywhere.');
INSERT INTO public.translations VALUES ('en', 'abilities.fanged_deserter.hound', 'Ancient Gore-hound: Wizened creature with a superb nose, can sniffle up treasure. Attacks with dr10 (bite d6). Defends with dr12, 10 hp. Becomes frenzied around goblins and berserkers.');
INSERT INTO public.translations VALUES ('en', 'abilities.fanged_deserter.shoe', 'The Shoe of Death’s Horse: DR10, d4 damage. 1 in 6 chance the shoe smashes the skull, instantly killing small-to-medium sized creatures. Returns to your hand like a boomerang.');
INSERT INTO public.translations VALUES ('en', 'abilities.gutterborn_scum.stealthy', 'Stealthy: All Presence and Agility tests have their DR reduced by 2.');
INSERT INTO public.translations VALUES ('en', 'abilities.gutterborn_scum.jab', 'Coward’s Jab: When attacking by surprise test Agility dr10. On a success you automatically hit once with a light one-handed weapon, dealing normal damage +3.');
INSERT INTO public.translations VALUES ('en', 'abilities.gutterborn_scum.fingersmith', 'Filthy Fingersmith: Your snaky little digits get into pockets and pick locks with a dr8 Agility test. You also begin with lockpicks!');
INSERT INTO public.translations VALUES ('en', 'abilities.gutterborn_scum.gob_lobber', 'Abominable Gob Lobber: Spit d2 times during a fight. Roll a dr8 Presence test for accuracy. Targets are blinded, retching and vomiting for d4 rounds. Others witnessing this must test Toughness (PCs dr10, enemies dr12) or vomit.');
INSERT INTO public.translations VALUES ('en', 'abilities.gutterborn_scum.fate', 'Escaping Fate: Every time you use an omen there is a 50% chance it is not spent.');
INSERT INTO public.translations VALUES ('en', 'abilities.gutterborn_scum.stealth', 'Excretal Stealth: Astounding ability to hide in muck. When hidden in these conditions a dr16 Presence test is required to notice you.');
INSERT INTO public.translations VALUES ('en', 'abilities.gutterborn_scum.dodging', 'Dodging Death: On death, if there is even the slightest possibility that you survived, there is a 50% chance that you did. If successful, after 10 rounds you pop back up with d4 hp.');
INSERT INTO public.translations VALUES ('en', 'abilities.esoteric_hermit.master_of_fate', 'Master of Fate: What use are maps when the substance of causality itself is open to you? You know the right way with a dr8 Presence test.');
INSERT INTO public.translations VALUES ('en', 'abilities.esoteric_hermit.book', 'Book of Boiling Blood: Once daily enemy must make a dr12 test or D2 Berserker-slayers appear. D6 roll: 1-4 fight for you, 5-6 they turn on you.');
INSERT INTO public.translations VALUES ('en', 'abilities.esoteric_hermit.speaker', 'Speaker of Truths: Twice per day use your wisdom to bring clarity to a creature. The dr of the next test they undertake is lowered by 4.');
INSERT INTO public.translations VALUES ('en', 'abilities.esoteric_hermit.initiate', 'Initiate of the Invisible College: Once per day summon D2 scrolls (1-2 sacred, 3-4 unclean). If not used before sunrise they turn to ash.');
INSERT INTO public.translations VALUES ('en', 'abilities.esoteric_hermit.bard', 'Bard of the Undying: You learnt your melodies in the Otherworld. The music of your Harp gives +D4 on reaction rolls.');
INSERT INTO public.translations VALUES ('en', 'abilities.esoteric_hermit.hawk', 'Hawk as Weapon: Crafty almost-intelligent hawk loyal only to you. Attacks/defence dr10 (claws/bite D4) HP 8.');
INSERT INTO public.translations VALUES ('en', 'abilities.wretched_royalty.blade', 'The Blade of your Ancestors: Talking sword, foppish and unreliable. Taunts failures. 1 in 6 chance to attack you or companions. D6+1 damage, DR10.');
INSERT INTO public.translations VALUES ('en', 'abilities.wretched_royalty.poltroon', 'Poltroon the Court Jester: Useless but makes enemies lose focus. For the first two rounds you and your allies get +2 on attack/defence.');
INSERT INTO public.translations VALUES ('en', 'abilities.wretched_royalty.barbarister', 'Barbarister the Incredible Horse: Magical, intelligent, arrogant talking horse. Persuade him for +2 to Presence tests involving logic and intellect.');
INSERT INTO public.translations VALUES ('en', 'abilities.wretched_royalty.hamfund', 'Hamfund the Squire: Cowardly servant. Once per combat, Eurekia may be drawn (2d6 damage). 1 in 6 swing roll: squire slain and sword vanishes.');
INSERT INTO public.translations VALUES ('en', 'abilities.wretched_royalty.gift', 'The Snake-Skin Gift: Sandalwood box with a dagger. D4 damage, on 1 target dies immediately of deadly poison.');
INSERT INTO public.translations VALUES ('en', 'abilities.wretched_royalty.horn', 'Horn of the Schleswig Lords: Once per day blare trumpet and test Presence dr12. One creature may make their next non-combat test an automatic success.');
INSERT INTO public.translations VALUES ('en', 'abilities.heretical_priest.crook', 'Sacred Shepherd’s Crook: Head of human bone inscribed with anti-prayers. Staff does 2d4 damage except to faithless humans.');
INSERT INTO public.translations VALUES ('en', 'abilities.heretical_priest.mitre', 'Stolen Mitre: While wearing it Defence is dr10. If pulled over ears outside battle, Priest becomes nearly invisible (Stealth dr8).');
INSERT INTO public.translations VALUES ('en', 'abilities.heretical_priest.sins', 'List of Sins: Accurate document of evil-doers. Successful Presence dr10: A strange light surrounds evil creatures. Owner defends with +2 against them.');
INSERT INTO public.translations VALUES ('en', 'abilities.heretical_priest.bible', 'The Blasphemous Nechrubel Bible: Once per day read: Even roll heals PCs d4 hp after 5 min rest; Odd roll causes hallucinations until sunrise.');
INSERT INTO public.translations VALUES ('en', 'abilities.heretical_priest.stones', 'Stones from Thel-Emas’ Lost Temple: Pattern reveals if danger lurks in adjacent room. Priest tests Presence dr10 to see if they are true.');
INSERT INTO public.translations VALUES ('en', 'abilities.heretical_priest.crucifix', 'Crucifix: Use against undead, trolls and goblins. Check morale (Presence mod included) to see if they bow and remove themselves.');
INSERT INTO public.translations VALUES ('en', 'abilities.occult_herbmaster.decoctions', 'Portable Laboratory: Daily create two random decoctions and brew d4 doses total. Lose vitality after 24 hours.');
INSERT INTO public.translations VALUES ('en', 'abilities.occult_herbmaster.red_poison', 'Red Poison: Toughness dr12 or -d10 hp.');
INSERT INTO public.translations VALUES ('en', 'abilities.occult_herbmaster.ezumiel', 'Ezumiel’s Vapor: Pass a dr14 test or severe hallucinations for d4 hours.');
INSERT INTO public.translations VALUES ('en', 'abilities.occult_herbmaster.frog', 'Southern Frog Stew: Vomit for d4 hours, pass a dr14 test or you can do nothing else.');
INSERT INTO public.translations VALUES ('en', 'abilities.occult_herbmaster.vitalis', 'Elixir Vitalis: Heals d6 hp and stops infection. Can be habit-forming.');
INSERT INTO public.translations VALUES ('en', 'abilities.occult_herbmaster.soup', 'Spider-Owl Soup: See in darkness, climb on walls for 30 minutes.');
INSERT INTO public.translations VALUES ('en', 'abilities.occult_herbmaster.philtre', 'Fernor’s Philtre: Dabbed into eye. Heals infection and gives +2 on Presence tests for d4 hours.');
INSERT INTO public.translations VALUES ('en', 'abilities.occult_herbmaster.hyphos', 'Hyphos’ Enervating Snuff: Berserk! Two attacks per round but defend with dr14. Lasts one fight. Causes sneezing.');
INSERT INTO public.translations VALUES ('en', 'abilities.occult_herbmaster.black_poison', 'Black Poison: Toughness dr14 or -d6 hp and blinded for one hour.');
INSERT INTO public.translations VALUES ('pl', 'habits.14', 'Piroman.');
INSERT INTO public.translations VALUES ('en', 'tales.1', 'Pursued for manslaughter. There is a bounty.');
INSERT INTO public.translations VALUES ('en', 'tales.2', 'In massive debt. The debt is being traded to successively more ruthless groups.');
INSERT INTO public.translations VALUES ('en', 'tales.3', 'You have a rare, sought after item.');
INSERT INTO public.translations VALUES ('en', 'tales.4', 'You have a cursed never-healing wound.');
INSERT INTO public.translations VALUES ('en', 'tales.5', 'Had an illegal, immoral and secret affair with a member of the royal family. You have proof.');
INSERT INTO public.translations VALUES ('en', 'tales.6', 'Escaped cult member. Terrified and paranoid. Other cultists are everywhere.');
INSERT INTO public.translations VALUES ('en', 'tales.7', 'An identity thief who recently killed and replaced this person.');
INSERT INTO public.translations VALUES ('en', 'tales.8', 'Banished and disowned for unspecified deeds. Can never go home.');
INSERT INTO public.translations VALUES ('en', 'tales.9', 'Deserted military after witnessing a massacre, bounty on head. Hunted by former friends.');
INSERT INTO public.translations VALUES ('en', 'tales.10', 'Very recently murdered a close relative. Very recently.');
INSERT INTO public.translations VALUES ('en', 'tales.11', 'A puzzle cube has been calibrated incorrectly (or has it?), awakening a slumbering abomination.');
INSERT INTO public.translations VALUES ('en', 'tales.12', 'Evil creatures love the scent of your spoor and are drawn to it, bringing disaster in your wake.');
INSERT INTO public.translations VALUES ('en', 'tales.13', 'A battle wound left a shard of metal slowly inching closer to your heart. Every day there is a 2% chance it reaches it.');
INSERT INTO public.translations VALUES ('en', 'tales.14', 'Violence forced you into the wilderness. You think waving trees are whispering. You talk to, scream at, attack trees.');
INSERT INTO public.translations VALUES ('en', 'tales.15', 'Cursed to share the nightmares of others, you sleep far, far away.');
INSERT INTO public.translations VALUES ('en', 'tales.16', 'At permanent war with all corvids. No contact without some violence. You carry a sling.');
INSERT INTO public.translations VALUES ('en', 'tales.17', 'After dreaming of an underground temple to a forgotten god you understand the songs of insects and worms.');
INSERT INTO public.translations VALUES ('en', 'tales.18', 'Being tracked and observed by a golem after an agreement which you know has been wiped from your mind.');
INSERT INTO public.translations VALUES ('en', 'tales.19', '''Burn or be burned'' is the fate you accept.');
INSERT INTO public.translations VALUES ('en', 'tales.20', 'Your flesh heals twice as fast, but your companions twice as slow. You see a many-eyed ''guardian angel''.');
INSERT INTO public.translations VALUES ('en', 'habits.1', 'Obsessively collects small sharp stones.');
INSERT INTO public.translations VALUES ('en', 'habits.2', 'Won''t use a blade without testing it on your own flesh. Arms knitted with scars.');
INSERT INTO public.translations VALUES ('en', 'habits.3', 'Can''t stop drinking once you start.');
INSERT INTO public.translations VALUES ('en', 'habits.4', 'Gambling addict. Must bet every day. If you lose, raise and bet again.');
INSERT INTO public.translations VALUES ('en', 'habits.5', 'Cannot tolerate criticism of any kind. Results in rage and weeping.');
INSERT INTO public.translations VALUES ('en', 'habits.6', 'Unable to get to the point. You have never actually finished a story.');
INSERT INTO public.translations VALUES ('en', 'habits.7', 'Best friend is a skull. Carry it with you, tell it everything, you trust no one more.');
INSERT INTO public.translations VALUES ('en', 'habits.8', 'You pick your nose so deep it bleeds.');
INSERT INTO public.translations VALUES ('en', 'habits.9', 'Laughs hysterically at your own jokes which you then explain in detail.');
INSERT INTO public.translations VALUES ('en', 'habits.10', 'A nihilist. You insist on telling everyone you are a nihilist and explaining why.');
INSERT INTO public.translations VALUES ('en', 'habits.11', 'Inveterate bug eater.');
INSERT INTO public.translations VALUES ('en', 'habits.12', 'Stress response is aesthetic display. The worse things get the fancier you need to be.');
INSERT INTO public.translations VALUES ('en', 'habits.13', 'Permanent phlegm deposit in throat. Continuously coughs, snorts, spits and swallows.');
INSERT INTO public.translations VALUES ('en', 'habits.14', 'Pyromaniac.');
INSERT INTO public.translations VALUES ('en', 'habits.15', 'Consistently loses important items and forgets vital facts.');
INSERT INTO public.translations VALUES ('en', 'habits.16', 'Insecure shit-stirrer. Will talk about whoever just left the room.');
INSERT INTO public.translations VALUES ('en', 'habits.17', 'You stutter when lying.');
INSERT INTO public.translations VALUES ('en', 'habits.18', 'You giggle insanely at the worst possible times.');
INSERT INTO public.translations VALUES ('en', 'habits.19', 'You whistle while trying to hide. You will deny this. Whistle when 5, 7, 9, 11, or 13 is rolled on a d20.');
INSERT INTO public.translations VALUES ('en', 'habits.20', 'You make jewelry from the teeth of the dead, if this can be considered a bad habit.');
INSERT INTO public.translations VALUES ('en', 'traits.1', 'endlessly aggravated');
INSERT INTO public.translations VALUES ('en', 'traits.2', 'inferiority complex ridden');
INSERT INTO public.translations VALUES ('en', 'traits.3', 'authority denying');
INSERT INTO public.translations VALUES ('en', 'traits.4', 'loud mouth');
INSERT INTO public.translations VALUES ('en', 'traits.5', 'cruel');
INSERT INTO public.translations VALUES ('en', 'traits.6', 'egocentric');
INSERT INTO public.translations VALUES ('en', 'traits.7', 'nihilistic');
INSERT INTO public.translations VALUES ('en', 'traits.8', 'prone to substance abuse');
INSERT INTO public.translations VALUES ('en', 'traits.9', 'conflicted');
INSERT INTO public.translations VALUES ('en', 'traits.10', 'shrewd');
INSERT INTO public.translations VALUES ('en', 'traits.11', 'vindictive');
INSERT INTO public.translations VALUES ('en', 'traits.12', 'cowardly');
INSERT INTO public.translations VALUES ('en', 'traits.13', 'lazy');
INSERT INTO public.translations VALUES ('en', 'traits.14', 'suspicious');
INSERT INTO public.translations VALUES ('en', 'traits.15', 'ruthless');
INSERT INTO public.translations VALUES ('en', 'traits.16', 'constantly worried');
INSERT INTO public.translations VALUES ('en', 'traits.17', 'very bitter');
INSERT INTO public.translations VALUES ('en', 'traits.18', 'deceitful');
INSERT INTO public.translations VALUES ('en', 'traits.19', 'wasteful');
INSERT INTO public.translations VALUES ('en', 'traits.20', 'arrogant');
INSERT INTO public.translations VALUES ('en', 'body.1', 'Has a staring manic gaze');
INSERT INTO public.translations VALUES ('en', 'body.2', 'Is covered in (for some) blasphemous tattoos');
INSERT INTO public.translations VALUES ('en', 'body.3', 'Has a rotting face (wears a mask)');
INSERT INTO public.translations VALUES ('en', 'body.4', 'Is missing 3 toes, is limping');
INSERT INTO public.translations VALUES ('en', 'body.5', 'Looks starved: gaunt and pale');
INSERT INTO public.translations VALUES ('en', 'body.6', 'One hand is replaced with a rusting hook');
INSERT INTO public.translations VALUES ('en', 'body.7', 'Has decaying teeth');
INSERT INTO public.translations VALUES ('en', 'body.8', 'Is hauntingly beautiful, unnervingly clean');
INSERT INTO public.translations VALUES ('en', 'body.9', 'Has hands caked with sores');
INSERT INTO public.translations VALUES ('en', 'body.10', 'Has cataract and its slowly but surely spreading to both eyes');
INSERT INTO public.translations VALUES ('en', 'body.11', 'Has long tangled hair, at least one cockroach is in residence');
INSERT INTO public.translations VALUES ('en', 'body.12', 'Has broken crushed ears');
INSERT INTO public.translations VALUES ('en', 'body.13', 'Is juddering and stuttering from nerve damage or stress');
INSERT INTO public.translations VALUES ('en', 'body.14', 'Is corpulent, ravenous, drooling');
INSERT INTO public.translations VALUES ('en', 'body.15', 'In one hand misses a thumb and index finger, grips like a lobster');
INSERT INTO public.translations VALUES ('en', 'body.16', 'Has a red, swollen alcoholic''s nose');
INSERT INTO public.translations VALUES ('en', 'body.17', 'Has resting maniac face, making friends is hard');
INSERT INTO public.translations VALUES ('en', 'body.18', 'Has chronic athlete''s foot');
INSERT INTO public.translations VALUES ('en', 'body.19', 'Was recently slashed and stinking eye is covered with a patch');
INSERT INTO public.translations VALUES ('en', 'body.20', 'Has cracked black nails, probably about to drop off');
INSERT INTO public.translations VALUES ('pl', 'tales.1', 'Ścigany za nieumyślne spowodowanie śmierci. Wyznaczono nagrodę.');
INSERT INTO public.translations VALUES ('pl', 'tales.2', 'W ogromnych długach. Dług jest sprzedawany coraz bardziej bezwzględnym grupom.');
INSERT INTO public.translations VALUES ('pl', 'tales.3', 'Posiadasz rzadki, pożądany przedmiot.');
INSERT INTO public.translations VALUES ('pl', 'tales.4', 'Masz przeklętą, nigdy nie gojącą się ranę.');
INSERT INTO public.translations VALUES ('pl', 'tales.5', 'Miałeś nielegalny, niemoralny i tajny romans z członkiem rodziny królewskiej. Masz dowód.');
INSERT INTO public.translations VALUES ('pl', 'tales.6', 'Zbiegły członek kultu. Przerażony i paranoiczny. Inni kultyści są wszędzie.');
INSERT INTO public.translations VALUES ('pl', 'tales.7', 'Złodziej tożsamości, który niedawno zabił i zastąpił tę osobę.');
INSERT INTO public.translations VALUES ('pl', 'tales.8', 'Wygnany i wydziedziczony za niesprecyzowane czyny. Nigdy nie możesz wrócić do domu.');
INSERT INTO public.translations VALUES ('pl', 'tales.9', 'Zdezerterował z wojska po byciu świadkiem masakry, nagroda za głowę. Ścigany przez dawnych przyjaciół.');
INSERT INTO public.translations VALUES ('pl', 'tales.10', 'Bardzo niedawno zamordował bliskiego krewnego. Bardzo niedawno.');
INSERT INTO public.translations VALUES ('pl', 'tales.11', 'Kostka zagadki została błędnie skalibrowana (czyżby?), budząc uśpioną abominację.');
INSERT INTO public.translations VALUES ('pl', 'tales.12', 'Złe stworzenia uwielbiają zapach twoich śladów i są do nich przyciągane, sprowadzając nieszczęście tam, gdzie się pojawisz.');
INSERT INTO public.translations VALUES ('pl', 'tales.13', 'Rana bitewna pozostawiła odłamek metalu powoli przesuwający się w stronę serca. Każdego dnia jest 2% szansy, że do niego dotrze.');
INSERT INTO public.translations VALUES ('pl', 'tales.14', 'Przemoc zmusiła cię do ucieczki w dzicz. Myślisz, że kołyszące się drzewa szepczą. Rozmawiasz z drzewami, krzyczysz na nie, atakujesz je.');
INSERT INTO public.translations VALUES ('pl', 'tales.15', 'Przeklęty, by dzielić koszmary innych, śpisz daleko, bardzo daleko.');
INSERT INTO public.translations VALUES ('pl', 'tales.16', 'Na stałe w stanie wojny ze wszystkimi krukowatymi. Żadnego kontaktu bez przemocy. Nosisz procę.');
INSERT INTO public.translations VALUES ('pl', 'tales.17', 'Po śnieniu o podziemnej świątyni zapomnianego boga, rozumiesz pieśni owadów i robaków.');
INSERT INTO public.translations VALUES ('pl', 'tales.18', 'Śledzony i obserwowany przez golema po umowie, która – jak wiesz – została wymazana z twojej pamięci.');
INSERT INTO public.translations VALUES ('pl', 'tales.19', '''Płoń lub daj się spalić'' to los, który akceptujesz.');
INSERT INTO public.translations VALUES ('pl', 'tales.20', 'Twoje ciało goi się dwa razy szybciej, ale twoich towarzyszy dwa razy wolniej. Widzisz wielookiego ''anioła stróża''.');
INSERT INTO public.translations VALUES ('pl', 'habits.1', 'Obsesyjnie zbiera małe ostre kamienie.');
INSERT INTO public.translations VALUES ('pl', 'habits.2', 'Nie użyje ostrza bez przetestowania go na własnym ciele. Ramiona pokryte bliznami.');
INSERT INTO public.translations VALUES ('pl', 'habits.3', 'Nie potrafi przestać pić, gdy już zacznie.');
INSERT INTO public.translations VALUES ('pl', 'habits.4', 'Hazardzista. Musi obstawiać każdego dnia. Jeśli przegra, podbija stawkę i obstawia ponownie.');
INSERT INTO public.translations VALUES ('pl', 'habits.5', 'Nie toleruje krytyki w żadnej formie. Skutkuje to wściekłością i płaczem.');
INSERT INTO public.translations VALUES ('pl', 'habits.6', 'Nie potrafi przejść do sedna. Nigdy tak naprawdę nie dokończył żadnej opowieści.');
INSERT INTO public.translations VALUES ('pl', 'habits.7', 'Najlepszym przyjacielem jest czaszka. Nosisz ją ze sobą, mówisz jej wszystko, nikomu nie ufasz bardziej.');
INSERT INTO public.translations VALUES ('pl', 'habits.8', 'Dłubie w nosie tak głęboko, że krwawi.');
INSERT INTO public.translations VALUES ('pl', 'habits.9', 'Śmieje się histerycznie z własnych żartów, które potem szczegółowo wyjaśnia.');
INSERT INTO public.translations VALUES ('pl', 'habits.10', 'Nihilista. Upiera się przy mówieniu każdemu, że jest nihilistą i wyjaśnianiu dlaczego.');
INSERT INTO public.translations VALUES ('pl', 'habits.11', 'Zatwardziały pożeracz robaków.');
INSERT INTO public.translations VALUES ('pl', 'habits.12', 'Reakcją na stres jest dbałość o estetykę. Im gorzej się dzieje, tym bardziej strojny musisz być.');
INSERT INTO public.translations VALUES ('pl', 'habits.13', 'Stała wydzielina w gardle. Ciągle kaszle, pociąga nosem, spluwa i przełyka.');
INSERT INTO public.translations VALUES ('pl', 'habits.15', 'Notorycznie gubi ważne przedmioty i zapomina o istotnych faktach.');
INSERT INTO public.translations VALUES ('pl', 'habits.16', 'Niepewny siebie mąciwoda. Będzie obgadywać każdego, kto właśnie wyszedł z pokoju.');
INSERT INTO public.translations VALUES ('pl', 'habits.17', 'Jąka się, gdy kłamie.');
INSERT INTO public.translations VALUES ('pl', 'habits.18', 'Chichocze obłąkańczo w najgorszych możliwych momentach.');
INSERT INTO public.translations VALUES ('pl', 'habits.19', 'Gwiżdże, próbując się ukryć. Będzie temu zaprzeczać. Gwiżdże, gdy na k20 wypadnie 5, 7, 9, 11 lub 13.');
INSERT INTO public.translations VALUES ('pl', 'habits.20', 'Robi biżuterię z zębów zmarłych, jeśli można to uznać za zły nawyk.');
INSERT INTO public.translations VALUES ('pl', 'traits.1', 'ciągle poirytowany');
INSERT INTO public.translations VALUES ('pl', 'traits.2', 'pełen kompleksów niższości');
INSERT INTO public.translations VALUES ('pl', 'traits.3', 'negujący autorytety');
INSERT INTO public.translations VALUES ('pl', 'traits.4', 'pyskacz');
INSERT INTO public.translations VALUES ('pl', 'traits.5', 'okrutny');
INSERT INTO public.translations VALUES ('pl', 'traits.6', 'egocentryczny');
INSERT INTO public.translations VALUES ('pl', 'traits.7', 'nihilistyczny');
INSERT INTO public.translations VALUES ('pl', 'traits.8', 'skłonny do używek');
INSERT INTO public.translations VALUES ('pl', 'traits.9', 'skonfliktowany');
INSERT INTO public.translations VALUES ('pl', 'traits.10', 'przebiegły');
INSERT INTO public.translations VALUES ('pl', 'traits.11', 'mściwy');
INSERT INTO public.translations VALUES ('pl', 'traits.12', 'tchórzliwy');
INSERT INTO public.translations VALUES ('pl', 'traits.13', 'leniwy');
INSERT INTO public.translations VALUES ('pl', 'traits.14', 'podejrzliwy');
INSERT INTO public.translations VALUES ('pl', 'traits.15', 'bezwzględny');
INSERT INTO public.translations VALUES ('pl', 'traits.16', 'ciągle zmartwiony');
INSERT INTO public.translations VALUES ('pl', 'traits.17', 'bardzo gorzki');
INSERT INTO public.translations VALUES ('pl', 'traits.18', 'podstępny');
INSERT INTO public.translations VALUES ('pl', 'traits.19', 'rozrzutny');
INSERT INTO public.translations VALUES ('pl', 'traits.20', 'arogancki');
INSERT INTO public.translations VALUES ('pl', 'body.1', 'Ma obłąkane, utkwione spojrzenie');
INSERT INTO public.translations VALUES ('pl', 'body.2', 'Pokryty (dla niektórych) bluźnierczymi tatuażami');
INSERT INTO public.translations VALUES ('pl', 'body.3', 'Ma gnijącą twarz (nosi maskę)');
INSERT INTO public.translations VALUES ('pl', 'body.4', 'Brakuje mu 3 palców u nóg, utyka');
INSERT INTO public.translations VALUES ('pl', 'body.5', 'Wygląda na zagłodzonego: wychudzony i blady');
INSERT INTO public.translations VALUES ('pl', 'body.6', 'Jedna ręka zastąpiona rdzewiejącym hakiem');
INSERT INTO public.translations VALUES ('pl', 'body.7', 'Ma zepsute zęby');
INSERT INTO public.translations VALUES ('pl', 'body.8', 'Niepokojąco piękny, nienaturalnie czysty');
INSERT INTO public.translations VALUES ('pl', 'body.9', 'Dłonie pokryte strupami');
INSERT INTO public.translations VALUES ('pl', 'body.10', 'Ma kataraktę, która powoli, ale nieuchronnie rozprzestrzenia się na oba oczy');
INSERT INTO public.translations VALUES ('pl', 'body.11', 'Długie splątane włosy, zamieszkane przez przynajmniej jednego karalucha');
INSERT INTO public.translations VALUES ('pl', 'body.12', 'Zmiażdżone małżowiny uszne');
INSERT INTO public.translations VALUES ('pl', 'body.13', 'Drży i jąka się z powodu uszkodzenia nerwów lub stresu');
INSERT INTO public.translations VALUES ('pl', 'body.14', 'Otyły, zachłanny, śliniący się');
INSERT INTO public.translations VALUES ('pl', 'body.15', 'W jednej dłoni brakuje kciuka i palca wskazującego, chwyta jak szczypcami homara');
INSERT INTO public.translations VALUES ('pl', 'body.16', 'Ma czerwony, opuchnięty nos alkoholika');
INSERT INTO public.translations VALUES ('pl', 'body.17', 'Ma twarz maniaka (resting maniac face), trudno mu nawiązywać przyjaźnie');
INSERT INTO public.translations VALUES ('pl', 'body.18', 'Ma przewlekłą grzybicę stóp');
INSERT INTO public.translations VALUES ('pl', 'body.19', 'Niedawno pocięty, cuchnące oko zakryte opaską');
INSERT INTO public.translations VALUES ('pl', 'body.20', 'Ma pęknięte czarne paznokcie, prawdopodobnie zaraz odpadną');
INSERT INTO public.translations VALUES ('en', 'classes.fanged_deserter.appendix', 'You have thirty or so friends who never let you down: YOUR TEETH. Fanged, infectious, and magnificent.');
INSERT INTO public.translations VALUES ('en', 'classes.gutterborn_scum.appendix', 'An ill star smiled upon your birth. Poverty, crime, and bad parenting didn’t help either. In your eyes, the world is a gutter.');
INSERT INTO public.translations VALUES ('en', 'classes.esoteric_hermit.appendix', 'The stone of your cave is one with the stars. Silence and perfection. You are a vessel for the bizarre.');
INSERT INTO public.translations VALUES ('en', 'classes.wretched_royalty.appendix', 'Bowed down only by the memories of your own lost glory, you could never submit to anyone else. You are noble, even in the mud.');
INSERT INTO public.translations VALUES ('en', 'classes.heretical_priest.appendix', 'Hunted by the Two-Headed Basilisks of the One True Faith, you can be found raving in ruins and cursing the sky.');
INSERT INTO public.translations VALUES ('en', 'origins.occult_herbmaster.7', 'From a little witches cottage in Galgenbeck.');
INSERT INTO public.translations VALUES ('en', 'origins.occult_herbmaster.8', 'From the ruins of the Shadow King''s manse, thick of memories of mushrooms and smoke.');
INSERT INTO public.translations VALUES ('en', 'items.crumpled_monster_mask', 'Crumpled Monster Mask');
INSERT INTO public.translations VALUES ('en', 'items.brown_scimitar', 'The Brown Scimitar of Galgenbeck');
INSERT INTO public.translations VALUES ('en', 'items.wizard_teeth', 'Wizard Teeth');
INSERT INTO public.translations VALUES ('en', 'items.sigurds_sling', 'Old Sigûrd''s Sling');
INSERT INTO public.translations VALUES ('en', 'items.death_horse_shoe', 'The Shoe of Death''s Horse');
INSERT INTO public.translations VALUES ('en', 'pets.gore_hound', 'Ancient Gore-Hound');
INSERT INTO public.translations VALUES ('en', 'pets.poltroon', '"Poltroon" the Court Jester');
INSERT INTO public.translations VALUES ('en', 'pets.barbarister', 'Barbarister the Incredible Horse');
INSERT INTO public.translations VALUES ('en', 'pets.hamfund', 'Hamfund the Squire');
INSERT INTO public.translations VALUES ('en', 'pets.hawk', 'Hawk');
INSERT INTO public.translations VALUES ('en', 'classes.occult_herbmaster.appendix', 'Born of the mushroom, raised in the glade, watched by the eye of the moon in a silver-black pool.');
INSERT INTO public.translations VALUES ('en', 'origins.fanged_deserter.1', 'Your earliest memories are of a burnt-black building in Sarkash. Your home?');
INSERT INTO public.translations VALUES ('en', 'origins.fanged_deserter.2', 'Your earliest memories are of a derelict rotting ship rolling endlessly across a grey sea.');
INSERT INTO public.translations VALUES ('en', 'origins.fanged_deserter.3', 'Your earliest memories are of a brothel in Schleswig. Quite a friendly environment.');
INSERT INTO public.translations VALUES ('en', 'origins.fanged_deserter.4', 'Your earliest memories are of sleeping with dogs in the corner of an inn, waiting for someone to return.');
INSERT INTO public.translations VALUES ('en', 'origins.fanged_deserter.5', 'Your earliest memories are of following an army in eastern Wästland.');
INSERT INTO public.translations VALUES ('en', 'origins.fanged_deserter.6', 'Your earliest memories are of suckling a wolf in the wilds of Bergen Chrypt.');
INSERT INTO public.translations VALUES ('en', 'origins.gutterborn_scum.1', 'As a child, you were dumped onto a moving shit-cart still in your birth caul.');
INSERT INTO public.translations VALUES ('en', 'origins.esoteric_hermit.1', 'You remember awakening, adult, in a ritual circle underneath the northern bridge to Grift.');
INSERT INTO public.translations VALUES ('en', 'origins.esoteric_hermit.2', 'You wandered, memoryless, from the mouth of a cavern at the cliffs of Terion.');
INSERT INTO public.translations VALUES ('en', 'origins.esoteric_hermit.3', 'You were the single child survivor of an incident in the Valley of the Unfortunate Undead.');
INSERT INTO public.translations VALUES ('en', 'origins.gutterborn_scum.2', 'As a child, your mother was hanged from a tree outside of Galgenbeck, you fell from the corpse.');
INSERT INTO public.translations VALUES ('en', 'origins.gutterborn_scum.3', 'As a child, you were raised by rats in the gutters of Grift.');
INSERT INTO public.translations VALUES ('en', 'origins.gutterborn_scum.4', 'As a child, you grew up kicked and beaten beneath a baker''s table in Schleswig.');
INSERT INTO public.translations VALUES ('en', 'origins.gutterborn_scum.5', 'As a child, you escaped the Tvelandian orphanarium.');
INSERT INTO public.translations VALUES ('en', 'origins.gutterborn_scum.6', 'As a child, you were educated by outlaws in a hovel south of Allians.');
INSERT INTO public.translations VALUES ('pl', 'classes.fanged_deserter.name', 'Kłowaty Dezerter');
INSERT INTO public.translations VALUES ('pl', 'classes.fanged_deserter.description', 'Masz ze trzydziestu przyjaciół, którzy nigdy cię nie zawiodą: TWOJE ZĘBY. Nielojalny, obłąkany lub po prostu niekontrolowany, każdą grupę, która cię nie wyrzuciła, sam opuściłeś.');
INSERT INTO public.translations VALUES ('pl', 'classes.gutterborn_scum.name', 'Rynsztokowy Szumowina');
INSERT INTO public.translations VALUES ('pl', 'classes.gutterborn_scum.description', 'Zła gwiazda uśmiechnęła się przy twoich narodzinach. Bieda, przestępczość i złe wychowanie też nie pomogły. Żyletka i bezksiężycowa noc są warte tygodnia ciężkiej roboty.');
INSERT INTO public.translations VALUES ('pl', 'classes.esoteric_hermit.name', 'Ezoteryczny Pustelnik');
INSERT INTO public.translations VALUES ('pl', 'classes.esoteric_hermit.description', 'Kamień twojej jaskini jest jednym z gwiazdami. Cisza i doskonałość. Teraz chaos upadłego świata zakłóca twoje rytuały.');
INSERT INTO public.translations VALUES ('pl', 'classes.wretched_royalty.name', 'Nędzna Królewskość');
INSERT INTO public.translations VALUES ('pl', 'classes.wretched_royalty.description', 'Uginasz się tylko pod ciężarem wspomnień własnej utraconej chwały, nigdy nie mógłbyś podporządkować się komuś innemu. Nie ty, z krwi szlacheckiej!');
INSERT INTO public.translations VALUES ('pl', 'classes.heretical_priest.name', 'Heretycki Kapłan');
INSERT INTO public.translations VALUES ('pl', 'classes.heretical_priest.description', 'Ścigany przez Dwugłowe Bazyliszki Jedynej Prawdziwej Wiary, można cię znaleźć bredzącego w ruinach i profanującego katedry nocą.');
INSERT INTO public.translations VALUES ('pl', 'classes.occult_herbmaster.name', 'Okultystyczny Zielarz');
INSERT INTO public.translations VALUES ('pl', 'classes.occult_herbmaster.description', 'Zrodzony z grzyba, wychowany w polanie, obserwowany przez oko księżyca w srebrnoczarnym stawie.');
INSERT INTO public.translations VALUES ('pl', 'origins.fanged_deserter.1', 'Twoje najwcześniejsze wspomnienia to spalony na węgiel budynek w Sarkash. Twój dom?');
INSERT INTO public.translations VALUES ('pl', 'origins.fanged_deserter.2', 'Twoje najwcześniejsze wspomnienia to porzucony gnijący statek kołyszący się bez końca po szarym morzu.');
INSERT INTO public.translations VALUES ('pl', 'origins.fanged_deserter.3', 'Twoje najwcześniejsze wspomnienia to burdel w Schleswig. Całkiem przyjazne środowisko.');
INSERT INTO public.translations VALUES ('pl', 'origins.fanged_deserter.4', 'Twoje najwcześniejsze wspomnienia to spanie z psami w kącie karczmy, czekając na czyiś powrót.');
INSERT INTO public.translations VALUES ('pl', 'origins.fanged_deserter.5', 'Twoje najwcześniejsze wspomnienia to podążanie za armią we wschodnim Wästland.');
INSERT INTO public.translations VALUES ('pl', 'origins.fanged_deserter.6', 'Twoje najwcześniejsze wspomnienia to ssanie wilczycy na dzikich terenach Bergen Chrypt.');
INSERT INTO public.translations VALUES ('pl', 'origins.gutterborn_scum.1', 'Jako dziecko zostałeś wrzucony na jadący wóz z gównem, wciąż w błonie płodowej.');
INSERT INTO public.translations VALUES ('pl', 'origins.gutterborn_scum.2', 'Jako dziecko twoją matkę powieszono na drzewie pod Galgenbeck, spadłeś z jej zwłok.');
INSERT INTO public.translations VALUES ('pl', 'origins.gutterborn_scum.3', 'Jako dziecko byłeś wychowywany przez szczury w rynsztokach Grift.');
INSERT INTO public.translations VALUES ('pl', 'origins.gutterborn_scum.4', 'Jako dziecko dorastałeś kopany i bity pod stołem piekarza w Schleswig.');
INSERT INTO public.translations VALUES ('pl', 'origins.gutterborn_scum.5', 'Jako dziecko uciekłeś z sierocinarium w Tveland.');
INSERT INTO public.translations VALUES ('pl', 'origins.gutterborn_scum.6', 'Jako dziecko byłeś edukowany przez banitów w ruderze na południe od Allians.');
INSERT INTO public.translations VALUES ('pl', 'origins.esoteric_hermit.1', 'Pamiętasz przebudzenie, dorosły, w kręgu rytualnym pod północnym mostem do Grift.');
INSERT INTO public.translations VALUES ('pl', 'origins.esoteric_hermit.2', 'Błąkałeś się, bez pamięci, z wnętrza jaskini przy klifach Terion.');
INSERT INTO public.translations VALUES ('pl', 'origins.esoteric_hermit.3', 'Byłeś jedynym dzieckiem, które przeżyło incydent w Dolinie Nieszczęsnych Nieumarłych.');
INSERT INTO public.translations VALUES ('pl', 'origins.esoteric_hermit.4', 'Umierałeś na zarazę w norze w Bergen Chrypt, gdy dotknąłeś czegoś z zewnątrz.');
INSERT INTO public.translations VALUES ('pl', 'origins.esoteric_hermit.5', 'Byłeś przeciętną osobą, dopóki nie spotkałeś czegoś w mrocznej polanie w Sarkash.');
INSERT INTO public.translations VALUES ('pl', 'origins.esoteric_hermit.6', 'Wychowałeś się na samotnej wyspie na jeziorze Onda. Nikt inny o niej nie słyszał.');
INSERT INTO public.translations VALUES ('pl', 'origins.wretched_royalty.1', 'Wszystko szło tak dobrze, dopóki twój pałac w Wästland nie został obrócony w gruzy.');
INSERT INTO public.translations VALUES ('pl', 'origins.wretched_royalty.2', 'Wszystko szło tak dobrze, dopóki twoje karawanowe królestwo Tveland nie popadło w nędzę.');
INSERT INTO public.translations VALUES ('pl', 'origins.wretched_royalty.3', 'Wszystko szło tak dobrze, dopóki brat króla Fathmu IX, Zigmund, twój ojciec, nie został zamordowany.');
INSERT INTO public.translations VALUES ('pl', 'origins.wretched_royalty.4', 'Wszystko szło tak dobrze, dopóki południowe imperium Südglans nie zatonęło w morzu.');
INSERT INTO public.translations VALUES ('pl', 'origins.wretched_royalty.5', 'Wszystko szło tak dobrze, dopóki dwóch młodych książąt nie zostało porwanych na zachód od Bergen Chrypt.');
INSERT INTO public.translations VALUES ('pl', 'origins.wretched_royalty.6', 'Wszystko szło tak dobrze, dopóki Anthelia nie zażądała daru z szlacheckiej krwi.');
INSERT INTO public.translations VALUES ('pl', 'origins.heretical_priest.1', 'Pochodzisz z Galgenbeck, w pobliżu katedry Dwugłowych Bazyliszków.');
INSERT INTO public.translations VALUES ('pl', 'origins.heretical_priest.2', 'Jesteś jedynym ocalałym z zmasakrowanego kultu Allians.');
INSERT INTO public.translations VALUES ('pl', 'origins.heretical_priest.3', 'Pochodzisz z krypt Grift.');
INSERT INTO public.translations VALUES ('pl', 'origins.heretical_priest.4', 'Pochodzisz z jakichś ruin świątyni w Dolinie Nieszczęsnych Nieumarłych.');
INSERT INTO public.translations VALUES ('pl', 'origins.heretical_priest.5', 'Pochodzisz z jednego z wielu tuneli złodziejskich Graven-Tosk.');
INSERT INTO public.translations VALUES ('pl', 'origins.heretical_priest.6', 'Pochodzisz z tajnego kościoła w Bergen Chrypt.');
INSERT INTO public.translations VALUES ('pl', 'origins.occult_herbmaster.1', 'Wychowany w spokojnej izolacji w mroku Sarkash.');
INSERT INTO public.translations VALUES ('pl', 'origins.occult_herbmaster.2', 'Z nielegalnych nocnych targów w Schleswig.');
INSERT INTO public.translations VALUES ('pl', 'origins.occult_herbmaster.3', 'Z heretyckiej wyspy Crëlut, dwie mile morskie na wschód od Grift.');
INSERT INTO public.translations VALUES ('pl', 'origins.occult_herbmaster.4', 'Ze starych zamarzniętych ruin niedaleko Allians.');
INSERT INTO public.translations VALUES ('pl', 'origins.occult_herbmaster.5', 'Z małej chatki wiedźmy w Galgenbeck.');
INSERT INTO public.translations VALUES ('pl', 'origins.occult_herbmaster.6', 'Z ruin dworu Króla Cieni.');
INSERT INTO public.translations VALUES ('pl', 'abilities.fanged_deserter.clumsy', 'Niezdarny: Wszystkie testy Zwinności (oprócz obrony) mają PT+2. Nie możesz używać zwojów.');
INSERT INTO public.translations VALUES ('pl', 'abilities.fanged_deserter.bite', 'Zęby: PT10 do ataku, d6 obrażeń. Musisz być w zasięgu bliskim.');
INSERT INTO public.translations VALUES ('pl', 'abilities.fanged_deserter.mask', 'Maska Potwora: Budzi pierwotny strach w mniejszych stworzeniach, takich jak gobliny, gnoumy i dzieci. Kiedy jest noszona, co rundę sprawdzają Morale.');
INSERT INTO public.translations VALUES ('pl', 'abilities.fanged_deserter.scimitar', 'Brązowy Sejmitar z Galgenbeck: Śmierdzący miecz wyciągnięty z wojskowego rowu z gównem. d10 obrażeń. PT10 do ataku i obrony, gdy go dzierżysz. 1 na 6 szansy, że ranny wróg umrze na sepsę w 10 minut.');
INSERT INTO public.translations VALUES ('pl', 'abilities.fanged_deserter.teeth', 'Zęby Czarodzieja: Cztery dziwne zęby grzechoczą w poczerniałym woreczku. Przed bitwą rzuć d6 za każdy z nich. Za każdą 6 jeden z twoich ataków zadaje maksymalne obrażenia.');
INSERT INTO public.translations VALUES ('pl', 'abilities.fanged_deserter.sling', 'Proca Starego Sigürda: Zapleciona z jego długich szarych włosów. 2d4 obrażeń, wymaga kamieni wielkości pięści.');
INSERT INTO public.translations VALUES ('pl', 'abilities.fanged_deserter.hound', 'Starożytny Ogar Krwi: Astmatyczne, starcze stworzenie ze świetnym węchem, potrafi wywęszyć skarb w obrzydliwych śmieciach. Atak PT10 (d6), Obrona PT12, 10 PŻ. Wpada w szał przy goblinach i berserkerach.');
INSERT INTO public.translations VALUES ('pl', 'abilities.fanged_deserter.shoe', 'Podkowa Konia Śmierci: Wygląda normalnie, ale w twoich rękach uderza z PT10, d4 obrażeń. 1 na 6 szansy na natychmiastowe zmiażdżenie czaszki małym i średnim stworzeniom. Wraca do ręki jak bumerang.');
INSERT INTO public.translations VALUES ('pl', 'abilities.gutterborn_scum.stealthy', 'Skryty: Wszystkie PT Obecności i Zwinności są zmniejszone o 2.');
INSERT INTO public.translations VALUES ('pl', 'abilities.gutterborn_scum.jab', 'Cios Tchórza: Przy ataku z zaskoczenia testuj Zwinność PT10. Sukces oznacza automatyczne trafienie lekką bronią jednoręczną z obrażeniami +3.');
INSERT INTO public.translations VALUES ('pl', 'abilities.gutterborn_scum.fingersmith', 'Zwinne Paluszki: Twoje palce dostają się do kieszeni i zamków przy teście Zwinności PT8. Zaczynasz z wytrychami!');
INSERT INTO public.translations VALUES ('pl', 'abilities.gutterborn_scum.gob_lobber', 'Obrzydliwy Spluwacz: Twoja flegma jest lepka i celna. Możesz pluć d2 razy podczas walki. Test Obecności PT8 na trafienie. Cele są oślepione i wymiotują przez d4 rundy.');
INSERT INTO public.translations VALUES ('pl', 'abilities.gutterborn_scum.fate', 'Ucieczka Przeznaczeniu: Za każdym razem, gdy używasz znaku (omen), masz 50% szansy, że nie zostanie on zużyty.');
INSERT INTO public.translations VALUES ('pl', 'abilities.gutterborn_scum.stealth', 'Gówniane Skradanie się: Nadnaturalna zdolność ukrywania się w błocie i nieczystościach. Wymagany test Obecności PT16, aby cię zauważyć.');
INSERT INTO public.translations VALUES ('pl', 'abilities.gutterborn_scum.dodging', 'Unikanie Śmierci: Nawet Śmierć woli cię unikać. Przy śmierci masz 50% szansy na przeżycie. Jeśli się uda, po 10 rundach wstajesz z d4 PŻ.');
INSERT INTO public.translations VALUES ('pl', 'abilities.esoteric_hermit.master_of_fate', 'Mistrz Przeznaczenia: Znasz właściwą drogę przy teście Obecności PT8.');
INSERT INTO public.translations VALUES ('pl', 'abilities.esoteric_hermit.book', 'Księga Wrzącej Krwi: Raz dziennie wróg musi zdać test PT12, inaczej pojawiają się D2 pogromcy berserkerów. Na 1-4 walczą dla ciebie, na 5-6 atakują ciebie.');
INSERT INTO public.translations VALUES ('pl', 'abilities.esoteric_hermit.speaker', 'Mówca Prawdy: Dwa razy dziennie obniż PT następnego testu wybranej istoty o 4.');
INSERT INTO public.translations VALUES ('pl', 'abilities.esoteric_hermit.initiate', 'Inicjowany Niewidzialnego Kolegium: Raz dziennie przywołaj D2 zwoje (1-2 święte, 3-4 nieczyste). Jeśli nie zostaną użyte do świtu, zamieniają się w popiół.');
INSERT INTO public.translations VALUES ('pl', 'abilities.esoteric_hermit.bard', 'Bard Nieumarłych: Muzyka twojej harfy daje +D4 do rzutów na reakcję.');
INSERT INTO public.translations VALUES ('pl', 'abilities.esoteric_hermit.hawk', 'Jastrząb jako Broń: Lojalny jastrząb. Atak/obrona PT10 (pazury d4), 8 PŻ.');
INSERT INTO public.translations VALUES ('pl', 'abilities.wretched_royalty.blade', 'Ostrze Przodków: Gadający miecz, foppish i niepewny. d6+1 obrażeń. PT10. 1 na 6 szansy na zaatakowanie ciebie lub towarzyszy.');
INSERT INTO public.translations VALUES ('pl', 'abilities.wretched_royalty.poltroon', 'Błazen Poltroon: Irytujący, ale wrogowie tracą koncentrację. Przez pierwsze dwie rundy ty i sojusznicy macie +2 do ataku/obrony.');
INSERT INTO public.translations VALUES ('pl', 'abilities.wretched_royalty.barbarister', 'Niezwykły Koń Barbarister: Magiczny, inteligentny, arogancki gadający koń. Czasem daje +2 do testów Obecności związanych z logiką.');
INSERT INTO public.translations VALUES ('pl', 'abilities.wretched_royalty.hamfund', 'Giermek Hamfund: Tchórzliwy sługa strzeże miecza Eurekia. Raz na walkę miecz zadaje 2d6 obrażeń. Przy każdym ataku rzut d6: na 1 giermek ginie, a miecz znika na zawsze.');
INSERT INTO public.translations VALUES ('pl', 'abilities.wretched_royalty.gift', 'Prezent ze Skóry Węża: Pudełko z dagerem d4 obrażeń. Przy wyrzuceniu 1 cel natychmiast umiera od trucizny.');
INSERT INTO public.translations VALUES ('pl', 'abilities.wretched_royalty.horn', 'Róg Lordów Schleswig: Raz dziennie ryk trąby i test Obecności PT12 daje jednej istocie automatyczny sukces w następnym teście poza walką.');
INSERT INTO public.translations VALUES ('pl', 'abilities.heretical_priest.crook', 'Święty Kostur Pasterza: Głowica z ludzkiej kości. Kostur zadaje 2d4 obrażeń (z wyjątkiem bezwiernych ludzi).');
INSERT INTO public.translations VALUES ('pl', 'abilities.heretical_priest.mitre', 'Skradziona Mitra: Podczas noszenia obrona PT10. Po naciągnięciu na uszy poza walką stajesz się prawie niewidzialny (Skradanie PT8).');
INSERT INTO public.translations VALUES ('pl', 'abilities.heretical_priest.sins', 'Lista Grzechów: Dokument ujawniający grzeszników. Test Obecności PT10: Dziwne światło otacza złe istoty. Właściciel broni się z +2 przeciwko nim.');
INSERT INTO public.translations VALUES ('pl', 'abilities.heretical_priest.bible', 'Bluźniercza Biblia Nechrubela: Czytana raz dziennie. Wynik parzysty: leczy d4 PŻ po 5 min odpoczynku. Wynik nieparzysty: halucynacje do świtu.');
INSERT INTO public.translations VALUES ('pl', 'abilities.heretical_priest.stones', 'Kamienie z Zaginionej Świątyni Thel-Emas: Układ ujawnia niebezpieczeństwo w sąsiednim pokoju. Test Obecności PT10 na prawdziwość wróżby.');
INSERT INTO public.translations VALUES ('pl', 'abilities.heretical_priest.crucifix', 'Krucyfiks: Używany przeciwko nieumarłym, trollom i goblinom. Sprawdź morale (z modyfikatorem Obecności), aby odeszły.');
INSERT INTO public.translations VALUES ('pl', 'abilities.occult_herbmaster.decoctions', 'Laboratorium Przenośne: Codziennie twórz dwa losowe wywary, łącznie d4 dawek. Tracą moc po 24h.');
INSERT INTO public.translations VALUES ('pl', 'abilities.occult_herbmaster.red_poison', 'Czerwona Trucizna: Wytrzymałość PT12 lub -d10 PŻ.');
INSERT INTO public.translations VALUES ('pl', 'abilities.occult_herbmaster.ezumiel', 'Opary Ezumiela: Test PT14 lub silne halucynacje przez d4 godziny.');
INSERT INTO public.translations VALUES ('pl', 'abilities.occult_herbmaster.frog', 'Gulasz z Żaby Południowej: Wymioty przez d4 godziny, test PT14 aby móc robić cokolwiek innego.');
INSERT INTO public.translations VALUES ('pl', 'abilities.occult_herbmaster.vitalis', 'Eliksir Vitalis: Leczy d6 PŻ i zatrzymuje infekcję. Uzależnia.');
INSERT INTO public.translations VALUES ('pl', 'abilities.occult_herbmaster.soup', 'Zupa z Pająko-Sowy: Widzenie w ciemności i chodzenie po ścianach przez 30 minut.');
INSERT INTO public.translations VALUES ('pl', 'abilities.occult_herbmaster.philtre', 'Filtr Fernora: Wpuszczony do oka leczy infekcję i daje +2 do Obecności przez d4h.');
INSERT INTO public.translations VALUES ('pl', 'abilities.occult_herbmaster.hyphos', 'Tabaka Hyphosa: Szał! Dwa ataki na rundę, ale obrona z PT14. Jedna walka.');
INSERT INTO public.translations VALUES ('pl', 'abilities.occult_herbmaster.black_poison', 'Czarna Trucizna: Wytrzymałość PT14 lub -d6 PŻ i ślepota na godzinę.');
INSERT INTO public.translations VALUES ('en', 'classes.fanged_deserter.name', 'Fanged Deserter');
INSERT INTO public.translations VALUES ('en', 'classes.fanged_deserter.description', 'You have thirty or so friends who never let you down: YOUR TEETH. Disloyal, deranged or simply uncontrollable, any group that didn''t boot you out you left anyway.');
INSERT INTO public.translations VALUES ('en', 'classes.gutterborn_scum.name', 'Gutterborn Scum');
INSERT INTO public.translations VALUES ('en', 'classes.gutterborn_scum.description', 'An ill star smiled upon your birth. Poverty, crime and bad parenting didn''t help either. A razor blade and a moonless night are worth a week of chump-work.');
INSERT INTO public.translations VALUES ('en', 'classes.esoteric_hermit.name', 'Esoteric Hermit');
INSERT INTO public.translations VALUES ('en', 'classes.esoteric_hermit.description', 'The stone of your cave is one with the stars. Silence and perfection. Now the chaos of a fallen world disturbs your rituals.');
INSERT INTO public.translations VALUES ('en', 'classes.wretched_royalty.name', 'Wretched Royalty');
INSERT INTO public.translations VALUES ('en', 'classes.wretched_royalty.description', 'Bowed down only by the memories of your own lost glory, you could never submit to anyone else. Not you, of noble blood!');
INSERT INTO public.translations VALUES ('en', 'classes.heretical_priest.name', 'Heretical Priest');
INSERT INTO public.translations VALUES ('en', 'classes.heretical_priest.description', 'Hunted by the Two-Headed Basilisks of the One True Faith, you can be found raving in ruins and desecrating cathedrals by night.');
INSERT INTO public.translations VALUES ('en', 'classes.occult_herbmaster.name', 'Occult Herbmaster');
INSERT INTO public.translations VALUES ('en', 'classes.occult_herbmaster.description', 'Born of the mushroom, raised in the glade, watched by the eye of the moon in a silverblack pool.');


--
-- Data for Name: verification; Type: TABLE DATA; Schema: public; Owner: p1002_scmgrinder
--



--
-- Data for Name: weapons; Type: TABLE DATA; Schema: public; Owner: p1002_scmgrinder
--

INSERT INTO public.weapons VALUES (1, 'weapons.snake-skin-gift', '{weapon,special,melee}', NULL, NULL, NULL, '{4}', NULL, 0, false, 4, '{"1": {"text": "The target dies immediately of deadly poison"}, "2": {"text": "No effect"}, "3": {"text": "No effect"}, "4": {"text": "No effect"}}', 0, '[]', NULL, NULL);
INSERT INTO public.weapons VALUES (2, 'weapons.blade-of-ancestors', '{weapon,melee,special}', NULL, NULL, NULL, '{6}', NULL, 0, false, 6, '{"1": {"text": "The blade accidentally attacks a companion"}, "2": {"text": "No effect"}, "3": {"text": "No effect"}, "4": {"text": "No effect"}, "5": {"text": "No effect"}, "6": {"text": "No effect"}}', 1, '[{"value": 2, "source": "The Blade of your Ancestors", "exclude": ["defence", "test", "heal", "cast", "buff"], "statistic": "strength"}, {"value": 2, "source": "The Blade of your Ancestors", "exclude": ["melee", "ranged", "test", "heal", "cast", "ability", "buff"], "statistic": "agility"}]', NULL, NULL);
INSERT INTO public.weapons VALUES (3, 'weapons.brown-scimitar', '{weapon,melee,special}', NULL, NULL, NULL, '{6}', NULL, 0, false, 6, '{"1": {"text": "Enemy struck with potent sepsis, dies in 10 mins"}, "2": {"text": "No effect"}, "3": {"text": "No effect"}, "4": {"text": "No effect"}, "5": {"text": "No effect"}, "6": {"text": "No effect"}}', 0, '[]', NULL, NULL);
INSERT INTO public.weapons VALUES (4, 'weapons.sigurd-sling', '{weapon,ranged,special}', NULL, NULL, NULL, '{4,4}', NULL, 0, false, NULL, NULL, 0, '[]', 'Infinite', 999);
INSERT INTO public.weapons VALUES (5, 'weapons.shoe-of-death', '{weapon,ranged,special}', NULL, NULL, NULL, '{4}', NULL, 0, false, 6, '{"1": {"text": "Smashes skull, instant kill on small-medium creatures"}, "2": {"text": "No effect"}, "3": {"text": "No effect"}, "4": {"text": "No effect"}, "5": {"text": "No effect"}, "6": {"text": "No effect"}}', 0, '[]', NULL, NULL);
INSERT INTO public.weapons VALUES (31, 'weapons.sacred-shepherds-crook', '{weapon,melee,special}', NULL, NULL, NULL, '{4,4}', NULL, 0, false, NULL, NULL, 0, '[]', NULL, NULL);
INSERT INTO public.weapons VALUES (6, 'weapons.femur', '{weapon,melee}', NULL, NULL, NULL, '{4}', 1, 0, false, NULL, NULL, 0, '[]', NULL, NULL);
INSERT INTO public.weapons VALUES (7, 'weapons.staff', '{weapon,melee}', NULL, NULL, NULL, '{4}', 2, 5, false, NULL, NULL, 0, '[]', NULL, NULL);
INSERT INTO public.weapons VALUES (8, 'weapons.shortsword', '{weapon,melee}', NULL, NULL, NULL, '{4}', 3, 20, false, NULL, NULL, 0, '[]', NULL, NULL);
INSERT INTO public.weapons VALUES (9, 'weapons.knife', '{weapon,melee}', NULL, NULL, NULL, '{4}', 4, 10, false, NULL, NULL, 0, '[]', NULL, NULL);
INSERT INTO public.weapons VALUES (10, 'weapons.warhammer', '{weapon,melee}', NULL, NULL, NULL, '{6}', 5, 30, false, NULL, NULL, 0, '[]', NULL, NULL);
INSERT INTO public.weapons VALUES (11, 'weapons.sword', '{weapon,melee}', NULL, NULL, NULL, '{6}', 6, 30, false, NULL, NULL, 0, '[]', NULL, NULL);
INSERT INTO public.weapons VALUES (12, 'weapons.bow', '{weapon,ranged}', NULL, NULL, 'presence', '{6}', 7, 25, false, NULL, NULL, 0, '[]', 'Arrow', 10);
INSERT INTO public.weapons VALUES (13, 'weapons.flail', '{weapon,melee}', NULL, NULL, NULL, '{8}', 8, 35, false, NULL, NULL, 0, '[]', NULL, NULL);
INSERT INTO public.weapons VALUES (14, 'weapons.crossbow', '{weapon,ranged}', NULL, NULL, 'presence', '{8}', 9, 40, false, NULL, NULL, 0, '[]', 'Bolt', 10);
INSERT INTO public.weapons VALUES (15, 'weapons.zweihander', '{weapon,melee}', NULL, NULL, NULL, '{10}', 10, 60, false, NULL, NULL, 0, '[]', NULL, NULL);
INSERT INTO public.weapons VALUES (16, 'weapons.whip', '{weapon,melee}', NULL, NULL, NULL, '{2}', NULL, 5, false, NULL, NULL, 0, '[]', NULL, NULL);
INSERT INTO public.weapons VALUES (17, 'weapons.cudgel', '{weapon,melee}', NULL, NULL, NULL, '{4}', NULL, 20, true, NULL, NULL, 0, '[]', NULL, NULL);
INSERT INTO public.weapons VALUES (18, 'weapons.sling', '{weapon,ranged}', NULL, NULL, NULL, '{4}', NULL, 8, false, NULL, NULL, 0, '[]', 'Infinite', 999);
INSERT INTO public.weapons VALUES (19, 'weapons.sickle', '{weapon,melee}', NULL, NULL, NULL, '{4}', NULL, 15, true, NULL, NULL, 0, '[]', NULL, NULL);
INSERT INTO public.weapons VALUES (20, 'weapons.club', '{weapon,melee}', NULL, NULL, NULL, '{6}', NULL, 10, false, NULL, NULL, 0, '[]', NULL, NULL);
INSERT INTO public.weapons VALUES (21, 'weapons.handaxe', '{weapon,melee}', NULL, NULL, NULL, '{6}', NULL, 15, false, NULL, NULL, 0, '[]', NULL, NULL);
INSERT INTO public.weapons VALUES (22, 'weapons.mace', '{weapon,melee}', NULL, NULL, NULL, '{6}', NULL, 25, false, NULL, NULL, 0, '[]', NULL, NULL);
INSERT INTO public.weapons VALUES (23, 'weapons.spear', '{weapon,melee}', NULL, NULL, NULL, '{6}', NULL, 15, true, NULL, NULL, 0, '[]', NULL, NULL);
INSERT INTO public.weapons VALUES (24, 'weapons.battle-axe', '{weapon,melee}', NULL, NULL, NULL, '{8}', NULL, 35, false, NULL, NULL, 0, '[]', NULL, NULL);
INSERT INTO public.weapons VALUES (25, 'weapons.goedendag', '{weapon,melee}', NULL, NULL, NULL, '{8}', NULL, 30, true, NULL, NULL, 0, '[]', NULL, NULL);
INSERT INTO public.weapons VALUES (26, 'weapons.meat-cleaver', '{tool,metal,weapon}', NULL, NULL, NULL, '{4}', NULL, 15, false, NULL, NULL, 0, '[]', NULL, NULL);
INSERT INTO public.weapons VALUES (27, 'weapons.crowbar', '{tool,metal,weapon}', NULL, NULL, NULL, '{4}', NULL, 8, false, NULL, NULL, 0, '[]', NULL, NULL);
INSERT INTO public.weapons VALUES (28, 'weapons.hammer', '{tool,metal,weapon}', NULL, NULL, NULL, '{4}', NULL, 8, false, NULL, NULL, 0, '[]', NULL, NULL);
INSERT INTO public.weapons VALUES (29, 'weapons.caltrops', '{trap,metal}', NULL, NULL, NULL, '{4}', NULL, 7, false, NULL, NULL, 0, '[]', NULL, NULL);
INSERT INTO public.weapons VALUES (30, 'weapons.shield', '{shield}', NULL, NULL, NULL, '{4}', NULL, 20, false, NULL, NULL, 0, '[]', NULL, NULL);


--
-- Name: abilities_id_seq; Type: SEQUENCE SET; Schema: public; Owner: p1002_scmgrinder
--

SELECT pg_catalog.setval('public.abilities_id_seq', 45, true);


--
-- Name: armors_id_seq; Type: SEQUENCE SET; Schema: public; Owner: p1002_scmgrinder
--

SELECT pg_catalog.setval('public.armors_id_seq', 7, true);


--
-- Name: body_descriptions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: p1002_scmgrinder
--

SELECT pg_catalog.setval('public.body_descriptions_id_seq', 20, true);


--
-- Name: classes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: p1002_scmgrinder
--

SELECT pg_catalog.setval('public.classes_id_seq', 6, true);


--
-- Name: equipment_id_seq; Type: SEQUENCE SET; Schema: public; Owner: p1002_scmgrinder
--

SELECT pg_catalog.setval('public.equipment_id_seq', 61, true);


--
-- Name: habits_id_seq; Type: SEQUENCE SET; Schema: public; Owner: p1002_scmgrinder
--

SELECT pg_catalog.setval('public.habits_id_seq', 20, true);


--
-- Name: names_id_seq; Type: SEQUENCE SET; Schema: public; Owner: p1002_scmgrinder
--

SELECT pg_catalog.setval('public.names_id_seq', 215, true);


--
-- Name: origins_id_seq; Type: SEQUENCE SET; Schema: public; Owner: p1002_scmgrinder
--

SELECT pg_catalog.setval('public.origins_id_seq', 96, true);


--
-- Name: pets_id_seq; Type: SEQUENCE SET; Schema: public; Owner: p1002_scmgrinder
--

SELECT pg_catalog.setval('public.pets_id_seq', 7, true);


--
-- Name: tales_id_seq; Type: SEQUENCE SET; Schema: public; Owner: p1002_scmgrinder
--

SELECT pg_catalog.setval('public.tales_id_seq', 20, true);


--
-- Name: traits_id_seq; Type: SEQUENCE SET; Schema: public; Owner: p1002_scmgrinder
--

SELECT pg_catalog.setval('public.traits_id_seq', 20, true);


--
-- Name: weapons_id_seq; Type: SEQUENCE SET; Schema: public; Owner: p1002_scmgrinder
--

SELECT pg_catalog.setval('public.weapons_id_seq', 31, true);


--
-- PostgreSQL database dump complete
--

