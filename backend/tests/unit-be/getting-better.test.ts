import assert from 'node:assert/strict';
import test from 'node:test';

import {
  ABILITY_STATS,
  type AppliedImprovementCharacter,
  buildAppliedImprovement,
  buildImprovementSnapshot,
  type GettingBetterCatalog,
  type GettingBetterRoller,
  GettingBetterRuleError,
  type ImprovementAbilityRoll,
  type ImprovementCharacterSnapshot,
  type ImprovementCharacterSnapshotInput,
  type ImprovementDraft,
  type ImprovementHpRoll,
  modifierToCanonicalScore,
  normalizeSubmittedImprovementDraft,
  rollAbilityImprovement,
  rollDebris,
  rollHpImprovement,
  rollScumSpecialties,
  type RollResult,
  type RollValue,
  scoreToModifierExtended,
} from '../../src/lib/getting-better.ts';

type RollExpectation = {
  notation: string;
  total: number;
  dice?: number[];
};

class ScriptedRoller implements GettingBetterRoller {
  public readonly calls: string[] = [];

  constructor(private readonly rolls: RollExpectation[]) {}

  async roll(notation: string): Promise<RollResult> {
    this.calls.push(notation);
    const next = this.rolls.shift();
    assert.ok(next, `unexpected roll ${notation}`);
    assert.equal(notation, next.notation);
    return {
      total: next.total,
      ...(next.dice ? { dice: next.dice } : {}),
    };
  }

  assertComplete(): void {
    assert.deepEqual(this.rolls, []);
  }
}

const scumSpecialties = [
  { key: 'abilities.gutterborn_scum.jab', rollValue: 1 },
  { key: 'abilities.gutterborn_scum.fingersmith', rollValue: 2 },
  { key: 'abilities.gutterborn_scum.gob_lobber', rollValue: 3 },
  { key: 'abilities.gutterborn_scum.fate', rollValue: 4 },
  { key: 'abilities.gutterborn_scum.stealth', rollValue: 5 },
  { key: 'abilities.gutterborn_scum.dodging', rollValue: 6 },
] as const;

const catalog: GettingBetterCatalog = {
  scrollKeys: (family) =>
    family === 'unclean'
      ? ['scroll.unclean.first', 'scroll.unclean.second']
      : ['scroll.sacred.first', 'scroll.sacred.second', 'scroll.sacred.third'],
  scumSpecialties: () => scumSpecialties,
  scumFixedAbilityKeys: () => ['abilities.gutterborn_scum.stealthy'],
};

function rv(total: number, source: RollValue['source'] = 'table', dice?: number[]): RollValue {
  return {
    source,
    ...(dice ? { dice } : {}),
    total,
  };
}

function baseSnapshot(overrides: Partial<ImprovementCharacterSnapshotInput> = {}): ImprovementCharacterSnapshot {
  return buildImprovementSnapshot({
    characterUpdatedAt: '2026-07-07T12:00:00.000Z',
    maxHp: 10,
    silver: 20,
    abilities: {
      strength: 4,
      agility: 17,
      presence: 20,
      toughness: 21,
    },
    abilityKeys: [],
    equipmentFingerprint: 'equipment:v1',
    ...overrides,
  });
}

function submittedAbility(total: number): ImprovementAbilityRoll {
  return {
    roll: rv(total),
    fromScore: 999,
    fromModifier: 999,
    toModifier: 999,
    toScore: 999,
    outcome: 'same',
  };
}

function submittedAbilities(): Record<(typeof ABILITY_STATS)[number], ImprovementAbilityRoll> {
  return {
    strength: submittedAbility(6),
    agility: submittedAbility(2),
    presence: submittedAbility(6),
    toughness: submittedAbility(6),
  };
}

