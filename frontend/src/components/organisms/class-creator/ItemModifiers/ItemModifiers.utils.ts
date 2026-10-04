import type { ClassItemDraft } from "@/api/classes";
import type { TFunction } from "i18next";
import type { ClassItemChange } from "../classCreator.models";
import type { ItemModifierState } from "./ItemModifiers.models";

/** Returns the active modifier list and the way to update it for an item. */
export function itemModifierState(
  item: ClassItemDraft,
  path: string,
  t: TFunction,
  onChange: ClassItemChange,
): ItemModifierState | null {
  switch (item.type) {
    case "weapon":
      return {
        list: item.weapon.modifiers,
        path: `${path}.weapon.modifiers`,
        title: t("creator.items.whileWielded", "Modifiers while wielded"),
        set: (modifiers) =>
          onChange((it) => ({ ...it, weapon: { ...it.weapon, modifiers } })),
      };
    case "armor":
      return {
        list: item.armor.modifiers,
        path: `${path}.armor.modifiers`,
        title: t("creator.items.whileWorn", "Modifiers while worn"),
        set: (modifiers) =>
          onChange((it) => ({ ...it, armor: { ...it.armor, modifiers } })),
      };
    case "gear":
      return {
        list: item.gear.statuses,
        path: `${path}.gear.statuses`,
        title: t("creator.items.temporaryStatuses", "Temporary status effects"),
        set: (statuses) =>
          onChange((it) => ({ ...it, gear: { ...it.gear, statuses } })),
      };
    case "pet":
      return item.pet.action === "buff"
        ? {
            list: item.pet.buffs,
            path: `${path}.pet.buffs`,
            title: t("creator.items.buffsGiven", "Buffs it gives"),
            set: (buffs) =>
              onChange((it) => ({ ...it, pet: { ...it.pet, buffs } })),
          }
        : null;
  }
}
