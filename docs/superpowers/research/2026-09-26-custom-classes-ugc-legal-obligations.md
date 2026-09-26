# Research: legal obligations for hosting published Custom Classes (UGC) on scvmrack

Ticket: `.scratch/custom-classes/issues/08-ugc-legal-obligations.md`. Research only, no application code changed.

> **This is research, not legal advice.** It was written by an AI assistant from the statutory texts listed
> below, for planning the Custom Classes moderation design. Where the law is unclear, or a source could not be
> opened, this note says so. Before relying on it for anything with real exposure (a takedown dispute, a police
> report, a regulator letter), check it against the official texts and, if possible, a Polish lawyer.

**Scope.** scvmrack is a free MÖRK BORG character-sheet app run by one person in Poland. It accepts donations
(Ko-fi / Buy Me a Coffee, see `frontend/src/i18n/en.json`, `faq.howCanIHelp`) and loads GA4. Signed-in GMs
will be able to publish Custom Classes (text: names, descriptions, abilities, items). Other users can search
those classes and use them. We plan a report button (copyright reasons, plus abusive or illegal content) and a
small admin takedown panel.

---

## Summary

1. **The DSA applies to Custom Classes, and its baseline obligations have no size exemption.** Storing
   GM-written classes is a *hosting service* (DSA Art. 3(g)(iii)). Making them publicly searchable makes it an
   *online platform* (Art. 3(i)). Whatever the size, the provider must have a notice-and-action mechanism
   (Art. 16), send statements of reasons (Art. 17), report threats to life or safety (Art. 18), publish points
   of contact (Arts. 11–12), have terms and conditions that explain moderation (Art. 14), and act on
   authority orders (Arts. 9–10).
2. **Micro and small online platforms are exempt from the rest of the online-platform section.** That covers
   Arts. 20–28: the formal internal complaint system, out-of-court dispute settlement, trusted flaggers,
   misuse suspensions, the Statement-of-Reasons database, dark patterns, ads, recommender systems and
   minors. The one exception is Art. 24(3), supplying user numbers when asked (Art. 19). They are also exempt
   from annual transparency reports (Art. 15(2)).
3. **The report button must work for anyone, not only signed-in users.** Art. 16(1) says "any individual or
   entity", which includes copyright holders who have no account. The form must let the reporter give the
   four elements in Art. 16(2). It must also let a CSAM report be made **without** a name or email
   (Art. 16(2)(c)).
4. **Copyright needs nothing beyond DSA notice-and-action at this scale.** DSM Directive Art. 17 (licensing and
   upload filtering) covers only "online content-sharing service providers": services whose main purpose is
   hosting large amounts of copyrighted uploads, organised *for profit*. scvmrack almost certainly isn't one.
   Even if it were, the new-and-small regime (Art. 17(6)) reduces the duty to best efforts plus expeditious
   takedown on notice. Poland implemented this in 2024 as Arts. 22¹–22⁸ of the Copyright Act, with the same
   definition.
5. **CSAM or threats to life: report promptly to Polish law enforcement.** That means the Police or
   prosecutor. If the Member State concerned can't be identified, report to Europol (DSA Art. 18). The Polish
   Penal Code also makes it a crime not to report credible knowledge of certain offences, including child
   sexual abuse offences (Art. 240 § 1 k.k.). Dyżurnet.pl (NASK) is the national hotline for CSAM reports.
   It is useful in addition to the police, but it is not a law enforcement authority, so a report there alone
   is not the Art. 18 report. **No general evidence-preservation duty was found for hosting providers.** The
   only explicit one is the Terrorist Content Online Regulation: 6 months, and only for content removed
   under a removal order or specific measures.
6. **Poland had no working Digital Services Coordinator (DSC) until very recently.** Secondary news (not
   verified against Dziennik Ustaw) reports the following:
   - The implementing act naming the **President of UKE** as DSC was signed by the President around
     25 Sept 2026.
   - It takes effect 30 days after it is published.
   - A second bill on administrative content-blocking orders is still in parliament; the President vetoed an
     earlier combined version on 9 Jan 2026.

   The DSA's own obligations have applied directly since 17 Feb 2024, whatever the Polish act's status.
7. **The biggest open legal question is whether a donation-funded hobby site is covered at all.** The DSA
   covers "information society services", which are services "normally provided for remuneration". A
   micro-enterprise also has to be engaged in "economic activity". Both tests are fuzzy for a donation-funded
   hobby site (see §2). The practical answer doesn't change: implement Arts. 11–18, and don't build the
   Arts. 20–28 machinery.

---

## Must do / should do / exempt (micro provider running a public UGC library)

