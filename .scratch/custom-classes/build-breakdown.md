# Build breakdown: Custom Classes (approved, waiting for Linear)

Produced with `/to-tickets` from this map on 2026-10-01. The owner approved the granularity (31 tickets) and the blocking edges. **Publish to Linear, team `RPG`, from a session that has the Linear connector** (`docs/agents/issue-tracker.md`). This session had none, and the owner chose to wait rather than use local files or GitHub Issues.

Publishing rules:
- Publish in this order, blockers first, so each "blocked by" can use Linear's native relation.
- Label every ticket `ready-for-agent`.
- Each ticket's acceptance criteria come from the wayfinder tickets named in brackets; copy them in when publishing.
- Abuse limits (wayfinder 19) are folded into the slices they guard.
- Wayfinder ticket 15's 21 acceptance criteria apply to every creator slice (11–19).

## Groundwork on Book Classes

Each groundwork ticket leaves existing Book characters and generation unchanged.

1. **Class rows know their source, credit, owner and version.** Blocked by: none. [02, 10]
   - One `classes` table with source (Book, Zine, Rack, user), Credit, owner, visibility, status, languages and version lineage.
   - Existing rows are tagged.
2. **Abilities grant items explicitly.** Blocked by: none. [02, 03]
   - Item and pet grant columns on abilities.
   - Book Classes migrate off the positional `random_abilities` JSON and name maps; the grants stay identical.
3. **Per-stat dice and the book's omen dice.** Blocked by: none. [02]
   - Stat dice specs replace the stat modifiers, and each class gets an omen die.
   - The Book Classes' omen dice are corrected to the printed book.
4. **Getting Better is a class setting.** Blocked by: none. [09]
   - Book rules, "+ a new ability" or Specialist, plus a rules note.
   - Gutterborn Scum becomes Specialist, and the class-id checks go.
   - Old two-slot drafts are converted as they load.
5. **Abilities keep an order.** Blocked by: 2. [16]
   - A position column.
   - Book Classes are backfilled with fixed abilities first, then by `roll_value`.
   - The sheet and print follow the order, and `roll_value` retires.
6. **Abilities carry reference tables.** Blocked by: 2. [03, 20]
   - dN tables with optional item links on rows.
   - The Herbmaster migrates and the `classId === 6` code goes.
   - The sheet shows a collapsible "dN table"; print shows the table in full.
7. **Email through Amazon SES.** Blocked by: none. [07]
   - A mail repository and service with EN/PL templates, off when SES is unconfigured.
   - The setup is to be confirmed against roster.

## Independent

8. **GM tab for signed-out visitors.** Blocked by: none. [12]
   - The GM tab shows for everyone.
   - Signed-out visitors get the behind-the-glass page, with sign-up through Logto and `returnTo=/gm`.
   - The page is indexed.

## Parties and the class pool

9. **Party-aware join flows.** Blocked by: 1. [05]
   - The invite token reaches generation.
   - Every party character goes through the class screen (`ClassGate`).
   - Create and join happen in one transaction, and the pool is re-checked on confirm.
   - The server allows only Book Classes without a party.
10. **Party Class Pool on the GM page.** Blocked by: 9. [06]
    - The switchboard: skull switch, groups, filters that open their sections, search and language filter.
    - The Classless switch, the hover/focus info card, and the removed-class notice.

## The class creator

11. **Creator core.** Blocked by: 1, 3, 4, 10. [04, 17 caps, 19]
    - Identity, Stats & dice, Origins, Getting Better, and Test roll & save.
    - One language at a time, on-field validation, and Fix jumps.
    - FORGED, then My classes.
    - A cap of 50 classes per GM (`CUSTOM_CLASS_MAX_PER_GM`) and 10 saves a minute.
    - The class shows in the GM's pool and is rollable through the invite link.
12. **Creator: Abilities.** Blocked by: 2, 5, 11. [03, 04]
    - Fixed and random abilities, and the random count.
    - Modifiers, with the extended vocabulary (`test` and the "Tests" preset).
    - Collapsed cards, one open at a time.
13. **Creator: Class Items.** Blocked by: 12. [03, 04]
    - The gate question and all four item types.
    - One granter per item, with links both ways and "Forge a Class Item for this ability".
    - Changing an item's type.
    - Scoped items stay out of catalog search, and generation grants them.
14. **Creator: catalog grant search.** Blocked by: 13. [18]
    - Grants use `ItemAutocomplete` over the equipment search, filtered to the slot's types.
    - The class's own Class Items are pinned at the top.
