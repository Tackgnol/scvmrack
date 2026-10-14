import assert from 'node:assert/strict';
import { beforeEach, mock, test } from 'node:test';

import type { ClassVersionRef } from '../../src/lib/class-model.js';

const book = (id: number, overrides: Partial<ClassVersionRef> = {}): ClassVersionRef => ({
  id,
  lineageId: `lineage-${id}`,
  version: 1,
  source: 'main_book',
  status: 'active',
  visibility: 'public',
  ownerUserId: null,
  takenDownAt: null,
  ...overrides,
});

const state = {
  bookRows: [] as ClassVersionRef[],
  poolRows: [] as ClassVersionRef[],
  party: null as null | {
    id: string;
    ownerUserId: string;
    classlessEnabled: boolean;
    poolLineageIds: string[];
  },
  poolLookups: [] as string[][],
  roomLookups: [] as string[],
  view: null as null | {
    id: string;
    ownerUserId: string;
    classlessEnabled: boolean;
    poolLineageIds: string[];
    memberClassIds: Array<number | null>;
  },
  catalog: [] as Array<Record<string, unknown>>,
  setLineageCalls: [] as Array<{ partyId: string; lineageId: string; enabled: boolean }>,
  setClasslessCalls: [] as Array<{ partyId: string; enabled: boolean }>,
};

beforeEach(() => {
  state.bookRows = [book(1), book(2)];
  state.poolRows = [];
  state.party = null;
  state.poolLookups = [];
  state.roomLookups = [];
});

const PARTY_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

mock.module('../../src/lib/class-translations.js', {
  namedExports: {
    // The catalog rows these tests use already carry their text.
    translatedClassTexts: async (_locale: string, rows: Array<{ name: string; description?: string | null }>) =>
      rows.map((row) => ({ name: row.name, description: row.description ?? null })),
  },
});

mock.module('../../src/repositories/class-pool-repository.js', {
  namedExports: {
    classPoolRepository: {
      findPool: async (where: { id?: string; inviteToken?: string; obrRoomId?: string }) => {
        if (where.id) {
          return state.view;
        }
        if (where.obrRoomId) {
          state.roomLookups.push(where.obrRoomId);
        }
        return state.party && { ...state.party, memberClassIds: [] };
      },
      findBookClassRows: async () => state.bookRows,
      findClassRowsByLineage: async (lineageIds: string[]) => {
        state.poolLookups.push(lineageIds);
        return state.poolRows;
      },
      findCatalogRows: async () => state.catalog,
      setLineage: async (partyId: string, lineageId: string, enabled: boolean) => {
        state.setLineageCalls.push({ partyId, lineageId, enabled });
        if (state.view) {
          state.view.poolLineageIds = enabled
            ? [...new Set([...state.view.poolLineageIds, lineageId])]
            : state.view.poolLineageIds.filter((id) => id !== lineageId);
        }
      },
      setClassless: async (partyId: string, enabled: boolean) => {
        state.setClasslessCalls.push({ partyId, enabled });
        if (state.view) {
          state.view.classlessEnabled = enabled;
        }
      },
    },
  },
});

const { createPartyClassPoolService, resolvePartyClassPool } = await import(
  '../../src/services/party-class-pool-service.js'
);
const service = () => createPartyClassPoolService({ error: () => {} });
const gm = (id: string) => ({ user: { id, isAnonymous: false }, session: { id: `s-${id}` } }) as never;
const poolRow = (id: number, overrides: Record<string, unknown> = {}) => ({
  ...book(id),
  ownerName: null,
  name: `Class ${id}`,
  nameKey: null,
  descriptionKey: null,
  appendix: null,
  languages: ['en'],
  credit: null,
  abilityCount: 6,
  classItemCount: 0,
  randomAbilityCount: 1,
  gettingBetterRule: 'book',
  ...overrides,
});


test('without an invite only Book Classes are allowed, and classless is on', async () => {
  state.bookRows = [book(2), book(1), book(3, { takenDownAt: new Date() })];

  assert.deepEqual(await resolvePartyClassPool(undefined), {
    ok: true,
    value: { classIds: [1, 2], acceptedClassIds: [1, 2], classlessEnabled: true, party: null },
  });
});

test('an invite that no longer resolves is gone', async () => {
  const result = await resolvePartyClassPool('rotated-token');

  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.error.statusCode, 410);
    assert.equal(result.error.code, 'PARTY_INVITE_INVALID');
  }
});

