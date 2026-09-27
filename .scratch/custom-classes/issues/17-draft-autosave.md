# How do class creator drafts autosave and come back?

Type: grilling
Status: resolved
Blocked by: 02, 10

## Question

Settled by ticket 10: autosave never creates Class Versions. Editing a used class works on a draft, and only an explicit Save mints a new version.

The owner wants draft autosave (decided 2026-09-27): a GM who is interrupted mid-forge, closes the tab or switches device must not lose the class. Decide:

- **Where drafts live**: server-side per GM account (works across devices; needs a table or a `status = draft` class row), browser storage (no backend, but lost with the device), or both.
- **When it saves**: debounced after edits (the sheet's patch queue pattern in `useCharacterEditor`), on step change, on leaving the page; and how the UI shows "Draft saved" / "Saving…" / "Offline, will retry".
- **How many drafts**: one draft per GM, or one per class being edited; the cap (ticket 03 caps lists, not drafts).
- **Coming back**: where drafts show (the class list from ticket 04's "Go to my classes"), resume versus discard, and what happens when two tabs or devices edit the same draft.
- **Drafts and the rest of the effort**: a draft never enters a Party Class Pool, never appears in search or public listings, and never creates a Class Version (ticket 10); what Save does to a draft: it becomes a new class, updates an unplayed version in place, or mints a new version of a played one.
- **Limits and cleanup**: drafts expire after a period of inactivity or live until discarded, and the abuse limits still open on the map.

## Answer

Grilled 2026-09-27.

- **Where drafts live: the server, with a local safety net.** The server holds each draft per GM account. A local copy covers a dropped connection until it syncs; a sync is an ordinary save and goes through the conflict check below.
- **Storage: a separate `class_drafts` table**, one JSON document per draft: owner, the class lineage it edits (null for a new class), payload, revision and `updated_at`. Drafts never touch `translations`, `abilities` or the catalog tables, so nothing half-made reaches search, pools or item lookups. Save validates the payload and writes the class rows in one transaction:
  - a new class
  - an unplayed version updated in place
  - or a new Class Version of a played class (ticket 10)
- **How many**: one draft per class being edited, plus up to 3 drafts of new classes per GM (feeds ticket 19).
- **When it saves**: 1 second after the last edit (the sheet's `useCharacterEditor` pattern), on every step change, and when the tab closes. A quiet status near the step title reads "Draft saved", "Saving…" or "Offline, will retry".
- **Coming back**:
  - "My classes" lists drafts first, each with Resume and Discard.
  - Opening a class with a draft resumes it, with a banner like "Unsaved changes from 2 days ago. Resume or discard?".
  - Discard asks for confirmation.
- **Two tabs or devices: fail fast and loud (owner).** Every draft carries a revision. A save against a stale revision is refused, never merged or silently overwritten. The GM sees "This draft changed on another device", with **Load the newer one** (default) or **Keep mine** (overwrite).
- **Drafts may be invalid.** Only Save validates, with the existing Fix list.
- **Undo history** belongs to the editing session; resuming a draft starts a fresh history.
- **Expiry**: drafts untouched for 90 days are deleted. It must be visible in the UI (owner):
  - The creator's status reads "Draft saved · kept 90 days after your last edit". On phones it sits in the collapsed status and shows when tapped.
  - Each "My classes" draft row shows its last-edited date, and a pink "Expires in N days" once fewer than 14 remain.
- **Archived or taken-down classes**:
  - A draft of a class its author archived stays, but Save is blocked until the class is restored ("This class is archived. Restore it to save these changes.").
  - A draft of a class an admin took down becomes read-only and can only be discarded; the banner points to the takedown reason (ticket 07).
- **Autosave never creates Class Versions** (ticket 10).
