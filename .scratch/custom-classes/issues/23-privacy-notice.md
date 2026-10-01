# What must the privacy notice say once Custom Classes and reporting ship?

Type: task
Status: resolved
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

## Answer (drafted 2026-10-01)

- **Drafts**: [drafts/privacy.pl.md](../drafts/privacy.pl.md), which binds, and [drafts/privacy.en.md](../drafts/privacy.en.md). They cover:
  - the controller (as on `/legal`)
  - every processing purpose with its GDPR basis
  - browser storage
  - retention
  - processors and transfers
  - rights and the PUODO complaint
  - age
  - changes
- **Processors checked against the deployment**:
  - Cloudflare fronts all traffic.
  - Logto is at `auth.rpgtools.co`.
  - GlitchTip is self-hosted and reached through `/api/tunnel`, with no client IP.
  - GA4 loads only after consent.
  - Google Fonts are loaded from Google on every page.
  - Amazon SES is planned (ticket 07).
- **Marked `[CONFIRM]`, not readable from this repo**:
  - the hosting provider and country
  - whether Logto is self-hosted or cloud
  - the SES region (roster couldn't be read)
  - the guest 7-day deletion job
  - retention for expired sessions, GlitchTip, GA4 and access logs
  - whether Cloudflare Web Analytics is on
- **The consent drawer and `/privacy`**: the drawer keeps only the analytics choice and links to `/privacy`.
- **Found, left for the owner (`[OWNER]` in the drafts)**:
  - the analytics switch defaults to ON, which isn't valid consent; default it to OFF
  - Google Fonts load without consent; self-host them
  - whether a copyright reporter's identity goes to the class author
  - how long emails to contact@ and scvmrack-appeal@ are kept
- **Legal review and cover memo**:
  - [drafts/legal-review.md](../drafts/legal-review.md): GDPR, DSA, TCO, IP and UŚUDE findings, with fixes applied to the terms
  - [drafts/counsel-memo.md](../drafts/counsel-memo.md): PL with an English summary, 10 questions for counsel
  - [drafts/review-pack.md](../drafts/review-pack.md): everything in one document for the lawyer
