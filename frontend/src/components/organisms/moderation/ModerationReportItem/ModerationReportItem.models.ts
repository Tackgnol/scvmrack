import type { AdminModerationReport } from "@/api/moderation";

/** A decision the moderator confirms in a dialog before it is made. */
export type ConfirmedDecision = "takeDown" | "removeContent";

export type ModerationReportItemProps = {
  report: AdminModerationReport;
  /** The first report on its class version shows the version heading. */
  showHeading: boolean;
  /** A Built-in Class has no owner and no user-written content to remove; it can only be hidden. */
  builtIn: boolean;
  reason: string;
  onReasonChange: (reason: string) => void;
  pending: boolean;
  onDismiss: () => void;
  onRestore: () => void;
  onConfirm: (action: ConfirmedDecision) => void;
};
