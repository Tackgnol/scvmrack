import assert from 'node:assert/strict';
import { mock, test } from 'node:test';

const created: unknown[] = [];
const sent: { kind: string; input: unknown }[] = [];
let takeDownInput: unknown;
let merge = false;
let disputeLimited = false;
let anonymizeBefore: Date | undefined;
let listCalls = 0;
let reportClass: { id: number; name: string; source: 'user'; visibility: 'private' | 'public'; takenDownAt: Date | null } = {
  id: 9,
  name: 'Bog Witch',
  source: 'user',
  visibility: 'public',
  takenDownAt: null,
};
/** The fake report's status, and the writes the fake transaction records. */
let reportStatus = 'open';
let stillInForce: string[] = [];
let earlierRemoval: { versions: unknown[] } | null = null;
const writes: string[] = [];
let decidedSource = 'user';
const decidedReport = (id: string) => ({
  id,
  classId: 9,
  status: reportStatus,
  reporterEmail: 'reporter@example.com',
  reporterLocale: 'en',
  class: { id: 9, name: 'Bog Witch', lineageId: 'lineage-1', source: decidedSource, owner: { email: 'author@example.com' } },
});
const ops = {
  lock: async () => {},
  lockLineage: async () => {},
  findReportSince: async () => (merge ? { id: '550e8400-e29b-41d4-a716-446655440000' } : null),
  createReport: async (input: unknown) => {
    created.push(input);
    return { id: '550e8400-e29b-41d4-a716-446655440000' };
  },
  findReport: async (id: string) => decidedReport(id),
  findLatestOwnerReport: async () => ({
    id: '550e8400-e29b-41d4-a716-446655440000',
    class: { name: 'Bog Witch', owner: { email: 'author@example.com' } },
  }),
  countDisputes: async () => (disputeLimited ? 3 : 0),
  createDispute: async () => ({ id: '550e8400-e29b-41d4-a716-446655440001' }),
  claimReport: async (_id: string, from: string[], to: string) => {
    if (!from.includes(reportStatus)) {
      return false;
    }
    writes.push(`claim:${reportStatus}->${to}`);
    return true;
  },
  appendLog: async (entry: { reportId: string; actorUserId: string; action: string; reason: string; evidence?: unknown }) => {
    takeDownInput = { id: entry.reportId, actorUserId: entry.actorUserId, reason: entry.reason };
    writes.push(`log:${entry.action}${entry.evidence ? '+evidence' : ''}`);
  },
  hideLineage: async () => {
    writes.push('hide');
  },
  unhideLineage: async () => {
    writes.push('unhide');
  },
  clearContentRemoved: async () => {
    writes.push('clear-content-removed');
  },
  lineageReportStatuses: async () => stillInForce,
  removeFromPools: async () => {
    writes.push('pools');
  },
  snapshotContent: async () => ({ versions: [] }),
  blankContent: async () => {
    writes.push('blank');
  },
  findRemovalEvidence: async () => ({ versions: [] }),
  findLineageRemovalEvidence: async () => earlierRemoval,
  restoreContent: async () => {
    writes.push('restore-content');
  },
};
mock.module('../../src/repositories/moderation-repository.js', {
  namedExports: {
    moderationRepository: {
      transaction: async (work: (o: typeof ops) => Promise<unknown>) => work(ops),
      findClass: async (id: number) =>
        id === 9 ? reportClass : null,
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
            class: { name: 'Bog Witch', lineageId: 'lineage-1', version: 1, source: 'user', ownerUserId: 'gm-1' },
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
            class: { name: 'Bog Witch', lineageId: 'lineage-1', version: 2, source: 'user', ownerUserId: 'gm-1' },
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
      listLog: async () => [
        {
          id: '550e8400-e29b-41d4-a716-446655440009',
          action: 'taken_down',
          reason: 'Credible threat',
          ground: 'threat_to_life_or_safety',
          actorUserId: 'admin-1',
          reportId: null,
          targetUserId: null,
          createdAt: new Date('2026-10-09T12:00:00.000Z'),
          class: { id: 9, name: 'Bog Witch' },
        },
      ],
      anonymizeReports: async (input: { before: Date }) => {
        anonymizeBefore = input.before;
        return { count: 2 };
      },
    },
  },
});
const { createModerationService, anonymizeExpiredModerationReports } = await import(
  '../../src/services/moderation-service.js'
);
/** Records who the service asks to notify; the SES adapter is tested in moderation-notifier.test.ts. */
const notifier = {
  received: async (input: unknown) => {
    sent.push({ kind: 'received', input });
  },
  decided: async (input: { outcome: string; explanation: string; statement: unknown }) => {
    sent.push({ kind: 'decided', input: { outcome: input.outcome, explanation: input.explanation, statement: input.statement } });
  },
  disputed: async (input: unknown) => {
    sent.push({ kind: 'disputed', input });
  },
};
const service = createModerationService({ error: () => {}, warn: () => {} }, notifier);

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
      reporterLocale: 'en',
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

