import type { AbilityModifierDraft } from "@/api/classes";

export type ModifierListProps = {
  /** Draft path of the list, e.g. `abilities.2.modifiers` or `items.0.weapon.modifiers`. */
  path: string;
  title: string;
  modifiers: AbilityModifierDraft[];
  onChange: (modifiers: AbilityModifierDraft[]) => void;
  focus: (path: string | null) => void;
  /** Where focus goes when the last modifier is removed. */
  focusAfterRemove: string;
};
