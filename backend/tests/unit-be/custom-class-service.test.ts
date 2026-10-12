import assert from 'node:assert/strict';
import { beforeEach, mock, test } from 'node:test';

import { blankClassDraft, type ClassDraft } from '../../src/lib/class-draft.ts';

const GM = { user: { id: 'gm-1', isAnonymous: false } };
const GUEST = { user: { id: 'guest-1', isAnonymous: true } };
let creationBanned = false;

mock.module('../../src/repositories/creation-ban-repository.js', {
  namedExports: {
    creationBanRepository: {
      findActive: async () => creationBanned ? { reason: 'Repeated removals', bannedAt: new Date() } : null,
    },
  },
});
mock.module('../../src/lib/draft-seeds.js', {
  namedExports: {
    randomSectionSeeds: () => ({}),
    seededRollerFor: () => ({}),
  },
});

const repo = {
  owned: 0,
  found: null as null | {
    id: number;
    lineageId: string;
    ownerUserId: string | null;
    version: number;
    status: 'active' | 'archived';
    takenDownAt: Date | null;
    isLatest: boolean;
    playingCount: number;
    draft: ClassDraft;
  },
  createThrows: null as unknown,
  created: [] as Array<{ owner: string; draft: ClassDraft }>,
  updated: [] as Array<{ id: number; draft: ClassDraft }>,
  versioned: [] as Array<{ id: number; draft: ClassDraft }>,
  specs: [] as unknown[],
  drafts: [] as Array<{
    id: number;
    classId: number | null;
    draft: ClassDraft;
    revision: number;
    updatedAt: Date;
  }>,
  newDraftCount: 0,
  removeResult: { archived: false },
  restoreResult: true,
  publishAllowed: true,
  visibilityChanges: [] as Array<{ id: number; visibility: 'private' | 'public' }>,
  detail: null as unknown,
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
      createVersion: async (id: number, draft: ClassDraft) => {
        repo.versioned.push({ id, draft });
        if (repo.found) repo.found = { ...repo.found, id: 8, version: repo.found.version + 1, playingCount: 0, draft };
        return 8;
      },
      findWithText: async (id: number) =>
        repo.detail ?? repo.found ?? {
          id,
          lineageId: 'l',
          ownerUserId: 'gm-1',
          version: id === 8 ? 4 : 1,
          status: 'active',
          takenDownAt: null,
          isLatest: true,
          playingCount: 0,
          draft: repo.created.at(-1)?.draft,
        },
      findLatestWithText: async () => repo.detail,
      isVisibleToPartyMember: async () => false,
      listOwned: async () => [],
      remove: async () => repo.removeResult,
      restore: async () => repo.restoreResult,
      publish: async (id: number) => {
        repo.visibilityChanges.push({ id, visibility: 'public' });
        return repo.publishAllowed;
      },
      setVisibility: async (id: number, visibility: 'private' | 'public') => {
        repo.visibilityChanges.push({ id, visibility });
      },
      listDrafts: async () => repo.drafts,
      getDraft: async (_owner: string, id: number) =>
        repo.drafts.find((draft) => draft.id === id) ?? null,
      countNewDrafts: async () => repo.newDraftCount,
      saveDraft: async (input: {
        id?: number;
        classId: number | null;
        draft: ClassDraft;
        revision?: number;
        force?: boolean;
      }) => {
        const existing =
          input.id === undefined
            ? null
            : repo.drafts.find((draft) => draft.id === input.id);
        if (existing) {
          if (!input.force && existing.revision !== input.revision) return null;
          existing.draft = input.draft;
          existing.revision += 1;
          return existing;
        }
        const draft = {
          id: repo.drafts.length + 1,
          classId: input.classId,
          draft: input.draft,
          revision: 1,
          updatedAt: new Date(),
        };
        repo.drafts.push(draft);
        return draft;
      },
      deleteDraft: async (_owner: string, id: number) => {
        const index = repo.drafts.findIndex((draft) => draft.id === id);
        if (index < 0) return false;
        repo.drafts.splice(index, 1);
        return true;
      },
      deleteDraftsForClasses: async (_owner: string, classIds: number[]) => {
        repo.drafts = repo.drafts.filter((draft) => !classIds.includes(draft.classId as number));
      },
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
  namedExports: {
    hydrateCharacterRow: async (row: Record<string, unknown>) => ({
      ...row,
      hydrated: true,
    }),
  },
});

