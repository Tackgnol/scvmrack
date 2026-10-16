import assert from 'node:assert/strict';
import { beforeEach, mock, test } from 'node:test';

const buildCalls: Array<{ classId: number | null; rollerFor: unknown; options: unknown }> = [];
const hydrateCalls: Array<{ row: Record<string, unknown>; locale: string }> = [];
type Scope = { classIds: number[]; acceptedClassIds: number[]; classlessEnabled: boolean; party: null | { id: string; ownerUserId: string } };
const allowAll = (): Scope => ({ classIds: [1, 2, 3, 4, 5, 6], acceptedClassIds: [1, 2, 3, 4, 5, 6], classlessEnabled: true, party: null });
let scope: Scope | { gone: true } = allowAll();
const scopeCalls: Array<string | null | undefined> = [];
let listClassesResult: Array<{ id: number; name: string | null; description: string | null }> = [];
const listedIds: number[][] = [];
let buildError: unknown = null;

const fakeCharacterData = {
  name: 'Brint',
  classId: 1,
  origin: 'origin.one',
  strength: 10,
  agility: 10,
  presence: 10,
  toughness: 10,
  maxHp: 4,
  currentHp: 4,
  omens: 1,
  maxOmens: 1,
  silver: 60,
  habit: null,
  tale: null,
  bodyDescription: null,
  trait1: null,
  trait2: null,
  abilities: [],
  equipment: [],
  equippedWeapons: [],
  equippedArmor: null,
};

mock.module('../../src/lib/class-translations.js', {
  namedExports: {
    // The rows these tests use already carry their text.
    translatedClassTexts: async (_locale: string, rows: Array<{ name: string; description?: string | null; blurb?: string | null }>) =>
      rows.map((row) => ({ name: row.name, description: row.description ?? row.blurb ?? null })),
  },
});
mock.module('../../src/lib/generate-character.js', {
  namedExports: {
    buildCharacterData: async (classId: number | null, rollerFor: unknown, options: unknown) => {
      buildCalls.push({ classId, rollerFor, options });
      if (buildError) {
        throw buildError;
      }
      return {
        ...fakeCharacterData,
        classId,
        ...(classId === null
          ? {
              classlessStatOptions: [
                {
                  ability: 'strength',
                  dice: [6, 6, 1, 1],
                  minTotal: 8,
                  maxTotal: 13,
                  selected: true,
                },
                {
                  ability: 'agility',
                  dice: [2, 2, 2, 2],
                  minTotal: 6,
                  maxTotal: 6,
                  selected: false,
                },
                {
                  ability: 'presence',
                  dice: [6, 5, 4, 3],
                  minTotal: 12,
                  maxTotal: 15,
                  selected: true,
                },
                {
                  ability: 'toughness',
                  dice: [1, 2, 3, 4],
                  minTotal: 6,
                  maxTotal: 9,
                  selected: false,
                },
              ],
            }
          : {}),
      };
    },
  },
});

mock.module('../../src/lib/get-character-full.js', {
  namedExports: {
    getCharacterFull: async () => null,
    hydrateCharacterRow: async (row: Record<string, unknown>, locale: string) => {
      hydrateCalls.push({ row, locale });
      return { ...row, hydrated: true };
    },
  },
});

mock.module('../../src/repositories/character-repository.js', {
  namedExports: {
    characterRepository: {
      listClassesByIds: async (ids: number[]) => {
        listedIds.push(ids);
        return listClassesResult;
      },
    },
  },
});

mock.module('../../src/services/party-class-pool-service.js', {
  namedExports: {
    resolvePartyClassPool: async (token: string | null | undefined) => {
      scopeCalls.push(token);
      if ('gone' in scope) {
        return {
          ok: false,
          error: { statusCode: 410, code: 'PARTY_INVITE_INVALID', message: 'gone' },
        };
      }
      return { ok: true, value: scope };
    },
  },
});

const { createCharacterDraftService } = await import('../../src/services/character-draft-service.js');
const { DRAFT_SECTIONS, SEED_PATTERN, randomSectionSeeds } = await import('../../src/lib/draft-seeds.js');

const log = { error: () => {} };
const session = { user: { id: 'user-1' } };

function reset(): void {
  buildCalls.length = 0;
  hydrateCalls.length = 0;
  scope = allowAll();
  scopeCalls.length = 0;
  listClassesResult = [];
  listedIds.length = 0;
  buildError = null;
}

beforeEach(() => {
  reset();
});