test('a filled honeypot looks accepted but saves and mails nothing', async () => {
  created.length = 0;
  sent.length = 0;
  const result = await service.submit({
    classId: 9,
    reason: 'copyright',
    explanation: 'Copied work',
    reporterName: 'Bot',
    reporterEmail: 'bot@example.com',
    website: 'https://spam.example',
  });

  assert.match(result.ok ? result.value.id : '', /^[0-9a-f-]{36}$/i);
  assert.equal(created.length, 0);
  assert.equal(sent.length, 0);
});

test('only allowlisted moderators can read the moderation log', async () => {
  const previous = process.env.MODERATION_ADMIN_USER_IDS;
  process.env.MODERATION_ADMIN_USER_IDS = 'admin-1';
  try {
    const denied = await service.listLog({ session: { user: { id: 'gm-1' } } });
    assert.equal(!denied.ok && denied.error.statusCode, 404);
    const log = await service.listLog({ session: { user: { id: 'admin-1' } } });
    assert.deepEqual(log.ok && log.value[0], {
      id: '550e8400-e29b-41d4-a716-446655440009',
      action: 'taken_down',
      reason: 'Credible threat',
      ground: 'threat_to_life_or_safety',
      actorUserId: 'admin-1',
      reportId: null,
      targetUserId: null,
      classId: 9,
      className: 'Bog Witch',
      createdAt: '2026-10-09T12:00:00.000Z',
    });
  } finally {
    if (previous === undefined) {
      delete process.env.MODERATION_ADMIN_USER_IDS;
    } else {
      process.env.MODERATION_ADMIN_USER_IDS = previous;
    }
  }
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
  writes.length = 0;
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
        builtIn: false,
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
      ground: 'other_illegal_content',
      id: '550e8400-e29b-41d4-a716-446655440000',
      reason: '  Credible threat  ',
    });
    assert.equal(result.ok && result.value.takenDown, true);
    assert.deepEqual(takeDownInput, {
      id: '550e8400-e29b-41d4-a716-446655440000',
      actorUserId: 'admin-1',
      reason: 'Credible threat',
    });
    assert.deepEqual(writes, ['claim:open->taken_down', 'hide', 'pools', 'log:taken_down']);
    assert.deepEqual(sent, [
      {
        kind: 'decided',
        input: {
          outcome: 'taken_down',
          explanation: 'Credible threat',
          statement: { measure: 'taken_down', ground: 'other_illegal_content' },
        },
      },
    ]);

    reportStatus = 'taken_down';
    const decided = await service.dismiss({
      session: { user: { id: 'admin-1' } },
      id: '550e8400-e29b-41d4-a716-446655440000',
      reason: 'Too late',
    });
    assert.equal(!decided.ok && decided.error.code, 'REPORT_NOT_FOUND');
    reportStatus = 'open';

    const missingReason = await service.takeDown({
      session: { user: { id: 'admin-1' } },
      ground: 'other_illegal_content',
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

    const stillOpen = await service.restore({
      session: { user: { id: 'admin-1' } },
      id: '550e8400-e29b-41d4-a716-446655440000',
      reason: 'Nothing to restore',
    });
    assert.equal(!stillOpen.ok && stillOpen.error.code, 'REPORT_NOT_FOUND');

    reportStatus = 'content_removed';
    writes.length = 0;
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
    assert.deepEqual(writes, [
      'claim:content_removed->restored',
      'restore-content',
      'clear-content-removed',
      'unhide',
      'log:restored',
    ]);

    reportStatus = 'taken_down';
    stillInForce = ['taken_down'];
    writes.length = 0;
    const stillHidden = await service.restore({
      session: { user: { id: 'admin-1' } },
      id: '550e8400-e29b-41d4-a716-446655440000',
      reason: 'One of two reports',
    });
    assert.equal(stillHidden.ok, true);
    assert.deepEqual(writes, ['claim:taken_down->restored', 'log:restored']);
    stillInForce = [];
  } finally {
    reportStatus = 'open';
    if (previous === undefined) {
      delete process.env.MODERATION_ADMIN_USER_IDS;
    } else {
      process.env.MODERATION_ADMIN_USER_IDS = previous;
    }
  }
});
test('a second removal keeps the first removal’s evidence instead of snapshotting blanked text', async () => {
  const previous = process.env.MODERATION_ADMIN_USER_IDS;
  process.env.MODERATION_ADMIN_USER_IDS = 'admin-1';
  writes.length = 0;
  earlierRemoval = { versions: [] };
  try {
    const result = await service.removeContent({
      session: { user: { id: 'admin-1' } },
      ground: 'other_illegal_content',
      id: '550e8400-e29b-41d4-a716-446655440000',
      reason: 'Second report',
    });
    assert.equal(result.ok, true);
    assert.deepEqual(writes, ['claim:open->content_removed', 'hide', 'pools', 'log:content_removed+evidence']);
  } finally {
    earlierRemoval = null;
    if (previous === undefined) {
      delete process.env.MODERATION_ADMIN_USER_IDS;
    } else {
      process.env.MODERATION_ADMIN_USER_IDS = previous;
    }
  }
});
test('refuses to remove content from a Built-in Class and changes nothing', async () => {
  const previous = process.env.MODERATION_ADMIN_USER_IDS;
  process.env.MODERATION_ADMIN_USER_IDS = 'admin-1';
  writes.length = 0;
  decidedSource = 'main_book';
  try {
    const result = await service.removeContent({
      session: { user: { id: 'admin-1' } },
      ground: 'other_illegal_content',
      id: '550e8400-e29b-41d4-a716-446655440000',
      reason: 'Copied text',
    });
    assert.equal(!result.ok && result.error.code, 'MODERATION_BUILT_IN_CLASS');
    assert.deepEqual(writes, []);
  } finally {
    decidedSource = 'user';
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
  writes.length = 0;
  takeDownInput = undefined;
  try {
    const result = await service.removeContent({
      session: { user: { id: 'admin-1' } },
      ground: 'other_illegal_content',
      id: '550e8400-e29b-41d4-a716-446655440000',
      reason: '  Illegal copied text  ',
    });
    assert.equal(result.ok && result.value.contentRemoved, true);
    assert.deepEqual(takeDownInput, {
      id: '550e8400-e29b-41d4-a716-446655440000',
      actorUserId: 'admin-1',
      reason: 'Illegal copied text',
    });
    assert.deepEqual(writes, ['claim:open->content_removed', 'blank', 'hide', 'pools', 'log:content_removed+evidence']);
    assert.deepEqual(sent, [
      {
        kind: 'decided',
        input: {
          outcome: 'content_removed',
          explanation: 'Illegal copied text',
          statement: { measure: 'content_removed', ground: 'other_illegal_content' },
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
