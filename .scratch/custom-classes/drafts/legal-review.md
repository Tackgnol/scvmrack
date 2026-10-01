# Legal review of the Custom Classes drafts (2026-10-01)

> **Not legal advice.** An AI assistant wrote this review as preparation for a Polish lawyer. No Legal or
> ip-legal skill was loaded in the session that wrote it: `ListPlugins` returned none and `ListSkills`
> listed no legal skill. So this is a manual check against the statutory texts already cited in
> `docs/superpowers/research/2026-09-26-custom-classes-ugc-legal-obligations.md`, plus background knowledge
> where marked. Nothing here replaces counsel's review.

**Scope.** The review covered these drafts:

- `terms.en.md` and `terms.pl.md`; PL binds and doubles as the UŚUDE *regulamin*
- `legal.md`
- `privacy.en.md` and `privacy.pl.md`; new, ticket 23
- the moderation flow in ticket 07

It checked them against:

- the GDPR
- the DSA, with scvmrack as a micro hosting provider and online platform, exempt from Arts. 15 and 20–28
- the TCO Regulation (EU) 2021/784
- Polish copyright law (*ustawa o prawie autorskim i prawach pokrewnych*, "pr. aut.")
- UŚUDE
- the Polish Penal Code

**Legend.**

- **Fixed**: changed in the drafts in this pass.
- **Owner**: needs an owner decision or deployment work. It was not changed, because the house rules forbid inventing product decisions.
- **Counsel**: an open legal question, numbered as in the cover memo.

## A. Deployment facts checked for the privacy notice

| Item | Found | Source | Status |
|---|---|---|---|
| Production domain | `scvmrack.rpgtools.co`. The terms said `scvmrack.com` | `frontend/src/seo/siteUrl.ts`, `index.html`, `README.md` | **Fixed** in both terms |
| Edge / CDN | Cloudflare proxies all traffic (`cloudflare_tls`, `server: cloudflare`, `CF-Connecting-IP`). A Cloudflare Insights beacon appears in the monitoring noise filter | `Caddyfile.example`, `docs/launch-audit-2026-06-06.md`, `frontend/src/monitoring.ts` | In the notice. [CONFIRM] whether Cloudflare Web Analytics is switched on |
| Hosting | One Docker Swarm host behind Caddy; provider and country aren't in the repo | `compose.prod.yaml`, `.woodpecker/deploy.yaml` | [CONFIRM] |
| Sign-in | Logto at `auth.rpgtools.co`, shared across rpgtools.co. Whether it is self-hosted or Logto Cloud isn't in the repo | `backend/src/plugins/rpgtools-auth.ts`, `.env.example` | [CONFIRM] |
| Auth data | Better Auth `User` (name, email, isAnonymous) and `Session` (ipAddress, userAgent, expiresAt) | `backend/prisma/schema.prisma` | In the notice. [CONFIRM] retention of expired sessions |
| Guest expiry | The FAQ promises 7 days; no cleanup job exists in this repo | `frontend/src/i18n/en.json` `faq.*` | [CONFIRM] the job, possibly in shared-auth |
| Error monitoring | Self-hosted GlitchTip (`glitchtip.rpgtools.co`). Browser events go through `/api/tunnel`, which doesn't forward the client IP. Events carry the user id and the guest/auth segment; the feedback form also goes to GlitchTip | `backend/src/instrument.ts`, `app.ts`, `routes/tunnel.ts`, `frontend/src/instrument.ts`, `backend/src/feedback.ts` | In the notice. [CONFIRM] host and retention |
| Analytics | GA4 `G-BS7LNTWRW8`, loaded only after consent (`ga-disable-*` flag). **But the consent switch defaults to ON**, and saving the drawer counts as consent | `compose.prod.yaml`, `frontend/src/analytics/googleAnalytics.ts`, `frontend/src/privacy/privacySettings.ts` | **Owner**, see B1 |
| Fonts | Google Fonts loaded from `fonts.googleapis.com` / `fonts.gstatic.com` on every page, before any consent | `frontend/index.html` | **Owner**, see B2 |
| Email | Amazon SES, planned in ticket 07 and wired as in `Tackgnol/roster` | ticket 07 | [CONFIRM] region and sender. This session's request to read roster was denied |
| Third-party surfaces | The Owlbear Rodeo extension stores room and player ids (binding tables); the site can be embedded on itch.io; donation links to Ko-fi and Buy Me a Coffee | `schema.prisma`, `Caddyfile.example` CSP, research note | In the notice as independent controllers |

