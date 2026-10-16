import type { AbilityDraft, ClassDraft, ClassLanguage } from "@/api/classes";

export type AbilityReferenceTableEditorProps = {
  ability: AbilityDraft;
  base: string;
  draft: ClassDraft;
  index: number;
  language: ClassLanguage;
  onChange: (recipe: (ability: AbilityDraft) => AbilityDraft) => void;
  showMissing: (path: string) => boolean;
  touch: (path: string) => void;
};