function baseDraft(snapshot = baseSnapshot()): ImprovementDraft {
  return {
    sequence: 1,
    snapshot,
    hp: {
      check: rv(10),
      fromMaxHp: 999,
      succeeds: false,
      increase: rv(4),
      toMaxHp: 999,
    },
    debris: {
      roll: rv(2),
      kind: 'nothing',
    },
    abilities: submittedAbilities(),
    scumSpecialties: { kind: 'notScum' },
  };
}

test('scoreToModifierExtended and modifierToCanonicalScore cover the extended table', () => {
  assert.deepEqual(
    [
      scoreToModifierExtended(1),
      scoreToModifierExtended(4),
      scoreToModifierExtended(5),
      scoreToModifierExtended(6),
      scoreToModifierExtended(7),
      scoreToModifierExtended(8),
      scoreToModifierExtended(9),
      scoreToModifierExtended(12),
      scoreToModifierExtended(13),
      scoreToModifierExtended(16),
      scoreToModifierExtended(17),
      scoreToModifierExtended(18),
      scoreToModifierExtended(19),
      scoreToModifierExtended(20),
      scoreToModifierExtended(21),
      scoreToModifierExtended(30),
    ],
    [-3, -3, -2, -2, -1, -1, 0, 0, 1, 2, 3, 3, 4, 5, 6, 6],
  );

  assert.deepEqual(
    [-3, -2, -1, 0, 1, 2, 3, 4, 5, 6].map((modifier) => modifierToCanonicalScore(modifier)),
    [4, 5, 7, 9, 13, 15, 17, 19, 20, 21],
  );
  assert.throws(() => modifierToCanonicalScore(7), GettingBetterRuleError);
});

test('rollHpImprovement raises max HP on success without rolling current HP', async () => {
  const roller = new ScriptedRoller([
    { notation: '6d10', total: 12 },
    { notation: '1d6', total: 5 },
  ]);

  const hp = await rollHpImprovement({ maxHp: 10 }, roller);

  assert.deepEqual(hp, {
    check: { source: 'server', total: 12 },
    fromMaxHp: 10,
    succeeds: true,
    increase: { source: 'server', total: 5 },
    toMaxHp: 15,
  });
  assert.deepEqual(roller.calls, ['6d10', '1d6']);
  roller.assertComplete();
});

test('rollHpImprovement leaves max HP unchanged on failure and does not roll increase', async () => {
  const roller = new ScriptedRoller([{ notation: '6d10', total: 9 }]);

  const hp = await rollHpImprovement({ maxHp: 10 }, roller);

  assert.deepEqual(hp, {
    check: { source: 'server', total: 9 },
    fromMaxHp: 10,
    succeeds: false,
    increase: null,
    toMaxHp: 10,
  });
  assert.deepEqual(roller.calls, ['6d10']);
  roller.assertComplete();
});

test('rollDebris handles nothing, silver, and concrete scroll results', async () => {
  const nothingRoller = new ScriptedRoller([{ notation: '1d6', total: 3 }]);
  assert.deepEqual(await rollDebris(nothingRoller, catalog), {
    roll: { source: 'server', total: 3 },
    kind: 'nothing',
  });

  const silverRoller = new ScriptedRoller([
    { notation: '1d6', total: 4 },
    { notation: '3d10', total: 17 },
  ]);
  assert.deepEqual(await rollDebris(silverRoller, catalog), {
    roll: { source: 'server', total: 4 },
    kind: 'silver',
    silver: { source: 'server', total: 17 },
    amount: 17,
  });

  const uncleanRoller = new ScriptedRoller([
    { notation: '1d6', total: 5 },
    { notation: '1d2', total: 2 },
  ]);
  assert.deepEqual(await rollDebris(uncleanRoller, catalog), {
    roll: { source: 'server', total: 5 },
    kind: 'uncleanScroll',
    scroll: { source: 'server', total: 2 },
    itemKey: 'scroll.unclean.second',
  });

  const sacredRoller = new ScriptedRoller([
    { notation: '1d6', total: 6 },
    { notation: '1d3', total: 3 },
  ]);
  assert.deepEqual(await rollDebris(sacredRoller, catalog), {
    roll: { source: 'server', total: 6 },
    kind: 'sacredScroll',
    scroll: { source: 'server', total: 3 },
    itemKey: 'scroll.sacred.third',
  });
});

