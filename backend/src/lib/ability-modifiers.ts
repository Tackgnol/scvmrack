export const ABILITY_STATS = [
  'strength',
  'agility',
  'presence',
  'toughness',
] as const;

export type AbilityStat = (typeof ABILITY_STATS)[number];

export function statToModifier(stat: number): number {
  if (stat <= 4) return -3;
  if (stat <= 6) return -2;
  if (stat <= 8) return -1;
  if (stat <= 12) return 0;
  if (stat <= 14) return 1;
  if (stat <= 16) return 2;
  if (stat <= 18) return 3;
  if (stat <= 19) return 4;
  if (stat <= 20) return 5;
  return 6;
}
