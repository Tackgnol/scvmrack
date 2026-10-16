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
  const own = (key: string) => key.startsWith(prefix);
  return issueKeys({
    draftKeys,
    inUse,
    numberOf: (key) => (own(key) ? Number.parseInt(key.slice(prefix.length), 10) || 0 : 0),
    keeps: own,
    keyFor,
  });
}

/**
 * The rule behind every stable key list: an entry keeps its saved key when `keeps` accepts it
 * and no earlier entry took it; any other entry gets a number above every number in use
 * (`numberOf` reads a key's number, 0 when the key isn't this list's).
 */
export function issueKeys(input: {
  draftKeys: Array<string | undefined>;
  inUse: string[];
  numberOf: (key: string) => number;
  keeps: (key: string, index: number) => boolean;
  keyFor: (n: number, index: number) => string;
}): string[] {
  const { draftKeys, inUse, numberOf, keeps, keyFor } = input;
  const saved = draftKeys.filter((key): key is string => !!key);
  let next = Math.max(0, ...inUse.map(numberOf), ...saved.map(numberOf)) + 1;
  const used = new Set<string>();
  return draftKeys.map((key, index) => {
    const kept = key && keeps(key, index) && !used.has(key) ? key : keyFor(next++, index);
    used.add(kept);
    return kept;
  });
}
