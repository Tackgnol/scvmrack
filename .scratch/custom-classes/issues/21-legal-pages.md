# What terms, contact points and operator details must the site publish before public classes ship?

Type: grilling
Status: resolved
Blocked by: 08

## Question

Ticket 08 found that public Custom Classes make scvmrack a DSA hosting platform, and the site lacks the pages that implies. Decide:

- **Terms of service**: what they cover (user content licence, acceptable use, takedown and appeal, account deletion), and in which languages (EN/PL).
- **Contact points**: the DSA points of contact for authorities (Art. 11) and for users (Art. 12). Is contact@rpgtools.co (already the zine-author contact) the single address, or split?
- **Operator details**: what identifies the operator of a non-commercial hobby site, and where it shows.
- **Open research**: whether the Polish act on providing electronic services (UŚUDE) applies to a non-commercial operator, and what it adds (a service regulation, *regulamin*). Settle it with a research pass if the existing notes don't.
- **Where they live**: footer links, the report form, the creator's publish step.

## Answer

Grilled 2026-09-27, against ticket 08's research note (`docs/superpowers/research/2026-09-26-custom-classes-ugc-legal-obligations.md`, §7 on UŚUDE). Today the footer links rpgtools.co and the privacy drawer (consent only); the site has no terms, contact or legal page. *This records product decisions, not legal advice.*

- **Terms: a `/terms` page in EN and PL**, drafted for the owner's review, with a lawyer's glance before public classes ship. The Polish version doubles as the UŚUDE Art. 8 *regulamin*. It covers:
  - the service: accounts, and guests who sign in later
  - authors keep their content, and give scvmrack a licence to host and show it (to other GMs when public)
  - acceptable use: no unlawful content, nothing the author has no right to share
  - the moderation process from ticket 07: anyone reports, human review, take down vs remove content, statement of reasons, disputes via the form or `scvmrack-appeal@rpgtools.co`
  - the limits from ticket 19
  - leaving: delete classes, or account removal on request
  - how changes are announced
- **Contact points: one `/legal` page in EN and PL**:
  - `contact@rpgtools.co` is the single point of contact for authorities (DSA Art. 11) and users (Art. 12), in Polish and English, and the contact for terrorist-content removal orders (TCO Art. 15).
  - `scvmrack-appeal@rpgtools.co` handles disputes.
- **Operator identity: name and email only, no home address** (owner decision). It rests on the open question of whether a donation-funded hobby site is "commercial activity" under UŚUDE Art. 2(6)/5. If scvmrack ever earns beyond donations, revisit and publish a correspondence or virtual-office address rather than a home address.
- **No further UŚUDE research**: the PL terms meet Art. 8 either way, and the operator decision covers Art. 5. The research item closes.
- **Links**: the footer gets "Terms" and "Contact" (`/legal`) next to the privacy link. The publish confirmation (ticket 07), the report form and every statement of reasons link to the relevant terms section.
- **Changes**:
  - The terms page shows a "last updated" date.
  - A significant change (DSA Art. 14(2)) shows signed-in users a one-time banner on their next visit: "Our terms changed on {date}: what changed".
  - GMs with public classes are also emailed through SES (ticket 07).
