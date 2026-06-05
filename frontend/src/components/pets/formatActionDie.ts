export function formatActionDie(dice?: number[]): string {
  if (!dice || dice.length === 0) {
    return '-';
  }

  const normalized = dice.flatMap((value) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? [parsed] : [];
  });

  if (normalized.length === 0) {
    return '-';
  }

  return normalized.map((value) => `d${value}`).join(' + ');
}