| # | Obligation | Status for scvmrack | Source |
|---|---|---|---|
| 1 | Notice mechanism anyone can use: electronic, easy to access, user-friendly | **Must** | DSA Art. 16(1) |
| 2 | Notice form lets the reporter give: (a) reasons it's illegal, (b) exact URL / location, (c) name + email (optional for CSAM), (d) a statement that the notice is given in good faith | **Must** | DSA Art. 16(2) |
| 3 | Confirm receipt to the notifier (if they left contact details) and tell them the decision, including redress options | **Must** | DSA Art. 16(4)–(5) |
| 4 | Decide on notices in a timely, diligent, non-arbitrary and objective way; say so if the decision was automated | **Must** | DSA Art. 16(6) |
| 5 | Remove or disable illegal content expeditiously once you have actual knowledge. This is the condition for keeping the hosting liability exemption. | **Must in practice** | DSA Art. 6(1), 16(3) |
| 6 | Statement of reasons to the class author for any takedown, hiding, demotion or account suspension, whether for illegality or a terms breach | **Must** (authors are Logto users, so an email is known) | DSA Art. 17 |
| 7 | Report suspected crimes that threaten life or safety (CSAM, credible threats, terrorism) to Polish Police or the prosecutor, or to Europol if the country is unclear | **Must** | DSA Art. 18 |
| 8 | Report credible knowledge of the offences listed in Art. 240 k.k. (includes Arts. 197 § 3–5, 198, 200: rape and sexual offences against children under 15) | **Must** (criminal liability) | Polish Penal Code Art. 240 § 1 |
| 9 | Single point of contact for authorities, made public, stating the languages accepted (at least Polish, plus a widely understood language) | **Must** | DSA Art. 11 |
| 10 | Single point of contact for users: electronic, not only automated, made public | **Must** | DSA Art. 12 |
| 11 | Terms and conditions that describe content restrictions and the moderation policy, procedure and tools (including human review); publicly available and machine-readable; notify users of significant changes; enforce them proportionately | **Must** | DSA Art. 14(1), (2), (4) |
| 12 | Act on authority removal or information orders and tell the authority what was done | **Must** (when received) | DSA Arts. 9, 10 |
| 13 | Supply average monthly active recipients to the DSC or the Commission when they ask | **Must** (only on request) | DSA Arts. 19(1), 24(3) |
| 14 | Contact point for terrorist-content removal orders, made public; remove within 1 hour of an order; keep removed content and related data for 6 months | **Must** (when an order arrives; the DSA contact point can be reused) | TCO Reg. 2021/784 Arts. 3(3), 6, 15(1) |
| 15 | Put the report button next to each class, and allow several items in one notice | Should (recital guidance) | DSA recital 50 |
| 16 | An appeal route for authors (for example, "reply to this email"), mentioned in the statement of reasons | Should. A formal Art. 20 system isn't required, but Art. 17(3)(f) requires naming whatever redress exists. | DSA Arts. 17(3)(f), 19 |
| 17 | Hide rather than hard-delete removed classes; keep an audit log (who, when, why, what the notice said) | Should. This supports Art. 17/18 information, reinstatement and police requests. | DSA recital 56; Art. 18(1) "all relevant information" |
| 18 | Keep Custom Classes text-only (no image uploads) | Should. This largely removes the CSAM-image risk and the possession exposure under Penal Code Art. 202. | Polish Penal Code Art. 202 |
| 19 | A Polish-language *regulamin* that forbids unlawful content | Should. Whether the Polish e-services act applies to a non-commercial provider is uncertain; see §7. | UŚUDE Art. 8 |
| 20 | Operator identity (name, address) on the site | **Uncertain.** Polish UŚUDE Art. 5 requires it only from a "usługodawca" (someone running a commercial or professional activity); see §7. | UŚUDE Arts. 2(6), 5 |
| 21 | Internal complaint-handling system (6-month window, free, not solely automated) | **Exempt** | DSA Arts. 19, 20 |
| 22 | Out-of-court dispute settlement | **Exempt** | DSA Arts. 19, 21 |
| 23 | Trusted flagger priority | **Exempt** | DSA Arts. 19, 22 |
| 24 | Misuse measures (suspending repeat offenders or abusive notifiers). They can still be done voluntarily under the terms and conditions. | **Exempt** | DSA Arts. 19, 23 |
| 25 | Publishing monthly active users every 6 months; sending statements of reasons to the Commission database | **Exempt** (literal reading of Art. 19; see §3) | DSA Arts. 19, 24(2), 24(5) |
| 26 | Dark-pattern ban, ad transparency, recommender transparency, protection of minors | **Exempt** as DSA obligations (other laws, e.g. GDPR, still apply) | DSA Arts. 19, 25–28 |
| 27 | Annual transparency report | **Exempt** | DSA Art. 15(2) |
| 28 | EU legal representative | Not applicable: only for providers without an EU establishment | DSA Art. 13(1) |
| 29 | DSM Art. 17 licensing and "best efforts" upload filtering | Not applicable: scvmrack isn't an online content-sharing service provider | DSM Dir. Art. 2(6), 17; Polish Copyright Act Art. 6(1)(25), 22¹ |

---

## Sources and method

**The primary sites couldn't be reached from this environment.** The session's egress proxy blocked
eur-lex.europa.eu, publications.europa.eu, digital-strategy.ec.europa.eu, isap.sejm.gov.pl, api.sejm.gov.pl,
gov.pl, uke.gov.pl, dyzurnet.pl and web.archive.org. Only GitHub and package registries were reachable. The
statutory texts were therefore read from **verbatim mirrors on GitHub** of the official texts:

