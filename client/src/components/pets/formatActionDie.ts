export function formatActionDie(dice?: number[]): string {
  if (!dice || dice.length === 0) {
    return '-';
  }

  const normalized = dice
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value) && value > 0);

  if (normalized.length === 0) {
    return '-';
  }

  return normalized.map((value) => `d${value}`).join(' + ');
}
