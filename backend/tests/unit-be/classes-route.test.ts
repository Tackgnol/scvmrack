import assert from 'node:assert/strict';
import test, { mock } from 'node:test';

import Fastify from 'fastify';
import { blankClassDraft, type ClassDraft } from '../../src/lib/class-draft.ts';

const created: ClassDraft[] = [];

mock.module('../../src/services/custom-class-service.js', {
  namedExports: {
    createCustomClassService: () => ({
      create: async (input: { draft: ClassDraft }) => {
        created.push(input.draft);
        return { ok: true, value: { id: 9, draft: input.draft } };
      },
      listMine: async () => ({ ok: true, value: [] }),
      get: async () => ({ ok: true, value: { id: 9, draft: blankClassDraft() } }),
      update: async () => ({ ok: true, value: { id: 9, draft: blankClassDraft() } }),
      testRoll: async () => ({ ok: true, value: {} }),
    }),
  },
});

const { default: errorHandlerPlugin } = await import('../../src/plugins/error-handler.js');
const { default: classRoutes } = await import('../../src/routes/classes/index.js');

async function buildApp() {
  const app = Fastify({ logger: false });
  app.decorateRequest('appSession', null);
  await app.register(errorHandlerPlugin);
  await app.register(classRoutes);
  await app.ready();
  return app;
}

test('POST / saves a draft and answers 201 with its id', async () => {
  created.length = 0;
  const app = await buildApp();

  const response = await app.inject({ method: 'POST', url: '/', payload: { draft: blankClassDraft() } });

  assert.equal(response.statusCode, 201);
  assert.equal(response.json().id, 9);
  assert.equal(created.length, 1);
  await app.close();
});

test('the schema refuses dice off the book, more than 20 origins and text over 1,500 characters', async () => {
  created.length = 0;
  const app = await buildApp();
  const send = (draft: unknown) => app.inject({ method: 'POST', url: '/', payload: { draft } });

  const odd = await send({ ...blankClassDraft(), hpDie: 7 });
  const many = await send({ ...blankClassDraft(), origins: Array.from({ length: 21 }, () => ({ en: 'x', pl: '' })) });
  const long = await send({ ...blankClassDraft(), name: { en: 'x'.repeat(1501), pl: '' } });

  assert.deepEqual([odd.statusCode, many.statusCode, long.statusCode], [400, 400, 400]);
  assert.equal(created.length, 0);
  await app.close();
});
