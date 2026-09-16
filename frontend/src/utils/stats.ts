export const ABILITY_STATS = [
  "strength",
  "agility",
  "presence",
  "toughness",
] as const;

export type AbilityStat = (typeof ABILITY_STATS)[number];

export function statToModifier(stat?: number): number {
  const value = Number.isFinite(stat) ? Number(stat) : 10;
  if (value <= 4) return -3;
  if (value <= 6) return -2;
  if (value <= 8) return -1;
  if (value <= 12) return 0;
  if (value <= 14) return 1;
  if (value <= 16) return 2;
  if (value <= 18) return 3;
  if (value <= 19) return 4;
  if (value <= 20) return 5;
  return 6;
}

export function modifierToCanonicalScore(modifier: number): number {
  if (modifier <= -3) return 4;
  if (modifier === -2) return 5;
  if (modifier === -1) return 7;
  if (modifier === 0) return 9;
  if (modifier === 1) return 13;
  if (modifier === 2) return 15;
  if (modifier === 3) return 17;
  if (modifier === 4) return 19;
  if (modifier === 5) return 20;
  return 21;
}
