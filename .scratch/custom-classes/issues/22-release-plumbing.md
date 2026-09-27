# Prepare the Custom Classes release: translations, release notes, FAQ

Type: task
Status: open
Blocked by: 04, 06, 07

## Question

Work that must exist before Custom Classes ship, with nothing left to decide:

- **Translations**: every creator, GM-screen and moderation string in `frontend/src/i18n/en.json` and `pl.json`, kept in sync.
- **Release notes**, per `CLAUDE.md`'s Release Notes section:
  - a `release/<version>.md` and a row in `release/README.md`
  - a card on `ReleasePage.tsx` with `release.v<xyz>.*` keys in both languages
  - version bumps in `backend/package.json` and `frontend/package.json`
  - `changelog/backend.md` and `frontend.md` updated
- **FAQ and help**: entries on what Custom Classes are, who can make them, the party-only rule, how public sharing and reporting work, and the zine-author contact line.
