# How does the Scum-style Getting Better rule become a class setting shared by Book and Custom Classes?

Type: grilling
Status: resolved
Blocked by: 01, 02

## Question

Getting Better is universal today except Gutterborn Scum's specialty rule, hardcoded by `GUTTERBORN_SCUM_CLASS_ID`. Decide the class setting (menu: book default / also gain a random class ability you don't have yet, plus an optional free-text rules note) and how Gutterborn Scum is migrated onto it, leaving room for richer rules later.

## Answer

Grilled 2026-09-27.

- **The setting**: every class (Book and Custom) has one `getting_better_rule`, plus an optional per-language rules note. The creator's Getting Better step offers all three rules as one segmented choice:
  - `book`: the book rules (HP, ability scores, debris), as today.
  - `book_plus_ability`: book rules, plus every improvement rolls one random ability from the class's pool that the scvm doesn't hold, while any remain. The ability brings its Class Item or pet grants, as if rolled at creation. The draft shows it as its own section that can be rerolled.
  - `specialist`: book rules, plus the scvm's random abilities from its class count as its **specialties**:
    - The first improvement adds one more distinct random ability.
    - Every later improvement shows a **Keep / Reroll** toggle per specialty (default Keep). A rerolled specialty is replaced by a random pool ability the scvm doesn't hold.
    - Fixed abilities are never offered.
- **Specialist generalises Gutterborn Scum** to any number of random abilities (N at creation, N+1 after the first improvement). For N = 1 it gives exactly Scum's four outcomes. The option is named "Specialist", never after the Scum. It needs a random pool at least one larger than each scvm rolls: the creator disables the option below that, with a hint. At improvement time, a reroll with no free ability left (after a new version) shows disabled instead of failing.
- **Grants**: a newly gained ability brings its grants. Rerolling an ability away never takes back items or pets already received.
- **Rules note**: shown at the top of the character's Getting Better dialog and in the class detail, in the viewer's language. It's text only.
- **Versions** (ticket 10): Getting Better uses the latest Class Version's rule, note and random pool, excluding abilities the scvm holds (matched by stable ability id).
- **Migration**:
  - One migration sets `specialist` for Gutterborn Scum (class 2) and `book` for the other Book Classes.
  - Code checks the rule, not the id: `GUTTERBORN_SCUM_CLASS_ID` and `isGutterbornScum` go, and the Scum names in `getting-better*.ts` become neutral "specialties".
  - In-progress improvement drafts saved in the old two-slot shape (`primary` / `secondary` / `rerollMode`) are converted to per-specialty toggles as they load. No data migration.
- **Prototype**: the creator's Getting Better step now offers Book rules / + a new ability / Specialist, and warns when the pool is too small (`prototypes/class-creator-b-polished.html`).
