import assert from 'node:assert/strict';
import test from 'node:test';

import {
  applyClassAbilityDraft,
  buildImprovementSnapshot,
  type ClassAbilityDraft,
  type GettingBetterCatalog,
  type GettingBetterRoller,
  type GettingBetterRule,
  normalizeSubmittedClassAbility,
  rollClassAbility,
  type RollResult,
  type RollValue,
  type SpecialtySlot,
  upgradeLegacyImprovementDraft,
} from '../../src/lib/getting-better.ts';

class ScriptedRoller implements GettingBetterRoller {
  public readonly calls: string[] = [];

  constructor(private readonly totals: Array<[string, number]>) {}

  async roll(notation: string): Promise<RollResult> {
    this.calls.push(notation);
    const next = this.totals.shift();
    assert.ok(next, `unexpected roll ${notation}`);
    assert.equal(notation, next[0]);
    return { total: next[1] };
  }

  assertComplete(): void {
    assert.deepEqual(this.totals, []);
  }
}

const pool: SpecialtySlot[] = [
  { key: 'a.jab', rollValue: 1 },
  { key: 'a.fingersmith', rollValue: 2 },
  { key: 'a.gob', rollValue: 3 },
  { key: 'a.fate', rollValue: 4 },
  { key: 'a.stealth', rollValue: 5 },
  { key: 'a.dodging', rollValue: 6 },
];
const slot = (key: string): SpecialtySlot => pool.find((entry) => entry.key === key)!;

function catalogFor(rule: GettingBetterRule, classPool: SpecialtySlot[] = pool): GettingBetterCatalog {
  return {
    scrollKeys: () => ['scroll.one'],
    classRule: () => rule,
    classPool: () => classPool,
  };
}

const server = (total: number): RollValue => ({ source: 'server', total });
const table = (total: number): RollValue => ({ source: 'table', total });

function snapshotWith(abilityKeys: string[]) {
  return buildImprovementSnapshot({
    characterUpdatedAt: '2026-07-07T12:00:00.000Z',
    maxHp: 10,
    silver: 20,
    abilities: { strength: 10, agility: 10, presence: 10, toughness: 10 },
    abilityKeys,
    equipmentFingerprint: 'equipment:v1',
  });
}

test('book rule draws no class ability', async () => {
  const roller = new ScriptedRoller([]);
  assert.deepEqual(
    await rollClassAbility(['a.jab'], 3, roller, catalogFor('book')),
    { kind: 'none' },
  );
});

test('book_plus_ability draws a pool ability the scvm does not hold, rerolling held ones', async () => {
  const roller = new ScriptedRoller([['1d6', 1], ['1d6', 4]]);

  const draft = await rollClassAbility(['fixed', 'a.jab'], 2, roller, catalogFor('book_plus_ability'));

  assert.deepEqual(draft, { kind: 'newAbility', added: { ...slot('a.fate'), roll: server(4) } });
  roller.assertComplete();
});

test('book_plus_ability has nothing to add once the pool is exhausted', async () => {
  const held = pool.map((entry) => entry.key);
  assert.deepEqual(
    await rollClassAbility(held, 0, new ScriptedRoller([]), catalogFor('book_plus_ability')),
    { kind: 'newAbility', added: null },
  );
});

test('specialist first improvement adds one more distinct specialty', async () => {
  const roller = new ScriptedRoller([['1d6', 1], ['1d6', 2]]);

  const draft = await rollClassAbility(['fixed', 'a.jab'], 0, roller, catalogFor('specialist'));

  assert.deepEqual(draft, {
    kind: 'firstSpecialty',
    existing: [slot('a.jab')],
    added: { ...slot('a.fingersmith'), roll: server(2) },
  });
});

