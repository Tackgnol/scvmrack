-- Book Class Getting Better rules: Gutterborn Scum is a Specialist, the rest
-- keep the book rules. Mirrors prisma/migrations/20261002120000_class_getting_better_rule.

UPDATE public.classes SET getting_better_rule = 'specialist'
WHERE name_key = 'classes.gutterborn_scum.name';