| Text | Official (canonical) URL, cited below | Mirror actually read |
|---|---|---|
| DSA, Reg. (EU) 2022/2065 (OJ L 277, 27.10.2022), articles | https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:32022R2065 | `SFHAJJI/lex-articles` `eu-eurlex/works/32022r2065/.../en.md`: derived from the EUR-Lex XHTML, with a `source_sha256` recorded in the file |
| DSA recitals | same | `CloudSecurityAlliance-DataSets/dataset-public-laws-regulations-standards` `regulation/europa.eu/dsa/dsa-recitals.json` |
| DSM Copyright Directive (EU) 2019/790 | https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:32019L0790 | `SFHAJJI/lex-articles` `eu-eurlex/works/32019l0790/.../en.md` |
| Commission Recommendation 2003/361/EC (SME definition) | https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:32003H0361 | `DTMC-marketplace/governance` `ai_act_articles/Recommendation_2003_361_EC_SME.txt` (an EUR-Lex copy) |
| TCO Regulation (EU) 2021/784 | https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:32021R0784 | `legalize-dev/legalize-eu` `eu/32021R0784.md` |
| Polish e-services act (UŚUDE), consolidated text Dz.U. 2024 poz. 1513 | https://api.sejm.gov.pl/eli/acts/DU/2024/1513 | `legalize-dev/legalize-pl` `pl/DU-2024-1513.md` |
| Polish Penal Code (k.k.), consolidated text Dz.U. 2024 poz. 17 | https://api.sejm.gov.pl/eli/acts/DU/2024/17 | `legalize-dev/legalize-pl` `pl/DU-2024-17.md` |
| Polish Copyright Act amendment of 26 Jul 2024, Dz.U. 2024 poz. 1254 | https://api.sejm.gov.pl/eli/acts/DU/2024/1254 | `legalize-dev/legalize-pl` `pl/DU-2024-1254.md` |
| Polish Code of Criminal Procedure (k.p.k.) Art. 304 § 1 | https://isap.sejm.gov.pl/isap.nsf/DocDetails.xsp?id=WDU19970890555 | `legalize-dev/legalize-pl` `pl/DU-2016-437.md`: the article as restated in a 2016 amending act |

The EUR-Lex anchor links below (`#art_N`) follow EUR-Lex's HTML article ids. **Status of the Polish DSA
implementing act and of Dyżurnet.pl** comes only from web-search result snippets of news and government
pages that couldn't be opened; each such claim is marked *[not verified against primary source]*.

---

## 1. What scvmrack is under the DSA

- **Hosting service.** An "intermediary service" includes a "'hosting' service, consisting of the storage of
  information provided by, and at the request of, a recipient of the service". Storing a GM's Custom Class is
  exactly that, whether the class is public or private.
  DSA Art. 3(g)(iii): https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:32022R2065#art_3
- **Online platform.** An online platform is "a hosting service that, at the request of a recipient of the
  service, stores and disseminates information to the public". The exception is where that activity is "a
  minor and purely ancillary feature of another service or a minor functionality of the principal service"
  that "for objective and technical reasons, cannot be used without that other service".
  DSA Art. 3(i), same URL.
  - "Dissemination to the public" means making information available "to a potentially unlimited number of
    persons … without further action by the recipient of the service providing the information". Content
    behind registration counts only if registration is automatic. DSA recital 14.
  - Public Custom Classes are searchable by any GM, and sign-up is automatic (Logto), so they are
    disseminated to the public.
  - **Uncertain:** one could argue the class library is ancillary to the character-sheet service. Recital 13
    gives the newspaper comment section as an ancillary example and a social network as a counter-example.
    This note treats scvmrack as an online platform. It doesn't matter much, because of Art. 19 (§3).
- **Content in scope.** "Illegal content" is "any information that … is not in compliance with Union law or
  the law of any Member State". DSA Art. 3(h). The DSA's moderation rules (Arts. 14, 17) also cover content
  "incompatible with their terms and conditions". DSA Arts. 3(t), 17(1).
- **Territorial scope.** The DSA applies to intermediary services offered to recipients in the Union.
  DSA Art. 2(1): https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:32022R2065#art_2
- **Date of application.** The DSA applies from 17 Feb 2024. DSA Art. 93(2):
  https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:32022R2065#art_93

## 2. Does a hobby operator count? (uncertain)

Two definitions pull in different directions for a free, donation-funded, one-person site.

- **"Information society service"** (DSA Art. 3(a)) points to Directive (EU) 2015/1535 Art. 1(1)(b). Recital 5
  of the DSA restates that as "any service normally provided for remuneration, at a distance, by electronic
  means and at the individual request of a recipient".
  https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:32022R2065#rct_5
  - On the words alone, a free service funded by voluntary donations is at the edge of "normally provided for
    remuneration".
  - CJEU case law (e.g. C-291/13 *Papasavvas*) is generally read as meaning that the remuneration need not
    come from the user; advertising-funded services qualify. *[Not verified: curia.europa.eu couldn't be
    reached. This is from background knowledge.]* Treat coverage as **likely but unsettled**.
- **Micro enterprise** (DSA Arts. 15(2), 19(1) → Recommendation 2003/361/EC).
  - The Annex, Art. 1: "An enterprise is considered to be any entity engaged in an economic activity,
    irrespective of its legal form. This includes, in particular, self-employed persons …".
  - Annex Art. 2(3): "a microenterprise is defined as an enterprise which employs fewer than 10 persons and
    whose annual turnover and/or annual balance sheet total does not exceed EUR 2 million."
  - https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:32003H0361
