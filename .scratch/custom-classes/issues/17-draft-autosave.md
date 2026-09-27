# How do class creator drafts autosave and come back?

Type: grilling
Status: open
Blocked by: 02, 10

## Question

The owner wants draft autosave (decided 2026-09-27): a GM who is interrupted mid-forge, closes the tab or switches device must not lose the class. Decide:

- **Where drafts live**: server-side per GM account (works across devices; needs a table or a `status = draft` class row), browser storage (no backend, but lost with the device), or both.
- **When it saves**: debounced after edits (the sheet's patch queue pattern in `useCharacterEditor`), on step change, on leaving the page; and how the UI shows "Draft saved" / "Saving…" / "Offline, will retry".
- **How many drafts**: one draft per GM, or one per class being edited; the cap (ticket 03 caps lists, not drafts).
- **Coming back**: where drafts show (the class list from ticket 04's "Go to my classes"), resume versus discard, and what happens when two tabs or devices edit the same draft.
- **Drafts and the rest of the effort**: a draft never enters a Party Class Pool, never appears in search or public listings, and never counts as `used` for locking (ticket 10); what Save does to a draft (turns it into the class, or updates the class it came from).
- **Limits and cleanup**: drafts expire after a period of inactivity or live until discarded, and the abuse limits still open on the map.
