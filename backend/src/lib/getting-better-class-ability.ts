import {
  assertInteger,
  assertRollValue,
  rollValue,
} from './getting-better-roll-value.js';
import {
  GettingBetterRuleError,
  type ClassAbilityDraft,
  type GettingBetterCatalog,
  type GettingBetterRoller,
  type GettingBetterRule,
  type ImprovementCharacterSnapshot,
  type RollValue,
  type SpecialtyChoice,
  type SpecialtyRoll,
  type SpecialtySlot,
} from './getting-better-types.js';

/** Rolls the class-ability part of an improvement draft for the class's Getting Better rule. */
export async function rollClassAbility(
  abilityKeys: readonly string[],
  appliedCount: number,
  roller: GettingBetterRoller,
  catalog: GettingBetterCatalog
): Promise<ClassAbilityDraft> {
  assertInteger(appliedCount, 'appliedCount');
  const kind = expectedKind(classRule(catalog), appliedCount);
  const heldKeys = new Set(abilityKeys);
  switch (kind) {
    case 'none':
      return { kind };
    case 'newAbility':
      return { kind, added: await rollFreeAbility(roller, catalog, heldKeys) };
    case 'firstSpecialty':
      return {
        kind,
        existing: heldPoolAbilities(abilityKeys, catalog),
        added: await rollFreeAbility(roller, catalog, heldKeys),
      };
  }

  // Offers stay distinct while the pool allows; once it runs short a specialty
  // may share an earlier offer, and only one of them can then be rerolled.
  const offered = new Set(heldKeys);
  const specialties: SpecialtyChoice[] = [];
  for (const current of heldPoolAbilities(abilityKeys, catalog)) {
    const replacement =
      (await rollFreeAbility(roller, catalog, offered)) ??
      (await rollFreeAbility(roller, catalog, heldKeys));
    if (replacement) offered.add(replacement.key);
    specialties.push({ current, replacement, reroll: false });
  }
  return { kind: 'specialties', specialties };
}

/** Rebuilds a submitted class-ability draft from trusted state, keeping only the rolls and toggles. */
export function normalizeSubmittedClassAbility(
  draft: ClassAbilityDraft,
  snapshot: ImprovementCharacterSnapshot,
  appliedCount: number,
  catalog: GettingBetterCatalog
): ClassAbilityDraft {
  const expected = expectedKind(classRule(catalog), appliedCount);
  if (draft.kind !== expected) {
    throw new GettingBetterRuleError(`expected a ${expected} draft`);
  }
  const heldKeys = new Set(snapshot.abilityKeys);
  const held = heldPoolAbilities(snapshot.abilityKeys, catalog);

  switch (draft.kind) {
    case 'none':
      return { kind: 'none' };
    case 'newAbility':
      return { kind: 'newAbility', added: freeAbilityFromSubmission(draft.added, catalog, heldKeys) };
    case 'firstSpecialty':
      return {
        kind: 'firstSpecialty',
        existing: held,
        added: freeAbilityFromSubmission(draft.added, catalog, heldKeys),
      };
    case 'specialties': {
      if (draft.specialties.length !== held.length) {
        throw new GettingBetterRuleError('specialties do not match the held abilities');
      }
      const chosen = new Set<string>();
      return {
        kind: 'specialties',
        specialties: held.map((current, index) => {
          const submitted = draft.specialties[index];
          if (submitted.current.key !== current.key) {
            throw new GettingBetterRuleError('specialties do not match the held abilities');
          }
          const replacement = freeAbilityFromSubmission(submitted.replacement, catalog, heldKeys);
          const reroll = submitted.reroll === true;
          if (reroll && !replacement) {
            throw new GettingBetterRuleError('a rerolled specialty has no replacement');
          }
          if (reroll && replacement) {
            if (chosen.has(replacement.key)) {
              throw new GettingBetterRuleError('rerolled specialties must be distinct');
            }
            chosen.add(replacement.key);
          }
          return { current, replacement, reroll };
        }),
      };
    }
  }
}

/** Ability keys after the draft: gained abilities are appended, rerolled specialties replaced in place. */
export function applyClassAbilityDraft(
  abilityKeys: readonly string[],
  draft: ClassAbilityDraft
): string[] {
  switch (draft.kind) {
    case 'none':
      return [...abilityKeys];
    case 'newAbility':
    case 'firstSpecialty':
      return draft.added && !abilityKeys.includes(draft.added.key)
        ? [...abilityKeys, draft.added.key]
        : [...abilityKeys];
    case 'specialties': {
      const swaps = new Map(
        draft.specialties
          .filter((choice) => choice.reroll && choice.replacement)
          .map((choice) => [choice.current.key, choice.replacement!.key])
      );
      return abilityKeys.map((key) => swaps.get(key) ?? key);
    }
  }
}

type LegacySpecialties =
  | { kind: 'notScum' }
  | { kind: 'firstImprovement'; existing: SpecialtySlot; added: SpecialtyRoll }
  | {
      kind: 'laterImprovement';
      primary: SpecialtySlot;
      secondary: SpecialtySlot;
      rerollMode: 'none' | 'primary' | 'secondary' | 'both';
    };

