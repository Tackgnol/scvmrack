import assert from 'node:assert/strict';
import { beforeEach, mock, test } from 'node:test';

const state = {
  byId: null as Record<string, unknown> | null,
  byKey: null as Record<string, unknown> | null,
  idError: null as unknown,
  searchResult: [] as unknown[],
  searchError: null as unknown,
  idCalls: [] as Array<{ itemType: string; id: number }>,
  keyCalls: [] as Array<{ itemType: string; key: string }>,
  searchCalls: [] as Array<{ q: string; limit: number }>,
};

function resetState(): void {
  state.byId = null;
  state.byKey = null;
  state.idError = null;
  state.searchResult = [{ itemType: 'weapon', id: 1, key: 'weapons.sword', name: 'Sword' }];
  state.searchError = null;
  state.idCalls = [];
  state.keyCalls = [];
  state.searchCalls = [];
}

mock.module('../../src/repositories/equipment-repository.js', {
  namedExports: {
    equipmentRepository: {
      findById: async (itemType: string, id: number) => {
        state.idCalls.push({ itemType, id });
        if (state.idError) throw state.idError;
        return state.byId;
      },
      findByKey: async (itemType: string, key: string) => {
        state.keyCalls.push({ itemType, key });
        return state.byKey;
      },
    },
  },
});

mock.module('../../src/lib/item-search-service.js', {
  namedExports: {
    searchItems: async (q: string, _locale: unknown, limit: number) => {
      state.searchCalls.push({ q, limit });
      if (state.searchError) throw state.searchError;
      return state.searchResult;
    },
  },
});

const { createEquipmentService } = await import('../../src/services/equipment-service.js');
const service = () => createEquipmentService({ error: () => {} });

beforeEach(() => {
  resetState();
});

test('search rejects an empty query with 400', async () => {
  const r = await service().search({ q: '   ', limit: 20 });
  assert.equal(r.ok, false);
  assert.equal((r as any).error.code, 'EMPTY_SEARCH_QUERY');
  assert.equal(state.searchCalls.length, 0);
});

test('search returns matches', async () => {
  const r = await service().search({ q: 'sword', locale: 'en', limit: 10 });
  assert.equal(r.ok, true);
  assert.deepEqual((r as any).value, state.searchResult);
  assert.deepEqual(state.searchCalls, [{ q: 'sword', limit: 10 }]);
});

test('search maps an unexpected failure to 5xx', async () => {
  state.searchError = new Error('index down');
  const r = await service().search({ q: 'sword', limit: 10 });
  assert.equal(r.ok, false);
  assert.equal((r as any).error.statusCode, 500);
  assert.equal((r as any).error.code, 'EQUIPMENT_SEARCH_FAILED');
});

test('getItem rejects an unsupported item type with 404', async () => {
  const r = await service().getItem({ itemType: 'bogus', id: 1 });
  assert.equal((r as any).error.code, 'ITEM_NOT_FOUND');
  assert.equal(state.idCalls.length, 0);
});

test('getItem returns the item found by id', async () => {
  state.byId = { id: 1, key: 'weapons.sword', name: 'Sword' };
  const r = await service().getItem({ itemType: 'weapon', id: 1 });
  assert.equal(r.ok, true);
  assert.deepEqual((r as any).value, state.byId);
  assert.deepEqual(state.idCalls, [{ itemType: 'weapon', id: 1 }]);
  assert.equal(state.keyCalls.length, 0);
});

test('getItem falls back to key lookup when the id is stale', async () => {
  state.byId = null;
  state.byKey = { id: 42, key: 'weapons.sword', name: 'Sword' };
  const r = await service().getItem({ itemType: 'weapon', id: 999, key: 'weapons.sword' });
  assert.equal(r.ok, true);
  assert.deepEqual((r as any).value, state.byKey);
  assert.deepEqual(state.idCalls, [{ itemType: 'weapon', id: 999 }]);
  assert.deepEqual(state.keyCalls, [{ itemType: 'weapon', key: 'weapons.sword' }]);
});

test('getItem returns 404 when id and key both miss', async () => {
  const r = await service().getItem({ itemType: 'weapon', id: 999, key: 'weapons.missing' });
  assert.equal((r as any).error.statusCode, 404);
  assert.equal((r as any).error.code, 'ITEM_NOT_FOUND');
});

test('getItem maps an unexpected failure to 5xx ITEM_FETCH_FAILED', async () => {
  state.idError = new Error('db down');
  const r = await service().getItem({ itemType: 'weapon', id: 1 });
  assert.equal((r as any).error.statusCode, 500);
  assert.equal((r as any).error.code, 'ITEM_FETCH_FAILED');
});
