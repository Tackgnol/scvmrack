import { Prisma } from '@prisma/client';
import { Roller, OSRandomEngine } from '@tackgnol/rpg-tools-roller';
import { abilityGrantedItems } from '../lib/class-grants.js';
import { hydrateInventoryUses } from '../lib/inventory.js';
import {
  ABILITY_STATS,
  buildAppliedImprovement,
  type ImprovementDraft,
} from '../lib/getting-better.js';
import type {
  ImprovementCharacterRow,
  ClassAbilityRow,
} from '../repositories/character-improvement-repository.js';

/** Inventory entries granted by the abilities an improvement adds; tags come from the catalog at read time. */
export async function gainedAbilityItems(
  row: ImprovementCharacterRow,
  classAbilities: ClassAbilityRow[],
  applied: ReturnType<typeof buildAppliedImprovement>
): Promise<unknown[]> {
  const change = applied.changes.abilityKeys;
  if (!change) return [];
  const gained = new Set(change.to.filter((key) => !change.from.includes(key)));
  const items = classAbilities
    .filter((ability) => gained.has(ability.key))
    .flatMap((ability) => abilityGrantedItems(ability, () => []));
  if (items.length === 0) return [];
  return hydrateInventoryUses(
    items,
    row.presence,
    false,
    new Roller({ engine: new OSRandomEngine() })
  );
}

export function characterUpdateFromApplied(
  row: ImprovementCharacterRow,
  draft: ImprovementDraft,
  applied: ReturnType<typeof buildAppliedImprovement>,
  grantedItems: unknown[]
): Prisma.CharacterUpdateInput {
  const data: Prisma.CharacterUpdateInput = {};

  if (applied.changes.maxHp) data.maxHp = applied.changes.maxHp.to;
  if (applied.changes.silver) data.silver = applied.changes.silver.to;

  for (const stat of ABILITY_STATS) {
    const next = draft.abilities[stat].toScore;
    if (next !== row[stat]) data[stat] = next;
  }

  const added = [...appliedDebrisItems(draft), ...grantedItems];
  if (added.length > 0) {
    data.equipment = [...asObjectArray(row.equipment), ...added] as Prisma.InputJsonValue;
  }

  if (applied.changes.abilityKeys) {
    data.abilities = abilityJsonFromKeys(
      row.abilities,
      applied.changes.abilityKeys.to
    ) as Prisma.InputJsonValue;
  }

  return data;
}

function appliedDebrisItems(draft: ImprovementDraft): unknown[] {
  if (
    draft.debris.kind !== 'uncleanScroll' &&
    draft.debris.kind !== 'sacredScroll'
  ) {
    return [];
  }
  return [{ key: draft.debris.itemKey, uses: [false, false, false, false] }];
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
