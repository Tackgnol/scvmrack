import { createHash } from 'node:crypto';
import { stableStringify } from './stable-json.js';
import type {
  ImprovementCharacterSnapshot,
  ImprovementCharacterSnapshotInput,
} from './getting-better-types.js';

export function hashImprovementSnapshot(
  snapshot: ImprovementCharacterSnapshotInput
): string {
  return createHash('sha256').update(stableStringify(snapshot)).digest('hex');
}

export function buildImprovementSnapshot(
  snapshot: ImprovementCharacterSnapshotInput
): ImprovementCharacterSnapshot {
  const normalized = normalizeSnapshotInput(snapshot);
  return {
    ...normalized,
    snapshotHash: hashImprovementSnapshot(normalized),
  };
}

export function hasValidImprovementSnapshotHash(
  snapshot: ImprovementCharacterSnapshot
): boolean {
  const { snapshotHash: _snapshotHash, ...input } = snapshot;
  return hashImprovementSnapshot(input) === snapshot.snapshotHash;
}

function normalizeSnapshotInput(
  snapshot: ImprovementCharacterSnapshotInput
): ImprovementCharacterSnapshotInput {
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