const { createCustomClassService } = await import(
  '../../src/services/custom-class-service.js'
);
const service = createCustomClassService({ error: () => {} });

const ready = (): ClassDraft => ({
  ...blankClassDraft(),
  name: { en: 'Bog Witch', pl: '' },
  description: { en: 'The mire keeps what you give it.', pl: '' },
  origins: [{ en: 'A drowned village', pl: '' }],
});

beforeEach(() => {
  creationBanned = false;
  repo.owned = 0;
  repo.found = null;
  repo.createThrows = null;
  repo.created = [];
  repo.updated = [];
  repo.versioned = [];
  repo.specs = [];
  repo.drafts = [];
  repo.newDraftCount = 0;
  repo.removeResult = { archived: false };
  repo.restoreResult = true;
  repo.publishAllowed = true;
  repo.visibilityChanges = [];
  repo.detail = null;
});

test('a GM saves a complete class as their own', async () => {
  const result = await service.create({ session: GM, draft: ready() });

  assert.equal(result.ok, true);
  assert.equal(result.ok && result.value.id, 42);
  assert.equal(result.ok && result.value.draft.name.en, 'Bog Witch');
  assert.equal(repo.created[0].owner, 'gm-1');
});

test('a creation ban rejects new drafts and saved classes but keeps owned edits and publishing', async () => {
  repo.found = {
    id: 7, lineageId: 'l', ownerUserId: 'gm-1', version: 1,
    status: 'active', takenDownAt: null, isLatest: true, playingCount: 0, draft: ready(),
  };
  const started = await service.saveDraft({ session: GM, classId: null, draft: ready() });
  assert.equal(started.ok, true);
  creationBanned = true;
  const newDraft = await service.saveDraft({ session: GM, classId: null, draft: ready() });
  const newClass = await service.create({ session: GM, draft: ready() });
  assert.equal(!newDraft.ok && newDraft.error.code, 'CLASS_CREATION_BANNED');
  assert.equal(!newClass.ok && newClass.error.code, 'CLASS_CREATION_BANNED');
  assert.equal(repo.drafts.length, 1);
  assert.equal(repo.created.length, 0);

  const unfinished = await service.saveDraft({ session: GM, id: 1, classId: null, draft: ready(), revision: 1 });
  assert.equal(unfinished.ok, true);
  const existingDraft = await service.saveDraft({ session: GM, classId: 7, draft: ready() });
  const edited = await service.update({ session: GM, id: 7, draft: ready() });
  const published = await service.setVisibility({ session: GM, id: 7, visibility: 'public' });
  assert.equal(existingDraft.ok, true);
  assert.equal(edited.ok, true);
  assert.equal(published.ok, true);

  creationBanned = false;
  assert.equal((await service.create({ session: GM, draft: ready() })).ok, true);
});

test('guests and signed-out visitors cannot forge classes', async () => {
  const result = await service.create({ session: GUEST, draft: ready() });

  assert.equal(result.ok, false);
  assert.equal(!result.ok && result.error.statusCode, 401);
});

test('a draft with problems is refused, naming each one', async () => {
  const result = await service.create({
    session: GM,
    draft: { ...ready(), origins: [] },
  });

  assert.equal(result.ok, false);
  assert.equal(!result.ok && result.error.code, 'CLASS_DRAFT_INVALID');
  assert.match(
    !result.ok ? result.error.message : '',
    /Add at least one origin/
  );
  assert.equal(repo.created.length, 0);
});

test('the class cap refuses with a specific message', async () => {
  repo.owned = 50;

  const result = await service.create({ session: GM, draft: ready() });

  assert.equal(!result.ok && result.error.code, 'CLASS_LIMIT_REACHED');
  assert.match(
    !result.ok ? result.error.message : '',
    /You have 50 classes, the most one account can hold/
  );
});

test('a second class with the same name is a clear 409', async () => {
  repo.createThrows = new Error(
    'conflicting key value violates exclusion constraint "classes_name_per_owner"'
  );

  const result = await service.create({ session: GM, draft: ready() });

  assert.equal(!result.ok && result.error.code, 'CLASS_NAME_TAKEN');
  assert.match(
    !result.ok ? result.error.message : '',
    /You already have a class called “Bog Witch”/
  );
});