- **Resolution used in this note.**
  - If the site is covered by the DSA at all (an information society service, i.e. economic in character),
    the operator is clearly a micro enterprise: 1 person, far under EUR 2 million.
  - If it is not economic, then arguably it is not an information society service either, and the DSA may not
    apply at all.
  - Either way, **no scenario puts scvmrack under the Arts. 20–28 duties**, and the prudent course is to
    comply with the baseline (Arts. 11–18). The literal oddity: a provider that is not an "enterprise" does
    not "qualify as a micro enterprise". This is a theoretical gap, not a practical risk.

## 3. Obligations of all intermediary / hosting providers (no size exemption)

The DSA's layering is: Arts. 11–15 apply to all intermediaries, Arts. 16–18 to all hosting providers, and
Arts. 19–28 add extra duties for online platforms. The size exemptions sit in Arts. 15(2) and 19. Neither
covers Arts. 11–14 or 16–18.

### 3.1 Notice-and-action: Art. 16

https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:32022R2065#art_16

- **Who can report.** Providers "shall put mechanisms in place to allow **any individual or entity** to notify
  them of the presence on their service of specific items of information that the individual or entity
  considers to be illegal content. Those mechanisms shall be easy to access and user-friendly, and shall allow
  for the submission of notices exclusively by electronic means." (Art. 16(1))
  → **Design consequence:** reporting must not require a scvmrack/Logto account. A rightsholder who has never
  used the site must be able to report. Either the report form works signed-out, or there is a public
  web/email route.
- **What the form must allow.** The provider must "enable and … facilitate the submission of notices
  containing all of the following elements" (Art. 16(2)):
  - (a) "a sufficiently substantiated explanation of the reasons why the individual or entity alleges the
    information in question to be illegal content";
  - (b) "a clear indication of the exact electronic location of that information, such as the exact URL or
    URLs, and, where necessary, additional information enabling the identification of the illegal content";
  - (c) "the name and email address of the individual or entity submitting the notice, **except** in the case
    of information considered to involve one of the offences referred to in Articles 3 to 7 of Directive
    2011/93/EU" (child sexual abuse / exploitation / CSAM offences);
  - (d) "a statement confirming the bona fide belief of the individual or entity submitting the notice that the
    information and allegations contained therein are accurate and complete."

  → **Design consequence:** each report needs:
  - a free-text explanation (required for the copyright reason, e.g. "which work, why you hold rights");
  - the class URL or id, which can be auto-filled;
  - name and email, required for every reason **except** the CSAM/child-abuse reason, where they must be
    optional;
  - a good-faith checkbox.

  Recital 53 says that, except for those CSAM offences, mechanisms "should ask the individual or the entity
  submitting a notice to disclose its identity in order to avoid misuse". Recital 50 says the mechanism "should
  allow, but not require, the identification" in general, and that several items may be flagged in one
  notice. Recital 50 also says mechanisms should be "located close to the information in question".
  https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:32022R2065#rct_50
- **Effect of a notice.** A notice that lets "a diligent provider … identify the illegality … without a
  detailed legal examination" gives rise to actual knowledge for Art. 6 (Art. 16(3)). Under Art. 6(1), the
  hosting provider is not liable if it lacks knowledge, or "upon obtaining such knowledge or awareness, acts
  expeditiously to remove or to disable access".
  https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:32022R2065#art_6
  The DSA replaced Arts. 12–15 of the e-Commerce Directive (DSA Art. 89).
- **Replies to the notifier.** "Without undue delay", send a confirmation of receipt if contact details were
  given (Art. 16(4)). Then notify the decision, "providing information on the possibilities for redress"
  (Art. 16(5)).
- **Processing standard.** Notices must be processed "in a timely, diligent, non-arbitrary and objective
  manner". If automated means are used, say so in the decision notice (Art. 16(6)). Recital 52 expects
  providers "to act without delay when allegedly illegal content involving a threat to life or safety of
  persons is being notified".
- **No monitoring duty.** "No general obligation to monitor … nor actively to seek facts or circumstances
  indicating illegal activity" (Art. 8). Voluntary own-initiative moderation does not forfeit the liability
  exemption (Art. 7).
  https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:32022R2065#art_7

### 3.2 Statement of reasons: Art. 17

https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:32022R2065#art_17

- **When it's required.** A "clear and specific statement of reasons" must go to affected recipients for any
  restriction imposed because content is illegal **or incompatible with the terms and conditions** (Art. 17(1)).
  That covers:
  - (a) visibility restrictions, "including removal of content, disabling access to content, or demoting
    content";
  - (b) monetary restrictions;
  - (c) suspension or termination of the service;
  - (d) suspension or termination of the account.

  → Hiding a class from public search and other GMs' pools (the planned "takedown") is a visibility
  restriction and needs a statement of reasons.
- **Only where contact details are known.** Art. 17 applies "only where the relevant electronic contact
  details are known to the provider", from the date the restriction is imposed (Art. 17(2)). Publishers are
  Logto-signed-in, so an email is known.
