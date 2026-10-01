# What must the privacy notice say once Custom Classes and reporting ship?

Type: task
Status: open
Blocked by: 07, 21

## Question

Found while drafting ticket 22's legal pages. Today's privacy notice is the "Blood Oath" consent drawer: browser storage, backend storage of game content, and Google Analytics consent. It has none of the GDPR Art. 13 information. Custom Classes add new personal data:

- reporters' names and emails (ticket 07)
- emails sent through Amazon SES
- authors' names shown on public classes
- a moderation log kept forever, with reporter details anonymised after 2 years

The terms (`drafts/terms.*.md` §15) link to `/privacy`. The owner chose a separate ticket for it (2026-10-01). Draft a `/privacy` page in EN and PL, Polish binding as for the terms, covering:

- **the controller**: the operator as on `/legal`, with contact@rpgtools.co
- **what is collected and why, with the legal basis for each**:
  - accounts through Logto
  - guest sessions
  - characters and Custom Classes
  - public authorship
  - reports and disputes
  - moderation records
  - SES email
  - error monitoring (GlitchTip)
  - Google Analytics (consent)
- **retention**:
  - guest characters 7 days
  - drafts 90 days
  - reporter details 2 years
  - the moderation log kept forever (legal obligation and claims)
  - account data until removal
- **recipients and processors**: hosting, Logto, Amazon SES, GlitchTip and Google Analytics, with any transfers outside the EEA
- **rights**: access, rectification, erasure, restriction, objection, portability, withdrawing consent, and complaining to the Polish DPA (PUODO)
- **how the consent drawer and `/privacy` relate**: the drawer keeps the analytics choice and links here

Check every processor and region against the real deployment, plus the SES region from roster (ticket 07), before the text goes to the lawyer with the terms.
