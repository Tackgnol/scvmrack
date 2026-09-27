# What limits stop one account from flooding classes, publishing or reports?

Type: grilling
Status: resolved
Blocked by: 07

## Question

Ticket 03 caps each list at 20 entries and each text field at 1500 characters, but nothing yet caps an account. Decide:

- **Classes per GM**: how many Custom Classes one account may hold, including archived ones. Drafts are already capped by ticket 17: one per class, plus 3 new-class drafts, expiring after 90 idle days.
- **Publishing**: rate limits on making classes public, and whether a new account waits before it can publish.
- **Reporting**: rate limits on the report form, which signed-out visitors can use (ticket 08), and how it resists spam without a login (per-visitor limits keyed by `clientIp`, as in `CLAUDE.md`'s rate-limiting row, or a challenge).
- **Where limits live**: the existing shared-auth rate limiter, per-route limits like the 20–50 req/min on character routes, or counts checked in the service layer.
- **What the GM sees** when a limit is hit.

## Answer

Grilled 2026-09-27, following the existing patterns:
- per-route Fastify `rateLimit` settings keyed per visitor by shared-auth's `clientIp` (never `request.ip`)
- env-configurable caps read once at startup, like `PARTY_MAX_MEMBERS`

- **Classes per GM**: at most 50 Custom Classes per account, archived ones included, versions not counted. It's set by the env var `CUSTOM_CLASS_MAX_PER_GM` (default 50, read once at startup) so it's easy to change. Deleting a class nobody has played frees a slot.
- **Versions**: no cap. A version that isn't the latest and that no character plays is pruned automatically. Class saves are rate-limited to 10 a minute per visitor.
- **Publishing**: publish and unpublish are limited to 10 a minute per visitor, and at most 5 newly public classes per GM per day. New accounts don't wait. Limits fail loudly with the reason (owner).
- **Reporting**:
  - 5 reports an hour per visitor
  - a hidden honeypot field; filled submissions are dropped silently
  - reports from the same email about the same class within 24 hours merge
  - no CAPTCHA at launch; add Cloudflare Turnstile only if spam shows up
- **Disputes**: at most 3 per takedown, rate-limited like reports.
- **Where they live**: request rates in per-route `rateLimit` config; counts (classes per GM, publishes per day, drafts from ticket 17, disputes) in the service layer against env-configurable caps.
- **What the GM sees**: plain, specific messages with the reason, never a generic error. For example:
  - "You have 50 classes, the most one account can hold. Delete one nobody has played to make room."
  - "You've published 5 classes today. Try again tomorrow."

  In the creator they arrive as the blocked-save interrupt.
