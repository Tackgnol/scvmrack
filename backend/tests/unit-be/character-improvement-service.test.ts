import assert from 'node:assert/strict';
import test, { mock } from 'node:test';

import type { Prisma } from '@prisma/client';
import type { ImprovementDraft, RollResult } from '../../src/lib/getting-better.js';

const characterId = '7b9fdd7d-5c5d-475c-9352-b38c0f02dc0d';
const improvementId = 'd24ac091-af57-47b8-9a1f-003cf4f274b9';
const session = {
  session: { id: 'session-1' },
  user: { id: 'user-1', isAnonymous: false },
};

type CharacterRow = {
  id: string;
  userId: string | null;
  sessionId: string | null;
  classId: number | null;
  maxHp: number;
  silver: number | null;
  strength: number;
  agility: number;
  presence: number;
  toughness: number;
  abilities: unknown;
  equipment: unknown;
  updatedAt: Date;
  partyId: string | null;
};

type ImprovementRow = {
  id: string;
  characterId: string;
  sequence: number;
  rolledDraft: unknown;
  applied: unknown | null;
  snapshotHash: string;
  createdAt: Date;
  updatedAt: Date;
  appliedAt: Date | null;
};

function defaultCharacterRow(): CharacterRow {
  return {
    id: characterId,
    userId: 'user-1',
    sessionId: null,
    classId: 1,
    maxHp: 10,
    silver: 5,
    strength: 9,
    agility: 9,
    presence: 9,
    toughness: 9,
    abilities: [],
    equipment: [],
    updatedAt: new Date('2026-07-07T10:00:00.000Z'),
    partyId: null,
  };
}

let characterRow: CharacterRow | null = defaultCharacterRow();
let activeImprovement: ImprovementRow | null = null;
let appliedCount = 0;
let createCalls = 0;
let applyCalls: Array<{
  characterId: string;
  improvementId: string;
  characterData: Prisma.CharacterUpdateInput;
  applied: Prisma.InputJsonValue;
}> = [];
let classAbilities: Array<{
  key: string;
  id: number;
  position: number | null;
  isRandom: boolean | null;
  grantItemKey?: string | null;
  grantPetKey?: string | null;
}> = [];
let classRule: 'book' | 'book_plus_ability' | 'specialist' = 'book';
let classNoteKey: string | null = null;
let latestClassLookup: number | null = null;
let rollQueue: RollResult[] = [];
let rollCalls: string[] = [];
let getFullCalls: Array<{ id: string; locale: string }> = [];
let translationCalls: Array<{ locale: string; keys: string[] }> = [];

function resetState(): void {
  characterRow = defaultCharacterRow();
  activeImprovement = null;
  appliedCount = 0;
  createCalls = 0;
  applyCalls = [];
  classAbilities = [];
  classRule = 'book';
  classNoteKey = null;
  latestClassLookup = null;
  rollQueue = [];
  rollCalls = [];
  getFullCalls = [];
  translationCalls = [];
}

function enqueuePreviewRolls(): void {
  rollQueue.push(
    { total: 12 },
    { total: 4 },
    { total: 1 },
    { total: 2 },
    { total: 3 },
    { total: 4 },
    { total: 5 }
  );
}

mock.module('@tackgnol/rpg-tools-roller', {
  namedExports: {
    OSRandomEngine: class OSRandomEngine {},
    Roller: class Roller {
      async roll(notation: string): Promise<RollResult> {
        rollCalls.push(notation);
        const next = rollQueue.shift();
        if (!next) {
          throw new Error(`No test roll queued for ${notation}`);
        }
        return next;
      }
    },
  },
});

