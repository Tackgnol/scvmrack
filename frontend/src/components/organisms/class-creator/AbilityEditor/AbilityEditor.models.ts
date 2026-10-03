import type { AbilityDraft } from "@/api/classes";
import type { StepProps } from "../classCreator.models";

export type AbilityEditorProps = Omit<StepProps, "update"> & {
  index: number;
  /** Shared with the closed card, so opening and closing morph one frame. */
  transitionName: string;
  randomNumber: number | null;
  onChange: (recipe: (ability: AbilityDraft) => AbilityDraft) => void;
  onDone: () => void;
  onRemove: () => void;
  onDuplicate: () => void;
  /** At the 20-ability cap, Duplicate is off. */
  full: boolean;
};
