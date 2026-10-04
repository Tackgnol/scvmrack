import type { AbilityModifierDraft, ClassItemDraft } from "@/api/classes";
import type { ClassItemChange, StepProps } from "../classCreator.models";

export type ItemModifierState = {
  list: AbilityModifierDraft[];
  path: string;
  title: string;
  set: (list: AbilityModifierDraft[]) => void;
};

export type ItemModifiersProps = {
  path: string;
  item: ClassItemDraft;
  focus: StepProps["focus"];
  onChange: ClassItemChange;
};