mock.module('../../src/repositories/character-improvement-repository.js', {
  namedExports: {
    characterImprovementRepository: {
      getCharacterForImprovement: async () => characterRow,
      findActive: async () => activeImprovement,
      findActiveById: async (id: string, idImprovement: string) =>
        activeImprovement?.characterId === id &&
        activeImprovement.id === idImprovement &&
        activeImprovement.appliedAt === null
          ? activeImprovement
          : null,
      countApplied: async () => appliedCount,
      createActive: async (
        id: string,
        sequence: number,
        rolledDraft: Prisma.InputJsonValue,
        snapshotHash: string
      ) => {
        createCalls += 1;
        activeImprovement = {
          id: improvementId,
          characterId: id,
          sequence,
          rolledDraft,
          applied: null,
          snapshotHash,
          createdAt: new Date('2026-07-07T10:01:00.000Z'),
          updatedAt: new Date('2026-07-07T10:01:00.000Z'),
          appliedAt: null,
        };
        return activeImprovement;
      },
      updateRolledDraft: async (
        id: string,
        idImprovement: string,
        rolledDraft: Prisma.InputJsonValue,
        snapshotHash: string
      ) => {
        if (
          activeImprovement?.characterId !== id ||
          activeImprovement.id !== idImprovement ||
          activeImprovement.appliedAt !== null
        ) {
          return null;
        }
        activeImprovement = {
          ...activeImprovement,
          rolledDraft,
          snapshotHash,
          updatedAt: new Date('2026-07-07T10:02:00.000Z'),
        };
        return activeImprovement;
      },
      findScrolls: async (kind: 'sacred' | 'unclean') => [
        { key: `${kind}-one`, roll: 1, tags: ['scroll', kind] },
        { key: `${kind}-two`, roll: 2, tags: ['scroll', kind] },
      ],
      findLatestClassCatalog: async (classId: number) => {
        latestClassLookup = classId;
        return {
          gettingBetterRule: classRule,
          gettingBetterNoteKey: classNoteKey,
          languages: ['en', 'pl'],
          abilities: classAbilities,
        };
      },
      applyInTransaction: async (input: {
        characterId: string;
        improvementId: string;
        characterData: Prisma.CharacterUpdateInput;
        applied: Prisma.InputJsonValue;
      }) => {
        applyCalls.push(input);
        if (!activeImprovement || activeImprovement.appliedAt !== null) {
          return { applied: false };
        }
        activeImprovement = {
          ...activeImprovement,
          applied: input.applied,
          appliedAt: new Date('2026-07-07T10:03:00.000Z'),
        };
        return { applied: true, partyId: characterRow?.partyId ?? null };
      },
    },
  },
});

mock.module('../../src/repositories/catalog-repository.js', {
  namedExports: {
    catalogRepository: {
      findTranslations: async (locale: string, keys: string[]) => {
        translationCalls.push({ locale, keys });
        return keys.map((key) => ({
          key,
          value: `${locale}:${key}`,
        }));
      },
      findPetsByKeys: async (keys: string[]) =>
        keys.filter((key) => key === 'pets.rat').map((key) => ({ key, hp: 2 })),
      findEquipmentByKeys: async () => [],
    },
  },
});

mock.module('../../src/lib/get-character-full.js', {
  namedExports: {
    getCharacterFull: async (id: string, locale: string) => {
      getFullCalls.push({ id, locale });
      return { id, locale, refreshed: true };
    },
  },
});

const { createCharacterImprovementService } = await import(
  '../../src/services/character-improvement-service.js'
);

const log = {
  error: mock.fn(),
};

async function createPreview(): Promise<ImprovementDraft> {
  enqueuePreviewRolls();
  const service = createCharacterImprovementService(log);
  const result = await service.getOrCreatePreview({ id: characterId, session });
  assert.equal(result.ok, true);
  assert.ok(activeImprovement);
  return activeImprovement.rolledDraft as ImprovementDraft;
}

test('getOrCreatePreview creates once and returns the active preview on reopen', async () => {
  resetState();
  const service = createCharacterImprovementService(log);
  enqueuePreviewRolls();

  const first = await service.getOrCreatePreview({ id: characterId, session });
  const second = await service.getOrCreatePreview({ id: characterId, session });

  assert.equal(first.ok, true);
  assert.equal(second.ok, true);
  assert.equal(createCalls, 1);
  assert.deepEqual(second, first);
  assert.deepEqual(rollCalls, [
    '6d10',
    '1d6',
    '1d6',
    '1d6',
    '1d6',
    '1d6',
    '1d6',
  ]);
});

