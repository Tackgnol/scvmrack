# What limits stop one account from flooding classes, publishing or reports?

Type: grilling
Status: open
Blocked by: 07

## Question

Ticket 03 caps each list at 20 entries and each text field at 1500 characters, but nothing yet caps an account. Decide:

- **Classes per GM**: how many Custom Classes one account may hold, including archived ones. Drafts are already capped by ticket 17: one per class, plus 3 new-class drafts, expiring after 90 idle days.
- **Publishing**: rate limits on making classes public, and whether a new account waits before it can publish.
- **Reporting**: rate limits on the report form, which signed-out visitors can use (ticket 08), and how it resists spam without a login (per-visitor limits keyed by `clientIp`, as in `CLAUDE.md`'s rate-limiting row, or a challenge).
- **Where limits live**: the existing shared-auth rate limiter, per-route limits like the 20–50 req/min on character routes, or counts checked in the service layer.
- **What the GM sees** when a limit is hit.
