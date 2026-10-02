/** Where an ability sits in its class's list. */
export type AbilityOrder = { position: number | null; id: number };

/** Orders abilities as the class lists them: (position, id), unpositioned last. */
export function byClassOrder(left: AbilityOrder, right: AbilityOrder): number {
  return (left.position ?? Infinity) - (right.position ?? Infinity) || left.id - right.id;
}
