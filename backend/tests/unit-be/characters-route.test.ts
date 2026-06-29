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

const classlessCharacter = {
  ...fullCharacter,
  classId: null,
  className: null,
  classDescription: null,
  origin: null,
  habit: null,
  tale: null,
  bodyDescription: null,
  trait1: null,
  trait2: null,
};

const generateCalls: Array<{ classId: number | null; roller: unknown; userId?: string }> = [];
const createFromDraftCalls: Array<{ draft: unknown; userId: string }> = [];
const draftCalls: Array<{
  session: unknown;
  classId?: number | null;
  classless?: boolean;
  name?: string;
  seeds?: unknown;
  dropLowestAbilities?: string[];
  locale: string;
}> = [];
const rerollCalls: Array<{ session: unknown; draft: unknown; section: string; locale: string }> = [];
const listClassCalls: Array<{ locale: string }> = [];
const updateCalls: unknown[] = [];
const getFullCalls: Array<{ id: string; locale: string }> = [];
let currentSession: Session = null;
let getFullResult: Record<string, unknown> | null = fullCharacter;

function resetState(): void {
  generateCalls.length = 0;
  createFromDraftCalls.length = 0;
  draftCalls.length = 0;
  rerollCalls.length = 0;
  listClassCalls.length = 0;
  updateCalls.length = 0;
  getFullCalls.length = 0;
  currentSession = null;
  getFullResult = fullCharacter;
  draftResult = defaultDraftResult();
}

const validSeeds = Object.fromEntries(
  ['name', 'stats', 'omens', 'silver', 'origin', 'abilities', 'gear', 'personality']
    .map((section) => [section, 'a'.repeat(64)])
);
const validDraftPayload = { classId: 1, classless: false, seeds: validSeeds };
type DraftServiceResult = {
  draft: {
    classId: number | null;
    classless: boolean;
    seeds: Record<string, string>;
    dropLowestAbilities?: string[];
  };
  preview: Record<string, unknown>;
};

function defaultDraftResult(): DraftServiceResult {
  return {
    draft: validDraftPayload,
    preview: {
      ...fullCharacter,
      id: null,
      classId: 1,
    },
  };
}

let draftResult = defaultDraftResult();

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
    generateCharacter: async (classId: number | null, roller: unknown, userId?: string) => {
      generateCalls.push({ classId, roller, userId });
      return generatedCharacterId;
    },
    createCharacterFromDraft: async (draft: unknown, userId: string) => {
      createFromDraftCalls.push({ draft, userId });
      return generatedCharacterId;
    },
  },
});

