// Email wording mirrors the draft terms (§7–§9). Redress text must stay in step
// with them: the DSA requires decisions and statements of reasons to name every route.

import type { ModerationReportReason } from '@prisma/client';
import type { SupportedLocale } from '../config/locales.js';
import { REMOVAL_MARKER } from '../lib/class-model.js';
import type { ReportMeasure } from '../lib/moderation-model.js';

export type MailLocale = SupportedLocale;

export type RenderedMail = { subject: string; text: string; html: string; replyTo?: string };

export type ReportReceiptInput = { reportId: string; className: string };

export type ReportDecisionInput = ReportReceiptInput & {
  outcome: 'dismissed' | 'taken_down' | 'content_removed';
  explanation: string;
};

export type StatementOfReasonsInput = {
  className: string;
  measure: ReportMeasure;
  /** True when the decision followed someone's report, false for the operator's own check. */
  followedNotice: boolean;
  /** The category of illegal content or terms breach the decision rests on. */
  ground: ModerationReportReason;
  explanation: string;
  /** The report it followed, so the author can cite it when disputing by email. */
  reportId?: string | null;
};

export type DisputeCopyInput = {
  reportId: string | null;
  className: string;
  ownerEmail: string;
  disputeText: string;
};

export type TermsChangeInput = {
  date: string;
  effectiveDate: string;
  summary: { en: string; pl: string };
};

export const APPEAL_ADDRESS = 'scvmrack-appeal@rpgtools.co';

const SIGN_OFF = '— Scvm Rack';

/** The recipient's mail language: Polish for any `pl` locale, English otherwise. */
export function mailLocale(locale: string | null | undefined): MailLocale {
  return locale?.toLowerCase().startsWith('pl') ? 'pl' : 'en';
}

