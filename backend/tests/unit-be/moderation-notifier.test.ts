import assert from 'node:assert/strict';
import { mock, test } from 'node:test';

const sent: Array<{ kind: string; to?: string; locale?: string }> = [];
const ok = { ok: true, value: { sent: true, messageId: 'm' } };
mock.module('../../src/services/mail-service.js', {
  namedExports: {
    createMailService: () => ({
      sendReportReceipt: async (input: { to: string; locale?: string }) => (sent.push({ kind: 'receipt', ...input }), ok),
      sendReportDecision: async (input: { to: string; locale?: string }) => (sent.push({ kind: 'decision', ...input }), ok),
      sendStatementOfReasons: async (input: { to: string; locale?: string }) => (sent.push({ kind: 'statement', ...input }), ok),
      sendDisputeCopy: async () => (sent.push({ kind: 'dispute' }), ok),
    }),
  },
});

const { createModerationNotifier } = await import('../../src/services/moderation-notifier.js');
const notifier = createModerationNotifier({ error: () => {}, warn: () => {} });
const report = (reporterEmail: string | null) => ({
  id: 'report-1',
  reporterEmail,
  reporterLocale: 'pl',
  class: { name: 'Bog Witch', owner: { email: 'author@example.com' } },
});
const kinds = () => sent.map(({ kind, to, locale }) => `${kind}:${to ?? ''}:${locale ?? ''}`);

test('a takedown tells the reporter in their language and sends the author a statement of reasons', async () => {
  sent.length = 0;
  await notifier.decided({
    report: report('reporter@example.com'),
    outcome: 'taken_down',
    explanation: 'Credible threat',
    statement: { measure: 'taken_down', ground: 'threat_to_life_or_safety' },
  });
  assert.deepEqual(kinds(), ['decision:reporter@example.com:pl', 'statement:author@example.com:en']);
});

test('a dismissal tells only the reporter, and an anonymous report tells only the author', async () => {
  sent.length = 0;
  await notifier.decided({ report: report('reporter@example.com'), outcome: 'dismissed', explanation: 'Fine', statement: null });
  assert.deepEqual(kinds(), ['decision:reporter@example.com:pl']);

  sent.length = 0;
  await notifier.decided({
    report: report(null),
    outcome: 'content_removed',
    explanation: 'Removed',
    statement: { measure: 'content_removed', ground: 'child_sexual_abuse_material' },
  });
  assert.deepEqual(kinds(), ['statement:author@example.com:en']);
});