test('specialist later improvements offer every specialty with its own replacement, kept by default', async () => {
  const roller = new ScriptedRoller([['1d6', 3], ['1d6', 3], ['1d6', 5], ['1d6', 6], ['1d6', 2]]);

  const draft = await rollClassAbility(
    ['fixed', 'a.jab', 'a.fate', 'a.stealth'],
    2,
    roller,
    catalogFor('specialist'),
  );

  assert.deepEqual(draft, {
    kind: 'specialties',
    specialties: [
      { current: slot('a.jab'), replacement: { ...slot('a.gob'), roll: server(3) }, reroll: false },
      { current: slot('a.fate'), replacement: { ...slot('a.dodging'), roll: server(6) }, reroll: false },
      { current: slot('a.stealth'), replacement: { ...slot('a.fingersmith'), roll: server(2) }, reroll: false },
    ],
  });
  roller.assertComplete();
});

test('when the pool runs short, specialties share the last free ability instead of losing it', async () => {
  const smallPool = pool.slice(0, 3);
  const roller = new ScriptedRoller([['1d3', 3], ['1d3', 3]]);

  const draft = await rollClassAbility(['a.jab', 'a.fingersmith'], 1, roller, catalogFor('specialist', smallPool));

  assert.deepEqual(draft, {
    kind: 'specialties',
    specialties: [
      { current: slot('a.jab'), replacement: { ...slot('a.gob'), roll: server(3) }, reroll: false },
      { current: slot('a.fingersmith'), replacement: { ...slot('a.gob'), roll: server(3) }, reroll: false },
    ],
  });
});

test('a specialty gets no replacement when nothing in the pool is free', async () => {
  const smallPool = pool.slice(0, 2);

  const draft = await rollClassAbility(['a.jab', 'a.fingersmith'], 1, new ScriptedRoller([]), catalogFor('specialist', smallPool));

  assert.deepEqual(draft, {
    kind: 'specialties',
    specialties: [
      { current: slot('a.jab'), replacement: null, reroll: false },
      { current: slot('a.fingersmith'), replacement: null, reroll: false },
    ],
  });
});

test('specialist with one ability reproduces the four Scum outcomes', async () => {
  const held = ['fixed', 'a.jab', 'a.fate'];
  const draft = (await rollClassAbility(
    held,
    1,
    new ScriptedRoller([['1d6', 2], ['1d6', 3]]),
    catalogFor('specialist'),
  )) as Extract<ClassAbilityDraft, { kind: 'specialties' }>;

  const outcome = (rerollFirst: boolean, rerollSecond: boolean) =>
    applyClassAbilityDraft(held, {
      kind: 'specialties',
      specialties: [
        { ...draft.specialties[0], reroll: rerollFirst },
        { ...draft.specialties[1], reroll: rerollSecond },
      ],
    });

  assert.deepEqual(outcome(false, false), ['fixed', 'a.jab', 'a.fate']);
  assert.deepEqual(outcome(true, false), ['fixed', 'a.fingersmith', 'a.fate']);
  assert.deepEqual(outcome(false, true), ['fixed', 'a.jab', 'a.gob']);
  assert.deepEqual(outcome(true, true), ['fixed', 'a.fingersmith', 'a.gob']);
});

test('normalizing a submission re-derives abilities from their rolls', () => {
  const snapshot = snapshotWith(['fixed', 'a.jab']);
  const submitted: ClassAbilityDraft = {
    kind: 'firstSpecialty',
    existing: [{ key: 'client.lies', rollValue: 9 }],
    added: { key: 'client.lies', rollValue: 9, roll: table(2) },
  };

  assert.deepEqual(normalizeSubmittedClassAbility(submitted, snapshot, 0, catalogFor('specialist')), {
    kind: 'firstSpecialty',
    existing: [slot('a.jab')],
    added: { ...slot('a.fingersmith'), roll: table(2) },
  });
});

