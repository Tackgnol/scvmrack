# How does a GM find a catalog item or pet to grant?

Type: grilling
Status: open
Blocked by: 03

## Question

An ability can grant one item and one pet: this class's own Class Items, or any unscoped catalog entry, including Book Class items like the Brown Scimitar (ticket 03). The prototype fakes the catalog with 3 entries in a native `<select>`. The real catalog has about 106 entries (31 weapons, 7 armors, 61 equipment, 7 pets), and the backend already has a fuzzy trigram search at `GET /api/equipment/search`. Decide:

- **The control**: a searchable combobox reusing the sheet's item search, or a picker dialog with type filters; how it shows each result's stats so a GM can tell two swords apart.
- **What is searchable**: every unscoped catalog entry, or only the types the slot takes (item slot: weapon/armor/equipment; pet slot: pets). Other Custom Classes' Class Items never appear. Zine and Rack Class items: can a GM grant them?
- **Language**: search in the GM's language only, or both English and Polish names.
- **Own Class Items**: shown in the same search, pinned above catalog results, or kept in a separate list.
- **Keyboard and undo**: the control follows the creator's rules (arrows move without committing, Enter picks, Esc steps out, one undoable change per pick).