- **Minimum content** (Art. 17(3)):
  - (a) what measure was taken, plus its territorial scope and duration;
  - (b) the facts and circumstances, including whether it followed an Art. 16 notice or an own-initiative
    check, and "where strictly necessary, the identity of the notifier";
  - (c) any use of automated means;
  - (d) for illegal content: the legal ground and why the content is illegal on that ground;
  - (e) for a terms breach: the contractual ground and why;
  - (f) "clear and user-friendly information on the possibilities for redress … in particular, where
    applicable through internal complaint-handling mechanisms, out-of-court dispute settlement and judicial
    redress".
- **Clarity.** The statement must be clear and specific enough to let the author exercise redress
  (Art. 17(4)).
- **Notifier identity.** Recital 54: reveal the notifier's identity to the author only where necessary, "such
  as in cases of infringements of intellectual property rights". This matters for the copyright reason.
  https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:32022R2065#rct_54
- Because Art. 20 (internal complaints) does not bind micro platforms (§4), the "redress" section can
  honestly name:
  - a voluntary appeal ("reply to this email / use the contact form");
  - judicial redress (the courts);
  - a complaint to the DSC (Art. 53).

### 3.3 Threats to life or safety, CSAM: Art. 18

https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:32022R2065#art_18

- **The duty.** "Where a provider of hosting services becomes aware of any information giving rise to a
  suspicion that a criminal offence involving a threat to the life or safety of a person or persons has taken
  place, is taking place or is likely to take place, it shall **promptly inform the law enforcement or judicial
  authorities** of the Member State or Member States concerned of its suspicion and provide all relevant
  information available." (Art. 18(1))
- **If the country is unclear.** Inform the law enforcement authorities of the Member State where the provider
  is established (Poland), **or Europol, or both** (Art. 18(2)). "Member State concerned" means where the
  offence happened or is likely, or where the suspect or victim is.
- **What counts, and what to send.** Recital 56 names offences under Directive 2011/93/EU (child sexual abuse
  and exploitation, including CSAM), Directive 2011/36/EU (trafficking) and Directive 2017/541 (terrorism) as
  examples. It lists the information to send: "the content in question and, if available, the time when the
  content was published, including the designated time zone, an explanation of its suspicion and the
  information necessary to locate and identify the relevant recipient of the service". It also says the DSA
  gives no legal basis for profiling users to look for crimes.
  https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:32022R2065#rct_56
- **For scvmrack in Poland, "law enforcement or judicial authorities" means the Police (Policja) or the public
  prosecutor (prokuratura).** Europol applies only when the country is unclear.

### 3.4 Points of contact: Arts. 11, 12 (and 13)

- **Contact point for authorities (Art. 11).** Designate "a single point of contact to enable them to
  communicate directly, by electronic means, with Member States' authorities, the Commission and the Board".
  - Publish the information needed to reach it, "easily accessible, and … kept up to date".
  - State the languages accepted. These must include "a language broadly understood by the largest possible
    number of Union citizens" and "at least one of the official languages of the Member State in which the
    provider … has its main establishment", i.e. Polish.
  - https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:32022R2065#art_11
- **Contact point for users (Art. 12).** Designate a single point of contact for recipients "directly and
  rapidly … by electronic means and in a user-friendly manner, including by allowing recipients … to choose
  the means of communication, which shall **not solely rely on automated tools**". Make it public "in
  addition to the obligations provided under Directive 2000/31/EC".
  https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:32022R2065#art_12
  → One monitored email address (e.g. on a "Contact / Legal" page) can serve both roles, labelled "EN / PL".
- **Legal representative (Art. 13).** Required only for "providers … which do not have an establishment in the
  Union". **Not applicable**: the operator is in Poland.
  https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:32022R2065#art_13

### 3.5 Terms and conditions: Art. 14

https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:32022R2065#art_14

- **What they must say (Art. 14(1)).** Include "information on any restrictions that they impose in relation to
  the use of their service in respect of information provided by the recipients", including "any policies,
  procedures, measures and tools used for the purpose of content moderation, including algorithmic
  decision-making and human review, as well as the rules of procedure of their internal complaint handling
  system".
- **Form.** "clear, plain, intelligible, user-friendly and unambiguous language", "publicly available in an
  easily accessible and machine-readable format". A plain HTML page is the usual reading of machine-readable;
  the regulation doesn't define the format further.
- **Changes.** Inform recipients of "any significant change" (Art. 14(2)).
- **Minors.** If the service is primarily directed at or used by minors, explain the terms so minors can
  understand (Art. 14(3)). Probably not triggered for a MÖRK BORG tool, but that is a factual call.
- **Enforcement standard.** Apply the restrictions "in a diligent, objective and proportionate manner", with due
  regard to fundamental rights including freedom of expression (Art. 14(4)).
- **What this means for scvmrack.** The Custom Classes terms need to say:
  - what content is not allowed (illegal content, infringing content, hate, and any house rules, e.g. content
    unrelated to MÖRK BORG);
  - how to report;
  - that a human admin reviews each report, with no automated moderation;
  - what happens on takedown (hidden from search and pools; existing characters keep it);
  - how an author can appeal;
  - whether repeat offenders lose publishing rights.

### 3.6 Authority orders: Arts. 9, 10

- **Removal orders (Art. 9(1)).** On an order "to act against one or more specific items of illegal content"
  from a national judicial or administrative authority, "inform the authority … of any effect given to the
  order without undue delay".
  https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:32022R2065#art_9
- **Information orders (Art. 10(1)).** The same applies to orders to provide information about specific
  users. https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:32022R2065#art_10