test('only the owner can load or edit a class, and only its latest version', async () => {
  repo.found = {
    id: 7,
    lineageId: 'l',
    ownerUserId: 'someone-else',
    version: 1,
    status: 'active',
    takenDownAt: null,
    isLatest: true,
    playingCount: 0,
    draft: ready(),
  };
  assert.equal((await service.get({ session: GM, id: 7 })).ok, false);
  assert.equal(
    (await service.update({ session: GM, id: 7, draft: ready() })).ok,
    false
  );

  repo.found = {
    id: 7,
    lineageId: 'l',
    ownerUserId: 'gm-1',
    version: 1,
    status: 'active',
    takenDownAt: null,
    isLatest: false,
    playingCount: 0,
    draft: ready(),
  };
  const stale = await service.update({ session: GM, id: 7, draft: ready() });
  assert.equal(!stale.ok && stale.error.code, 'CLASS_NOT_LATEST');

  repo.found = {
    id: 7,
    lineageId: 'l',
    ownerUserId: 'gm-1',
    version: 1,
    status: 'active',
    takenDownAt: null,
    isLatest: true,
    playingCount: 0,
    draft: ready(),
  };
  const edited = await service.update({ session: GM, id: 7, draft: ready() });
  assert.equal(edited.ok && edited.value.id, 7);
  assert.equal(repo.updated.length, 1);
});

