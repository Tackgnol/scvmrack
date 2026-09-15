import { createHash } from 'node:crypto';

export const ABILITY_STATS = ['strength', 'agility', 'presence', 'toughness'] as const;

export type AbilityStat = (typeof ABILITY_STATS)[number];

export type RollSource = 'server' | 'table';

export type RollValue = {
  source: RollSource;
  dice?: number[];
  total: number;
};

export type ImprovementCharacterSnapshot = {
  characterUpdatedAt: string;
  maxHp: number;
  silver: number;
  abilities: Record<AbilityStat, number>;
  abilityKeys: string[];
  equipmentFingerprint: string;
  snapshotHash: string;
};

export type ImprovementCharacterSnapshotInput = Omit<ImprovementCharacterSnapshot, 'snapshotHash'>;

export type ImprovementHpRoll = {
  check: RollValue;
  fromMaxHp: number;
  succeeds: boolean;
  increase: RollValue | null;
  toMaxHp: number;
};

export type ImprovementDebrisRoll =
  | { roll: RollValue; kind: 'nothing' }
  | { roll: RollValue; kind: 'silver'; silver: RollValue; amount: number }
  | { roll: RollValue; kind: 'uncleanScroll'; scroll: RollValue; itemKey: string }
  | { roll: RollValue; kind: 'sacredScroll'; scroll: RollValue; itemKey: string };

export type ImprovementAbilityRoll = {
  roll: RollValue;
  fromScore: number;
  fromModifier: number;
  toModifier: number;
  toScore: number;
  outcome: 'increase' | 'decrease' | 'same';
};

export type SpecialtySlot = {
  key: string;
  rollValue: number;
};

export type SpecialtyRoll = SpecialtySlot & {
  roll: RollValue;
};

export type ScumSpecialtyDraft =
  | { kind: 'notScum' }
  | { kind: 'firstImprovement'; existing: SpecialtySlot; added: SpecialtyRoll }
  | {
      kind: 'laterImprovement';
      primary: SpecialtySlot;
      secondary: SpecialtySlot;
      rerollMode: 'none' | 'primary' | 'secondary' | 'both';
    };

export type ImprovementDraft = {
  sequence: number;
  snapshot: ImprovementCharacterSnapshot;
  hp: ImprovementHpRoll;
  debris: ImprovementDebrisRoll;
  abilities: Record<AbilityStat, ImprovementAbilityRoll>;
  scumSpecialties: ScumSpecialtyDraft;
};

export type AppliedImprovement = {
  draftId: string;
  sequence: number;
  appliedAt: string;
  draft: ImprovementDraft;
  changes: {
    maxHp?: { from: number; to: number };
    silver?: { from: number; to: number };
    equipmentAdded?: Array<{ itemKey: string }>;
    abilities: Partial<Record<AbilityStat, { fromScore: number; toScore: number }>>;
    abilityKeys?: { from: string[]; to: string[] };
  };
};

export type RollResult = {
  total: number;
  dice?: number[];
};

export type GettingBetterRoller = {
  roll(notation: string): Promise<RollResult>;
};

export type ScrollFamily = 'unclean' | 'sacred';

export type GettingBetterCatalog = {
  scrollKeys(family: ScrollFamily): readonly string[];
  scumSpecialties?(): readonly SpecialtySlot[];
  scumFixedAbilityKeys?(): readonly string[];
};

export type HpImprovementCharacter = {
  maxHp: number;
};

export type ScumSpecialtyCharacter = {
  isGutterbornScum: boolean;
  abilityKeys: readonly string[];
};

export type AppliedImprovementCharacter = {
  maxHp: number;
  silver: number;
  abilities: Record<AbilityStat, number>;
  abilityKeys: readonly string[];
  scumSpecialtyKeys?: readonly string[];
};

export type BuildAppliedImprovementOptions = {
  draftId: string;
  appliedAt: string;
};

