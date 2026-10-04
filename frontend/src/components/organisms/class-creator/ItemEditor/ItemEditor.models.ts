import type { ClassItemDraft, ClassItemType } from "@/api/classes";
import type { StepProps } from "../classCreator.models";

export type ItemEditorProps = Omit<StepProps, "update" | "jump"> & {
  index: number;
  /** Shared with the closed card, so opening and closing morph one frame. */
  transitionName: string;
  onChange: (recipe: (item: ClassItemDraft) => ClassItemDraft) => void;
  onChangeType: (type: ClassItemType) => void;
  onGoToAbility: (abilityIndex: number) => void;
  onGrantFromNewAbility: () => void;
  onDone: () => void;
  onRemove: () => void;
  onDuplicate: () => void;
  /** At the 20-item cap, Duplicate is off. */
  full: boolean;
};