- The admin panel should let the operator record that an order was received and acted on.

## 4. What micro and small providers are exempt from

- **Art. 15: transparency reports.** "Paragraph 1 of this Article shall not apply to providers of intermediary
  services that qualify as micro or small enterprises as defined in Recommendation 2003/361/EC and which are
  not very large online platforms" (Art. 15(2)).
  https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:32022R2065#art_15
- **Art. 19: the online-platform section.** "This Section, with the exception of Article 24(3) thereof, shall
  not apply to providers of online platforms that qualify as micro or small enterprises as defined in
  Recommendation 2003/361/EC." There is a 12-month grace period after losing the status, and no exemption for
  VLOPs (Art. 19(1)–(2)).
  https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:32022R2065#art_19
  - The Section is Chapter III, Section 3, Arts. 19–28: Art. 20 internal complaint handling, Art. 21
    out-of-court dispute settlement, Art. 22 trusted flaggers, Art. 23 misuse measures, Art. 24 platform
    transparency (except 24(3)), Art. 25 dark patterns, Art. 26 advertising, Art. 27 recommender systems,
    Art. 28 protection of minors.
  - *The section headings weren't in the mirror used; the Arts. 19–28 range is from the DSA's published
    structure and matches recital 57.*
- **Art. 24(3) still applies.** Providers "shall communicate to the Digital Services Coordinator of
  establishment and the Commission, upon their request and without undue delay", the average monthly active
  recipients. Recital 57 confirms that micro/small providers "should not be excluded from the obligation to
  provide information on the average monthly active recipients … at the request of the Digital Services
  Coordinator of establishment or the Commission".
  https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:32022R2065#rct_57
  → Keep a rough monthly-active-recipients figure obtainable (GA4 or server logs are enough).
- **Uncertain: Art. 24(2).** On the literal text, Art. 19 exempts micro/small platforms from Art. 24(2)
  (publishing MAU every six months), because only 24(3) is carved back in. It is sometimes said that all
  platforms must publish MAU. Commission guidance on this couldn't be opened (digital-strategy.ec.europa.eu
  blocked). Publishing a one-line MAU figure on the contact/legal page is cheap if we want to be safe.
- **Voluntary compliance is allowed.** Nothing prevents an exempt provider from voluntarily running an Art. 20-
  style appeal (recital 57, last sentence).
- **What the exemptions do *not* cover:** Arts. 11, 12, 14, 16, 17, 18 and Arts. 9–10.

## 5. Copyright claims ("I own this and don't want it on scvmrack")

- **The DSA leaves copyright law to itself.** The DSA is "without prejudice to … Union law on copyright and
  related rights" (Art. 2(4)(b)). A copyright notice is still an Art. 16 notice of "illegal content", and the
  Art. 6 liability exemption still applies to ordinary hosting.
  https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:32022R2065#art_2
- **DSM Directive Art. 17 covers only "online content-sharing service providers" (OCSSPs).**
  - Definition: "a provider of an information society service of which **the main or one of the main
    purposes** is to store and give the public access to **a large amount of copyright-protected works** …
    uploaded by its users, which it organises and promotes **for profit-making purposes**" (DSM Art. 2(6)).
  - Not-for-profit encyclopedias, open-source platforms and similar services are excluded.
  - https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:32019L0790#art_2
  - The main purpose of scvmrack is character sheets. Custom Classes are a feature, the site isn't organised
    for profit, and the classes are mostly users' own short game content. It is **very unlikely to be an
    OCSSP**.
- **Even if it were an OCSSP**, the regime for new, small providers is lighter.
  - It applies to providers "available to the public in the Union for less than three years and which have an
    annual turnover below EUR 10 million".
  - Liability is then limited to: best efforts to obtain an authorisation (Art. 17(4)(a)), and "acting
    expeditiously, upon receiving a sufficiently substantiated notice, to disable access to the notified works
    … or to remove those works".
  - Stay-down only kicks in above 5 million monthly unique visitors (DSM Art. 17(6)).
  - Proportionality factors include "the type, the audience and the size of the service" (Art. 17(5)).
  - https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:32019L0790#art_17
- **The Polish implementation says the same.** The Act of 26 Jul 2024 amending the Copyright Act (Dz.U. 2024
  poz. 1254, in force 20 Sep 2024) added Art. 6(1)(25) and Arts. 22¹–22⁸.
  - An OCSSP ("dostawca usług udostępniania treści online") is a "usługodawca" (provider of electronic
    services in the course of a commercial or professional activity). Its "główny przedmiot działalności"
    (main business) must be storing and publicly sharing "znacznej liczby utworów" (a large number of works),
    organised "w celach zarobkowych" (for profit).
  - Art. 22² ust. 2 mirrors DSM Art. 17(6): under 3 years, under EUR 10 million, act "niezwłocznie"
    (without delay) on a "należycie uzasadnionego żądania" (duly substantiated request).
  - https://api.sejm.gov.pl/eli/acts/DU/2024/1254
- **Practical consequence.**
  - Handle copyright reports as Art. 16 notices. Require the explanation (which work, what the rights are) and
    the notifier's identity; for IP claims, identity may be shared with the author (recital 54).
  - Decide, hide if the claim is plausible, and send the Art. 17 statement of reasons.
  - Nothing here requires filtering or licensing.
  - The planned reason "I own this class and do not wish it on scvmrack" makes sense for classes copied from
    someone else's work. For a user's own class, the fix is simply that they unpublish or archive it
    themselves; that isn't a legal notice.