## B. GDPR

- **B1. Analytics consent is pre-ticked (Owner, Counsel Q5).**
  - What happens today: `analyticsEnabled` defaults to `true`, and "I Understand & Save" counts as consent.
  - Why that's a problem: a pre-ticked box isn't valid consent to cookies (CJEU C-673/17 *Planet49*; GDPR Art. 4(11)). The same goes for consent bundled with acknowledging a notice. In Poland, the cookie rule is now Art. 399 of *Prawo komunikacji elektronicznej* (in force since 10 Nov 2024; background knowledge, not checked against the primary text).
  - Recommendation: default the switch to off, make "accept" and "reject" equally easy, and add a link to `/privacy` in the drawer.
  - Status: this is a behaviour change, so it is left for the owner. The privacy notice has a visible `[OWNER]` note until then.
- **B2. Google Fonts are loaded from Google without consent (Owner).**
  - Every visitor's IP address goes to Google, a US transfer. A German court found this unlawful without consent (LG München I, 20 Jan 2022, 3 O 17493/20; background knowledge).
  - Recommendation: self-host the fonts. The CSP's `font-src` already allows `'self'`. It's a cheap fix, and then the row comes out of the notice.
- **B3. The controller's contact details are email only (Counsel Q3).**
  - Art. 13(1)(a) requires the controller's "identity and contact details". The owner decided on name and email only, with no address.
  - The EDPB transparency guidelines (WP260 rev.01) prefer several channels.
- **B4. Keeping the moderation log forever (Counsel Q6).**
  - The decision stands (ticket 07), so the notice says "permanently".
  - No law found requires indefinite retention:
    - TCO Art. 6 requires 6 months, for content removed under an order;
    - the DSA sets no period;
    - the claims and limitation periods that could justify keeping data are finite (Polish Civil Code Art. 118: generally 6 years).
  - Storage limitation (Art. 5(1)(e)) may require a fixed period. Counsel should say whether "forever" is defensible, or name a period.
- **B5. The notice needs these documents behind it (Owner):**
  - a record of processing activities. The Art. 30(5) exemption doesn't apply, because the processing isn't occasional;
  - data processing agreements (Art. 28) with Cloudflare, AWS, Google (GA) and the hosting provider, plus Logto if it's the cloud product. Most are click-through terms; they should be accepted and filed.
- **B6. A copyright reporter's identity and the author (Owner, Counsel Q8).**
  - DSA recital 54 suggests the notifier's identity may be shared with the author in IP cases. Ticket 07 doesn't decide whether it is.
  - The notice lists it as a possible recipient with an `[OWNER]` note.
- **B7. Under-16s.**
  - Poland sets the Art. 8 GDPR age at 16, so analytics consent from under-16s needs a parent's consent.
  - The terms' minimum age is 16, or younger with a parent's or guardian's consent. The notice says so.
- **B8. The privacy drawer and `/privacy` (ticket 23).**
  - The drawer keeps only the analytics choice and links to `/privacy`.
  - The drawer's "By continuing to use this app, you acknowledge and accept this notice" should become "This panel stores your analytics choice. See the privacy notice." A notice isn't something to accept.
  - Status: Owner, a copy change at build time.

## C. DSA

- **C1. Art. 18: reporting suspected crimes is mandatory (Fixed).**
  - Terms §8 said reports "may be passed to the police". Art. 18 says the provider "shall promptly inform" the authorities, and Art. 240 k.k. makes not reporting some crimes an offence.
  - Reworded in both languages as a duty, limited to suspected crimes against life or safety.
