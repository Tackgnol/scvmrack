import assert from 'node:assert/strict';
import { beforeEach, mock, test } from 'node:test';

type ScopeClassRow = {
  id: number;
  lineageId: string;
  version: number;
  source: 'main_book' | 'zine' | 'the_rack' | 'user';
  status: 'draft' | 'active' | 'archived';
  visibility: 'private' | 'public';
  ownerUserId: string | null;
  takenDownAt: Date | null;
};

const book = (id: number, overrides: Partial<ScopeClassRow> = {}): ScopeClassRow => ({
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
  bookRows: [] as ScopeClassRow[],
  poolRows: [] as ScopeClassRow[],
  party: null as null | {
    id: string;
    ownerUserId: string;
    classlessEnabled: boolean;
    poolLineageIds: string[];
  },
  poolLookups: [] as string[][],
};

beforeEach(() => {
  state.bookRows = [book(1), book(2)];
  state.poolRows = [];
  state.party = null;
  state.poolLookups = [];
});

mock.module('../../src/repositories/character-repository.js', {
  namedExports: {
    characterRepository: {
      findBookClassRows: async () => state.bookRows,
      findClassRowsByLineage: async (lineageIds: string[]) => {
        state.poolLookups.push(lineageIds);
        return state.poolRows;
      },
    },
  },
});

mock.module('../../src/repositories/party-repository.js', {
  namedExports: {
    partyRepository: {
      findPartyForInvite: async () => state.party,
    },
  },
});

const { resolveClassScope } = await import('../../src/services/class-scope-service.js');

test('without an invite only Book Classes are allowed, and classless is on', async () => {
  state.bookRows = [book(2), book(1), book(3, { takenDownAt: new Date() })];

  assert.deepEqual(await resolveClassScope(undefined), {
    ok: true,
    value: { classIds: [1, 2], acceptedClassIds: [1, 2], classlessEnabled: true, party: null },
  });
});

test('an invite that no longer resolves is gone', async () => {
  const result = await resolveClassScope('rotated-token');

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

  const result = await resolveClassScope('invite-token');

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
