import assert from 'node:assert/strict';
import { test } from 'node:test';

import { isReportable, mayOffer, mayRead, type ClassVersionRef } from '../../src/lib/class-model.ts';

const row = (overrides: Partial<ClassVersionRef> = {}): ClassVersionRef => ({
  id: 1,
  lineageId: 'l',
  version: 1,
  source: 'user',
  status: 'active',
  visibility: 'private',
  ownerUserId: 'gm-1',
  takenDownAt: null,
  ...overrides,
});
const takenDown = new Date('2026-10-01');

test('a party offers built-in, public and its owner’s classes while they are available', () => {
  const cases: Array<[Partial<ClassVersionRef>, string | null, boolean]> = [
    [{ source: 'main_book' }, null, true],
    [{ visibility: 'public' }, 'gm-2', true],
    [{}, 'gm-1', true],
    [{}, 'gm-2', false],
    [{ ownerUserId: null }, null, false],
    [{ status: 'archived' }, 'gm-1', false],
    [{ visibility: 'public', takenDownAt: takenDown }, 'gm-2', false],
  ];
  for (const [overrides, partyOwner, expected] of cases) {
    assert.equal(mayOffer(row(overrides), partyOwner), expected, JSON.stringify({ overrides, partyOwner }));
  }
});

test('anyone may report a built-in class or a public Custom Class that is still up', () => {
  assert.equal(isReportable(row({ source: 'main_book' })), true);
  assert.equal(isReportable(row({ visibility: 'public' })), true);
  assert.equal(isReportable(row()), false);
  assert.equal(isReportable(row({ visibility: 'public', takenDownAt: takenDown })), false);
});

test('reading asks about party pools only when nothing else decides', async () => {
  let asked = 0;
  const pooled = (answer: boolean) => async () => {
    asked++;
    return answer;
  };
  assert.equal(await mayRead(row({ takenDownAt: takenDown }), { userId: null, moderator: true, pooledForViewer: pooled(false) }), true);
  assert.equal(await mayRead(row(), { userId: 'gm-1', moderator: false, pooledForViewer: pooled(false) }), true);
  assert.equal(await mayRead(row({ status: 'archived' }), { userId: 'gm-2', moderator: false, pooledForViewer: pooled(true) }), false);
  assert.equal(asked, 0);
  assert.equal(await mayRead(row(), { userId: 'gm-2', moderator: false, pooledForViewer: pooled(true) }), true);
  assert.equal(await mayRead(row(), { userId: null, moderator: false, pooledForViewer: pooled(false) }), false);
  assert.equal(asked, 2);
});
