import type { ClassDraft, ClassLanguage } from "@/api/classes";
import type { CharacterResponse } from "@/hooks/models";
import type { CreatorIssue } from "../classCreator.models";

export type ReviewStepProps = {
  draft: ClassDraft;
  language: ClassLanguage;
  testRoll: {
    scvm: CharacterResponse | null;
    /** The draft changed since this roll. */
    stale: boolean;
    rolling: boolean;
    error: unknown;
    roll: () => void;
  };
  issues: CreatorIssue[];
  onFix: (issue: CreatorIssue) => void;
  saving: boolean;
  /** Set once the current revision is saved. */
  saved: boolean;
  /** Why Save didn't go through, shown as the one pink interrupt. */
  blocked: string | null;
  onSave: () => void;
};