test('createDraft requires a session', async () => {
  const result = await createCharacterDraftService(log).createDraft({
    session: null,
    locale: 'en',
  });

  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.error.statusCode, 401);
  }
});

test('createDraft with explicit classId validates the class and returns draft + preview', async () => {
  const result = await createCharacterDraftService(log).createDraft({
    session,
    classId: 3,
    locale: 'en',
  });

  assert.equal(result.ok, true);
  if (!result.ok) {
    return;
  }
  const { draft, preview } = result.value as {
    draft: { classId: number | null; classless: boolean; seeds: Record<string, string> };
    preview: Record<string, unknown>;
  };
  assert.equal(draft.classId, 3);
  assert.equal(draft.classless, false);
  for (const section of DRAFT_SECTIONS) {
    assert.match(draft.seeds[section], SEED_PATTERN);
  }
  assert.equal(buildCalls[0].classId, 3);
  assert.equal(preview.hydrated, true);
  assert.equal(hydrateCalls[0].row.id, null);
});

test('createDraft rejects a class outside the scope with 409', async () => {
  const result = await createCharacterDraftService(log).createDraft({
    session,
    classId: 99,
    locale: 'en',
  });

  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.error.statusCode, 409);
    assert.equal(result.error.code, 'CLASS_NOT_AVAILABLE');
  }
});

test('createDraft resolves the invite to its pool and rejects classless when the pool disables it', async () => {
  scope = { classIds: [2], acceptedClassIds: [2], classlessEnabled: false, party: { id: 'party-1', ownerUserId: 'gm-1' } };

  const result = await createCharacterDraftService(log).createDraft({
    session,
    classless: true,
    inviteToken: 'invite-1',
    locale: 'en',
  });

  assert.deepEqual(scopeCalls, ['invite-1']);
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.error.code, 'CLASSLESS_NOT_AVAILABLE');
  }
});

test('createDraft passes a dead invite through as 410', async () => {
  scope = { gone: true };

  const result = await createCharacterDraftService(log).createDraft({
    session,
    classId: 1,
    inviteToken: 'rotated',
    locale: 'en',
  });

  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.error.statusCode, 410);
  }
  assert.equal(buildCalls.length, 0);
});

test('createDraft classless skips class validation and builds with null', async () => {
  const result = await createCharacterDraftService(log).createDraft({
    session,
    classless: true,
    locale: 'en',
  });

  assert.equal(result.ok, true);
  assert.equal(buildCalls[0].classId, null);
  if (result.ok) {
    const { draft, classlessStatOptions } = result.value as {
      draft: { classId: number | null; classless: boolean; dropLowestAbilities?: string[] };
      classlessStatOptions: unknown[];
    };
    assert.equal(draft.classless, true);
    assert.equal(draft.classId, null);
    assert.deepEqual(draft.dropLowestAbilities, []);
    assert.equal(classlessStatOptions.length, 4);
  }
});

test('createDraft classless preserves selected drop-lowest abilities', async () => {
  const result = await createCharacterDraftService(log).createDraft({
    session,
    classless: true,
    dropLowestAbilities: ['strength', 'presence'],
    locale: 'en',
  });

  assert.equal(result.ok, true);
  assert.deepEqual(
    (buildCalls[0].options as { dropLowestAbilities?: string[] }).dropLowestAbilities,
    ['strength', 'presence'],
  );
  if (result.ok) {
    assert.deepEqual(
      (result.value.draft as { dropLowestAbilities?: string[] }).dropLowestAbilities,
      ['strength', 'presence'],
    );
  }
});

test('createDraft with provided seeds reuses them', async () => {
  const seeds = randomSectionSeeds();

  const result = await createCharacterDraftService(log).createDraft({
    session,
    classId: 2,
    seeds,
    locale: 'en',
  });

  assert.equal(result.ok, true);
  if (result.ok) {
    const { draft } = result.value as { draft: { seeds: Record<string, string> } };
    assert.deepEqual(draft.seeds, seeds);
  }
});

test('createDraft applies a sanitized name override to draft previews', async () => {
  const result = await createCharacterDraftService(log).createDraft({
    session,
    classId: 1,
    name: '  Rotmaw  ',
    locale: 'en',
  });

  assert.equal(result.ok, true);
  if (!result.ok) {
    return;
  }
  const { draft, preview } = result.value as {
    draft: { name?: string };
    preview: Record<string, unknown>;
  };
  assert.equal(draft.name, 'Rotmaw');
  assert.equal(preview.name, 'Rotmaw');
  assert.equal(hydrateCalls[0].row.name, 'Rotmaw');
});

