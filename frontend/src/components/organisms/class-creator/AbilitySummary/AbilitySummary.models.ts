import type { AbilityDraft, ClassLanguage } from "@/api/classes";

export type AbilitySummaryProps = {
  id: string;
  /** Shared with the open card, so opening and closing morph one frame. */
  transitionName: string;
  ability: AbilityDraft;
  language: ClassLanguage;
  /** Its number in the random pool, or null when fixed. */
  randomNumber: number | null;
  /** How many of its texts are missing, in any language. */
  missing: number;
  onOpen: () => void;
};