export class GettingBetterRuleError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GettingBetterRuleError';
  }
}

export function scoreToModifierExtended(score: number): number {
  assertFiniteNumber(score, 'score');

  if (score <= 4) return -3;
  if (score <= 6) return -2;
  if (score <= 8) return -1;
  if (score <= 12) return 0;
  if (score <= 14) return 1;
  if (score <= 16) return 2;
  if (score <= 18) return 3;
  if (score === 19) return 4;
  if (score === 20) return 5;
  return 6;
}

export function modifierToCanonicalScore(modifier: number): number {
  assertInteger(modifier, 'modifier');

  switch (modifier) {
    case -3:
      return 4;
    case -2:
      return 5;
    case -1:
      return 7;
    case 0:
      return 9;
    case 1:
      return 13;
    case 2:
      return 15;
    case 3:
      return 17;
    case 4:
      return 19;
    case 5:
      return 20;
    case 6:
      return 21;
    default:
      throw new GettingBetterRuleError(`unsupported modifier ${modifier}`);
  }
}

export function hashImprovementSnapshot(snapshot: ImprovementCharacterSnapshotInput): string {
  return createHash('sha256').update(stableStringify(snapshot)).digest('hex');
}

export function buildImprovementSnapshot(snapshot: ImprovementCharacterSnapshotInput): ImprovementCharacterSnapshot {
  const normalized = normalizeSnapshotInput(snapshot);
  return {
    ...normalized,
    snapshotHash: hashImprovementSnapshot(normalized),
  };
}

export function hasValidImprovementSnapshotHash(snapshot: ImprovementCharacterSnapshot): boolean {
  const { snapshotHash: _snapshotHash, ...input } = snapshot;
  return hashImprovementSnapshot(input) === snapshot.snapshotHash;
}

export async function rollHpImprovement(
  character: HpImprovementCharacter,
  roller: GettingBetterRoller,
): Promise<ImprovementHpRoll> {
  assertInteger(character.maxHp, 'character.maxHp');

  const check = await rollValue(roller, '6d10', 6, 60);
  const succeeds = check.total >= character.maxHp;
  const increase = succeeds ? await rollValue(roller, '1d6', 1, 6) : null;

  return buildHpImprovement(character.maxHp, check, increase);
}

export async function rollDebris(
  roller: GettingBetterRoller,
  catalog: GettingBetterCatalog,
): Promise<ImprovementDebrisRoll> {
  const roll = await rollValue(roller, '1d6', 1, 6);

  if (roll.total <= 3) {
    return { roll, kind: 'nothing' };
  }

  if (roll.total === 4) {
    const silver = await rollValue(roller, '3d10', 3, 30);
    return { roll, kind: 'silver', silver, amount: silver.total };
  }

  const family: ScrollFamily = roll.total === 5 ? 'unclean' : 'sacred';
  const scroll = await rollCatalogEntry(roller, catalog, family);

  return {
    roll,
    kind: family === 'unclean' ? 'uncleanScroll' : 'sacredScroll',
    scroll: scroll.roll,
    itemKey: scroll.key,
  };
}

export async function rollAbilityImprovement(
  _stat: AbilityStat,
  rawScore: number,
  roller: GettingBetterRoller,
): Promise<ImprovementAbilityRoll> {
  const roll = await rollValue(roller, '1d6', 1, 6);
  return buildAbilityImprovement(rawScore, roll);
}

export async function rollAbilityImprovements(
  abilities: Record<AbilityStat, number>,
  roller: GettingBetterRoller,
): Promise<Record<AbilityStat, ImprovementAbilityRoll>> {
  const entries = await Promise.all(
    ABILITY_STATS.map(async (stat) => [stat, await rollAbilityImprovement(stat, abilities[stat], roller)] as const),
  );

  return Object.fromEntries(entries) as Record<AbilityStat, ImprovementAbilityRoll>;
}

