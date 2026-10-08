import assert from 'node:assert/strict';
import { mock, test } from 'node:test';

const created: unknown[] = [];
const sent: { kind: string; input: unknown }[] = [];
let takeDownInput: unknown;
let merge = false;
let disputeLimited = false;
mock.module('../../src/repositories/moderation-repository.js', {
  namedExports: {
    moderationRepository: {
      findClass: async (id: number) =>
        id === 9 ? { id, name: 'Bog Witch' } : null,
      createOrMergeReport: async (input: unknown) => {
        if (!merge) created.push(input);
        return { id: '550e8400-e29b-41d4-a716-446655440000', merged: merge };
      },
      createDispute: async () =>
        disputeLimited
          ? { kind: 'limit' as const }
          : {
              kind: 'created' as const,
              dispute: { id: '550e8400-e29b-41d4-a716-446655440001' },
              report: {
                id: '550e8400-e29b-41d4-a716-446655440000',
                class: { name: 'Bog Witch', owner: { email: 'author@example.com' } },
              },
            },
      listOpenReports: async () => [
        {
          id: '550e8400-e29b-41d4-a716-446655440000',
          classId: 9,
          reason: 'threat_to_life_or_safety',
          explanation: 'Specific and credible threat.',
          reporterName: 'Reporter',
          reporterEmail: 'reporter@example.com',
          status: 'taken_down',
          disputes: [{
            id: '550e8400-e29b-41d4-a716-446655440001',
            text: 'I wrote this class.',
            createdAt: new Date('2026-10-08T12:00:00.000Z'),
          }],
          createdAt: new Date('2026-10-07T12:00:00.000Z'),
          class: { name: 'Bog Witch' },
        },
      ],
      dismissReport: async () => null,
      takeDownReport: async (id: string, actorUserId: string, reason: string) => {
        takeDownInput = { id, actorUserId, reason };
        return {
          id,
          reporterEmail: 'reporter@example.com',
          class: { name: 'Bog Witch', owner: { email: 'author@example.com' } },
        };
      },
      removeContentReport: async (id: string, actorUserId: string, reason: string) => {
        takeDownInput = { id, actorUserId, reason };
        return {
          id,
          reporterEmail: 'reporter@example.com',
          class: { name: 'Bog Witch', owner: { email: 'author@example.com' } },
        };
      },      restoreReport: async (id: string, actorUserId: string, reason: string) => {
        takeDownInput = { id, actorUserId, reason };
        return { id };
      },
    },
  },
});
mock.module('../../src/services/mail-service.js', {
  namedExports: {
    createMailService: () => ({
      sendReportReceipt: async () => ({ ok: true, value: { sent: false } }),
      sendDisputeCopy: async () => ({ ok: true, value: { sent: false } }),
      sendReportDecision: async (input: unknown) => {
        sent.push({ kind: 'decision', input });
        return { ok: true, value: { sent: false } };
      },
      sendStatementOfReasons: async (input: unknown) => {
        sent.push({ kind: 'statement', input });
        return { ok: true, value: { sent: false } };
      },
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

test('merges repeat reports from the same email and class', async () => {
  created.length = 0;
  merge = false;
  const first = await service.submit({
    classId: 9,
    reason: 'copyright',
    explanation: 'This is my work.',
    reporterName: 'Reporter',
    reporterEmail: 'reporter@example.com',
  });
  merge = true;
  const repeated = await service.submit({
    classId: 9,
    reason: 'copyright',
    explanation: 'Still copied.',
    reporterName: 'Reporter',
    reporterEmail: 'REPORTER@example.com',
  });

  assert.equal(first.ok && first.value.id, repeated.ok && repeated.value.id);
  assert.equal(created.length, 1);
  assert.deepEqual((created[0] as { reporterEmail: string }).reporterEmail, 'reporter@example.com');
  merge = false;
});
test('an owner can dispute a takedown up to the cap', async () => {
  const created = await service.dispute({
    session: { user: { id: 'gm-1' } },
    classId: 9,
    text: 'I wrote this class.',
  });
  assert.equal(created.ok && created.value.id, '550e8400-e29b-41d4-a716-446655440001');

  disputeLimited = true;
  const limited = await service.dispute({
    session: { user: { id: 'gm-1' } },
    classId: 9,
    text: 'Please review this again.',
  });
  assert.equal(!limited.ok && limited.error.code, 'DISPUTE_LIMIT');
  disputeLimited = false;
});
test('limits review actions to allowlisted GMs and notifies both parties', async () => {
  const previous = process.env.MODERATION_ADMIN_USER_IDS;
  process.env.MODERATION_ADMIN_USER_IDS = 'admin-1';
  sent.length = 0;
  takeDownInput = undefined;
  try {
    const denied = await service.listOpen({ session: { user: { id: 'other-user' } } });
    assert.equal(!denied.ok && denied.error.code, 'FORBIDDEN');

    const reports = await service.listOpen({ session: { user: { id: 'admin-1' } } });
    assert.deepEqual(reports.ok && reports.value, [
      {
        id: '550e8400-e29b-41d4-a716-446655440000',
        classId: 9,
        className: 'Bog Witch',
        reason: 'threat_to_life_or_safety',
        explanation: 'Specific and credible threat.',
        reporterName: 'Reporter',
        reporterEmail: 'reporter@example.com',
        status: 'taken_down',
        disputes: [{
          id: '550e8400-e29b-41d4-a716-446655440001',
          text: 'I wrote this class.',
          createdAt: '2026-10-08T12:00:00.000Z',
        }],
        createdAt: '2026-10-07T12:00:00.000Z',
        serious: true,
      },
    ]);

    const result = await service.takeDown({
      session: { user: { id: 'admin-1' } },
      id: '550e8400-e29b-41d4-a716-446655440000',
      reason: '  Credible threat  ',
    });
    assert.equal(result.ok && result.value.takenDown, true);
    assert.deepEqual(takeDownInput, {
      id: '550e8400-e29b-41d4-a716-446655440000',
      actorUserId: 'admin-1',
      reason: 'Credible threat',
    });
    assert.deepEqual(sent, [
      {
        kind: 'decision',
        input: {
          to: 'reporter@example.com', locale: 'en',
          reportId: '550e8400-e29b-41d4-a716-446655440000',
          className: 'Bog Witch', outcome: 'taken_down', explanation: 'Credible threat',
        },
      },
      {
        kind: 'statement',
        input: {
          to: 'author@example.com', locale: 'en', className: 'Bog Witch',
          measure: 'taken_down', followedNotice: true, ground: 'Credible threat',
          explanation: 'Credible threat', reportId: '550e8400-e29b-41d4-a716-446655440000',
        },
      },
    ]);

    const missingReason = await service.takeDown({
      session: { user: { id: 'admin-1' } },
      id: '550e8400-e29b-41d4-a716-446655440000',
      reason: ' ',
    });
    assert.equal(!missingReason.ok && missingReason.error.code, 'MODERATION_REASON_REQUIRED');
  } finally {
    if (previous === undefined) delete process.env.MODERATION_ADMIN_USER_IDS;
    else process.env.MODERATION_ADMIN_USER_IDS = previous;
  }
});
test('restores only a taken-down report through an allowlisted GM', async () => {
  const previous = process.env.MODERATION_ADMIN_USER_IDS;
  process.env.MODERATION_ADMIN_USER_IDS = 'admin-1';
  try {
    const denied = await service.restore({
      session: { user: { id: 'other-user' } },
      id: '550e8400-e29b-41d4-a716-446655440000',
      reason: 'Correcting the decision',
    });
    assert.equal(!denied.ok && denied.error.code, 'FORBIDDEN');

    const restored = await service.restore({
      session: { user: { id: 'admin-1' } },
      id: '550e8400-e29b-41d4-a716-446655440000',
      reason: '  Correcting the decision  ',
    });
    assert.equal(restored.ok && restored.value.restored, true);
    assert.deepEqual(takeDownInput, {
      id: '550e8400-e29b-41d4-a716-446655440000',
      actorUserId: 'admin-1',
      reason: 'Correcting the decision',
    });
  } finally {
    if (previous === undefined) delete process.env.MODERATION_ADMIN_USER_IDS;
    else process.env.MODERATION_ADMIN_USER_IDS = previous;
  }
});
test('removes content through an allowlisted GM and notifies both parties', async () => {
  const previous = process.env.MODERATION_ADMIN_USER_IDS;
  process.env.MODERATION_ADMIN_USER_IDS = 'admin-1';
  sent.length = 0;
  takeDownInput = undefined;
  try {
    const result = await service.removeContent({
      session: { user: { id: 'admin-1' } },
      id: '550e8400-e29b-41d4-a716-446655440000',
      reason: '  Illegal copied text  ',
    });
    assert.equal(result.ok && result.value.contentRemoved, true);
    assert.deepEqual(takeDownInput, {
      id: '550e8400-e29b-41d4-a716-446655440000',
      actorUserId: 'admin-1',
      reason: 'Illegal copied text',
    });
    assert.deepEqual(sent, [
      {
        kind: 'decision',
        input: {
          to: 'reporter@example.com', locale: 'en',
          reportId: '550e8400-e29b-41d4-a716-446655440000',
          className: 'Bog Witch', outcome: 'content_removed', explanation: 'Illegal copied text',
        },
      },
      {
        kind: 'statement',
        input: {
          to: 'author@example.com', locale: 'en', className: 'Bog Witch',
          measure: 'content_removed', followedNotice: true, ground: 'Illegal copied text',
          explanation: 'Illegal copied text', reportId: '550e8400-e29b-41d4-a716-446655440000',
        },
      },
    ]);
  } finally {
    if (previous === undefined) delete process.env.MODERATION_ADMIN_USER_IDS;
    else process.env.MODERATION_ADMIN_USER_IDS = previous;
  }
});