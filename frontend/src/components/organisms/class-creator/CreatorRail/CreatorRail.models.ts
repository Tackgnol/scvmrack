import type { CreatorIssue, CreatorStep } from "../classCreator.models";

export type CreatorRailProps = {
  current: CreatorStep;
  issues: CreatorIssue[];
  /** While a blocking message shows, counts step back to ink: one pink interrupt at a time. */
  quiet: boolean;
  /** The class carries no Class Items; that step reads None. */
  noItems: boolean;
  onStep: (step: CreatorStep) => void;
};
