import {
  normalizeSubmittedAbilities,
  normalizeSubmittedDebris,
  normalizeSubmittedHp,
} from './getting-better-rolls.js';
import {
  applyScumSpecialtyDraftToAbilityKeys,
  normalizeSubmittedScumSpecialties,
} from './getting-better-scum.js';
import { hasValidImprovementSnapshotHash } from './getting-better-snapshot.js';
import {
  ABILITY_STATS,
  GettingBetterRuleError,
  type AppliedImprovement,
  type AppliedImprovementCharacter,
  type BuildAppliedImprovementOptions,
  type GettingBetterCatalog,
  type ImprovementCharacterSnapshot,
  type ImprovementDraft,
} from './getting-better-types.js';

export function normalizeSubmittedImprovementDraft(
  draft: ImprovementDraft,
  snapshot: ImprovementCharacterSnapshot,
  catalog: GettingBetterCatalog
): ImprovementDraft {
  if (!hasValidImprovementSnapshotHash(snapshot)) {
    throw new GettingBetterRuleError(
      'trusted improvement snapshot hash is invalid'
    );
  }
  if (draft.snapshot.snapshotHash !== snapshot.snapshotHash) {
    throw new GettingBetterRuleError(
      'submitted improvement draft does not match the trusted snapshot'
    );
  }

  return {
    sequence: draft.sequence,
    snapshot,
    hp: normalizeSubmittedHp(draft.hp, snapshot),
    debris: normalizeSubmittedDebris(draft.debris, catalog),
    abilities: normalizeSubmittedAbilities(draft.abilities, snapshot),
    scumSpecialties: normalizeSubmittedScumSpecialties(
      draft.scumSpecialties,
      snapshot,
      catalog
    ),
  };
}

export function buildAppliedImprovement(
  draft: ImprovementDraft,
  character: AppliedImprovementCharacter,
  options: BuildAppliedImprovementOptions
): AppliedImprovement {
  const abilityChanges: AppliedImprovement['changes']['abilities'] = {};
  for (const stat of ABILITY_STATS) {
    const fromScore = character.abilities[stat];
    const toScore = draft.abilities[stat].toScore;
    if (fromScore !== toScore) {
      abilityChanges[stat] = { fromScore, toScore };
    }
  }

  const changes: AppliedImprovement['changes'] = { abilities: abilityChanges };
  if (draft.hp.toMaxHp !== character.maxHp) {
    changes.maxHp = { from: character.maxHp, to: draft.hp.toMaxHp };
  }
  if (draft.debris.kind === 'silver') {
    changes.silver = {
      from: character.silver,
      to: character.silver + draft.debris.amount,
    };
  }
  if (
    draft.debris.kind === 'uncleanScroll' ||
    draft.debris.kind === 'sacredScroll'
  ) {
    changes.equipmentAdded = [{ itemKey: draft.debris.itemKey }];
  }

  const nextAbilityKeys = applyScumSpecialtyDraftToAbilityKeys(
    character.abilityKeys,
    draft.scumSpecialties,
    character.scumSpecialtyKeys
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

function arraysEqual<T>(left: readonly T[], right: readonly T[]): boolean {
  return (
    left.length === right.length &&
    left.every((value, index) => Object.is(value, right[index]))
  );
}
