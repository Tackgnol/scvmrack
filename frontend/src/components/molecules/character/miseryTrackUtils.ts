export const MISERY_MARKS = ["I", "II", "III", "IV", "V", "VI", "VII"] as const;

export type MiseryMarkLabel = (typeof MISERY_MARKS)[number];

export function normalizeMiseryCount(count: number | undefined): number {
  return Math.max(0, Math.min(MISERY_MARKS.length, Math.floor(count ?? 0)));
}

export function getAdjacentMiseryIndex(
  index: number,
  key: string,
): number | null {
  const direction =
    key === "ArrowRight" || key === "ArrowDown"
      ? 1
      : key === "ArrowLeft" || key === "ArrowUp"
        ? -1
        : 0;

  return direction
    ? (index + direction + MISERY_MARKS.length) % MISERY_MARKS.length
    : null;
}

export function getSelectedMiseryCount(count: number, index: number): number {
  return count === index + 1 ? index : index + 1;
}
