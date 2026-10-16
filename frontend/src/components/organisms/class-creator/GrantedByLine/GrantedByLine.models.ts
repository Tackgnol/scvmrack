import type { ClassDraft, ClassItemDraft, ClassLanguage } from "@/api/classes";

export type GrantedByLineProps = {
  draft: ClassDraft;
  item: ClassItemDraft;
  /** Draft path of the item, so its "Grant from a new ability" button can be focused. */
  path: string;
  language: ClassLanguage;
  onGoToAbility: (abilityIndex: number) => void;
  onGrantFromNewAbility: () => void;
};
