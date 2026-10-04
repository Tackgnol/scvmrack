import type { CreatorIssue, StepProps } from "../classCreator.models";

export type ItemsStepProps = StepProps & {
  issues: CreatorIssue[];
  /** The open card, by position; null when all are closed. */
  openItem: number | null;
  onOpenItem: (index: number | null) => void;
};

/** The step's opening question, asked only while the class has no Class Items. */
export type GateAnswer = "unasked" | "yes" | "no";
