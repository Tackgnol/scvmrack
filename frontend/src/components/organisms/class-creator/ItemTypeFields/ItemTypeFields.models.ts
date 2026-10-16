import type { ClassItemDraft, ClassLanguage } from "@/api/classes";
import type { ClassItemChange } from "../creatorShared.models";

export type ItemTypeFieldsProps = {
  path: string;
  item: ClassItemDraft;
  language: ClassLanguage;
  onChange: ClassItemChange;
};
