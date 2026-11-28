import assert from 'node:assert/strict';
import { beforeEach, mock, test } from 'node:test';
import { Prisma } from '@prisma/client';

const ID = '11111111-1111-4111-8111-111111111111';
const EXPECTED = new Date('2026-10-16T09:00:00.000Z');

const state = {
  updateError: null as unknown,
  receiptError: null as unknown,
  exists: true,
  updates: [] as Array<{ where: Record<string, unknown>; data: Record<string, unknown> }>,
  receipts: [] as Array<{ characterId: string; saveId: string }>,
  lookups: 0,
};

beforeEach(() => {
  state.updateError = null;
  state.receiptError = null;
  state.exists = true;
  state.updates = [];
  state.receipts = [];
  state.lookups = 0;
});

const tx = {
  character: {
    update: async (args: { where: Record<string, unknown>; data: Record<string, unknown> }) => {
      state.updates.push(args);
      if (state.updateError) {
        throw state.updateError;
      }
      return {};
    },
  },
  characterSaveReceipt: {
    create: async ({ data }: { data: { characterId: string; saveId: string } }) => {
      if (state.receiptError) {
        throw state.receiptError;
      }
      state.receipts.push(data);
      return data;
    },
    deleteMany: async () => {
      throw new Error('save receipts must never be pruned');
    },
  },
};

mock.module('../../src/lib/prisma.js', {
  defaultExport: {
    $transaction: async (work: (client: typeof tx) => Promise<unknown>) => work(tx),
    character: {
      findUnique: async () => {
        state.lookups++;
        return state.exists ? { userId: null } : null;
      },
    },
  },
});

const { characterRepository } = await import('../../src/repositories/character-repository.js');

const prismaError = (code: string) =>
  new Prisma.PrismaClientKnownRequestError(`prisma ${code}`, { code, clientVersion: '6.19.3' });

test('an unguarded save writes the patch and is saved, with no receipt', async () => {
  const outcome = await characterRepository.update(ID, { name: 'Hero' });
  assert.equal(outcome, 'saved');
  assert.deepEqual(state.updates, [{ where: { id: ID }, data: { name: 'Hero' } }]);
  assert.deepEqual(state.receipts, []);
});

test('a save id records a receipt and never prunes earlier ones', async () => {
  await characterRepository.update(ID, { name: 'Hero' }, { saveId: 'this-save' });
  assert.deepEqual(state.receipts, [{ characterId: ID, saveId: 'this-save' }]);
  assert.deepEqual(state.updates[0]?.data, { name: 'Hero' });
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
  assert.ok((write?.data.updatedAt as Date).getTime() > EXPECTED.getTime());
});

test('a save id that already has a receipt is replayed and writes nothing, guarded or not', async () => {
  state.receiptError = prismaError('P2002');
  assert.equal(await characterRepository.update(ID, { name: 'Hero' }, { saveId: 'this-save' }), 'replayed');
  assert.equal(
    await characterRepository.update(ID, { name: 'Hero' }, { expectedUpdatedAt: EXPECTED, saveId: 'this-save' }),
    'replayed'
  );
  assert.deepEqual(state.updates, []);
});

test('a receipt for a character that does not exist is missing', async () => {
  state.receiptError = prismaError('P2003');
  assert.equal(await characterRepository.update(ID, { name: 'Hero' }, { saveId: 'this-save' }), 'missing');
});

test('an unguarded save that matches no row is missing, without a second lookup', async () => {
  state.updateError = prismaError('P2025');
  assert.equal(await characterRepository.update(ID, { name: 'Hero' }), 'missing');
  assert.equal(state.lookups, 0);
});

test('a guarded save of a character that is gone is missing', async () => {
  state.updateError = prismaError('P2025');
  state.exists = false;
  assert.equal(
    await characterRepository.update(ID, { name: 'Hero' }, { expectedUpdatedAt: EXPECTED, saveId: 'this-save' }),
    'missing'
  );
});

test('a guarded save after another save landed is stale', async () => {
  state.updateError = prismaError('P2025');
  assert.equal(
    await characterRepository.update(ID, { name: 'Hero' }, { expectedUpdatedAt: EXPECTED, saveId: 'this-save' }),
    'stale'
  );
});

test('any other write failure is thrown, not read as an outcome', async () => {
  state.updateError = new Error('connection lost');
  await assert.rejects(
    characterRepository.update(ID, { name: 'Hero' }, { expectedUpdatedAt: EXPECTED, saveId: 'this-save' }),
    /connection lost/
  );
  assert.equal(state.lookups, 0);
});