test('rerollSection replaces only the requested section', async () => {
  resetState();
  const originalDraft = await createPreview();
  const service = createCharacterImprovementService(log);
  rollQueue = [{ total: 20 }, { total: 5 }];
  rollCalls = [];

  const result = await service.rerollSection({
    id: characterId,
    improvementId,
    section: 'hp',
    session,
  });

  assert.equal(result.ok, true);
  const rerolledDraft = activeImprovement?.rolledDraft as ImprovementDraft;
  assert.equal(rerolledDraft.hp.check.total, 20);
  assert.equal(rerolledDraft.hp.increase?.total, 5);
  assert.deepEqual(rerolledDraft.debris, originalDraft.debris);
  assert.deepEqual(rerolledDraft.abilities, originalDraft.abilities);
  assert.deepEqual(rollCalls, ['6d10', '1d6']);
});

test('apply blocks stale previews before writing the character', async () => {
  resetState();
  const draft = await createPreview();
  assert.ok(characterRow);
  characterRow = {
    ...characterRow,
    updatedAt: new Date('2026-07-07T10:05:00.000Z'),
  };
  const service = createCharacterImprovementService(log);

  const result = await service.apply({
    id: characterId,
    improvementId,
    draft,
    session,
    rawLocale: 'en',
  });

  assert.equal(result.ok, false);
  assert.equal(result.ok ? '' : result.error.code, 'STALE_IMPROVEMENT_PREVIEW');
  assert.equal(applyCalls.length, 0);
});

test('apply recomputes table-submitted derived ability values', async () => {
  resetState();
  const draft = structuredClone(await createPreview());
  draft.abilities.strength = {
    ...draft.abilities.strength,
    roll: { source: 'table', total: 1 },
    toModifier: 6,
    toScore: 21,
    outcome: 'increase',
  };
  const service = createCharacterImprovementService(log);

  const result = await service.apply({
    id: characterId,
    improvementId,
    draft,
    session,
    rawLocale: 'pl',
  });

  assert.equal(result.ok, true);
  assert.equal(applyCalls.length, 1);
  assert.equal(applyCalls[0].characterData.strength, 7);
  assert.equal(getFullCalls[0].locale, 'pl');
});

test('preview creation requires ownership', async () => {
  resetState();
  const service = createCharacterImprovementService(log);

  const result = await service.getOrCreatePreview({
    id: characterId,
    session: { user: { id: 'other-user' }, session: { id: 'other-session' } },
  });

  assert.equal(result.ok, false);
  assert.equal(result.ok ? '' : result.error.code, 'FORBIDDEN_CHARACTER');
  assert.equal(createCalls, 0);
});

test('Getting Better uses the latest Custom Class settings and stable ability keys', async () => {
  resetState();
  assert.ok(characterRow);
  characterRow = {
    ...characterRow,
    classId: 1,
    abilities: [{ key: 'cc.lineage.ability.held' }],
  };
  classRule = 'specialist';
  classNoteKey = 'cc.latest.getting_better_note';
  classAbilities = [
    { key: 'cc.lineage.ability.held', id: 11, position: 1, isRandom: true },
    { key: 'cc.latest.ability.new', id: 12, position: 2, isRandom: true },
  ];
  enqueuePreviewRolls();
  rollQueue.push({ total: 2 });
  const service = createCharacterImprovementService(log);

  const preview = await service.getOrCreatePreview({ id: characterId, session, rawLocale: 'en' });

  assert.equal(latestClassLookup, 1);
  assert.equal(preview.ok && preview.value.rulesNote, 'en:cc.latest.getting_better_note');
  assert.deepEqual(preview.ok && (preview.value.rolledDraft as ImprovementDraft).classAbility, {
    kind: 'firstSpecialty',
    existing: [{ key: 'cc.lineage.ability.held', rollValue: 1 }],
    added: {
      key: 'cc.latest.ability.new',
      rollValue: 2,
      roll: { source: 'server', total: 2 },
    },
  });
});

