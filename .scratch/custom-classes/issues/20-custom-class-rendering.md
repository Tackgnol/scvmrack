# How does Custom Class content show on the sheet, print page, party page and Owlbear?

Type: grilling
Status: resolved
Blocked by: 02, 03

## Question

A character playing a Custom Class must render everywhere a Book Class does today. Decide, surface by surface (the character sheet, the print/PDF page, the party page and GM screen, the Owlbear sheet and room cards):

- **Attribution**: where "created by {name}" (Custom) and "from {work} by {author}" (Zine/Rack Credit) appear, and how an archived, unpublished or taken-down class reads (ticket 10, ticket 07).
- **Class content**: the class description, abilities with rules text, reference tables, Getting Better note, and Class Items with their descriptions. The same components as Book Classes, or class-specific blocks.
- **Language**: the fallback when the viewer's language is missing from a one-language class (ticket 02's authored-language fallback), and whether the sheet says so.
- **Print**: long rules text and reference tables on the A4 page; what gets cut or moved to a second page.
- **Owlbear**: what the room card and the in-room sheet show given the room-trust model in `CLAUDE.md`.

## Answer

Grilled 2026-09-27, against where the class shows today:
- the sheet's `CharacterClassSummary` (label, name, description)
- the print page (class name, abilities, origin)
- the party page's `warbandMember.ts` (class name only)
- Owlbear room cards (class name only)

- **Attribution**: "created by {name}" (Custom) or "from {work} by {author}" (Zine and Rack Credit); Book Classes show none. It appears:
  - on the sheet, under the class name
  - on the print page, small, under the class name
  - on the party page, in the member card's class tooltip, not the card itself
  - on Owlbear, only on the in-room sheet (as on the web), never on room cards
- **Hidden classes look normal**: archived, unpublished and taken-down classes look like any class on a character's sheet. The one exception is ticket 07's **Remove content**: the removed text reads "[removed by moderation]", and the class summary adds one line, "Some of this class's text was removed by moderation."
- **Versions are for GMs, not players**: nothing on the sheet or print page. On the party page, a member whose Class Version isn't the latest gets a small "older rules" chip, with a tooltip like "Rolled with version 3; the class is now on version 5".
- **Same components as Book Classes** for abilities, rules text and Class Items. A reference table sits under its ability as a collapsible "dN table", closed by default on the sheet and fully printed on paper. The Herbmaster's table renders the same way once migrated (ticket 03).
- **One-language classes**: text falls back to the authored language (ticket 02), and the class summary carries one note ("This class is written in English"). No per-field marks.
- **Print never truncates**: long rules text and reference tables flow onto a second A4 page.
- **Class detail page**: a read-only `/classes/:id` showing the class's latest version (attribution, abilities, Class Items, origins, Getting Better rule). It's for public classes, the owner's own classes, and party link-holders. Report links and search results point at it (ticket 07). The sheet's class name links to it only when the viewer may see the class; the sheet itself always shows the character's own version inline. Prototype it with ticket 06.
