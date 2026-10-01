# Privacy notice

<!-- DRAFT (ticket 23) for the owner's review and a Polish lawyer's review before public Custom Classes ship.
     Not legal advice. The Polish version (privacy.pl.md) is the binding one; this is a translation.
     [CONFIRM] = a fact about the deployment not readable from this repo; check it before publishing.
     [OWNER]   = needs an owner decision; the text shows the current state or a proposal.
     Processors checked 2026-10-01 against compose.prod.yaml, .woodpecker/deploy.yaml, Caddyfile.example,
     frontend/index.html, frontend/src/analytics, frontend/src/instrument.ts, backend/src/instrument.ts,
     backend/prisma/schema.prisma. -->

Last updated: [date of publication]

This notice explains what personal data Scvm Rack (scvmrack.rpgtools.co, "the service") processes, why, for how long, who else receives it, and what rights you have. It meets the information duties of Articles 13 and 14 of the General Data Protection Regulation (EU) 2016/679 ("GDPR").

## 1. Who is responsible

The controller of your personal data is **Adam Kościelniak**, who runs Scvm Rack as a non-commercial hobby project within rpgtools.co.

Contact for anything about your data: **contact@rpgtools.co** (Polish or English). More contact details are on the [Contact](/legal) page.

There is no data protection officer; the law does not require one for this service.

## 2. What we process, why, and on what legal basis

| What | Data | Why | Legal basis (GDPR) |
|---|---|---|---|
| **Your account** | Email address, display name and sign-in identifiers from the rpgtools.co sign-in (Logto); account creation date | To let you sign in, keep your characters and parties, and let you use the GM tools | Art. 6(1)(b): performing the agreement in the [terms](/terms) |
| **Sessions (guests and accounts)** | A session cookie, a random user id, and the IP address and browser type (user agent) recorded with the session | To keep you signed in, or keep a guest's character tied to their browser, and to secure the service | Art. 6(1)(b); for the IP address and user agent, Art. 6(1)(f): our legitimate interest in securing the service |
| **Characters, parties and Custom Classes** | Whatever you enter: character sheets, notes, party names, Custom Classes and their drafts. Please don't put personal data in them. | To provide the service | Art. 6(1)(b) |
| **Public authorship** | Your account's display name, shown as "created by {name}" on a Custom Class you publish | To credit you as the author, as the terms describe | Art. 6(1)(b) |
| **Owlbear Rodeo extension** | Owlbear Rodeo room and player identifiers linked to your characters | To show your characters in an Owlbear Rodeo room | Art. 6(1)(b) |
| **Reports** | The reporter's name, email, the explanation and the reported class; for reports of child sexual abuse material, name and email are optional | To handle reports of illegal or prohibited content, send a receipt and the decision | Art. 6(1)(c): the legal obligation in Art. 16 of the Digital Services Act (Regulation (EU) 2022/2065, "DSA") |
| **Moderation decisions and disputes** | The decision, its reasons, the author's account, the dispute text, and the content that was moderated | To give authors a statement of reasons and handle disputes; to keep evidence of what was decided and why | Art. 6(1)(c): DSA Arts. 16–17, and Art. 6 of Regulation (EU) 2021/784 on terrorist content online; Art. 6(1)(f): establishing, exercising or defending legal claims |
| **Reports to authorities** | The reported content and the information needed to identify who posted it | To inform the police or prosecutor when content suggests a crime threatening someone's life or safety, and to answer orders from authorities | Art. 6(1)(c): DSA Arts. 9, 10 and 18; Art. 240 of the Polish Penal Code |
| **Emails we send** | Your email address and the message | Report receipts and decisions, statements of reasons, dispute copies, and notices of significant changes to the terms | Art. 6(1)(c) (DSA Arts. 14(2), 16, 17) and Art. 6(1)(b) |
| **Contact by email** | Your email and what you write to contact@rpgtools.co or scvmrack-appeal@rpgtools.co | To answer you | Art. 6(1)(b) or (c), depending on the request; otherwise Art. 6(1)(f) |
| **Error monitoring** | Technical error reports: the page, the browser, the error, your random user id and whether you are a guest; feedback you choose to send through the error or feedback form | To find and fix faults | Art. 6(1)(f): our legitimate interest in a working service |
| **Rate limits and abuse prevention** | Your IP address, held briefly in memory | To stop one visitor flooding the service, as the terms describe | Art. 6(1)(f) |
| **Google Analytics** (only with your consent) | Pages visited, device and browser details, approximate location, an analytics cookie identifier | To understand how the service is used | Art. 6(1)(a): your consent, which you can withdraw at any time |

You don't have to give us any personal data to use the service as a guest. An account needs an email address. A report needs a name and email (except reports of child sexual abuse material), because the DSA requires notices to identify the reporter.

We don't sell your data, show ads, or make decisions about you by automated means. Moderation decisions are made by a person.

## 3. Browser storage and cookies

The service stores some things in your browser:

- **Necessary**: the session cookie, your language, your active character, and your privacy choices. The service can't work without them, so they don't need consent.
- **Analytics**: Google Analytics cookies, set only if you allow analytics in the privacy panel ("Blood Oath").