export async function rollScumSpecialties(
  character: ScumSpecialtyCharacter,
  appliedCount: number,
  roller: GettingBetterRoller,
  catalog: GettingBetterCatalog,
): Promise<ScumSpecialtyDraft> {
  assertInteger(appliedCount, 'appliedCount');

  if (!character.isGutterbornScum) {
    return { kind: 'notScum' };
  }

  const existing = scumSpecialtiesFromAbilityKeys(character.abilityKeys, catalog);

  if (appliedCount === 0) {
    if (existing.length !== 1) {
      throw new GettingBetterRuleError('Gutterborn Scum first improvement requires exactly one existing specialty');
    }

    return {
      kind: 'firstImprovement',
      existing: existing[0],
      added: await rollDistinctScumSpecialty(roller, catalog, new Set([existing[0].key])),
    };
  }

  if (existing.length !== 2) {
    throw new GettingBetterRuleError('Gutterborn Scum later improvement requires exactly two existing specialties');
  }

  return {
    kind: 'laterImprovement',
    primary: existing[0],
    secondary: existing[1],
    rerollMode: 'none',
  };
}

export function normalizeSubmittedImprovementDraft(
  draft: ImprovementDraft,
  snapshot: ImprovementCharacterSnapshot,
  catalog: GettingBetterCatalog,
): ImprovementDraft {
  if (!hasValidImprovementSnapshotHash(snapshot)) {
    throw new GettingBetterRuleError('trusted improvement snapshot hash is invalid');
  }

  if (draft.snapshot.snapshotHash !== snapshot.snapshotHash) {
    throw new GettingBetterRuleError('submitted improvement draft does not match the trusted snapshot');
  }

  return {
    sequence: draft.sequence,
    snapshot,
    hp: normalizeSubmittedHp(draft.hp, snapshot),
    debris: normalizeSubmittedDebris(draft.debris, catalog),
    abilities: normalizeSubmittedAbilities(draft.abilities, snapshot),
    scumSpecialties: normalizeSubmittedScumSpecialties(draft.scumSpecialties, snapshot, catalog),
  };
}

export function buildAppliedImprovement(
  draft: ImprovementDraft,
  character: AppliedImprovementCharacter,
  options: BuildAppliedImprovementOptions,
): AppliedImprovement {
  const abilityChanges: AppliedImprovement['changes']['abilities'] = {};

  for (const stat of ABILITY_STATS) {
    const fromScore = character.abilities[stat];
    const toScore = draft.abilities[stat].toScore;
    if (fromScore !== toScore) {
      abilityChanges[stat] = { fromScore, toScore };
    }
  }

  const changes: AppliedImprovement['changes'] = {
    abilities: abilityChanges,
  };

  if (draft.hp.toMaxHp !== character.maxHp) {
    changes.maxHp = { from: character.maxHp, to: draft.hp.toMaxHp };
  }

  if (draft.debris.kind === 'silver') {
    changes.silver = {
      from: character.silver,
      to: character.silver + draft.debris.amount,
    };
  }

  if (draft.debris.kind === 'uncleanScroll' || draft.debris.kind === 'sacredScroll') {
    changes.equipmentAdded = [{ itemKey: draft.debris.itemKey }];
  }

  const nextAbilityKeys = applyScumSpecialtyDraftToAbilityKeys(
    character.abilityKeys,
    draft.scumSpecialties,
    character.scumSpecialtyKeys,
  );
  if (!arraysEqual(character.abilityKeys, nextAbilityKeys)) {
    changes.abilityKeys = {
      from: [...character.abilityKeys],
      to: nextAbilityKeys,
    };
  }

  return {
    draftId: options.draftId,
    sequence: draft.sequence,
    appliedAt: options.appliedAt,
    draft,
    changes,
  };
}