test("an invite rolls from its party's pool: the latest rollable version, while drafts on an older version still confirm", async () => {
  state.party = {
    id: 'party-1',
    ownerUserId: 'gm-1',
    classlessEnabled: false,
    poolLineageIds: ['lineage-1', 'own', 'public', 'private', 'gone', 'archived'],
  };
  state.poolRows = [
    book(1),
    book(10, { lineageId: 'own', version: 1, source: 'user', visibility: 'private', ownerUserId: 'gm-1' }),
    book(11, { lineageId: 'own', version: 2, source: 'user', visibility: 'private', ownerUserId: 'gm-1' }),
    book(20, { lineageId: 'public', source: 'user', visibility: 'public', ownerUserId: 'gm-2' }),
    book(30, { lineageId: 'private', source: 'user', visibility: 'private', ownerUserId: 'gm-2' }),
    book(40, { lineageId: 'gone', version: 1, source: 'user', visibility: 'public', ownerUserId: 'gm-2' }),
    book(41, {
      lineageId: 'gone',
      version: 2,
      source: 'user',
      visibility: 'public',
      ownerUserId: 'gm-2',
      takenDownAt: new Date(),
    }),
    book(50, { lineageId: 'archived', source: 'user', status: 'archived', ownerUserId: 'gm-1' }),
  ];

  const result = await resolvePartyClassPool('invite-token');

  assert.deepEqual(result, {
    ok: true,
    value: {
      classIds: [1, 11, 20],
      acceptedClassIds: [1, 10, 11, 20],
      classlessEnabled: false,
      party: { id: 'party-1', ownerUserId: 'gm-1' },
    },
  });
  assert.deepEqual(state.poolLookups, [['lineage-1', 'own', 'public', 'private', 'gone', 'archived']]);
});

test('an Owlbear room rolls from its attached party pool without exposing an invite', async () => {
  state.party = {
    id: 'room-party',
    ownerUserId: 'gm-1',
    classlessEnabled: false,
    poolLineageIds: ['lineage-1'],
  };
  state.poolRows = [book(1)];

  assert.deepEqual(await resolvePartyClassPool(undefined, 'obr-room-1'), {
    ok: true,
    value: {
      classIds: [1],
      acceptedClassIds: [1],
      classlessEnabled: false,
      party: { id: 'room-party', ownerUserId: 'gm-1' },
    },
  });
  assert.deepEqual(state.roomLookups, ['obr-room-1']);
});
function resetPool(): void {
  state.view = {
    id: PARTY_ID,
    ownerUserId: 'gm-1',
    classlessEnabled: true,
    poolLineageIds: ['lineage-1'],
    memberClassIds: [1],
  };
  state.catalog = [
    poolRow(1),
    poolRow(2),
    poolRow(300, {
      source: 'user',
      ownerUserId: 'gm-2',
      ownerName: 'Marta',
      visibility: 'private',
    }),
  ];
  state.setLineageCalls = [];
  state.setClasslessCalls = [];
}

test('getClassPool shows the owner every class they can offer, with what is on', async () => {
  resetPool();

  const r = await service().getClassPool({
    session: gm('gm-1'),
    id: PARTY_ID,
    locale: 'en',
  });

  assert.equal(r.ok, true);
  const view = (r as any).value;
  assert.deepEqual(
    view.classes.map(
      (c: { classId: number; enabled: boolean; playingHere: number }) => [
        c.classId,
        c.enabled,
        c.playingHere,
      ]
    ),
    [
      [1, true, 1],
      [2, false, 0],
    ]
  );
  assert.equal(view.classlessEnabled, true);
});

test('only the party owner sees or changes its pool', async () => {
  resetPool();

  const read = await service().getClassPool({
    session: gm('gm-2'),
    id: PARTY_ID,
    locale: 'en',
  });
  const write = await service().setPoolClass({
    session: gm('gm-2'),
    id: PARTY_ID,
    lineageId: 'lineage-2',
    enabled: true,
    locale: 'en',
  });

  assert.equal((read as any).error.statusCode, 404);
  assert.equal((write as any).error.statusCode, 404);
  assert.deepEqual(state.setLineageCalls, []);
});

test('setPoolClass switches a class on or off and returns the fresh pool', async () => {
  resetPool();

  const on = await service().setPoolClass({
    session: gm('gm-1'),
    id: PARTY_ID,
    lineageId: 'lineage-2',
    enabled: true,
    locale: 'en',
  });
  const off = await service().setPoolClass({
    session: gm('gm-1'),
    id: PARTY_ID,
    lineageId: 'lineage-1',
    enabled: false,
    locale: 'en',
  });

  assert.equal(on.ok && off.ok, true);
  assert.deepEqual(state.setLineageCalls, [
    { partyId: PARTY_ID, lineageId: 'lineage-2', enabled: true },
    { partyId: PARTY_ID, lineageId: 'lineage-1', enabled: false },
  ]);
  assert.deepEqual(
    (off as any).value.classes.map(
      (c: { classId: number; enabled: boolean }) => [c.classId, c.enabled]
    ),
    [
      [1, false],
      [2, true],
    ]
  );
});

test("setPoolClass refuses a class the GM can't offer", async () => {
  resetPool();

  const r = await service().setPoolClass({
    session: gm('gm-1'),
    id: PARTY_ID,
    lineageId: 'lineage-300',
    enabled: true,
    locale: 'en',
  });

  assert.equal((r as any).error.statusCode, 409);
  assert.equal((r as any).error.code, 'CLASS_NOT_AVAILABLE');
  assert.deepEqual(state.setLineageCalls, []);
});

test('setPoolClassless switches Classless and returns the fresh pool', async () => {
  resetPool();

  const r = await service().setPoolClassless({
    session: gm('gm-1'),
    id: PARTY_ID,
    enabled: false,
    locale: 'en',
  });

  assert.equal(r.ok, true);
  assert.equal((r as any).value.classlessEnabled, false);
  assert.deepEqual(state.setClasslessCalls, [
    { partyId: PARTY_ID, enabled: false },
  ]);
});
