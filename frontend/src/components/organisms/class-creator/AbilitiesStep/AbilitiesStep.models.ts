import type { CreatorIssue, StepProps } from "../classCreator.models";

export type AbilitiesStepProps = StepProps & {
  issues: CreatorIssue[];
  /** The open card, by position; null when all are closed. */
  openAbility: number | null;
  onOpenAbility: (index: number | null) => void;
};
