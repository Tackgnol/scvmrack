export function formatDice(dice?: number[]): string {
  if (!dice || dice.length === 0) return '';

  const counts: Record<number, number> = {};
  dice.forEach((die) => {
    counts[die] = (counts[die] || 0) + 1;
  });

  return Object.entries(counts)
    .map(([die, count]) => (count > 1 ? `${count}d${die}` : `d${die}`))
    .join(' + ');
}