- **C2. Art. 17(3)(f) and Art. 16(5): redress information (Fixed).**
  - Statements of reasons and decisions sent to reporters must name every redress route: the voluntary dispute, the courts, and a complaint to the DSC (Art. 53).
  - Terms §7 and §9 now say so, and add that reporters can challenge a decision too.
  - **Build note:** the statement-of-reasons and decision email templates (ticket 07) must carry the same text.
- **C3. Art. 17 also covers account suspension (Fixed).** Terms §11 now gives a suspended account a statement of reasons and the dispute route.
- **C4. Art. 17(3) contents (build note).** Each statement of reasons needs:
  - the measure, with its scope and duration;
  - the facts, including whether it followed a notice or the operator's own check;
  - "no automated means";
  - for illegal content, the legal ground; for a terms breach, the clause of the terms;
  - redress.

  Ticket 07's "reason category plus free text" should map to these fields. The categories should cite terms §5 clauses, so the contractual ground is explicit.
- **C5. Coverage at all (Counsel Q1).** The research note's biggest open point: is a free, donation-funded hobby site an "information society service" (one "normally provided for remuneration"), and an "enterprise" for the micro exemption? The drafts assume yes to both. That is the safe reading.
- **C6. The Polish DSC.** The UKE President is reported (not verified) to become the DSC once the implementing act takes effect. The terms name "the Digital Services Coordinator" generically, so they stay accurate.
- **C7. Art. 24(3).** The operator must be able to give average monthly active recipients on request. GA4 is consent-gated, so after B1 it will undercount. Server logs or Cloudflare analytics can fill the gap (Owner).

## D. TCO Regulation (EU) 2021/784

- **D1. One-hour removal orders and a one-person operator (Counsel Q4).**
  - Art. 3(3) requires removal within one hour of receiving an order. Some relief exists:
    - Art. 3(2): a provider that has never had an order gets 12 hours' notice of the first one, except in urgent cases;
    - Art. 3(7)–(8): force majeure and de facto impossibility.
  - The contact point is `contact@rpgtools.co`, which one person reads.
  - Counsel should say what arrangements are expected. For example: a phone number registered with the competent authority, email alerts, or a documented best-effort process.
- **D2. Art. 6 preservation (covered).** "Remove content" keeps the original text in the moderation log, which covers the 6 months.
- **D3. Art. 11: telling the content provider (build note).** After a TCO removal, the author must be told, unless the authority orders otherwise. The author must be given the order or the right to request it. This needs a TCO variant of the statement-of-reasons template, with a "do not notify" switch for orders that require confidentiality.
- **D4. Art. 7(1): the policy in the terms (covered, thinly).** §5 forbids terrorist content, and §8 says one-hour orders are complied with. That meets Art. 7(1), which applies only "where applicable"; Art. 7(2) transparency reports apply only once action has been taken.

## E. Penal Code: storing removed content

- **E1. The evidence copy of child-abuse text (Counsel Q7).**
  - Ticket 07 keeps removed text "as evidence" forever.
  - Penal Code Art. 202 § 4a criminalises possessing pornographic content involving a minor. Whether purely textual content falls under it is disputed, and there's no express carve-out for a hosting provider's evidence copy.
  - Counsel should say how long the provider may keep such text, and whether to hand it to the police and then delete it.

## F. IP: the licence clause, copyright reports, zine authors

- **F1. Fields of exploitation (Fixed, Counsel Q2).**
  - Under pr. aut. Art. 41(2), a licence covers only the fields of exploitation it expressly names, and Art. 50 lists them. The old §4 ("store, copy, show and adapt") was loose. "Adapt" in particular reads like a derivative-works right (Art. 2(2) and Art. 46), which the service doesn't need.
  - §4 now names recording, reproduction, making available "at a time and place they choose" (Art. 50 pt 3), display, and layout without changing meaning.
  - EN mirrors PL.
- **F2. Sublicence for other users (Fixed).**
  - Other GMs and their players use public classes. Under Art. 67(3), a licensee may authorise others only if the licence allows it.
  - §4 now says it does, "within the service as these terms describe".
