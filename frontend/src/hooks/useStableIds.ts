import { useState } from "react";

/**
 * Ids for the entries of a list that has none of its own, so React keeps each
 * entry's component across inserts and removals. Call `insert`/`remove`
 * alongside the change to the list itself.
 */
export function useStableIds(count: number) {
  const [ids, setIds] = useState(() => Array.from({ length: count }, () => crypto.randomUUID()));
  let current = ids;
  if (ids.length !== count) {
    current = Array.from({ length: count }, (_, i) => ids[i] ?? crypto.randomUUID());
    setIds(current);
  }
  return {
    ids: current,
    insert: (at: number) =>
      setIds((list) => [...list.slice(0, at), crypto.randomUUID(), ...list.slice(at)]),
    remove: (at: number) => setIds((list) => list.filter((_, i) => i !== at)),
  };
}
