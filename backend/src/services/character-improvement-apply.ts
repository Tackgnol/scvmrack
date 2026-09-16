import { Prisma } from '@prisma/client';
import {
  ABILITY_STATS,
  buildAppliedImprovement,
  type ImprovementDraft,
} from '../lib/getting-better.js';
import type { ImprovementCharacterRow } from '../repositories/character-improvement-repository.js';

export function characterUpdateFromApplied(
  row: ImprovementCharacterRow,
  draft: ImprovementDraft,
  applied: ReturnType<typeof buildAppliedImprovement>
): Prisma.CharacterUpdateInput {
  const data: Prisma.CharacterUpdateInput = {};

  if (applied.changes.maxHp) data.maxHp = applied.changes.maxHp.to;
  if (applied.changes.silver) data.silver = applied.changes.silver.to;

  for (const stat of ABILITY_STATS) {
    const next = draft.abilities[stat].toScore;
    if (next !== row[stat]) data[stat] = next;
  }

  const equipment = equipmentWithAppliedDebris(row, draft);
  if (equipment) data.equipment = equipment as Prisma.InputJsonValue;

  if (applied.changes.abilityKeys) {
    data.abilities = abilityJsonFromKeys(
      row.abilities,
      applied.changes.abilityKeys.to
    ) as Prisma.InputJsonValue;
  }

  return data;
}

function equipmentWithAppliedDebris(
  row: ImprovementCharacterRow,
  draft: ImprovementDraft
): unknown[] | undefined {
  if (
    draft.debris.kind !== 'uncleanScroll' &&
    draft.debris.kind !== 'sacredScroll'
  ) {
    return undefined;
  }
  return [
    ...asObjectArray(row.equipment),
    { key: draft.debris.itemKey, uses: [false, false, false, false] },
  ];
}

function abilityJsonFromKeys(
  currentAbilities: unknown,
  keys: string[]
): Array<Record<string, unknown>> {
  const existingByKey = new Map(
    asObjectArray(currentAbilities)
      .filter((ability) => typeof ability.key === 'string')
      .map((ability) => [ability.key as string, ability])
  );
  return keys.map((key) => ({ ...(existingByKey.get(key) ?? {}), key }));
}

function asObjectArray(value: unknown): Array<Record<string, unknown>> {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is Record<string, unknown> =>
      item !== null && typeof item === 'object' && !Array.isArray(item)
  );
}
