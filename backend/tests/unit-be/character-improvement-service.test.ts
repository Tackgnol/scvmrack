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
  rollValue: number | null;
  isRandom: boolean | null;
}> = [];
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
      findClassAbilities: async () => classAbilities,
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
  classAbilities = [
    { key: 'scum.fixed', rollValue: null, isRandom: false },
    { key: 'scum.one', rollValue: 1, isRandom: true },
    { key: 'scum.two', rollValue: 2, isRandom: true },
  ];
  enqueuePreviewRolls();
  rollQueue.push({ total: 2 });
  const service = createCharacterImprovementService(log);

  const first = await service.getOrCreatePreview({ id: characterId, session, rawLocale: 'pl' });

  assert.equal(first.ok, true);
  const firstDraft = activeImprovement?.rolledDraft as ImprovementDraft;
  assert.equal(firstDraft.scumSpecialties.kind, 'firstImprovement');
  if (firstDraft.scumSpecialties.kind === 'firstImprovement') {
    assert.equal(firstDraft.scumSpecialties.existing.key, 'scum.one');
    assert.equal(firstDraft.scumSpecialties.added.key, 'scum.two');
  }
  assert.deepEqual(first.ok && first.value.scumSpecialtyNames, {
    'scum.one': 'pl:scum.one',
    'scum.two': 'pl:scum.two',
  });
  assert.deepEqual(translationCalls, [
    { locale: 'pl', keys: ['scum.one', 'scum.two'] },
  ]);

  const reopened = await service.getOrCreatePreview({ id: characterId, session, rawLocale: 'en' });
  assert.deepEqual(reopened.ok && reopened.value.scumSpecialtyNames, {
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
  assert.equal(laterDraft.scumSpecialties.kind, 'laterImprovement');
  if (laterDraft.scumSpecialties.kind === 'laterImprovement') {
    assert.equal(laterDraft.scumSpecialties.primary.key, 'scum.one');
    assert.equal(laterDraft.scumSpecialties.secondary.key, 'scum.two');
    assert.equal(laterDraft.scumSpecialties.rerollMode, 'none');
  }
});
