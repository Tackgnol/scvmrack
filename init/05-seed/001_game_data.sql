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

INSERT INTO public.classes VALUES (3, 'Esoteric Hermit', 3, 'The stone of your cave is one with the stars. Silence and perfection. Now the chaos of a fallen world disturbs your rituals.', 4, 4, 2, '{6}', 10, '{"agility": 0, "presence": 2, "strength": -2, "toughness": 0}', '[]', '[{"name": "Master of Fate", "description": "Know the right way with a DR8 Presence test."}, {"name": "A Book of Boiling Blood", "description": "Once daily summon D2 Berserker-slayers. D6 roll: 1-4 fight for you, 5-6 attack you."}, {"name": "Speaker of Truths", "description": "Twice daily lower next test DR by 4 for a creature."}, {"name": "Initiate of the Invisible College", "description": "Once daily summon D2 scrolls (sacred or unclean)."}, {"name": "Bard of the Undying", "description": "Harp music gives +D4 on reaction rolls."}, {"name": "Hawk as Weapon", "gainPet": "Hawk", "description": "Loyal hawk. DR10 attack/defence, d4 damage, 8 HP."}]', 1, 'classes.esoteric_hermit.name', 'classes.esoteric_hermit.description');
INSERT INTO public.classes VALUES (1, 'Fanged Deserter', 1, 'You have thirty or so friends who never let you down: YOUR TEETH. Disloyal, deranged or simply uncontrollable, any group that didn''t boot you out you left anyway.', 10, 10, 4, '{6,6}', 10, '{"agility": -1, "presence": -1, "strength": 2, "toughness": 0}', '[{"name": "Clumsy and Dull-witted", "description": "Agility tests are DR+2, excluding defence. You are incapable of understanding scrolls."}, {"name": "Bite Attack", "description": "DR10 to attack, d6 damage. You must be close to your target."}]', '[{"name": "Crumpled Monster Mask", "description": "Strikes primitive fear into lesser creatures like goblins and children."}, {"name": "The Brown Scimitar of Galgenbeck", "gainItem": "The Brown Scimitar of Galgenbeck", "description": "A stinking sword. D6 damage. 1 in 6 chance wounded enemy dies of sepsis."}, {"name": "Wizard Teeth", "description": "Four weird teeth in a pouch. Roll d6 for each before battle, on 6 one attack deals max damage."}, {"name": "Old Sigürd''s Sling", "gainItem": "Old Sigürd''s Sling", "description": "Woven from hair, 2d4 damage with fist-sized rocks."}, {"name": "Ancient Gore-Hound", "gainPet": "Ancient Gore-Hound", "description": "Asthmatic hound with superb nose. DR10 attack (d6), DR12 defence, 10 HP."}, {"name": "The Shoe of Death''s Horse", "gainItem": "The Shoe of Death''s Horse", "description": "DR10, d4 damage. 1 in 6 instant kill on small-medium creatures. Returns like boomerang."}]', 1, 'classes.fanged_deserter.name', 'classes.fanged_deserter.description');
INSERT INTO public.classes VALUES (2, 'Gutterborn Scum', 2, 'An ill star smiled upon your birth. Poverty, crime and bad parenting didn''t help either. A razor blade and a moonless night are worth a week of chump-work.', 6, 6, 2, '{6}', 10, '{"agility": 0, "presence": 0, "strength": -2, "toughness": 0}', '[{"name": "Stealthy", "description": "All Presence and Agility tests have their DR reduced by 2."}]', '[{"name": "Coward''s Jab", "description": "When attacking by surprise, DR10 Agility for auto-hit with +3 damage."}, {"name": "Filthy Fingersmith", "gainItem": "Metal file and lockpicks", "description": "Pickpocket and lockpick at DR8 Agility."}, {"name": "Abominable Gob Lobber", "description": "Spit d2 times per fight at DR8 Presence. Targets blinded d4 rounds."}, {"name": "Escaping Fate", "description": "50% chance omens are not spent when used."}, {"name": "Excretal Stealth", "description": "DR16 Presence to spot you when hidden in muck."}, {"name": "Dodging Death", "description": "50% chance to survive death with d4 HP after 10 rounds."}]', 1, 'classes.gutterborn_scum.name', 'classes.gutterborn_scum.description');
INSERT INTO public.classes VALUES (4, 'Wretched Royalty', 4, 'Bowed down only by the memories of your own lost glory, you could never submit to anyone else. Not you, of noble blood!', 6, 8, 3, '{6,6,6,6}', 10, '{"agility": 0, "presence": 0, "strength": 0, "toughness": 0}', '[]', '[{"name": "The Blade of your Ancestors", "gainItem": "The Blade of your Ancestors", "description": "Talking sword, foppish and unreliable. D6+1 damage, DR10. 1 in 6 chance to attack you."}, {"name": "Poltroon the Court Jester", "gainPet": "Poltroon the Court Jester", "description": "Irritating but +2 attack/defence for first 2 rounds."}, {"name": "Barbarister the Incredible Horse", "gainPet": "Barbarister the Incredible Horse", "description": "Magical, intelligent, arrogant talking horse. Sometimes +2 to logic tests."}, {"name": "Hamfund the Squire", "gainPet": "Hamfund the Squire", "description": "Cowardly squire guards Eurekia sword. 2d6 damage but 1 in 6 kills squire."}, {"name": "The Snake-Skin Gift", "gainItem": "The Snake-Skin Gift", "description": "Dagger does d4 damage, on 1 target dies of poison."}, {"name": "Horn of the Schleswig Lords", "description": "Once daily, DR12 Presence for automatic success on next non-combat test."}]', 2, 'classes.wretched_royalty.name', 'classes.wretched_royalty.description');
INSERT INTO public.classes VALUES (5, 'Heretical Priest', 5, 'Hunted by the Two-Headed Basilisks of the One True Faith, you can be found raving in ruins and desecrating cathedrals by night.', 8, 8, 4, '{6,6,6}', 10, '{"agility": 0, "presence": 2, "strength": -2, "toughness": 0}', '[]', '[{"name": "Sacred Shepherd''s Crook", "gainItem": "Sacred Shepherd''s Crook", "description": "Staff does 2d4 damage except to faithless humans."}, {"name": "Stolen Mitre", "description": "Defence DR10, stealth DR8 when pulled over ears."}, {"name": "List of Sins", "description": "DR10 Presence to reveal evil creatures, +2 defence against them."}, {"name": "The Blasphemous Nechrubel Bible", "description": "Daily read: even roll heals d4 HP after 5 min rest, odd roll causes hallucinations."}, {"name": "Stones from Thel-Emas'' Lost Temple", "description": "Cast to reveal danger in adjacent room. DR10 Presence to verify truth."}, {"name": "Crucifix of the Inverted Christ", "description": "Check morale on undead, trolls, goblins to make them leave."}]', 1, 'classes.heretical_priest.name', 'classes.heretical_priest.description');
INSERT INTO public.classes VALUES (6, 'Occult Herbmaster', 6, 'Born of the mushroom, raised in the glade, watched by the eye of the moon in a silverblack pool.', 6, 6, 2, '{6,6}', 10, '{"agility": 0, "presence": 0, "strength": -2, "toughness": 2}', '[{"name": "Portable Laboratory", "description": "Daily create 2 random decoctions, d4 doses total. Expire after 24 hours."}, {"name": "Decoctions Available", "description": "Red Poison, Ezumiel''s Vapor, Southern Frog, Elixir Vitalis, Spider-Owl Soup, Fernors Philtre, Hyphoss Snuff, Black Poison"}]', '[]', 0, 'classes.occult_herbmaster.name', 'classes.occult_herbmaster.description');


--
-- Data for Name: abilities; Type: TABLE DATA; Schema: public; Owner: p1002_scmgrinder
--