You can change your analytics choice at any time from the privacy link in the footer. The panel keeps that choice; this notice explains the rest.

<!-- [OWNER] Today the panel's analytics switch starts ON and saving the panel counts as agreement
     (frontend/src/privacy/privacySettings.ts: analyticsEnabled defaults to true). Consent to analytics
     cookies must be an active opt-in (CJEU C-673/17 Planet49). Recommended: default the switch to OFF.
     Until that changes, this paragraph is not accurate. -->

## 4. How long we keep it

| Data | How long |
|---|---|
| Guest characters | 7 days <!-- [CONFIRM] the deletion job: the FAQ promises 7 days, but no cleanup job is in this repo; it may live in @tackgnol/rpgtools-shared-auth --> |
| Unsaved class creator drafts | 90 days after the last change |
| Account data, characters, parties and Custom Classes | Until you delete them or ask us to remove your account. Content that other players' characters already use stays in those characters without your name (terms §4, §11) |
| Session records (IP address, user agent) | Until the session ends <!-- [CONFIRM] how long expired session rows are kept --> |
| Reporters' names, emails and identifying details | 2 years after the report is decided; the report is then kept marked "reporter details removed" |
| Moderation decisions, disputes and moderated content | Permanently, as evidence of what was decided and why <!-- [OWNER/COUNSEL] see counsel question 6 --> |
| Error reports | [CONFIRM GlitchTip's retention setting] |
| Emails to contact@ and scvmrack-appeal@ | As long as needed to deal with the matter, then up to [OWNER: e.g. 2 years] |
| Google Analytics data | [CONFIRM the GA4 data retention setting: 2 or 14 months] |
| Server access logs | [CONFIRM: Caddy, nginx and Cloudflare log retention] |

## 5. Who else receives your data

We use these service providers. They process data for us under data processing terms (GDPR Art. 28):

| Provider | What for | Where | Transfers outside the EEA |
|---|---|---|---|
| [CONFIRM: hosting provider] | The server that runs the service, its database, and error monitoring | [CONFIRM: country] | [CONFIRM] |
| Cloudflare, Inc. | Domain name, encrypted connection and network protection: every request to the service passes through Cloudflare | Global network | USA: EU–US Data Privacy Framework and standard contractual clauses |
| Logto (the rpgtools.co sign-in at auth.rpgtools.co) | Accounts and sign-in | [CONFIRM: self-hosted on our server, or Logto Cloud and its region] | [CONFIRM] |
| Amazon Web Services EMEA SARL (Amazon SES) | Sending emails | [CONFIRM: AWS region, from roster] | USA possible: EU–US Data Privacy Framework and standard contractual clauses |
| Google Ireland Ltd (Google Analytics), only with your consent | Usage statistics | EU and USA | USA: EU–US Data Privacy Framework |
| Google Ireland Ltd (Google Fonts) | Fonts for the interface; your browser asks Google for them, which shows Google your IP address | EU and USA | USA: EU–US Data Privacy Framework <!-- [OWNER] recommended: self-host the fonts, then delete this row --> |

Error monitoring runs on our own GlitchTip server (glitchtip.rpgtools.co). Browser errors are sent through our own backend first, so GlitchTip doesn't receive your IP address directly. <!-- [CONFIRM] GlitchTip runs on the same hosting as above -->

Others may receive data as separate controllers:

- **Other users** see public Custom Classes with their author's display name, and the characters and parties you share with them.
- **The police, the public prosecutor or other authorities**, when the law requires it (section 2).
- **The author of a reported class**, who may learn a copyright reporter's name if that's needed to settle the dispute (DSA recital 54). <!-- [OWNER] not yet decided: ticket 07 doesn't say whether a copyright reporter's identity is shared with the author. -->
- **Owlbear Rodeo and itch.io**, if you use Scvm Rack inside them. They are responsible for their own processing.

## 6. Your rights

You have the right to:

- **access** your data and get a copy (Art. 15);
- **rectification** of inaccurate data (Art. 16);
- **erasure** (Art. 17), for example by asking us to remove your account;
- **restriction** of processing (Art. 18);
- **data portability** for data you gave us under the agreement or your consent (Art. 20);
- **object** to processing based on our legitimate interests (Art. 21);
- **withdraw your consent** to analytics at any time, from the privacy panel. Withdrawing doesn't affect processing before it (Art. 7(3)).

Write to contact@rpgtools.co from your account's email. We answer within one month (Art. 12(3)). Some rights are limited where we must keep data by law, for example moderation records (Art. 17(3)(b) and (e)).

You can also complain to the Polish data protection authority: **Prezes Urzędu Ochrony Danych Osobowych**, ul. Stawki 2, 00-193 Warszawa, uodo.gov.pl. If you live elsewhere in the EU, you can complain to the authority there.

## 7. Age

The service is for people aged 16 and over, or younger with a parent's or guardian's consent (terms §3). Consent to analytics from someone under 16 needs a parent's or guardian's consent (GDPR Art. 8).

## 8. Changes

The date at the top shows the last change. We announce significant changes the same way as changes to the terms (terms §14).

The Polish version of this notice is the binding one; this English version is a translation.
