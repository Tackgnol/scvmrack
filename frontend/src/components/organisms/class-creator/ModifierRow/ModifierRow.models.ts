import type { AbilityModifierDraft } from "@/api/classes";

export type ModifierRowProps = {
  /** Draft path of this modifier, e.g. `abilities.2.modifiers.0`. */
  path: string;
  index: number;
  modifier: AbilityModifierDraft;
  onChange: (modifier: AbilityModifierDraft) => void;
  onRemove: () => void;
};