test('normalizing rejects a held ability, the wrong kind, and a reroll without a replacement', () => {
  const snapshot = snapshotWith(['fixed', 'a.jab', 'a.fate']);
  const specialist = catalogFor('specialist');

  assert.throws(
    () =>
      normalizeSubmittedClassAbility(
        { kind: 'newAbility', added: { ...slot('a.gob'), roll: table(3) } },
        snapshot,
        1,
        specialist,
      ),
    /expected a specialties draft/,
  );
  assert.throws(
    () =>
      normalizeSubmittedClassAbility(
        {
          kind: 'specialties',
          specialties: [
            { current: slot('a.jab'), replacement: { ...slot('a.fate'), roll: table(4) }, reroll: true },
            { current: slot('a.fate'), replacement: null, reroll: false },
          ],
        },
        snapshot,
        1,
        specialist,
      ),
    /already held/,
  );
  assert.throws(
    () =>
      normalizeSubmittedClassAbility(
        {
          kind: 'specialties',
          specialties: [
            { current: slot('a.jab'), replacement: null, reroll: true },
            { current: slot('a.fate'), replacement: null, reroll: false },
          ],
        },
        snapshot,
        1,
        specialist,
      ),
    /no replacement/,
  );
  assert.throws(
    () =>
      normalizeSubmittedClassAbility(
        {
          kind: 'specialties',
          specialties: [
            { current: slot('a.jab'), replacement: { ...slot('a.gob'), roll: table(3) }, reroll: true },
            { current: slot('a.fate'), replacement: { ...slot('a.gob'), roll: table(3) }, reroll: true },
          ],
        },
        snapshot,
        1,
        specialist,
      ),
    /distinct/,
  );
});

test('a rerolled specialty is replaced in place and a gained one is appended', () => {
  assert.deepEqual(
    applyClassAbilityDraft(['fixed', 'a.jab'], {
      kind: 'newAbility',
      added: { ...slot('a.gob'), roll: server(3) },
    }),
    ['fixed', 'a.jab', 'a.gob'],
  );
  assert.deepEqual(applyClassAbilityDraft(['fixed'], { kind: 'newAbility', added: null }), ['fixed']);
});

test('legacy two-slot Scum drafts upgrade to per-specialty toggles', async () => {
  const roller = new ScriptedRoller([['1d6', 2], ['1d6', 3]]);
  const legacy = {
    sequence: 2,
    scumSpecialties: {
      kind: 'laterImprovement',
      primary: slot('a.jab'),
      secondary: slot('a.fate'),
      rerollMode: 'secondary',
    },
  };

  const upgraded = await upgradeLegacyImprovementDraft(legacy, ['fixed', 'a.jab', 'a.fate'], roller, catalogFor('specialist'));

  assert.deepEqual(upgraded, {
    sequence: 2,
    classAbility: {
      kind: 'specialties',
      specialties: [
        { current: slot('a.jab'), replacement: { ...slot('a.fingersmith'), roll: server(2) }, reroll: false },
        { current: slot('a.fate'), replacement: { ...slot('a.gob'), roll: server(3) }, reroll: true },
      ],
    },
  });
});

test('legacy first-improvement and non-Scum drafts upgrade without rolling', async () => {
  const roller = new ScriptedRoller([]);
  const added = { ...slot('a.fingersmith'), roll: server(2) };

  assert.deepEqual(
    await upgradeLegacyImprovementDraft(
      { scumSpecialties: { kind: 'firstImprovement', existing: slot('a.jab'), added } },
      ['a.jab'],
      roller,
      catalogFor('specialist'),
    ),
    { classAbility: { kind: 'firstSpecialty', existing: [slot('a.jab')], added } },
  );
  assert.deepEqual(
    await upgradeLegacyImprovementDraft({ scumSpecialties: { kind: 'notScum' } }, [], roller, catalogFor('book')),
    { classAbility: { kind: 'none' } },
  );
  assert.equal(
    await upgradeLegacyImprovementDraft({ classAbility: { kind: 'none' } }, [], roller, catalogFor('book')),
    null,
    'current drafts are left alone',
  );
});
