# Prepare the Custom Classes release: translations, release notes, FAQ

Type: task
Status: open
Blocked by: 04, 06, 07, 21

## Question

Work that must exist before Custom Classes ship, with nothing left to decide:

- **Translations**: every creator, GM-screen and moderation string in `frontend/src/i18n/en.json` and `pl.json`, kept in sync.
- **Release notes**, per `CLAUDE.md`'s Release Notes section:
  - a `release/<version>.md` and a row in `release/README.md`
  - a card on `ReleasePage.tsx` with `release.v<xyz>.*` keys in both languages
  - version bumps in `backend/package.json` and `frontend/package.json`
  - `changelog/backend.md` and `frontend.md` updated
- **FAQ and help**: entries on what Custom Classes are, who can make them, the party-only rule, how public sharing and reporting work, and the zine-author contact line.
- **Security notes**: add "Party Class Pool content" to the OBR room-access row of `CLAUDE.md`'s security table (ticket 11).
- **Env vars**: add `CUSTOM_CLASS_MAX_PER_GM` (default 50, ticket 19) to `CLAUDE.md`'s optional backend variables, next to `PARTY_MAX_MEMBERS`, and to the Woodpecker and compose config.
- **Legal pages** (ticket 21): draft `/terms` (EN and PL, the PL version doubling as the *regulamin*) for the owner's review and a lawyer's glance; build `/legal` with the contact points and operator name and email; add the footer links and the terms-change banner.

## Answer (specified and drafted 2026-10-01)

Most of this lands with the build, because the strings, routes and version don't exist yet. What can be settled now is settled here, and every piece of text that needs the owner's review is drafted in `drafts/`.

### Drafts for review

- [drafts/terms.en.md](../drafts/terms.en.md) and [drafts/terms.pl.md](../drafts/terms.pl.md): `/terms`, following ticket 21's outline.
  - The Polish version doubles as the UŚUDE Art. 8 *regulamin*, so it adds the technical requirements, contract conclusion and termination, and a complaints section.
  - `[OWNER]` marks points the decisions don't settle.
  - A lawyer's glance before public classes ship.
- [drafts/legal.md](../drafts/legal.md): `/legal`, the contact page in EN and PL.
  - The operator by name and email.
  - The DSA Art. 11/12 contact points and the TCO Art. 15 contact point.
  - Reporting and disputes.
  - The MÖRK BORG licence line.
- [drafts/faq.md](../drafts/faq.md): seven FAQ entries in EN and PL, under new `faq.*` keys:
  - what Custom Classes are
  - who can make them
  - party-only use
  - versions
  - publishing
  - reporting
  - the zine-author contact
- [drafts/release-0.7.0.md](../drafts/release-0.7.0.md): the release note, to update to what actually ships.

### Build checklist

1. **Translations.** Every new string goes into both `en.json` and `pl.json`, in sync, under these namespaces: `creator.*`, `classPool.*`, `classDetail.*` (the `/classes/:id` page), `moderation.*` (report form, statements of reasons, disputes, admin panel), `gmOverview.*`, `legal.*` and `faq.*`. The terms text itself is long-form, so it ships as one Markdown file per locale, rendered on `/terms`, rather than as hundreds of keys. The "last updated" date is read from the file.
2. **Release.** Follow `CLAUDE.md` § Release Notes:
   - bump `version` in `backend/package.json` and `frontend/package.json` (0.6.2 → **0.7.0**, a minor release for a new feature)
   - add `release/0.7.0.md` and a newest-first row in `release/README.md`
   - add a `ReleasePage.tsx` card with `release.v070.*` keys in both locales
   - add the Custom Classes, class pool, moderation and legal-page lines to `changelog/frontend.md` and `backend.md`
   - tag `v0.7.0`
3. **`CLAUDE.md` security table:**
   - **The OBR room access row** gets this text after "…read the room party roster via `POST /api/parties/promote`": ", and read that party's **Party Class Pool** (the Roll popover's class picker, ticket 13). Changing the pool still needs the owning GM; an unclaimed `system:obr-room` party rolls the read-only default pool (ticket 11)".
   - **A new row, "Custom Class content":**
     - class writes are owner-only
     - public classes are readable by everyone, unpublished ones only through pools that include them
     - takedown blocks publishing and saving
     - DSA notice-and-action: signed-out `/report`, human review, statements of reasons, disputes, and a "Needs authority report" flag for child-abuse material, threats and terrorist content
     - an append-only moderation log
     - reporter data anonymised after 2 years
     - rate limits keyed on shared-auth's `clientIp`
4. **Env vars:**
   - In `CLAUDE.md`, add to the optional backend variables, next to `PARTY_MAX_MEMBERS`: "`CUSTOM_CLASS_MAX_PER_GM` (Custom Classes per account, archived included; default 50, read once at startup by the class service)".
   - In `compose.prod.yaml`, add `CUSTOM_CLASS_MAX_PER_GM: ${CUSTOM_CLASS_MAX_PER_GM:-50}` to the backend `environment`. Today `PARTY_MAX_MEMBERS` isn't passed through at all, so setting it on the host does nothing. Add `PARTY_MAX_MEMBERS: ${PARTY_MAX_MEMBERS:-10}` in the same change.
   - In `.woodpecker/deploy.yaml`, add a plain `CUSTOM_CLASS_MAX_PER_GM: "50"` to the deploy step's environment. It isn't a secret, and a `from_secret` that isn't set would fail the step. Changing it is a one-line commit.
   - **SES:** add the mail settings from ticket 07 the same way, as Woodpecker secrets. Their names are *to confirm against roster*.
5. **Legal pages and links:**
   - `/terms` and `/legal` routes in the router.
   - Footer links "Terms" and "Contact" next to the privacy link, plus `/report`.
   - Links from the publish confirmation, the report form and every statement of reasons to the right `/terms` section. That needs stable heading anchors: `#publishing`, `#reporting`, `#moderation` and `#disputes`.
   - The one-time "Our terms changed" banner for signed-in users, keyed on the terms' date.
6. **FAQ:** add the seven entries from the draft to `FaqPage.tsx`, after "Can I have multiple characters?".