test('rollAbilityImprovement handles low scores, high scores, and the +6 cap', async () => {
  const lowFloor = await rollAbilityImprovement(
    'strength',
    4,
    new ScriptedRoller([{ notation: '1d6', total: 1 }]),
  );
  assert.deepEqual(
    pickAbilityResult(lowFloor),
    { fromModifier: -3, toModifier: -3, toScore: 4, outcome: 'same' },
  );

  const lowIncrease = await rollAbilityImprovement(
    'strength',
    5,
    new ScriptedRoller([{ notation: '1d6', total: 2 }]),
  );
  assert.deepEqual(
    pickAbilityResult(lowIncrease),
    { fromModifier: -2, toModifier: -1, toScore: 7, outcome: 'increase' },
  );

  const highDecrease = await rollAbilityImprovement(
    'agility',
    17,
    new ScriptedRoller([{ notation: '1d6', total: 2 }]),
  );
  assert.deepEqual(
    pickAbilityResult(highDecrease),
    { fromModifier: 3, toModifier: 2, toScore: 15, outcome: 'decrease' },
  );

  const highIncrease = await rollAbilityImprovement(
    'agility',
    17,
    new ScriptedRoller([{ notation: '1d6', total: 3 }]),
  );
  assert.deepEqual(
    pickAbilityResult(highIncrease),
    { fromModifier: 3, toModifier: 4, toScore: 19, outcome: 'increase' },
  );

  const capped = await rollAbilityImprovement(
    'presence',
    21,
    new ScriptedRoller([{ notation: '1d6', total: 6 }]),
  );
  assert.deepEqual(
    pickAbilityResult(capped),
    { fromModifier: 6, toModifier: 6, toScore: 21, outcome: 'same' },
  );
});

test('normalizeSubmittedImprovementDraft recomputes derived fields from submitted totals and trusted snapshot', () => {
  const snapshot = baseSnapshot();
  const draft = baseDraft(snapshot);

  const normalized = normalizeSubmittedImprovementDraft(draft, snapshot, catalog);

  assert.equal(normalized.hp.fromMaxHp, 10);
  assert.equal(normalized.hp.succeeds, true);
  assert.equal(normalized.hp.toMaxHp, 14);
  assert.deepEqual(
    pickAbilityResult(normalized.abilities.strength),
    { fromModifier: -3, toModifier: -2, toScore: 5, outcome: 'increase' },
  );
  assert.deepEqual(
    pickAbilityResult(normalized.abilities.agility),
    { fromModifier: 3, toModifier: 2, toScore: 15, outcome: 'decrease' },
  );
  assert.deepEqual(
    pickAbilityResult(normalized.abilities.presence),
    { fromModifier: 5, toModifier: 6, toScore: 21, outcome: 'increase' },
  );
  assert.deepEqual(
    pickAbilityResult(normalized.abilities.toughness),
    { fromModifier: 6, toModifier: 6, toScore: 21, outcome: 'same' },
  );
});

test('normalizeSubmittedImprovementDraft rejects stale snapshot hashes and impossible HP payloads', () => {
  const snapshot = baseSnapshot();
  const wrongSnapshot = { ...snapshot, snapshotHash: 'wrong' };

  assert.throws(
    () => normalizeSubmittedImprovementDraft(baseDraft(wrongSnapshot), snapshot, catalog),
    /submitted improvement draft/,
  );

  const failedHpWithIncrease = baseDraft(snapshot);
  failedHpWithIncrease.hp = {
    check: rv(9),
    fromMaxHp: 10,
    succeeds: true,
    increase: rv(1),
    toMaxHp: 11,
  };

  assert.throws(
    () => normalizeSubmittedImprovementDraft(failedHpWithIncrease, snapshot, catalog),
    /failed HP improvement/,
  );
});

