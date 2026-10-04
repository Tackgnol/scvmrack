import type { ClassItemType } from "@/api/classes";
import type { ClassItemChange, StepProps } from "../classCreator.models";

export type ItemEditorProps = Omit<StepProps, "update" | "jump"> & {
  index: number;
  /** Shared with the closed card, so opening and closing morph one frame. */
  transitionName: string;
  onChange: ClassItemChange;
  onChangeType: (type: ClassItemType) => void;
  onGoToAbility: (abilityIndex: number) => void;
  onGrantFromNewAbility: () => void;
  onDone: () => void;
  onRemove: () => void;
  onDuplicate: () => void;
  /** At the 20-item cap, Duplicate is off. */
  full: boolean;
};
