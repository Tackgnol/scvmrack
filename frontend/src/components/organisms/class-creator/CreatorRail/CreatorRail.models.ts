import type { CreatorIssue, CreatorStep } from "../classCreator.models";

export type CreatorRailProps = {
  current: CreatorStep;
  issues: CreatorIssue[];
  /** While a blocking message shows, counts step back to ink: one pink interrupt at a time. */
  quiet: boolean;
  onStep: (step: CreatorStep) => void;
};
