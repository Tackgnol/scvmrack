import { ArmorFields } from "../ArmorFields/ArmorFields";
import { GearFields } from "../GearFields/GearFields";
import { PetFields } from "../PetFields/PetFields";
import { WeaponFields } from "../WeaponFields/WeaponFields";
import type { ItemTypeFieldsProps } from "./ItemTypeFields.models";

/** Renders the field set belonging to the selected Class Item type. */
export function ItemTypeFields({
  path,
  item,
  language,
  onChange,
}: ItemTypeFieldsProps) {
  switch (item.type) {
    case "weapon":
      return (
        <WeaponFields
          path={path}
          item={item}
          language={language}
          onChange={(weapon) => onChange((it) => ({ ...it, weapon }))}
        />
      );
    case "armor":
      return (
        <ArmorFields
          path={path}
          item={item}
          language={language}
          onChange={(armor) => onChange((it) => ({ ...it, armor }))}
        />
      );
    case "gear":
      return (
        <GearFields
          path={path}
          item={item}
          language={language}
          onChange={(gear) => onChange((it) => ({ ...it, gear }))}
        />
      );
    case "pet":
      return (
        <PetFields
          path={path}
          item={item}
          language={language}
          onChange={(pet) => onChange((it) => ({ ...it, pet }))}
        />
      );
  }
}
