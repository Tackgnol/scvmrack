import type { ClassDraft, ClassLanguage } from "@/api/classes";

export type CreatorStep = "identity" | "stats" | "abilities" | "origins" | "gettingBetter" | "review";

/** Something that blocks saving, with where to fix it. */
export type CreatorIssue = {
  key: string;
  params: Record<string, unknown>;
  step: CreatorStep;
  language?: ClassLanguage;
  /** Draft path of the field to focus, e.g. `origins.2.pl`. */
  path: string;
};

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
};
