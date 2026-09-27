# Experiment: class creator critique to 40/40

**Goal:** get `impeccable critique` of `class-creator-b-polished.html` to **40/40** (every Nielsen heuristic scored 4, "genuinely excellent").

**Start:** 27/40 at commit `d19d718` on `wayfinder/custom-classes`. Roll back with `git checkout d19d718 -- .scratch/custom-classes/prototypes/class-creator-b-polished.html`.

## One iteration

1. Run `/impeccable critique` on the prototype: dual-agent (design review + detector/overlay), full report, snapshot saved.
2. Take its priority issues in order and fix them with the command it names (`harden`, `distill`, `shape`, `polish`, `clarify`, `layout`, ...), following each playbook and the craft floor.
3. Verify in one batched pass (scripted interactions + desktop/mobile render + detector), fix what that shows, confirm once.
4. Publish to the same artifact, commit on `wayfinder/custom-classes`, append a row to the log below.

## Invariants (the experiment may not break these)

- Product decisions in tickets 00, 02, 03, 04 stand: Class Items before Abilities with the gate question; one granter per Class Item; collapsed abilities with one open; free-text item descriptions (no effect tables); structured reference tables; one language at a time; the Stats-step control grammar; four title levels.
- `DESIGN.md` and `PRODUCT.md` win over the critique: no rounded corners, no blurred shadows, no gradients, pink as an interrupt only, **no opacity animation**.
- It stays a throwaway prototype: no backend, no real persistence.
- A fix that needs a **new product decision** (e.g. reordering abilities, a zine credit on Custom Classes, catalog search behaviour) is put to the owner as a question, not invented.
- Commits as the repo's configured user, no Co-Authored-By or Claude attribution.

## Stop conditions

- 40/40 reached, or
- the score does not rise for two iterations in a row (record why it plateaued), or
- the iteration cap is hit (**5 iterations**, run autonomously via a self-paced `/loop`), or
- the owner says stop.

## Log

| # | Score | Main fixes | Commit |
|---|---|---|---|
| 0 | 22/40 | first critique (Class Items ↔ Abilities) | `f0a69dd` |
| 1 | 27/40 | shape, distill, polish, animate passes | `d19d718` |
| 2 | – | harden: explicit forge, change type, scoped undo, safe ungranting (not yet re-scored) | `d19d718` |
| 3 | 28/40 | scored the harden pass; fixed: arrow-safe forge/type (P1), undo stack + Ctrl+Z + Esc, collapsed Class Items (2.4k→0.9k px desktop, 4.2k→1.3k mobile), modifier row in Stats grammar (items too), ammo, use effect, table die, paste lines, duplicate, field hints with book values, resolved test roll, Forged stamp, DESIGN ramp sizes (detector 10→1) | `6eed31a` |
| 4 | 30/40 | all ten heuristics at 3; fixed: Type/table die/languages need Enter to commit + exact grant restore on undo (P1), redo (Ctrl+Shift+Z), standing Undo, Esc from selects, Alt+arrows between steps, new things not flagged until left, grouped table issues, slot/type validation, rows set aside by a smaller die come back, named modifier Remove, Saved state + blocked message as interrupt, Next heavy / Back quiet / no pink Add buttons, radiogroups everywhere, phone segment grids, compact phone stat lines, growing textareas, clean card heading names, scope and grant/forge help, rules preview in summaries, tables in the test roll, bulk ability paste. **Open for the owner:** where the GM goes after FORGED | `a464f42` |
