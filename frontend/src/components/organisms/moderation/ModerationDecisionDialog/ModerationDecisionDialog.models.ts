import type { ModerationGround } from "@/api/moderation";
import type { ConfirmedDecision } from "../ModerationReportItem/ModerationReportItem.models";

/** A takedown, hide or removal waiting for the moderator to confirm it. */
export type PendingDecision = {
  reportId: string;
  action: ConfirmedDecision;
  className: string;
  version: number;
  /** Preselected from the report's own reason. */
  ground: ModerationGround;
  builtIn: boolean;
};

export type ModerationDecisionDialogProps = {
  decision: PendingDecision | null;
  onClose: () => void;
  onConfirm: (ground: ModerationGround) => void;
};
