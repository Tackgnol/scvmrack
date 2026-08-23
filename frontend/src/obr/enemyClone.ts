import { createEnemyRowId, createObrEnemyId } from "@tackgnol/rpgtools-owlbear";
import type { ObrEnemy } from "./enemies";

export function cloneEnemy(enemy: ObrEnemy, existingNames: string[]): ObrEnemy {
  return {
    ...enemy,
    id: createObrEnemyId(),
    partyId: undefined,
    name: nextCloneName(enemy.name, existingNames),
    attacks: enemy.attacks.map((attack) => ({
      ...attack,
      id: createEnemyRowId(),
    })),
    specials: enemy.specials.map((special) => ({
      ...special,
      id: createEnemyRowId(),
    })),
    loot: enemy.loot.map((loot) => ({ ...loot, id: createEnemyRowId() })),
    statuses: enemy.statuses.map((status) => ({ ...status })),
  };
}

export function nextCloneName(name: string, existingNames: string[]): string {
  const base = name.trim().replace(/\s+\d+$/, "") || name.trim();
  let highest = 1;
  for (const existing of existingNames) {
    const trimmed = existing.trim();
    if (trimmed === base) {
      continue;
    }
    if (!trimmed.startsWith(`${base} `)) {
      continue;
    }
    const suffix = Number(trimmed.slice(base.length + 1));
    if (Number.isInteger(suffix) && suffix > highest) {
      highest = suffix;
    }
  }
  return `${base} ${highest + 1}`;
}
