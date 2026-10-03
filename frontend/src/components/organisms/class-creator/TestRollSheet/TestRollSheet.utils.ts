import type { CharacterResponse } from "@/hooks/models";

/** Everything a scvm starts with, by name, with how many of each. */
export function gearCounts(scvm: CharacterResponse): Array<[string, number]> {
  const counts = new Map<string, number>();
  const items = [...(scvm.equippedWeapons ?? []), scvm.equippedArmor ?? null, ...(scvm.equipment ?? [])];
  for (const item of items) {
    if (item?.name) counts.set(item.name, (counts.get(item.name) ?? 0) + 1);
  }
  return [...counts];
}
