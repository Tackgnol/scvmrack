import {
  assertInteger,
  assertRollValue,
  rollValue,
} from './getting-better-roll-value.js';
import {
  GettingBetterRuleError,
  type GettingBetterCatalog,
  type GettingBetterRoller,
  type ImprovementCharacterSnapshot,
  type ScumSpecialtyCharacter,
  type ScumSpecialtyDraft,
  type SpecialtyRoll,
  type SpecialtySlot,
  type RollValue,
} from './getting-better-types.js';

export async function rollScumSpecialties(
  character: ScumSpecialtyCharacter,
  appliedCount: number,
  roller: GettingBetterRoller,
  catalog: GettingBetterCatalog
): Promise<ScumSpecialtyDraft> {
  assertInteger(appliedCount, 'appliedCount');
  if (!character.isGutterbornScum) return { kind: 'notScum' };

  const existing = scumSpecialtiesFromAbilityKeys(
    character.abilityKeys,
    catalog
  );
  if (appliedCount === 0) {
    if (existing.length !== 1) {
      throw new GettingBetterRuleError(
        'Gutterborn Scum first improvement requires exactly one existing specialty'
      );
    }
    return {
      kind: 'firstImprovement',
      existing: existing[0],
      added: await rollDistinctScumSpecialty(
        roller,
        catalog,
        new Set([existing[0].key])
      ),
    };
  }

  if (existing.length !== 2) {
    throw new GettingBetterRuleError(
      'Gutterborn Scum later improvement requires exactly two existing specialties'
    );
  }
  return {
    kind: 'laterImprovement',
    primary: existing[0],
    secondary: existing[1],
    rerollMode: 'none',
  };
}

