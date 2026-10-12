import assert from 'node:assert/strict';
import { mock, test } from 'node:test';

const created: unknown[] = [];
const sent: { kind: string; input: unknown }[] = [];
let takeDownInput: unknown;
let merge = false;
let disputeLimited = false;
let anonymizeBefore: Date | undefined;
let listCalls = 0;
let reportClass: { id: number; name: string; source: 'user'; visibility: 'private' | 'public' } = {
  id: 9,
  name: 'Bog Witch',
  source: 'user',
  visibility: 'public',
};
mock.module('../../src/repositories/moderation-repository.js', {
  namedExports: {
    moderationRepository: {
      findClass: async (id: number) =>
        id === 9 ? reportClass : null,
      createOrMergeReport: async (input: unknown) => {
        if (!merge) {
          created.push(input);
        }
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
      listOpenReports: async () => {
        listCalls++;
        return {
          reports: [
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
            class: { name: 'Bog Witch', lineageId: 'lineage-1', version: 1, ownerUserId: 'gm-1' },
          },
          {
            id: '550e8400-e29b-41d4-a716-446655440002',
            classId: 10,
            reason: 'other',
            explanation: 'The latest version needs review.',
            reporterName: 'Another reporter',
            reporterEmail: 'another@example.com',
            status: 'open',
            disputes: [],
            createdAt: new Date('2026-10-08T13:00:00.000Z'),
            class: { name: 'Bog Witch', lineageId: 'lineage-1', version: 2, ownerUserId: 'gm-1' },
          },
          ],
          versions: [
          { id: 10, lineageId: 'lineage-1', name: 'Bog Witch', version: 2 },
          { id: 9, lineageId: 'lineage-1', name: 'Bog Witch', version: 1 },
          ],
          removalLogs: [
          { id: 'log-3', reportId: 'report-2', action: 'taken_down', reason: 'Repeated copying', createdAt: new Date('2026-10-09T12:00:00.000Z'), class: { name: 'Bog Witch', ownerUserId: 'gm-1' } },
          { id: 'log-2', reportId: 'report-1', action: 'restored', reason: 'Appeal upheld', createdAt: new Date('2026-10-08T12:00:00.000Z'), class: { name: 'Bog Witch', ownerUserId: 'gm-1' } },
          { id: 'log-1', reportId: 'report-1', action: 'content_removed', reason: 'Copied text', createdAt: new Date('2026-10-07T12:00:00.000Z'), class: { name: 'Bog Witch', ownerUserId: 'gm-1' } },
          ],
        };
      },
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
      anonymizeResolvedReports: async (before: Date) => {
        anonymizeBefore = before;
        return { count: 2 };
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

const { createModerationService, anonymizeExpiredModerationReports } = await import(
  '../../src/services/moderation-service.js'
);
const service = createModerationService({ error: () => {}, warn: () => {} });

test('rejects a whitespace-only report explanation', async () => {
  const before = created.length;
  const result = await service.submit({
    classId: 9,
    reason: 'copyright',
    explanation: '  \t  ',
    reporterName: 'Reporter',
    reporterEmail: 'reporter@example.com',
  });

  assert.equal(!result.ok && result.error.code, 'REPORT_EXPLANATION_REQUIRED');
  assert.equal(created.length, before);
});

test('anonymizes reporter details two years after resolution', async () => {
  const result = await anonymizeExpiredModerationReports(
    new Date('2026-10-08T12:00:00.000Z')
  );

  assert.equal(result.count, 2);
  assert.equal(anonymizeBefore?.toISOString(), '2024-10-08T12:00:00.000Z');
});

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

test('does not accept reports for a private Custom Class', async () => {
  reportClass = { ...reportClass, visibility: 'private' };
  const result = await service.submit({
    classId: 9,
    reason: 'other',
    explanation: 'Not public.',
    reporterName: 'Reporter',
    reporterEmail: 'reporter@example.com',
  });
  assert.equal(!result.ok && result.error.code, 'CLASS_NOT_FOUND');
  reportClass = { ...reportClass, visibility: 'public' };
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
  listCalls = 0;
  try {
    const denied = await service.listOpen({ session: { user: { id: 'other-user' } } });
    assert.equal(!denied.ok && denied.error.statusCode, 404);
    assert.equal(listCalls, 0);
    for (const action of [service.dismiss, service.takeDown, service.removeContent]) {
      const deniedAction = await action({
        session: { user: { id: 'other-user' } },
        id: '550e8400-e29b-41d4-a716-446655440000',
        reason: 'Decision',
      });
      assert.equal(!deniedAction.ok && deniedAction.error.statusCode, 404);
    }

    const reports = await service.listOpen({ session: { user: { id: 'admin-1' } } });
    assert.equal(listCalls, 1);
    assert.deepEqual(reports.ok && reports.value, [
      {
        lineageId: 'lineage-1',
        ownerUserId: 'gm-1',
        latest: { id: 10, lineageId: 'lineage-1', name: 'Bog Witch', version: 2 },
        versions: [
          { id: 10, lineageId: 'lineage-1', name: 'Bog Witch', version: 2 },
          { id: 9, lineageId: 'lineage-1', name: 'Bog Witch', version: 1 },
        ],
        removalHistory: [
          { id: 'log-3', className: 'Bog Witch', date: '2026-10-09T12:00:00.000Z', reason: 'Repeated copying', restored: false },
          { id: 'log-1', className: 'Bog Witch', date: '2026-10-07T12:00:00.000Z', reason: 'Copied text', restored: true },
        ],
        reports: [
          {
            id: '550e8400-e29b-41d4-a716-446655440000',
            classId: 9,
            className: 'Bog Witch',
            lineageId: 'lineage-1',
            classVersion: 1,
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
          {
            id: '550e8400-e29b-41d4-a716-446655440002',
            classId: 10,
            className: 'Bog Witch',
            lineageId: 'lineage-1',
            classVersion: 2,
            reason: 'other',
            explanation: 'The latest version needs review.',
            reporterName: 'Another reporter',
            reporterEmail: 'another@example.com',
            status: 'open',
            disputes: [],
            createdAt: '2026-10-08T13:00:00.000Z',
            serious: false,
          },
        ],
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
    if (previous === undefined) {
      delete process.env.MODERATION_ADMIN_USER_IDS;
    } else {
      process.env.MODERATION_ADMIN_USER_IDS = previous;
    }
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
    assert.equal(!denied.ok && denied.error.statusCode, 404);

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
    if (previous === undefined) {
      delete process.env.MODERATION_ADMIN_USER_IDS;
    } else {
      process.env.MODERATION_ADMIN_USER_IDS = previous;
    }
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
    if (previous === undefined) {
      delete process.env.MODERATION_ADMIN_USER_IDS;
    } else {
      process.env.MODERATION_ADMIN_USER_IDS = previous;
    }
  }
});