test('normalizeSubmittedImprovementDraft derives debris scroll item keys and rejects invalid scroll rolls', () => {
  const snapshot = baseSnapshot();
  const draft = baseDraft(snapshot);
  draft.debris = {
    roll: rv(5),
    kind: 'uncleanScroll',
    scroll: rv(1),
    itemKey: 'client.supplied.wrong-key',
  };

  const normalized = normalizeSubmittedImprovementDraft(draft, snapshot, catalog);

  assert.deepEqual(normalized.debris, {
    roll: rv(5),
    kind: 'uncleanScroll',
    scroll: rv(1),
    itemKey: 'scroll.unclean.first',
  });

  const invalid = baseDraft(snapshot);
  invalid.debris = {
    roll: rv(6),
    kind: 'sacredScroll',
    scroll: rv(4),
    itemKey: 'scroll.sacred.fourth',
  };

  assert.throws(
    () => normalizeSubmittedImprovementDraft(invalid, snapshot, catalog),
    /1d3 total 4 is outside 1-3/,
  );
});

test('rollScumSpecialties returns non-Scum, first improvement, and later improvement drafts', async () => {
  assert.deepEqual(
    await rollScumSpecialties({ isGutterbornScum: false, abilityKeys: [] }, 0, new ScriptedRoller([]), catalog),
    { kind: 'notScum' },
  );

  const firstRoller = new ScriptedRoller([
    { notation: '1d6', total: 1 },
    { notation: '1d6', total: 2 },
  ]);
  const first = await rollScumSpecialties(
    {
      isGutterbornScum: true,
      abilityKeys: ['abilities.gutterborn_scum.stealthy', 'abilities.gutterborn_scum.jab'],
    },
    0,
    firstRoller,
    catalog,
  );
  assert.deepEqual(first, {
    kind: 'firstImprovement',
    existing: { key: 'abilities.gutterborn_scum.jab', rollValue: 1 },
    added: {
      key: 'abilities.gutterborn_scum.fingersmith',
      rollValue: 2,
      roll: { source: 'server', total: 2 },
    },
  });
  assert.deepEqual(firstRoller.calls, ['1d6', '1d6']);

  const later = await rollScumSpecialties(
    {
      isGutterbornScum: true,
      abilityKeys: [
        'abilities.gutterborn_scum.stealthy',
        'abilities.gutterborn_scum.jab',
        'abilities.gutterborn_scum.fate',
      ],
    },
    1,
    new ScriptedRoller([]),
    catalog,
  );
  assert.deepEqual(later, {
    kind: 'laterImprovement',
    primary: { key: 'abilities.gutterborn_scum.jab', rollValue: 1 },
    secondary: { key: 'abilities.gutterborn_scum.fate', rollValue: 4 },
    rerollMode: 'none',
  });
});

test('normalizeSubmittedImprovementDraft enforces distinct Scum specialties', () => {
  const snapshot = baseSnapshot({
    abilityKeys: ['abilities.gutterborn_scum.stealthy', 'abilities.gutterborn_scum.jab'],
  });
  const draft = baseDraft(snapshot);
  draft.scumSpecialties = {
    kind: 'firstImprovement',
    existing: { key: 'abilities.gutterborn_scum.jab', rollValue: 1 },
    added: {
      key: 'abilities.gutterborn_scum.jab',
      rollValue: 1,
      roll: rv(1),
    },
  };

  assert.throws(
    () => normalizeSubmittedImprovementDraft(draft, snapshot, catalog),
    /Scum specialties must be distinct/,
  );

  draft.scumSpecialties = {
    kind: 'firstImprovement',
    existing: { key: 'abilities.gutterborn_scum.jab', rollValue: 1 },
    added: {
      key: 'client.wrong-key',
      rollValue: 999,
      roll: rv(2),
    },
  };

  const normalized = normalizeSubmittedImprovementDraft(draft, snapshot, catalog);
  assert.deepEqual(normalized.scumSpecialties, {
    kind: 'firstImprovement',
    existing: { key: 'abilities.gutterborn_scum.jab', rollValue: 1 },
    added: {
      key: 'abilities.gutterborn_scum.fingersmith',
      rollValue: 2,
      roll: rv(2),
    },
  });
});

