import type { CreatorIssue, CreatorStep } from "../classCreator.models";

export type CreatorRailProps = {
  current: CreatorStep;
  issues: CreatorIssue[];
  /** While a blocking message shows, counts step back to ink: one pink interrupt at a time. */
  quiet: boolean;
  /** The class carries no Class Items; that step reads None. */
  noItems: boolean;
  noAbilities: boolean;
  /** Steps already left once; problems on unvisited steps read as neutral to-dos until a save is attempted. */
  visited: ReadonlySet<CreatorStep>;
  attempted: boolean;
  onStep: (step: CreatorStep) => void;
};
