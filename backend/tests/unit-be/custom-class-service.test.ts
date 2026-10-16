import assert from 'node:assert/strict';
import { beforeEach, mock, test } from 'node:test';

import { blankClassDraft, blankClassItem, type ClassDraft } from '../../src/lib/class-draft.ts';

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
mock.module('../../src/repositories/catalog-repository.js', {
  namedExports: {
    catalogRepository: { findSharedItemsByKeys: async () => [] },
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
  detail: null as unknown,
};

/** The lineage state the fake transaction reads, and the writes it records. */
const lineage = {
  visibility: 'private' as 'private' | 'public',
  firstPublishedAt: null as Date | null,
  publishedToday: 0,
  versionIds: [7] as number[],
  played: new Set<number>(),
  moderated: new Set<number>(),
  restorable: 1,
  takenDownMidSave: false,
  writes: [] as string[],
};

mock.module('../../src/repositories/custom-class-repository.js', {
  namedExports: {
    customClassRepository: {
      transaction: async (work: (ops: unknown) => Promise<unknown>) =>
        work({
          lockOwner: async () => {},
          findPublishState: async () => ({
            lineageId: 'l',
            visibility: lineage.visibility,
            firstPublishedAt: lineage.firstPublishedAt,
            takenDownAt: lineage.takenDownMidSave ? new Date() : null,
          }),
          countFirstPublishedSince: async () => lineage.publishedToday,
          setVisibility: async (_lineageId: string, visibility: string) => {
            lineage.writes.push(`visibility:${visibility}`);
          },
          setStatus: async (_lineageId: string, status: string) => {
            lineage.writes.push(`status:${status}`);
            return lineage.restorable;
          },
          removeFromPools: async (_lineageId: string, keepOwnerUserId?: string) => {
            lineage.writes.push(`pools-except:${keepOwnerUserId ?? 'none'}`);
          },
          versionIds: async () => lineage.versionIds,
          playedVersionIds: async (ids: number[]) =>
            new Set(
              ids.filter(
                (id) => lineage.played.has(id) || (repo.found?.id === id && repo.found.playingCount > 0)
              )
            ),
          moderatedVersionIds: async (ids: number[]) => new Set(ids.filter((id) => lineage.moderated.has(id))),
          lockVersion: async () => {},
          lockLineage: async () => {},
          countOwnedLineages: async () => repo.owned,
          findVersionRow: async (id: number) => ({
            source: 'user',
            ownerUserId: 'gm-1',
            visibility: 'private',
            firstPublishedAt: null,
            lineageId: 'l',
            version: repo.found?.id === id ? repo.found.version : 1,
            takenDownAt: lineage.takenDownMidSave ? new Date() : null,
          }),
          updateVersion: async (id: number, draft: ClassDraft) => {
            repo.updated.push({ id, draft });
          },
          deleteVersions: async (ids: number[]) => {
            lineage.writes.push(`delete:${ids.join(',')}`);
          },
          insertVersion: async (fields: { lineageId?: string; ownerUserId?: string }, draft: ClassDraft) => {
            if (!fields.lineageId) {
              if (repo.createThrows) {
                throw repo.createThrows;
              }
              repo.created.push({ owner: fields.ownerUserId!, draft });
              return 42;
            }
            repo.versioned.push({ id: repo.found?.id ?? 0, draft });
            if (repo.found) {
              repo.found = { ...repo.found, id: 8, version: repo.found.version + 1, playingCount: 0, draft };
            }
            lineage.versionIds = [...lineage.versionIds, 8];
            return 8;
          },
        }),
      findWithText: async (id: number) => ({
        source: 'user',
        ...(repo.detail ?? repo.found ?? {
          id,
          lineageId: 'l',
          ownerUserId: 'gm-1',
          version: id === 8 ? 4 : 1,
          status: 'active',
          takenDownAt: null,
          isLatest: true,
          playingCount: 0,
          draft: repo.created.at(-1)?.draft,
        }),
      }),
      findLatestWithText: async () => repo.detail && { source: 'user', ...(repo.detail as object) },
      isVisibleToPartyMember: async () => false,
      listOwned: async () => [],
      deleteDraftsUpdatedBefore: async () => {},
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
          if (!input.force && existing.revision !== input.revision) {
            return null;
          }
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
        if (index < 0) {
          return false;
        }
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
  repo.detail = null;
  Object.assign(lineage, {
    visibility: 'private',
    firstPublishedAt: null,
    publishedToday: 0,
    versionIds: [7],
    played: new Set<number>(),
    moderated: new Set<number>(),
    restorable: 1,
    takenDownMidSave: false,
    writes: [],
  });
});

test('a GM saves a complete class as their own', async () => {
  const result = await service.create({ session: GM, draft: ready() });

  assert.equal(result.ok, true);
  assert.equal(result.ok && result.value.id, 42);
  assert.equal(result.ok && result.value.draft.name.en, 'Bog Witch');
  assert.equal(repo.created[0].owner, 'gm-1');
});

test('saving discards the autosaved draft it completes and returns each new item’s saved key', async () => {
  const autosaved = await service.saveDraft({ session: GM, classId: null, draft: ready() });
  assert.ok(autosaved.ok);
  const draft: ClassDraft = {
    ...ready(),
    abilities: [
      {
        random: false,
        name: { en: 'Hook Hand', pl: '' },
        text: { en: 'Catch.', pl: '' },
        modifiers: [],
        grantItem: 'new:hook',
        grantPet: null,
        table: null,
      },
    ],
    items: [{ ...blankClassItem('weapon'), ref: 'new:hook', name: { en: 'Hook', pl: '' } }],
  };
  repo.found = null;

  const result = await service.create({ session: GM, draft, draftId: autosaved.value.id });

  assert.equal(result.ok, true, JSON.stringify(!result.ok && result.error));
  assert.deepEqual(repo.drafts, []);
  assert.deepEqual(result.ok && Object.keys(result.value.savedRefs), ['new:hook']);
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
test('forking keeps superseded versions a scvm plays and deletes the rest', async () => {
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
  lineage.versionIds = [5, 6, 7];
  lineage.played = new Set([5, 7]);

  await service.update({ session: GM, id: 7, draft: ready() });

  assert.deepEqual(lineage.writes, ['delete:6']);
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
test('publishing refuses a class taken down after the request was checked', async () => {
  lineage.takenDownMidSave = true;
  const refused = await service.setVisibility({ session: GM, id: 7, visibility: 'public' });
  assert.equal(!refused.ok && refused.error.code, 'CLASS_TAKEN_DOWN');
  assert.deepEqual(lineage.writes, []);
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
  assert.deepEqual(lineage.writes, [
    'visibility:public',
    'visibility:private',
    'pools-except:gm-1',
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
  lineage.publishedToday = 5;

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
  assert.deepEqual(lineage.writes, []);
});
test('republishing a once-public class skips the daily limit', async () => {
  lineage.publishedToday = 5;
  lineage.firstPublishedAt = new Date('2026-01-01');

  const result = await service.setVisibility({ session: GM, id: 7, visibility: 'public' });

  assert.equal(result.ok, true);
  assert.deepEqual(lineage.writes, ['visibility:public']);
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
  lineage.played = new Set([7]);

  const removed = await service.remove({ session: GM, id: 7 });
  const restored = await service.restore({ session: GM, id: 7 });

  assert.equal(removed.ok && removed.value.archived, true);
  assert.equal(restored.ok && restored.value.restored, true);
  assert.deepEqual(lineage.writes, ['pools-except:none', 'status:archived', 'status:active']);
});
test('saving never deletes a version the moderation record refers to', async () => {
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
  lineage.versionIds = [5, 6, 7];
  lineage.played = new Set([7]);
  lineage.moderated = new Set([5]);

  const saved = await service.update({ session: GM, id: 7, draft: ready() });

  assert.equal(saved.ok, true);
  assert.deepEqual(lineage.writes, ['delete:6']);
});
test('a save refuses a class taken down after it was loaded, and forks a reported version', async () => {
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
  lineage.takenDownMidSave = true;
  const refused = await service.update({ session: GM, id: 7, draft: ready() });
  assert.equal(!refused.ok && refused.error.code, 'CLASS_TAKEN_DOWN');

  lineage.takenDownMidSave = false;
  lineage.moderated = new Set([7]);
  const forked = await service.update({ session: GM, id: 7, draft: ready() });
  assert.equal(forked.ok && forked.value.id, 8);
  assert.equal(repo.updated.length, 0);
});
test('removing a reported but unplayed class archives it instead of deleting', async () => {
  lineage.versionIds = [6, 7];
  lineage.moderated = new Set([6]);

  const removed = await service.remove({ session: GM, id: 7 });

  assert.equal(removed.ok && removed.value.archived, true);
  assert.deepEqual(lineage.writes, ['pools-except:none', 'status:archived']);
});
test('removing an unplayed class deletes every version', async () => {
  lineage.versionIds = [6, 7];

  const removed = await service.remove({ session: GM, id: 7 });

  assert.equal(removed.ok && removed.value.archived, false);
  assert.deepEqual(lineage.writes, ['pools-except:none', 'delete:6,7']);
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
    if (previous === undefined) {
      delete process.env.MODERATION_ADMIN_USER_IDS;
    } else {
      process.env.MODERATION_ADMIN_USER_IDS = previous;
    }
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
    if (previous === undefined) {
      delete process.env.MODERATION_ADMIN_USER_IDS;
    } else {
      process.env.MODERATION_ADMIN_USER_IDS = previous;
    }
  }
});