INSERT INTO public.abilities VALUES (1, 1, 'abilities.fanged_deserter.clumsy', false, NULL);
INSERT INTO public.abilities VALUES (2, 1, 'abilities.fanged_deserter.bite', false, NULL);
INSERT INTO public.abilities VALUES (3, 1, 'abilities.fanged_deserter.mask', true, 1);
INSERT INTO public.abilities VALUES (4, 1, 'abilities.fanged_deserter.scimitar', true, 2);
INSERT INTO public.abilities VALUES (5, 1, 'abilities.fanged_deserter.teeth', true, 3);
INSERT INTO public.abilities VALUES (6, 1, 'abilities.fanged_deserter.sling', true, 4);
INSERT INTO public.abilities VALUES (7, 1, 'abilities.fanged_deserter.shoe', true, 5);
INSERT INTO public.abilities VALUES (8, 1, 'abilities.fanged_deserter.hound', true, 6);
INSERT INTO public.abilities VALUES (9, 2, 'abilities.gutterborn_scum.stealthy', false, NULL);
INSERT INTO public.abilities VALUES (10, 2, 'abilities.gutterborn_scum.jab', true, 1);
INSERT INTO public.abilities VALUES (11, 2, 'abilities.gutterborn_scum.jester', true, 2);
INSERT INTO public.abilities VALUES (12, 2, 'abilities.gutterborn_scum.spatula', true, 3);
INSERT INTO public.abilities VALUES (13, 2, 'abilities.gutterborn_scum.muck', true, 4);
INSERT INTO public.abilities VALUES (14, 2, 'abilities.gutterborn_scum.poison', true, 5);
INSERT INTO public.abilities VALUES (15, 2, 'abilities.gutterborn_scum.nose', true, 6);
INSERT INTO public.abilities VALUES (16, 3, 'abilities.esoteric_hermit.scrolls', false, NULL);
INSERT INTO public.abilities VALUES (17, 3, 'abilities.esoteric_hermit.book', true, 1);
INSERT INTO public.abilities VALUES (18, 3, 'abilities.esoteric_hermit.staff', true, 2);
INSERT INTO public.abilities VALUES (19, 3, 'abilities.esoteric_hermit.skin', true, 3);
INSERT INTO public.abilities VALUES (20, 3, 'abilities.esoteric_hermit.ash', true, 4);
INSERT INTO public.abilities VALUES (21, 3, 'abilities.esoteric_hermit.eye', true, 5);
INSERT INTO public.abilities VALUES (22, 3, 'abilities.esoteric_hermit.bird', true, 6);
INSERT INTO public.abilities VALUES (23, 4, 'abilities.wretched_royalty.servant', false, NULL);
INSERT INTO public.abilities VALUES (24, 4, 'abilities.wretched_royalty.horse', true, 1);
INSERT INTO public.abilities VALUES (25, 4, 'abilities.wretched_royalty.blade', true, 2);
INSERT INTO public.abilities VALUES (26, 4, 'abilities.wretched_royalty.seal', true, 3);
INSERT INTO public.abilities VALUES (27, 4, 'abilities.wretched_royalty.squire', true, 4);
INSERT INTO public.abilities VALUES (28, 4, 'abilities.wretched_royalty.cape', true, 5);
INSERT INTO public.abilities VALUES (29, 4, 'abilities.wretched_royalty.crown', true, 6);
INSERT INTO public.abilities VALUES (30, 5, 'abilities.heretical_priest.sinner', false, NULL);
INSERT INTO public.abilities VALUES (31, 5, 'abilities.heretical_priest.beak', true, 1);
INSERT INTO public.abilities VALUES (32, 5, 'abilities.heretical_priest.breath', true, 2);
INSERT INTO public.abilities VALUES (33, 5, 'abilities.heretical_priest.voice', true, 3);
INSERT INTO public.abilities VALUES (34, 5, 'abilities.heretical_priest.fingers', true, 4);
INSERT INTO public.abilities VALUES (35, 5, 'abilities.heretical_priest.tongue', true, 5);
INSERT INTO public.abilities VALUES (36, 5, 'abilities.heretical_priest.eye', true, 6);
INSERT INTO public.abilities VALUES (37, 6, 'abilities.occult_herbmaster.decoctions', false, NULL);
INSERT INTO public.abilities VALUES (38, 6, 'abilities.occult_herbmaster.hyphos', true, 1);
INSERT INTO public.abilities VALUES (39, 6, 'abilities.occult_herbmaster.black_poison', true, 2);
INSERT INTO public.abilities VALUES (40, 6, 'abilities.occult_herbmaster.red_poison', true, 3);
INSERT INTO public.abilities VALUES (41, 6, 'abilities.occult_herbmaster.ezumiel', true, 4);
INSERT INTO public.abilities VALUES (42, 6, 'abilities.occult_herbmaster.frog', true, 5);
INSERT INTO public.abilities VALUES (43, 6, 'abilities.occult_herbmaster.vitalis', true, 6);
INSERT INTO public.abilities VALUES (44, 6, 'abilities.occult_herbmaster.soup', true, 7);
INSERT INTO public.abilities VALUES (45, 6, 'abilities.occult_herbmaster.philtre', true, 8);



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


--
-- Data for Name: guest_sessions; Type: TABLE DATA; Schema: public; Owner: p1002_scmgrinder
--

