import assert from 'node:assert/strict';
import { beforeEach, mock, test } from 'node:test';

const buildCalls: Array<{ classId: number | null; rollerFor: unknown; options: unknown }> = [];
const hydrateCalls: Array<{ row: Record<string, unknown>; locale: string }> = [];
let classExistsResult = true;
let listClassesResult: Array<{ id: number; name: string | null; description: string | null }> = [];
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

mock.module('../../src/lib/generate-character.js', {
  namedExports: {
    buildCharacterData: async (classId: number | null, rollerFor: unknown, options: unknown) => {
      buildCalls.push({ classId, rollerFor, options });
      if (buildError) throw buildError;
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
    createCharacterFromDraft: async () => 'unused-here',
    generateCharacter: async () => 'unused-here',
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
      classExists: async () => classExistsResult,
      listClasses: async () => listClassesResult,
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
  classExistsResult = true;
  listClassesResult = [];
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
  if (!result.ok) assert.equal(result.error.statusCode, 401);
});

test('createDraft with explicit classId validates the class and returns draft + preview', async () => {
  const result = await createCharacterDraftService(log).createDraft({
    session,
    classId: 3,
    locale: 'en',
  });

  assert.equal(result.ok, true);
  if (!result.ok) return;
  const { draft, preview } = result.value as {
    draft: { classId: number | null; classless: boolean; seeds: Record<string, string> };
    preview: Record<string, unknown>;
  };
  assert.equal(draft.classId, 3);
  assert.equal(draft.classless, false);
  for (const section of DRAFT_SECTIONS) assert.match(draft.seeds[section], SEED_PATTERN);
  assert.equal(buildCalls[0].classId, 3);
  assert.equal(preview.hydrated, true);
  assert.equal(hydrateCalls[0].row.id, null);
});

test('createDraft rejects an unknown classId with 404', async () => {
  classExistsResult = false;

  const result = await createCharacterDraftService(log).createDraft({
    session,
    classId: 99,
    locale: 'en',
  });

  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.error.statusCode, 404);
    assert.equal(result.error.code, 'CLASS_NOT_FOUND');
  }
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
  if (!result.ok) return;
  const { draft, preview } = result.value as {
    draft: { name?: string };
    preview: Record<string, unknown>;
  };
  assert.equal(draft.name, 'Rotmaw');
  assert.equal(preview.name, 'Rotmaw');
  assert.equal(hydrateCalls[0].row.name, 'Rotmaw');
});

test('createDraft picks and records a random class when no class is supplied', async () => {
  listClassesResult = [{ id: 4, name: 'Wretched Royalty', description: null }];

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
  if (!result.ok) return;
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
  if (!result.ok) return;
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
  if (!statsResult.ok) return;
  assert.equal((statsResult.value.draft as { name?: string }).name, 'Rotmaw');
  assert.equal((statsResult.value.preview as Record<string, unknown>).name, 'Rotmaw');

  const nameResult = await service.rerollSection({
    session,
    draft: statsResult.value.draft,
    section: 'name',
    locale: 'en',
  });
  assert.equal(nameResult.ok, true);
  if (!nameResult.ok) return;
  assert.equal((nameResult.value.draft as { name?: string }).name, undefined);
  assert.equal((nameResult.value.preview as Record<string, unknown>).name, fakeCharacterData.name);
});

test('rerollSection validates the class still exists', async () => {
  classExistsResult = false;

  const result = await createCharacterDraftService(log).rerollSection({
    session,
    draft: { classId: 1, classless: false, seeds: randomSectionSeeds() },
    section: 'gear',
    locale: 'en',
  });

  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.error.statusCode, 404);
});

test('listClasses returns repository class summaries', async () => {
  listClassesResult = [{ id: 1, name: 'Gutterborn Scvm', description: null }];

  const result = await createCharacterDraftService(log).listClasses({ locale: 'en' });

  assert.equal(result.ok, true);
  if (result.ok) assert.deepEqual(result.value, listClassesResult);
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