function buildHpImprovement(fromMaxHp: number, check: RollValue, increase: RollValue | null): ImprovementHpRoll {
  assertRollValue(check, '6d10', 6, 60);
  const succeeds = check.total >= fromMaxHp;
  let normalizedIncrease: RollValue | null = null;
  let toMaxHp = fromMaxHp;

  if (succeeds) {
    if (increase === null) {
      throw new GettingBetterRuleError('successful HP improvement requires an increase roll');
    }
    assertRollValue(increase, '1d6', 1, 6);
    normalizedIncrease = increase;
    toMaxHp = fromMaxHp + increase.total;
  } else if (increase !== null) {
    throw new GettingBetterRuleError('failed HP improvement must not include an increase roll');
  }

  return {
    check,
    fromMaxHp,
    succeeds,
    increase: normalizedIncrease,
    toMaxHp,
  };
}

function buildAbilityImprovement(rawScore: number, roll: RollValue): ImprovementAbilityRoll {
  assertInteger(rawScore, 'rawScore');
  assertRollValue(roll, '1d6', 1, 6);

  const fromModifier = scoreToModifierExtended(rawScore);
  let toModifier: number;

  if (fromModifier <= 1) {
    toModifier = roll.total === 1
      ? Math.max(-3, fromModifier - 1)
      : Math.min(6, fromModifier + 1);
  } else {
    toModifier = roll.total >= fromModifier
      ? Math.min(6, fromModifier + 1)
      : Math.max(-3, fromModifier - 1);
  }

  const toScore = modifierToCanonicalScore(toModifier);

  return {
    roll,
    fromScore: rawScore,
    fromModifier,
    toModifier,
    toScore,
    outcome: toModifier > fromModifier ? 'increase' : toModifier < fromModifier ? 'decrease' : 'same',
  };
}

function normalizeSubmittedHp(
  hp: ImprovementHpRoll,
  snapshot: ImprovementCharacterSnapshot,
): ImprovementHpRoll {
  return buildHpImprovement(snapshot.maxHp, hp.check, hp.increase);
}

function normalizeSubmittedDebris(
  debris: ImprovementDebrisRoll,
  catalog: GettingBetterCatalog,
): ImprovementDebrisRoll {
  assertRollValue(debris.roll, '1d6', 1, 6);

  if (debris.roll.total <= 3) {
    return { roll: debris.roll, kind: 'nothing' };
  }

  if (debris.roll.total === 4) {
    if (debris.kind !== 'silver') {
      throw new GettingBetterRuleError('silver debris result requires a silver roll');
    }
    assertRollValue(debris.silver, '3d10', 3, 30);
    return { roll: debris.roll, kind: 'silver', silver: debris.silver, amount: debris.silver.total };
  }

  if (debris.kind !== 'uncleanScroll' && debris.kind !== 'sacredScroll') {
    throw new GettingBetterRuleError('scroll debris result requires a scroll roll');
  }

  const family: ScrollFamily = debris.roll.total === 5 ? 'unclean' : 'sacred';
  const expectedKind = family === 'unclean' ? 'uncleanScroll' : 'sacredScroll';
  if (debris.kind !== expectedKind) {
    throw new GettingBetterRuleError('scroll debris family does not match the debris roll');
  }

  const itemKey = catalogKeyFromRoll(catalog, family, debris.scroll);

  return {
    roll: debris.roll,
    kind: expectedKind,
    scroll: debris.scroll,
    itemKey,
  };
}

function normalizeSubmittedAbilities(
  abilities: Record<AbilityStat, ImprovementAbilityRoll>,
  snapshot: ImprovementCharacterSnapshot,
): Record<AbilityStat, ImprovementAbilityRoll> {
  const normalized = {} as Record<AbilityStat, ImprovementAbilityRoll>;

  for (const stat of ABILITY_STATS) {
    const submitted = abilities[stat];
    if (!submitted) {
      throw new GettingBetterRuleError(`missing ${stat} ability improvement`);
    }
    normalized[stat] = buildAbilityImprovement(snapshot.abilities[stat], submitted.roll);
  }

  return normalized;
}

