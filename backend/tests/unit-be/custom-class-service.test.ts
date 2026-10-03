import assert from 'node:assert/strict';
import { beforeEach, mock, test } from 'node:test';

import { blankClassDraft, type ClassDraft } from '../../src/lib/class-draft.ts';

const GM = { user: { id: 'gm-1', isAnonymous: false } };
const GUEST = { user: { id: 'guest-1', isAnonymous: true } };

const repo = {
  owned: 0,
  found: null as null | { id: number; lineageId: string; ownerUserId: string | null; isLatest: boolean; draft: ClassDraft },
  createThrows: null as unknown,
  created: [] as Array<{ owner: string; draft: ClassDraft }>,
  updated: [] as Array<{ id: number; draft: ClassDraft }>,
  specs: [] as unknown[],
};

mock.module('../../src/repositories/custom-class-repository.js', {
  namedExports: {
    customClassRepository: {
      countOwnedLineages: async () => repo.owned,
      create: async (owner: string, draft: ClassDraft) => {
        if (repo.createThrows) throw repo.createThrows;
        repo.created.push({ owner, draft });
        return 42;
      },
      update: async (id: number, draft: ClassDraft) => {
        repo.updated.push({ id, draft });
      },
      findWithText: async () => repo.found,
      listOwned: async () => [],
    },
  },
});
mock.module('../../src/lib/generate-character.js', {
  namedExports: {
    buildCharacterDataFromSpec: async (_classId: unknown, spec: unknown) => {
      repo.specs.push(spec);
      return { name: 'Nameless', classlessStatOptions: [] };
    },
  },
});
mock.module('../../src/lib/get-character-full.js', {
  namedExports: { hydrateCharacterRow: async (row: Record<string, unknown>) => ({ ...row, hydrated: true }) },
});

const { createCustomClassService } = await import('../../src/services/custom-class-service.js');
const service = createCustomClassService({ error: () => {} });

const ready = (): ClassDraft => ({
  ...blankClassDraft(),
  name: { en: 'Bog Witch', pl: '' },
  description: { en: 'The mire keeps what you give it.', pl: '' },
  origins: [{ en: 'A drowned village', pl: '' }],
});

beforeEach(() => {
  repo.owned = 0;
  repo.found = null;
  repo.createThrows = null;
  repo.created = [];
  repo.updated = [];
  repo.specs = [];
});

test('a GM saves a complete class as their own', async () => {
  const result = await service.create({ session: GM, draft: ready() });

  assert.deepEqual(result, { ok: true, value: { id: 42 } });
  assert.equal(repo.created[0].owner, 'gm-1');
});

test('guests and signed-out visitors cannot forge classes', async () => {
  const result = await service.create({ session: GUEST, draft: ready() });

  assert.equal(result.ok, false);
  assert.equal(!result.ok && result.error.statusCode, 401);
});

test('a draft with problems is refused, naming each one', async () => {
  const result = await service.create({ session: GM, draft: { ...ready(), origins: [] } });

  assert.equal(result.ok, false);
  assert.equal(!result.ok && result.error.code, 'CLASS_DRAFT_INVALID');
  assert.match(!result.ok ? result.error.message : '', /Add at least one origin/);
  assert.equal(repo.created.length, 0);
});

test('the class cap refuses with a specific message', async () => {
  repo.owned = 50;

  const result = await service.create({ session: GM, draft: ready() });

  assert.equal(!result.ok && result.error.code, 'CLASS_LIMIT_REACHED');
  assert.match(!result.ok ? result.error.message : '', /You have 50 classes, the most one account can hold/);
});

test('a second class with the same name is a clear 409', async () => {
  repo.createThrows = new Error('conflicting key value violates exclusion constraint "classes_name_per_owner"');

  const result = await service.create({ session: GM, draft: ready() });

  assert.equal(!result.ok && result.error.code, 'CLASS_NAME_TAKEN');
  assert.match(!result.ok ? result.error.message : '', /You already have a class called “Bog Witch”/);
});

test("only the owner can load or edit a class, and only its latest version", async () => {
  repo.found = { id: 7, lineageId: 'l', ownerUserId: 'someone-else', isLatest: true, draft: ready() };
  assert.equal((await service.get({ session: GM, id: 7 })).ok, false);
  assert.equal((await service.update({ session: GM, id: 7, draft: ready() })).ok, false);

  repo.found = { id: 7, lineageId: 'l', ownerUserId: 'gm-1', isLatest: false, draft: ready() };
  const stale = await service.update({ session: GM, id: 7, draft: ready() });
  assert.equal(!stale.ok && stale.error.code, 'CLASS_NOT_LATEST');

  repo.found = { id: 7, lineageId: 'l', ownerUserId: 'gm-1', isLatest: true, draft: ready() };
  assert.deepEqual(await service.update({ session: GM, id: 7, draft: ready() }), { ok: true, value: { id: 7 } });
  assert.equal(repo.updated.length, 1);
});

test('a test roll rolls from the draft, keeps nothing, and ignores missing text', async () => {
  const result = await service.testRoll({
    session: GM,
    draft: { ...ready(), origins: [] },
    language: 'en',
    locale: 'en',
  });

  assert.equal(result.ok, true);
  assert.equal(result.ok && result.value.hydrated, true);
  assert.equal(result.ok && 'classlessStatOptions' in result.value, false);
  assert.equal(repo.specs.length, 1);
  assert.equal(repo.created.length + repo.updated.length, 0);
});
