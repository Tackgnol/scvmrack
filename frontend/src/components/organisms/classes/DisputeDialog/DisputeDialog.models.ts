export type DisputeDialogProps = {
  /** The taken-down class being disputed; null keeps the dialog closed. */
  classId: number | null;
  onClose: () => void;
};