- **F3. "You can't withdraw it from characters already rolled" (Counsel Q2).**
  - Art. 68(1) lets the author terminate an indefinite licence on one year's notice, unless the contract provides otherwise. Art. 68(2) deems a licence granted for more than 5 years to be indefinite once that period ends.
  - Can the terms validly exclude withdrawal for rolled characters? Is the clause abusive towards a consumer author (Civil Code Art. 385¹)?
  - The product depends on it: Class Versions and ADR 0001.
- **F4. Moral rights.**
  - Removing the author's name after account removal matches the author's right to publish anonymously (Art. 16 pt 2), so it's fine.
  - "Remove content" replaces the text with "[removed by moderation]" in other users' characters. That is withdrawal, not alteration, so it probably doesn't touch integrity (Art. 16 pt 3).
  - Counsel should confirm both.
- **F5. The rights checkbox at publish (covered).** It's good evidence of the author's warranty. It doesn't shift liability to the author by itself; the terms don't claim it does.
- **F6. Copyright reports (covered, one gap).**
  - A copyright notice is an ordinary Art. 16 notice; scvmrack isn't an OCSSP (pr. aut. Art. 22¹; DSM Art. 17), as the research note found.
  - **Gap:** the report form doesn't ask whether the reporter is the rightsholder or acting for one. Proposal for the owner: add "I am the rightsholder / I act on their behalf" under the copyright reason.
  - Also B6: whether the author sees the reporter's identity.
- **F7. Ideas versus expression in game rules (Counsel Q9).**
  - Under pr. aut. Art. 1(2¹), procedures, methods and principles of operation aren't protected. Game mechanics usually fall there; the wording of abilities does not.
  - Moderation needs a working rule for the common case: "this class re-states a zine's mechanics in my own words". Is that a copyright infringement at all?
- **F8. Zine authors (Owner, Counsel Q9).**
  - Zine Classes are seeded by the operator with a Credit. Each needs the author's permission on file. A non-exclusive licence has no form requirement (Art. 67(5) applies only to exclusive ones), but an email trail is the minimum. The licence should name the fields of exploitation as in F1.
  - A zine author's removal request runs through the same report or Hide flow (ticket 07). The terms say so in §6.
  - Counsel should confirm what a minimal permission email should contain. A short template is offered as a follow-up.
- **F9. The MÖRK BORG Third Party License (Counsel Q10).**
  - scvmrack publishes under it. Public Custom Classes are user content inside a licensed product.
  - Does the operator need the licence's notices on user classes? Do the licence's restrictions bind the operator for user content? The licence text wasn't read in this session; check it.

## G. UŚUDE and consumer law

- **G1. Art. 6 risk information (Fixed).** A paragraph on the risks of using online services was added to §13 in both languages. It costs nothing whether or not UŚUDE Art. 6 applies.
- **G2. Art. 8(3) contents of the *regulamin* (covered).** The PL terms already cover them:
  - the kinds of service (§1–3)
  - the technical requirements (§3)
  - the ban on unlawful content (§5)
  - concluding and ending the agreement (§3, §11)
  - complaints (§12)
- **G3. Consumer law (Counsel Q1).**
  - Free digital services where the consumer provides personal data can fall under the consumer rules for digital services (*ustawa o prawach konsumenta*, ch. 5b). That brings conformity and withdrawal information.
  - Those rules apply only to a *przedsiębiorca*. Whether the operator is one is the same question as C5.
  - The "as is" clause in §13 must not exclude liability towards consumers (Civil Code Art. 385³ pt 2). §13 keeps a consumer-rights saving clause; counsel should check it is enough.

## H. Smaller drafting notes (not changed)

- `legal.md` is fine against DSA Arts. 11–12 and TCO Art. 15: one address, languages stated, PL and EN.
- The EN terms §4 used to mention translating the interface; the rewrite removes the mismatch with PL.
- The terms "last updated" and the privacy notice date should be the same publication date.
