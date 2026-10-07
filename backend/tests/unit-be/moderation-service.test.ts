import assert from 'node:assert/strict';
import { mock, test } from 'node:test';

const created: unknown[] = [];
mock.module('../../src/repositories/moderation-repository.js', {
  namedExports: {
    moderationRepository: {
      findClass: async (id: number) =>
        id === 9 ? { id, name: 'Bog Witch' } : null,
      createReport: async (input: unknown) => {
        created.push(input);
        return { id: '550e8400-e29b-41d4-a716-446655440000' };
      },
    },
  },
});
mock.module('../../src/services/mail-service.js', {
  namedExports: {
    createMailService: () => ({
      sendReportReceipt: async () => ({ ok: true, value: { sent: false } }),
    }),
  },
});

const { createModerationService } = await import(
  '../../src/services/moderation-service.js'
);
const service = createModerationService({ error: () => {}, warn: () => {} });

test('requires contact for ordinary reports but allows anonymous CSAM reports', async () => {
  created.length = 0;
  const missingContact = await service.submit({
    classId: 9,
    reason: 'copyright',
    explanation: 'This is my work.',
  });
  const csam = await service.submit({
    classId: 9,
    reason: 'child_sexual_abuse_material',
    explanation: 'Remove this material.',
  });

  assert.equal(
    !missingContact.ok && missingContact.error.code,
    'REPORTER_CONTACT_REQUIRED'
  );
  assert.equal(
    csam.ok && csam.value.id,
    '550e8400-e29b-41d4-a716-446655440000'
  );
  assert.deepEqual(created, [
    {
      classId: 9,
      reason: 'child_sexual_abuse_material',
      explanation: 'Remove this material.',
      reporterName: null,
      reporterEmail: null,
    },
  ]);
});
