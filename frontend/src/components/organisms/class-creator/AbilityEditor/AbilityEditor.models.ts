import type { AbilityDraft, ClassItemType } from "@/api/classes";
import type { GrantSlot } from "../classCreator.models";
import type { StepProps } from "../classCreator.models";

export type AbilityEditorProps = Omit<StepProps, "update"> & {
  index: number;
  /** Shared with the closed card, so opening and closing morph one frame. */
  transitionName: string;
  randomNumber: number | null;
  onChange: (recipe: (ability: AbilityDraft) => AbilityDraft) => void;
  onZinePaste: (value: string) => void;
  onGrant: (slot: GrantSlot, ref: string | null) => void;
  onForge: (type: ClassItemType) => void;
  onEditItem: (itemIndex: number) => void;
  onDone: () => void;
  /** Removes the ability; with `withItems`, also the Class Items only it grants. */
  onRemove: (withItems: boolean) => void;
  onDuplicate: () => void;
  /** At the 20-ability cap, Duplicate is off. */
  full: boolean;
};
