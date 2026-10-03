import type { ClassLanguage } from "@/api/classes";
import type { CreatorIssue, CreatorStep } from "../classCreator.models";

export type WritingInSwitchProps = {
  languages: ClassLanguage[];
  value: ClassLanguage;
  step: CreatorStep;
  issues: CreatorIssue[];
  quiet: boolean;
  onChange: (language: ClassLanguage) => void;
};
