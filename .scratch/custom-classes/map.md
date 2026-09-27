# Map: Custom classes

Labels: wayfinder:map

## Destination

An implementation-ready spec for GM-authored Custom Classes (creator, Party Class Pool, public sharing with moderation) that `/to-tickets` can slice into build tickets.

## Notes

- **Tracker exception**: this repo tracks work in Linear (`docs/agents/issue-tracker.md`), but this effort's map lives in-repo under `.scratch/custom-classes/` using the local-markdown wayfinding conventions, because there are no Linear issues to spare. Ticket files: `issues/NN-<slug>.md` with `Type:`, `Status:` and `Blocked by:` lines.
- **Branch**: `wayfinder/custom-classes`, no PR until the spec is ready.
- **Domain**: MÖRK BORG character sheet. Read `CONTEXT.md` first and use its terms (Built-in/Book/Zine/Rack Class, Custom Class, Credit, Class Item, Party Class Pool).
- **Skills**: grilling tickets use `grilling` + `domain-modeling`; research findings go in `docs/superpowers/research/`.
- **Standing preferences**: book parity is the bar for the creator; join screens stay unchanged; never break an existing character sheet; follow the Repository -> Service -> Controller layering in `CLAUDE.md`.
- **Git**: commit as the repo's configured user; never add Co-Authored-By or any Claude attribution to commits or PRs.

## Decisions so far

- [What did charting settle about custom classes?](issues/00-charting-decisions.md): destination is a spec; GM-owned classes with optional public sharing and moderation; full Book Class parity incl. Class Items; party-only, same join screens; versioned (ticket 10) with archive.
- [What must a Custom Class be able to express to match every Book Class?](issues/01-book-class-parity-audit.md): six Book Classes; parity needs per-class stat dice and omens, a real grant model (item/pet per ability, not name maps or array positions), class-scoped Class Items hidden from catalog search, and generalising the Scum/Herbmaster class-id special cases.
- [What must a small EU-hosted hobby site do when hosting user-published content?](issues/08-ugc-legal-obligations.md): public classes make scvmrack a DSA hosting platform (micro-exempt from Arts. 15, 20-28); must have an Art. 16 report form open to signed-out users, Art. 17 statements of reasons to authors, contact points and terms, and Art. 18 / Penal Code Art. 240 reporting to police; keep classes text-only.
- [Where do Custom Classes, their abilities, origins and Class Items live, and how does a character point at one?](issues/02-custom-class-data-model.md): one `classes` table with a `source` enum (main_book/zine/the_rack/user) plus Credit; text in namespaced `translations` with authored-language fallback; explicit grant columns (Book Classes migrated); scoped Class Items in the catalog tables; per-stat dice + omen die, Book omen values fixed as part of done.
- [What does a GM fill in to author an ability and each kind of Class Item?](issues/03-ability-and-class-item-authoring.md): fixed/random abilities (roll N of M), one item + one pet grant per ability, reused and extended sheet modifier component (adds `test` etc.), full-parity Class Item fields, dN reference tables (Herbmaster migrates), caps of 20 per list and 1500 chars per field.
- [How do the join roll/forge flows roll from the Party Class Pool without changing their screens?](issues/05-party-aware-generation.md): invite token carries the party; no token means Book Classes only; every party character goes through the class screen (no blind roll); create + join in one transaction; pool re-checked on confirm; classless is a GM toggle; Owlbear split out.
- [How should the class creator look and flow?](issues/04-class-creator-ux.md): variant B, a seven-step Forge flow with a status rail, one-language-at-a-time switch with missing counts, on-field validation plus Fix jumps, and a test roll on the final step; polished with impeccable.
- [How does a GM find a catalog item or pet to grant?](issues/18-catalog-grant-search.md): the main page's fuzzy item search (`ItemAutocomplete` over `/api/equipment/search`), filtered to the slot's types, with the class's own Class Items pinned above results; Zine and Rack items are not grantable.
- [What happens when a used Custom Class is edited, archived or unpublished?](issues/10-class-locking-and-archiving.md): versioning replaces the lock (ADR 0001). Characters keep the Class Version they were rolled with, the creator tells the GM before a save creates a version, pools follow the latest, and delete archives a used lineage.
- [How do class creator drafts autosave and come back?](issues/17-draft-autosave.md): server-side `class_drafts` JSON documents with a local safety net; 1s debounced saves; one draft per class plus 3 new-class drafts; stale-revision saves fail loudly with load-newer or keep-mine; 90-day expiry shown in the UI.
- [How do publishing, reporting and takedowns work?](issues/07-public-sharing-and-moderation.md): owner publishes with a rights checkbox; anyone can report (signed out, `/report`); SES emails (wired as in roster); statement of reasons with an in-app dispute and scvmrack-appeal@rpgtools.co; admin panel with a moderation log; take down vs remove content; serious reports flagged for the owner; log kept forever, reporter data anonymised after 2 years.
- [How does the Scum-style Getting Better rule become a class setting shared by Book and Custom Classes?](issues/09-getting-better-class-setting.md): one `getting_better_rule` per class (Book rules / + a new ability / Specialist) plus a rules note; Specialist generalises Gutterborn Scum to N specialties with per-specialty Keep/Reroll; Scum migrates to it and the hardcoded id goes.
- [Which Party Class Pool does an Owlbear room party owned by `system:obr-room` use?](issues/11-obr-room-party-pools.md): the default pool, read-only until a GM claims it; claiming keeps it as the start; attaching a GM's party replaces an empty system party (409 with a claim hint if players joined); pool content falls under the accepted room-trust residual.
- [How do Owlbear's Roll and Forge use the room's Party Class Pool?](issues/13-obr-roll-and-forge-from-room-pool.md): Roll gets a compact in-popover class picker (Random first); one room-scoped endpoint creates, joins and binds in a transaction; no-party rooms roll Book Classes; a full party creates nothing; Forge carries the room and player in its URL. Build together with ticket 05.
- [How does Owlbear's Forge keep the player's identity in the new tab?](issues/14-obr-forge-new-tab-identity.md): reuse the shipped RPG-68 `/obr-open` bridge with a `to=forge` destination; the panel refreshes its binding on focus; a different signed-in account fails loud; existing failure screens reused.
- [How does Custom Class content show on the sheet, print page, party page and Owlbear?](issues/20-custom-class-rendering.md): attribution on the sheet and print page (a tooltip on party cards, none on room cards); hidden classes look normal except removed text; an "older rules" chip for GMs only; same components with collapsible tables; print never truncates; a read-only `/classes/:id` detail page.

## Not yet specified

- **Abuse limits**: ticket 19.
- **Rendering everywhere**: ticket 20.
- **Legal pages**: ticket 21.
- **Release plumbing**: ticket 22.

## Out of scope

- Zine/Rack Classes for solo players outside parties (a future toggle, not this effort).
- Custom Classes for characters outside parties, or re-rolling existing characters that join a party.
- Overriding or extending the shared flavour tables (body, habits, tales, traits, names).
- Machine translation of Custom Class text.
- Class Items entering the shared equipment catalog.
- Authoring or promoting Built-in Classes (Book/Zine/Rack) in-app; they are seeded via SQL. Zine authors are pointed to contact@rpgtools.co instead, and Custom Classes never carry a zine Credit.
- Starting a Custom Class from an existing class (owner decision, 2026-09-27).
- Getting Better rules beyond the three-option menu (Book rules / + a new ability / Specialist; revisit only on user demand, as a fresh effort).
