export type PublishDialogProps = {
  /** The class being published; null keeps the dialog closed. */
  target: { id: number; name: string } | null;
  onClose: () => void;
};
