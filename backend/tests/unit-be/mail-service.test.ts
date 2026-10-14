import assert from 'node:assert/strict';
import { beforeEach, mock, test } from 'node:test';
import type { OutgoingMail } from '../../src/repositories/mail-repository.js';

type SentMail = OutgoingMail;

const state = {
  available: true,
  sendError: null as unknown,
  sent: [] as SentMail[],
  warnings: [] as unknown[],
};

beforeEach(() => {
  state.available = true;
  state.sendError = null;
  state.sent = [];
  state.warnings = [];
});

mock.module('../../src/repositories/mail-repository.js', {
  namedExports: {
    mailRepository: {
      isAvailable: () => state.available,
      send: async (mail: SentMail) => {
        if (state.sendError) {
          throw state.sendError;
        }
        state.sent.push(mail);
        return { messageId: `ses-${state.sent.length}` };
      },
    },
  },
});

const { createMailService } = await import('../../src/services/mail-service.js');
const service = () =>
  createMailService({
    error: () => {},
    warn: (obj: unknown) => {
      state.warnings.push(obj);
    },
  });

const receipt = {
  to: 'reporter@example.com',
  locale: 'en',
  reportId: 'report-42',
  className: 'Bonecutter',
};

test('without SES config nothing is sent: the caller gets "not sent" and it is logged', async () => {
  state.available = false;

  const result = await service().sendReportReceipt(receipt);

  assert.deepEqual(result, { ok: true, value: { sent: false } });
  assert.deepEqual(state.sent, []);
  assert.equal(state.warnings.length, 1);
});

test('the reporter receipt goes out in the recipient language', async () => {
  const en = await service().sendReportReceipt(receipt);
  const pl = await service().sendReportReceipt({ ...receipt, locale: 'pl-PL' });

  assert.deepEqual(en, { ok: true, value: { sent: true, messageId: 'ses-1' } });
  assert.equal(pl.ok && pl.value.sent, true);
  const [enMail, plMail] = state.sent;
  assert.equal(enMail.to, 'reporter@example.com');
  assert.match(enMail.subject, /report/i);
  assert.match(enMail.text, /report-42/);
  assert.match(enMail.text, /Bonecutter/);
  assert.match(plMail.subject, /zgłoszeni/i);
  assert.notEqual(enMail.text, plMail.text);
});

test('unknown locales fall back to English', async () => {
  await service().sendReportReceipt({ ...receipt, locale: 'de' });

  assert.equal(state.sent[0].subject, (await renderEnglishSubject()));
});

async function renderEnglishSubject(): Promise<string> {
  const before = state.sent.length;
  await service().sendReportReceipt(receipt);
  return state.sent[before].subject;
}

test('user-supplied text is escaped in HTML but kept as written in plain text', async () => {
  await service().sendReportReceipt({ ...receipt, className: '<script>alert(1)</script>' });

  const [mail] = state.sent;
  assert.ok(!mail.html.includes('<script>'));
  assert.ok(mail.html.includes('&lt;script&gt;'));
  assert.ok(mail.text.includes('<script>alert(1)</script>'));
});

test('a decision to the reporter names every redress route', async () => {
  await service().sendReportDecision({
    ...receipt,
    outcome: 'dismissed',
    explanation: 'Fan art of a published class is allowed.',
  });

  const [mail] = state.sent;
  assert.match(mail.text, /Fan art of a published class is allowed\./);
  assert.match(mail.text, /scvmrack-appeal@rpgtools\.co/);
  assert.match(mail.text, /court/i);
  assert.match(mail.text, /Digital Services Coordinator/);
});

test('the statement of reasons carries what the DSA requires, in Polish too', async () => {
  const input = {
    to: 'author@example.com',
    locale: 'pl',
    className: 'Bonecutter',
    measure: 'taken_down' as const,
    reportId: 'report-42',
    followedNotice: true,
    ground: 'copyright',
    explanation: 'Tekst skopiowany z podręcznika.',
  };

  await service().sendStatementOfReasons(input);

  const [mail] = state.sent;
  assert.equal(mail.to, 'author@example.com');
  assert.match(mail.text, /Bonecutter/);
  assert.match(mail.text, /Podstawa: treść nielegalna: naruszenie praw autorskich/);
  assert.match(mail.text, /Tekst skopiowany z podręcznika\./);
  assert.match(mail.text, /zgłoszeni/i, 'says it followed a notice');
  assert.match(mail.text, /bez użycia środków zautomatyzowanych/, 'says no automated means');
  assert.match(mail.text, /scvmrack-appeal@rpgtools\.co/);
  assert.match(mail.text, /sądu/);
  assert.match(mail.text, /koordynatora do spraw usług cyfrowych/);
  assert.match(mail.text, /report-42/, 'names the report so a dispute by email can cite it');
  assert.match(mail.text, /\/terms#moderation/);
  assert.match(mail.text, /\/terms#disputes/);
  assert.match(mail.html, /<a href="https?:\/\/[^\"]+\/terms#disputes">/);
  assert.equal(mail.replyTo, undefined, 'replies go to the default contact address');
});

test('a dispute copy goes to the appeal inbox, and replying reaches the class owner', async () => {
  await service().sendDisputeCopy({
    reportId: 'report-42',
    className: 'Bonecutter',
    ownerEmail: 'author@example.com',
    disputeText: 'I wrote every word myself.',
  });

  const [mail] = state.sent;
  assert.equal(mail.to, 'scvmrack-appeal@rpgtools.co');
  assert.equal(mail.replyTo, 'author@example.com', 'answering the dispute reaches its owner');
  assert.match(mail.text, /author@example\.com/);
  assert.match(mail.text, /I wrote every word myself\./);
});

test('a terms-change message contains the bilingual summary and effective date', async () => {
  await service().sendTermsChange({
    to: 'author@example.com',
    date: '2026-10-09',
    effectiveDate: '2026-10-23',
    summary: { en: 'New publishing rules.', pl: 'Nowe zasady publikacji.' },
  });

  const [mail] = state.sent;
  assert.equal(mail.to, 'author@example.com');
  assert.match(mail.text, /2026-10-23/);
  assert.match(mail.text, /New publishing rules/);
  assert.match(mail.text, /Nowe zasady publikacji/);
  assert.match(mail.text, /\/terms/);
});

test('an SES failure becomes a server error result', async () => {
  state.sendError = new Error('SES is down');

  const result = await service().sendReportReceipt(receipt);

  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.error.statusCode, 500);
  }
});