test('createDraft picks and records a random class from the scope when no class is supplied', async () => {
  scope = { classIds: [4], acceptedClassIds: [4], classlessEnabled: true, party: null };

  const result = await createCharacterDraftService(log).createDraft({
    session,
    locale: 'en',
  });

  assert.equal(result.ok, true);
  if (result.ok) {
    const { draft } = result.value as { draft: { classId: number | null; classless: boolean } };
    assert.equal(draft.classId, 4);
    assert.equal(draft.classless, false);
  }
});

test('rerollSection replaces exactly one seed', async () => {
  const seeds = randomSectionSeeds();
  const result = await createCharacterDraftService(log).rerollSection({
    session,
    draft: { classId: 1, classless: false, seeds },
    section: 'stats',
    locale: 'en',
  });

  assert.equal(result.ok, true);
  if (!result.ok) {
    return;
  }
  const { draft } = result.value as { draft: { seeds: Record<string, string> } };
  assert.notEqual(draft.seeds.stats, seeds.stats);
  for (const section of DRAFT_SECTIONS.filter((section: string) => section !== 'stats')) {
    assert.equal(draft.seeds[section], seeds[section]);
  }
});

test('rerollSection preserves classless drop-lowest choices', async () => {
  const seeds = randomSectionSeeds();
  const result = await createCharacterDraftService(log).rerollSection({
    session,
    draft: {
      classId: null,
      classless: true,
      seeds,
      dropLowestAbilities: ['strength', 'presence'],
    },
    section: 'stats',
    locale: 'en',
  });

  assert.equal(result.ok, true);
  if (!result.ok) {
    return;
  }
  assert.deepEqual(result.value.draft.dropLowestAbilities, ['strength', 'presence']);
  assert.deepEqual(
    (buildCalls[0].options as { dropLowestAbilities?: string[] }).dropLowestAbilities,
    ['strength', 'presence'],
  );
});

test('rerollSection preserves typed names except when rerolling the name section', async () => {
  const seeds = randomSectionSeeds();
  const service = createCharacterDraftService(log);

  const statsResult = await service.rerollSection({
    session,
    draft: { classId: 1, classless: false, seeds, name: 'Rotmaw' },
    section: 'stats',
    locale: 'en',
  });
  assert.equal(statsResult.ok, true);
  if (!statsResult.ok) {
    return;
  }
  assert.equal((statsResult.value.draft as { name?: string }).name, 'Rotmaw');
  assert.equal((statsResult.value.preview as Record<string, unknown>).name, 'Rotmaw');

  const nameResult = await service.rerollSection({
    session,
    draft: statsResult.value.draft,
    section: 'name',
    locale: 'en',
  });
  assert.equal(nameResult.ok, true);
  if (!nameResult.ok) {
    return;
  }
  assert.equal((nameResult.value.draft as { name?: string }).name, undefined);
  assert.equal((nameResult.value.preview as Record<string, unknown>).name, fakeCharacterData.name);
});

test('rerollSection rejects a class that left the scope', async () => {
  scope = { classIds: [2], acceptedClassIds: [2], classlessEnabled: true, party: null };

  const result = await createCharacterDraftService(log).rerollSection({
    session,
    draft: { classId: 1, classless: false, seeds: randomSectionSeeds() },
    section: 'gear',
    locale: 'en',
  });

  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.error.code, 'CLASS_NOT_AVAILABLE');
  }
});

test('listClasses lists the classes of the scope behind the invite', async () => {
  scope = { classIds: [1, 7], acceptedClassIds: [1, 7], classlessEnabled: true, party: null };
  listClassesResult = [{ id: 1, name: 'Gutterborn Scvm', description: null }];

  const result = await createCharacterDraftService(log).listClasses({ locale: 'en', inviteToken: 'invite-1' });

  assert.equal(result.ok, true);
  if (result.ok) {
    assert.deepEqual(result.value, listClassesResult);
  }
  assert.deepEqual(scopeCalls, ['invite-1']);
  assert.deepEqual(listedIds, [[1, 7]]);
});

test('createDraft maps unexpected failures to DRAFT_CREATE_FAILED', async () => {
  buildError = new Error('boom');

  const result = await createCharacterDraftService(log).createDraft({
    session,
    classId: 1,
    locale: 'en',
  });

  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.error.statusCode, 500);
    assert.equal(result.error.code, 'DRAFT_CREATE_FAILED');
  }
});