const copy = {
  en: {
    noAutomation: 'The decision was made by a person, without automated means.',
    reference: (id: string) => `Report reference: ${id}`,
    receiptSubject: (id: string) => `We received your report (#${id})`,
    receiptBody: (name: string) => [
      `Thank you for reporting the class "${name}" on Scvm Rack.`,
      'A person will review it. We will email you the decision and how you can challenge it.',
    ],
    decisionSubject: (id: string) => `Decision on your report (#${id})`,
    outcome: {
      dismissed: (name: string) => `We reviewed your report about the class "${name}" and took no action.`,
      taken_down: (name: string) => `We reviewed your report about the class "${name}" and took the class down.`,
      content_removed: (name: string) => `We reviewed your report about the class "${name}" and removed its content.`,
    },
    reason: (text: string) => `Reason: ${text}`,
    reporterRedress: `If you disagree, write to ${APPEAL_ADDRESS}. A dispute is reviewed by a person, and you get an answer by email. You can also take the decision to court, or complain to the Digital Services Coordinator. Disputing it with us first is not required.`,
    reasonsSubject: (name: string) => `Decision about your class "${name}"`,
    measure: {
      taken_down: (name: string) =>
        `We took down your class "${name}": it no longer appears in search, pickers or class pools, and no new characters can be rolled from it. Characters already rolled keep it. This lasts until the class is restored.`,
      content_removed: (name: string) =>
        `We removed the content of your class "${name}": its text is replaced with "${REMOVAL_MARKER}" everywhere it appears, including in existing characters. This lasts until the class is restored.`,
    },
    facts: (followedNotice: boolean) =>
      followedNotice ? 'This followed a report from someone else.' : 'This followed our own review.',
    found: (text: string) => `What we found: ${text}`,
    ground: (text: string) => `Ground: ${text}`,
    grounds: {
      copyright: 'illegal content: copyright infringement',
      child_sexual_abuse_material: 'illegal content: child sexual abuse material',
      threat_to_life_or_safety: 'illegal content: threat to life or safety',
      terrorist_content: 'illegal content: terrorist content',
      other_illegal_content: 'illegal content',
      abusive_or_hateful: 'Terms of Service: abusive or hateful content',
      owner_removal: 'Terms of Service: removal requested by the owner',
      other: 'Terms of Service',
    },
    authorRedress: `To dispute it, use "Dispute this decision" on the notice in the app, or write to ${APPEAL_ADDRESS}. You can dispute a decision up to 3 times. A dispute is reviewed by a person, and you get an answer by email. You can also take the decision to court, or complain to the Digital Services Coordinator. Disputing it with us first is not required.`,
  },
  pl: {
    noAutomation: 'Decyzję podjął człowiek, bez użycia środków zautomatyzowanych.',
    reference: (id: string) => `Numer zgłoszenia: ${id}`,
    receiptSubject: (id: string) => `Otrzymaliśmy Twoje zgłoszenie (#${id})`,
    receiptBody: (name: string) => [
      `Dziękujemy za zgłoszenie klasy „${name}” w Scvm Rack.`,
      'Zgłoszenie rozpatrzy człowiek. Decyzję i informację, jak można ją zakwestionować, prześlemy e-mailem.',
    ],
    decisionSubject: (id: string) => `Decyzja w sprawie Twojego zgłoszenia (#${id})`,
    outcome: {
      dismissed: (name: string) => `Rozpatrzyliśmy Twoje zgłoszenie dotyczące klasy „${name}” i nie podjęliśmy działań.`,
      taken_down: (name: string) => `Rozpatrzyliśmy Twoje zgłoszenie dotyczące klasy „${name}” i zdjęliśmy tę klasę.`,
      content_removed: (name: string) => `Rozpatrzyliśmy Twoje zgłoszenie dotyczące klasy „${name}” i usunęliśmy jej treść.`,
    },
    reason: (text: string) => `Uzasadnienie: ${text}`,
    reporterRedress: `Jeśli się nie zgadzasz, napisz na ${APPEAL_ADDRESS}. Odwołanie rozpatruje człowiek, a odpowiedź otrzymasz e-mailem. Możesz też skierować sprawę do sądu albo złożyć skargę do koordynatora do spraw usług cyfrowych. Wcześniejsze odwołanie do nas nie jest do tego wymagane.`,
    reasonsSubject: (name: string) => `Decyzja dotycząca Twojej klasy „${name}”`,
    measure: {
      taken_down: (name: string) =>
        `Zdjęliśmy Twoją klasę „${name}”: nie pojawia się już w wyszukiwaniu, wyborze klas ani pulach klas drużyn i nie można z niej losować nowych postaci. Postacie już wylosowane ją zachowują. Obowiązuje to do czasu przywrócenia klasy.`,
      content_removed: (name: string) =>
        `Usunęliśmy treść Twojej klasy „${name}”: jej tekst zastąpiono napisem „[usunięte przez moderację]” wszędzie, gdzie się pojawia, także w istniejących postaciach. Obowiązuje to do czasu przywrócenia klasy.`,
    },
    facts: (followedNotice: boolean) =>
      followedNotice ? 'Decyzja zapadła po zgłoszeniu od innej osoby.' : 'Decyzja zapadła w wyniku naszej własnej weryfikacji.',
    found: (text: string) => `Co ustaliliśmy: ${text}`,
    ground: (text: string) => `Podstawa: ${text}`,
    grounds: {
      copyright: 'treść nielegalna: naruszenie praw autorskich',
      child_sexual_abuse_material: 'treść nielegalna: materiały przedstawiające seksualne wykorzystywanie dzieci',
      threat_to_life_or_safety: 'treść nielegalna: zagrożenie życia lub bezpieczeństwa',
      terrorist_content: 'treść nielegalna: treści terrorystyczne',
      other_illegal_content: 'treść nielegalna',
      abusive_or_hateful: 'Regulamin: treści obraźliwe lub nienawistne',
      owner_removal: 'Regulamin: usunięcie na wniosek właściciela',
      other: 'Regulamin',
    },
    authorRedress: `Aby się odwołać, użyj przycisku „Odwołaj się od decyzji” w komunikacie w aplikacji albo napisz na ${APPEAL_ADDRESS}. Od jednej decyzji możesz odwołać się do 3 razy. Odwołanie rozpatruje człowiek, a odpowiedź otrzymasz e-mailem. Możesz też skierować sprawę do sądu albo złożyć skargę do koordynatora do spraw usług cyfrowych. Wcześniejsze odwołanie do nas nie jest do tego wymagane.`,
  },
} as const;