export function normalizeSubmittedScumSpecialties(
  draft: ScumSpecialtyDraft,
  snapshot: ImprovementCharacterSnapshot,
  catalog: GettingBetterCatalog
): ScumSpecialtyDraft {
  const existing = scumSpecialtiesFromAbilityKeys(
    snapshot.abilityKeys,
    catalog
  );
  const isScum =
    existing.length > 0 ||
    getScumFixedAbilityKeys(catalog).some((key) =>
      snapshot.abilityKeys.includes(key)
    );

  if (!isScum) {
    if (draft.kind !== 'notScum') {
      throw new GettingBetterRuleError(
        'non-Scum character cannot submit Scum specialties'
      );
    }
    return { kind: 'notScum' };
  }

  if (existing.length === 1) {
    if (draft.kind !== 'firstImprovement') {
      throw new GettingBetterRuleError(
        'first Scum improvement requires a first-improvement draft'
      );
    }
    if (!sameSpecialtySlot(draft.existing, existing[0])) {
      throw new GettingBetterRuleError(
        'first Scum improvement existing specialty does not match the snapshot'
      );
    }
    const added = specialtyFromRollValue(draft.added.roll, catalog);
    if (added.key === existing[0].key) {
      throw new GettingBetterRuleError('Scum specialties must be distinct');
    }
    return { kind: 'firstImprovement', existing: existing[0], added };
  }

  if (existing.length === 2) {
    if (draft.kind !== 'laterImprovement') {
      throw new GettingBetterRuleError(
        'later Scum improvement requires a later-improvement draft'
      );
    }
    const primary = assertCatalogSpecialtySlot(
      draft.primary,
      catalog,
      'primary'
    );
    const secondary = assertCatalogSpecialtySlot(
      draft.secondary,
      catalog,
      'secondary'
    );
    if (primary.key === secondary.key) {
      throw new GettingBetterRuleError('Scum specialties must be distinct');
    }

    const [currentPrimary, currentSecondary] = existing;
    if (
      draft.rerollMode === 'none' &&
      (!sameSpecialtySlot(primary, currentPrimary) ||
        !sameSpecialtySlot(secondary, currentSecondary))
    ) {
      throw new GettingBetterRuleError(
        'Scum specialties cannot change when reroll mode is none'
      );
    }
    if (
      draft.rerollMode === 'primary' &&
      !sameSpecialtySlot(secondary, currentSecondary)
    ) {
      throw new GettingBetterRuleError(
        'secondary Scum specialty cannot change when only primary is rerolled'
      );
    }
    if (
      draft.rerollMode === 'secondary' &&
      !sameSpecialtySlot(primary, currentPrimary)
    ) {
      throw new GettingBetterRuleError(
        'primary Scum specialty cannot change when only secondary is rerolled'
      );
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

export function applyScumSpecialtyDraftToAbilityKeys(
  abilityKeys: readonly string[],
  draft: ScumSpecialtyDraft,
  scumSpecialtyKeys: readonly string[] | undefined
): string[] {
  if (draft.kind === 'notScum') return [...abilityKeys];
  if (draft.kind === 'firstImprovement') {
    return abilityKeys.includes(draft.added.key)
      ? [...abilityKeys]
      : [...abilityKeys, draft.added.key];
  }
  if (draft.rerollMode === 'none') return [...abilityKeys];
  if (!scumSpecialtyKeys) {
    throw new GettingBetterRuleError(
      'Scum specialty keys are required to apply a later Scum reroll'
    );
  }

  const scumSpecialtyKeySet = new Set(scumSpecialtyKeys);
  return [
    ...abilityKeys.filter((key) => !scumSpecialtyKeySet.has(key)),
    draft.primary.key,
    draft.secondary.key,
  ];
}

async function rollDistinctScumSpecialty(
  roller: GettingBetterRoller,
  catalog: GettingBetterCatalog,
  excludedKeys: Set<string>
): Promise<SpecialtyRoll> {
  const specialties = getScumSpecialties(catalog);
  const maxRoll = maxSpecialtyRollValue(specialties);
  if (!specialties.some((specialty) => !excludedKeys.has(specialty.key))) {
    throw new GettingBetterRuleError(
      'catalog has no distinct Scum specialty available'
    );
  }

  for (let attempt = 0; attempt < maxRoll * 4; attempt += 1) {
    const roll = await rollValue(roller, `1d${maxRoll}`, 1, maxRoll);
    const specialty = specialtyFromRollValue(roll, catalog);
    if (!excludedKeys.has(specialty.key)) return specialty;
  }
  throw new GettingBetterRuleError('could not roll a distinct Scum specialty');
}

function specialtyFromRollValue(
  roll: RollValue,
  catalog: GettingBetterCatalog
): SpecialtyRoll {
  const specialties = getScumSpecialties(catalog);
  const maxRoll = maxSpecialtyRollValue(specialties);
  assertRollValue(roll, `1d${maxRoll}`, 1, maxRoll);
  const specialty = specialties.find(
    (candidate) => candidate.rollValue === roll.total
  );
  if (!specialty) {
    throw new GettingBetterRuleError(
      `no Scum specialty for roll ${roll.total}`
    );
  }
  return { ...specialty, roll };
}

function assertCatalogSpecialtySlot(
  slot: SpecialtySlot,
  catalog: GettingBetterCatalog,
  label: string
): SpecialtySlot {
  const specialty = getScumSpecialties(catalog).find(
    (candidate) => candidate.key === slot.key
  );
  if (!specialty) {
    throw new GettingBetterRuleError(
      `${label} Scum specialty is not in the catalog`
    );
  }
  if (specialty.rollValue !== slot.rollValue) {
    throw new GettingBetterRuleError(
      `${label} Scum specialty roll value does not match the catalog`
    );
  }
  return specialty;
}

function scumSpecialtiesFromAbilityKeys(
  abilityKeys: readonly string[],
  catalog: GettingBetterCatalog
): SpecialtySlot[] {
  const specialtiesByKey = new Map(
    getScumSpecialties(catalog).map((specialty) => [specialty.key, specialty])
  );
  const seen = new Set<string>();
  const slots: SpecialtySlot[] = [];
  for (const key of abilityKeys) {
    const slot = specialtiesByKey.get(key);
    if (!slot) continue;
    if (seen.has(key)) {
      throw new GettingBetterRuleError(
        'duplicate Scum specialty in ability keys'
      );
    }
    seen.add(key);
    slots.push(slot);
  }
  if (new Set(slots.map((slot) => slot.rollValue)).size !== slots.length) {
    throw new GettingBetterRuleError(
      'duplicate Scum specialty roll values in ability keys'
    );
  }
  return slots;
}

function getScumSpecialties(
  catalog: GettingBetterCatalog
): readonly SpecialtySlot[] {
  const specialties = catalog.scumSpecialties?.() ?? [];
  const keys = new Set<string>();
  const rollValues = new Set<number>();
  for (const specialty of specialties) {
    if (!specialty.key) {
      throw new GettingBetterRuleError('Scum specialty key is required');
    }
    assertInteger(
      specialty.rollValue,
      `Scum specialty ${specialty.key} rollValue`
    );
    if (keys.has(specialty.key)) {
      throw new GettingBetterRuleError(
        `duplicate Scum specialty key ${specialty.key}`
      );
    }
    if (rollValues.has(specialty.rollValue)) {
      throw new GettingBetterRuleError(
        `duplicate Scum specialty roll value ${specialty.rollValue}`
      );
    }
    keys.add(specialty.key);
    rollValues.add(specialty.rollValue);
  }
  return specialties;
}

function getScumFixedAbilityKeys(
  catalog: GettingBetterCatalog
): readonly string[] {
  return catalog.scumFixedAbilityKeys?.() ?? [];
}

function maxSpecialtyRollValue(specialties: readonly SpecialtySlot[]): number {
  if (specialties.length === 0) {
    throw new GettingBetterRuleError('catalog has no Scum specialties');
  }
  return Math.max(...specialties.map((specialty) => specialty.rollValue));
}

function sameSpecialtySlot(left: SpecialtySlot, right: SpecialtySlot): boolean {
  return left.key === right.key && left.rollValue === right.rollValue;
}
