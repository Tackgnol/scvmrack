# How does the GM's `game classes setup` section work?

Type: prototype
Status: open

## Question

Prototype the GM-screen section: Book Classes selected by default (Zine and Rack Classes start off, decided in ticket 02), toggle any class on/off, an `Enable classless scvm` toggle (on by default, ticket 05), search, `my classes only` filter, public classes shown with their author, and the on-open check that notifies `class X has been removed by Y` when a pooled class was archived, unpublished or taken down.

Also prototype the read-only class detail page (`/classes/:id`, ticket 20) that pool entries, search results and report links open.

## Assets

- Prototype: [prototypes/game-classes-setup.html](../prototypes/game-classes-setup.html), a single file mimicking the GM party page (`PartyPage.tsx`), with the new Classes panel after the members. Three variants via `?variant=a|b|c` and a bottom bar:
  - **A · pool + rack**: this warband's pool beside a searchable rack, with Add and Remove.
  - **B · switchboard**: every class in collapsible groups (Book, Zine, Rack, Mine, Public), each with a switch and an "N of M on" count, under a sticky search.
  - **C · hand**: the pool as a hand of cards, with the rack in a "Draw from the rack" drawer.
- **Shared by all three**:
  - the classless switch
  - search, source filters including "My classes only", and a language filter with EN/PL badges
  - attribution
  - the "class X has been removed by Y" notice
  - the empty-pool warning
  - a read-only unclaimed-room state (ticket 11)
  - an "older rules" member chip (ticket 20)
  - a class detail page (ticket 20) opened from any class name
