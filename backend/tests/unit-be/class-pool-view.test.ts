import assert from 'node:assert/strict';
import test from 'node:test';

import type { PoolCatalogRow } from '../../src/repositories/class-pool-repository.ts';
import { buildClassPoolView } from '../../src/services/class-pool-view.ts';

const row = (id: number, overrides: Partial<PoolCatalogRow> = {}): PoolCatalogRow => ({
  id,
  lineageId: `lineage-${id}`,
  version: 1,
  source: 'main_book',
  status: 'active',
  visibility: 'public',
  ownerUserId: null,
  ownerName: null,
  takenDownAt: null,
  name: `Class ${id}`,
  blurb: `Blurb ${id}`,
  languages: ['en', 'pl'],
  credit: null,
  abilityCount: 7,
  classItemCount: 0,
  randomAbilityCount: 1,
  gettingBetterRule: 'book',
  ...overrides,
});

const GM = 'gm-1';

test('classes sort into Book, Zine, Rack, mine and public, each on its latest version', () => {
  const view = buildClassPoolView({
    rows: [
      row(1),
      row(20, { source: 'zine', credit: { work: 'Terrible Dungeons', author: 'Toby', url: null } }),
      row(21, { source: 'the_rack', credit: { work: 'the Rack', author: 'scvmrack', url: null } }),
      row(100, { lineageId: 'mine', source: 'user', ownerUserId: GM, ownerName: 'Adam', visibility: 'private' }),
      row(101, { lineageId: 'mine', version: 2, source: 'user', ownerUserId: GM, ownerName: 'Adam', visibility: 'private' }),
      row(200, { source: 'user', ownerUserId: 'gm-2', ownerName: 'Marta' }),
    ],
    poolLineageIds: ['lineage-1', 'mine'],
    classlessEnabled: true,
    partyOwnerId: GM,
    memberClassIds: [],
  });

  assert.deepEqual(
    view.classes.map((c) => [c.classId, c.group, c.enabled]),
    [
      [1, 'book', true],
      [20, 'zine', false],
      [21, 'rack', false],
      [101, 'mine', true],
      [200, 'public', false],
    ],
  );
  assert.equal(view.classlessEnabled, true);
  assert.deepEqual(view.removed, []);
  const mine = view.classes.find((c) => c.group === 'mine')!;
  assert.equal(mine.version, 2);
  assert.deepEqual(mine.attribution, { kind: 'owner', name: 'Adam', private: true });
  assert.deepEqual(view.classes[1].attribution, {
    kind: 'credit',
    work: 'Terrible Dungeons',
    author: 'Toby',
    url: null,
  });
  assert.equal(view.classes[0].attribution, null);
});

test("other GMs' private classes and anything archived or taken down are never offered", () => {
  const view = buildClassPoolView({
    rows: [
      row(300, { source: 'user', ownerUserId: 'gm-2', ownerName: 'Marta', visibility: 'private' }),
      row(301, { source: 'user', ownerUserId: GM, ownerName: 'Adam', status: 'archived' }),
      row(302, { source: 'user', ownerUserId: GM, ownerName: 'Adam', status: 'draft' }),
      row(303, { source: 'zine', takenDownAt: new Date(), credit: { work: 'W', author: 'A', url: null } }),
    ],
    poolLineageIds: [],
    classlessEnabled: false,
    partyOwnerId: GM,
    memberClassIds: [],
  });

  assert.deepEqual(view.classes, []);
});

test('pooled classes that are gone become removed notices naming who removed them', () => {
  const view = buildClassPoolView({
    rows: [
      row(400, { name: "Grave Warden's Due", source: 'user', ownerUserId: 'gm-2', ownerName: 'Marta', status: 'archived' }),
      row(401, { name: 'Unlisted', source: 'user', ownerUserId: 'gm-2', ownerName: 'Marta', visibility: 'private' }),
      row(402, { name: 'Banned', source: 'user', ownerUserId: 'gm-2', ownerName: 'Marta', takenDownAt: new Date() }),
    ],
    poolLineageIds: ['lineage-400', 'lineage-401', 'lineage-402'],
    classlessEnabled: true,
    partyOwnerId: GM,
    memberClassIds: [],
  });

  assert.deepEqual(view.removed, [
    { lineageId: 'lineage-400', name: "Grave Warden's Due", by: 'Marta', reason: 'archived' },
    { lineageId: 'lineage-401', name: 'Unlisted', by: 'Marta', reason: 'unpublished' },
    { lineageId: 'lineage-402', name: 'Banned', by: null, reason: 'taken_down' },
  ]);
});

test('"N scvm play it here" counts members on any version of the class', () => {
  const view = buildClassPoolView({
    rows: [
      row(100, { lineageId: 'mine', source: 'user', ownerUserId: GM, ownerName: 'Adam' }),
      row(101, { lineageId: 'mine', version: 2, source: 'user', ownerUserId: GM, ownerName: 'Adam' }),
      row(1),
    ],
    poolLineageIds: ['mine'],
    classlessEnabled: true,
    partyOwnerId: GM,
    memberClassIds: [100, 101, 101, 1, null],
  });

  assert.deepEqual(
    view.classes.map((c) => [c.classId, c.playingHere]),
    [
      [1, 1],
      [101, 3],
    ],
  );
});
