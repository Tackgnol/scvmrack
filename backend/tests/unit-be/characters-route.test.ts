import assert from 'node:assert/strict';
import test, { mock } from 'node:test';

import Fastify from 'fastify';

type Session = { user: { id: string } } | null;

const generatedCharacterId = '7b9fdd7d-5c5d-475c-9352-b38c0f02dc0d';

const fullCharacter = {
  id: generatedCharacterId,
  name: 'Ash',
  classId: 2,
  className: 'Class',
  classDescription: 'Description',
  origin: 'Origin',
  strength: 10,
  agility: 10,
  presence: 10,
  toughness: 10,
  maxHp: 4,
  currentHp: 4,
  omens: 2,
  maxOmens: 2,
  silver: 30,
  habit: 'Habit',
  tale: 'Tale',
  bodyDescription: 'Body',
  trait1: 'Trait one',
  trait2: 'Trait two',
  notes: '',
  abilities: [],
  equipment: [],
  storage: [],
  equippedWeapons: [],
  equippedArmor: null,
  modifiers: [],
  computedModifiers: [],
  encumbrance: 0,
  maxEncumbrance: 8,
  drToDodge: 12,
  drToMelee: 12,
  drToRanged: 12,
  createdAt: '2026-03-01T10:00:00.000Z',
  updatedAt: '2026-03-01T10:00:00.000Z',
};

const generateCalls: Array<{ classId: number | null; roller: unknown }> = [];
const updateCalls: unknown[] = [];
const getFullCalls: Array<{ id: string; locale: string }> = [];
let currentSession: Session = null;
let getFullResult: Record<string, unknown> | null = fullCharacter;

function resetState(): void {
  generateCalls.length = 0;
  updateCalls.length = 0;
  getFullCalls.length = 0;
  currentSession = null;
  getFullResult = fullCharacter;
}

const prismaMock = {
  character: {
    update: async (args: unknown) => {
      updateCalls.push(args);
      return {};
    },
    count: async () => 0,
    findUnique: async () => null,
    findMany: async () => [],
    deleteMany: async () => ({ count: 0 }),
  },
  class: {
    findMany: async () => [],
  },
  translation: {
    findMany: async () => [],
  },
};

mock.module('../../src/lib/prisma.js', {
  defaultExport: prismaMock,
});

mock.module('../../src/lib/generate-character.js', {
  namedExports: {
    generateCharacter: async (classId: number | null, roller: unknown) => {
      generateCalls.push({ classId, roller });
      return generatedCharacterId;
    },
  },
});

mock.module('../../src/lib/get-character-full.js', {
  namedExports: {
    getCharacterFull: async (id: string, locale: string) => {
      getFullCalls.push({ id, locale });
      return getFullResult;
    },
  },
});

mock.module('@tackgnol/rpg-tools-roller', {
  namedExports: {
    OSRandomEngine: class OSRandomEngine {},
    Roller: class Roller {
      async roll() {
        return { total: 1 };
      }
    },
  },
});

const { default: characterRoutes } = await import('../../src/routes/characters/index.js');

async function buildApp() {
  const app = Fastify({ logger: false });
  app.decorateRequest('appSession', null);
  app.addHook('onRequest', async (request) => {
    (request as typeof request & { appSession: Session }).appSession = currentSession;
  });
  await app.register(characterRoutes);
  await app.ready();
  return app;
}

test('POST /new generates, binds, and returns a session-owned character', async () => {
  resetState();
  currentSession = { user: { id: 'user-1' } };
  const app = await buildApp();

  const response = await app.inject({
    method: 'POST',
    url: '/new?locale=pl',
    payload: { classId: 2 },
  });

  assert.equal(response.statusCode, 201);
  assert.equal(response.json().id, generatedCharacterId);
  assert.equal(generateCalls.length, 1);
  assert.equal(generateCalls[0].classId, 2);
  assert.equal(typeof (generateCalls[0].roller as { roll?: unknown }).roll, 'function');
  assert.deepEqual(updateCalls, [
    {
      where: { id: generatedCharacterId },
      data: { userId: 'user-1' },
    },
  ]);
  assert.deepEqual(getFullCalls, [
    { id: generatedCharacterId, locale: 'pl' },
  ]);

  await app.close();
});

test('POST /new requires a session before generation runs', async () => {
  resetState();
  const app = await buildApp();

  const response = await app.inject({
    method: 'POST',
    url: '/new',
    payload: { classId: 2 },
  });

  assert.equal(response.statusCode, 401);
  assert.equal(response.json().code, 'SESSION_REQUIRED');
  assert.deepEqual(generateCalls, []);
  assert.deepEqual(updateCalls, []);
  assert.deepEqual(getFullCalls, []);

  await app.close();
});
