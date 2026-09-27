# Fix the class creator prototype's remaining known issues

Type: task
Status: open
Blocked by: 04

## Question

The critique experiment (`prototypes/critique-40-goal.md`, stopped at 33/40 after 5 iterations) left a list of known defects and polish items in `prototypes/class-creator-b-polished.html`. None needs a product decision. Fix them in the prototype, re-run the critique once to confirm, and carry each fixed behaviour into the build spec as an acceptance criterion (the real creator must not reintroduce them).

## Defects

- **Redo inside a field after a paste undo**: Ctrl+Z in a field right after a multi-line paste undoes the paste, but Ctrl+Shift+Z / Ctrl+Y in that same field can't redo it (only the Redo button can).
- **Undone snackbar names the wrong value**: after undoing a coalesced change (e.g. arrowing a grant menu through several options), "Undone: … now grants Lockpicks" names the last value, not what came back.
- **Undo gaps in pickers**: picking a catalog grant when nothing was granted before, and stepper nudges (ArrowUp in a number field, +/−), are not undoable; Ctrl+Z in a number field after a nudge does nothing.
- **Rapid clicks with motion on**: clicking several ability rows quickly leaves an earlier one open (the last click should win; with reduced motion it does).
- **Non-text contrast (WCAG 1.4.11)**: an unfocused field's border (`#2a2a2a`) is 1.21:1 against the card (`#1a1a1a`); field edges need 3:1 without relying on the fill.
- **Hover and focus look the same on fields**: a field under the pointer shows no extra change when it takes focus.

## Polish

- Blocked Review still shows pink rail and language counts next to the pink blocked message; keep one pink interrupt while it shows.
- Snackbar messages are long uppercase sentences; shorten them and set them as sentences.
- The modifier row wraps "Remove modifier" under Stat on narrow cards.
- The forge picker's disabled tooltip reads "That grant slot is already used" (jargon); say which ability item or pet it already grants.
- Optional: a pink rail count could jump to that step's first issue.

## Fixed in the prototype (2026-09-27, commit cb08d95)

Each item has a scripted repro that failed before the fix and passes after it. The rapid-click race was also run against the pre-fix copy, which reproduced it.

- **Redo inside a field after a paste undo**: Ctrl+Shift+Z / Ctrl+Y in the field redo the paste, while nothing has changed since the undo. After a multi-line paste into origins, either the line pasted into or the last new line counts.
- **Undone snackbar names the wrong value**: an undo entry can say what it brings back, read after the undo runs. A run of grant changes Nothing → Lockpicks → Scimitar undoes to "Grave Sense grants nothing again."; type changes, the language switch and moves do the same.
- **Undo gaps**:
  - Every grant change is undoable, including the first pick from Nothing.
  - +/− and ArrowUp/Down nudges are undoable; a run on one field collapses into one change.
  - Ctrl+Z and Ctrl+Shift+Z work inside a number field right after its own nudge.
- **Rapid clicks with motion on**: while a view transition runs, Chrome hit-tests only its pseudo-element tree, so clicks landed on `<html>` and were lost. A click during a transition now finishes it at once and is replayed on whatever is under the pointer, so the last click wins. `pointer-events: none` on `::view-transition` does not help in Chrome.
- **Field edge contrast**: field borders are `#6e6e6e`: 3.4:1 on cards (`#1a1a1a`) and 3.9:1 on the black paper.
- **Hover vs focus**: hover lightens the edge to white; focus inks it yellow with a 3px pink offset.
- **Polish**:
  - While blocked Save shows, the rail and language counts step back to ink, leaving one pink interrupt.
  - Snackbars show the message's first sentence, set as a sentence in the body face; the live region still reads the whole message.
  - Modifier rows have a header, "Modifier N" with Remove at the right, so Remove never wraps under Stat.
  - A disabled forge type says which grant blocks it ("This ability already grants the item “Reliquary Flail”"), in its title and its accessible name.
- **Not done (optional)**: a pink rail count jumping to that step's first issue. It would put a control inside the step button; left out.

## Acceptance criteria for the real creator

The build must meet these; the prototype shows each one.

1. Every change the GM makes outside typing in a text field is one undoable change, including:
   - grant picks, including the first
   - number nudges (a run on one field collapses into one)
   - Fixed/Random, type, table die and language changes
   - adds, removals, duplicates, pastes and moves
2. Ctrl+Z never undoes past a typed edit. Inside a text field it is the field's own undo, except straight after that field's own paste or nudge, where it undoes that. Ctrl+Shift+Z / Ctrl+Y redo it from the same field while nothing has changed since.
3. An undo message says what came back, never the last value of a collapsed run.
4. With motion on, rapid clicks behave as with motion off: the last click wins and no click is lost during an animation.
5. Form field edges reach 3:1 against the surface they sit on (WCAG 1.4.11), and hover, focus and invalid states are each distinguishable.
6. One pink interrupt at a time: while a blocking message shows, other counts are not pink.
7. Snackbar text is a short sentence in sentence case; the live region carries the full message.
8. Row controls (Remove) sit in the row's header and never wrap under a field at 390px.
9. A disabled control says why, in words a GM uses: the blocking item by name, never "slot".
