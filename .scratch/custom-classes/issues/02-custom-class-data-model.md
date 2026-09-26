# Where do Custom Classes, their abilities, origins and Class Items live, and how does a character point at one?

Type: grilling
Status: open
Blocked by: 01

## Question

Decide the storage model: extend `classes`/`abilities`/`origins` with an owner, or separate tables; how `Character.classId` (Int) references a Custom Class; how per-class live lookups (`class_ability_modifiers` by `classId`, translation keys) work for GM-authored content; where Class Items live so they never appear in the shared catalog; how single- vs dual-language text is stored and validated. Must respect the charting decisions: locked once used, archive instead of delete.