test('normalizeSubmittedImprovementDraft enforces later Scum reroll modes', () => {
  const snapshot = baseSnapshot({
    abilityKeys: [
      'abilities.gutterborn_scum.stealthy',
      'abilities.gutterborn_scum.jab',
      'abilities.gutterborn_scum.fate',
    ],
  });
  const draft = baseDraft(snapshot);
  draft.scumSpecialties = {
    kind: 'laterImprovement',
    primary: { key: 'abilities.gutterborn_scum.fingersmith', rollValue: 2 },
    secondary: { key: 'abilities.gutterborn_scum.fate', rollValue: 4 },
    rerollMode: 'primary',
  };

  assert.deepEqual(
    normalizeSubmittedImprovementDraft(draft, snapshot, catalog).scumSpecialties,
    draft.scumSpecialties,
  );

  const invalid = baseDraft(snapshot);
  invalid.scumSpecialties = {
    kind: 'laterImprovement',
    primary: { key: 'abilities.gutterborn_scum.fingersmith', rollValue: 2 },
    secondary: { key: 'abilities.gutterborn_scum.fate', rollValue: 4 },
    rerollMode: 'none',
  };

  assert.throws(
    () => normalizeSubmittedImprovementDraft(invalid, snapshot, catalog),
    /cannot change when reroll mode is none/,
  );
});

test('buildAppliedImprovement reports normalized character changes', () => {
  const snapshot = baseSnapshot({
    abilityKeys: ['abilities.gutterborn_scum.stealthy', 'abilities.gutterborn_scum.jab'],
  });
  const draft = normalizeSubmittedImprovementDraft(
    {
      ...baseDraft(snapshot),
      debris: {
        roll: rv(4),
        kind: 'silver',
        silver: rv(12),
        amount: 999,
      },
      scumSpecialties: {
        kind: 'firstImprovement',
        existing: { key: 'abilities.gutterborn_scum.jab', rollValue: 1 },
        added: {
          key: 'abilities.gutterborn_scum.fingersmith',
          rollValue: 2,
          roll: rv(2),
        },
      },
    },
    snapshot,
    catalog,
  );
  const character: AppliedImprovementCharacter = {
    maxHp: 10,
    silver: 20,
    abilities: snapshot.abilities,
    abilityKeys: snapshot.abilityKeys,
  };

  const applied = buildAppliedImprovement(draft, character, {
    draftId: 'draft-1',
    appliedAt: '2026-07-07T12:30:00.000Z',
  });

  assert.deepEqual(applied.changes.maxHp, { from: 10, to: 14 });
  assert.deepEqual(applied.changes.silver, { from: 20, to: 32 });
  assert.deepEqual(applied.changes.abilities.strength, { fromScore: 4, toScore: 5 });
  assert.deepEqual(applied.changes.abilityKeys, {
    from: ['abilities.gutterborn_scum.stealthy', 'abilities.gutterborn_scum.jab'],
    to: [
      'abilities.gutterborn_scum.stealthy',
      'abilities.gutterborn_scum.jab',
      'abilities.gutterborn_scum.fingersmith',
    ],
  });
});

function pickAbilityResult(roll: ImprovementAbilityRoll) {
  const { fromModifier, toModifier, toScore, outcome } = roll;
  return { fromModifier, toModifier, toScore, outcome };
}
