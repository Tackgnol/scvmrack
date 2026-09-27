# How does the GM's `game classes setup` section work?

Type: prototype
Status: open

## Question

Prototype the GM-screen section: Book Classes selected by default (Zine and Rack Classes start off, decided in ticket 02), toggle any class on/off, an `Enable classless scvm` toggle (on by default, ticket 05), search, `my classes only` filter, public classes shown with their author, and the on-open check that notifies `class X has been removed by Y` when a pooled class was archived, unpublished or taken down.

Also prototype the read-only class detail page (`/classes/:id`, ticket 20) that pool entries, search results and report links open.

## Assets

- Prototype: [prototypes/game-classes-setup.html](../prototypes/game-classes-setup.html), a single file mimicking the GM party page (`PartyPage.tsx`), with the new "Classes this warband can roll" panel after the members.
- **Round 1 (2026-09-27)**: three variants: A pool + rack, B switchboard, C card hand. **The owner picked B**, asking for:
  - a switch that doesn't look like pixel art (a MÖRK BORG bone and skull)
  - info on hover
  - use of the spare row space
  - filters that open their sections
- **Round 2**: B only.
  - **The bone-and-skull switch** (`role="switch"`): the skull slides along a bone. Off: a dim bone with a grey skull. On: a yellow bone with a black skull and glowing sockets.
  - **Richer rows**: a one-line blurb, then on the right the class's shape (abilities, Class Items, Getting Better) and "N scvm play it here".
  - **A hover-and-focus info card**: abilities, Class Items, Getting Better, languages, version, who plays it here, and attribution. On touch it opens on focus.
  - **A pool summary line**: "7 classes on", counts per source, "+ Classless".
  - **Filters open their sections**: Book → Book; Zine & Rack → both; My classes only → Mine; Public → Public.
  - **Group descriptions** under each heading.
  - **Unchanged**: search, the classless switch, the removed-class notice, the empty-pool warning, the read-only unclaimed-room state, the "older rules" chip and the class detail page.
