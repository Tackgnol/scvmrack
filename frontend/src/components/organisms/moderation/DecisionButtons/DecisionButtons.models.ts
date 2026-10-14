import type { ConfirmedDecision } from "../ModerationReportItem/ModerationReportItem.models";

export type DecisionButtonsProps = {
  /** An open report is decided; a decided one can only be restored. */
  open: boolean;
  builtIn: boolean;
  disabled: boolean;
  describedBy: string | undefined;
  onDismiss: () => void;
  onRestore: () => void;
  onConfirm: (action: ConfirmedDecision) => void;
};