mock.module('../../src/repositories/character-repository.js', {
  namedExports: {
    characterRepository: {
      classExists: async () => true,
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

mock.module('../../src/services/character-draft-service.js', {
  namedExports: {
    createCharacterDraftService: () => ({
      createDraft: async (input: {
        session: unknown;
        classId?: number | null;
        classless?: boolean;
        name?: string;
        seeds?: unknown;
        dropLowestAbilities?: string[];
        locale: string;
      }) => {
        draftCalls.push(input);
        return { ok: true, value: draftResult };
      },
      rerollSection: async (input: {
        session: unknown;
        draft: unknown;
        section: string;
        locale: string;
      }) => {
        rerollCalls.push(input);
        return { ok: true, value: draftResult };
      },
      listClasses: async (input: { locale: string }) => {
        listClassCalls.push(input);
        return {
          ok: true,
          value: [{ id: 1, name: 'Gutterborn Scvm', description: null }],
        };
      },
    }),
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

const { default: errorHandlerPlugin } = await import('../../src/plugins/error-handler.js');
const { default: characterRoutes } = await import('../../src/routes/characters/index.js');

async function buildApp() {
  const app = Fastify({ logger: false });
  app.decorateRequest('appSession', null);
  app.addHook('onRequest', async (request) => {
    (request as typeof request & { appSession: Session }).appSession = currentSession;
  });
  await app.register(errorHandlerPlugin);
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
  // Ownership is now bound atomically inside generateCharacter (no orphan
  // window), so there must be NO separate character.update bind call.
  assert.equal(generateCalls[0].userId, 'user-1');
  assert.deepEqual(createFromDraftCalls, []);
  assert.deepEqual(updateCalls, []);
  assert.deepEqual(getFullCalls, [
    { id: generatedCharacterId, locale: 'pl' },
  ]);

  await app.close();
});

test('POST /draft forwards class choice and locale to the draft service', async () => {
  resetState();
  currentSession = { user: { id: 'user-1' } };
  const app = await buildApp();

  const response = await app.inject({
    method: 'POST',
    url: '/draft?locale=en',
    payload: { classId: 2, name: 'Rotmaw' },
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.json().draft.classId, 1);
  assert.equal(draftCalls[0].classId, 2);
  assert.equal(draftCalls[0].name, 'Rotmaw');
  assert.equal(draftCalls[0].locale, 'en');

  await app.close();
});

test('POST /draft serializes classless previews with null class fields', async () => {
  resetState();
  currentSession = { user: { id: 'user-1' } };
  draftResult = {
    draft: { classId: null, classless: true, seeds: validSeeds },
    preview: {
      ...classlessCharacter,
      id: null,
    },
  };
  const app = await buildApp();

  const response = await app.inject({
    method: 'POST',
    url: '/draft?locale=en',
    payload: { classless: true },
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.json().draft.classId, null);
  assert.equal(response.json().preview.classId, null);
  assert.equal(response.json().preview.className, null);
  assert.equal(response.json().preview.origin, null);

  await app.close();
});

test('POST /draft forwards classless drop-lowest choices', async () => {
  resetState();
  currentSession = { user: { id: 'user-1' } };
  draftResult = {
    draft: {
      classId: null,
      classless: true,
      seeds: validSeeds,
      dropLowestAbilities: ['strength', 'presence'],
    },
    preview: {
      ...classlessCharacter,
      id: null,
    },
  };
  const app = await buildApp();

  const response = await app.inject({
    method: 'POST',
    url: '/draft?locale=en',
    payload: {
      classId: null,
      classless: true,
      dropLowestAbilities: ['strength', 'presence'],
    },
  });

  assert.equal(response.statusCode, 200);
  assert.deepEqual(draftCalls[0].dropLowestAbilities, ['strength', 'presence']);
  assert.deepEqual(response.json().draft.dropLowestAbilities, ['strength', 'presence']);

  await app.close();
});

test('POST /draft/reroll/:section rejects unknown sections with 400', async () => {
  resetState();
  currentSession = { user: { id: 'user-1' } };
  const app = await buildApp();

  const response = await app.inject({
    method: 'POST',
    url: '/draft/reroll/luck',
    payload: { draft: validDraftPayload },
  });

  assert.equal(response.statusCode, 400);
  assert.deepEqual(rerollCalls, []);

  await app.close();
});

test('POST /draft/reroll/stats forwards draft and section', async () => {
  resetState();
  currentSession = { user: { id: 'user-1' } };
  const app = await buildApp();

  const response = await app.inject({
    method: 'POST',
    url: '/draft/reroll/stats?locale=en',
    payload: { draft: validDraftPayload },
  });

  assert.equal(response.statusCode, 200);
  assert.equal(rerollCalls[0].section, 'stats');
  assert.deepEqual(rerollCalls[0].draft, validDraftPayload);

  await app.close();
});

test('GET /classes returns the localized class list', async () => {
  resetState();
  const app = await buildApp();

  const response = await app.inject({
    method: 'GET',
    url: '/classes?locale=en',
  });

  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.json(), [{ id: 1, name: 'Gutterborn Scvm', description: null }]);
  assert.deepEqual(listClassCalls, [{ locale: 'en' }]);

  await app.close();
});

test('POST /new accepts a draft body', async () => {
  resetState();
  currentSession = { user: { id: 'user-1' } };
  const app = await buildApp();

  const response = await app.inject({
    method: 'POST',
    url: '/new?locale=en',
    payload: { draft: validDraftPayload },
  });

  assert.equal(response.statusCode, 201);
  assert.deepEqual(generateCalls, []);
  assert.deepEqual(createFromDraftCalls, [{ draft: validDraftPayload, userId: 'user-1' }]);
  assert.deepEqual(getFullCalls, [{ id: generatedCharacterId, locale: 'en' }]);

  await app.close();
});

test('POST /new returns a classless draft character', async () => {
  resetState();
  currentSession = { user: { id: 'user-1' } };
  getFullResult = classlessCharacter;
  const classlessDraftPayload = {
    classId: null,
    classless: true,
    seeds: validSeeds,
    dropLowestAbilities: ['strength', 'presence'],
  };
  const app = await buildApp();

  const response = await app.inject({
    method: 'POST',
    url: '/new?locale=en',
    payload: { draft: classlessDraftPayload },
  });

  assert.equal(response.statusCode, 201);
  assert.equal(response.json().classId, null);
  assert.equal(response.json().className, null);
  assert.equal(response.json().origin, null);
  assert.deepEqual(createFromDraftCalls, [{ draft: classlessDraftPayload, userId: 'user-1' }]);

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
