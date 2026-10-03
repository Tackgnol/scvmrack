import type { CharacterResponse } from "@/hooks/models";

/** Names with how many times each appears, in first-seen order; blanks left out. */
export function namedCounts(names: Array<string | undefined>): Array<[string, number]> {
  const counts = new Map<string, number>();
  for (const name of names) {
    if (name) counts.set(name, (counts.get(name) ?? 0) + 1);
  }
  return [...counts];
}

/** Everything a scvm starts with, by name, with how many of each. */
export function gearCounts(scvm: CharacterResponse): Array<[string, number]> {
  const items = [...(scvm.equippedWeapons ?? []), scvm.equippedArmor ?? null, ...(scvm.equipment ?? [])];
  return namedCounts(items.map((item) => item?.name));
}