test('getOrCreatePreview builds Scum first and later specialty drafts', async () => {
  resetState();
  assert.ok(characterRow);
  characterRow = {
    ...characterRow,
    classId: 2,
    abilities: [
      { key: 'scum.fixed', comment: 'fixed note' },
      { key: 'scum.one', comment: 'first note' },
    ],
  };
  classRule = 'specialist';
  classAbilities = [
    { key: 'scum.fixed', id: 1, position: 1, isRandom: false },
    { key: 'scum.one', id: 2, position: 2, isRandom: true },
    { key: 'scum.two', id: 3, position: 3, isRandom: true },
  ];
  enqueuePreviewRolls();
  rollQueue.push({ total: 2 });
  const service = createCharacterImprovementService(log);

  const first = await service.getOrCreatePreview({ id: characterId, session, rawLocale: 'pl' });

  assert.equal(first.ok, true);
  const firstDraft = activeImprovement?.rolledDraft as ImprovementDraft;
  assert.equal(firstDraft.classAbility.kind, 'firstSpecialty');
  if (firstDraft.classAbility.kind === 'firstSpecialty') {
    assert.deepEqual(firstDraft.classAbility.existing.map((slot) => slot.key), ['scum.one']);
    assert.equal(firstDraft.classAbility.added?.key, 'scum.two');
  }
  assert.deepEqual(first.ok && first.value.abilityNames, {
    'scum.one': 'pl:scum.one',
    'scum.two': 'pl:scum.two',
  });
  assert.deepEqual(translationCalls, [
    { locale: 'pl', keys: ['scum.one', 'scum.two'] },
  ]);

  const reopened = await service.getOrCreatePreview({ id: characterId, session, rawLocale: 'en' });
  assert.deepEqual(reopened.ok && reopened.value.abilityNames, {
    'scum.one': 'en:scum.one',
    'scum.two': 'en:scum.two',
  });

  const applied = await service.apply({
    id: characterId,
    improvementId,
    draft: firstDraft,
    session,
    rawLocale: 'en',
  });

  assert.equal(applied.ok, true);
  assert.deepEqual(applyCalls[0].characterData.abilities, [
    { key: 'scum.fixed', comment: 'fixed note' },
    { key: 'scum.one', comment: 'first note' },
    { key: 'scum.two' },
  ]);

  activeImprovement = null;
  applyCalls = [];
  appliedCount = 1;
  characterRow = {
    ...characterRow,
    abilities: [
      { key: 'scum.fixed' },
      { key: 'scum.one' },
      { key: 'scum.two' },
    ],
  };
  enqueuePreviewRolls();

  const later = await service.getOrCreatePreview({ id: characterId, session });

  assert.equal(later.ok, true);
  const laterDraft = activeImprovement?.rolledDraft as ImprovementDraft;
  assert.deepEqual(laterDraft.classAbility, {
    kind: 'specialties',
    specialties: [
      { current: { key: 'scum.one', rollValue: 1 }, replacement: null, reroll: false },
      { current: { key: 'scum.two', rollValue: 2 }, replacement: null, reroll: false },
    ],
  });
});

test('apply grants the item and pet of an ability gained through Getting Better', async () => {
  resetState();
  assert.ok(characterRow);
  characterRow = {
    ...characterRow,
    classId: 2,
    abilities: [{ key: 'scum.one' }],
    equipment: [{ key: 'equipment.rope' }],
  };
  classRule = 'specialist';
  classAbilities = [
    { key: 'scum.one', id: 4, position: 1, isRandom: true, grantItemKey: 'equipment.mask' },
    {
      key: 'scum.two',
      id: 99,
      position: 2,
      isRandom: true,
      grantItemKey: 'equipment.lockpicks',
      grantPetKey: 'pets.rat',
    },
  ];
  enqueuePreviewRolls();
  rollQueue.push({ total: 2 });
  const service = createCharacterImprovementService(log);

  await service.getOrCreatePreview({ id: characterId, session });
  const draft = activeImprovement?.rolledDraft as ImprovementDraft;
  const applied = await service.apply({
    id: characterId,
    improvementId,
    draft,
    session,
    rawLocale: 'en',
  });

  assert.equal(applied.ok, true);
  assert.deepEqual(applyCalls[0].characterData.equipment, [
    { key: 'equipment.rope' },
    { key: 'equipment.lockpicks', tags: [] },
    { key: 'pets.rat', tags: [], uses: [true, true] },
  ]);
});

