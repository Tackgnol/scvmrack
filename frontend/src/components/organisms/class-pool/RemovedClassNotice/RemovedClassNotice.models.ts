import type { RemovedPoolClass } from "@/api/classPool";

export type RemovedClassNoticeProps = {
  removed: RemovedPoolClass;
  onDismiss: (removed: RemovedPoolClass) => void;
};
