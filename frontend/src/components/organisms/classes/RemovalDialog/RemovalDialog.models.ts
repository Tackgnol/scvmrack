export type RemovalTarget = { kind: "draft" | "class"; id: number; name: string };

export type RemovalDialogProps = {
  target: RemovalTarget | null;
  onClose: () => void;
};
