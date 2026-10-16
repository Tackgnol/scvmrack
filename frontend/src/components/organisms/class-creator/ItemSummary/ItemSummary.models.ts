import type { ClassItemDraft, ClassLanguage } from "@/api/classes";

export type ItemSummaryProps = {
  id: string;
  /** Shared with the open card, so opening and closing morph one frame. */
  transitionName: string;
  item: ClassItemDraft;
  language: ClassLanguage;
  /** The granting ability's name, or null while the item waits for one. */
  grantedBy: string | null;
  missing: number;
  onOpen: () => void;
};
