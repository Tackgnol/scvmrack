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

## Assets

- Prototype: [prototypes/class-creator-b-polished.html](../prototypes/class-creator-b-polished.html) (round 1, 2026-09-27), added to the chosen creator.
  - **A grip on every card and row that has an order**: abilities, Class Items, origins and reference-table rows. It shows on collapsed and open cards alike, and hides when a list has one entry.
  - **Three ways to move**:
    - **Drag the grip** with mouse, pen or touch. The other cards slide aside live, the dropped card settles into its slot, and the page scrolls near the edges. Esc or a cancelled touch puts everything back.
    - **Tap the grip** for a Move menu: Move up, Move down, To the top, To the bottom. The menu stays on the moved card, so tapping Move up repeatedly walks it along. This is the single-tap alternative to dragging that WCAG 2.5.7 asks for.
    - **Alt+↑/↓** on any control of a card or row outside a text field, including the collapsed card's own button. Focus stays with the moved card. It never clashes with Alt+←/→ (steps), and the keys line in the rail lists it.
  - **Order made visible**:
    - Random abilities are numbered in pool order ("Random 1…4"), as a zine prints its d6 list.
    - Origins are numbered "Origin 1…N".
    - A table row's number is its die result.
    - Each list gets a hint saying what the order means.
  - **Undo**:
    - Every move is one undoable change. Repeated keyboard or menu moves of the same card collapse into one undo back to where it started, while each drag is its own.
    - Moves are quiet: no snackbar, but the step bar's Undo and Ctrl+Z reach them.
    - A table-row move carries the row's text in every language and its Class Item link.
  - **Checked** at 1280px (mouse) and 390px (touch):
    - Alt moves, undo and redo
    - the menu, including clicks
    - drag by mouse, and a real touch drag
    - origins, and a table row with a linked Class Item
    
    No errors and no sideways scroll. Two bugs found and fixed on the way: an open Move menu painted under the next card, and a tap swallowed right after a drag.

## What the code does today

- `abilities.roll_value` numbers each Book Class's random abilities (the book's d6 list). `origins.roll` orders origins, and the Getting Better repository already sorts by it.
- The generator never rolls by number: it shuffles the random pool evenly. `roll_value` is only used to index `classes.random_abilities` (grants by array position), which ticket 02 replaces with explicit grant columns.

## Proposed answer (to confirm with the owner)

1. **What reorders**: abilities, Class Items, origins and reference-table rows. Modifiers don't: an ability has at most 6 and their order changes nothing.
2. **The control**:
   - a grip (drag on any pointer; tap for the Move menu) plus Alt+↑/↓
   - no up and down buttons on every row
   - it works on collapsed and open cards and keeps the one-open-card pattern
3. **What order means downstream**:
   - One order everywhere: the sheet, the print page, the `/classes/:id` detail page and the test roll list abilities, Class Items and origins in the creator's order.
   - Random abilities and origins show their numbers, but a scvm still gets them by an even random pick, never by rolling a number (digital rolling needs no mapping).
   - A table row's number is its die result, so moving a row changes which roll gives it; the sheet shows the rolled row.
4. **Undo**: one undoable change per move; repeated moves of one card by keyboard or menu collapse into one; row moves carry their Class Item link.
5. **Data model** (feeds ticket 02):
   - a `position` column on abilities and on class-scoped Class Items, ordered by `(position, id)`
   - origins keep `roll` as their order
   - table rows store their die result
   - Save rewrites positions 1…N in its transaction, and each new Class Version (ticket 10) copies them
   - **Migration**: Book Class abilities get positions with fixed abilities first (by id), then random ones by `roll_value`, which keeps today's sheet order. `roll_value` is dropped once ticket 02's grant columns land. Origins need nothing.
