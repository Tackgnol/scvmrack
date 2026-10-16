import type { ClassDraft, ClassItemType, ClassLanguage } from "@/api/classes";
import type { GrantSlot } from "../creatorShared.models";

export type AbilityGrantsProps = {
  draft: ClassDraft;
  index: number;
  language: ClassLanguage;
  onGrant: (slot: GrantSlot, ref: string | null) => void;
  /** Forges a new Class Item of `type`, named after the ability, and grants it. */
  onForge: (type: ClassItemType) => void;
  /** Opens the item's card on the Class Items step. */
  onEditItem: (itemIndex: number) => void;
};