function normalizeSubmittedScumSpecialties(
  draft: ScumSpecialtyDraft,
  snapshot: ImprovementCharacterSnapshot,
  catalog: GettingBetterCatalog,
): ScumSpecialtyDraft {
  const existing = scumSpecialtiesFromAbilityKeys(snapshot.abilityKeys, catalog);
  const isScum = existing.length > 0 || getScumFixedAbilityKeys(catalog).some((key) => snapshot.abilityKeys.includes(key));

  if (!isScum) {
    if (draft.kind !== 'notScum') {
      throw new GettingBetterRuleError('non-Scum character cannot submit Scum specialties');
    }
    return { kind: 'notScum' };
  }

  if (existing.length === 1) {
    if (draft.kind !== 'firstImprovement') {
      throw new GettingBetterRuleError('first Scum improvement requires a first-improvement draft');
    }
    if (!sameSpecialtySlot(draft.existing, existing[0])) {
      throw new GettingBetterRuleError('first Scum improvement existing specialty does not match the snapshot');
    }

    const added = specialtyFromRollValue(draft.added.roll, catalog);
    if (added.key === existing[0].key) {
      throw new GettingBetterRuleError('Scum specialties must be distinct');
    }

    return {
      kind: 'firstImprovement',
      existing: existing[0],
      added,
    };
  }

  if (existing.length === 2) {
    if (draft.kind !== 'laterImprovement') {
      throw new GettingBetterRuleError('later Scum improvement requires a later-improvement draft');
    }

    const primary = assertCatalogSpecialtySlot(draft.primary, catalog, 'primary');
    const secondary = assertCatalogSpecialtySlot(draft.secondary, catalog, 'secondary');
    if (primary.key === secondary.key) {
      throw new GettingBetterRuleError('Scum specialties must be distinct');
    }

    const [currentPrimary, currentSecondary] = existing;
    if (draft.rerollMode === 'none' && (!sameSpecialtySlot(primary, currentPrimary) || !sameSpecialtySlot(secondary, currentSecondary))) {
      throw new GettingBetterRuleError('Scum specialties cannot change when reroll mode is none');
    }
    if (draft.rerollMode === 'primary' && !sameSpecialtySlot(secondary, currentSecondary)) {
      throw new GettingBetterRuleError('secondary Scum specialty cannot change when only primary is rerolled');
    }
    if (draft.rerollMode === 'secondary' && !sameSpecialtySlot(primary, currentPrimary)) {
      throw new GettingBetterRuleError('primary Scum specialty cannot change when only secondary is rerolled');
    }

    return {
      kind: 'laterImprovement',
      primary,
      secondary,
      rerollMode: draft.rerollMode,
    };
  }

  throw new GettingBetterRuleError('ambiguous Gutterborn Scum specialty state');
}

async function rollCatalogEntry(
  roller: GettingBetterRoller,
  catalog: GettingBetterCatalog,
  family: ScrollFamily,
): Promise<{ key: string; roll: RollValue }> {
  const keys = catalog.scrollKeys(family);
  if (keys.length === 0) {
    throw new GettingBetterRuleError(`catalog has no ${family} scrolls`);
  }

  const roll = await rollValue(roller, `1d${keys.length}`, 1, keys.length);
  return { key: keys[roll.total - 1], roll };
}

function catalogKeyFromRoll(
  catalog: GettingBetterCatalog,
  family: ScrollFamily,
  roll: RollValue,
): string {
  const keys = catalog.scrollKeys(family);
  if (keys.length === 0) {
    throw new GettingBetterRuleError(`catalog has no ${family} scrolls`);
  }

  assertRollValue(roll, `1d${keys.length}`, 1, keys.length);
  return keys[roll.total - 1];
}

