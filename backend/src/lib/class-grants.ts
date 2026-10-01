export type AbilityGrants = {
  grantItemKey: string | null;
  grantPetKey: string | null;
};

export type GrantedItem = {
  key: string;
  tags: string[];
  uses?: boolean[];
};

const GRANTED_ITEM_EXTRAS: Record<string, Partial<GrantedItem>> = {
  'equipment.wizard-teeth': { uses: [false, false, false, false] },
};

/** Inventory entries an ability grants: its item, then its pet. */
export function abilityGrantedItems(
  ability: AbilityGrants,
  tagsFor: (key: string) => string[],
): GrantedItem[] {
  return [ability.grantItemKey, ability.grantPetKey]
    .filter((key): key is string => !!key)
    .map((key) => ({ key, tags: tagsFor(key), ...GRANTED_ITEM_EXTRAS[key] }));
}