export function reportReceipt(locale: MailLocale, input: ReportReceiptInput): RenderedMail {
  const c = copy[locale];
  return render(c.receiptSubject(input.reportId), [
    ...c.receiptBody(input.className),
    c.reference(input.reportId),
    SIGN_OFF,
  ]);
}

export function reportDecision(locale: MailLocale, input: ReportDecisionInput): RenderedMail {
  const c = copy[locale];
  return render(c.decisionSubject(input.reportId), [
    c.outcome[input.outcome](input.className),
    c.reason(input.explanation),
    c.noAutomation,
    c.reporterRedress,
    c.reference(input.reportId),
    SIGN_OFF,
  ]);
}

export function statementOfReasons(locale: MailLocale, input: StatementOfReasonsInput): RenderedMail {
  const c = copy[locale];
  const termsBase = process.env.APP_BASE_URL || 'https://scvmrack.rpgtools.co';
  const termsLinks = [
    { label: locale === 'pl' ? 'Zasady moderacji' : 'Moderation terms', url: new URL('/terms#moderation', termsBase).toString() },
    { label: locale === 'pl' ? 'Odwołania' : 'Disputes', url: new URL('/terms#disputes', termsBase).toString() },
  ];
  const mail = render(c.reasonsSubject(input.className), [
    c.measure[input.measure](input.className),
    c.facts(input.followedNotice),
    c.found(input.explanation),
    c.ground(c.grounds[input.ground]),
    c.noAutomation,
    c.authorRedress,
    ...(input.reportId ? [c.reference(input.reportId)] : []),
    SIGN_OFF,
  ]);
  return {
    ...mail,
    text: `${mail.text}\n\n${termsLinks.map(({ label, url }) => `${label}: ${url}`).join('\n')}`,
    html: `${mail.html}\n${termsLinks.map(({ label, url }) => `<p><a href="${escapeHtml(url)}">${escapeHtml(label)}</a></p>`).join('\n')}`,
  };
}

/** Internal copy for the appeal inbox, always in English; replying reaches the author. */
export function disputeCopy(input: DisputeCopyInput): RenderedMail {
  return render(
    `Dispute: ${input.className}`,
    [
      'A dispute was filed in Scvm Rack.',
      `Class: ${input.className}`,
      `Report: ${input.reportId ?? 'none (own-initiative decision)'}`,
      `Owner: ${input.ownerEmail}`,
      `Dispute: ${input.disputeText}`,
    ],
    input.ownerEmail,
  );
}

/** Gives public-class authors the binding English notice and a Polish courtesy copy. */
export function termsChangeNotice(input: TermsChangeInput): RenderedMail {
  const termsUrl = new URL('/terms', process.env.APP_BASE_URL || 'https://scvmrack.rpgtools.co').toString();
  return render(`Scvm Rack terms change on ${input.effectiveDate}`, [
    `We updated the terms on ${input.date}. The change takes effect on ${input.effectiveDate}, at least 14 days after this notice.`,
    input.summary.en,
    `Read the binding English terms: ${termsUrl}`,
    `Polski tekst pomocniczy: Zmieniliśmy regulamin ${input.date}. Zmiana wejdzie w życie ${input.effectiveDate}.`,
    input.summary.pl,
    `Regulamin po polsku: ${termsUrl}`,
    SIGN_OFF,
  ]);
}

function render(subject: string, paragraphs: string[], replyTo?: string): RenderedMail {
  return {
    subject,
    ...(replyTo ? { replyTo } : {}),
    text: paragraphs.join('\n\n'),
    html: paragraphs.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join('\n'),
  };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
