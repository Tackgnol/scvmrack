# Fix the class creator prototype's remaining known issues

Type: task
Status: resolved
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

## Critique round 2 (2026-09-27)

The confirming critique scored **28/40** (the run before scored 33). All nine items above passed their repros. It found two older P1s the earlier rounds missed, and two regressions from this ticket's fixes. The owner chose to fix all five priority issues, with **Save sealing the undo history** and focus drawn **yellow with a white offset** (pink stays for interrupts). Fixed, each with a scripted repro:

- **[P1] Keyboard edits hit the wrong row.** Focus was restored by a selector without the field path, so arrowing a modifier's Stat or scope, or its Space, changed another row, or a weapon's Reach. Focus is now restored by `data-path` (and by `data-base` / `data-list`).
- **[P1] Undo outlived Save.** A successful Save now clears the undo and redo history. Ctrl+Z on the class list does nothing, and editing again starts fresh; this matches ticket 17's "resuming starts a fresh history".
- **[P2] Undo holes.**
  - These are now quiet, collapsing undo steps: die picks, option choices, add modifier, add reference table, granting a waiting item, and adding a language.
  - A refused Ctrl+Z (a field was edited after the last recorded change) now shows a snackbar ("Ctrl+Z skipped: you edited a field after that change", naming the last change) with **Undo it anyway**; before, only screen readers heard it.
  - The stack is 30 deep.
- **[P2] Cut-off messages** (a regression from this ticket). Sentences split only at "." or ".”" before a capital, never after an abbreviation or a bare closing quote. Grammar: "Forge a weapon / armor / gear / a pet", "is now armor".
- **[P2] Phone black on black.** At 390px a hovered or tapped segment keeps readable text; the yellow hover fill is mouse-only.
- **Minor:**
  - The focus shadow is white, not pink.
  - FORGED uses the headline face (the display face never sits inside a card), and its shadow shows on black.
  - Information chips are 0.75rem; hint lines are about 75 characters.
  - The order hint's key is styled.
  - The stats die grid no longer orphans the armor die.
  - "Forge a Class Item for this ability" everywhere, and Cancel re-hides grant menus it revealed.
  - A waiting Class Item's chip is no longer pink.
  - A table paste says how many filled rows it replaced, and asks to check the other language.
  - The test roll is announced as a summary.
  - On touch, opening a card focuses the card, not its Name field, so no keyboard pops up.
  - Alt+←/→ never reaches the browser's Back/Forward from the editor.
  - A changed, unsaved draft asks before the page unloads (the real creator autosaves, ticket 17).
- **Left as-is:**
  - The advisory "1rem phone body" (it keeps iOS from zooming inputs).
  - Add-button placement per step.
  - The prototype-only state panel.
  - The zine contact line (owner decision).
  - The Stats step's density: a product question, "book defaults / customise", not a defect.

### More acceptance criteria for the real creator

10. After any re-render, focus returns to the same field or control, identified by its path, never to a same-valued control elsewhere.
11. Save ends the undo history.
12. When a shortcut is refused, the refusal is visible, not only announced, and offers the explicit action.
13. Messages are cut only at sentence ends; type words take the right article.
14. No state renders text in the same colour as its background at any breakpoint, including sticky touch hover.
15. Opening a card on touch does not open the keyboard.
16. Editor shortcuts never trigger browser navigation.

## Critique round 3 and close (2026-09-27)

The second confirming critique scored **30/40**. The trend over the last runs is 32, 32, 33, 28, 30. As in the critique experiment, each round finds new edge cases. The owner closed the ticket after its regressions were fixed, and every other finding went to the build as acceptance criteria.

**Fixed, each with a scripted repro:**
- The snackbar shows the whole message, clamped to four lines, with the consequence first: "The weapon “Bone-Reader” now waits for an ability: Bone-Reader now grants Lockpicks instead." The first-sentence cut is gone.
- Redo after a keyboard or drag move lands on the moved card. Before, it went to the step rail or the top of the page.
- The FORGED shadow is pink. DESIGN.md allows black or pink offsets, and black vanishes on the paper.
- Re-clicking the already-chosen language, kind, type or table die is not an edit. This removes a false Ctrl+Z refusal, and the class no longer silently un-saves.
- Field labels in the creator are bone white (owner decision). Pink is kept for blockers, counts and missing text.

**Owner decisions:**
- **Typed text joins the undo history, per field.** A field's edits collapse into one undo entry, committed on blur or after about 1s idle. Ctrl+Z outside a field undoes the last field edit; inside a field it stays the field's own. The "Ctrl+Z skipped" refusal goes away. Built in the real creator, not in the prototype.
- **Creator field labels are bone white.** The sheet and the party page keep their look.

### Final acceptance criteria (adding to 1–16)

17. Every text field's edits are one undo entry per field, committed on blur or after about 1s idle. App-level Ctrl+Z outside a field undoes it, with no refusal state.
18. A message never hides a consequence. When a change orphans a Class Item, that is said first, and the whole message is shown.
19. Undo and redo of any change, including keyboard and drag moves, return focus to the control that made it.
20. Re-choosing the current value is not an edit: it doesn't touch the undo history, the Save state or the refusal logic.
21. The creator's field labels are not pink. Pink marks blockers, counts and missing text only.

### Carried to the build (found by the critiques, not fixed in the prototype)

- "Forge" names three things (add an item, create and grant, the Forged save stamp). Pick distinct verbs when writing the real copy.
- The Class Items rail tile should count an item that no ability grants, not just the Abilities step.
- The Abilities step carries four blocks before the first card. Consider folding the zine help into one place and moving the order hint into the grip's tooltip.
- Esc should dismiss the snackbar; the Move menu should close when focus leaves it; the snackbar should not follow the GM across steps.
- Fix on a Polish issue should not silently switch "Writing in" for every later step (or it should say so).
- Radio groups that commit only on Enter (Type, table die, languages) need a visible cue.
- The ordering hint names Alt+↑/↓ on phones, where there is no keyboard.
- Disabled +/− buttons are nearly invisible (1.21:1). The rail's "OK" chips and the type badges are 0.65rem, below the detector's 11px floor, which is a DESIGN.md question.
- When an ability and its item share a name, undo copy should say "its item".
