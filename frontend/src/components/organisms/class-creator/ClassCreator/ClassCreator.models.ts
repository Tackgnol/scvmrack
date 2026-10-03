import type { ClassDraft } from "@/api/classes";

export type ClassCreatorProps = {
  /** The class being edited, or null for a new one. */
  classId: number | null;
  initialDraft: ClassDraft;
};
