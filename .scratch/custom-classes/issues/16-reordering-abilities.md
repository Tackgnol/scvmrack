# How does a GM reorder abilities (and the other lists) in the creator?

Type: prototype
Status: open
Blocked by: 04

## Question

The owner wants reordering (decided 2026-09-27). Zines print abilities, origins and reference tables as numbered lists, and GMs porting one expect the same order. Prototype the interaction in `prototypes/class-creator-b-polished.html` and decide:

- Which lists reorder: abilities, origins, Class Items, reference-table rows, modifiers.
- The control: a drag handle, move up/down buttons, or both. It must work by keyboard (e.g. Alt+↑/↓ on a focused row, not clashing with Alt+←/→ step navigation) and on touch, and fit the collapsed-row pattern (one card open at a time).
- What order means downstream: the display order on the sheet and in the test roll, and whether the random pool keeps numbers (a zine's "roll d6" row numbers) or stays an unordered pool.
- Undo: a move is one undoable change, and table-row moves carry their Class Item link with them.
- The data model: an explicit `position` column per list (ticket 02), and what migration Book Classes need.
