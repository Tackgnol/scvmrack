import assert from 'node:assert/strict';
import { test } from 'node:test';

import { buildModerationQueue } from '../../src/services/moderation-queue.ts';

const report = (id: string, lineageId: string, reason: string, version = 1) => ({
  id,
  classId: version,
  reason,
  explanation: 'Why',
  reporterName: null,
  reporterEmail: null,
  status: 'open',
  disputes: [],
  createdAt: new Date('2026-10-08T12:00:00.000Z'),
  class: { name: lineageId, lineageId, version, source: lineageId === 'grave' ? 'main_book' : 'user', ownerUserId: 'gm-1' },
});

test('groups reports by lineage, takes the highest version as latest, and puts serious groups first', () => {
  const queue = buildModerationQueue({
    reports: [report('r1', 'mild', 'other'), report('r2', 'grave', 'terrorist_content'), report('r3', 'mild', 'copyright', 2)],
    versions: [
      { id: 1, lineageId: 'mild', name: 'Mild', version: 1 },
      { id: 2, lineageId: 'mild', name: 'Mild', version: 2 },
    ],
    removalLogs: [],
  } as unknown as Parameters<typeof buildModerationQueue>[0]);

  assert.deepEqual(queue.map((group) => group.lineageId), ['grave', 'mild']);
  assert.equal(queue[1].latest.version, 2);
  assert.deepEqual(queue[1].reports.map((r) => r.id), ['r1', 'r3']);
  assert.equal(queue[0].latest.version, 1, 'a lineage with no listed versions falls back to the reported one');
  assert.deepEqual(queue.map((group) => group.builtIn), [true, false], 'built-in follows the class source, not ownership');
});
