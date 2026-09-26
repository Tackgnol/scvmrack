# Map: Custom classes

Labels: wayfinder:map

## Destination

An implementation-ready spec for GM-authored Custom Classes (creator, Party Class Pool, public sharing with moderation) that `/to-tickets` can slice into build tickets.

## Notes

- **Tracker exception**: this repo tracks work in Linear (`docs/agents/issue-tracker.md`), but this effort's map lives in-repo under `.scratch/custom-classes/` using the local-markdown wayfinding conventions, because there are no Linear issues to spare. Ticket files: `issues/NN-<slug>.md` with `Type:`, `Status:` and `Blocked by:` lines.
- **Branch**: `wayfinder/custom-classes`, no PR until the spec is ready.
- **Domain**: MÖRK BORG character sheet. Read `CONTEXT.md` first and use its terms (Book Class, Custom Class, Class Item, Party Class Pool).
- **Skills**: grilling tickets use `grilling` + `domain-modeling`; research findings go in `docs/superpowers/research/`.
- **Standing preferences**: book parity is the bar for the creator; join screens stay unchanged; never break an existing character sheet; follow the Repository -> Service -> Controller layering in `CLAUDE.md`.
- **Git**: commit as the repo's configured user; never add Co-Authored-By or any Claude attribution to commits or PRs.

## Decisions so far

- [What did charting settle about custom classes?](issues/00-charting-decisions.md): destination is a spec; GM-owned classes with optional public sharing and moderation; full Book Class parity incl. Class Items; party-only, same join screens; lock-on-use with archive.
- [What must a Custom Class be able to express to match every Book Class?](issues/01-book-class-parity-audit.md): six Book Classes; parity needs per-class stat dice and omens, a real grant model (item/pet per ability, not name maps or array positions), class-scoped Class Items hidden from catalog search, and generalising the Scum/Herbmaster class-id special cases.

## Not yet specified

- **Abuse limits**: caps on classes per GM, text lengths, rate limits for publishing and reporting.
- **Rendering everywhere**: how Custom Class content and `created by {name}` appear on the print page, the Owlbear sheet and the party page.
- **Book Classes on the same model**: whether Book Classes migrate onto the Custom Class model (depends on the data model decision).
- **Release plumbing**: creator UI i18n (EN/PL), release notes, FAQ entries.

## Out of scope

- Custom Classes for characters outside parties, or re-rolling existing characters that join a party.
- Overriding or extending the shared flavour tables (body, habits, tales, traits, names).
- Machine translation of Custom Class text.
- Class Items entering the shared equipment catalog.
- Getting Better rules beyond the fixed menu (revisit only on user demand, as a fresh effort).
