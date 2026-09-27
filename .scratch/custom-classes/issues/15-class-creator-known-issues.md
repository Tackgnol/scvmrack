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
