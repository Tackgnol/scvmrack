/** Returns a list with one entry moved to its new index, without mutating the source. */
export function moveEntry<T>(
  entries: readonly T[],
  from: number,
  to: number,
): T[] {
  if (
    from === to ||
    from < 0 ||
    to < 0 ||
    from >= entries.length ||
    to >= entries.length
  ) {
    return [...entries];
  }
  const next = [...entries];
  const [entry] = next.splice(from, 1);
  next.splice(to, 0, entry);
  return next;
}

/** Carries an open-card index through a list move. */
export function movedIndex(
  index: number | null,
  from: number,
  to: number,
): number | null {
  if (index === null) {
    return null;
  }
  if (index === from) {
    return to;
  }
  if (from < to && index > from && index <= to) {
    return index - 1;
  }
  if (to < from && index >= to && index < from) {
    return index + 1;
  }
  return index;
}
