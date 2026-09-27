# How do publishing, reporting and takedowns work?

Type: grilling
Status: resolved
Blocked by: 08

## Question

Decide publish/unpublish rules, report reasons (copyright: `I own this and don't want it on scvmrack`; abusive/illegal content), report form fields, what the admin panel shows and can do, takedown effects (hidden from search and other GMs' pools; existing characters keep it), whether the author is notified, and any duties surfaced by the legal research. Legal research changed one charting assumption: the report form must work for signed-out visitors and rightsholders without accounts (DSA Art. 16), and every takedown needs a statement of reasons to the author (Art. 17). Built-in Classes (Book/Zine/Rack) are reportable and hideable through the same flow, e.g. a zine author's removal request (ticket 02). Admin access is decided: allowlisted user ids via a Woodpecker secret -> env var.

## Answer

Grilled 2026-09-27, against ticket 08's legal findings.

- **Publishing**: only the owner, only a saved and valid class, and it goes public at once (ticket 00). The first publish shows a one-time confirmation:
  - a checkbox: "I made this class or have the right to share it"
  - a link to the terms (ticket 21)
  - a note that it goes public straight away

  Publishing is per class lineage; the public listing always shows the latest Class Version (ticket 10).
- **Where to report**: a "Report" link on every public class (search results, class detail, a character sheet's class section), plus a standalone `/report` page in the footer for rightsholders without an account or link. Both work signed out (DSA Art. 16).
- **Report form**:
  - **Reason:**
    - Copyright ("I own this and don't want it on scvmrack")
    - Child sexual abuse material
    - A threat to someone's life or safety
    - Terrorist content
    - Other illegal content
    - Abusive or hateful
    - Other
  - **Explanation:** required.
  - **The class:** prefilled, or pasted on `/report`.
  - **Name and email:** required, except optional for child-abuse material.
  - **Good-faith statement:** a required checkbox.

  A per-visitor rate limit applies (ticket 19).
- **Emails: Amazon SES**, wired the way roster (`Tackgnol/roster`) already does. *To confirm when that repo can be read in a session: credentials handling, region and sender setup.* Proposed:
  - The SES settings arrive as Woodpecker secrets into backend env vars. Email is off when they're missing, as feedback is today.
  - Mail goes from `scvmrack@rpgtools.co` with Reply-To `contact@rpgtools.co`.
  - A `mail` repository is the only code that touches SES (per `CLAUDE.md` layering). A mail service owns the EN/PL templates:
    - the reporter's receipt (sent automatically)
    - the decision
    - the author's statement of reasons
    - the dispute copy
- **Telling the author** (DSA Art. 17): on every takedown, a banner on the class in "My classes" and in the creator shows the statement of reasons (the rule broken, what was done, how to contest). The same text is emailed to the account's Logto email.
- **Disputes**:
  - A "Dispute this decision" button on the banner opens a short form. The dispute lands in the admin panel next to the original report, and SES sends a copy to `scvmrack-appeal@rpgtools.co`.
  - The statement of reasons also names `scvmrack-appeal@rpgtools.co` for anyone without an account.
  - There's no formal complaint system; small providers are exempt from Art. 20.
- **Admin panel** (admins are the allowlisted user ids from ticket 00):
  - **Reports:** open reports newest first, grouped per class, with the reporter's text and contact, and disputes shown next to their report.
  - **Preview:** the class's latest version, with links to older versions.
  - **Actions:**
    - **Dismiss** (a reason goes to the reporter)
    - **Take down** (a reason category plus free text, which becomes the statement of reasons)
    - **Remove content**
    - **Restore**
    - **Hide** for Built-in Classes (for example a zine author's removal request)
  - **Moderation log:** every action (who, when, what, why), which can't be edited.
- **Serious reports are flagged, the owner handles the rest**: child-abuse material, threats and terrorist content get a red "Needs authority report" flag at the top of the panel and are never auto-dismissed. Reporting to the police or prosecutor, and acting on authority removal orders, is done by the owner by hand. There's no runbook beyond the flag.
- **Two levels of takedown**:
  - **Take down:** hidden from search, pickers and every pool including the author's, and new rolls stop. Existing characters keep the content.
  - **Remove content:** additionally replaces the class text with "[removed by moderation]" on every sheet and every version. It's for illegal content and authority orders, such as 1-hour terrorist-content removal orders. The original text stays in the moderation log as evidence.
- **The author after a takedown**: the class and its characters stay visible to them, but they can't republish or save edits until an admin restores it. Drafts become read-only and can only be discarded (ticket 17). Appeals go through the dispute form or `scvmrack-appeal@rpgtools.co`.
- **Retention**:
  - The moderation log and hidden or removed content are kept forever.
  - Reporters' names, emails and identifying free text are anonymised 2 years after a report is resolved; the report stays, marked "reporter details removed" (GDPR storage limitation).
