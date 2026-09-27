# What happens when a used Custom Class is edited, archived or unpublished?

Type: grilling
Status: resolved

## Question

Decided: a Custom Class locks once any character uses it; editing means duplicating; deleting archives. Decide what counts as `used` (saved characters only, or drafts too), whether anything stays editable after lock (e.g. typo fixes), how archived/unpublished classes behave in pools and search, and what `created by {name}` shows if the author's account is gone.

## Answer

Grilled 2026-09-27. The charting decision "locks once used, duplicate to change" is **replaced by versioning** (ADR 0001). The charting promise stands: existing characters never break.

- **Why not a lock**: a character stores only keys, and every sheet load resolves names, rules text, item stats and modifiers live from the class (`get-character-full.ts`, ticket 02's `translations` keys and scoped catalog rows). Protecting existing sheets therefore needs either a lock or versions. The owner chose versions, so GMs never meet a lock.
- **Class Versions**: a Custom Class is a lineage of immutable Class Versions. `Character.classId` points at the exact version the character was rolled with. A version nobody plays is edited in place. Once any character plays the current version, the next **Save** of an edit creates a new version.
  - **The creator must say so, clearly (owner: "it is vital")**: when a GM opens or saves an edit to a class that characters already play, the creator states it before Save. For example: "3 scvm play this class. Saving creates version 4: they keep version 3; new rolls use version 4."
- **Drafts**: autosave never creates versions. Editing a used class works on a draft; only an explicit Save mints the version (ticket 17).
- **Characters never move to a newer version**, automatically or by GM action (a possible later follow-up, not in scope).
- **Pools and public classes follow the latest version**: a Party Class Pool points at the lineage, so new rolls always use the latest version, including other GMs' pools of a Public Custom Class.
- **Getting Better** ("+ a new ability") draws from the latest version's pool, excluding abilities the character already holds. Abilities keep a stable id across versions so this match works.
- **Delete**: a class with no character on any version is truly deleted. A used class is **archived** as a lineage:
  - It leaves search, pickers and every pool, with ticket 06's "class X has been removed by Y" notice.
  - It sits under an "Archived" filter in the author's list.
  - Existing characters keep their versions.
  - The author can restore it, unless an admin took it down.
- **Unpublish** (public → private): it leaves other GMs' search and pools (with the notice), stays in the author's own pools, and existing characters keep playing it.
- **Hidden classes**: archived, unpublished and taken-down classes appear only on characters that already play them, with the same attribution, and in the author's own list under their status. Never in search, pickers or pools.
- **Author account gone**: the class and all its versions stay, the owner is set to null, attribution reads "created by a former GM", and the class auto-archives so nobody new can roll it. The app has no account deletion today; this covers removal through Logto or an admin.