## 6. CSAM / threat-to-life handling and evidence preservation

- **DSA Art. 18.** Report to Polish Police or the prosecutor promptly, or to Europol if the country is unclear
  (§3.3).
- **Polish Penal Code Art. 240 § 1: criminal duty to report.**
  - Text: "Kto, mając wiarygodną wiadomość o karalnym przygotowaniu albo usiłowaniu lub dokonaniu czynu
    zabronionego określonego w art. … 197 § 3-5, art. 198, art. 200 … lub przestępstwa o charakterze
    terrorystycznym, nie zawiadamia niezwłocznie organu powołanego do ścigania przestępstw, podlega karze
    pozbawienia wolności do lat 3."
  - In English: anyone with *credible* information about the preparation, attempt or commission of the listed
    offences, including rape of a minor, sexual abuse of a helpless person, sexual acts with a child under 15,
    and terrorist offences, who does not notify law enforcement without delay, faces up to 3 years in prison.
  - Consolidated text Dz.U. 2024 poz. 17: https://api.sejm.gov.pl/eli/acts/DU/2024/17
  - **Uncertain:** Art. 202 (CSAM as such) is *not* in the Art. 240 list. A CSAM image may still give
    "credible information" of an Art. 200 or 197 offence behind it. Treat any CSAM find as reportable. The
    2024 consolidated text may have been amended since (the 2025 sexual-offence reforms); check the current
    ISAP text.
- **Code of Criminal Procedure Art. 304 § 1: general civic duty.** "Każdy, dowiedziawszy się o popełnieniu
  przestępstwa ściganego z urzędu, ma społeczny obowiązek zawiadomić o tym prokuratora lub Policję": everyone
  who learns of a crime prosecuted ex officio has a *civic* (not criminally enforced) duty to tell the
  prosecutor or Police.
  https://isap.sejm.gov.pl/isap.nsf/DocDetails.xsp?id=WDU19970890555
- **Don't keep copies of CSAM.** Penal Code Art. 202 § 4a criminalises anyone who "przechowuje, posiada lub
  uzyskuje dostęp do treści pornograficznych z udziałem małoletniego" (stores, possesses or accesses
  pornographic content involving a minor). § 4b covers generated or processed images of a minor. No express
  exemption for hosting providers preserving evidence was found in the text. **Uncertain.**
  - Don't download or copy such material.
  - Disable access immediately, keep the stored record untouched and hidden, and report.
  - Ask the Police what to preserve and how.
  - Keeping Custom Classes text-only (no image uploads) avoids almost all of this exposure. Text depicting
    minors sexually is a grey area under "treści pornograficzne" and should simply be removed and reported.
