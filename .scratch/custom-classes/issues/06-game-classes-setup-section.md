# How does the GM's `game classes setup` section work?

Type: prototype
Status: resolved

## Question

Prototype the GM-screen section: Book Classes selected by default (Zine and Rack Classes start off, decided in ticket 02), toggle any class on/off, an `Enable classless scvm` toggle (on by default, ticket 05), search, `my classes only` filter, public classes shown with their author, and the on-open check that notifies `class X has been removed by Y` when a pooled class was archived, unpublished or taken down.

Also prototype the read-only class detail page (`/classes/:id`, ticket 20) that pool entries, search results and report links open.

## Answer

Owner decision, 2026-09-27: the switchboard (variant B) as it stands after round 6 ("it is perfect"). Build it from [prototypes/game-classes-setup.html](../prototypes/game-classes-setup.html).

- **Place**: a "Classes this warband can roll" panel on the GM party page, after the members. The heading carries the pool tally: a big tilted numeral stamp with the count per source and "+ Classless".
- **Switch**: the owner's engraved skull, cut to its traced outline, is the thumb of a hard-edged track (after HeroUI's switch with icons).
  - Off: a grey skull, a cross, a dark track. On: a bone-white skull, a check, a yellow track. Locked: a dashed track.
  - `role="switch"`, toggled by Space or Enter.
  - The state change animates for 0.42s: the skull rolls, overshoots and settles while the track floods with colour. No motion under reduced motion.
  - **Confirm the skull's licence before shipping.**
- **Classless**: its own row with the same switch, above the groups; on by default (ticket 05).
- **Bar**: search with an icon; filters All / Book / Zine & Rack / My classes only / Public; language filter. Picking a filter opens the sections it shows. Sticky on desktop only.
- **Groups**: Book, Zine, Rack, My classes, Other GMs' public classes. Each header has a title, a one-line description and an "on" fraction (5/6), and is collapsible. Book and Mine start open.
- **Rows**:
  - the class name, which opens the read-only `/classes/:id` detail page (ticket 20)
  - a one-line blurb, the language chip and attribution
  - abilities and Class Items as numerals, the Getting Better rule, and "N scvm play it here"
  - off rows are dimmed
- **Info card on hover and keyboard focus**: a yellow title strip with the source, the blurb, abilities, Class Items, Getting Better, languages, version and who plays it here. On touch it opens on focus only.
- **Saving**: changes save at once, with a status line and a screen-reader announcement. Characters already playing a class keep it.
- **States**:
  - an empty-pool warning (no classes and Classless off)
  - a removed-class notice that can be dismissed
  - read-only for an unclaimed Owlbear room party (ticket 11)
  - an "older rules" chip on member cards (ticket 20)

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
- **Round 3**: the switch uses the owner's engraved skull (`prototypes/assets/skull.svg`, inlined once as an SVG `<symbol>`). It sits on a square stamp plate that slides along a bone track: a grey plate on a dim bone when off, a yellow plate outlined in black on a yellow bone when on. **Before shipping**, confirm the skull's licence (the owner's file came from openclipart / "OpenClipart-Vectors"; openclipart is public domain, Pixabay uses its own licence) and credit it if needed.
- **Round 4 (design pass)**: the section heading is a full Bebas title with the pool tally beside it as a big tilted numeral stamp (breakdown per source, plus Classless). Classless is its own row with the same switch, set above the groups. The group headers carry a large title and an "on" fraction (5/6). Each row shows its abilities and Class Items as numerals, its Getting Better rule and how many scvm play it here, and dims when off. The hover/focus card has a yellow title strip with a notch pointing at the name. The search field has an icon. When a switch turns on, the skull does a short stamp press (skipped under reduced motion).
- **Round 5 (owner)**: the switch now works like HeroUI's switch with icons. The owner's skull is the thumb, cut to its own outline: the outer silhouette was traced from the rendered engraving (`prototypes/assets/skull-outline.svg`: gaps closed, edge traced, simplified to 66 points) and the engraving sits on top of it. The thumb slides along a hard-edged track with a mark on each side. Off: a grey skull on the left, a cross on the right, a dark track. On: a bone-white skull on the right, a check on the left, a yellow track. Locked (unclaimed room): a dashed track and a dark skull, no marks. The bone track is gone.
- **Round 6 (owner: "perfect")**: the state change is animated (0.42s). The skull rolls along the track, tilting into the roll, overshoots, squashes as it lands and settles. The track floods with the new colour behind it and the skull turns bone-white (or back to grey). The old mark goes out first and the new one pops in last. Turning off plays it in reverse. There is no motion under reduced motion. Build note: animate from the previous state even when the component re-renders (a CSS transition alone won't play on a freshly mounted switch).
