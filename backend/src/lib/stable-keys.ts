/**
 * Translation keys for a list of saved-or-new entries. An entry keeps the key it
 * was saved with (when it is this list's and not repeated); a new one gets a
 * number above every key in use, so a removed entry's key, whose text stays for
 * the characters holding it, is never handed to another.
 */
export function stableKeys(
  prefix: string,
  inUse: string[],
  draftKeys: Array<string | undefined>,
  keyFor: (n: number) => string
): string[] {
  const own = (key?: string): key is string => !!key && key.startsWith(prefix);
  const numberOf = (key: string) => Number.parseInt(key.slice(prefix.length), 10) || 0;
  let next = Math.max(0, ...inUse.filter(own).map(numberOf), ...draftKeys.filter(own).map(numberOf)) + 1;
  const used = new Set<string>();
  return draftKeys.map((key) => {
    const kept = own(key) && !used.has(key) ? key : keyFor(next++);
    used.add(kept);
    return kept;
  });
}