15. **Creator: reference tables.** Blocked by: 6, 13. [03, 04]
    - The table die, and rows that can link a Class Item.
    - Pasting a list grows the table to fit.
16. **Creator: undo, keyboard and zine paste.** Blocked by: 13, 15. [04, 15]
    - Every change is undoable, and typed text gets one undo entry per field.
    - Focus is restored by field path, and Esc steps out.
    - The zine paste parser.
    - Meets wayfinder 15's 21 criteria.
17. **Creator: reordering.** Blocked by: 5, 13, 15. [16]
    - Grip drag, a Move menu and Alt+↑/↓ for abilities, Class Items, origins and table rows.
    - One undo per move.
18. **Draft autosave.** Blocked by: 11. [17]
    - `class_drafts` on the server, with a local safety net, saved 1s after the last edit.
    - A stale revision fails loudly.
    - Drafts are listed in My classes and expire after 90 days.
    - At most 3 new-class drafts per GM.
19. **Class Versions and archive.** Blocked by: 11, 18. [10, ADR 0001, 19]
    - A Save that will create a new version warns first.
    - An unplayed version is edited in place, and unreachable versions are pruned.
    - Deleting a played class archives it, with restore.
    - A former author's classes read "former GM".
    - The "older rules" chip on the party page.

## Showing and sharing classes

20. **Class rendering and the detail page.** Blocked by: 6, 13, 19. [20]
    - Attribution on the sheet, on the print page, and in the party card's tooltip.
    - The one-language note.
    - Print never truncates.
    - The read-only `/classes/:id` page.
21. **Getting Better from a Custom Class.** Blocked by: 4, 19. [09, 10]
    - Uses the latest version's rule, note and pool, matched by stable ability id.
22. **Publishing.** Blocked by: 10, 19, 20. [07, 00, 19]
    - The rights checkbox and terms link on first publish.
    - Public classes appear in the pool's search, with the "my classes only" and language filters.
    - Unpublishing shows the removed-class notice.
    - At most 5 classes published a day, and 10 publish or unpublish actions a minute.
23. **Reporting.** Blocked by: 7, 22. [07, 19]
    - Report links, and a `/report` page that works signed out.
    - The form, with its reasons and a good-faith checkbox.
    - A honeypot, 24h merging and 5 reports an hour.
    - Receipt emails.
24. **Moderation panel and takedowns.** Blocked by: 23. [07]
    - The allowlisted admin panel.
    - Dismiss, take down, remove content, restore, and hide for Built-in Classes.
    - The statement of reasons as a banner and an email.
    - The "Needs authority report" flag.
    - An append-only log, with reporters anonymised after 2 years.
    - The author is locked while a class is taken down.
25. **Disputes.** Blocked by: 24. [07, 19]
    - The dispute form, with a copy to `scvmrack-appeal@rpgtools.co`.
    - Up to 3 disputes per decision.

## Owlbear

26. **Room party pools.** Blocked by: 10. [11]
    - Unclaimed system parties show the default pool, read-only.
    - Claiming a room party keeps its pool.
    - Attaching a GM's party replaces an empty system party, or returns a 409 with a hint to claim instead.
27. **Roll from the room pool.** Blocked by: 9, 26. [13]
    - A popover picker with Random first.
    - One room-scoped create, join and bind.
    - A full-party message.
    - A room without a party rolls Book Classes only.
    - A guest's replace roll leaves and rejoins the party.
28. **Forge in a new tab.** Blocked by: 27. [13, 14]
    - The `/obr-open` bridge with `to=forge`.
    - The room pool in the class screen.
    - The panel refetches its binding on focus.
    - A different signed-in account fails loudly.

## Legal and release

29. **Terms and contact pages.** Blocked by: none (in practice, the lawyer's review). [21, 22 drafts]
    - `/terms`, with the Polish version binding, and `/legal`.
    - Footer links "Terms" and "Contact", and anchored sections.
    - A one-time banner when the terms change.
30. **Privacy notice page.** Blocked by: wayfinder ticket 23. [23]
    - `/privacy` in EN and PL, linked from the consent drawer and the footer.
31. **Release 0.7.0.** Blocked by: all of the above. [22]
    - en.json and pl.json in sync, and the FAQ entries.
    - The release notes and the ReleasePage card.
    - The `CLAUDE.md` security and env-var rows.
    - `CUSTOM_CLASS_MAX_PER_GM` and `PARTY_MAX_MEMBERS` passed through compose and Woodpecker.
    - The version bump and the `v0.7.0` tag.