test('the class rules note leads the preview in the reader language', async () => {
  resetState();
  classNoteKey = 'classes.test.getting_better_note';
  enqueuePreviewRolls();
  const service = createCharacterImprovementService(log);

  const preview = await service.getOrCreatePreview({ id: characterId, session, rawLocale: 'pl' });

  assert.equal(preview.ok && preview.value.rulesNote, 'pl:classes.test.getting_better_note');
  assert.equal(preview.ok && (preview.value.rolledDraft as ImprovementDraft).classAbility.kind, 'none');
});

test('an active preview saved in the old two-slot shape upgrades to per-specialty toggles on load', async () => {
  resetState();
  assert.ok(characterRow);
  characterRow = { ...characterRow, classId: 2, abilities: [{ key: 'scum.one' }, { key: 'scum.two' }] };
  classRule = 'specialist';
  classAbilities = [
    { key: 'scum.one', id: 5, position: 1, isRandom: true },
    { key: 'scum.two', id: 6, position: 2, isRandom: true },
    { key: 'scum.three', id: 7, position: 3, isRandom: true },
  ];
  appliedCount = 1;
  enqueuePreviewRolls();
  rollQueue.push({ total: 3 }, { total: 3 });
  const service = createCharacterImprovementService(log);
  await service.getOrCreatePreview({ id: characterId, session });
  assert.ok(activeImprovement);
  const { classAbility: _current, ...rest } = activeImprovement.rolledDraft as ImprovementDraft;
  activeImprovement = {
    ...activeImprovement,
    rolledDraft: {
      ...rest,
      scumSpecialties: {
        kind: 'laterImprovement',
        primary: { key: 'scum.one', rollValue: 1 },
        secondary: { key: 'scum.two', rollValue: 2 },
        rerollMode: 'secondary',
      },
    } as unknown as Prisma.InputJsonValue,
  };
  rollQueue.push({ total: 3 }, { total: 3 });

  const reopened = await service.getOrCreatePreview({ id: characterId, session });

  assert.equal(reopened.ok, true);
  const upgraded = (activeImprovement?.rolledDraft as ImprovementDraft).classAbility;
  assert.deepEqual(upgraded, {
    kind: 'specialties',
    specialties: [
      {
        current: { key: 'scum.one', rollValue: 1 },
        replacement: { key: 'scum.three', rollValue: 3, roll: { source: 'server', total: 3 } },
        reroll: false,
      },
      {
        current: { key: 'scum.two', rollValue: 2 },
        replacement: { key: 'scum.three', rollValue: 3, roll: { source: 'server', total: 3 } },
        reroll: true,
      },
    ],
  });
  assert.equal('scumSpecialties' in (activeImprovement?.rolledDraft as object), false);
});

test('random abilities are numbered by their place in the pool, fixed ones never', async () => {
  resetState();
  assert.ok(characterRow);
  characterRow = { ...characterRow, classId: 2, abilities: [{ key: 'pool.c' }] };
  classRule = 'specialist';
  classAbilities = [
    { key: 'pool.c', id: 8, position: 7, isRandom: true },
    { key: 'fixed.a', id: 9, position: 1, isRandom: false },
    { key: 'pool.b', id: 10, position: 4, isRandom: true },
  ];
  enqueuePreviewRolls();
  rollQueue.push({ total: 1 });
  const service = createCharacterImprovementService(log);

  await service.getOrCreatePreview({ id: characterId, session });

  assert.deepEqual((activeImprovement?.rolledDraft as ImprovementDraft).classAbility, {
    kind: 'firstSpecialty',
    existing: [{ key: 'pool.c', rollValue: 2 }],
    added: { key: 'pool.b', rollValue: 1, roll: { source: 'server', total: 1 } },
  });
  assert.equal(rollCalls.at(-1), '1d2');
});