INSERT INTO public.guest_sessions VALUES ('566d4c4d-c0a0-4d3c-8aba-5efc155c4fd9', '2026-01-26 21:08:43.311+01', '2026-01-19 21:08:43.32392+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('e6315ef5-e715-4b0f-90e7-48700c4bafb9', '2026-01-27 11:18:09.689+01', '2026-01-20 11:18:09.698411+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('831cfaca-fb6b-4bcd-8018-3670090ca34e', '2026-01-27 16:23:07.551+01', '2026-01-20 16:23:07.580302+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('aa229d3a-f2f9-43e5-9b45-e4c5d58de8ed', '2026-01-27 17:40:45.047+01', '2026-01-20 17:40:45.079245+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('34d8deb1-0187-4b3b-ad2d-88372f147c5d', '2026-01-27 17:40:45.052+01', '2026-01-20 17:40:45.079689+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('98cfe966-29ed-4560-99b4-9f019303a8bc', '2026-01-27 17:42:59.35+01', '2026-01-20 17:42:59.350736+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('0fb057fb-8f0d-4333-9080-00044655c6d9', '2026-01-27 17:42:59.374+01', '2026-01-20 17:42:59.374567+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('6147185d-5d8d-4334-88a8-6a910a9e87c2', '2026-01-27 17:42:59.375+01', '2026-01-20 17:42:59.387435+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('3f4d78d8-8988-4e5b-9194-54f70c30b4fb', '2026-01-27 17:42:59.376+01', '2026-01-20 17:42:59.387622+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('5c8ce58a-97f0-4209-b47c-e258357b549e', '2026-01-27 17:42:59.402+01', '2026-01-20 17:42:59.402806+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('edde9b8c-2112-47c3-87b1-b0cf1be64f86', '2026-01-27 22:25:19.842+01', '2026-01-20 22:25:19.891294+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('53819fea-10ba-47fa-9b78-fc7977c3a1a8', '2026-01-27 22:25:19.875+01', '2026-01-20 22:25:19.891743+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('459c7181-0afc-44ef-a3f0-dea9d7941c04', '2026-01-27 22:27:17.544+01', '2026-01-20 22:27:17.554641+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('7bc550e7-15b9-4fe5-9e77-abb868a9898e', '2026-01-27 22:27:18.047+01', '2026-01-20 22:27:18.04799+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('5f57905d-2af1-4bf8-ab35-be8e64ab30ea', '2026-01-27 22:27:18.433+01', '2026-01-20 22:27:18.43433+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('6ee57c5d-f13b-4e22-b876-e15cc62bff0a', '2026-01-27 22:27:18.897+01', '2026-01-20 22:27:18.898199+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('62813292-7241-400f-9a71-aeacee76c48e', '2026-01-27 22:27:19.884+01', '2026-01-20 22:27:19.885042+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('5fafd889-b5ad-4b49-81ae-2a0d7e221a5a', '2026-01-27 22:27:19.917+01', '2026-01-20 22:27:19.917632+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('c4f50cf3-015d-47ca-8f9a-2af033d5dec1', '2026-01-27 22:27:20.213+01', '2026-01-20 22:27:20.214135+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('69e556a9-caab-4c36-8af9-d39a8bcc2eb1', '2026-01-27 22:27:20.221+01', '2026-01-20 22:27:20.221526+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('55995eac-3b54-4496-a962-10c80a667337', '2026-01-27 22:29:22.372+01', '2026-01-20 22:29:22.400302+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('072e6f16-f90d-4df6-932d-b56116f6c42c', '2026-01-27 22:29:22.381+01', '2026-01-20 22:29:22.400913+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('5785e78a-ead7-4e4d-b5bc-42e53f6f5225', '2026-01-27 22:32:09.547+01', '2026-01-20 22:32:09.640895+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('5c45dc1b-9f4f-4a60-857c-c50d9b3dd267', '2026-01-27 22:32:09.623+01', '2026-01-20 22:32:09.650679+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('99cbc107-3786-4dd6-850c-0227e74dd3fd', '2026-01-27 22:32:09.627+01', '2026-01-20 22:32:09.651091+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('0b0b578d-624d-4770-8b88-1959215b1c7b', '2026-01-27 22:32:09.632+01', '2026-01-20 22:32:09.651354+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('2e7a7d0f-6b7a-4470-aa77-56159542edba', '2026-01-27 22:32:09.791+01', '2026-01-20 22:32:09.79205+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('2f75a64d-c845-49d9-92d0-ca7c182c24f6', '2026-01-27 22:32:09.793+01', '2026-01-20 22:32:09.793466+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('9653d10f-7063-4430-9979-110a7650683c', '2026-01-27 22:32:09.795+01', '2026-01-20 22:32:09.795887+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('36f821fb-dac2-4257-9903-4cb70523e10a', '2026-01-27 22:32:09.798+01', '2026-01-20 22:32:09.798431+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('d3105241-cace-4492-9951-e315a2022e7d', '2026-01-27 22:32:09.8+01', '2026-01-20 22:32:09.800845+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('6121a938-5ee1-4874-a203-a987c13628e3', '2026-01-27 22:32:09.802+01', '2026-01-20 22:32:09.802954+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('09193109-2596-414a-9d62-4d6e308b69d2', '2026-01-27 22:32:09.835+01', '2026-01-20 22:32:09.835315+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('c32fabc4-8100-4427-96fb-311c2f0ec8c7', '2026-01-27 22:32:09.836+01', '2026-01-20 22:32:09.836432+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('b9fc13a7-64e5-4d7a-a80f-d5888f440b12', '2026-01-27 22:32:09.857+01', '2026-01-20 22:32:09.857853+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('1aa18edc-d191-4dbd-9013-8ea262759e46', '2026-01-27 22:32:10.863+01', '2026-01-20 22:32:10.864162+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('099865f0-6182-41e0-b2dc-ee1e3825902c', '2026-01-27 22:32:10.865+01', '2026-01-20 22:32:10.865251+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('e4f75a15-4ead-48b2-a159-5a7ac130417b', '2026-01-27 22:32:10.873+01', '2026-01-20 22:32:10.873228+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('9e274378-4780-4509-b931-917171f7a6c5', '2026-01-27 22:32:12.5+01', '2026-01-20 22:32:12.501163+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('0586adbc-00eb-48dc-b8cc-c76a940c3d72', '2026-01-27 22:32:12.552+01', '2026-01-20 22:32:12.553137+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('85cda9e3-2dcd-47da-ab55-7c2b1fe69f08', '2026-01-27 22:32:13.568+01', '2026-01-20 22:32:13.56858+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('e621fad0-3f36-4ae0-8c73-9505888adb06', '2026-01-27 22:32:19.657+01', '2026-01-20 22:32:19.657257+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('829dff31-959c-45a5-8a02-442bd75aa60f', '2026-01-27 22:32:19.71+01', '2026-01-20 22:32:19.710923+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('a4574a5d-c29b-4497-a7f0-0f5c71d1eb2c', '2026-01-27 22:32:20.729+01', '2026-01-20 22:32:20.729278+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('c673e1d9-fd37-4ca5-b413-04ddd3e9c6de', '2026-01-27 22:35:17.059+01', '2026-01-20 22:35:17.07193+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('a70b161a-98c3-46d4-bd1a-b303b9cf1fb9', '2026-01-27 22:35:17.061+01', '2026-01-20 22:35:17.072119+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('3809bc50-c1ab-4611-995c-dcb972599c34', '2026-01-27 22:35:17.062+01', '2026-01-20 22:35:17.072247+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('e8840eb3-6890-4833-8558-7dceaf9cbb66', '2026-01-27 22:35:17.064+01', '2026-01-20 22:35:17.072425+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('4b74a62a-6bc7-4d02-9764-2c3e5b35086d', '2026-01-27 22:35:17.348+01', '2026-01-20 22:35:17.34831+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('d75fea28-327f-4e1a-a4b2-b9a380486f50', '2026-01-27 22:35:17.349+01', '2026-01-20 22:35:17.349473+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('0b3abc00-96f7-4e45-96ae-977fb3002cc0', '2026-01-27 22:35:17.35+01', '2026-01-20 22:35:17.350875+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('ab2e5582-8899-4bb8-bb2e-68965b5a429a', '2026-01-27 22:35:17.396+01', '2026-01-20 22:35:17.396842+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('e3691a83-4809-464d-ab88-e87ca0865375', '2026-01-27 22:35:17.398+01', '2026-01-20 22:35:17.3984+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('ab98b009-77c2-41f5-aa74-612f0f5af063', '2026-01-27 22:35:17.399+01', '2026-01-20 22:35:17.39934+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('4b535011-56a6-4ebf-be9c-d3a6be568db7', '2026-01-27 22:35:17.655+01', '2026-01-20 22:35:17.655964+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('fe723b78-4767-462d-9cbd-b82178e1b9a7', '2026-01-27 22:35:17.657+01', '2026-01-20 22:35:17.657222+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('f214a663-0a58-4972-9deb-2c9041cd21ae', '2026-01-27 22:35:17.659+01', '2026-01-20 22:35:17.659825+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('70d1ed09-bb32-4ea2-aa52-8844ddf031f7', '2026-01-27 22:35:18.854+01', '2026-01-20 22:35:18.85474+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('9b323845-6e26-4e75-8167-66a73da34985', '2026-01-27 22:35:18.856+01', '2026-01-20 22:35:18.85647+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('cf0e6d97-7665-4a1b-90fd-87c237c55d22', '2026-01-27 22:35:18.857+01', '2026-01-20 22:35:18.857413+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('f39eee56-1105-4ec8-b718-98ca0f35eab9', '2026-01-27 22:35:27.393+01', '2026-01-20 22:35:27.393618+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('737d5420-4dd9-441b-9a36-28758e06b6fb', '2026-01-27 22:35:27.55+01', '2026-01-20 22:35:27.550797+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('5f306acc-5696-49ee-a8f6-87c1f647bd3c', '2026-01-27 22:35:27.551+01', '2026-01-20 22:35:27.551849+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('6aa89b35-f57c-45dd-91d4-aa70d327b239', '2026-01-27 22:35:27.552+01', '2026-01-20 22:35:27.552855+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('2263a315-ebc6-432a-b511-be970ff2106e', '2026-01-27 22:35:28.788+01', '2026-01-20 22:35:28.789186+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('6bfdb800-f282-4e49-ba8d-a34e205020dd', '2026-01-27 22:35:28.79+01', '2026-01-20 22:35:28.790334+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('62eadb48-83bb-4389-8689-91f1d0bef0ac', '2026-01-27 22:35:28.791+01', '2026-01-20 22:35:28.791548+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('fb7365da-a450-4b26-8599-3fe4e67f59ed', '2026-01-27 22:35:28.919+01', '2026-01-20 22:35:28.919863+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('64350bd4-ad6a-4e94-a9a4-f70c593479ac', '2026-01-27 22:35:28.92+01', '2026-01-20 22:35:28.920782+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('8397edc3-e5fd-4f81-8aa3-8f702dc4e597', '2026-01-27 22:35:28.922+01', '2026-01-20 22:35:28.922303+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('6aa264f9-d127-4e21-a690-cd7979fc5936', '2026-01-27 22:35:28.97+01', '2026-01-20 22:35:28.970888+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('dc563958-4a22-4a6d-b1bd-9b42fa02d56f', '2026-01-27 22:35:29.081+01', '2026-01-20 22:35:29.081793+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('9fb5128d-3eab-4d8e-9eeb-759a2ab508c3', '2026-01-27 22:35:29.244+01', '2026-01-20 22:35:29.244957+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('12b3b65d-24f3-467c-9a93-8f742cca36e5', '2026-01-27 22:35:30.254+01', '2026-01-20 22:35:30.254424+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('f499d8b8-e97a-4b49-91be-af034d66d03d', '2026-01-27 22:35:30.255+01', '2026-01-20 22:35:30.255962+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('c811453a-0fb9-4c3c-a153-77026fb4ef91', '2026-01-27 22:35:30.401+01', '2026-01-20 22:35:30.402173+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('ebd99413-3e73-4125-8f55-36a3eb55d0eb', '2026-01-27 22:42:17.765+01', '2026-01-20 22:42:17.779604+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('0d1e78e9-8043-4a63-88ba-e6cff88326fe', '2026-01-27 22:42:17.77+01', '2026-01-20 22:42:17.781372+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('987ae330-b251-4fcf-891f-6dd475458c41', '2026-01-27 22:42:17.772+01', '2026-01-20 22:42:17.781617+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('daa0d29b-65e9-464a-9d14-82370134039b', '2026-01-27 22:42:17.773+01', '2026-01-20 22:42:17.781859+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('dbd57740-f4d9-4806-9521-bb3e8de581b5', '2026-01-27 22:42:18.054+01', '2026-01-20 22:42:18.054298+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('b33fc921-238f-4968-80f2-bc0985380d67', '2026-01-27 22:42:18.062+01', '2026-01-20 22:42:18.063067+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('503663ad-eb3d-49e1-99dd-4e353c7ebf48', '2026-01-27 22:42:18.063+01', '2026-01-20 22:42:18.064053+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('a7ddfc87-77c2-4e84-87a3-17e3629a0558', '2026-01-27 22:42:18.103+01', '2026-01-20 22:42:18.104146+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('ca320584-1d40-46fd-8d95-daa8c18e95c2', '2026-01-27 22:42:18.104+01', '2026-01-20 22:42:18.105035+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('434ffd21-7ac3-41bb-834a-3de5a314eb91', '2026-01-27 22:42:18.133+01', '2026-01-20 22:42:18.133932+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('75808655-40ef-4ad8-a80d-eb6cdd4b8ee1', '2026-01-27 22:42:18.346+01', '2026-01-20 22:42:18.347062+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('b41b844d-76c1-4ada-8940-fbff8b3bc082', '2026-01-27 22:42:18.357+01', '2026-01-20 22:42:18.358162+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('892e177f-7eee-4277-a98f-1a677228107d', '2026-01-27 22:42:18.391+01', '2026-01-20 22:42:18.391544+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('47bb9837-6e5e-4b3f-a79a-c926c079af94', '2026-01-27 22:42:19.658+01', '2026-01-20 22:42:19.658951+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('c7b7909e-c25e-4b9f-a9f1-a8155d40e941', '2026-01-27 22:42:19.659+01', '2026-01-20 22:42:19.659828+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('21d16fcc-d815-46e9-ae39-7a3b4ad9866c', '2026-01-27 22:42:19.661+01', '2026-01-20 22:42:19.661557+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('e752913a-6141-4b4f-a4df-4621c692c50e', '2026-01-27 22:42:31.062+01', '2026-01-20 22:42:31.074886+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('19bf5b91-4168-4385-9541-dc22858033f4', '2026-01-27 23:00:33.849+01', '2026-01-20 23:00:33.860324+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('872d429f-0fc7-411d-9064-0ec15f45de2c', '2026-01-27 23:01:03.977+01', '2026-01-20 23:01:03.987806+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('d3a45167-ae69-46f2-844b-ff0f7fa70547', '2026-01-27 23:03:50.525+01', '2026-01-20 23:03:50.535489+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('36938466-86fa-47dd-bf3c-9a33ba01ce4f', '2026-01-27 23:33:28.131+01', '2026-01-20 23:33:28.141149+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('3fb1fb16-2ed1-489d-9edf-2b34bd32d750', '2026-01-28 00:01:00.434+01', '2026-01-21 00:01:00.443834+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('ba1bb38f-60f2-4e18-8ebe-6cc727a10f34', '2026-01-28 00:01:01.511+01', '2026-01-21 00:01:01.51127+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('3c5f8e99-1a05-44ca-ad98-6e07bb602422', '2026-01-28 00:01:05.374+01', '2026-01-21 00:01:05.374825+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('23b3f93b-170d-4154-926d-ce447a155860', '2026-01-28 00:01:05.6+01', '2026-01-21 00:01:05.600349+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('ff37d312-af31-4ea9-a9ab-c770b0840478', '2026-01-28 00:01:36.699+01', '2026-01-21 00:01:36.708089+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('5234e336-9a8d-41aa-b9d0-46078409b1f6', '2026-01-28 00:01:37.267+01', '2026-01-21 00:01:37.267865+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('49148eb4-3f48-477b-b14d-bbee4becdfe3', '2026-01-28 00:01:37.474+01', '2026-01-21 00:01:37.474504+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('551af9fb-2ffd-483a-b968-bd711d5591f5', '2026-01-28 00:01:37.475+01', '2026-01-21 00:01:37.485223+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('7ba56c03-c7af-4072-9b7f-cda99c35cb17', '2026-01-28 00:01:37.476+01', '2026-01-21 00:01:37.486129+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('b3f67756-82dc-4497-b039-fffda848c3c9', '2026-01-28 00:01:37.87+01', '2026-01-21 00:01:37.870594+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('7eb5eb20-c24b-45a5-8f95-1f25ecfbe086', '2026-01-28 00:01:37.871+01', '2026-01-21 00:01:37.871608+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('1097f28a-47c6-4624-b59c-fdee2a6f6b5e', '2026-01-28 00:01:37.872+01', '2026-01-21 00:01:37.872975+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('44859abc-2bf5-4d53-aa02-b0e491537573', '2026-01-28 00:01:38.007+01', '2026-01-21 00:01:38.007993+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('87e61666-aa05-45a2-8d19-195991de024d', '2026-01-28 00:01:38.008+01', '2026-01-21 00:01:38.008796+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('fde96468-6193-4902-8b12-12acd3a3f38b', '2026-01-28 00:01:38.009+01', '2026-01-21 00:01:38.009648+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('4d1043b0-fb6d-42ae-afe8-a3d24d9fb4a8', '2026-01-28 00:01:38.156+01', '2026-01-21 00:01:38.157079+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('38138cc5-09cb-4a8b-a63b-7c09fbfc83e7', '2026-01-28 00:01:38.247+01', '2026-01-21 00:01:38.247255+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('47dab287-8cf2-48cb-8dab-05ba1d42e367', '2026-01-28 00:01:38.358+01', '2026-01-21 00:01:38.358973+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('e1bbd611-f7c5-4e29-8a6f-82fa2fd45bd4', '2026-01-28 00:01:45.727+01', '2026-01-21 00:01:45.727533+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('dcc948a0-5265-4f06-ac22-066eb70ff101', '2026-01-28 00:01:46.086+01', '2026-01-21 00:01:46.086352+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('b0cd37db-ff2d-4478-8bc0-428a0d1cbada', '2026-01-28 00:01:46.288+01', '2026-01-21 00:01:46.288803+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('18247541-6b96-4a48-8548-f3ea8da0db1d', '2026-01-28 00:01:46.289+01', '2026-01-21 00:01:46.289783+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('7ef71a7b-789b-4411-9e84-c3ad73b175fa', '2026-01-28 00:01:46.29+01', '2026-01-21 00:01:46.290771+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('b3fb87bb-593e-4476-9dca-46d2cb6ac269', '2026-01-28 00:01:47.492+01', '2026-01-21 00:01:47.492366+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('866f8c69-b515-44ff-b83e-84df50defa49', '2026-01-28 00:01:47.493+01', '2026-01-21 00:01:47.493352+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('b61ee4f2-c601-4680-b6ba-c90469fb962e', '2026-01-28 00:01:47.494+01', '2026-01-21 00:01:47.494301+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('cddc57db-54a5-4eb0-8f24-66515166883e', '2026-01-28 00:01:47.606+01', '2026-01-21 00:01:47.607044+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('7f870083-394e-4627-adc2-15d4038b11f6', '2026-01-28 00:01:47.607+01', '2026-01-21 00:01:47.607866+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('958d5cca-a2f5-4437-94ff-d054fbaf7181', '2026-01-28 00:01:47.608+01', '2026-01-21 00:01:47.608717+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('3f0b2baf-64d0-4b87-a7d1-62b2e2915502', '2026-01-28 00:01:47.823+01', '2026-01-21 00:01:47.823408+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('b35988a0-c065-47b6-b8ec-81d4c8d9ea7b', '2026-01-28 00:01:47.886+01', '2026-01-21 00:01:47.886654+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('c76bbd00-16a9-4b86-830c-dba0964c6ee2', '2026-01-28 00:01:47.887+01', '2026-01-21 00:01:47.88767+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('30a95362-2e73-4ad9-b02e-b9e0eb3efd0e', '2026-01-28 00:01:49.045+01', '2026-01-21 00:01:49.045473+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('cde7fc8c-447d-4cd2-b6b9-a9ba67f937be', '2026-01-28 00:01:49.08+01', '2026-01-21 00:01:49.080522+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('3ddd901d-e828-4188-a2a1-a3d0a8ad499c', '2026-01-28 00:01:49.083+01', '2026-01-21 00:01:49.08397+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('f216234f-7ad6-4247-90fa-29dfef894f3a', '2026-01-28 00:37:53.35+01', '2026-01-21 00:37:53.359538+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('9f5293c8-d0eb-4630-b580-e0a6362e6b32', '2026-01-28 00:37:53.712+01', '2026-01-21 00:37:53.712312+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('aec8b85f-b939-444b-90d7-b6d940d80e9b', '2026-01-28 00:37:53.933+01', '2026-01-21 00:37:53.933368+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('3c06c65e-313c-4e71-ac60-0705c8f22040', '2026-01-28 00:37:53.934+01', '2026-01-21 00:37:53.944001+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('1452d9f0-98aa-4b6c-aa20-96c9a9f8ddab', '2026-01-28 00:37:53.935+01', '2026-01-21 00:37:53.94491+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('7e613d0d-29f1-40be-8740-ddbd0d5a2ded', '2026-01-28 00:37:54.255+01', '2026-01-21 00:37:54.255545+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('00cc9e01-b55f-4242-90a8-4a490b4f3076', '2026-01-28 00:37:54.324+01', '2026-01-21 00:37:54.324889+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('42d44f01-5c7c-4243-ab13-d22d72519485', '2026-01-28 00:37:54.328+01', '2026-01-21 00:37:54.328217+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('a99c937d-f3c0-4628-a99b-316301f788da', '2026-01-28 00:37:54.325+01', '2026-01-21 00:37:54.325924+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('e753ec95-2173-42d7-a213-454ad091f0f8', '2026-01-28 00:38:01.515+01', '2026-01-21 00:38:01.516048+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('1d0fdddf-f735-42b4-9d52-68b35d389a89', '2026-01-28 00:38:02.615+01', '2026-01-21 00:38:02.616009+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('94947858-f7eb-4de1-b4f4-193223a958f8', '2026-01-28 00:38:02.656+01', '2026-01-21 00:38:02.65669+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('ef855caa-1a1c-42e8-a825-a9d7182e83d7', '2026-01-28 00:37:54.326+01', '2026-01-21 00:37:54.326973+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('f61ac49b-5586-4226-af19-91d6f51401aa', '2026-01-28 00:37:54.329+01', '2026-01-21 00:37:54.338562+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('f48d056c-fea9-488c-a10f-787d5f488069', '2026-01-28 00:37:54.498+01', '2026-01-21 00:37:54.498918+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('63c6fab6-6ad1-46c5-821b-c8b897792593', '2026-01-28 00:37:54.538+01', '2026-01-21 00:37:54.538945+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('7f5ced81-13f2-40e9-8992-c93814219751', '2026-01-28 00:37:54.539+01', '2026-01-21 00:37:54.53966+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('3fceb346-8238-4b34-a170-91dfd27d6122', '2026-01-28 00:38:01.27+01', '2026-01-21 00:38:01.271016+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('016bc54d-f99d-4e0f-b9b5-94c323096d6f', '2026-01-28 00:38:01.271+01', '2026-01-21 00:38:01.272121+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('49534a96-514a-4a58-a4e2-71be9a664fd8', '2026-01-28 00:38:01.513+01', '2026-01-21 00:38:01.513546+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('30e86b80-5210-4f8a-bb34-ac324419e275', '2026-01-28 00:38:01.514+01', '2026-01-21 00:38:01.51467+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('c5ed116d-26fa-493b-8227-8472f0fd484a', '2026-01-28 00:38:02.614+01', '2026-01-21 00:38:02.61435+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('b1ab8872-5e66-4a59-ab36-c0568e5737fc', '2026-01-28 00:38:02.617+01', '2026-01-21 00:38:02.617266+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('96cfe360-a442-4e1c-9419-247e85940014', '2026-01-28 00:38:02.654+01', '2026-01-21 00:38:02.654625+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('10380e77-d4af-4752-8690-1cd42d6ca1ad', '2026-01-28 00:38:02.657+01', '2026-01-21 00:38:02.657842+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('8edbb357-47a2-4129-89c8-713b326bd3b6', '2026-01-28 00:38:03.448+01', '2026-01-21 00:38:03.448217+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('fb046952-b7d5-47c9-aa4e-c646b2c4f63c', '2026-01-28 00:38:03.476+01', '2026-01-21 00:38:03.477114+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('eb086cdd-5acd-43d0-8336-db260065a43b', '2026-01-28 00:38:03.522+01', '2026-01-21 00:38:03.522911+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('c040441e-76b0-48c7-882c-5623002340fc', '2026-01-28 00:38:04.648+01', '2026-01-21 00:38:04.648864+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('255a35f0-d06a-4513-a55e-16ac5dd2963d', '2026-01-28 00:38:04.667+01', '2026-01-21 00:38:04.667306+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('21039a61-8873-49eb-8b37-7bb397cf03b9', '2026-01-28 00:38:04.702+01', '2026-01-21 00:38:04.702746+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('a3d2a679-0cf5-4b51-80ba-f712a203c080', '2026-01-28 01:21:18.803+01', '2026-01-21 01:21:18.812012+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('84d0dc23-eb08-4f14-bab1-74ff4051e0a2', '2026-01-28 01:21:18.827+01', '2026-01-21 01:21:18.827502+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('cea94660-4bb9-4e5c-a254-b0e925596a8f', '2026-01-28 01:21:18.888+01', '2026-01-21 01:21:18.888981+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('4a7abeaa-5377-42b9-aaf5-a3b4df006e49', '2026-01-28 01:21:18.89+01', '2026-01-21 01:21:18.899864+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('57e462e8-6911-41d1-95b7-ed2253f1bb9b', '2026-01-28 01:21:18.891+01', '2026-01-21 01:21:18.900937+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('33b1c1d1-fbb9-488d-8842-e192676a9905', '2026-01-28 01:21:18.984+01', '2026-01-21 01:21:18.98455+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('4b0b191d-f3ca-420a-8631-6225e45fdd51', '2026-01-28 01:21:18.991+01', '2026-01-21 01:21:18.992095+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('27d4127a-217a-4ba3-87d5-9f2486c2be5d', '2026-01-28 01:21:19.029+01', '2026-01-21 01:21:19.029227+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('920b73bf-5afe-4bbc-8255-755480dc2786', '2026-01-28 01:21:19.029+01', '2026-01-21 01:21:19.030044+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('50dc4b06-5b2a-483c-9fd9-9764d9717b59', '2026-01-28 01:21:19.063+01', '2026-01-21 01:21:19.063999+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('7ed0c554-4855-46a7-b4c2-5b23e42d4947', '2026-01-28 01:21:19.066+01', '2026-01-21 01:21:19.06712+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('3faa0449-eb85-4f24-a24d-2a59f133bd33', '2026-01-28 01:21:19.073+01', '2026-01-21 01:21:19.073969+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('2440a6e0-e2ce-4187-afbe-c418d627aa28', '2026-01-28 01:21:19.092+01', '2026-01-21 01:21:19.09271+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('301918c4-771f-4048-b234-cc4187d25f82', '2026-01-28 01:21:19.105+01', '2026-01-21 01:21:19.10612+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('717c0900-e5e4-4d87-aab1-d9011c0f6030', '2026-01-28 01:21:19.15+01', '2026-01-21 01:21:19.150262+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('d384cddd-7771-47d8-bdc6-e8e1724a966f', '2026-01-28 01:21:20.52+01', '2026-01-21 01:21:20.52061+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('7fa2cf3a-541e-412b-9a37-8db17388de58', '2026-01-28 01:21:20.521+01', '2026-01-21 01:21:20.521401+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('587b9f37-d309-4c1b-a80e-5074459c0ab3', '2026-01-28 01:21:20.522+01', '2026-01-21 01:21:20.522218+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('3bc432fd-54cd-46be-9b71-068eaae6872f', '2026-01-28 01:21:33.655+01', '2026-01-21 01:21:33.663979+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('64046aaf-2581-4428-ac67-174a4068db88', '2026-01-28 01:21:33.879+01', '2026-01-21 01:21:33.879252+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('74332360-91e3-4f86-8fbf-302a3bc7a11f', '2026-01-28 01:21:34.462+01', '2026-01-21 01:21:34.462768+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('93d78d05-0994-49be-aa55-291e8aefa25e', '2026-01-28 02:02:27.001+01', '2026-01-21 02:02:27.011069+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('7972d156-31b6-4940-899c-a1a8dff47039', '2026-01-28 02:03:55.751+01', '2026-01-21 02:03:55.761349+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('7338e43f-4d63-4b79-8ee1-3dd8b65aa984', '2026-01-28 02:05:02.801+01', '2026-01-21 02:05:02.813262+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('7458c0fc-9f89-4925-b697-2842cb76ed00', '2026-01-28 02:05:03.177+01', '2026-01-21 02:05:03.177287+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('0ff1fb74-b16c-4960-b9ac-959ee656546c', '2026-01-28 02:05:03.178+01', '2026-01-21 02:05:03.188127+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('8e08142c-8834-44d7-b3df-b045789512aa', '2026-01-28 02:05:03.182+01', '2026-01-21 02:05:03.192653+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('a5bb4d3d-e9a5-48ad-9824-06ff7f9f62bb', '2026-01-28 02:05:05.097+01', '2026-01-21 02:05:05.097471+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('c812baf7-c033-4e7f-a242-2c39e9f1295f', '2026-01-28 02:05:05.098+01', '2026-01-21 02:05:05.09829+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('2a2be698-7ff0-431c-bd6e-6c9c1b2e45ad', '2026-01-28 02:05:05.099+01', '2026-01-21 02:05:05.099667+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('b2afd001-106e-4a57-a29e-c915db4859f0', '2026-01-28 02:05:05.321+01', '2026-01-21 02:05:05.322017+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('c3489a9e-5ef1-49e2-b102-27ade13e3064', '2026-01-28 02:05:05.322+01', '2026-01-21 02:05:05.322925+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('73e87df6-211c-4916-9985-fc9d343ddd2a', '2026-01-28 02:05:05.323+01', '2026-01-21 02:05:05.323824+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('d8d1acfa-e5aa-4922-b8e6-c4bafbd049e4', '2026-01-28 02:05:07.204+01', '2026-01-21 02:05:07.20485+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('819b0d40-5b5b-4b52-ba6b-6d9210e1e9c7', '2026-01-28 02:05:07.206+01', '2026-01-21 02:05:07.206355+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('298a6539-c73f-473f-b80c-99a82883113c', '2026-01-28 02:05:07.539+01', '2026-01-21 02:05:07.539481+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('8e3e94f3-a745-4662-a8a0-dc64cfd59d60', '2026-01-28 04:35:02.393+01', '2026-01-21 04:35:02.408405+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('259a34a0-2e54-4d55-b070-af83215d5db9', '2026-01-28 05:23:50.848+01', '2026-01-21 05:23:50.857362+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('f4494bef-6b1e-46b9-885f-70c98bb2f2fc', '2026-01-28 12:10:29.754+01', '2026-01-21 12:10:29.764776+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('a6b5fab6-5b3c-4c7c-b4f0-f83f9fbedf98', '2026-01-29 05:07:42.729+01', '2026-01-22 05:07:42.739196+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('d802b627-0c70-4c68-95e3-3da4f41b03de', '2026-01-29 17:16:55.138+01', '2026-01-22 17:16:55.147852+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('cbb7643a-5af6-4a47-b271-51dd2be93fe6', '2026-01-29 19:34:28.783+01', '2026-01-22 19:34:28.791656+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('30fce2f2-718c-4bb5-9db5-4f06696cec7f', '2026-01-30 02:23:17.325+01', '2026-01-23 02:23:17.333954+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('eca0cbeb-203a-47d2-aa27-bff71841e375', '2026-01-30 10:59:02.652+01', '2026-01-23 10:59:02.661252+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('d2b42287-79f8-4d33-8e9e-6585f9bccad1', '2026-01-30 14:09:24.07+01', '2026-01-23 14:09:24.085078+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('2fb5179c-8fde-4824-bd59-676a5a5a1ec2', '2026-01-31 19:56:13.453+01', '2026-01-24 19:56:13.479105+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('5e984393-b941-4cc3-a3cf-42d4cfaf8cd8', '2026-02-01 01:26:29.761+01', '2026-01-25 01:26:29.771244+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('2cd84b6b-6bc4-4eb9-a56a-b8e7a18582bf', '2026-02-01 02:10:39.774+01', '2026-01-25 02:10:39.789152+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('f7ffb482-9588-431d-b266-4ba65f5df3e5', '2026-02-01 02:10:39.777+01', '2026-01-25 02:10:39.791062+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('b99fb831-c328-47cf-8e3b-e480d961abf9', '2026-02-01 02:10:39.778+01', '2026-01-25 02:10:39.791566+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('8c79b2d5-ee0e-4d40-8948-55ab222b3405', '2026-02-01 02:10:39.782+01', '2026-01-25 02:10:39.791722+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('74556b6b-5a05-45c0-a60d-a3db18150f45', '2026-02-01 02:10:39.781+01', '2026-01-25 02:10:39.791992+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('d07b46ec-891e-4df0-863c-af0fca4b58f9', '2026-02-01 02:10:39.788+01', '2026-01-25 02:10:39.800497+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('85d3298d-bdf9-4a5c-a21e-20fb7ad2511d', '2026-02-01 02:10:40.038+01', '2026-01-25 02:10:40.039002+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('6803be0e-d452-43e7-a6b1-2da7993bc05f', '2026-02-01 02:10:40.039+01', '2026-01-25 02:10:40.039843+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('2b39a021-119d-448d-b9bd-7967c5ec4cba', '2026-02-01 02:10:40.043+01', '2026-01-25 02:10:40.043945+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('685e4eb2-e4b1-48ae-813c-627345897f31', '2026-02-01 02:10:41.23+01', '2026-01-25 02:10:41.230255+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('7a0a8383-d774-494e-9e6e-4c2dde301a61', '2026-02-01 02:10:41.23+01', '2026-01-25 02:10:41.231044+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('11ea5bda-c3f8-499a-9f07-49255fe1482b', '2026-02-01 02:10:41.233+01', '2026-01-25 02:10:41.233228+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('be675ae1-76d4-46b3-8690-cd0d02cc183d', '2026-02-01 02:10:41.236+01', '2026-01-25 02:10:41.236855+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('01e98100-baf6-4977-ba66-b412114e6d85', '2026-02-01 02:10:41.459+01', '2026-01-25 02:10:41.459738+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('0d191f4b-dcda-4a67-9de6-e5beb2ab709e', '2026-02-01 02:10:41.461+01', '2026-01-25 02:10:41.461597+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('6aa15fda-d16b-4d2c-a473-35b9a4d79d4b', '2026-02-01 02:10:41.464+01', '2026-01-25 02:10:41.46499+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('75bfcb5e-cd3b-4690-8e53-77bf57451f4e', '2026-02-01 02:10:41.466+01', '2026-01-25 02:10:41.466626+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('4c2fb5f6-629f-4cfd-9806-0dd3eaa61fe4', '2026-02-01 02:47:40.198+01', '2026-01-25 02:47:40.208959+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('53bc8884-cb89-436b-bc25-6e39c6551dbd', '2026-02-01 02:47:40.198+01', '2026-01-25 02:47:40.209135+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('27fd405c-0d51-48e3-ba31-c0da1df11188', '2026-02-01 02:47:40.199+01', '2026-01-25 02:47:40.209267+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('9e36c907-f4b6-4a28-90f0-674fcc3ba923', '2026-02-01 02:47:40.212+01', '2026-01-25 02:47:40.212548+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('b98d7219-ac19-4202-9cf9-6a457d4685fd', '2026-02-01 02:47:40.204+01', '2026-01-25 02:47:40.215793+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('af043046-9f8c-4ea0-bda3-fb1ec8543040', '2026-02-01 02:47:40.205+01', '2026-01-25 02:47:40.216663+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('9555a779-5133-4cb7-b891-0ad46c07f9fc', '2026-02-01 02:47:40.754+01', '2026-01-25 02:47:40.75499+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('a44cd10f-911e-44ee-bc27-ffb83613f5e6', '2026-02-01 02:47:40.755+01', '2026-01-25 02:47:40.755959+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('489fa70c-a334-4ed6-bb34-d5fc0707ab4c', '2026-02-01 02:47:42.467+01', '2026-01-25 02:47:42.467222+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('91c3b238-cfe3-4f81-a626-05b6e663253e', '2026-02-01 02:47:43.811+01', '2026-01-25 02:47:43.811648+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('ac2b89d8-6104-48a6-aeba-f77a5125a4cb', '2026-02-01 14:50:21.125+01', '2026-01-25 14:50:21.134711+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('1f8b67d0-d965-406f-a1d5-d12fb8161c15', '2026-02-01 14:51:09.104+01', '2026-01-25 14:51:09.113827+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('f97f096e-301f-446a-a945-3056147150b4', '2026-02-03 01:37:28.378+01', '2026-01-27 01:37:28.387412+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('b411d786-be0e-4bcc-9345-bef9e57c8a62', '2026-02-03 01:45:03.662+01', '2026-01-27 01:45:03.670954+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('019f4421-4fcf-45c3-b1b4-b6eb8dc249f8', '2026-02-04 10:12:35.985+01', '2026-01-28 10:12:35.995853+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('d453d52f-8fd1-49df-9411-137ac9f5722d', '2026-02-04 10:12:40.21+01', '2026-01-28 10:12:40.210958+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('51c00653-6dfe-4968-9fe6-8e1d170db50e', '2026-02-04 16:16:10.307+01', '2026-01-28 16:16:10.319988+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('086b41c1-5dd8-42c0-a415-5da257696f35', '2026-02-04 16:16:10.438+01', '2026-01-28 16:16:10.438991+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('4be2c0c8-9e75-4194-99ce-8e19a00deb83', '2026-02-05 08:43:35.962+01', '2026-01-29 08:43:35.971328+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('3af7092b-950a-41ba-b6c7-a46edf2253a1', '2026-02-06 12:51:01.69+01', '2026-01-30 12:51:01.718037+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('1e91d66b-93e8-4f42-aa9d-bf0b10e00a19', '2026-02-06 14:36:30.814+01', '2026-01-30 14:36:30.825732+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('be755c3a-f2ed-4569-bb5d-89767041cb37', '2026-02-06 16:40:39.019+01', '2026-01-30 16:40:39.030415+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('06a25d61-190f-4e58-b637-76df017c011a', '2026-02-12 16:33:46.94+01', '2026-02-05 16:33:47.006072+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('6f313293-a457-468b-b1f7-99f7596c714a', '2026-02-13 05:27:27.836+01', '2026-02-06 05:27:27.866129+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('192f5d30-71af-461e-9c88-823f12863af8', '2026-02-13 08:24:50.161+01', '2026-02-06 08:24:50.171464+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('ca9ca0bf-7994-4892-bdd1-030f9122333d', '2026-02-13 15:33:45.716+01', '2026-02-06 15:33:45.731398+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('866d60ae-dd7f-43a9-9678-2e8886c21975', '2026-02-14 03:12:33.014+01', '2026-02-07 03:12:33.148058+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('874ae68f-15d7-4ec0-b8e7-4445002a18c7', '2026-02-14 03:12:36.908+01', '2026-02-07 03:12:36.908568+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('cde6b842-6fa1-4a2c-a72a-2983e95264a5', '2026-02-14 03:19:59.107+01', '2026-02-07 03:19:59.122092+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('8cf2fdd9-f11c-4c73-8a84-e235f690b53d', '2026-02-14 03:20:02.399+01', '2026-02-07 03:20:02.400269+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('ed315c94-4516-454e-a14a-c0b120c4c028', '2026-02-14 08:05:21.413+01', '2026-02-07 08:05:21.423484+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('85347437-5375-412b-9558-181b40e22d8f', '2026-02-14 08:05:23.64+01', '2026-02-07 08:05:23.640433+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('c43172d7-166a-4b95-a5f5-e17a4a9b0bb3', '2026-02-14 08:07:30.959+01', '2026-02-07 08:07:30.968585+01', NULL, NULL);
INSERT INTO public.guest_sessions VALUES ('1391ca3c-bd68-498f-a387-612b345391db', '2026-02-14 08:07:34.269+01', '2026-02-07 08:07:34.270241+01', NULL, NULL);


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
INSERT INTO public.translations VALUES ('en', 'abilities.fanged_deserter.mask', 'Monster Mask: NPCs must test Morale to stay near you.');
INSERT INTO public.translations VALUES ('en', 'abilities.fanged_deserter.scimitar', 'Brown Scimitar: d10 damage. If you roll a 1, it breaks.');
INSERT INTO public.translations VALUES ('en', 'abilities.fanged_deserter.teeth', 'Wizard Teeth: d6 teeth. Throw for d4 damage; they grow back after rest.');
INSERT INTO public.translations VALUES ('en', 'abilities.fanged_deserter.sling', 'Sigurd''s Sling: 2d4 damage. Heavy stones only.');
INSERT INTO public.translations VALUES ('en', 'abilities.fanged_deserter.shoe', 'Death Horse Shoe: You always win initiative.');
INSERT INTO public.translations VALUES ('en', 'abilities.fanged_deserter.hound', 'Gore-Hound: A loyal pet with d6 HP and d4 bite.');
INSERT INTO public.translations VALUES ('en', 'abilities.gutterborn_scum.stealthy', 'Stealthy: All Presence and Agility DR are reduced by 2.');
INSERT INTO public.translations VALUES ('en', 'abilities.gutterborn_scum.jab', 'Kidney Jab: +d4 damage if you attack from stealth.');
INSERT INTO public.translations VALUES ('en', 'abilities.gutterborn_scum.jester', 'Poltroon the Jester: A pet that mocks your enemies (DR-2 to enemy morale).');
INSERT INTO public.translations VALUES ('en', 'abilities.gutterborn_scum.spatula', 'Graver''s Spatula: Can be used to pry open locks and graves.');
INSERT INTO public.translations VALUES ('en', 'abilities.gutterborn_scum.muck', 'Muck-covered: Your smell is so bad that animals won''t bite you first.');
INSERT INTO public.translations VALUES ('en', 'abilities.gutterborn_scum.poison', 'Poisoner: You can apply poison to your blade (d4 extra damage).');
INSERT INTO public.translations VALUES ('en', 'abilities.gutterborn_scum.nose', 'City Nose: You can smell gold or silver within 30 feet.');
INSERT INTO public.translations VALUES ('en', 'abilities.esoteric_hermit.scrolls', 'Scroll-Bound: You start with two random scrolls.');
INSERT INTO public.translations VALUES ('en', 'abilities.esoteric_hermit.book', 'Book of Fate: Once per day, reroll any one die.');
INSERT INTO public.translations VALUES ('en', 'abilities.esoteric_hermit.staff', 'Hermit''s Staff: d4 damage. Can cast light once per day.');
INSERT INTO public.translations VALUES ('en', 'abilities.wretched_royalty.servant', 'Complacent Servant: Carries all your items and takes hits for you.');
INSERT INTO public.translations VALUES ('en', 'abilities.wretched_royalty.horse', 'Barbarister: A majestic horse that never flees.');
INSERT INTO public.translations VALUES ('en', 'abilities.heretical_priest.sinner', 'Sinner: You cannot be healed by holy magic.');
INSERT INTO public.translations VALUES ('en', 'abilities.heretical_priest.voice', 'Thunderous Voice: Presence DR12 to make an enemy flee.');
INSERT INTO public.translations VALUES ('en', 'abilities.occult_herbmaster.decoctions', 'Herbmaster: You can create d4 decoctions every morning.');
INSERT INTO public.translations VALUES ('en', 'abilities.occult_herbmaster.hyphos', 'Hyphos Snuff: DR-2 to all Toughness tests for 1 hour.');
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
INSERT INTO public.translations VALUES ('pl', 'abilities.fanged_deserter.mask', 'Maska Potwora: BN muszą zdać test Morale, aby pozostać w pobliżu.');
INSERT INTO public.translations VALUES ('pl', 'abilities.fanged_deserter.scimitar', 'Brązowy Sejmitar: d10 obrażeń. Jeśli wyrzucisz 1, pęka.');
INSERT INTO public.translations VALUES ('pl', 'abilities.fanged_deserter.teeth', 'Zęby Czarodzieja: d6 zębów. Rzuć za d4 obrażeń; odrastają po odpoczynku.');
INSERT INTO public.translations VALUES ('pl', 'abilities.fanged_deserter.sling', 'Proca Sigürda: 2d4 obrażeń. Tylko ciężkie kamienie.');
INSERT INTO public.translations VALUES ('pl', 'abilities.fanged_deserter.shoe', 'Podkowa Konia Śmierci: Zawsze wygrywasz inicjatywę.');
INSERT INTO public.translations VALUES ('pl', 'abilities.fanged_deserter.hound', 'Ogar Krwi: Lojalny zwierzak z d6 PŻ i d4 ugryzieniem.');
INSERT INTO public.translations VALUES ('pl', 'abilities.gutterborn_scum.stealthy', 'Skryty: Wszystkie PT Obecności i Zwinności są zmniejszone o 2.');
INSERT INTO public.translations VALUES ('pl', 'abilities.gutterborn_scum.jab', 'Cios w Nerkę: +d4 obrażeń przy ataku z ukrycia.');
INSERT INTO public.translations VALUES ('pl', 'abilities.gutterborn_scum.jester', 'Poltroon Błazen: Zwierzak, który wyśmiewa twoich wrogów (PT-2 do morale wroga).');
INSERT INTO public.translations VALUES ('pl', 'abilities.gutterborn_scum.spatula', 'Szpachelka Grabarza: Może być użyta do otwierania zamków i grobów.');
INSERT INTO public.translations VALUES ('pl', 'abilities.gutterborn_scum.muck', 'Pokryty Błotem: Twój zapach jest tak okropny, że zwierzęta nie gryzą cię pierwsze.');
INSERT INTO public.translations VALUES ('pl', 'abilities.gutterborn_scum.poison', 'Truciciel: Możesz nakładać truciznę na ostrze (d4 dodatkowych obrażeń).');
INSERT INTO public.translations VALUES ('pl', 'abilities.gutterborn_scum.nose', 'Miejski Nos: Wyczuwasz złoto lub srebro w promieniu 30 stóp.');
INSERT INTO public.translations VALUES ('pl', 'abilities.esoteric_hermit.scrolls', 'Związany ze Zwojami: Zaczynasz z dwoma losowymi zwojami.');
INSERT INTO public.translations VALUES ('pl', 'abilities.esoteric_hermit.book', 'Księga Przeznaczenia: Raz dziennie przerzuć dowolną kość.');
INSERT INTO public.translations VALUES ('pl', 'abilities.esoteric_hermit.staff', 'Laska Pustelnika: d4 obrażeń. Może rzucić światło raz dziennie.');
INSERT INTO public.translations VALUES ('pl', 'abilities.esoteric_hermit.skin', 'Skóra Pustelnika: -d2 do obrażeń od zimna i gorąca.');
INSERT INTO public.translations VALUES ('pl', 'abilities.esoteric_hermit.ash', 'Popiół Pustelnika: Rzuć garść popiołu, aby oślepić wrogów na d4 rund.');
INSERT INTO public.translations VALUES ('pl', 'abilities.esoteric_hermit.eye', 'Oko Pustelnika: Widzisz w ciemności na odległość 30 stóp.');
INSERT INTO public.translations VALUES ('pl', 'abilities.esoteric_hermit.bird', 'Ptak Pustelnika: Mały ptak przynosi ci wieści i drobne przedmioty.');
INSERT INTO public.translations VALUES ('pl', 'abilities.wretched_royalty.servant', 'Potulny Sługa: Nosi wszystkie twoje przedmioty i przyjmuje za ciebie ciosy.');
INSERT INTO public.translations VALUES ('pl', 'abilities.wretched_royalty.horse', 'Barbarister: Majestatyczny koń, który nigdy nie ucieka.');
INSERT INTO public.translations VALUES ('pl', 'abilities.wretched_royalty.blade', 'Ostrze Przodków: d6+1 obrażeń. Gadający miecz, który czasem cię atakuje.');
INSERT INTO public.translations VALUES ('pl', 'abilities.wretched_royalty.seal', 'Królewska Pieczęć: Możesz żądać posłuszeństwa od pospólstwa (PT10 Obecność).');
INSERT INTO public.translations VALUES ('pl', 'abilities.wretched_royalty.squire', 'Giermek Hamfund: Tchórzliwy strażnik miecza Eurekia. 2d6 obrażeń, ale 1 na 6 zabija giermka.');
INSERT INTO public.translations VALUES ('pl', 'abilities.wretched_royalty.cape', 'Peleryna Szlachectwa: +2 do testów Obecności wobec pospólstwa.');
INSERT INTO public.translations VALUES ('pl', 'abilities.wretched_royalty.crown', 'Korona Bez Królestwa: Raz dziennie zainspiruj sojuszników, +2 do następnego testu.');
INSERT INTO public.translations VALUES ('pl', 'abilities.heretical_priest.sinner', 'Grzesznik: Nie możesz być leczony przez świętą magię.');
INSERT INTO public.translations VALUES ('pl', 'abilities.heretical_priest.beak', 'Dziób Zarazy: Maska dająca +2 do obrony przed chorobami.');
INSERT INTO public.translations VALUES ('pl', 'abilities.heretical_priest.breath', 'Oddech Heretyka: Twój oddech może zatruć wodę (test PT14 lub d4 obrażeń).');
INSERT INTO public.translations VALUES ('pl', 'abilities.heretical_priest.voice', 'Grzmiący Głos: PT12 Obecność, aby zmusić wroga do ucieczki.');
INSERT INTO public.translations VALUES ('pl', 'abilities.heretical_priest.fingers', 'Palce Kapłana: Możesz wyczuć świętość lub nieczystość dotykając przedmiotów.');
INSERT INTO public.translations VALUES ('pl', 'abilities.heretical_priest.tongue', 'Język Heretyka: Mówisz w obcych językach, gdy jesteś w transie.');
INSERT INTO public.translations VALUES ('pl', 'abilities.heretical_priest.eye', 'Oko Herezji: Widzisz demony i nieumarłych niewidzialnych dla innych.');
INSERT INTO public.translations VALUES ('pl', 'abilities.occult_herbmaster.decoctions', 'Zielarz: Możesz tworzyć d4 wywarów każdego ranka.');
INSERT INTO public.translations VALUES ('pl', 'abilities.occult_herbmaster.hyphos', 'Tabaka Hyphosa: PT-2 do wszystkich testów Wytrzymałości przez 1 godzinę.');
INSERT INTO public.translations VALUES ('pl', 'abilities.occult_herbmaster.black_poison', 'Czarna Trucizna: PT14 Wytrzymałość lub d6 obrażeń + ślepota na godzinę.');
INSERT INTO public.translations VALUES ('pl', 'abilities.occult_herbmaster.red_poison', 'Czerwona Trucizna: PT12 Wytrzymałość lub d10 obrażeń.');
INSERT INTO public.translations VALUES ('pl', 'abilities.occult_herbmaster.ezumiel', 'Opary Ezumiela: Ofiara ma halucynacje przez d4 godziny (PT14 aby się oprzeć).');
INSERT INTO public.translations VALUES ('pl', 'abilities.occult_herbmaster.frog', 'Gulasz z Żaby Południowej: Wymioty przez d4 godziny (PT14 aby cokolwiek robić).');
INSERT INTO public.translations VALUES ('pl', 'abilities.occult_herbmaster.vitalis', 'Eliksir Vitalis: Leczy d6 PŻ i zatrzymuje infekcję.');
INSERT INTO public.translations VALUES ('pl', 'abilities.occult_herbmaster.soup', 'Zupa z Pająko-Sowy: Widzenie w ciemności i chodzenie po ścianach przez 30 minut.');
INSERT INTO public.translations VALUES ('pl', 'abilities.occult_herbmaster.philtre', 'Filtr Fernora: Leczy infekcję, +2 Obecność przez d4 godziny.');
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

SELECT pg_catalog.setval('public.equipment_id_seq', 59, true);


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

SELECT pg_catalog.setval('public.weapons_id_seq', 30, true);


--
-- PostgreSQL database dump complete
--