test('saving a played current version forks it while an unplayed version changes in place', async () => {
  repo.found = {
    id: 7,
    lineageId: 'l',
    ownerUserId: 'gm-1',
    version: 3,
    status: 'active',
    takenDownAt: null,
    isLatest: true,
    playingCount: 3,
    draft: ready(),
  };

  const forked = await service.update({ session: GM, id: 7, draft: ready() });

  assert.equal(forked.ok && forked.value.id, 8);
  assert.equal(forked.ok && forked.value.version, 4);
  assert.equal(repo.versioned.length, 1);
  assert.equal(repo.updated.length, 0);
});
test('saving a class drops leftover drafts linked to it', async () => {
  repo.found = {
    id: 7,
    lineageId: 'l',
    ownerUserId: 'gm-1',
    version: 1,
    status: 'active',
    takenDownAt: null,
    isLatest: true,
    playingCount: 0,
    draft: ready(),
  };
  const linked = await service.saveDraft({ session: GM, classId: 7, draft: ready() });
  const unrelated = await service.saveDraft({ session: GM, classId: null, draft: ready() });
  assert.ok(linked.ok && unrelated.ok);

  const result = await service.update({ session: GM, id: 7, draft: ready() });

  assert.equal(result.ok, true);
  assert.deepEqual(repo.drafts.map((draft) => draft.classId), [null]);
});
test('an owner can publish and unpublish only the latest active class', async () => {
  const published = await service.setVisibility({
    session: GM,
    id: 7,
    visibility: 'public',
  });
  const unpublished = await service.setVisibility({
    session: GM,
    id: 7,
    visibility: 'private',
  });

  assert.equal(published.ok && published.value.visibility, 'public');
  assert.equal(unpublished.ok && unpublished.value.visibility, 'private');
  assert.deepEqual(repo.visibilityChanges, [
    { id: 7, visibility: 'public' },
    { id: 7, visibility: 'private' },
  ]);

  repo.found = {
    id: 7,
    lineageId: 'l',
    ownerUserId: 'gm-1',
    version: 1,
    status: 'active',
    takenDownAt: null,
    isLatest: false,
    playingCount: 0,
    draft: ready(),
  };
  const stale = await service.setVisibility({
    session: GM,
    id: 7,
    visibility: 'public',
  });
  assert.equal(!stale.ok && stale.error.code, 'CLASS_NOT_LATEST');
});
test('a GM sees the daily publication limit', async () => {
  repo.publishAllowed = false;

  const result = await service.setVisibility({
    session: GM,
    id: 7,
    visibility: 'public',
  });

  assert.equal(!result.ok && result.error.code, 'CLASS_DAILY_PUBLISH_LIMIT');
  assert.match(
    !result.ok ? result.error.message : '',
    /You've published 5 classes today\. Try again tomorrow\./
  );
});
test('removing a played class archives it and the owner can restore it', async () => {
  repo.found = {
    id: 7,
    lineageId: 'l',
    ownerUserId: 'gm-1',
    version: 3,
    status: 'active',
    takenDownAt: null,
    isLatest: true,
    playingCount: 1,
    draft: ready(),
  };
  repo.removeResult = { archived: true };

  const removed = await service.remove({ session: GM, id: 7 });
  const restored = await service.restore({ session: GM, id: 7 });

  assert.equal(removed.ok && removed.value.archived, true);
  assert.equal(restored.ok && restored.value.restored, true);
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

test('a GM can keep invalid work as a private draft and later resolves its revision', async () => {
  const incomplete = { ...ready(), origins: [] };
  const created = await service.saveDraft({
    session: GM,
    classId: null,
    draft: incomplete,
  });
  assert.equal(created.ok, true);
  assert.equal(created.ok && created.value.revision, 1);

  const stale = await service.saveDraft({
    session: GM,
    id: 1,
    classId: null,
    draft: incomplete,
    revision: 0,
  });
  assert.equal(!stale.ok && stale.error.code, 'DRAFT_STALE');

  const forced = await service.saveDraft({
    session: GM,
    id: 1,
    classId: null,
    draft: incomplete,
    revision: 0,
    force: true,
  });
  assert.equal(forced.ok && forced.value.revision, 2);
});

test('new private drafts are capped at three and remain invisible to guests', async () => {
  repo.newDraftCount = 3;
  const limited = await service.saveDraft({
    session: GM,
    classId: null,
    draft: ready(),
  });
  assert.equal(!limited.ok && limited.error.code, 'DRAFT_LIMIT_REACHED');

  const guest = await service.listDrafts({ session: GUEST });
  assert.equal(!guest.ok && guest.error.statusCode, 401);
});
test('a taken-down public class is hidden from everyone but moderators', async () => {
  repo.detail = {
    id: 7,
    lineageId: 'lineage-1',
    ownerUserId: 'gm-1',
    ownerName: 'GM',
    visibility: 'public',
    version: 1,
    status: 'active',
    takenDownAt: new Date('2026-10-08T12:00:00.000Z'),
    isLatest: true,
    playingCount: 0,
    draft: ready(),
  };
  const guest = await service.getDetail({ session: null, id: 7 });
  assert.equal(!guest.ok && guest.error.statusCode, 404);
  const owner = await service.getDetail({ session: GM, id: 7 });
  assert.equal(owner.ok, false);

  const previous = process.env.MODERATION_ADMIN_USER_IDS;
  process.env.MODERATION_ADMIN_USER_IDS = 'admin-1';
  try {
    const admin = await service.getDetail({ session: { user: { id: 'admin-1', isAnonymous: false } }, id: 7 });
    assert.equal(admin.ok && admin.value.reportable, false);
  } finally {
    if (previous === undefined) delete process.env.MODERATION_ADMIN_USER_IDS;
    else process.env.MODERATION_ADMIN_USER_IDS = previous;
  }
});
test('an allowlisted moderator can preview the exact reported class version', async () => {
  const previous = process.env.MODERATION_ADMIN_USER_IDS;
  process.env.MODERATION_ADMIN_USER_IDS = 'admin-1';
  repo.detail = {
    id: 7,
    lineageId: 'lineage-1',
    ownerUserId: 'other-gm',
    ownerName: 'Other GM',
    visibility: 'private',
    version: 1,
    status: 'archived',
    takenDownAt: new Date('2026-10-08T12:00:00.000Z'),
    isLatest: false,
    playingCount: 1,
    draft: ready(),
  };
  try {
    const result = await service.getDetail({
      session: { user: { id: 'admin-1', isAnonymous: false } },
      id: 7,
    });
    assert.equal(result.ok && result.value.id, 7);
    assert.equal(result.ok && result.value.version, 1);
  } finally {
    if (previous === undefined) delete process.env.MODERATION_ADMIN_USER_IDS;
    else process.env.MODERATION_ADMIN_USER_IDS = previous;
  }
});