- **Dyżurnet.pl (NASK).** The Polish hotline for reporting online CSAM and other illegal content, with an
  anonymous web form. *[Not verified against primary source: dyzurnet.pl and nask.pl were blocked; this comes
  from search snippets of https://dyzurnet.pl/ and
  https://www.nask.pl/pl/aktualnosci/4145,Dyzurnetpl-nie-badzmy-obojetni-w-sieci.html.]*
  - Dyżurnet is a hotline run by a state research institute, **not** a law enforcement or judicial authority.
    So under DSA Art. 18 the report should go to the Police or prosecutor. Dyżurnet is a sensible *additional*
    channel for CSAM.
- **Evidence preservation.**
  - **DSA:** there is no general preservation duty for hosting providers. Art. 18 asks for "all relevant
    information available", and recital 56 lists content, publication time with time zone, and user
    identification data. That implies keeping those until reported.
  - **Terrorist Content Online Regulation (EU) 2021/784** is the only explicit preservation rule found.
    - Art. 6: content removed "as a result of a removal order, or of specific measures pursuant to Article 3
      or 5" must be preserved with related data for **six months**, under safeguards.
    - Art. 3(3): remove "within one hour of receipt of the removal order".
    - Art. 15(1): "Each hosting service provider shall designate or establish a contact point for the receipt
      of removal orders … [and] ensure that information about the contact point is made publicly available."
    - Art. 14(5): terrorist content "involving an imminent threat to life" must be reported promptly to
      criminal authorities, or to Europol.
    - The TCO Regulation covers hosting providers that "disseminate information to the public" (its recital
      14 and Art. 2(1), (3)), which includes public Custom Classes.
    - https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:32021R0784
  - **Polish data-retention rules** for telecom operators (Prawo komunikacji elektronicznej) were *not*
    researched. They target electronic communications services, not a hosting app.
  - **Recommended practice:**
    - Takedown = hide, not delete.
    - Keep a moderation log: class snapshot, author id, publish timestamp in UTC, the notice, the decision,
      the statement of reasons sent.
    - For reported crimes, keep the relevant record until the Police say otherwise.
    - Record the lawful basis for this under GDPR (legal obligation / legitimate interest). The GDPR angle
      wasn't researched in depth here.

## 7. Poland-specific points

- **Digital Services Coordinator.** The DSA required Member States to designate a DSC by 17 Feb 2024
  (Art. 49(3)). https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:32022R2065#art_49
  - Poland missed the deadline. The Commission referred Poland (with CZ, ES, CY, PT) to the CJEU for failing
    to designate and empower a DSC and to lay down penalties. *[Not verified against primary source:
    https://digital-strategy.ec.europa.eu/en/news/commission-decides-refer-czechia-spain-cyprus-poland-and-portugal-court-justice-european-union-due
    couldn't be opened; press coverage dates it to 7 May 2025.]*
- **Implementing act status (Sept 2026).** *[Not verified against primary source; from search snippets of
  uke.gov.pl, gov.pl/cyfryzacja, prawo.pl and 300polityka.pl pages that couldn't be opened.]*
  - **First version, vetoed.** An earlier combined DSA implementing act (Sejm print 1757) was **vetoed by
    President Nawrocki on 9 Jan 2026**. The veto targeted its administrative content-blocking chapter.
  - **Split into two bills.** The government then split the subject.
  - **First bill, now signed.** An act amending the Act on Electronic Services (UŚUDE) "and certain other
    acts" designates the **President of UKE (Urząd Komunikacji Elektronicznej) as Digital Services
    Coordinator**. It also sets up complaint handling and penalties, and gives roles to KRRiT and UOKiK.
    - It was reportedly passed by the Sejm on 31 Jul 2026, and Senate amendments were accepted on
      4 Sep 2026.
    - It was **reportedly signed by the President around 25 Sep 2026**.
    - It enters into force **30 days after publication** in Dziennik Ustaw, so it is probably **not yet in
      force** on 2026-09-26.
    - The Sejm print number is reported variously as 2693 or 2694.
  - **Second bill.** A separate bill on blocking illegal content is reportedly still in parliament.
  - UKE's DSA page: https://uke.gov.pl/en/digitalservices/. Ministry page:
    https://www.gov.pl/web/cyfryzacja/prace-nad-ochrona-uzytkownikow-internetu--implementacja-unijnego-aktu-o-uslugach-cyfrowych-dsa
    (both unopened).
  - **Why it matters:** once in force, UKE can receive user complaints against providers (DSA Art. 53) and
    impose fines within the DSA caps (up to 6% of annual worldwide turnover, Art. 52(3)). Users can also claim
    damages for DSA breaches (Art. 54).
    https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:32022R2065#art_52
  - **Re-check** the final published text (ISAP) once it appears. It may add national procedural details
    (e.g. how UKE contacts providers) but can't change the DSA's substantive obligations.
- **Polish e-services act (UŚUDE), Dz.U. 2024 poz. 1513.** https://api.sejm.gov.pl/eli/acts/DU/2024/1513
  - **Who it binds.** Its duties bind a "usługodawca", defined as a person "która prowadząc, chociażby
    ubocznie, działalność zarobkową lub zawodową świadczy usługi drogą elektroniczną": someone who provides
    e-services while running, even as a side activity, a *commercial or professional* activity (Art. 2(6)).
    **Uncertain:** whether a donation-funded hobby site is "działalność zarobkowa" (commercial activity). If it
    is, the following apply.
  - **Art. 5: identity.** Publish "adresy elektroniczne" and "imię, nazwisko, miejsce zamieszkania i adres"
    (email addresses, and name, place of residence and address). Publishing a home address is a real privacy
    cost for an individual operator; decide deliberately.
  - **Art. 8: regulamin.** Publish a *regulamin* (terms of service) free of charge before the contract. It
    must include the types of service, technical requirements, a "zakaz dostarczania przez usługobiorcę treści
    o charakterze bezprawnym" (ban on users supplying unlawful content), how contracts are concluded and ended,
    and a complaints procedure. A Polish version of the DSA Art. 14 terms can satisfy this at the same time.
  - **Art. 14: hosting liability.** UŚUDE Art. 14 (the old national hosting safe harbour) is effectively
    superseded by DSA Art. 6, which is directly applicable. The DSA deleted e-Commerce Directive Arts. 12–15,
    which Art. 14 implemented (DSA Art. 89). The amending act may repeal or rewrite it; unverified.

## 8. Checks against the planned design (00-charting-decisions)

| Planned | Legal fit | Change needed |
|---|---|---|
| Report button with copyright and abusive/illegal reasons | Fits Art. 16 | Make it usable signed-out, or add a public email/web route. Capture explanation + location + name/email + good-faith checkbox. Name/email optional for the CSAM/child-abuse reason. Send a receipt email when an address is given. |
| Classes publish immediately, with no pre-moderation | Fine. There is no monitoring duty (Art. 8). | None |
| Takedown hides from search and pools; characters keep it | This is a visibility restriction, so it needs an Art. 17 statement of reasons | Send the author an email with the Art. 17(3) contents. Tell the notifier the outcome (Art. 16(5)). |
| Admin allowlist, small admin panel | Fine. Humans decide; mention "human review" in the terms (Art. 14(1)). | Log every decision (the audit trail supports Arts. 16–18). Add an "escalate to police" note field. |
| Delete means archive | Supports evidence and reinstatement | None |
| No terms/legal page currently (only a privacy notice drawer) | Arts. 11, 12 and 14 unmet for UGC | Add a Contact/Legal page (EN + PL): contact point, languages, content rules, moderation process, appeal route. |
