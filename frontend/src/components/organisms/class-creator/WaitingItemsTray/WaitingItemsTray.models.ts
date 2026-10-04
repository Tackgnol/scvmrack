import type { ClassDraft, ClassLanguage } from "@/api/classes";

export type WaitingItemsTrayProps = {
  draft: ClassDraft;
  language: ClassLanguage;
  /** Adds an ability named after item `itemIndex` that grants it, and opens it. */
  onGrantFromNewAbility: (itemIndex: number) => void;
};
