import type { ClassDraft, ClassItemDraft, ClassItemType, ClassLanguage } from "@/api/classes";

/** Changes one Class Item while preserving the rest of the draft. */
export type ClassItemChange = (
  recipe: (item: ClassItemDraft) => ClassItemDraft,
) => void;

export type CreatorStep =
  | "identity"
  | "stats"
  | "items"
  | "abilities"
  | "origins"
  | "gettingBetter"
  | "review";

/** Something that blocks saving, with where to fix it. */
export type CreatorIssue = {
  key: string;
  params: Record<string, unknown>;
  step: CreatorStep;
  language?: ClassLanguage;
  /** Draft path of the field to focus, e.g. `origins.2.pl`. */
  path: string;
};
/** An ability's two grant slots: a Class Item, and a pet. */
export type GrantSlot = "grantItem" | "grantPet";

/** What every step body gets from the creator. */
export type StepProps = {
  draft: ClassDraft;
  /** The language being written in. */
  language: ClassLanguage;
  update: (recipe: (draft: ClassDraft) => ClassDraft) => void;
  /** Whether an empty field at `path` should already show as missing. */
  showMissing: (path: string) => boolean;
  touch: (path: string) => void;
  /** Focuses the control at a draft path once the next render has drawn it. */
  focus: (path: string | null) => void;
  /** Goes to a step, opens the card a path points into, and focuses it. */
  jump: (step: CreatorStep, path: string) => void;
};

/** What each Class Item type's field set gets: the item and a way to change its type's fields. */
export type ItemFieldsProps<K extends ClassItemType> = {
  /** Draft path of the item, e.g. `items.2`. */
  path: string;
  item: ClassItemDraft;
  language: ClassLanguage;
  onChange: (fields: ClassItemDraft[K]) => void;
};
