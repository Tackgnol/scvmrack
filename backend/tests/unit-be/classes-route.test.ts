import assert from 'node:assert/strict';
import test, { mock } from 'node:test';

import Fastify from 'fastify';
import { blankClassDraft, type ClassDraft } from '../../src/lib/class-draft.ts';

const created: ClassDraft[] = [];
const drafts: Array<{
  id: number;
  classId: number | null;
  draft: ClassDraft;
  revision: number;
  updatedAt: string;
  expiresAt: string;
}> = [];

mock.module('../../src/services/custom-class-service.js', {
  namedExports: {
    createCustomClassService: () => ({
      create: async (input: { draft: ClassDraft }) => {
        created.push(input.draft);
        return {
          ok: true,
          value: {
            id: 9,
            draft: input.draft,
            version: 1,
            playingCount: 0,
            status: 'active',
            takenDownAt: null,
            takedownReason: null,
            savedRefs: {},
          },
        };
      },
      listMine: async () => ({ ok: true, value: [] }),
      get: async () => ({
        ok: true,
        value: {
          id: 9,
          draft: blankClassDraft(),
          version: 1,
          playingCount: 0,
          status: 'active',
          takenDownAt: null,
          takedownReason: null,
          savedRefs: {},
        },
      }),
      update: async () => ({
        ok: true,
        value: {
          id: 9,
          draft: blankClassDraft(),
          version: 1,
          playingCount: 0,
          status: 'active',
          takenDownAt: null,
          takedownReason: null,
          savedRefs: {},
        },
      }),
      testRoll: async () => ({ ok: true, value: {} }),
      listDrafts: async () => ({ ok: true, value: drafts }),
      getDraft: async (input: { id: number }) => ({
        ok: true,
        value: drafts.find((draft) => draft.id === input.id),
      }),
      saveDraft: async (input: {
        id?: number;
        classId: number | null;
        draft: ClassDraft;
        revision?: number;
      }) => {
        const existing =
          input.id === undefined
            ? undefined
            : drafts.find((draft) => draft.id === input.id);
        if (existing) {
          existing.draft = input.draft;
          existing.revision += 1;
          return { ok: true, value: existing };
        }
        const draft = {
          id: drafts.length + 1,
          classId: input.classId,
          draft: input.draft,
          revision: 1,
          updatedAt: new Date().toISOString(),
          expiresAt: new Date().toISOString(),
        };
        drafts.push(draft);
        return { ok: true, value: draft };
      },
      deleteDraft: async () => ({ ok: true, value: { deleted: true } }),
      remove: async () => ({ ok: true, value: { archived: false } }),
      restore: async () => ({ ok: true, value: { restored: true } }),
      setVisibility: async (input: { visibility: 'private' | 'public' }) => ({
        ok: true,
        value: { visibility: input.visibility },
      }),
    }),
  },
});

const { default: errorHandlerPlugin } = await import(
  '../../src/plugins/error-handler.js'
);
const { default: classRoutes } = await import(
  '../../src/routes/classes/index.js'
);

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

  const response = await app.inject({
    method: 'POST',
    url: '/',
    payload: { draft: blankClassDraft() },
  });

  assert.equal(response.statusCode, 201);
  assert.equal(response.json().id, 9);
  assert.equal(created.length, 1);
  await app.close();
});

test('the schema refuses dice off the book, more than 20 origins and text over 1,500 characters', async () => {
  created.length = 0;
  const app = await buildApp();
  const send = (draft: unknown) =>
    app.inject({ method: 'POST', url: '/', payload: { draft } });

  const odd = await send({ ...blankClassDraft(), hpDie: 7 });
  const many = await send({
    ...blankClassDraft(),
    origins: Array.from({ length: 21 }, () => ({ en: 'x', pl: '' })),
  });
  const long = await send({
    ...blankClassDraft(),
    name: { en: 'x'.repeat(1501), pl: '' },
  });

  assert.deepEqual(
    [odd.statusCode, many.statusCode, long.statusCode],
    [400, 400, 400]
  );
  assert.equal(created.length, 0);
  await app.close();
});

test('publish requires the sharing acknowledgement and unpublish is explicit', async () => {
  const app = await buildApp();

  const missingAcknowledgement = await app.inject({
    method: 'POST',
    url: '/9/publish',
    payload: { confirmed: false },
  });
  const published = await app.inject({
    method: 'POST',
    url: '/9/publish',
    payload: { confirmed: true },
  });
  const unpublished = await app.inject({
    method: 'POST',
    url: '/9/unpublish',
  });

  assert.equal(missingAcknowledgement.statusCode, 400);
  assert.deepEqual(published.json(), { visibility: 'public' });
  assert.deepEqual(unpublished.json(), { visibility: 'private' });
  await app.close();
});
test('draft routes keep incomplete work and require a revision for updates', async () => {
  drafts.length = 0;
  const app = await buildApp();

  const createdDraft = await app.inject({
    method: 'POST',
    url: '/drafts',
    payload: { draft: blankClassDraft() },
  });
  assert.equal(createdDraft.statusCode, 201);
  assert.equal(createdDraft.json().revision, 1);

  const missingRevision = await app.inject({
    method: 'PUT',
    url: '/drafts/1',
    payload: { draft: blankClassDraft() },
  });
  assert.equal(missingRevision.statusCode, 400);

  const updated = await app.inject({
    method: 'PUT',
    url: '/drafts/1',
    payload: { draft: blankClassDraft(), revision: 1 },
  });
  assert.equal(updated.statusCode, 200);
  assert.equal(updated.json().revision, 2);
  await app.close();
});