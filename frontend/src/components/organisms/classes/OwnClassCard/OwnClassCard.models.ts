import type { OwnClassSummary } from "@/api/classes";

export type OwnClassCardProps = {
  cls: OwnClassSummary;
  busy: boolean;
  onRestore: () => void;
  onAppeal: () => void;
  onPublish: () => void;
  onUnpublish: () => void;
  onRemove: () => void;
};
