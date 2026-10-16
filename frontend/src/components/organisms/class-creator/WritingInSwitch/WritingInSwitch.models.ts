import type { ClassLanguage } from "@/api/classes";
import type { CreatorIssue, CreatorStep } from "../creatorShared.models";

export type WritingInSwitchProps = {
  languages: ClassLanguage[];
  value: ClassLanguage;
  step: CreatorStep;
  issues: CreatorIssue[];
  quiet: boolean;
  onChange: (language: ClassLanguage) => void;
};
