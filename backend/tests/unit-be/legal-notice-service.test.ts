import assert from 'node:assert/strict';
import { beforeEach, mock, test } from 'node:test';

const state = {
  authors: [{ email: 'first@example.com' }, { email: 'second@example.com' }],
  sentTo: [] as string[],
  available: true,
};

beforeEach(() => {
  state.authors = [{ email: 'first@example.com' }, { email: 'second@example.com' }];
  state.sentTo = [];
  state.available = true;
});

mock.module('../../src/repositories/legal-notice-repository.js', {
  namedExports: {
    legalNoticeRepository: { listPublicClassAuthorEmails: async () => state.authors },
  },
});
mock.module('../../src/services/mail-service.js', {
  namedExports: {
    createMailService: () => ({
      sendTermsChange: async ({ to }: { to: string }) => {
        if (!state.available) return { ok: true, value: { sent: false } };
        state.sentTo.push(to);
        return { ok: true, value: { sent: true, messageId: to } };
      },
    }),
  },
});

const { sendPublicClassTermsNotice } = await import('../../src/services/legal-notice-service.js');
const notice = {
  date: '2026-10-09',
  effectiveDate: '2026-10-23',
  summary: { en: 'New publishing rules.', pl: 'Nowe zasady publikacji.' },
};
const log = { error: () => {}, warn: () => {} };

test('preview counts public-class authors without sending', async () => {
  const result = await sendPublicClassTermsNotice({ ...notice, send: false }, log);
  assert.deepEqual(result, { ok: true, value: { recipients: 2, sent: 0 } });
  assert.deepEqual(state.sentTo, []);
});

test('send mode mails every author once', async () => {
  const result = await sendPublicClassTermsNotice({ ...notice, send: true }, log);
  assert.deepEqual(result, { ok: true, value: { recipients: 2, sent: 2 } });
  assert.deepEqual(state.sentTo, ['first@example.com', 'second@example.com']);
});

test('send mode fails closed when SES is unavailable', async () => {
  state.available = false;
  const result = await sendPublicClassTermsNotice({ ...notice, send: true }, log);
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.error.statusCode, 503);
  assert.deepEqual(state.sentTo, []);
});