async function rollDistinctScumSpecialty(
  roller: GettingBetterRoller,
  catalog: GettingBetterCatalog,
  excludedKeys: Set<string>,
): Promise<SpecialtyRoll> {
  const specialties = getScumSpecialties(catalog);
  const maxRoll = maxSpecialtyRollValue(specialties);
  const available = specialties.filter((specialty) => !excludedKeys.has(specialty.key));

  if (available.length === 0) {
    throw new GettingBetterRuleError('catalog has no distinct Scum specialty available');
  }

  for (let attempt = 0; attempt < maxRoll * 4; attempt += 1) {
    const roll = await rollValue(roller, `1d${maxRoll}`, 1, maxRoll);
    const specialty = specialtyFromRollValue(roll, catalog);
    if (!excludedKeys.has(specialty.key)) {
      return specialty;
    }
  }

  throw new GettingBetterRuleError('could not roll a distinct Scum specialty');
}

function specialtyFromRollValue(roll: RollValue, catalog: GettingBetterCatalog): SpecialtyRoll {
  const specialties = getScumSpecialties(catalog);
  const maxRoll = maxSpecialtyRollValue(specialties);
  assertRollValue(roll, `1d${maxRoll}`, 1, maxRoll);

  const specialty = specialties.find((candidate) => candidate.rollValue === roll.total);
  if (!specialty) {
    throw new GettingBetterRuleError(`no Scum specialty for roll ${roll.total}`);
  }

  return { ...specialty, roll };
}

function assertCatalogSpecialtySlot(
  slot: SpecialtySlot,
  catalog: GettingBetterCatalog,
  label: string,
): SpecialtySlot {
  const specialty = getScumSpecialties(catalog).find((candidate) => candidate.key === slot.key);
  if (!specialty) {
    throw new GettingBetterRuleError(`${label} Scum specialty is not in the catalog`);
  }
  if (specialty.rollValue !== slot.rollValue) {
    throw new GettingBetterRuleError(`${label} Scum specialty roll value does not match the catalog`);
  }
  return specialty;
}

function scumSpecialtiesFromAbilityKeys(
  abilityKeys: readonly string[],
  catalog: GettingBetterCatalog,
): SpecialtySlot[] {
  const specialtiesByKey = new Map(getScumSpecialties(catalog).map((specialty) => [specialty.key, specialty]));
  const seen = new Set<string>();
  const slots: SpecialtySlot[] = [];

  for (const key of abilityKeys) {
    const slot = specialtiesByKey.get(key);
    if (!slot) continue;
    if (seen.has(key)) {
      throw new GettingBetterRuleError('duplicate Scum specialty in ability keys');
    }
    seen.add(key);
    slots.push(slot);
  }

  if (new Set(slots.map((slot) => slot.rollValue)).size !== slots.length) {
    throw new GettingBetterRuleError('duplicate Scum specialty roll values in ability keys');
  }

  return slots;
}

function getScumSpecialties(catalog: GettingBetterCatalog): readonly SpecialtySlot[] {
  const specialties = catalog.scumSpecialties?.() ?? [];
  const keys = new Set<string>();
  const rollValues = new Set<number>();

  for (const specialty of specialties) {
    if (!specialty.key) {
      throw new GettingBetterRuleError('Scum specialty key is required');
    }
    assertInteger(specialty.rollValue, `Scum specialty ${specialty.key} rollValue`);
    if (keys.has(specialty.key)) {
      throw new GettingBetterRuleError(`duplicate Scum specialty key ${specialty.key}`);
    }
    if (rollValues.has(specialty.rollValue)) {
      throw new GettingBetterRuleError(`duplicate Scum specialty roll value ${specialty.rollValue}`);
    }
    keys.add(specialty.key);
    rollValues.add(specialty.rollValue);
  }

  return specialties;
}

function getScumFixedAbilityKeys(catalog: GettingBetterCatalog): readonly string[] {
  return catalog.scumFixedAbilityKeys?.() ?? [];
}

function maxSpecialtyRollValue(specialties: readonly SpecialtySlot[]): number {
  if (specialties.length === 0) {
    throw new GettingBetterRuleError('catalog has no Scum specialties');
  }
  return Math.max(...specialties.map((specialty) => specialty.rollValue));
}

