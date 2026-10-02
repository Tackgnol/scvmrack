-- Getting Better is a class setting (RPG-260): one rule per class plus an
-- optional rules-note translation key. Gutterborn Scum's hardcoded specialty
-- rule becomes the general Specialist rule; every other Book Class keeps the
-- book rules (the column default). Fresh databases are migrated before
-- seeding, so init/05-seed/016_class_getting_better_rule.sql repeats the update.

CREATE TYPE "getting_better_rule" AS ENUM ('book', 'book_plus_ability', 'specialist');

ALTER TABLE "classes"
ADD COLUMN "getting_better_rule" "getting_better_rule" NOT NULL DEFAULT 'book',
ADD COLUMN "getting_better_note_key" VARCHAR(255);

UPDATE public.classes SET getting_better_rule = 'specialist'
WHERE name_key = 'classes.gutterborn_scum.name';