/**
 * Converts a draft stored before RPG-260 (`scumSpecialties` with two slots and a
 * reroll mode) to per-specialty toggles, rolling the replacements the old shape
 * never had. Returns null when the draft is already current.
 * Redundant once no pre-0.7.0 active improvement previews remain.
 */
export async function upgradeLegacyImprovementDraft(
  draft: Record<string, unknown>,
  abilityKeys: readonly string[],
  roller: GettingBetterRoller,
  catalog: GettingBetterCatalog
): Promise<Record<string, unknown> | null> {
  if (!('scumSpecialties' in draft)) return null;
  const { scumSpecialties: legacy, ...rest } = draft as { scumSpecialties: LegacySpecialties };

  let classAbility: ClassAbilityDraft;
  if (legacy.kind === 'firstImprovement') {
    classAbility = {
      kind: 'firstSpecialty',
      existing: [legacy.existing],
      added: legacy.added,
    };
  } else if (legacy.kind === 'laterImprovement') {
    const mode = legacy.rerollMode;
    const rolled = await rollClassAbility(abilityKeys, 1, roller, catalog);
    const replacementFor = (key: string) =>
      rolled.kind === 'specialties'
        ? rolled.specialties.find((choice) => choice.current.key === key)?.replacement ?? null
        : null;
    const choice = (current: SpecialtySlot, reroll: boolean): SpecialtyChoice => {
      const replacement = replacementFor(current.key);
      return { current, replacement, reroll: reroll && replacement !== null };
    };
    classAbility = {
      kind: 'specialties',
      specialties: [
        choice(legacy.primary, mode === 'primary' || mode === 'both'),
        choice(legacy.secondary, mode === 'secondary' || mode === 'both'),
      ],
    };
  } else {
    classAbility = { kind: 'none' };
  }
  return { ...rest, classAbility };
}

function expectedKind(rule: GettingBetterRule, appliedCount: number): ClassAbilityDraft['kind'] {
  if (rule === 'book') return 'none';
  if (rule === 'book_plus_ability') return 'newAbility';
  return appliedCount === 0 ? 'firstSpecialty' : 'specialties';
}

async function rollFreeAbility(
  roller: GettingBetterRoller,
  catalog: GettingBetterCatalog,
  taken: ReadonlySet<string>
): Promise<SpecialtyRoll | null> {
  const abilities = classPool(catalog);
  if (!abilities.some((ability) => !taken.has(ability.key))) return null;
  const maxRoll = maxPoolRoll(abilities);

  // ponytail: reroll-until-free mirrors the table rule; fine while pools stay at 20 abilities.
  for (;;) {
    const roll = await rollValue(roller, `1d${maxRoll}`, 1, maxRoll);
    const ability = abilities.find((candidate) => candidate.rollValue === roll.total);
    if (ability && !taken.has(ability.key)) return { ...ability, roll };
  }
}

function freeAbilityFromSubmission(
  submitted: SpecialtyRoll | null,
  catalog: GettingBetterCatalog,
  heldKeys: ReadonlySet<string>
): SpecialtyRoll | null {
  if (!submitted) return null;
  const ability = abilityFromRoll(submitted.roll, catalog);
  if (heldKeys.has(ability.key)) {
    throw new GettingBetterRuleError(`${ability.key} is already held`);
  }
  return ability;
}

function abilityFromRoll(roll: RollValue, catalog: GettingBetterCatalog): SpecialtyRoll {
  const abilities = classPool(catalog);
  const maxRoll = maxPoolRoll(abilities);
  assertRollValue(roll, `1d${maxRoll}`, 1, maxRoll);
  const ability = abilities.find((candidate) => candidate.rollValue === roll.total);
  if (!ability) {
    throw new GettingBetterRuleError(`no class ability for roll ${roll.total}`);
  }
  return { ...ability, roll };
}

function heldPoolAbilities(
  abilityKeys: readonly string[],
  catalog: GettingBetterCatalog
): SpecialtySlot[] {
  const byKey = new Map(classPool(catalog).map((ability) => [ability.key, ability]));
  const held: SpecialtySlot[] = [];
  for (const key of new Set(abilityKeys)) {
    const ability = byKey.get(key);
    if (ability) held.push(ability);
  }
  return held;
}

function classRule(catalog: GettingBetterCatalog): GettingBetterRule {
  return catalog.classRule?.() ?? 'book';
}

function classPool(catalog: GettingBetterCatalog): readonly SpecialtySlot[] {
  const abilities = catalog.classPool?.() ?? [];
  const keys = new Set<string>();
  const rollValues = new Set<number>();
  for (const ability of abilities) {
    assertInteger(ability.rollValue, `class ability ${ability.key} rollValue`);
    if (keys.has(ability.key) || rollValues.has(ability.rollValue)) {
      throw new GettingBetterRuleError(`duplicate class ability ${ability.key}`);
    }
    keys.add(ability.key);
    rollValues.add(ability.rollValue);
  }
  return abilities;
}

function maxPoolRoll(abilities: readonly SpecialtySlot[]): number {
  if (abilities.length === 0) {
    throw new GettingBetterRuleError('class has no random abilities');
  }
  return Math.max(...abilities.map((ability) => ability.rollValue));
}