function applyScumSpecialtyDraftToAbilityKeys(
  abilityKeys: readonly string[],
  draft: ScumSpecialtyDraft,
  scumSpecialtyKeys: readonly string[] | undefined,
): string[] {
  if (draft.kind === 'notScum') {
    return [...abilityKeys];
  }

  if (draft.kind === 'firstImprovement') {
    if (abilityKeys.includes(draft.added.key)) {
      return [...abilityKeys];
    }
    return [...abilityKeys, draft.added.key];
  }

  if (draft.rerollMode === 'none') {
    return [...abilityKeys];
  }

  if (!scumSpecialtyKeys) {
    throw new GettingBetterRuleError('Scum specialty keys are required to apply a later Scum reroll');
  }

  const scumSpecialtyKeySet = new Set(scumSpecialtyKeys);
  return [
    ...abilityKeys.filter((key) => !scumSpecialtyKeySet.has(key)),
    draft.primary.key,
    draft.secondary.key,
  ];
}

async function rollValue(
  roller: GettingBetterRoller,
  notation: string,
  min: number,
  max: number,
): Promise<RollValue> {
  const result = await roller.roll(notation);
  const value: RollValue = {
    source: 'server',
    ...(result.dice ? { dice: [...result.dice] } : {}),
    total: result.total,
  };
  assertRollValue(value, notation, min, max);
  return value;
}

function assertRollValue(roll: RollValue, notation: string, min: number, max: number): void {
  assertInteger(roll.total, `${notation} total`);
  if (roll.source !== 'server' && roll.source !== 'table') {
    throw new GettingBetterRuleError(`${notation} roll source is invalid`);
  }
  if (roll.total < min || roll.total > max) {
    throw new GettingBetterRuleError(`${notation} total ${roll.total} is outside ${min}-${max}`);
  }
  if (roll.dice !== undefined) {
    if (!Array.isArray(roll.dice) || roll.dice.some((die) => !Number.isInteger(die))) {
      throw new GettingBetterRuleError(`${notation} dice must be integers`);
    }
    const diceTotal = roll.dice.reduce((sum, die) => sum + die, 0);
    if (diceTotal !== roll.total) {
      throw new GettingBetterRuleError(`${notation} dice total does not match total`);
    }
  }
}

function assertInteger(value: number, label: string): void {
  if (!Number.isInteger(value)) {
    throw new GettingBetterRuleError(`${label} must be an integer`);
  }
}

function assertFiniteNumber(value: number, label: string): void {
  if (!Number.isFinite(value)) {
    throw new GettingBetterRuleError(`${label} must be finite`);
  }
}

function normalizeSnapshotInput(snapshot: ImprovementCharacterSnapshotInput): ImprovementCharacterSnapshotInput {
  return {
    characterUpdatedAt: snapshot.characterUpdatedAt,
    maxHp: snapshot.maxHp,
    silver: snapshot.silver,
    abilities: {
      strength: snapshot.abilities.strength,
      agility: snapshot.abilities.agility,
      presence: snapshot.abilities.presence,
      toughness: snapshot.abilities.toughness,
    },
    abilityKeys: [...snapshot.abilityKeys],
    equipmentFingerprint: snapshot.equipmentFingerprint,
  };
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(',')}]`;
  }

  if (value !== null && typeof value === 'object') {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) => `${JSON.stringify(key)}:${stableStringify(item)}`)
      .join(',')}}`;
  }

  return JSON.stringify(value);
}

function arraysEqual<T>(left: readonly T[], right: readonly T[]): boolean {
  return left.length === right.length && left.every((value, index) => Object.is(value, right[index]));
}

function sameSpecialtySlot(left: SpecialtySlot, right: SpecialtySlot): boolean {
  return left.key === right.key && left.rollValue === right.rollValue;
}
