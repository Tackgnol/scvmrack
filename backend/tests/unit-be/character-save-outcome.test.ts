import assert from 'node:assert/strict';
import { beforeEach, mock, test } from 'node:test';
import { Prisma } from '@prisma/client';

const ID = '11111111-1111-4111-8111-111111111111';
const EXPECTED = new Date('2026-10-16T09:00:00.000Z');

const state = {
  updateError: null as unknown,
  stored: null as { lastSaveId: string | null } | null,
  updates: [] as Array<{ where: Record<string, unknown>; data: Record<string, unknown> }>,
  lookups: 0,
};

beforeEach(() => {
  state.updateError = null;
  state.stored = { lastSaveId: null };
  state.updates = [];
  state.lookups = 0;
});

mock.module('../../src/lib/prisma.js', {
  defaultExport: {
    character: {
      update: async (args: { where: Record<string, unknown>; data: Record<string, unknown> }) => {
        state.updates.push(args);
        if (state.updateError) {
          throw state.updateError;
        }
        return {};
      },
      findUnique: async () => {
        state.lookups++;
        return state.stored;
      },
    },
  },
});

const { characterRepository } = await import('../../src/repositories/character-repository.js');

/** The error Prisma raises when an update's `where` matches no row. */
const noRowMatched = () =>
  new Prisma.PrismaClientKnownRequestError('No record was found for an update.', {
    code: 'P2025',
    clientVersion: '6.19.3',
  });

test('an unguarded save writes the patch and is saved', async () => {
  const outcome = await characterRepository.update(ID, { name: 'Hero' });
  assert.equal(outcome, 'saved');
  assert.deepEqual(state.updates, [{ where: { id: ID }, data: { name: 'Hero' } }]);
});

test('a save id is recorded with the patch', async () => {
  await characterRepository.update(ID, { name: 'Hero' }, { saveId: 'this-save' });
  assert.deepEqual(state.updates[0]?.data, { name: 'Hero', lastSaveId: 'this-save' });
});

test('a guarded save writes only at the expected version and moves the version on', async () => {
  const outcome = await characterRepository.update(ID, { name: 'Hero' }, { expectedUpdatedAt: EXPECTED, saveId: 'this-save' });
  assert.equal(outcome, 'saved');
  const [write] = state.updates;
  assert.deepEqual(write?.where, {
    id: ID,
    updatedAt: { gte: EXPECTED, lt: new Date(EXPECTED.getTime() + 1) },
  });
  assert.equal(write?.data.name, 'Hero');
  assert.equal(write?.data.lastSaveId, 'this-save');
  assert.ok((write?.data.updatedAt as Date).getTime() > EXPECTED.getTime());
});

test('an unguarded save that matches no row is missing, without a second lookup', async () => {
  state.updateError = noRowMatched();
  assert.equal(await characterRepository.update(ID, { name: 'Hero' }, { saveId: 'this-save' }), 'missing');
  assert.equal(state.lookups, 0);
});

test('a guarded save of a character that is gone is missing', async () => {
  state.updateError = noRowMatched();
  state.stored = null;
  assert.equal(
    await characterRepository.update(ID, { name: 'Hero' }, { expectedUpdatedAt: EXPECTED, saveId: 'this-save' }),
    'missing'
  );
});

test('a guarded save that already landed under the same save id is replayed', async () => {
  state.updateError = noRowMatched();
  state.stored = { lastSaveId: 'this-save' };
  assert.equal(
    await characterRepository.update(ID, { name: 'Hero' }, { expectedUpdatedAt: EXPECTED, saveId: 'this-save' }),
    'replayed'
  );
});

test('a guarded save after another save landed is stale', async () => {
  state.updateError = noRowMatched();
  state.stored = { lastSaveId: 'another-save' };
  assert.equal(
    await characterRepository.update(ID, { name: 'Hero' }, { expectedUpdatedAt: EXPECTED, saveId: 'this-save' }),
    'stale'
  );
});

test('a guarded save without a save id is stale even when no save id is stored', async () => {
  state.updateError = noRowMatched();
  state.stored = { lastSaveId: null };
  assert.equal(await characterRepository.update(ID, { name: 'Hero' }, { expectedUpdatedAt: EXPECTED }), 'stale');
});

test('any other write failure is thrown, not read as an outcome', async () => {
  state.updateError = new Error('connection lost');
  await assert.rejects(
    characterRepository.update(ID, { name: 'Hero' }, { expectedUpdatedAt: EXPECTED, saveId: 'this-save' }),
    /connection lost/
  );
  assert.equal(state.lookups, 0);
});
